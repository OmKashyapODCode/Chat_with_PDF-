import { randomUUID } from 'crypto';
import amqplib from 'amqplib';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { embeddingsModel } from './config/gemini.js';
import qdrantClient from './config/qdrant.js';
import { QUEUE_NAME } from './config/queue.js';

const COLLECTION_NAME = 'langchainjs-testing';
const BATCH_SIZE = 50; // Gemini embedding API limit

// ── Connect to CloudAMQP ─────────────────────────────────────────────────────
const connection = await amqplib.connect(process.env.CLOUDAMQP_URL);
const channel = await connection.createChannel();
await channel.assertQueue(QUEUE_NAME, { durable: true });
channel.prefetch(1); // Process one job at a time

console.log('[Worker] Started, waiting for jobs...');

// ── Job Processor ─────────────────────────────────────────────────────────────
channel.consume(QUEUE_NAME, async (msg) => {
  if (msg === null) return;

  const data = JSON.parse(msg.content.toString());
  const { filename, documentId } = data;

  console.log(`[Worker] Processing job: ${filename} (documentId: ${documentId})`);

  try {
    // ── Step 1: Decode PDF from the queue message ─────────────────────────────
    // The upload controller encodes req.file.buffer as base64 into the queue
    // message, so the worker never needs to fetch from Cloudinary's CDN.
    const pdfBuffer = Buffer.from(data.pdfBase64, 'base64');
    console.log(`[Worker] PDF decoded from queue (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    // ── Step 2: Load PDF from buffer using a Blob ─────────────────────────────
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const loader = new PDFLoader(pdfBlob);
    const docs = await loader.load();

    // ── Step 3: Chunk the document ────────────────────────────────────────────
    const splitter = new CharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    let splitDocs = await splitter.splitDocuments(docs);

    // Filter empty chunks (Gemini returns empty vectors for whitespace-only text)
    splitDocs = splitDocs.filter(
      (doc) => doc.pageContent && doc.pageContent.trim().length > 0
    );

    console.log(`[Worker] ${splitDocs.length} chunks created from ${filename}`);

    // ── Step 4: Inject documentId, filename, page, chunkId into every chunk ──
    // This is the key step: every Qdrant point will carry these payload fields,
    // allowing later similarity searches to be filtered by documentId.
    splitDocs = splitDocs.map((doc) => {
      // PDFLoader stores page number in metadata.loc.pageNumber (1-indexed)
      const page =
        doc.metadata?.loc?.pageNumber ??
        doc.metadata?.page ??
        null;

      return {
        ...doc,
        metadata: {
          ...doc.metadata,      // preserve existing PDFLoader metadata
          documentId,           // ← unique per uploaded PDF
          filename,             // ← original filename
          page,                 // ← page number (null if unavailable)
          chunkId: randomUUID(), // ← unique per chunk
        },
      };
    });

    // ── Step 5: Embed and store in Qdrant in batches ─────────────────────────
    const vectorStore = new QdrantVectorStore(embeddingsModel, {
      client: qdrantClient,
      collectionName: COLLECTION_NAME,
    });

    for (let i = 0; i < splitDocs.length; i += BATCH_SIZE) {
      const batch = splitDocs.slice(i, i + BATCH_SIZE);
      await vectorStore.addDocuments(batch);
      console.log(`[Worker] Batch ${Math.floor(i / BATCH_SIZE) + 1} stored (${batch.length} chunks)`);
    }

    console.log(`[Worker] ✅ Done: ${filename} (documentId: ${documentId})`);
    channel.ack(msg);
  } catch (err) {
    console.error(`[Worker] ❌ Error processing ${filename}:`, err.message);
    // Ack even on failure to avoid infinite retry loops
    channel.ack(msg);
  }
});
