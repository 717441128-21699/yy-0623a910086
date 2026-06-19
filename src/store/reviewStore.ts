import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CaseReview } from '@/types';

interface ReviewState {
  reviews: CaseReview[];
  addReview: (review: CaseReview) => void;
  isReviewed: (patientId: string) => boolean;
  getReview: (patientId: string) => CaseReview | undefined;
}

const STORAGE_KEY = 'ortho-qc-reviews';

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],

      addReview: (review: CaseReview) => {
        set((state) => {
          const existing = state.reviews.find((r) => r.patientId === review.patientId);
          if (existing) {
            return {
              reviews: state.reviews.map((r) =>
                r.patientId === review.patientId ? review : r
              ),
            };
          }
          return {
            reviews: [review, ...state.reviews],
          };
        });
      },

      isReviewed: (patientId: string) => {
        return get().reviews.some((r) => r.patientId === patientId);
      },

      getReview: (patientId: string) => {
        return get().reviews.find((r) => r.patientId === patientId);
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
