import amqplib from 'amqplib';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { embeddingsModel } from './config/gemini.js';
import qdrantClient from './config/qdrant.js';
import { QUEUE_NAME } from './config/queue.js';
import { Readable } from 'stream';

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
  console.log(`[Worker] Processing job: ${data.filename}`);

  try {
    // ── Step 1: Download PDF from Cloudinary ─────────────────────────────────
    const response = await fetch(data.cloudinaryUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from Cloudinary: ${response.statusText}`);
    }
    const pdfBuffer = Buffer.from(await response.arrayBuffer());

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

    console.log(`[Worker] ${splitDocs.length} chunks created from ${data.filename}`);

    // ── Step 4: Embed and store in Qdrant in batches ─────────────────────────
    const vectorStore = new QdrantVectorStore(embeddingsModel, {
      client: qdrantClient,
      collectionName: COLLECTION_NAME,
    });

    for (let i = 0; i < splitDocs.length; i += BATCH_SIZE) {
      const batch = splitDocs.slice(i, i + BATCH_SIZE);
      await vectorStore.addDocuments(batch);
      console.log(`[Worker] Batch ${Math.floor(i / BATCH_SIZE) + 1} stored (${batch.length} chunks)`);
    }

    console.log(`[Worker] ✅ Done: ${data.filename}`);
    channel.ack(msg);
  } catch (err) {
    console.error(`[Worker] ❌ Error processing ${data.filename}:`, err.message);
    // Ack even on failure to avoid infinite retry loops
    channel.ack(msg);
  }
});
