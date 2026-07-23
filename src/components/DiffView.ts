import { defineComponent, h, type PropType } from "vue";

interface DiffLine {
  type: "added" | "removed" | "context";
  content: string;
  oldLineNumber?: number | null;
  newLineNumber?: number | null;
}

interface DiffHunk {
  patchId: string;
  header: string;
  lines: DiffLine[];
}

type InlineComment = {
  id: number;
  body: string;
  authorType: "human" | "bot";
  isResolved: boolean;
};

type InlineCommentTree = Record<string, Record<number, InlineComment[]>>;

export default defineComponent({
  name: "DiffView",
  emits: {
    "comment-line": (payload: { lineNumber: number; startLine?: number; anchorId?: string }) =>
      typeof payload?.lineNumber === "number"
  },
  props: {
    mode: {
      type: String as PropType<"unified" | "split">,
      required: true
    },
    hunks: {
      type: Array as PropType<DiffHunk[]>,
      required: true
    },
    filePath: {
      type: String,
      required: false,
      default: ""
    },
    commentsTree: {
      type: Object as PropType<InlineCommentTree>,
      required: false,
      default: () => ({})
    },
    inlineCommentDraft: {
      type: Object as PropType<{
        line: number;
        startLine?: number;
        anchorId?: string;
      } | null>,
      required: false,
      default: null
    }
  },
  setup(props, { emit }) {
    function lineClass(type: DiffLine["type"]): string {
      if (type === "added") {
        return "border-l-2 border-moss/60 bg-moss/15 text-moss";
      }

      if (type === "removed") {
        return "border-l-2 border-flare/60 bg-flare/15 text-flare";
      }

      return "border-l-2 border-ink/20 bg-[#313244] text-ink/90";
    }

    function renderInlineComments(line: DiffLine) {
      if (!props.filePath || typeof line.newLineNumber !== "number") {
        return [];
      }

      const comments = props.commentsTree[props.filePath]?.[line.newLineNumber] ?? [];

      return comments.map((comment) =>
        h(
          "div",
          {
            class: "my-1 rounded-lg border border-ink/20 bg-[#313244] px-3 py-2 text-xs",
            key: `${props.filePath}-${line.newLineNumber}-${comment.id}`
          },
          [
            h(
              "small",
              { class: "font-semibold uppercase tracking-[0.12em] text-ink/55" },
              `${comment.authorType}${comment.isResolved ? " · resolved" : " · unresolved"}`
            ),
            h("p", { class: "mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/85" }, comment.body)
          ]
        )
      );
    }

    function renderHunkHeader(patchId: string, header: string, suffix = "") {
      return h(
        "h3",
        {
          class: "mb-2 mt-3 rounded-lg border border-ink/20 bg-[#313244] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink/75",
          key: `${patchId}${suffix}-header`
        },
        header
      );
    }

    function normalizeRange(startLine: number, lineNumber: number) {
      return {
        startLine: Math.min(startLine, lineNumber),
        endLine: Math.max(startLine, lineNumber)
      };
    }

    function shouldShowDraftBelow(anchorId: string): boolean {
      return props.inlineCommentDraft?.anchorId === anchorId;
    }

    function renderLine(patchId: string, line: DiffLine, index: number, suffix = "") {
      const lineKey = `${patchId}${suffix}-${index}`;
      const anchorId = `inline-anchor-${lineKey}`;
      const canComment = typeof line.newLineNumber === "number";
      const lineNumber = canComment ? (line.newLineNumber as number) : null;
      const isRangeMode = typeof props.inlineCommentDraft?.startLine === "number";

      let inDraftRange = false;
      if (lineNumber !== null && props.inlineCommentDraft) {
        const start = props.inlineCommentDraft.startLine ?? props.inlineCommentDraft.line;
        const range = normalizeRange(start, props.inlineCommentDraft.line);
        inDraftRange = lineNumber >= range.startLine && lineNumber <= range.endLine;
      }

      const row = h("div", { class: "group mb-1 flex items-start gap-2", key: lineKey }, [
        h(
          "pre",
          {
            class: `min-w-0 flex-1 overflow-x-auto rounded-md px-3 py-1.5 font-mono text-[12px] leading-relaxed ${lineClass(line.type)} ${inDraftRange ? "ring-1 ring-flare/60" : ""}`,
            "data-line-number": lineNumber ?? undefined,
            onMouseDown: canComment
              ? (event: MouseEvent) => {
                  if (event.shiftKey && props.inlineCommentDraft && typeof props.inlineCommentDraft.line === "number") {
                    emit("comment-line", {
                      lineNumber: lineNumber as number,
                      startLine: props.inlineCommentDraft.line,
                      anchorId
                    });
                    return;
                  }

                  emit("comment-line", { lineNumber: lineNumber as number, anchorId });
                }
              : undefined,
            onMouseEnter: canComment
              ? (event: MouseEvent) => {
                  if ((event.buttons & 1) !== 1 || !props.inlineCommentDraft || !isRangeMode) {
                    return;
                  }

                  emit("comment-line", {
                    lineNumber: lineNumber as number,
                    startLine: props.inlineCommentDraft.startLine,
                    anchorId
                  });
                }
              : undefined
          },
          line.content
        ),
        canComment
          ? h(
              "button",
              {
                class:
                  "mt-1 hidden rounded-md border border-ink/30 bg-[#313244] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/85 transition hover:border-flare/60 hover:text-flare group-hover:inline-block",
                type: "button",
                onClick: () =>
                  emit("comment-line", {
                    lineNumber: line.newLineNumber as number,
                    startLine: line.newLineNumber as number,
                    anchorId
                  })
              },
              "+ Comment"
            )
          : null
      ]);

      return [row, shouldShowDraftBelow(anchorId) ? h("div", { id: anchorId }) : null];
    }

    return () => {
      if (props.mode === "split") {
        return h("section", { class: "grid gap-4 lg:grid-cols-2", "data-testid": "mode-split" }, [
          h("div", { class: "rounded-xl border border-ink/20 bg-[#181825] p-3", "data-testid": "split-left" }, [
            ...props.hunks.flatMap((hunk) => [
              renderHunkHeader(hunk.patchId, hunk.header, "-left"),
              ...hunk.lines
                .filter((line) => line.type !== "added")
                .flatMap((line, index) => [...renderLine(hunk.patchId, line, index, "-left"), ...renderInlineComments(line)])
            ])
          ]),
          h("div", { class: "rounded-xl border border-ink/20 bg-[#181825] p-3", "data-testid": "split-right" }, [
            ...props.hunks.flatMap((hunk) => [
              renderHunkHeader(hunk.patchId, hunk.header, "-right"),
              ...hunk.lines
                .filter((line) => line.type !== "removed")
                .flatMap((line, index) => [...renderLine(hunk.patchId, line, index, "-right"), ...renderInlineComments(line)])
            ])
          ])
        ]);
      }

      return h("section", { class: "rounded-xl border border-ink/20 bg-[#181825] p-3", "data-testid": "mode-unified" }, [
        ...props.hunks.flatMap((hunk) => [
          renderHunkHeader(hunk.patchId, hunk.header),
          ...hunk.lines.flatMap((line, index) => [...renderLine(hunk.patchId, line, index), ...renderInlineComments(line)])
        ])
      ]);
    };
  }
});
