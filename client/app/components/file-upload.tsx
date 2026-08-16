'use client';
import * as React from 'react';
import { Upload, CheckCircle, Loader2, FileText, MessageSquareText, Zap, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileUploadComponent: React.FC = () => {
  const [status, setStatus] = React.useState<'idle' | 'uploading' | 'done'>('idle');
  const [fileName, setFileName] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  const handleFileUploadButtonClick = () => {
    setError('');
    const el = document.createElement('input');
    el.setAttribute('type', 'file');
    el.setAttribute('accept', 'application/pdf');
    el.addEventListener('change', async () => {
      if (el.files && el.files.length > 0) {
        const file = el.files.item(0);
        if (file) {
          if (file.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.');
            return;
          }
          if (file.size > MAX_FILE_SIZE_BYTES) {
            setError(`File is too large! Maximum size allowed is ${MAX_FILE_SIZE_MB}MB.`);
            return;
          }

          setFileName(file.name);
          setStatus('uploading');
          const formData = new FormData();
          formData.append('pdf', file);

          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/pdf`, {
              method: 'POST',
              body: formData,
            });
            if (!res.ok) throw new Error('Upload failed');
            console.log('File uploaded');
            setStatus('done');
          } catch {
            setError('Server error while uploading. Please try again.');
            setStatus('idle');
          }
        }
      }
    });
    el.click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Instructions Section */}
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-bold mb-2 text-white">How it works</h2>
        <p className="text-slate-400 text-sm mb-6">Chat with your PDF instantly using Gemini AI.</p>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400 mt-1">
              <Upload size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">1. Upload Document</h4>
              <p className="text-xs text-slate-400">Select any PDF file up to {MAX_FILE_SIZE_MB}MB.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-purple-600/20 p-2 rounded-lg text-purple-400 mt-1">
              <Zap size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">2. AI Processing</h4>
              <p className="text-xs text-slate-400">Gemini splits & embeds your document for context.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-green-600/20 p-2 rounded-lg text-green-400 mt-1">
              <MessageSquareText size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">3. Start Chatting</h4>
              <p className="text-xs text-slate-400">Ask questions and get instant, cited answers!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div 
        onClick={status === 'uploading' ? undefined : handleFileUploadButtonClick}
        className={`w-full relative overflow-hidden transition-all duration-200 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 
          ${error ? 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10' : 
            status === 'uploading' ? 'border-slate-700 bg-slate-900/50 cursor-not-allowed' : 
            status === 'done' ? 'border-green-500/50 bg-green-500/5' : 
            'border-slate-700 hover:border-blue-500/50 bg-slate-900/50 hover:bg-slate-800/50 cursor-pointer shadow-lg'
          }`}
      >
        {status === 'idle' && (
          <div className="flex flex-col items-center text-center gap-3">
            <div className={`p-4 rounded-full ${error ? 'bg-red-500/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
              <FileText size={32} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Click to upload PDF</h3>
              <p className="text-xs text-slate-500 mt-1">Max file size: {MAX_FILE_SIZE_MB}MB</p>
            </div>
          </div>
        )}
        
        {status === 'uploading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-300">Uploading & processing...</p>
          </div>
        )}
        
        {status === 'done' && (
          <div className="flex flex-col items-center gap-2 text-center">
            <CheckCircle size={32} className="text-green-500 mb-1" />
            <p className="text-sm font-semibold text-green-400">Ready to chat!</p>
            <p className="text-xs text-slate-400 max-w-[200px] truncate">{fileName}</p>
            <button 
              className="mt-3 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors"
              onClick={(e) => { e.stopPropagation(); setStatus('idle'); setFileName(''); }}
            >
              Upload a different file
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-start gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;
