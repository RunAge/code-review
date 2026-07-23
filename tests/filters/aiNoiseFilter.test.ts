import { describe, expect, it } from "vitest";

import { classifyAiNoise, shouldCollapseHunk } from "../../src/filters/aiNoiseFilter";

describe("aiNoiseFilter", () => {
  it("classifies generated and lock files as noise", () => {
    expect(classifyAiNoise("pnpm-lock.yaml")).toBe("noise");
    expect(classifyAiNoise("src/types.gen.ts")).toBe("noise");
    expect(classifyAiNoise("db/schema.sql")).toBe("noise");
    expect(classifyAiNoise("src/feature.ts")).toBe("relevant");
  });

  it("collapses pure import reorder or formatting hunks", () => {
    const importOnly = [
      "-import { b } from './b'",
      "+import { b } from \"./b\""
    ];

    const formattingOnly = [
      "-  return a+b;",
      "+  return a + b;"
    ];

    const logicChange = [
      "-  return a + b;",
      "+  return a + b + 1;"
    ];

    expect(shouldCollapseHunk(importOnly)).toBe(true);
    expect(shouldCollapseHunk(formattingOnly)).toBe(true);
    expect(shouldCollapseHunk(logicChange)).toBe(false);
  });
});
