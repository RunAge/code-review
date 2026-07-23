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
    function renderInlineComments(line: DiffLine) {
      if (!props.filePath || typeof line.newLineNumber !== "number") {
        return [];
      }

      const comments = props.commentsTree[props.filePath]?.[line.newLineNumber] ?? [];

      return comments.map((comment) =>
        h("div", { class: "inline-comment", key: `${props.filePath}-${line.newLineNumber}-${comment.id}` }, [
          h("small", `${comment.authorType}${comment.isResolved ? " · resolved" : " · unresolved"}`),
          h("p", comment.body)
        ])
      );
    }

    return () => {
      if (props.mode === "split") {
        return h("section", { "data-testid": "mode-split" }, [
          h("div", { "data-testid": "split-left" }, [
            ...props.hunks.flatMap((hunk) => [
              h("h3", { key: `${hunk.patchId}-left-header` }, hunk.header),
              ...hunk.lines
                .filter((line) => line.type !== "added")
                .flatMap((line, index) => [
                  h("pre", { key: `${hunk.patchId}-left-${index}` }, line.content),
                  ...renderInlineComments(line)
                ])
            ])
          ]),
          h("div", { "data-testid": "split-right" }, [
            ...props.hunks.flatMap((hunk) => [
              h("h3", { key: `${hunk.patchId}-right-header` }, hunk.header),
              ...hunk.lines
                .filter((line) => line.type !== "removed")
                .flatMap((line, index) => [
                  h("pre", { key: `${hunk.patchId}-right-${index}` }, line.content),
                  ...renderInlineComments(line)
                ])
            ])
          ])
        ]);
      }

      return h("section", { "data-testid": "mode-unified" }, [
        ...props.hunks.flatMap((hunk) => [
          h("h3", { key: `${hunk.patchId}-header` }, hunk.header),
          ...hunk.lines.flatMap((line, index) => [
            h("pre", { key: `${hunk.patchId}-${index}` }, line.content),
            ...renderInlineComments(line)
          ])
        ])
      ]);
    };
  }
});
