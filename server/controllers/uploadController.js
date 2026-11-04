import { randomUUID } from 'crypto';
import { Blob } from 'buffer';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { QdrantVectorStore } from '@langchain/qdrant';
import { embeddingsModel } from '../config/gemini.js';
import qdrantClient from '../config/qdrant.js';

const COLLECTION_NAME = 'langchainjs-testing';
const BATCH_SIZE = 50; // Gemini embedding API allows max 50 texts per request

/**
 * DELETE old session's chunks from Qdrant.
 * Called before storing a new PDF so we don't pile up old data.
 */
async function deleteOldSession(oldSessionId) {
  if (!oldSessionId) return;
  try {
    await qdrantClient.delete(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'metadata.sessionId',
            match: { value: oldSessionId },
          },
        ],
      },
    });
    console.log(`[Upload] Deleted old chunks for sessionId: ${oldSessionId}`);
  } catch (err) {
    // Not a fatal error — old chunks will just stay until next cleanup
    console.warn('[Upload] Could not delete old session chunks:', err.message);
  }
}

/**
 * POST /upload/pdf
 *
 * Steps:
 * 1. Receive PDF buffer from multer (in memory, up to 50MB)
 * 2. If client sends oldSessionId, delete those old Qdrant chunks first
 * 3. Parse PDF → split into chunks → embed → store in Qdrant
 * 4. Return sessionId to the frontend (used to scope all future chat queries)
 *
 * No Cloudinary, no RabbitMQ queue — everything is done right here, inline.
 * User waits on this request until chunks are stored, then can start chatting.
 */
export async function uploadPdf(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided.' });
    }

    // A unique ID for this upload session.
    // Every Qdrant chunk from this PDF will be tagged with this sessionId.
    const sessionId = randomUUID();

    // If the user is uploading a new PDF, delete the old session's chunks
    const oldSessionId = req.body?.oldSessionId || null;
    await deleteOldSession(oldSessionId);

    console.log(`[Upload] Processing: ${req.file.originalname} (${(req.file.buffer.length / 1024).toFixed(1)} KB)`);

    // ── Step 1: Parse the PDF from the in-memory buffer ──────────────────────
    const pdfBlob = new Blob([req.file.buffer], { type: 'application/pdf' });
    const loader = new PDFLoader(pdfBlob);
    const docs = await loader.load();

    console.log(`[Upload] PDF parsed — ${docs.length} pages found`);

    // ── Step 2: Split into chunks ─────────────────────────────────────────────
    // chunkSize=1000 chars, overlap=200 chars so chunks share context at borders.
    // This keeps each chunk small enough to fit in Gemini's context window
    // while still carrying useful surrounding text.
    const splitter = new CharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    let chunks = await splitter.splitDocuments(docs);

    // Remove empty/whitespace-only chunks (Gemini returns bad vectors for them)
    chunks = chunks.filter((doc) => doc.pageContent && doc.pageContent.trim().length > 0);

    console.log(`[Upload] ${chunks.length} chunks created`);

    // ── Step 3: Attach sessionId + filename + page number to every chunk ──────
    // This metadata is stored in Qdrant alongside each chunk's vector.
    // Later, the chat controller filters by sessionId to get ONLY this PDF's chunks.
    chunks = chunks.map((doc) => {
      const page = doc.metadata?.loc?.pageNumber ?? doc.metadata?.page ?? null;
      return {
        ...doc,
        metadata: {
          ...doc.metadata,
          sessionId,                    // ← scopes this chunk to this upload session
          filename: req.file.originalname,
          page,
          chunkId: randomUUID(),        // ← unique ID per chunk (for citations)
        },
      };
    });

    // ── Step 4: Embed and store in Qdrant (in batches of 50) ─────────────────
    // We batch because Gemini's embedding API has a limit of 50 texts per call.
    const vectorStore = new QdrantVectorStore(embeddingsModel, {
      client: qdrantClient,
      collectionName: COLLECTION_NAME,
    });

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      await vectorStore.addDocuments(batch);
      console.log(`[Upload] Batch ${Math.floor(i / BATCH_SIZE) + 1} stored (${batch.length} chunks)`);
    }

    console.log(`[Upload] ✅ Done: ${req.file.originalname} → sessionId: ${sessionId}`);

    return res.json({
      message: 'PDF processed and ready for chat.',
      filename: req.file.originalname,
      sessionId, // ← frontend stores this and sends it with every chat request
    });

  } catch (err) {
    console.error('[Upload Error]', err.message);
    console.error('[Upload Stack]', err.stack);
    return res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
}
