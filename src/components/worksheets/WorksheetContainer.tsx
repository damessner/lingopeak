'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

import MultipleChoice from './MultipleChoice';
import FillInGap from './FillInGap';
import DragAndDrop from './DragAndDrop';
import CategorySorting from './CategorySorting';
import CorrectTheMistake from './CorrectTheMistake';
import ChoiceMatrix from './ChoiceMatrix';
import Crossword from './Crossword';
import SentenceUnscramble from './SentenceUnscramble';
import MatchingPairs from './MatchingPairs';
import WordSearch from './WordSearch';
import DialogueRenderer from './DialogueRenderer';

interface WorksheetContainerProps {
  worksheet: {
    id: string;
    title: string;
    tier: string;
    questionsJson: string;
    audioUrl?: string | null;
    imageUrl?: string | null;
    videoUrl?: string | null;
    transcript?: string | null;
    isDialogue?: boolean | null;
  };
  studentId?: string; // Optional in preview
  previewMode?: boolean;
  onPreviewClose?: () => void;
}

export default function WorksheetContainer({ worksheet, studentId = '', previewMode = false, onPreviewClose }: WorksheetContainerProps) {
  const router = useRouter();
  const questions = JSON.parse(worksheet.questionsJson) as any[];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [monologueSpeaking, setMonologueSpeaking] = useState(false);

  // Coach Socratic helper state
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [drawerInput, setDrawerInput] = useState('');
  const [coachMessages, setCoachMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [coachLoading, setCoachLoading] = useState(false);
  const drawerChatEndRef = useRef<HTMLDivElement>(null);

  const activeQuestion = questions[currentIdx];

  // Auto-scroll drawer chat
  useEffect(() => {
    if (isCoachOpen) {
      drawerChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [coachMessages, coachLoading, isCoachOpen]);

  // Synchronise or seed Coach messages on opening drawer or changing questions
  useEffect(() => {
    if (isCoachOpen && activeQuestion) {
      setCoachMessages([
        {
          role: 'assistant',
          content: `Hi! I'm Coach. I see you are on question ${currentIdx + 1} (${activeQuestion.type.replace(/_/g, ' ')}). How can I help you think through this question without giving you the answer?`
        }
      ]);
    }
  }, [currentIdx, isCoachOpen]);

  const handleSendHelpQuery = async (queryText: string) => {
    if (!queryText.trim() || coachLoading) return;
    const userMsg = { role: 'user' as const, content: queryText.trim() };
    const updatedHistory = [...coachMessages, userMsg];
    setCoachMessages(updatedHistory);
    setDrawerInput('');
    setCoachLoading(true);

    try {
      const res = await fetch('/api/student/worksheet/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worksheetId: worksheet.id,
          questionIndex: currentIdx,
          studentMessage: queryText.trim(),
          history: coachMessages.filter(m => !m.content.startsWith("Hi! I'm Coach. I see you are on question"))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCoachMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('Failed to fetch Socratic hint');
      }
    } catch (err) {
      setCoachMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Sorry, I could not generate a hint. Please try again.' }
      ]);
    } finally {
      setCoachLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, val: any) => {
    setAnswers({
      ...answers,
      [questionId]: val,
    });
  };

  const calculateScore = () => {
    let correctCount = 0;
    
    questions.forEach((q) => {
      const studentAns = answers[q.id];
      if (!studentAns) return;

      switch (q.type) {
        case 'multiple_choice':
          if (studentAns === q.answer) correctCount++;
          break;
        
        case 'fill_in_gap':
          // q.text has bracket elements. Find number of brackets to check
          // e.g. "She [drives]" -> gap_0
          const gapMatches = q.text.match(/\[([^\]]+)\]/g) || [];
          let gapsCorrect = true;
          gapMatches.forEach((match: string, idx: number) => {
            const correctAns = match.slice(1, -1).trim();
            const studentVal = (studentAns[`gap_${idx}`] || '').trim();
            if (correctAns.toLowerCase() !== studentVal.toLowerCase()) {
              gapsCorrect = false;
            }
          });
          if (gapsCorrect) correctCount++;
          break;

        case 'drag_and_drop':
          let dragCorrect = true;
          let slotIdx = 0;
          q.sentences.forEach((sentence: string, sIdx: number) => {
            const matches = sentence.match(/\[([^\]]+)\]/g) || [];
            matches.forEach((match: string, mIdx: number) => {
              const correctAns = match.slice(1, -1).trim();
              const studentVal = (studentAns[`slot_${sIdx}_${mIdx}`] || '').trim();
              if (correctAns !== studentVal) {
                dragCorrect = false;
              }
            });
          });
          if (dragCorrect) correctCount++;
          break;

        case 'category_sorting':
          let sortCorrect = true;
          q.items.forEach((item: any) => {
            if (studentAns[item.text] !== item.category) {
              sortCorrect = false;
            }
          });
          if (sortCorrect) correctCount++;
          break;

        case 'correct_the_mistake':
          if (
            studentAns.selectedWord?.toLowerCase() === q.mistake.toLowerCase() &&
            studentAns.correctionText?.trim().toLowerCase() === q.correction.toLowerCase()
          ) {
            correctCount++;
          }
          break;

        case 'choice_matrix':
          let matrixCorrect = true;
          q.rows.forEach((row: string) => {
            if (studentAns[row] !== q.answers[row]) {
              matrixCorrect = false;
            }
          });
          if (matrixCorrect) correctCount++;
          break;

        case 'crossword':
          let crosswordCorrect = true;
          const gridRows = q.grid.length;
          const gridCols = q.grid[0]?.length || 0;
          for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
              if (q.grid[r][c] !== '.') {
                const cellKey = `${r}_${c}`;
                if (studentAns[cellKey] !== q.grid[r][c]) {
                  crosswordCorrect = false;
                }
              }
            }
          }
          if (crosswordCorrect) correctCount++;
          break;

        case 'sentence_unscramble':
          if (Array.isArray(studentAns) && studentAns.join(' ') === q.words.join(' ')) {
            correctCount++;
          }
          break;

        case 'matching_pairs':
          // Check if all pairs are matched
          const totalPairs = Object.keys(q.pairs).length;
          if (Array.isArray(studentAns) && studentAns.length === totalPairs) {
            correctCount++;
          }
          break;

        case 'word_search':
          const totalWords = q.words.length;
          if (Array.isArray(studentAns) && studentAns.length === totalWords) {
            correctCount++;
          }
          break;
      }
    });

    return Math.round((correctCount / questions.length) * 100);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const score = calculateScore();
    setFinalScore(score);

    if (previewMode) {
      setCompleted(true);
      if (score >= 80) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/student/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          worksheetId: worksheet.id,
          score,
          answersJson: JSON.stringify(answers),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit results');
      }

      setCompleted(true);

      // Play completion confetti for passing grade (>= 80%)
      if (score >= 80) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (e) {
      console.error(e);
      alert('Failed to log attempts. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  const renderWidget = () => {
    const props = {
      question: activeQuestion,
      value: answers[activeQuestion.id],
      onChange: (val: any) => handleAnswerChange(activeQuestion.id, val),
    };

    switch (activeQuestion.type) {
      case 'multiple_choice':
        return <MultipleChoice {...props} />;
      case 'fill_in_gap':
        return <FillInGap {...props} />;
      case 'drag_and_drop':
        return <DragAndDrop {...props} />;
      case 'category_sorting':
        return <CategorySorting {...props} />;
      case 'correct_the_mistake':
        return <CorrectTheMistake {...props} />;
      case 'choice_matrix':
        return <ChoiceMatrix {...props} />;
      case 'crossword':
        return <Crossword {...props} />;
      case 'sentence_unscramble':
        return <SentenceUnscramble {...props} />;
      case 'matching_pairs':
        return <MatchingPairs {...props} />;
      case 'word_search':
        return <WordSearch {...props} />;
      default:
        return <p className="text-slate-400 text-sm">Unsupported question type: {activeQuestion.type}</p>;
    }
  };

  if (completed) {
    const isPass = finalScore >= 80;
    return (
      <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 md:p-10 text-center mx-auto animate-scaleUp">
        <div className="text-6xl mb-4 select-none filter drop-shadow-md">
          {isPass ? '🥇' : '📝'}
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Worksheet Completed!</h2>
        <h3 className="text-indigo-400 font-bold text-sm uppercase tracking-wider mt-1">{worksheet.title}</h3>
        
        {/* Score indicator */}
        <div className="my-8 p-6 bg-slate-950/60 border border-slate-850 rounded-2xl inline-block min-w-[200px]">
          <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Your Score</span>
          <span className={`text-5xl font-black ${isPass ? 'text-emerald-400' : 'text-amber-400'}`}>
            {finalScore}%
          </span>
          <span className="block text-[10px] text-slate-400 font-semibold mt-2">
            {isPass ? 'Great job! You passed the worksheet.' : 'Keep practicing to get above 80%!'}
          </span>
        </div>

        <div className="flex gap-4 max-w-sm mx-auto">
          {previewMode ? (
            <button
              onClick={onPreviewClose}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer border border-indigo-400/20"
              style={{ minHeight: '44px' }}
            >
              Close Test Drive
            </button>
          ) : (
            <button
              onClick={() => router.push('/student/dashboard')}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer border border-indigo-400/20"
              style={{ minHeight: '44px' }}
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-850 rounded-3xl shadow-2xl p-6 md:p-8 mx-auto relative">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
        <div>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-2 py-0.5 rounded border border-indigo-500/10 uppercase tracking-widest">
            {worksheet.tier}
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">{worksheet.title}</h2>
        </div>
        
        <span className="text-xs text-slate-400 font-semibold">
          Question {currentIdx + 1} of {questions.length}
        </span>
      </div>

      {/* Media & Transcripts Area */}
      {(worksheet.imageUrl || worksheet.audioUrl || worksheet.videoUrl || worksheet.transcript) && (
        <div className="mb-6 space-y-4 p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl animate-fadeIn">
          
          {/* 1. Image Embed */}
          {worksheet.imageUrl && (
            <div className="rounded-xl overflow-hidden max-h-[220px] flex items-center justify-center bg-black/20">
              <img src={worksheet.imageUrl} alt="Prompt Image" className="max-h-[220px] object-contain" />
            </div>
          )}

          {/* 2. Audio Embed */}
          {worksheet.audioUrl && (
            <div className="p-2 bg-slate-900/50 rounded-xl flex items-center gap-3">
              <span className="text-lg">🔊</span>
              <audio src={worksheet.audioUrl} controls className="flex-1 h-9 rounded-lg" />
            </div>
          )}

          {/* 3. Video Embed */}
          {worksheet.videoUrl && (
            <div className="rounded-xl overflow-hidden bg-black/40 aspect-video max-h-[260px] mx-auto">
              <video src={worksheet.videoUrl} controls className="w-full h-full object-contain" />
            </div>
          )}

          {/* 4. Transcript Block */}
          {worksheet.transcript && (
            worksheet.isDialogue ? (
              <DialogueRenderer transcript={worksheet.transcript} />
            ) : (
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl relative">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">📝 Monologue Transcript</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
                      const synth = window.speechSynthesis;
                      if (monologueSpeaking) {
                        synth.cancel();
                        setMonologueSpeaking(false);
                      } else {
                        synth.cancel();
                        const utterance = new SpeechSynthesisUtterance(worksheet.transcript || '');
                        utterance.onend = () => setMonologueSpeaking(false);
                        utterance.onerror = () => setMonologueSpeaking(false);
                        setMonologueSpeaking(true);
                        synth.speak(utterance);
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] py-1 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{monologueSpeaking ? '🔊 Stop' : '🔈 Listen'}</span>
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{worksheet.transcript}</p>
              </div>
            )
          )}

        </div>
      )}

      {/* Dynamic Widget Area */}
      <div className="min-h-[280px] py-4">{renderWidget()}</div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-6 mt-8">
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(currentIdx - 1)}
          className="bg-slate-950/60 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
          style={{ minHeight: '40px' }}
        >
          ◀ Previous
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIdx(currentIdx + 1)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl border border-indigo-500/30 transition-all cursor-pointer"
            style={{ minHeight: '40px' }}
          >
            Next ▶
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl border border-emerald-500/30 shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
            style={{ minHeight: '40px' }}
          >
            {loading ? 'Submitting...' : 'Finish & Submit ✓'}
          </button>
        )}
      </div>
      {/* Floating Ask Coach Button */}
      {!isCoachOpen && !completed && (
        <button
          type="button"
          onClick={() => setIsCoachOpen(true)}
          className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-600/10 hover:scale-102 transition-all flex items-center gap-1.5 cursor-pointer z-40"
        >
          <span>❓ Ask Coach</span>
        </button>
      )}

      {/* Slide-over Socratic Coach Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-slate-950/95 backdrop-blur-2xl border-l border-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isCoachOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-extrabold text-sm text-white">Coach</h3>
              <p className="text-[10px] text-slate-400 font-bold">🤖 AI Coach (Worksheet Help)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCoachOpen(false)}
            className="text-slate-400 hover:text-white font-bold text-xs cursor-pointer px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Message bubble list */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-950/30">
          {coachMessages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className="text-xl flex-shrink-0 select-none">
                {m.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap border ${
                m.role === 'user'
                  ? 'bg-indigo-650 border-indigo-500/20 text-white rounded-tr-none'
                  : 'bg-slate-900 border-slate-800/80 text-slate-200 rounded-tl-none'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {coachLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="text-xl flex-shrink-0 select-none">🤖</div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={drawerChatEndRef} />
        </div>

        {/* Quick helper message triggers */}
        <div className="p-3 bg-slate-950/40 border-t border-slate-900/60 flex flex-wrap gap-2 flex-shrink-0 select-none">
          <button
            type="button"
            onClick={() => handleSendHelpQuery("I'm stuck. Can you give me a hint?")}
            className="text-[10px] font-bold bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer transition-colors"
          >
            ❓ Hint please
          </button>
          <button
            type="button"
            onClick={() => handleSendHelpQuery("Can you explain the grammar rule behind this?")}
            className="text-[10px] font-bold bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer transition-colors"
          >
            📖 Explain the rule
          </button>
        </div>

        {/* Form composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (drawerInput.trim()) {
              handleSendHelpQuery(drawerInput);
            }
          }}
          className="p-3 border-t border-slate-900 bg-slate-950 flex gap-2 items-center flex-shrink-0"
        >
          <input
            type="text"
            value={drawerInput}
            onChange={(e) => setDrawerInput(e.target.value)}
            placeholder="Ask Coach for a hint..."
            disabled={coachLoading}
            className="flex-grow bg-slate-900 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={coachLoading || !drawerInput.trim()}
            className="bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-900 text-white disabled:text-slate-600 px-4 py-2.5 rounded-xl text-xs font-extrabold border border-indigo-500/20 transition-all"
          >
            Ask
          </button>
        </form>
      </div>

    </div>
  );
}
