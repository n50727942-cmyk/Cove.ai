import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Globe, MapPin, Send, Trash2, ExternalLink, X, Compass, AlertCircle, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { AIChatMessage } from '../../types';

interface CoveAiPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoveAiPanel: React.FC<CoveAiPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am Cove AI, powered by Google Gemini. You have full control over the information source: toggle Google Search grounding ON to fetch live web citations, or turn it OFF for direct model reasoning.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [isSearchEnabled, setIsSearchEnabled] = useState(true);
  const [isMapsEnabled, setIsMapsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const queryText = (customText || prompt).trim();
    if (!queryText || isLoading) return;

    const userMsg: AIChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: queryText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setIsLoading(true);
    setError(null);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await api.chatAi({
        prompt: queryText,
        history: historyPayload,
        enableSearch: isSearchEnabled && !isMapsEnabled,
        enableMaps: isMapsEnabled,
      });

      const modelMsg: AIChatMessage = {
        id: 'model_' + Date.now(),
        role: 'model',
        text: res.text,
        toolUsed: res.toolUsed,
        sources: res.sources,
        searchQueries: res.searchQueries,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setError(err.message || 'AI assistant encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome_new',
        role: 'model',
        text: 'Chat history cleared. What would you like to explore or research next?',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const toggleSearch = () => {
    setIsSearchEnabled(!isSearchEnabled);
    if (!isSearchEnabled && isMapsEnabled) {
      setIsMapsEnabled(false);
    }
  };

  const toggleMaps = () => {
    setIsMapsEnabled(!isMapsEnabled);
    if (!isMapsEnabled && isSearchEnabled) {
      setIsSearchEnabled(false);
    }
  };

  const suggestedPrompts = [
    { label: 'Current World News', query: 'What are the top global news headlines today?' },
    { label: 'Post-Quantum Crypto', query: 'Explain post-quantum key encapsulation (ML-KEM) in simple terms.' },
    { label: 'Scenic Coffee Shops', query: 'Where are some great quiet coffee shops in Seattle?' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full h-[85vh] max-h-[750px] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2D5AFF] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 font-display">
                  Cove AI Assistant
                </h2>
                <span className="text-[10px] font-semibold text-[#2D5AFF] bg-[#2D5AFF]/10 px-2 py-0.5 rounded-full">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Customizable Grounding & Verified Source Controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClear}
              title="Clear conversation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source Control Bar with Explicit Search Grounding Toggle */}
        <div className="px-5 py-2.5 bg-slate-50/90 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {/* Main Google Search Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSearch}
                aria-pressed={isSearchEnabled && !isMapsEnabled}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2D5AFF] focus:ring-offset-2 ${
                  isSearchEnabled && !isMapsEnabled ? 'bg-[#2D5AFF]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isSearchEnabled && !isMapsEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={toggleSearch}
                className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer select-none"
              >
                <Globe
                  className={`w-3.5 h-3.5 ${
                    isSearchEnabled && !isMapsEnabled ? 'text-[#2D5AFF]' : 'text-slate-400'
                  }`}
                />
                <span>Google Search Grounding:</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                    isSearchEnabled && !isMapsEnabled
                      ? 'bg-blue-100 text-[#2D5AFF] font-bold'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isSearchEnabled && !isMapsEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden md:inline">
              {isSearchEnabled && !isMapsEnabled
                ? 'Live web citations & source links active'
                : 'Direct model output without web requests'}
            </span>
          </div>

          {/* Optional Google Maps toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMaps}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                isMapsEnabled
                  ? 'bg-white text-[#00D1B2] border border-[#00D1B2]/40 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 bg-white/60 border border-slate-200'
              }`}
            >
              <MapPin className={`w-3 h-3 ${isMapsEnabled ? 'text-[#00D1B2]' : 'text-slate-400'}`} />
              <span>Places (Maps): {isMapsEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#2D5AFF] text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>

                {/* Grounding Attribution & Citations */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600 font-semibold mb-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#2D5AFF]" />
                      <span>Google Search Verified Sources:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {m.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-[#2D5AFF] text-slate-700 hover:text-[#2D5AFF] transition-colors truncate shadow-2xs"
                        >
                          <span className="truncate pr-1 font-medium">{s.title || s.uri}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Provenance Indicator */}
                {m.role === 'model' && m.id !== 'welcome' && (
                  <div className="mt-2.5 pt-1.5 border-t border-slate-200/40 flex items-center gap-1 text-[10px] text-slate-400">
                    {m.toolUsed === 'search' ? (
                      <span className="inline-flex items-center gap-1 text-[#2D5AFF] font-medium">
                        <Globe className="w-3 h-3" />
                        <span>Google Search Grounded (Live Web)</span>
                      </span>
                    ) : m.toolUsed === 'maps' ? (
                      <span className="inline-flex items-center gap-1 text-[#00D1B2] font-medium">
                        <MapPin className="w-3 h-3" />
                        <span>Google Maps Grounded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Sparkles className="w-3 h-3 text-slate-400" />
                        <span>Direct Model Output (Search Grounding Off)</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-xs p-3.5 text-xs text-slate-600 border border-slate-200/60 flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-[#2D5AFF] rounded-full animate-spin" />
                <span>
                  {isMapsEnabled
                    ? 'Consulting Google Maps...'
                    : isSearchEnabled
                    ? 'Searching Google & verifying citations...'
                    : 'Generating response via Gemini...'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        {messages.length <= 2 && (
          <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
              Quick Prompts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(undefined, p.query)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[11px] text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#2D5AFF]" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Composer with Inline Search Grounding Status */}
        <form onSubmit={handleSend} className="p-3.5 border-t border-slate-200 bg-white space-y-2">
          <div className="flex items-center gap-2">
            {/* Quick In-Composer Toggle Button */}
            <button
              type="button"
              onClick={toggleSearch}
              title={
                isSearchEnabled && !isMapsEnabled
                  ? 'Google Search Grounding is ON. Click to toggle OFF.'
                  : 'Google Search Grounding is OFF. Click to toggle ON.'
              }
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isSearchEnabled && !isMapsEnabled
                  ? 'bg-blue-50 border-[#2D5AFF]/30 text-[#2D5AFF]'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">
                Search: {isSearchEnabled && !isMapsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isMapsEnabled
                  ? 'Ask about places or addresses (Google Maps Grounded)...'
                  : isSearchEnabled
                  ? 'Ask a question (Google Search Grounded with sources)...'
                  : 'Ask a question (Direct Gemini generation, no web search)...'
              }
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5AFF]"
            />

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-white bg-[#2D5AFF] hover:bg-[#2448cc] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
