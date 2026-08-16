'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Send, User, Bot, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CurrentDoc {
  documentId: string;
  filename: string;
}

interface Citation {
  index: number;
  documentId: string;
  filename: string;
  page: number | null;
  chunkId: string | null;
}

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  citations?: Citation[];
}

interface Props {
  /** The currently active document. Chat is scoped to this document only. */
  currentDoc: CurrentDoc | null;
}

const ChatComponent: React.FC<Props> = ({ currentDoc }) => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const endOfMessagesRef = React.useRef<HTMLDivElement>(null);

  // Reset chat messages whenever the user switches to a new document
  React.useEffect(() => {
    setMessages([]);
    setMessage('');
  }, [currentDoc?.documentId]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;
    if (!currentDoc) return;

    const userMessage = message;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          documentId: currentDoc.documentId, // ← scope retrieval to this PDF
          filename: currentDoc.filename,
        }),
      });
      const data = await res.json();
      const content = data?.message ?? data?.error ?? '⚠️ No response received from server.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content,
          citations: data?.citations ?? [],
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't process your request right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const placeholder = currentDoc
    ? `Ask something about ${currentDoc.filename}...`
    : 'Upload a PDF to start chatting...';

  return (
    <div className="flex flex-col h-full w-full border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 shadow-lg">

      {/* Header — shows current active document */}
      <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
            <Bot size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">PDF AI Assistant</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online
            </p>
          </div>
        </div>

        {/* Active document badge */}
        {currentDoc && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 max-w-[50%]">
            <FileText size={12} className="text-indigo-400 shrink-0" />
            <span className="text-xs text-indigo-300 truncate" title={currentDoc.filename}>
              {currentDoc.filename}
            </span>
          </div>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-2">
              <Bot size={48} className="opacity-50 text-slate-500" />
            </div>
            {currentDoc ? (
              <p className="text-sm font-medium">
                Ask me anything about <span className="text-indigo-400">{currentDoc.filename}</span>
              </p>
            ) : (
              <p className="text-sm font-medium">Upload a PDF to start chatting.</p>
            )}
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isUser ? 'bg-blue-600' : 'bg-slate-800 dark:bg-slate-700'}`}>
                {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
              </div>

              <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-5 py-3.5 rounded-2xl ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="text-[15px] leading-relaxed break-words">
                      <ReactMarkdown
                        components={{
                          p: (props) => <p className="mb-3 last:mb-0" {...props} />,
                          strong: (props) => <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props} />,
                          ul: (props) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: (props) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          li: (props) => <li className="pl-1" {...props} />,
                          h1: (props) => <h1 className="text-lg font-bold mb-2 mt-4" {...props} />,
                          h2: (props) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                          h3: (props) => <h3 className="text-base font-semibold mb-2 mt-3" {...props} />,
                          code: (props) => <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400" {...props} />,
                          pre: (props) => <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto text-sm font-mono mb-3" {...props} />,
                          a: (props) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        }}
                      >
                        {msg.content || ''}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Structured citations — only shown for assistant messages */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 ml-1 w-full">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c) => (
                        <span
                          key={c.chunkId ?? c.index}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText size={10} className="text-indigo-400 shrink-0" />
                          [{c.index}] {c.filename}
                          {c.page !== null ? ` — Page ${c.page}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 flex-row items-end">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 dark:bg-slate-700 shadow-sm">
              <Bot size={14} className="text-white" />
            </div>
            <div className="px-5 py-4 rounded-2xl rounded-bl-none bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
          className="flex gap-3 max-w-4xl mx-auto items-end"
        >
          <div className="relative flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 border-transparent focus-visible:ring-blue-500 py-6 pl-5 pr-12 text-[15px]"
              disabled={loading || !currentDoc}
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || loading || !currentDoc}
            className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all shrink-0 mb-0.5"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
