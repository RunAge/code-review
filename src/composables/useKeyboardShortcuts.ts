import type { useReviewStore } from "../stores/reviewStore";

type ReviewStore = ReturnType<typeof useReviewStore>;

export function handleReviewShortcut(key: string, store: ReviewStore): void {
  const normalized = key.toLowerCase();

  if (normalized === "j") {
    store.goToNextUnread();
  }

  if (normalized === "k") {
    store.goToPreviousUnread();
  }

  if (normalized === "m") {
    store.toggleActiveViewed();
  }
}
