import multer from 'multer';

// Store the uploaded file in memory (as a Buffer).
// We process it directly on the server — no Cloudinary needed.
const storage = multer.memoryStorage();

// Only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // 50MB server-side protection limit.
    // This is NOT a document quality limit — it's just to protect server memory.
    // The PDF will be chunked into small pieces regardless of its total size.
    fileSize: 50 * 1024 * 1024,
  },
});

export default upload;
