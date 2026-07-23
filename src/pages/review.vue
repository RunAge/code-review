<template>
  <main class="review-page" @keydown="onKeyDown" tabindex="0">
    <aside class="file-tree">
      <h2>Files</h2>
      <p class="context">{{ contextLabel }}</p>
      <ul>
        <li v-for="file in progress" :key="file.filePath">
          <button
            type="button"
            class="file-button"
            :class="{ active: file.filePath === selectedFilePath }"
            @click="selectedFilePath = file.filePath"
          >
            {{ file.filePath }} [{{ file.reviewed }}/{{ file.total }}]
          </button>
        </li>
      </ul>
      <p v-if="noiseCount > 0">Hidden AI noise files: {{ noiseCount }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </aside>

    <section class="diff-pane">
      <header class="toolbar">
        <button type="button" @click="mode = 'unified'">Unified</button>
        <button type="button" @click="mode = 'split'">Split</button>

        <label>
          Comments
          <select v-model="commentFilterMode">
            <option value="all">All</option>
            <option value="humans">Humans</option>
            <option value="bots">Bots</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </label>
      </header>

      <p v-if="isLoading">Loading pull request data...</p>

      <DiffView
        v-if="mode === 'split'"
        mode="split"
        :hunks="activeFileHunks"
        :file-path="selectedFilePath"
        :comments-tree="filteredCommentsTree"
      />
      <DiffView
        v-else
        mode="unified"
        :hunks="activeFileHunks"
        :file-path="selectedFilePath"
        :comments-tree="filteredCommentsTree"
      />

      <VirtualDiffList :items="flatVisibleHunks" />

      <section class="review-actions">
        <h3>Submit Review</h3>
        <textarea v-model="reviewMessage" rows="4" placeholder="Optional review message" />
        <div class="buttons">
          <button type="button" @click="sendReviewDecision('APPROVE')">Approve</button>
          <button type="button" @click="sendReviewDecision('REQUEST_CHANGES')">Request changes</button>
        </div>
        <p v-if="reviewStatusMessage">{{ reviewStatusMessage }}</p>
      </section>
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
import { useAuthStore } from "../stores/authStore";
import { useReviewStore } from "../stores/reviewStore";
import {
  getFilteredCommentTree,
  loadPullRequestReviewData,
  persistHunkViewedState,
  submitReviewDecision,
  type PullRequestContext,
  type ReviewCommentTree
} from "../review/loadReviewData";
import { createGitHubFetch } from "../utils/github/api";
import type { CommentFilterMode } from "../comments/commentFilters";

const mode = ref<"unified" | "split">("unified");
const commentFilterMode = ref<CommentFilterMode>("all");
const isLoading = ref(false);
const errorMessage = ref("");
const reviewStatusMessage = ref("");
const reviewMessage = ref("");

const route = useRoute();
const authStore = useAuthStore();
const store = useReviewStore();

const parsedFiles = ref<ParsedReviewFile[]>([]);
const commentsTree = ref<ReviewCommentTree>({});
const selectedFilePath = ref("");

const context = computed<PullRequestContext | null>(() => {
  const owner = route.query.owner;
  const repo = route.query.repo;
  const pull = route.query.pr;

  if (typeof owner !== "string" || typeof repo !== "string" || typeof pull !== "string") {
    return null;
  }

  const pullNumber = Number.parseInt(pull, 10);
  if (!Number.isFinite(pullNumber)) {
    return null;
  }

  return {
    owner,
    repo,
    pullNumber
  };
});

const contextLabel = computed(() => {
  if (!context.value) {
    return "Set query params: ?owner=<owner>&repo=<repo>&pr=<number>";
  }

  return `${context.value.owner}/${context.value.repo}#${context.value.pullNumber}`;
});

const state = computed(() => buildReviewPageState(parsedFiles.value));
const flatVisibleHunks = computed(() => flattenReviewHunks(state.value.visibleFiles));
const filteredCommentsTree = computed(() => getFilteredCommentTree(commentsTree.value, commentFilterMode.value));

const activeFileHunks = computed(() => {
  if (!selectedFilePath.value) {
    return [];
  }

  const file = state.value.visibleFiles.find((item) => item.newPath === selectedFilePath.value);
  if (!file) {
    return [];
  }

  return file.hunks;
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

function getActiveStoreHunk() {
  return store.hunks[store.activeIndex] ?? null;
}

async function onKeyDown(event: KeyboardEvent) {
  const before = getActiveStoreHunk();
  handleReviewShortcut(event.key, store);

  if (event.key.toLowerCase() !== "m") {
    return;
  }

  if (!context.value) {
    return;
  }

  const after = before ?? getActiveStoreHunk();
  if (!after?.filePath) {
    return;
  }

  await persistHunkViewedState({
    pullNumber: context.value.pullNumber,
    filePath: after.filePath,
    patchId: after.patchId,
    isViewed: after.isViewed
  });
}

async function loadReview() {
  errorMessage.value = "";
  reviewStatusMessage.value = "";

  if (!context.value) {
    return;
  }

  if (!authStore.token) {
    errorMessage.value = "Authentication token missing. Use /auth/login first.";
    return;
  }

  isLoading.value = true;

  try {
    const githubFetch = createGitHubFetch(() => authStore.token);
    const loaded = await loadPullRequestReviewData(context.value, githubFetch);

    parsedFiles.value = loaded.files;
    commentsTree.value = loaded.commentsTree;
    store.setHunks(
      loaded.hunks.map((hunk) => ({
        patchId: hunk.patchId,
        isViewed: hunk.isViewed,
        filePath: hunk.filePath
      }))
    );

    selectedFilePath.value = loaded.hunks[0]?.filePath ?? "";
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Failed to load review data";
  } finally {
    isLoading.value = false;
  }
}

async function sendReviewDecision(event: "APPROVE" | "REQUEST_CHANGES") {
  reviewStatusMessage.value = "";

  if (!context.value || !authStore.token) {
    reviewStatusMessage.value = "Cannot submit review without context and auth token.";
    return;
  }

  try {
    const githubFetch = createGitHubFetch(() => authStore.token);
    await submitReviewDecision(
      {
        ...context.value,
        event,
        body: reviewMessage.value.trim() || undefined
      },
      githubFetch
    );

    reviewStatusMessage.value = `Review submitted: ${event}`;
  } catch (error) {
    reviewStatusMessage.value = error instanceof Error ? error.message : "Review submit failed";
  }
}

onMounted(loadReview);
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
  align-items: center;
  flex-wrap: wrap;
}

.file-button {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 4px 0;
}

.file-button.active {
  font-weight: 700;
}

.review-actions {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.buttons {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.error {
  color: #b91c1c;
}

.context {
  font-size: 12px;
  color: #4b5563;
}

@media (max-width: 900px) {
  .review-page {
    grid-template-columns: 1fr;
  }
}
</style>
