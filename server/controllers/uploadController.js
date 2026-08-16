import { randomUUID } from 'crypto';
import cloudinary from '../config/cloudinary.js';
import { publishToQueue } from '../config/queue.js';

/**
 * POST /upload/pdf
 * Accepts a PDF via multipart form, uploads to Cloudinary,
 * generates a unique documentId, then queues a job for the worker.
 *
 * The documentId is returned to the frontend so it can scope all
 * subsequent chat requests to ONLY this document's Qdrant chunks.
 */
export async function uploadPdf(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided.' });
    }

    // Generate a unique, stable identifier for this specific PDF upload.
    // This ID will be stored in EVERY Qdrant chunk belonging to this PDF.
    const documentId = randomUUID();

    // Upload the buffer directly to Cloudinary as a raw file
    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'pdf-chat',
          resource_type: 'raw',          // PDFs are "raw" in Cloudinary
          format: 'pdf',
          public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Queue a job for the background worker.
    // The PDF buffer (already in memory from multer) is base64-encoded and sent
    // directly in the queue message — the worker processes it without needing to
    // download from Cloudinary's CDN (which can fail due to account-level restrictions).
    await publishToQueue({
      filename: req.file.originalname,
      pdfBase64: req.file.buffer.toString('base64'), // ← PDF content, no download needed
      cloudinaryPublicId: cloudinaryResult.public_id, // kept for reference/deletion
      documentId,                                     // ← unique identifier for this upload
    });

    console.log(
      `[Upload] Queued: ${req.file.originalname} (documentId: ${documentId}) -> ${cloudinaryResult.secure_url}`
    );

    return res.json({
      message: 'PDF uploaded and queued for processing.',
      filename: req.file.originalname,
      url: cloudinaryResult.secure_url,
      documentId,                         // ← returned to frontend for use in chat
    });
  } catch (err) {
    console.error('[Upload Error]', err.message);
    return res.status(500).json({ error: 'Failed to upload PDF. Please try again.' });
  }
}
