import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

export const chatModel = new ChatGoogleGenerativeAI({
  model: 'gemini-3.5-flash',
  apiKey: process.env.GOOGLE_API_KEY,
});

export const embeddingsModel = new GoogleGenerativeAIEmbeddings({
  model: 'gemini-embedding-2',
  apiKey: process.env.GOOGLE_API_KEY,
});
