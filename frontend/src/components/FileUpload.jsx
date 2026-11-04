import { useState } from 'react';
import api from '../api/axios';

/**
 * FileUpload component
 *
 * Props:
 *   onDocumentReady(doc) — called when PDF is uploaded and processed.
 *                          doc = { sessionId, filename }
 *   currentSession       — the current active session (to delete old chunks on re-upload)
 */
function FileUpload({ onDocumentReady, currentSession }) {
  // 'idle' | 'uploading' | 'done'
  const [status, setStatus] = useState('idle');
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');

  function handleClick() {
    // Reset error on new click
    setError('');

    // Create a hidden file input and click it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Basic client-side check — just PDF type
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file.');
        return;
      }

      setFilename(file.name);
      setStatus('uploading');

      try {
        // Build multipart form data
        const formData = new FormData();
        formData.append('pdf', file);

        // If there's already an active session, tell the server to delete old chunks
        if (currentSession?.sessionId) {
          formData.append('oldSessionId', currentSession.sessionId);
        }

        // POST to backend — this call takes a few seconds (parsing + embedding)
        const res = await api.post('/upload/pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // Tell parent component about the new document
        onDocumentReady({
          sessionId: res.data.sessionId,
          filename: res.data.filename || file.name,
        });

        setStatus('done');
      } catch (err) {
        const msg = err.response?.data?.error || 'Upload failed. Please try again.';
        setError(msg);
        setStatus('idle');
      }
    });

    input.click();
  }

  return (
    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 transition-colors">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Upload PDF</h2>

      {/* How it works steps */}
      <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
        <li>Upload any PDF (up to 50MB)</li>
        <li>Server splits it into chunks and embeds them</li>
        <li>Ask questions — it finds the relevant chunks and answers</li>
      </ol>

      {/* Upload button area */}
      <div
        onClick={status === 'uploading' ? undefined : handleClick}
        className={`
          border-2 border-dashed rounded p-6 text-center transition-colors
          ${status === 'uploading' ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-900/50' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'}
          ${status === 'done' ? 'border-green-400 dark:border-green-500' : 'border-gray-300 dark:border-gray-600'}
          ${error ? 'border-red-400 dark:border-red-500' : ''}
        `}
      >
        {status === 'idle' && (
          <div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Click to select a PDF</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Max size: 50MB</p>
          </div>
        )}

        {status === 'uploading' && (
          <div>
            <p className="text-blue-600 dark:text-blue-400 text-sm">Processing {filename}...</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Splitting into chunks and embedding. Please wait.
            </p>
          </div>
        )}

        {status === 'done' && (
          <div>
            <p className="text-green-600 dark:text-green-400 text-sm font-medium">✓ Ready to chat!</p>
            <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 truncate">{filename}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStatus('idle');
                setFilename('');
              }}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 underline"
            >
              Upload a different file
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export default FileUpload;
