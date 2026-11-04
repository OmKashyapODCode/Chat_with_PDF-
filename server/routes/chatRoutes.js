import { Router } from 'express';
import { chat } from '../controllers/chatController.js';

const router = Router();

// POST /chat
// Body: { message: string, documentId: string, filename?: string }
// Changed from GET to POST so documentId can be sent in the request body.
router.post('/', chat);

export default router;
