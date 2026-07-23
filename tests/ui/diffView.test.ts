import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DiffView from "../../src/components/DiffView";

const hunks = [
  {
    patchId: "hash_1",
    header: "@@ -1,2 +1,2 @@",
    lines: [
      { type: "removed", content: "-const a=1;" },
      { type: "added", content: "+const a = 1;" }
    ]
  }
];

describe("DiffView", () => {
  it("renders in unified mode", () => {
    const wrapper = mount(DiffView, {
      props: {
        mode: "unified",
        hunks
      }
    });

    expect(wrapper.find("[data-testid='mode-unified']").exists()).toBe(true);
    expect(wrapper.text()).toContain("@@ -1,2 +1,2 @@");
  });

  it("renders in split mode", () => {
    const wrapper = mount(DiffView, {
      props: {
        mode: "split",
        hunks
      }
    });

    expect(wrapper.find("[data-testid='mode-split']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='split-left']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='split-right']").exists()).toBe(true);
  });
});
