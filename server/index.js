import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/uploadRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Allow frontend origins — read from .env, fallback to allow all
const rawOrigins = process.env.CORS_ORIGIN;
const corsOrigin = rawOrigins ? rawOrigins.split(',').map((o) => o.trim()) : '*';

app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'Server is running!' }));
app.use('/upload', uploadRoutes);
app.use('/chat', chatRoutes);

// ── Ensure Qdrant Index on Startup ───────────────────────────────────────────
import qdrantClient from './config/qdrant.js';

async function initIndexes() {
  try {
    await qdrantClient.createPayloadIndex('langchainjs-testing', {
      field_name: 'metadata.sessionId',
      field_schema: 'keyword',
    });
  } catch (err) {
    // Index already exists or similar, safe to ignore
  }
}
initIndexes();

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Running on PORT: ${PORT}`);
});
