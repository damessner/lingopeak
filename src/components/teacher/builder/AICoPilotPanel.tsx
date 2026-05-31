'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/worksheet-types';
import { generateCrossword, generateWordSearch } from '@/lib/gridGenerators';

interface AICoPilotPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  tier: 'EXPLORER' | 'VOYAGER' | 'CHALLENGER' | 'SUMMIT';
  onGenerateQuestions: (questions: Question[]) => void;
}

export default function AICoPilotPanel({
  isOpen,
  onToggle,
  tier,
  onGenerateQuestions
}: AICoPilotPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rate Limit / Quota tracking states
  const [requests, setRequests] = useState<number[]>([]);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // Load and refresh request timestamps from localStorage
  const loadRequests = () => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('lingopeak_ai_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          // Filter down to the last 60 seconds
          return parsed.filter((t: number) => now - t < 60000);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  useEffect(() => {
    const active = loadRequests();
    setRequests(active);
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (requests.length >= 5) {
      const interval = setInterval(() => {
        const now = Date.now();
        const oldest = requests[0] || now;
        const timePassed = now - oldest;
        const remaining = Math.max(0, Math.ceil((60000 - timePassed) / 1000));
        
        setCooldownLeft(remaining);
        
        if (remaining <= 0) {
          const active = loadRequests();
          setRequests(active);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCooldownLeft(0);
    }
  }, [requests]);

  const [lastAttemptedPrompt, setLastAttemptedPrompt] = useState<string>('');
  const [lastAttemptedCount, setLastAttemptedCount] = useState<number>(5);

  const handleGenerate = async (overridePrompt?: string, overrideCount?: number) => {
    const activePrompt = overridePrompt !== undefined ? overridePrompt : prompt.trim();
    const activeCount = overrideCount !== undefined ? overrideCount : count;

    if (!activePrompt) return;
    
    // Check local quota
    const activeRequests = loadRequests();
    if (activeRequests.length >= 5) {
      setError('You have reached the local rate limit (5 requests per minute). Please wait for the cooldown.');
      return;
    }

    setGenerating(true);
    setError(null);
    setLastAttemptedPrompt(activePrompt);
    setLastAttemptedCount(activeCount);

    try {
      const res = await fetch('/api/teacher/worksheets/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_worksheet',
          prompt: activePrompt,
          tier,
          count: activeCount
        })
      });

      // Update rate limits list
      const now = Date.now();
      const updatedRequests = [...activeRequests, now];
      localStorage.setItem('lingopeak_ai_requests', JSON.stringify(updatedRequests));
      setRequests(updatedRequests);

      if (res.ok) {
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions)) {
          const processed = data.questions.map((q: any) => {
            const mapped = { ...q };
            if (q.type === 'crossword' && q.crossword_items) {
              try {
                const layout = generateCrossword(q.crossword_items);
                mapped.grid = layout.grid;
                mapped.clues = layout.clues;
              } catch (err) {}
            } else if (q.type === 'word_search' && q.words) {
              try {
                const layout = generateWordSearch(q.words);
                mapped.grid = layout.grid;
                mapped.words = layout.words;
                mapped.word_search_words = q.words.join(', ');
              } catch (err) {}
            } else if (q.type === 'drag_and_drop') {
              mapped.distractors_raw = (q.distractors || []).join(', ');
            } else if (q.type === 'category_sorting') {
              mapped.categories_raw = (q.categories || []).join(', ');
            } else if (q.type === 'choice_matrix') {
              mapped.rows_raw = (q.rows || []).join(', ');
              mapped.columns_raw = (q.columns || []).join(', ');
            }
            return mapped;
          });

          onGenerateQuestions(processed);
          setPrompt('');
          setLastAttemptedPrompt('');
          onToggle(); // Close sidebar panel on success
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate questions.');
      }
    } catch (err: any) {
      setError(err.message || 'AI Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRetry = () => {
    handleGenerate(lastAttemptedPrompt, lastAttemptedCount);
  };

  const remainingQuota = Math.max(0, 5 - requests.length);

  return (
    <div className="border border-indigo-500/20 rounded-2xl bg-indigo-950/10 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-indigo-300 hover:text-white cursor-pointer select-none"
      >
        <span className="flex items-center gap-2">🤖 AI Co-Pilot Worksheet Generator</span>
        <span>{isOpen ? '▲ Hide' : '▼ Expand'}</span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-indigo-500/10 space-y-4 bg-indigo-950/20 animate-scaleUp">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-200 rounded-xl text-[10px] font-bold flex justify-between items-center gap-2">
              <span>⚠️ {error}</span>
              {lastAttemptedPrompt && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={generating || cooldownLeft > 0}
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-xl cursor-pointer disabled:cursor-not-allowed select-none whitespace-nowrap transition-colors flex items-center gap-1 shadow-md"
                >
                  <span>🔄 Retry Prompt</span>
                </button>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest flex justify-between">
              <span>Generate Worksheet by Prompt</span>
              <span className={`font-bold ${remainingQuota === 0 ? 'text-red-400' : 'text-indigo-300'}`}>
                {cooldownLeft > 0 
                  ? `Cooldown: ${cooldownLeft}s` 
                  : `${remainingQuota}/5 requests remaining`}
              </span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Present perfect vs past simple, including matching verbs and gap filling exercises about travel experiences"
              rows={2}
              className="w-full bg-slate-950 border border-indigo-500/10 rounded-xl p-3 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500"
              disabled={cooldownLeft > 0}
            />
          </div>

          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Number of Questions:</span>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-bold cursor-pointer"
                disabled={cooldownLeft > 0}
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={7}>7 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={generating || !prompt.trim() || cooldownLeft > 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-650 border border-indigo-500/20 text-xs font-bold py-2 px-5 rounded-xl cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              {generating 
                ? '🤖 Generating questions...' 
                : cooldownLeft > 0 
                  ? `Rate Limited (${cooldownLeft}s)` 
                  : '⚡ Generate Worksheet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
