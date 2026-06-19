import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Feedback, FeedbackStatus } from '@/types';
import { feedbacks as mockFeedbacks } from '@/mock/feedbacks';

interface FeedbackState {
  feedbacks: Feedback[];
  addFeedback: (feedback: Feedback) => void;
  updateFeedbackStatus: (id: string, status: FeedbackStatus, reply?: string) => void;
}

const STORAGE_KEY = 'ortho-qc-feedbacks';

const getInitialFeedbacks = (): Feedback[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.feedbacks?.length) {
        return parsed.state.feedbacks;
      }
    }
  } catch {
    // ignore
  }
  return mockFeedbacks;
};

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set) => ({
      feedbacks: getInitialFeedbacks(),

      addFeedback: (feedback: Feedback) => {
        set((state) => ({
          feedbacks: [feedback, ...state.feedbacks],
        }));
      },

      updateFeedbackStatus: (id: string, status: FeedbackStatus, reply?: string) => {
        set((state) => ({
          feedbacks: state.feedbacks.map((f) => {
            if (f.id !== id) return f;
            return {
              ...f,
              status,
              ...(reply ? { reply, replyAt: new Date().toLocaleString('zh-CN') } : {}),
            };
          }),
        }));
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
