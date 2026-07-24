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
  authorLogin: string;
  isResolved: boolean;
};

type InlineCommentTree = Record<string, Record<number, InlineComment[]>>;

export default defineComponent({
  name: "DiffView",
  emits: {
    "comment-line": (payload: {
      lineNumber: number;
      startLine?: number;
      anchorId?: string;
      action?: "start" | "end";
    }) => typeof payload?.lineNumber === "number",
  },
  props: {
    mode: {
      type: String as PropType<"unified" | "split">,
      required: true,
    },
    hunks: {
      type: Array as PropType<DiffHunk[]>,
      required: true,
    },
    filePath: {
      type: String,
      required: false,
      default: "",
    },
    commentsTree: {
      type: Object as PropType<InlineCommentTree>,
      required: false,
      default: () => ({}),
    },
    inlineCommentDraft: {
      type: Object as PropType<{
        line: number;
        startLine?: number;
        anchorId?: string;
      } | null>,
      required: false,
      default: null,
    },
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

      const comments =
        props.commentsTree[props.filePath]?.[line.newLineNumber] ?? [];

      function renderLinkedBody(body: string) {
        const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const lines = body.split("\n");

        return lines.flatMap((lineText, lineIndex) => {
          const nodes: ReturnType<typeof h>[] = [];
          let cursor = 0;

          for (const match of lineText.matchAll(markdownLinkRegex)) {
            const start = match.index ?? 0;
            const end = start + match[0].length;

            if (start > cursor) {
              const plainChunk = lineText.slice(cursor, start);
              nodes.push(
                ...plainChunk.split(urlRegex).map((chunk, idx) => {
                  if (/^https?:\/\//.test(chunk)) {
                    return h(
                      "a",
                      {
                        key: `auto-${lineIndex}-${start}-${idx}`,
                        href: chunk,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        class:
                          "text-tide underline decoration-tide/50 hover:text-flare",
                      },
                      chunk
                    );
                  }

                  return h(
                    "span",
                    { key: `plain-${lineIndex}-${start}-${idx}` },
                    chunk
                  );
                })
              );
            }

            nodes.push(
              h(
                "a",
                {
                  key: `md-${lineIndex}-${start}`,
                  href: match[2],
                  target: "_blank",
                  rel: "noopener noreferrer",
                  class:
                    "text-tide underline decoration-tide/50 hover:text-flare",
                },
                match[1]
              )
            );

            cursor = end;
          }

          if (cursor < lineText.length || lineText.length === 0) {
            const trailing = lineText.slice(cursor);
            nodes.push(
              ...trailing.split(urlRegex).map((chunk, idx) => {
                if (/^https?:\/\//.test(chunk)) {
                  return h(
                    "a",
                    {
                      key: `trail-link-${lineIndex}-${idx}`,
                      href: chunk,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      class:
                        "text-tide underline decoration-tide/50 hover:text-flare",
                    },
                    chunk
                  );
                }

                return h(
                  "span",
                  { key: `trail-text-${lineIndex}-${idx}` },
                  chunk
                );
              })
            );
          }

          if (lineIndex < lines.length - 1) {
            nodes.push(h("br", { key: `br-${lineIndex}` }));
          }

          return nodes;
        });
      }

      return comments.map((comment) =>
        h(
          "div",
          {
            class:
              "my-1 rounded-lg border border-ink/20 bg-[#313244] px-3 py-2 text-xs",
            key: `${props.filePath}-${line.newLineNumber}-${comment.id}`,
          },
          [
            h(
              "small",
              {
                class: "font-semibold uppercase tracking-[0.12em] text-ink/55",
              },
              `${comment.authorLogin} · ${comment.authorType}${
                comment.isResolved ? " · resolved" : " · unresolved"
              }`
            ),
            h(
              "p",
              {
                class:
                  "mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/85",
              },
              renderLinkedBody(comment.body)
            ),
          ]
        )
      );
    }

    function renderHunkHeader(patchId: string, header: string, suffix = "") {
      return h(
        "h3",
        {
          class:
            "mb-2 mt-3 rounded-lg border border-ink/20 bg-[#313244] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink/75",
          key: `${patchId}${suffix}-header`,
        },
        header
      );
    }

    function normalizeRange(startLine: number, lineNumber: number) {
      return {
        startLine: Math.min(startLine, lineNumber),
        endLine: Math.max(startLine, lineNumber),
      };
    }

    function shouldShowDraftBelow(anchorId: string): boolean {
      return props.inlineCommentDraft?.anchorId === anchorId;
    }

    function renderLine(
      patchId: string,
      line: DiffLine,
      index: number,
      suffix = ""
    ) {
      const lineKey = `${patchId}${suffix}-${index}`;
      const anchorId = `inline-anchor-${lineKey}`;
      const canComment = typeof line.newLineNumber === "number";
      const lineNumber = canComment ? (line.newLineNumber as number) : null;

      let inDraftRange = false;
      if (lineNumber !== null && props.inlineCommentDraft) {
        const start =
          props.inlineCommentDraft.startLine ?? props.inlineCommentDraft.line;
        const range = normalizeRange(start, props.inlineCommentDraft.line);
        inDraftRange =
          lineNumber >= range.startLine && lineNumber <= range.endLine;
      }

      const row = h(
        "div",
        { class: "group mb-1 flex items-start gap-2", key: lineKey },
        [
          canComment
            ? h(
                "button",
                {
                  class:
                    "mt-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded border border-ink/30 bg-[#313244] text-xs font-bold text-ink/80 transition hover:border-tide hover:text-tide group-hover:inline-flex",
                  type: "button",
                  title: "Select range start",
                  onClick: () =>
                    emit("comment-line", {
                      lineNumber: line.newLineNumber as number,
                      startLine: line.newLineNumber as number,
                      anchorId,
                      action: "start",
                    }),
                },
                "+"
              )
            : h("span", { class: "inline-block w-6 shrink-0" }),
          h(
            "pre",
            {
              class: `min-w-0 flex-1 whitespace-pre-wrap break-words rounded-md px-3 py-1.5 font-mono text-[12px] leading-relaxed ${lineClass(
                line.type
              )} ${inDraftRange ? "ring-1 ring-flare/60" : ""}`,
              "data-line-number": lineNumber ?? undefined,
              "data-anchor-id": anchorId,
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
                      startLine:
                        props.inlineCommentDraft?.startLine ??
                        props.inlineCommentDraft?.line ??
                        (line.newLineNumber as number),
                      anchorId,
                      action: "end",
                    }),
                },
                "Comment"
              )
            : null,
        ]
      );

      return [
        row,
        shouldShowDraftBelow(anchorId) ? h("div", { id: anchorId }) : null,
      ];
    }

    return () => {
      if (props.mode === "split") {
        return h(
          "section",
          { class: "grid gap-4 lg:grid-cols-2", "data-testid": "mode-split" },
          [
            h(
              "div",
              {
                class: "rounded-xl border border-ink/20 bg-[#181825] p-3",
                "data-testid": "split-left",
              },
              [
                ...props.hunks.flatMap((hunk) => [
                  renderHunkHeader(hunk.patchId, hunk.header, "-left"),
                  ...hunk.lines
                    .filter((line) => line.type !== "added")
                    .flatMap((line, index) => [
                      ...renderLine(hunk.patchId, line, index, "-left"),
                      ...renderInlineComments(line),
                    ]),
                ]),
              ]
            ),
            h(
              "div",
              {
                class: "rounded-xl border border-ink/20 bg-[#181825] p-3",
                "data-testid": "split-right",
              },
              [
                ...props.hunks.flatMap((hunk) => [
                  renderHunkHeader(hunk.patchId, hunk.header, "-right"),
                  ...hunk.lines
                    .filter((line) => line.type !== "removed")
                    .flatMap((line, index) => [
                      ...renderLine(hunk.patchId, line, index, "-right"),
                      ...renderInlineComments(line),
                    ]),
                ]),
              ]
            ),
          ]
        );
      }

      return h(
        "section",
        {
          class: "rounded-xl border border-ink/20 bg-[#181825] p-3",
          "data-testid": "mode-unified",
        },
        [
          ...props.hunks.flatMap((hunk) => [
            renderHunkHeader(hunk.patchId, hunk.header),
            ...hunk.lines.flatMap((line, index) => [
              ...renderLine(hunk.patchId, line, index),
              ...renderInlineComments(line),
            ]),
          ]),
        ]
      );
    };
  },
});
