'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface StudentStats {
  attempts: number;
  avgScore: number;
  badges: number;
  writingSubmissions: number;
}

interface StruggleArea {
  worksheetTitle: string;
  category: string;
  score: number;
}

interface CategoryMastery {
  category: string;
  score: number;
}

interface StudentTutorClientProps {
  sessionUsername: string;
  sessionAvatar: string;
}

export default function StudentTutorClient({
  sessionUsername,
  sessionAvatar
}: StudentTutorClientProps) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${sessionUsername}! I'm Hermes, your personal AI ESL Tutor on LingoPeak. ⛰️\n\nI can help you practice English, review your grammar mistakes, or drill vocabulary. What would you like to practice today?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Statistics state
  const [stats, setStats] = useState<StudentStats>({
    attempts: 0,
    avgScore: 0,
    badges: 0,
    writingSubmissions: 0
  });
  const [struggles, setStruggles] = useState<StruggleArea[]>([]);
  const [categoryMastery, setCategoryMastery] = useState<CategoryMastery[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load statistics on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/student/tutor/init');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data.stats);
            setStruggles(data.struggles);
            setCategoryMastery(data.categoryMastery);
            if (data.history && data.history.length > 0) {
              setMessages(data.history);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load tutor stats:', err);
      }
    };
    fetchStats();
  }, []);

  // Web Speech API Voice Synthesis
  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Remove Markdown syntax for cleaner reading
      const cleanText = text.replace(/[*#_`\[\]]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // Speak slightly slower for ESL learners
      window.speechSynthesis.speak(utterance);
    }
  };

  // Web Speech API Voice Input (STT)
  const handleMicToggle = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Auto-send the spoken message directly
      handleSend(transcript);
    };

    recognition.start();
  };

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    // Add user message
    const userMsg: Message = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/student/tutor/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMsg]);
        if (ttsEnabled) {
          handleSpeak(data.reply);
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send message');
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an issue sending your message. Details: ${err.message || 'Network error'}. Please try again.`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your conversation session?')) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      try {
        await fetch('/api/student/tutor/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' })
        });
      } catch (err) {
        console.error('Failed to clear persistent chat history:', err);
      }

      setMessages([
        {
          role: 'assistant',
          content: `Hi ${sessionUsername}! I'm Hermes, your personal AI ESL Tutor on LingoPeak. ⛰️\n\nI can help you practice English, review your grammar mistakes, or drill vocabulary. What would you like to practice today?`,
          timestamp: Date.now()
        }
      ]);
    }
  };

  const handleChipClick = (promptText: string) => {
    handleSend(promptText);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-3">
            <span className="text-3xl select-none">🤖</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">LingoPeak</span>
              <span className="text-xs text-slate-400 font-bold ml-2">← Back to Student Hub</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
            <span className="text-2xl">{sessionAvatar}</span>
            <span className="text-sm font-bold text-white">{sessionUsername}</span>
          </div>
        </div>
      </header>

      {/* Content Space */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 z-10 flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
        
        {/* Sidebar Panel */}
        <section className="w-full md:w-80 flex flex-col gap-6 flex-shrink-0 overflow-y-auto pr-0 md:pr-2">
          
          {/* Profile & Aggregate Stats */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 space-y-4 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-4xl p-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">{sessionAvatar}</span>
              <div>
                <h3 className="font-extrabold text-white">{sessionUsername}</h3>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">STUDENT</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl text-center">
                <span className="block text-xl font-extrabold text-white">{stats.attempts}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Attempts</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl text-center">
                <span className="block text-xl font-extrabold text-emerald-400">{stats.avgScore}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Avg Score</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl text-center">
                <span className="block text-xl font-extrabold text-indigo-400">{stats.badges}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Badges</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl text-center">
                <span className="block text-xl font-extrabold text-amber-400">{stats.writingSubmissions}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Essays</span>
              </div>
            </div>
          </div>

          {/* Grammar Gaps / Struggle Areas */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 space-y-3 backdrop-blur-sm shadow-xl flex-grow flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-1.5">
                <span>⚠️</span> Grammar & Review Gaps
              </h4>
              
              {struggles.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-2xl filter grayscale opacity-45 select-none block mb-1">🎉</span>
                  <p className="text-slate-400 text-xs italic">All clear! No recent struggles found.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {struggles.map((s, idx) => (
                    <div key={idx} className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between font-bold text-white">
                        <span className="truncate max-w-[140px]">{s.worksheetTitle}</span>
                        <span className="text-red-400">{s.score}%</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">{s.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overall Mastery Tracker */}
            {categoryMastery.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Overall Mastery</span>
                <div className="space-y-1.5">
                  {categoryMastery.map((cm, idx) => (
                    <div key={idx} className="text-[10px] space-y-1">
                      <div className="flex justify-between text-slate-300 font-bold">
                        <span>{cm.category}</span>
                        <span>{cm.score}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${cm.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Chat Panel */}
        <section className="flex-grow bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm shadow-2xl relative h-full">
          
          {/* Active Companion Status */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/20 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <div>
                <h3 className="font-extrabold text-sm text-white">Hermes AI Tutor</h3>
                <p className="text-[10px] text-slate-400 font-bold">Self-hosted study companion</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* TTS Play Toggle */}
              <button
                type="button"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center gap-1.5 select-none ${
                  ttsEnabled 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                    : 'bg-slate-950 border-slate-850 text-slate-500'
                }`}
              >
                <span>{ttsEnabled ? '🔊 Voice On' : '🔇 Muted'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                className="text-xs bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                🧹 Reset Chat
              </button>
            </div>
          </div>

          {/* Bubbles Scroll Container */}
          <div className="flex-grow p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Bubble Avatar */}
                <div className="flex-shrink-0 select-none text-2xl">
                  {m.role === 'user' ? sessionAvatar : '🤖'}
                </div>

                {/* Bubble Text */}
                <div className="space-y-1">
                  <div
                    className={`p-4 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap relative shadow-sm border ${
                      m.role === 'user'
                        ? 'bg-indigo-650 border-indigo-500/20 text-white rounded-tr-none'
                        : 'bg-slate-900 border-slate-800/80 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {m.content}
                    
                    {/* Speak Button for AI responses */}
                    {m.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => handleSpeak(m.content)}
                        className="absolute right-2 bottom-2 p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-indigo-400 hover:text-indigo-300 font-black cursor-pointer shadow-sm opacity-60 hover:opacity-100 transition-opacity"
                        title="Listen to response"
                      >
                        🔊 Speak
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold block text-right px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 select-none text-2xl">🤖</div>
                <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-slate-400 font-bold ml-1">Hermes is translating...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions area */}
          <div className="px-6 py-2 flex-shrink-0 flex gap-2 overflow-x-auto select-none border-t border-slate-800/50 bg-slate-900/10">
            <button
              type="button"
              onClick={() => handleChipClick('📝 Help me review my recent mistakes.')}
              className="text-[10px] font-bold bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-indigo-200 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex-shrink-0 whitespace-nowrap"
            >
              📝 Review Mistakes
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('💬 Can we have a casual speaking practice?')}
              className="text-[10px] font-bold bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-indigo-200 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex-shrink-0 whitespace-nowrap"
            >
              💬 Speak Casual
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('⚡ Give me a vocabulary drill.')}
              className="text-[10px] font-bold bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-indigo-200 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex-shrink-0 whitespace-nowrap"
            >
              ⚡ Vocab Drill
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('🤔 Explain a common English idiom.')}
              className="text-[10px] font-bold bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-indigo-200 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex-shrink-0 whitespace-nowrap"
            >
              🤔 Explain Idiom
            </button>
          </div>

          {/* Chat Form Input Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex gap-3 items-center flex-shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? '🎙️ Listening… speak now' : `Send message to Hermes...`}
              disabled={loading || listening}
              className={`flex-grow bg-slate-950 border rounded-2xl px-4 py-3 text-xs text-slate-200 font-medium outline-none transition-colors ${
                listening ? 'border-red-500/60 animate-pulse' : 'border-slate-800 focus:border-indigo-500'
              }`}
            />

            {/* Mic button */}
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={loading}
              title={listening ? 'Stop listening' : 'Speak to Hermes'}
              className={`p-3 rounded-2xl font-extrabold text-xs border transition-all ${
                listening
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500'
              }`}
            >
              🎙️
            </button>

            <button
              type="submit"
              disabled={loading || !input.trim() || listening}
              className="bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-900 text-white disabled:text-slate-600 px-5 py-3 rounded-2xl font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed border border-indigo-500/20 shadow-sm transition-all"
            >
              Send ⚡
            </button>
          </form>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-500">
        <p>© 2026 LingoPeak. Powered by DeepSeek V4 Flash via OpenCode Zen. Self-hosted school platform.</p>
      </footer>

    </div>
  );
}
