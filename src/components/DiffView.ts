import { defineComponent, h, type PropType } from "vue";

interface DiffLine {
  type: "added" | "removed" | "context";
  content: string;
}

interface DiffHunk {
  patchId: string;
  header: string;
  lines: DiffLine[];
}

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
    }
  },
  setup(props) {
    return () => {
      if (props.mode === "split") {
        return h("section", { "data-testid": "mode-split" }, [
          h("div", { "data-testid": "split-left" }, [
            ...props.hunks.flatMap((hunk) => [
              h("h3", { key: `${hunk.patchId}-left-header` }, hunk.header),
              ...hunk.lines
                .filter((line) => line.type !== "added")
                .map((line, index) => h("pre", { key: `${hunk.patchId}-left-${index}` }, line.content))
            ])
          ]),
          h("div", { "data-testid": "split-right" }, [
            ...props.hunks.flatMap((hunk) => [
              h("h3", { key: `${hunk.patchId}-right-header` }, hunk.header),
              ...hunk.lines
                .filter((line) => line.type !== "removed")
                .map((line, index) => h("pre", { key: `${hunk.patchId}-right-${index}` }, line.content))
            ])
          ])
        ]);
      }

      return h("section", { "data-testid": "mode-unified" }, [
        ...props.hunks.flatMap((hunk) => [
          h("h3", { key: `${hunk.patchId}-header` }, hunk.header),
          ...hunk.lines.map((line, index) => h("pre", { key: `${hunk.patchId}-${index}` }, line.content))
        ])
      ]);
    };
  }
});
