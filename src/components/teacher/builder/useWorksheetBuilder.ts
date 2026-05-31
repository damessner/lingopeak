'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Question, Category, QuestionType, Worksheet } from '@/lib/worksheet-types';

interface UseWorksheetBuilderProps {
  categories: Category[];
  worksheet: Worksheet | null;
}

export function useWorksheetBuilder({ categories, worksheet }: UseWorksheetBuilderProps) {
  const wsId = worksheet?.id || 'new';
  const localStorageKey = `lingopeak_worksheet_draft_${wsId}`;

  // Core form states
  const [title, setTitle] = useState(worksheet?.title || '');
  const [categoryId, setCategoryId] = useState(worksheet?.category_id || categories[0]?.id || '');
  const [tier, setTier] = useState<'EXPLORER' | 'VOYAGER' | 'CHALLENGER' | 'SUMMIT'>(worksheet?.tier || 'EXPLORER');
  const [badgeEmoji, setBadgeEmoji] = useState(worksheet?.badge_emoji || '🥇');

  // Media attachment states
  const [audioUrl, setAudioUrl] = useState(worksheet?.audio_url || '');
  const [imageUrl, setImageUrl] = useState(worksheet?.image_url || '');
  const [videoUrl, setVideoUrl] = useState(worksheet?.video_url || '');

  // Parse initial questions helper
  const parseQuestions = useCallback((questionsJson?: string): Question[] => {
    if (!questionsJson) return [];
    try {
      const parsed = JSON.parse(questionsJson);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((q: any) => {
        const mapped = { ...q };
        if (q.type === 'drag_and_drop') {
          const correctWords: string[] = [];
          (q.sentences || []).forEach((s: string) => {
            const normalized = s.replace(/#([^#]+)#/g, '[$1]');
            const matches = normalized.match(/\[([^\]]+)\]/g) || [];
            matches.forEach(m => correctWords.push(m.slice(1, -1).trim()));
          });
          const allWords = q.words || [];
          const distractors = allWords.filter((w: string) => !correctWords.includes(w));
          mapped.distractors = distractors;
          mapped.distractors_raw = distractors.join(', ');
        } else if (q.type === 'category_sorting') {
          mapped.categories_raw = (q.categories || []).join(', ');
        } else if (q.type === 'choice_matrix') {
          mapped.rows_raw = (q.rows || []).join(', ');
          mapped.columns_raw = (q.columns || []).join(', ');
        } else if (q.type === 'crossword') {
          mapped.crossword_items = q.crossword_items || (q.clues || []).map((c: any) => {
            let word = '';
            for (let i = 0; i < c.length; i++) {
              const r = c.direction === 'across' ? c.row : c.row + i;
              const col = c.direction === 'across' ? c.col + i : c.col;
              word += q.grid[r]?.[col] || '';
            }
            return { word, clue: c.text };
          });
        } else if (q.type === 'word_search') {
          mapped.word_search_words = (q.words || []).join(', ');
        }
        return mapped;
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  // History State for Undo/Redo
  const initialQuestions = parseQuestions(worksheet?.questions_json);
  const [history, setHistory] = useState<Question[][]>([initialQuestions]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const questions = history[historyIndex] || [];

  const setQuestions = useCallback((newQuestions: Question[] | ((prev: Question[]) => Question[])) => {
    setHistory(prevHistory => {
      const currentQuestions = prevHistory[historyIndex] || [];
      const resolvedQuestions = typeof newQuestions === 'function' ? newQuestions(currentQuestions) : newQuestions;
      
      // If questions haven't changed, don't add to history
      if (JSON.stringify(resolvedQuestions) === JSON.stringify(currentQuestions)) {
        return prevHistory;
      }
      
      const updatedHistory = prevHistory.slice(0, historyIndex + 1);
      setHistoryIndex(updatedHistory.length);
      return [...updatedHistory, resolvedQuestions];
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history.length]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Draft States
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<any>(null);

  // Check for existing drafts on load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawDraft = localStorage.getItem(localStorageKey);
    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft);
        if (parsed && parsed.timestamp && parsed.questions) {
          // Verify that draft is actually different from DB worksheet state
          const dbJson = worksheet?.questions_json || '[]';
          const draftJson = JSON.stringify(parsed.questions);
          const isDifferent = dbJson !== draftJson || 
                              (worksheet?.title || '') !== parsed.title ||
                              (worksheet?.category_id || '') !== parsed.categoryId ||
                              (worksheet?.tier || 'EXPLORER') !== parsed.tier ||
                              (worksheet?.badge_emoji || '🥇') !== parsed.badgeEmoji ||
                              (worksheet?.audio_url || '') !== (parsed.audioUrl || '') ||
                              (worksheet?.image_url || '') !== (parsed.imageUrl || '') ||
                              (worksheet?.video_url || '') !== (parsed.videoUrl || '');

          if (isDifferent) {
            setHasDraft(true);
            setDraftTime(new Date(parsed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setDraftData(parsed);
          }
        }
      } catch (e) {
        console.error('Error loading draft', e);
      }
    }
  }, [localStorageKey, worksheet]);

  // Autosave timer
  const lastSavedState = useRef<string>('');
  useEffect(() => {
    const currentState = JSON.stringify({ title, categoryId, tier, badgeEmoji, audioUrl, imageUrl, videoUrl, questions });
    lastSavedState.current = currentState;

    const interval = setInterval(() => {
      // Don't save if there are no changes vs initial and no questions
      const isInitial = title === (worksheet?.title || '') &&
                        categoryId === (worksheet?.category_id || categories[0]?.id || '') &&
                        tier === (worksheet?.tier || 'EXPLORER') &&
                        badgeEmoji === (worksheet?.badge_emoji || '🥇') &&
                        audioUrl === (worksheet?.audio_url || '') &&
                        imageUrl === (worksheet?.image_url || '') &&
                        videoUrl === (worksheet?.video_url || '') &&
                        questions.length === initialQuestions.length &&
                        JSON.stringify(questions) === JSON.stringify(initialQuestions);

      if (isInitial) return;

      const draftObj = {
        title,
        categoryId,
        tier,
        badgeEmoji,
        audioUrl,
        imageUrl,
        videoUrl,
        questions,
        timestamp: Date.now()
      };
      localStorage.setItem(localStorageKey, JSON.stringify(draftObj));
    }, 30000);

    return () => clearInterval(interval);
  }, [title, categoryId, tier, badgeEmoji, audioUrl, imageUrl, videoUrl, questions, localStorageKey, worksheet, categories, initialQuestions]);

  const recoverDraft = useCallback(() => {
    if (!draftData) return;
    setTitle(draftData.title || '');
    setCategoryId(draftData.categoryId || '');
    setTier(draftData.tier || 'EXPLORER');
    setBadgeEmoji(draftData.badgeEmoji || '🥇');
    setAudioUrl(draftData.audioUrl || '');
    setImageUrl(draftData.imageUrl || '');
    setVideoUrl(draftData.videoUrl || '');
    
    // Reset history stack with recovered questions
    setHistory([draftData.questions]);
    setHistoryIndex(0);
    
    setHasDraft(false);
  }, [draftData]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(localStorageKey);
    setHasDraft(false);
    setDraftTime(null);
    setDraftData(null);
  }, [localStorageKey]);

  const isDirty = !(
    title === (worksheet?.title || '') &&
    categoryId === (worksheet?.category_id || categories[0]?.id || '') &&
    tier === (worksheet?.tier || 'EXPLORER') &&
    badgeEmoji === (worksheet?.badge_emoji || '🥇') &&
    audioUrl === (worksheet?.audio_url || '') &&
    imageUrl === (worksheet?.image_url || '') &&
    videoUrl === (worksheet?.video_url || '') &&
    questions.length === initialQuestions.length &&
    JSON.stringify(questions) === JSON.stringify(initialQuestions)
  );

  return {
    title,
    setTitle,
    categoryId,
    setCategoryId,
    tier,
    setTier,
    badgeEmoji,
    setBadgeEmoji,
    audioUrl,
    setAudioUrl,
    imageUrl,
    setImageUrl,
    videoUrl,
    setVideoUrl,
    questions,
    setQuestions,
    undo,
    redo,
    canUndo,
    canRedo,
    hasDraft,
    draftTime,
    recoverDraft,
    discardDraft,
    localStorageKey,
    isDirty
  };
}
