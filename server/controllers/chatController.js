import { QdrantVectorStore } from '@langchain/qdrant';
import { chatModel, embeddingsModel } from '../config/gemini.js';
import qdrantClient from '../config/qdrant.js';

const COLLECTION_NAME = 'langchainjs-testing';

/**
 * GET /chat?message=<user question>
 * Retrieves relevant document chunks from Qdrant and
 * asks Gemini to answer the query using that context.
 */
export async function chat(req, res) {
  try {
    const userQuery = String(req.query.message || '').trim();

    if (!userQuery) {
      return res.status(400).json({ error: 'Message query parameter is required.' });
    }

    // Connect to existing Qdrant collection
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddingsModel, {
      client: qdrantClient,
      collectionName: COLLECTION_NAME,
    });

    // Retrieve the top 3 most relevant chunks
    const retriever = vectorStore.asRetriever({ k: 3 });
    const relevantDocs = await retriever.invoke(userQuery);

    // Build system prompt with context
    const SYSTEM_PROMPT = `You are a helpful AI assistant that answers user questions based on the context extracted from a PDF document.
Always answer in clear, well-formatted Markdown. Use bullet points, bold text, and headings where appropriate.
If the answer is not found in the context, say so honestly instead of making something up.

Context from PDF:
${relevantDocs.map((doc, i) => `[Chunk ${i + 1}]:\n${doc.pageContent}`).join('\n\n')}
`;

    const chatResult = await chatModel.invoke([
      ['system', SYSTEM_PROMPT],
      ['human', userQuery],
    ]);

    return res.json({
      message: chatResult.content,
      docs: relevantDocs,
    });
  } catch (err) {
    console.error('[Chat Error]', err.message);
    return res.status(500).json({ error: 'Failed to process your query. Please try again.' });
  }
}
