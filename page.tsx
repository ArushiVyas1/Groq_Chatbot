'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BookingCard from './components/BookingCard';
import FeedbackCard from './components/FeedbackCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const DIETARY_FILTERS = ['All', 'Pure Veg', 'Vegan', 'Gluten-Free', 'Jain Options'];

export default function Home() {
  const { user, isLoaded } = useUser();

  const SESSIONS_STORAGE_KEY = user ? `groq_chat_sessions_${user.id}` : 'groq_chat_sessions_guest';
  const ACTIVE_SESSION_KEY = user ? `groq_active_session_${user.id}` : 'groq_active_session_guest';

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);

    if (savedSessions) {
      try {
        const parsedSessions: ChatSession[] = JSON.parse(savedSessions);
        if (parsedSessions.length > 0) {
          setSessions(parsedSessions);
          if (savedActiveId && parsedSessions.some((s) => s.id === savedActiveId)) {
            setActiveSessionId(savedActiveId);
          } else {
            setActiveSessionId(parsedSessions[0].id);
          }
          return;
        }
      } catch (e) {
        console.error('Failed to parse sessions', e);
      }
    }

    const initialSession: ChatSession = {
      id: generateUniqueId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  }, [user, isLoaded]);

  useEffect(() => {
    if (sessions.length > 0 && isLoaded) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, SESSIONS_STORAGE_KEY, isLoaded]);

  useEffect(() => {
    if (activeSessionId && isLoaded) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    }
  }, [activeSessionId, ACTIVE_SESSION_KEY, isLoaded]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentMessages = activeSession ? activeSession.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, loading]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateUniqueId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);

    if (filtered.length === 0) {
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      const fallbackSession: ChatSession = {
        id: generateUniqueId(),
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
      };
      setSessions([fallbackSession]);
      setActiveSessionId(fallbackSession.id);
    } else if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const getPastSessionsContext = (currentId: string) => {
    const otherSessions = sessions.filter((s) => s.id !== currentId && s.messages.length > 0);
    if (otherSessions.length === 0) return '';

    return otherSessions
      .map((s) => {
        const lastFewMessages = s.messages
          .slice(-4)
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n');
        return `[Session: ${s.title}]\n${lastFewMessages}`;
      })
      .join('\n\n');
  };

  const sendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const queryText = customText || input.trim();
    if (!queryText || loading) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: generateUniqueId(),
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSessionId = newSession.id;
    }

    if (!customText) setInput('');

    const updatedMessages: Message[] = [
      ...currentMessages,
      { role: 'user', content: queryText },
    ];

    const updatedTitle =
      currentMessages.length === 0
        ? queryText.slice(0, 28) + (queryText.length > 28 ? '...' : '')
        : activeSession?.title || 'Chat';

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: updatedTitle, messages: updatedMessages }
          : s
      )
    );

    setLoading(true);

    const pastSessionsContext = getPastSessionsContext(currentSessionId);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          pastSessionsContext,
          activeFilter,
        }),
      });

      const data = await res.json();

      const finalMessages: Message[] = [
        ...updatedMessages,
        {
          role: 'assistant',
          content: data.error ? `Error: ${data.error}` : data.reply,
        },
      ];

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: finalMessages } : s
        )
      );
    } catch (err) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...updatedMessages,
                  { role: 'assistant', content: 'Something went wrong. Please try again.' },
                ],
              }
            : s
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2 md:p-6 font-sans">
      <div className="flex h-[90vh] max-w-6xl w-full bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-white">Sessions</h2>
            <button
              onClick={createNewSession}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg transition"
            >
              + New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                  session.id === activeSessionId
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span className="truncate pr-2">{session.title}</span>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 px-1 transition"
                  title="Delete session"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-800 flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <UserButton afterSignOutUrl="/" />
                <span className="text-xs text-slate-300 truncate font-medium">
                  {user.firstName || user.emailAddresses[0]?.emailAddress}
                </span>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <header className="border-b border-slate-200 bg-white px-6 py-3 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <h1 className="font-bold text-slate-800 tracking-tight text-base">
                  {activeSession?.title || 'Dining Assistant'}
                </h1>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium border border-slate-200">
                GPT-4 Turbo
              </span>
            </div>

            {/* Quick Dietary Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Diet:</span>
              {DIETARY_FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition shrink-0 ${
                    activeFilter === filter
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-3">
                <div className="p-3 bg-slate-100 rounded-2xl text-2xl">🍽️</div>
                <p className="font-medium text-slate-700 text-base">What are you in the mood for?</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  <button
                    onClick={() => sendMessage(undefined, 'Show me popular dishes')}
                    className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                  >
                    🔥 Popular Dishes
                  </button>
                  <button
                    onClick={() => sendMessage(undefined, 'Recommend something based on my past visits')}
                    className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                  >
                    ✨ Personalized Choices
                  </button>
                </div>
              </div>
            ) : (
              currentMessages.map((msg, i) => (
                <div
                  key={`${activeSessionId}-${i}`}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-emerald-600 text-white shadow-sm'
                    }`}
                  >
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed overflow-x-auto shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="prose prose-slate prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            img: ({ ...props }) => (
                              <img
                                className="w-full max-w-[220px] h-32 object-cover rounded-xl my-2 shadow-sm border border-slate-200"
                                alt={props.alt || 'Menu item'}
                                {...props}
                              />
                            ),
                            code: ({ className, children, ...props }: any) => {
                              const isBooking = /language-booking/.exec(className || '');
                              const isFeedback = /language-feedback/.exec(className || '');

                              if (isBooking) {
                                try {
                                  const data = JSON.parse(String(children).trim());
                                  return <BookingCard {...data} />;
                                } catch {
                                  return <code className={className} {...props}>{children}</code>;
                                }
                              }

                              if (isFeedback) {
                                try {
                                  const data = JSON.parse(String(children).trim());
                                  return <FeedbackCard {...data} />;
                                } catch {
                                  return <code className={className} {...props}>{children}</code>;
                                }
                              }

                              return <code className={className} {...props}>{children}</code>;
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                  AI
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none text-sm bg-white border border-slate-200 text-slate-400 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </main>

          <footer className="border-t border-slate-200 bg-white p-4 shrink-0">
            <form onSubmit={(e) => sendMessage(e)} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about restaurants, menus, or reservations..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-medium text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shrink-0 shadow-sm"
              >
                Send
              </button>
            </form>
          </footer>
        </div>
      </div>
    </div>
  );
}