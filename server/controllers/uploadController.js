import cloudinary from '../config/cloudinary.js';
import { publishToQueue } from '../config/queue.js';

/**
 * POST /upload/pdf
 * Accepts a PDF via multipart form, uploads to Cloudinary,
 * then queues a job for the worker to embed it.
 */
export async function uploadPdf(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided.' });
    }

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

    // Queue a job for the background worker
    await publishToQueue({
      filename: req.file.originalname,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
    });

    console.log(`[Upload] Queued: ${req.file.originalname} -> ${cloudinaryResult.secure_url}`);

    return res.json({
      message: 'PDF uploaded and queued for processing.',
      filename: req.file.originalname,
      url: cloudinaryResult.secure_url,
    });
  } catch (err) {
    console.error('[Upload Error]', err.message);
    return res.status(500).json({ error: 'Failed to upload PDF. Please try again.' });
  }
}
