import { chatModel, embeddingsModel } from '../config/gemini.js';
import qdrantClient from '../config/qdrant.js';

const COLLECTION_NAME = 'langchainjs-testing';

/**
 * POST /chat
 * Body: { message: string, sessionId: string, filename?: string }
 *
 * Flow:
 *   1. Embed the user's question using Gemini
 *   2. Search Qdrant for top 4 most relevant chunks (filtered by sessionId)
 *   3. Build a context block from those chunks
 *   4. Send context + question to Gemini LLM
 *   5. Return the answer + citations (which page each chunk came from)
 */
export async function chat(req, res) {
  try {
    const userQuery  = String(req.body?.message   || '').trim();
    const sessionId  = String(req.body?.sessionId || '').trim();
    const filename   = String(req.body?.filename  || 'the uploaded PDF').trim();

    if (!userQuery)  return res.status(400).json({ error: 'message is required.' });
    if (!sessionId)  return res.status(400).json({ error: 'sessionId is required. Please upload a PDF first.' });

    // ── Step 1: Embed the user's question ────────────────────────────────────
    const queryVector = await embeddingsModel.embedQuery(userQuery);

    // ── Step 2: Search Qdrant ─────────────────────────────────────────────────
    // Filter by sessionId so we only get chunks from the current user's PDF.
    // limit: 4 means we get the top 4 most semantically similar chunks.
    const searchResults = await qdrantClient.query(COLLECTION_NAME, {
      query: queryVector,
      limit: 4,
      with_payload: true,
      filter: {
        must: [
          {
            key: 'metadata.sessionId',
            match: { value: sessionId },
          },
        ],
      },
    });

    const points = searchResults.points || [];

    console.log(`[Chat] sessionId=${sessionId} | query="${userQuery}" | chunks found: ${points.length}`);

    if (points.length === 0) {
      return res.json({
        message:
          "I couldn't find relevant information in the uploaded PDF for your question. " +
          'The document may still be processing, or this topic may not be covered in it.',
        citations: [],
      });
    }

    // ── Step 3: Build citations (source info shown to user) ───────────────────
    const citations = points.map((result, i) => {
      const meta = result.payload?.metadata ?? {};
      return {
        index:     i + 1,
        filename:  meta.filename  ?? filename,
        page:      meta.page      ?? null,
        chunkId:   meta.chunkId   ?? null,
      };
    });

    // ── Step 4: Build the context block sent to Gemini ────────────────────────
    // We take the text of each top-4 chunk and label it for the LLM.
    const contextBlock = points
      .map((result, i) => {
        const meta = result.payload?.metadata ?? {};
        // LangChain stores chunk text in payload.content or payload.pageContent
        const text =
          result.payload?.content ??
          result.payload?.page_content ??
          result.payload?.pageContent ??
          result.payload?.text ??
          '';
        const page = meta.page ?? '?';
        return `[Chunk ${i + 1} — ${meta.filename ?? filename}, Page ${page}]:\n${text}`;
      })
      .join('\n\n');

    // ── Step 5: Call Gemini LLM ───────────────────────────────────────────────
    const SYSTEM_PROMPT = `You are a helpful AI assistant that answers questions based on the PDF "${filename}".
Answer clearly and honestly using only the context below.
If the answer is not in the context, say so — do NOT make things up.

Context from "${filename}":
${contextBlock}
`;

    const chatResult = await chatModel.invoke([
      ['system', SYSTEM_PROMPT],
      ['human', userQuery],
    ]);

    return res.json({
      message: chatResult.content,
      citations,
    });

  } catch (err) {
    console.error('[Chat Error]', err.message);
    console.error('[Chat Stack]', err.stack);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
