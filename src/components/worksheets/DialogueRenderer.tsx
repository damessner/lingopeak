'use client';

import { useState } from 'react';
import { parseDialogue, DialogueLine } from '@/utils/dialogueParser';

interface DialogueRendererProps {
  transcript: string;
}

export default function DialogueRenderer({ transcript }: DialogueRendererProps) {
  const dialogueLines = parseDialogue(transcript);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  // Group speakers to assign alternating positions (left vs. right)
  const uniqueSpeakers = Array.from(new Set(dialogueLines.map((line) => line.speaker)));
  const firstSpeaker = uniqueSpeakers[0] || '';

  const handleSpeak = (text: string, index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported on this browser.');
      return;
    }

    const synth = window.speechSynthesis;

    // If already speaking this line, stop it
    if (speakingIdx === index) {
      synth.cancel();
      setSpeakingIdx(null);
      return;
    }

    // Cancel anything currently playing
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to load a premium English voice
    const voices = synth.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith('en-US') && v.name.includes('Google')) ||
      voices.find((v) => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')) ||
      voices[0];

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setSpeakingIdx(null);
    };

    utterance.onerror = () => {
      setSpeakingIdx(null);
    };

    setSpeakingIdx(index);
    synth.speak(utterance);
  };

  return (
    <div className="w-full bg-slate-900/20 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4 max-h-[350px] overflow-y-auto pr-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span>💬</span> Listening Transcript Dialogue
        </label>
        <span className="text-[9px] text-slate-500 font-bold uppercase">Tap bubble to hear pronunciation</span>
      </div>

      <div className="space-y-4">
        {dialogueLines.map((line, idx) => {
          const isLeft = line.speaker === firstSpeaker;
          const isSpeaking = speakingIdx === idx;

          return (
            <div
              key={idx}
              className={`flex items-end gap-2.5 ${isLeft ? 'justify-start' : 'justify-end'}`}
            >
              {/* Avatar placeholder circle */}
              {isLeft && (
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-300 select-none">
                  {line.speaker.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Chat Bubble card */}
              <div
                onClick={() => handleSpeak(line.text, idx)}
                className={`max-w-[75%] p-3.5 rounded-2xl shadow-sm cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border relative ${
                  isLeft
                    ? isSpeaking
                      ? 'bg-indigo-600/35 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-200 hover:border-slate-700'
                    : isSpeaking
                    ? 'bg-indigo-600/35 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-indigo-950/20 border-indigo-900/60 text-slate-200 hover:border-indigo-850'
                }`}
              >
                {/* Speaker indicator badge */}
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 select-none">
                  {line.speaker}
                </div>

                <div className="text-sm leading-relaxed">{line.text}</div>

                {/* Speak button overlay indicator */}
                <div className={`absolute bottom-2 right-2 text-xs transition-opacity duration-300 ${
                  isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-40'
                }`}>
                  {isSpeaking ? '🔊' : '🔈'}
                </div>
              </div>

              {!isLeft && (
                <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-xs font-black text-violet-300 select-none">
                  {line.speaker.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
