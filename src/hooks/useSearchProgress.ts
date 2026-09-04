'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export const SEARCH_STAGES = [
  { threshold: 0, text: 'Decomposing query & domain constraints...' },
  { threshold: 22, text: 'Querying Kaggle & Hugging Face datasets...' },
  { threshold: 50, text: 'Searching academic papers & model weights...' },
  { threshold: 72, text: 'Cross-encoder ranking & deduplication...' },
  { threshold: 88, text: 'Synthesizing AI rationale & hardware specs...' },
  { threshold: 99, text: 'Finalizing intelligence telemetry...' },
  { threshold: 100, text: 'Analysis complete!' },
];

export interface UseSearchProgressReturn {
  progress: number;
  stage: string;
  startProgress: () => void;
  completeProgress: () => Promise<void>;
  resetProgress: () => void;
}

export function useSearchProgress(): UseSearchProgressReturn {
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getStageForProgress = (pct: number) => {
    let currentStage = SEARCH_STAGES[0].text;
    for (const item of SEARCH_STAGES) {
      if (pct >= item.threshold) {
        currentStage = item.text;
      }
    }
    return currentStage;
  };

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetProgress = useCallback(() => {
    clearTimer();
    setProgress(0);
    setStage('');
  }, [clearTimer]);

  const startProgress = useCallback(() => {
    clearTimer();
    const initialProgress = 8;
    setProgress(initialProgress);
    setStage(getStageForProgress(initialProgress));

    // Smooth interval ticker
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        let inc = 0;
        if (prev < 25) {
          // Fast start: ~2.5% per 80ms (~1s to 25%)
          inc = Math.random() * 1.5 + 2.0;
        } else if (prev < 55) {
          // Exploring hubs: ~1.4% per 80ms (~1.7s to 55%)
          inc = Math.random() * 1.0 + 1.0;
        } else if (prev < 78) {
          // Ranking & models: ~0.8% per 80ms (~2.3s to 78%)
          inc = Math.random() * 0.6 + 0.6;
        } else if (prev < 90) {
          // Telemetry: ~0.4% per 80ms (~2.4s to 90%)
          inc = Math.random() * 0.3 + 0.3;
        } else if (prev < 95) {
          // Asymptote near 95% until server returns
          inc = 0.12;
        } else {
          // Cap at 96% until complete is triggered
          return 96;
        }

        const next = Math.min(96, prev + inc);
        setStage(getStageForProgress(next));
        return next;
      });
    }, 80);
  }, [clearTimer]);

  const completeProgress = useCallback((): Promise<void> => {
    clearTimer();
    setProgress(100);
    setStage('Analysis complete!');

    return new Promise((resolve) => {
      // Brief pause at 100% so the user sees the complete state
      setTimeout(() => {
        resolve();
      }, 350);
    });
  }, [clearTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    progress,
    stage,
    startProgress,
    completeProgress,
    resetProgress,
  };
}

export default useSearchProgress;
