import { Router } from 'express';
import { chat } from '../controllers/chatController.js';

const router = Router();

// GET /chat?message=<query>
router.get('/', chat);

export default router;
