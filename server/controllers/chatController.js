import { chatModel, embeddingsModel } from '../config/gemini.js';
import qdrantClient from '../config/qdrant.js';

const COLLECTION_NAME = 'langchainjs-testing';

/**
 * POST /chat
 * Body: { message: string, documentId: string, filename?: string }
 *
 * Architecture:
 *   User query
 *     → Gemini embedQuery()        (embed the question)
 *     → qdrantClient.query()       (vector search, filtered by documentId)
 *     → relevant chunks            (only from the current PDF)
 *     → Gemini chatModel.invoke()  (answer grounded in context)
 *     → response + citations
 *
 * Note: @qdrant/js-client-rest v1.19+ uses .query() not .search()
 */
export async function chat(req, res) {
  try {
    const userQuery  = String(req.body?.message    || '').trim();
    const documentId = String(req.body?.documentId || '').trim();
    const filename   = String(req.body?.filename   || 'the uploaded PDF').trim();

    if (!userQuery)   return res.status(400).json({ error: 'message is required.' });
    if (!documentId)  return res.status(400).json({ error: 'documentId is required. Please upload a PDF first.' });

    // ── Step 1: Embed the user query with Gemini ──────────────────────────
    const queryVector = await embeddingsModel.embedQuery(userQuery);

    // ── Step 2: Search Qdrant using the query API with documentId filter ──
    // .query() is the correct method in @qdrant/js-client-rest v1.19+
    // The filter ensures ONLY chunks from the current PDF are retrieved.
    const searchResults = await qdrantClient.query(COLLECTION_NAME, {
      query: queryVector,          // nearest-neighbor search using our embedding
      limit: 4,
      with_payload: true,
      filter: {
        must: [
          {
            key: 'metadata.documentId',  // dot-notation for nested Qdrant payload field
            match: { value: documentId },
          },
        ],
      },
    });

    const points = searchResults.points || [];

    console.log(
      `[Chat] documentId=${documentId} | query="${userQuery}" | chunks=${points.length}`
    );

    // ── Step 3: Build structured citations ────────────────────────────────
    const citations = points.map((result, i) => {
      const meta = result.payload?.metadata ?? {};
      return {
        index:      i + 1,
        documentId: meta.documentId ?? documentId,
        filename:   meta.filename   ?? filename,
        page:       meta.page       ?? null,
        chunkId:    meta.chunkId    ?? null,
      };
    });

    if (points.length === 0) {
      return res.json({
        message:
          "I couldn't find relevant information in the current PDF for your question. " +
          'The document may still be processing, or this topic may not be covered in it.',
        citations: [],
      });
    }

    // ── Step 4: Build context block ───────────────────────────────────────
    const contextBlock = points
      .map((result, i) => {
        const meta = result.payload?.metadata ?? {};
        // QdrantVectorStore uses result.payload.content to store the chunk text.
        const text = result.payload?.content
                  ?? result.payload?.page_content
                  ?? result.payload?.pageContent
                  ?? result.payload?.text
                  ?? '';
        const page = meta.page ?? '?';
        return `[Chunk ${i + 1} — ${meta.filename ?? filename}, Page ${page}]:\n${text}`;
      })
      .join('\n\n');

    const SYSTEM_PROMPT = `You are a helpful AI assistant that answers user questions based on content extracted from the PDF "${filename}".
Answer in clear, well-formatted Markdown. Use bullet points, bold text, and headings where appropriate.
If the answer is not in the context below, say so honestly — do NOT make something up.

Context from "${filename}":
${contextBlock}
`;

    // ── Step 5: Call Gemini LLM ───────────────────────────────────────────
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
