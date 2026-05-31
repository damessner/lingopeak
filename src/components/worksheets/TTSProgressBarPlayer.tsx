'use client';

import { useState, useEffect, useRef } from 'react';

interface TTSProgressBarPlayerProps {
  text: string;
  showTextPreview?: boolean;
}

export default function TTSProgressBarPlayer({ text, showTextPreview = false }: TTSProgressBarPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(0.85); // Default ESL pace
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    if (playing) {
      synth.cancel();
      setPlaying(false);
      setProgress(0);
    } else {
      synth.cancel();
      
      // Clean up text of any hashtags if present
      const cleanText = text.replace(/#/g, '');
      if (!cleanText.trim()) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          const pct = Math.min(100, Math.round((charIndex / cleanText.length) * 100));
          setProgress(pct);
        }
      };

      utterance.onend = () => {
        setPlaying(false);
        setProgress(100);
        setTimeout(() => setProgress(0), 500);
      };

      utterance.onerror = () => {
        setPlaying(false);
        setProgress(0);
      };

      utteranceRef.current = utterance;
      setPlaying(true);
      synth.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-400">🗣️ AI Audio Reader</span>
          <span className="text-[9px] text-slate-500 font-semibold">(TTS Synthesis)</span>
        </div>
        
        {/* Speed rate selector */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-550 font-bold text-slate-400">Speed:</span>
          <select
            value={rate}
            onChange={(e) => {
              const newRate = parseFloat(e.target.value);
              setRate(newRate);
              if (playing) {
                const synth = window.speechSynthesis;
                synth.cancel();
                setPlaying(false);
                setProgress(0);
                setTimeout(() => {
                  handlePlayPause();
                }, 50);
              }
            }}
            className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-slate-350 cursor-pointer outline-none font-bold"
          >
            <option value="0.7">0.7x (Slow)</option>
            <option value="0.85">0.85x (ESL)</option>
            <option value="1.0">1.0x (Normal)</option>
          </select>
        </div>
      </div>

      {showTextPreview && (
        <p className="text-[10px] text-slate-400 font-medium italic border-l-2 border-indigo-500/50 pl-2 leading-relaxed max-h-[60px] overflow-y-auto whitespace-pre-wrap">
          "{text}"
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayPause}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer font-bold h-9 w-9 text-xs flex-shrink-0"
        >
          {playing ? '⏹️' : '▶️'}
        </button>

        {/* Custom Progress Bar */}
        <div className="flex-grow h-2 bg-slate-900 rounded-full overflow-hidden relative border border-slate-850">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <span className="text-[10px] font-mono font-bold text-slate-450 w-8 text-right select-none">
          {progress}%
        </span>
      </div>
    </div>
  );
}
