'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Database } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  sql?: string;
  results?: any[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am your SAP Order-to-Cash explorer. Ask me anything about your orders, deliveries, or billings.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.answer, 
        sql: data.sql,
        results: data.results
      }]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">SAP Explorer</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Connected to Graph DB</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
              "chat-bubble",
              msg.role === 'user' ? "user" : "ai"
            )}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              
              {msg.sql && (
                <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/5 overflow-x-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">Generated SQL</span>
                  </div>
                  <code className="text-[11px] font-mono text-slate-300 break-all">{msg.sql}</code>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="chat-bubble ai flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-sm italic text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-6 bg-white/5 border-t border-white/10">
        <div className="relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask a question about the O2C flow..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-white transition-all disabled:opacity-50 disabled:bg-slate-700"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-4 text-center">
          Powered by Gemini 1.5 Flash • Real-time SQL Generation
        </p>
      </form>
    </div>
  );
}
