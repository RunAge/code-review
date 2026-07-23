import { defineStore } from "pinia";

export interface ReviewHunkState {
  patchId: string;
  isViewed: boolean;
  filePath?: string;
}

interface ReviewState {
  hunks: ReviewHunkState[];
  activeIndex: number;
}

function findNextUnreadIndex(hunks: ReviewHunkState[], fromIndex: number): number {
  for (let index = fromIndex + 1; index < hunks.length; index += 1) {
    if (!hunks[index].isViewed) {
      return index;
    }
  }

  return fromIndex;
}

function findPreviousUnreadIndex(hunks: ReviewHunkState[], fromIndex: number): number {
  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    if (!hunks[index].isViewed) {
      return index;
    }
  }

  return fromIndex;
}

export const useReviewStore = defineStore("review", {
  state: (): ReviewState => ({
    hunks: [],
    activeIndex: 0
  }),
  actions: {
    setHunks(hunks: ReviewHunkState[]) {
      this.hunks = hunks;
      this.activeIndex = 0;
    },
    goToNextUnread() {
      this.activeIndex = findNextUnreadIndex(this.hunks, this.activeIndex);
    },
    goToPreviousUnread() {
      this.activeIndex = findPreviousUnreadIndex(this.hunks, this.activeIndex);
    },
    toggleActiveViewed() {
      const active = this.hunks[this.activeIndex];
      if (!active) {
        return;
      }

      active.isViewed = !active.isViewed;
    }
  }
});
