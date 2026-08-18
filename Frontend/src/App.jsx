import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, RotateCcw, Sparkles, Trophy, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';


export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom on new messages or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  // Ping backend on mount to warm up Render free tier container
  useEffect(() => {
    if (API_URL) {
      axios.get(`${API_URL}/health`).catch(() => {
        // Silently warming up
      });
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = async (problemText) => {
    const textToSend = (problemText || input).trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/invoke`, {
        input: textToSend
      });

      const result = response.data.result;
      if (result) {
        setMessages((prev) => [...prev, result]);
      }
    } catch (err) {
      console.error('Error invoking graph:', err);
      if (err.message === 'Network Error' || !err.response) {
        setError('Server was sleeping (Render free tier). It is now waking up — please try submitting again in a few seconds!');
      } else {
        setError(err?.response?.data?.error || err?.message || 'Failed to generate solutions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 selection:bg-neutral-200 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-neutral-900">
              AI Battle Arena
            </h1>
            <p className="text-xs text-neutral-500">
              Compare. Judge. Choose.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-100 active:scale-95 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Conversation Area */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-8 flex flex-col">
        {messages.length === 0 && !isLoading && !error ? (
          /* Empty State */
          <div className="my-auto flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1 text-xs font-medium text-neutral-600 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-neutral-700" />
              <span>Two solutions. One judge.</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 max-w-md">
              AI Battle Arena
            </h2>
            <p className="mt-3 text-sm text-neutral-500 max-w-md">
              Ask anything and compare how different AI systems solve it side-by-side with an impartial judge evaluation.
            </p>

            {/* Quick Prompts */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg text-left">
              {[
                'Explain how JWT authentication works',
                'Write a debounce function in JavaScript with cancel',
                'Compare PostgreSQL vs MongoDB for analytics',
                'How does the JavaScript Event Loop handle microtasks?'
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(prompt)}
                  className="rounded-xl border border-neutral-200 bg-white p-3.5 text-xs font-medium text-neutral-700 shadow-xs hover:border-neutral-300 hover:bg-neutral-100/80 transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="flex flex-col gap-12">
            {messages.map((item, index) => {
              const sol1Score = item.judge?.solution_1_score ?? 0;
              const sol2Score = item.judge?.solution_2_score ?? 0;
              const recommended =
                sol1Score === 0 && sol2Score === 0
                  ? 'Evaluation Pending'
                  : sol1Score > sol2Score
                    ? 'Solution 1'
                    : sol2Score > sol1Score
                      ? 'Solution 2'
                      : 'Both solutions are equally strong';

              return (
                <div key={index} className="flex flex-col gap-6">
                  {/* Round Divider */}
                  {index > 0 && (
                    <div className="flex items-center gap-3 my-2">
                      <div className="h-px flex-1 bg-neutral-200" />
                      <span className="text-xs font-medium text-neutral-400">
                        Round {index + 1}
                      </span>
                      <div className="h-px flex-1 bg-neutral-200" />
                    </div>
                  )}

                  {/* 1. User Problem */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      User Problem
                    </span>
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
                      <p className="text-base font-medium text-neutral-900 whitespace-pre-wrap leading-relaxed">
                        {item.problem}
                      </p>
                    </div>
                  </div>

                  {/* 2. Solutions */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Solutions
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Solution 1 */}
                      <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs">
                        <div className="border-b border-neutral-100 pb-3 mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-neutral-900">
                            Solution 1
                          </h3>
                          <span className="text-xs text-neutral-400 font-medium bg-neutral-100 px-2 py-0.5 rounded-md">
                            Model A
                          </span>
                        </div>
                        <div className="prose prose-neutral prose-sm max-w-none text-neutral-800 leading-relaxed prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-headings:font-semibold prose-code:text-neutral-900 prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
                          <ReactMarkdown>{item.solution_1 || 'No solution generated.'}</ReactMarkdown>
                        </div>
                      </div>

                      {/* Solution 2 */}
                      <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs">
                        <div className="border-b border-neutral-100 pb-3 mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-neutral-900">
                            Solution 2
                          </h3>
                          <span className="text-xs text-neutral-400 font-medium bg-neutral-100 px-2 py-0.5 rounded-md">
                            Model B
                          </span>
                        </div>
                        <div className="prose prose-neutral prose-sm max-w-none text-neutral-800 leading-relaxed prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-headings:font-semibold prose-code:text-neutral-900 prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
                          <ReactMarkdown>{item.solution_2 || 'No solution generated.'}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Judge Evaluation */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Judge
                    </span>
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-5">
                      {/* Solution 1 Evaluation */}
                      <div className="border-b border-neutral-100 pb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-neutral-900">
                            Solution 1
                          </span>
                          <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                            {sol1Score} / 10
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {item.judge?.solution_1_reasoning || 'Reasoning unavailable.'}
                        </p>
                      </div>

                      {/* Solution 2 Evaluation */}
                      <div className="border-b border-neutral-100 pb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-neutral-900">
                            Solution 2
                          </span>
                          <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                            {sol2Score} / 10
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {item.judge?.solution_2_reasoning || 'Reasoning unavailable.'}
                        </p>
                      </div>

                      {/* Recommendation */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Recommended
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                          <Trophy className="h-3.5 w-3.5 text-amber-300" />
                          <span>{recommended}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2.5 text-xs font-medium text-neutral-600">
                  <Sparkles className="h-4 w-4 animate-spin text-neutral-900" />
                  <span>Generating two independent solutions & judge evaluation...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                  <div className="h-32 rounded-xl bg-neutral-100" />
                  <div className="h-32 rounded-xl bg-neutral-100" />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium">{error}</p>
                  <p className="text-xs text-red-600 mt-0.5">Please check your network and try again.</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </main>

      {/* Sticky Bottom Input */}
      <div className="sticky bottom-0 z-20 w-full bg-gradient-to-t from-neutral-50 via-neutral-50 to-transparent pb-5 pt-3">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="relative flex items-center rounded-2xl border border-neutral-300 bg-white shadow-sm focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/5 transition-all"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask anything..."
              rows={1}
              className="w-full resize-none bg-transparent px-4 py-3.5 pr-12 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden disabled:opacity-50 leading-relaxed max-h-36"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white transition-all hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed active:scale-95"
              title="Send message"
            >
              {isLoading ? (
                <Sparkles className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
