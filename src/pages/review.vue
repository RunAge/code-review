<template>
  <main class="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[320px_1fr] lg:px-8" @keydown="onKeyDown" tabindex="0">
    <aside class="rounded-[1.4rem] border border-ink/10 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div class="mb-4 border-b border-ink/10 pb-4">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Pull Request</p>
        <h2 class="mt-2 text-2xl font-bold">Files</h2>
        <p class="mt-1 text-xs text-ink/60">{{ contextLabel }}</p>
      </div>

      <ul class="max-h-[58vh] space-y-2 overflow-auto pr-1">
        <li v-for="file in progress" :key="file.filePath">
          <button
            type="button"
            class="w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition"
            :class="
              file.filePath === selectedFilePath
                ? 'border-ink/60 bg-ink text-white'
                : 'border-ink/10 bg-mist/70 text-ink hover:border-ink/30'
            "
            @click="selectedFilePath = file.filePath"
          >
            <span class="block truncate">{{ file.filePath }}</span>
            <span class="mt-0.5 block text-xs" :class="file.filePath === selectedFilePath ? 'text-white/75' : 'text-ink/60'">
              {{ file.reviewed }}/{{ file.total }} reviewed
            </span>
          </button>
        </li>
      </ul>

      <p v-if="noiseCount > 0" class="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
        Hidden AI noise files: {{ noiseCount }}
      </p>
      <p v-if="errorMessage" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
        {{ errorMessage }}
      </p>
    </aside>

    <section class="space-y-5">
      <header class="flex flex-wrap items-center gap-3 rounded-[1.4rem] border border-ink/10 bg-white/90 p-4 shadow-soft backdrop-blur">
        <div class="inline-flex rounded-xl border border-ink/15 bg-mist/75 p-1">
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
            :class="mode === 'unified' ? 'bg-white text-ink shadow' : 'text-ink/60 hover:text-ink'"
            @click="mode = 'unified'"
          >
            Unified
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
            :class="mode === 'split' ? 'bg-white text-ink shadow' : 'text-ink/60 hover:text-ink'"
            @click="mode = 'split'"
          >
            Split
          </button>
        </div>

        <label class="ml-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
          Comments
          <select v-model="commentFilterMode" class="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-xs font-medium text-ink outline-none transition focus:border-flare/50">
            <option value="all">All</option>
            <option value="humans">Humans</option>
            <option value="bots">Bots</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </label>
      </header>

      <section class="rounded-[1.4rem] border border-ink/10 bg-white/90 p-4 shadow-soft backdrop-blur">
        <div class="flex flex-wrap items-center gap-3">
          <p class="text-sm font-semibold text-ink">Viewed Changes</p>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
            :class="activeHunk?.isViewed ? 'bg-moss/15 text-moss' : 'bg-flare/15 text-flare'"
          >
            {{ activeHunk?.isViewed ? "Viewed" : "Not viewed" }}
          </span>
          <button
            type="button"
            class="ml-auto rounded-xl border border-ink/15 bg-mist/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition hover:border-ink/35"
            :disabled="!activeHunk"
            :class="!activeHunk ? 'cursor-not-allowed opacity-50' : ''"
            @click="toggleViewedForActiveHunk"
          >
            {{ activeHunk?.isViewed ? "Mark as not viewed" : "Mark as viewed" }}
          </button>
        </div>
        <p class="mt-3 text-xs text-ink/65">
          Shortcuts: J = next unread, K = previous unread, M = toggle viewed.
        </p>
      </section>

      <p v-if="isLoading" class="rounded-xl border border-tide/20 bg-tide/10 px-4 py-3 text-sm font-medium text-tide">
        Loading pull request data...
      </p>

      <section class="rounded-[1.4rem] border border-ink/10 bg-white/90 p-4 shadow-soft backdrop-blur">
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
      </section>

      <VirtualDiffList :items="flatVisibleHunks" />

      <section class="rounded-[1.4rem] border border-ink/10 bg-white/90 p-5 shadow-soft backdrop-blur">
        <h3 class="text-lg font-semibold">Submit Review</h3>
        <textarea
          v-model="reviewMessage"
          rows="4"
          placeholder="Optional review message"
          class="mt-3 w-full rounded-xl border border-ink/15 bg-mist/70 px-4 py-3 text-sm text-ink outline-none transition focus:border-flare/60 focus:ring-2 focus:ring-flare/20"
        />
        <div class="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-xl bg-moss px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-moss/90"
            @click="sendReviewDecision('APPROVE')"
          >
            Approve
          </button>
          <button
            type="button"
            class="rounded-xl bg-flare px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-flare/90"
            @click="sendReviewDecision('REQUEST_CHANGES')"
          >
            Request changes
          </button>
        </div>
        <p v-if="reviewStatusMessage" class="mt-4 rounded-xl border border-ink/10 bg-mist/70 px-4 py-3 text-sm text-ink/85">
          {{ reviewStatusMessage }}
        </p>
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
const activeHunk = computed(() => store.hunks[store.activeIndex] ?? null);

function getActiveStoreHunk() {
  return store.hunks[store.activeIndex] ?? null;
}

async function persistViewedStateForActiveHunk() {
  if (!context.value) {
    return;
  }

  const active = getActiveStoreHunk();
  if (!active?.filePath) {
    return;
  }

  await persistHunkViewedState({
    pullNumber: context.value.pullNumber,
    filePath: active.filePath,
    patchId: active.patchId,
    isViewed: active.isViewed
  });
}

async function toggleViewedForActiveHunk() {
  store.toggleActiveViewed();
  await persistViewedStateForActiveHunk();
}

async function onKeyDown(event: KeyboardEvent) {
  handleReviewShortcut(event.key, store);

  if (event.key.toLowerCase() !== "m") {
    return;
  }

  await persistViewedStateForActiveHunk();
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
