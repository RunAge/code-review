<template>
  <main class="review-page" @keydown="onKeyDown" tabindex="0">
    <aside class="file-tree">
      <h2>Files</h2>
      <ul>
        <li v-for="file in progress" :key="file.filePath">
          {{ file.filePath }} [{{ file.reviewed }}/{{ file.total }}]
        </li>
      </ul>
      <p v-if="noiseCount > 0">Hidden AI noise files: {{ noiseCount }}</p>
    </aside>

    <section class="diff-pane">
      <header class="toolbar">
        <button type="button" @click="mode = 'unified'">Unified</button>
        <button type="button" @click="mode = 'split'">Split</button>
      </header>

      <DiffView v-if="mode === 'split'" mode="split" :hunks="activeFileHunks" />
      <DiffView v-else mode="unified" :hunks="activeFileHunks" />

      <VirtualDiffList :items="flatVisibleHunks" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import DiffView from "../components/DiffView";
import { buildFileTreeProgress } from "../components/fileTreeProgress";
import VirtualDiffList from "../components/VirtualDiffList.vue";
import { flattenReviewHunks, buildReviewPageState, type ParsedReviewFile } from "../composables/reviewPageModel";
import { handleReviewShortcut } from "../composables/useKeyboardShortcuts";
import { useReviewStore } from "../stores/reviewStore";

const mode = ref<"unified" | "split">("unified");
const store = useReviewStore();

const demoFiles: ParsedReviewFile[] = [
  {
    newPath: "src/main.ts",
    hunks: [
      {
        patchId: "h-1",
        header: "@@ -1,1 +1,1 @@",
        lines: [
          { type: "removed", content: "-const x=1;" },
          { type: "added", content: "+const x = 1;" }
        ]
      }
    ]
  },
  {
    newPath: "src/types.gen.ts",
    hunks: [
      {
        patchId: "h-gen",
        header: "@@ -0,0 +1,1 @@",
        lines: [{ type: "added", content: "+export type T = string;" }]
      }
    ]
  }
];

const state = computed(() => buildReviewPageState(demoFiles));
const flatVisibleHunks = computed(() => flattenReviewHunks(state.value.visibleFiles));

const activeFileHunks = computed(() => {
  if (state.value.visibleFiles.length === 0) {
    return [];
  }

  return state.value.visibleFiles[0].hunks;
});

const progress = computed(() =>
  buildFileTreeProgress(
    store.hunks
      .filter((hunk): hunk is { patchId: string; isViewed: boolean; filePath: string } =>
        typeof hunk.filePath === "string"
      )
      .map((hunk) => ({ filePath: hunk.filePath, isViewed: hunk.isViewed }))
  )
);
const noiseCount = computed(() => state.value.noiseFiles.length);

function onKeyDown(event: KeyboardEvent) {
  handleReviewShortcut(event.key, store);
}

onMounted(() => {
  store.setHunks(
    flatVisibleHunks.value.map((hunk) => ({
      patchId: hunk.patchId,
      isViewed: false,
      filePath: hunk.filePath
    }))
  );
});
</script>

<style scoped>
.review-page {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  padding: 16px;
}

.file-tree {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.diff-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
}

@media (max-width: 900px) {
  .review-page {
    grid-template-columns: 1fr;
  }
}
</style>
