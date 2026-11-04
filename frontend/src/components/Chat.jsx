import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';

/**
 * Chat component with Dark Mode styles
 */
function Chat({ currentDoc }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Scroll to bottom ref
  const bottomRef = useRef(null);

  // When user uploads a new PDF, clear the chat history
  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [currentDoc?.sessionId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !currentDoc || loading) return;

    const userText = input.trim();
    setInput('');

    // Add user message to chat immediately
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        message: userText,
        sessionId: currentDoc.sessionId,
        filename: currentDoc.filename,
      });

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.message,
          citations: res.data.citations || [],
        },
      ]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 transition-colors">

      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">PDF Chat</h2>
        {currentDoc ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Chatting with: {currentDoc.filename}</p>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">Upload a PDF to start chatting</p>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-500 text-sm mt-8">
            {currentDoc
              ? `Ask anything about "${currentDoc.filename}"`
              : 'Upload a PDF first, then ask questions here.'}
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`
                max-w-[80%] rounded px-3 py-2 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600'}
              `}
            >
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}

              {/* Citations */}
              {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Sources:</p>
                  <div className="space-y-0.5">
                    {msg.citations.map((c) => (
                      <p key={c.chunkId ?? c.index} className="text-xs text-gray-500 dark:text-gray-400">
                        [{c.index}] {c.filename}{c.page ? ` — Page ${c.page}` : ''}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-500 dark:text-gray-300">
              Thinking...
            </div>
          </div>
        )}

        {/* Invisible div to scroll into view */}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 bg-white dark:bg-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={currentDoc ? `Ask about ${currentDoc.filename}...` : 'Upload a PDF first...'}
          disabled={!currentDoc || loading}
          className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || !currentDoc || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
