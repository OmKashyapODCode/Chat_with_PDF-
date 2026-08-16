import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/uploadRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { connectQueue } from './config/queue.js';

const app = express();
const PORT = process.env.PORT || 8000;

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*', // Set CORS_ORIGIN to your Vercel URL in production
    methods: ['GET', 'POST'],
  })
);
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'Server is running!' }));
app.use('/upload', uploadRoutes);
app.use('/chat', chatRoutes);

// ── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
  // Establish RabbitMQ connection before accepting requests
  await connectQueue();
  console.log('[Queue] Connected to CloudAMQP');

  // Start Background Worker in the same process (Free Tier workaround)
  import('./worker.js').catch((err) => {
    console.error('[Worker] Failed to start worker:', err.message);
  });

  app.listen(PORT, () => {
    console.log(`[Server] Running on PORT: ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err.message);
  process.exit(1);
});
