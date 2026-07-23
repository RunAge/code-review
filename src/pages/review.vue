<template>
  <main class="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[320px_1fr] lg:px-8" @keydown="onKeyDown" tabindex="0">
    <aside class="rounded-[1.4rem] border border-ink/20 bg-mist/90 p-5 shadow-soft backdrop-blur">
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
                ? 'border-tide/70 bg-[#313244] text-ink'
                : 'border-ink/20 bg-[#313244]/70 text-ink hover:border-ink/40'
            "
            @click="selectedFilePath = file.filePath"
          >
            <span class="block truncate">{{ file.filePath }}</span>
            <span class="mt-0.5 block text-xs" :class="file.filePath === selectedFilePath ? 'text-ink/80' : 'text-ink/60'">
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
      <header class="flex flex-wrap items-center gap-3 rounded-[1.4rem] border border-ink/20 bg-mist/90 p-4 shadow-soft backdrop-blur">
        <div class="inline-flex rounded-xl border border-ink/20 bg-[#313244] p-1">
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
            :class="mode === 'unified' ? 'bg-[#45475a] text-ink shadow' : 'text-ink/60 hover:text-ink'"
            @click="mode = 'unified'"
          >
            Unified
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
            :class="mode === 'split' ? 'bg-[#45475a] text-ink shadow' : 'text-ink/60 hover:text-ink'"
            @click="mode = 'split'"
          >
            Split
          </button>
        </div>

        <label class="ml-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
          Comments
          <select v-model="commentFilterMode" class="rounded-lg border border-ink/20 bg-[#313244] px-2 py-1.5 text-xs font-medium text-ink outline-none transition focus:border-flare/60">
            <option value="all">All</option>
            <option value="humans">Humans</option>
            <option value="bots">Bots</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </label>
      </header>

      <section class="rounded-[1.4rem] border border-ink/20 bg-mist/90 p-4 shadow-soft backdrop-blur">
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

      <section class="rounded-[1.4rem] border border-ink/20 bg-mist/90 p-4 shadow-soft backdrop-blur">
        <DiffView
          v-if="mode === 'split'"
          mode="split"
          :hunks="activeFileHunks"
          :file-path="selectedFilePath"
          :comments-tree="filteredCommentsTree"
          @comment-line="startInlineComment($event.lineNumber)"
        />
        <DiffView
          v-else
          mode="unified"
          :hunks="activeFileHunks"
          :file-path="selectedFilePath"
          :comments-tree="filteredCommentsTree"
          @comment-line="startInlineComment($event.lineNumber)"
        />

        <section
          v-if="inlineCommentLine !== null"
          class="mt-4 rounded-xl border border-ink/20 bg-mist/70 p-4"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-ink/65">
            Add inline comment · line {{ inlineCommentLine }}
          </p>
          <textarea
            v-model="inlineCommentBody"
            rows="4"
            placeholder="Write a code comment"
            class="mt-3 w-full rounded-xl border border-ink/20 bg-[#181825] px-4 py-3 text-sm text-ink outline-none transition focus:border-flare/60 focus:ring-2 focus:ring-flare/20"
          />
          <div class="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-xl bg-tide px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#11111b] transition hover:bg-tide/90"
              @click="submitInlineCommentForLine"
            >
              Add single comment
            </button>
            <button
              type="button"
              class="rounded-xl bg-flare px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#11111b] transition hover:bg-flare/90"
              @click="addInlineCommentToReview"
            >
              {{ pendingInlineComments.length > 0 ? "Add to review" : "Start review" }}
            </button>
            <button
              type="button"
              class="rounded-xl border border-ink/30 px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-ink transition hover:border-ink/50"
              @click="cancelInlineComment"
            >
              Cancel
            </button>
          </div>
        </section>
      </section>

      <p v-if="inlineCommentStatus" class="rounded-xl border border-ink/20 bg-mist/70 px-4 py-3 text-sm text-ink/90">
        {{ inlineCommentStatus }}
      </p>

      <section class="rounded-[1.4rem] border border-ink/20 bg-mist/90 p-5 shadow-soft backdrop-blur">
        <h3 class="text-lg font-semibold">Finish your review</h3>

        <section v-if="pendingInlineComments.length > 0" class="mt-3 rounded-xl border border-ink/20 bg-[#181825] p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
            Pending review comments ({{ pendingInlineComments.length }})
          </p>
          <ul class="mt-3 space-y-2">
            <li
              v-for="comment in pendingInlineComments"
              :key="`${comment.path}:${comment.line}:${comment.body}`"
              class="rounded-lg border border-ink/20 bg-[#313244] p-3"
            >
              <div class="flex items-center gap-2 text-xs text-ink/70">
                <span class="font-semibold">{{ comment.path }}</span>
                <span>line {{ comment.line }}</span>
              </div>
              <p class="mt-1 text-sm text-ink/90 whitespace-pre-wrap">{{ comment.body }}</p>
              <button
                type="button"
                class="mt-2 rounded-md border border-ink/30 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/80 transition hover:border-flare/60 hover:text-flare"
                @click="removePendingInlineComment(comment.path, comment.line, comment.body)"
              >
                Remove
              </button>
            </li>
          </ul>
        </section>

        <textarea
          v-model="reviewMessage"
          rows="4"
          placeholder="Write a summary comment"
          class="mt-3 w-full rounded-xl border border-ink/20 bg-[#313244] px-4 py-3 text-sm text-ink outline-none transition focus:border-flare/60 focus:ring-2 focus:ring-flare/20"
        />
        <div class="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-xl bg-tide px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#11111b] transition hover:bg-tide/90"
            @click="sendReviewDecision('COMMENT')"
          >
            Comment
          </button>
          <button
            type="button"
            class="rounded-xl bg-moss px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#11111b] transition hover:bg-moss/90"
            @click="sendReviewDecision('APPROVE')"
          >
            Approve
          </button>
          <button
            type="button"
            class="rounded-xl bg-flare px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#11111b] transition hover:bg-flare/90"
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
import { buildReviewPageState, type ParsedReviewFile } from "../composables/reviewPageModel";
import { handleReviewShortcut } from "../composables/useKeyboardShortcuts";
import { useAuthStore } from "../stores/authStore";
import { useReviewStore } from "../stores/reviewStore";
import {
  getFilteredCommentTree,
  loadPullRequestReviewData,
  persistHunkViewedState,
  submitInlineComment,
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
const inlineCommentLine = ref<number | null>(null);
const inlineCommentBody = ref("");
const inlineCommentStatus = ref("");
const pendingInlineComments = ref<Array<{ path: string; line: number; body: string }>>([]);

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
  inlineCommentStatus.value = "";

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

function startInlineComment(lineNumber: number) {
  inlineCommentLine.value = lineNumber;
  inlineCommentBody.value = "";
  inlineCommentStatus.value = "";
}

function cancelInlineComment() {
  inlineCommentLine.value = null;
  inlineCommentBody.value = "";
}

function addInlineCommentToReview() {
  inlineCommentStatus.value = "";

  if (!selectedFilePath.value || inlineCommentLine.value === null) {
    inlineCommentStatus.value = "Choose a line before adding a review comment.";
    return;
  }

  const body = inlineCommentBody.value.trim();
  if (!body) {
    inlineCommentStatus.value = "Comment cannot be empty.";
    return;
  }

  pendingInlineComments.value.push({
    path: selectedFilePath.value,
    line: inlineCommentLine.value,
    body
  });

  inlineCommentStatus.value = "Comment added to pending review.";
  cancelInlineComment();
}

function removePendingInlineComment(path: string, line: number, body: string) {
  const index = pendingInlineComments.value.findIndex(
    (comment) => comment.path === path && comment.line === line && comment.body === body
  );

  if (index >= 0) {
    pendingInlineComments.value.splice(index, 1);
  }
}

async function submitInlineCommentForLine() {
  inlineCommentStatus.value = "";

  if (!context.value || !authStore.token) {
    inlineCommentStatus.value = "Cannot submit inline comment without context and auth token.";
    return;
  }

  if (!selectedFilePath.value || inlineCommentLine.value === null) {
    inlineCommentStatus.value = "Choose a line before submitting a comment.";
    return;
  }

  const body = inlineCommentBody.value.trim();
  if (!body) {
    inlineCommentStatus.value = "Comment cannot be empty.";
    return;
  }

  try {
    const githubFetch = createGitHubFetch(() => authStore.token);
    await submitInlineComment(
      {
        ...context.value,
        path: selectedFilePath.value,
        line: inlineCommentLine.value,
        body
      },
      githubFetch
    );

    inlineCommentStatus.value = "Inline comment submitted.";
    cancelInlineComment();
    await loadReview();
  } catch (error) {
    inlineCommentStatus.value = error instanceof Error ? error.message : "Inline comment submit failed";
  }
}

async function sendReviewDecision(event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT") {
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
        body: reviewMessage.value.trim() || undefined,
        comments: pendingInlineComments.value
      },
      githubFetch
    );

    reviewStatusMessage.value = `Review submitted: ${event}`;
    pendingInlineComments.value = [];
    reviewMessage.value = "";
    await loadReview();
  } catch (error) {
    reviewStatusMessage.value = error instanceof Error ? error.message : "Review submit failed";
  }
}

onMounted(loadReview);
</script>
