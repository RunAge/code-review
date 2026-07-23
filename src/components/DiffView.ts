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
    }
  },
  setup(props) {
    function lineClass(type: DiffLine["type"]): string {
      if (type === "added") {
        return "border-l-2 border-moss/70 bg-moss/10 text-moss";
      }

      if (type === "removed") {
        return "border-l-2 border-flare/70 bg-flare/10 text-red-700";
      }

      return "border-l-2 border-ink/10 bg-white text-ink/90";
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
            class: "my-1 rounded-lg border border-ink/10 bg-mist/80 px-3 py-2 text-xs",
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
          class: "mb-2 mt-3 rounded-lg border border-ink/10 bg-mist/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70",
          key: `${patchId}${suffix}-header`
        },
        header
      );
    }

    function renderLine(patchId: string, line: DiffLine, index: number, suffix = "") {
      return h(
        "pre",
        {
          class: `mb-1 overflow-x-auto rounded-md px-3 py-1.5 font-mono text-[12px] leading-relaxed ${lineClass(line.type)}`,
          key: `${patchId}${suffix}-${index}`
        },
        line.content
      );
    }

    return () => {
      if (props.mode === "split") {
        return h("section", { class: "grid gap-4 lg:grid-cols-2", "data-testid": "mode-split" }, [
          h("div", { class: "rounded-xl border border-ink/10 bg-white/70 p-3", "data-testid": "split-left" }, [
            ...props.hunks.flatMap((hunk) => [
              renderHunkHeader(hunk.patchId, hunk.header, "-left"),
              ...hunk.lines
                .filter((line) => line.type !== "added")
                .flatMap((line, index) => [
                  renderLine(hunk.patchId, line, index, "-left"),
                  ...renderInlineComments(line)
                ])
            ])
          ]),
          h("div", { class: "rounded-xl border border-ink/10 bg-white/70 p-3", "data-testid": "split-right" }, [
            ...props.hunks.flatMap((hunk) => [
              renderHunkHeader(hunk.patchId, hunk.header, "-right"),
              ...hunk.lines
                .filter((line) => line.type !== "removed")
                .flatMap((line, index) => [
                  renderLine(hunk.patchId, line, index, "-right"),
                  ...renderInlineComments(line)
                ])
            ])
          ])
        ]);
      }

      return h("section", { class: "rounded-xl border border-ink/10 bg-white/70 p-3", "data-testid": "mode-unified" }, [
        ...props.hunks.flatMap((hunk) => [
          renderHunkHeader(hunk.patchId, hunk.header),
          ...hunk.lines.flatMap((line, index) => [renderLine(hunk.patchId, line, index), ...renderInlineComments(line)])
        ])
      ]);
    };
  }
});
