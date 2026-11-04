import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Chat from './components/Chat';

/**
 * App — root component with Dark Mode support
 */
function App() {
  const [currentDoc, setCurrentDoc] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Sync dark class to <html> tag and persist in localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">PDF RAG Chat</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Upload a PDF, ask questions, get answers with citations</p>
        </div>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={() => setDarkMode((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span>{darkMode ? '☀️ Light' : '🌙 Dark'}</span>
        </button>
      </header>

      {/* Main layout: upload panel (left) + chat (right) */}
      <main className="flex flex-col md:flex-row h-[calc(100vh-65px)]">

        {/* Left: Upload panel */}
        <div className="w-full md:w-80 p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <FileUpload
            onDocumentReady={setCurrentDoc}
            currentSession={currentDoc}
          />

          {/* Show active session info */}
          {currentDoc && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded text-sm">
              <p className="font-medium text-green-800 dark:text-green-300">Active Document:</p>
              <p className="text-green-700 dark:text-green-400 truncate">{currentDoc.filename}</p>
              <p className="text-green-600 dark:text-green-500 text-xs mt-1 truncate">
                Session: {currentDoc.sessionId}
              </p>
            </div>
          )}
        </div>

        {/* Right: Chat panel */}
        <div className="flex-1 p-4">
          <Chat currentDoc={currentDoc} />
        </div>
      </main>
    </div>
  );
}

export default App;
