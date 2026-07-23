import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useReviewStore } from "../../src/stores/reviewStore";
import { handleReviewShortcut } from "../../src/composables/useKeyboardShortcuts";

describe("keyboard shortcuts", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("J and K navigate between unread hunks, M marks active hunk", () => {
    const store = useReviewStore();

    store.setHunks([
      { patchId: "a", isViewed: false },
      { patchId: "b", isViewed: false },
      { patchId: "c", isViewed: true },
    ]);

    expect(store.activeIndex).toBe(0);

    handleReviewShortcut("j", store);
    expect(store.activeIndex).toBe(1);

    handleReviewShortcut("k", store);
    expect(store.activeIndex).toBe(0);

    handleReviewShortcut("m", store);
    expect(store.hunks[0].isViewed).toBe(true);
  });
});
