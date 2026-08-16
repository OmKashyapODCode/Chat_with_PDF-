'use client';
import * as React from 'react';
import FileUploadComponent from './components/file-upload';
import ChatComponent from './components/chat';

interface CurrentDoc {
  documentId: string;
  filename: string;
}

export default function Home() {
  // currentDoc tracks the documentId + filename of the most recently uploaded PDF.
  // This is the ONLY document that will be used for RAG retrieval.
  const [currentDoc, setCurrentDoc] = React.useState<CurrentDoc | null>(null);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-57px)] md:h-[calc(100vh-57px)] w-full bg-slate-950 text-white md:overflow-hidden">
      {/* Upload Section */}
      <div className="w-full md:w-1/3 lg:w-1/4 p-4 md:p-6 flex flex-col justify-start md:justify-center items-center border-b md:border-b-0 md:border-r border-white/10 shrink-0">
        <FileUploadComponent onDocumentReady={setCurrentDoc} />
      </div>
      {/* Chat Section */}
      <div className="w-full md:w-2/3 lg:w-3/4 p-4 md:p-6 flex flex-col items-center md:justify-center">
        <div className="w-full h-[650px] max-w-5xl">
          <ChatComponent currentDoc={currentDoc} />
        </div>
      </div>
    </div>
  );
}
