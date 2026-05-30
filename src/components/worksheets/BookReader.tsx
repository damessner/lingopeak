'use client';

import { useState } from 'react';
import WorksheetContainer from './WorksheetContainer';

interface BookReaderProps {
  chapter: {
    id: string; // Same as the worksheet id!
    title: string;
    content: string;
    questionsJson: string;
  };
  studentId: string;
  onChapterPassed: () => void;
}

interface DefinitionResult {
  word: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
}

export default function BookReader({ chapter, studentId, onChapterPassed }: BookReaderProps) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<DefinitionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  const words = chapter.content.split(/\s+/);

  const handleWordClick = async (word: string) => {
    // Clean word from punctuation
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").toLowerCase();
    if (!cleanWord) return;

    setActiveWord(word);
    setLoading(true);
    setDefinition(null);

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
      if (!res.ok) {
        throw new Error('Definition not found');
      }
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setDefinition(data[0]);
      }
    } catch (e) {
      console.error(e);
      // Fallback fallback definition
      setDefinition({
        word: cleanWord,
        meanings: [
          {
            partOfSpeech: 'definition',
            definitions: [{ definition: `Could not load definition for "${cleanWord}". Check internet connection.` }]
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      
      {!showCheck ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl animate-fadeIn">
          {/* Chapter Header */}
          <div className="border-b border-slate-800/80 pb-4">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-2 py-0.5 rounded border border-indigo-500/10 uppercase tracking-widest">
              Reading Club Chapter
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">{chapter.title}</h2>
          </div>

          {/* Reading text with click-to-define tokens */}
          <div className="text-slate-200 text-base md:text-lg leading-relaxed md:leading-loose text-justify font-serif flex flex-wrap gap-x-1.5 gap-y-1 p-4 bg-slate-950/20 rounded-2xl border border-slate-850/60 relative">
            {words.map((word, idx) => (
              <span
                key={idx}
                onClick={() => handleWordClick(word)}
                className="hover:text-indigo-400 cursor-pointer border-b border-transparent hover:border-indigo-500/30 transition-all active:bg-indigo-950/50 rounded px-0.5"
              >
                {word}
              </span>
            ))}
          </div>

          {/* Word Definition Card overlay */}
          {activeWord && (
            <div className="bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-5 shadow-2xl relative animate-fadeIn">
              <button
                onClick={() => setActiveWord(null)}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 font-bold text-xs"
              >
                ✕
              </button>

              {loading ? (
                <div className="flex items-center gap-2.5 py-4 justify-center text-xs text-slate-500">
                  <span className="w-4 h-4 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                  <span>Looking up "{activeWord}"...</span>
                </div>
              ) : definition ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-white capitalize">{definition.word}</span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {definition.meanings[0]?.partOfSpeech || 'word'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{definition.meanings[0]?.definitions[0]?.definition}"
                  </p>
                  
                  {definition.meanings[0]?.definitions[0]?.example && (
                    <p className="text-[10px] text-slate-500">
                      Example: <span className="text-slate-400">"{definition.meanings[0].definitions[0].example}"</span>
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Verification check launcher */}
          <div className="flex justify-center pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setShowCheck(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3 px-6 rounded-xl border border-indigo-400/20 shadow-lg shadow-indigo-500/10 transition-all cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              Finish Reading & Verify Comprehension
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-scaleUp">
          <button
            onClick={() => setShowCheck(false)}
            className="text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            ← Back to Reading
          </button>
          
          <WorksheetContainer
            studentId={studentId}
            worksheet={{
              id: chapter.id, // chapterId matches the worksheetId we seeded!
              title: `${chapter.title} - Comprehension Check`,
              tier: 'BOOK_CLUB_CHECK',
              questionsJson: chapter.questionsJson
            }}
          />
        </div>
      )}

    </div>
  );
}
