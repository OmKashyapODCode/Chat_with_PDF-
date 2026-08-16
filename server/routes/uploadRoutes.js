import { Router } from 'express';
import upload from '../middlewares/upload.js';
import { uploadPdf } from '../controllers/uploadController.js';

const router = Router();

// POST /upload/pdf
router.post('/pdf', upload.single('pdf'), uploadPdf);

export default router;
