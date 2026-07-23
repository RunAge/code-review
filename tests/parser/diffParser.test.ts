import { describe, expect, it } from "vitest";

import { parseUnifiedDiff } from "../../src/workers/diff/parser";

const sampleDiff = `diff --git a/src/math.ts b/src/math.ts
index 3adf3d2..9f8ac91 100644
--- a/src/math.ts
+++ b/src/math.ts
@@ -1,5 +1,5 @@
 export function sum(a: number, b: number) {
-  return a+b;
+  return a + b;
 }
 
 export const PI = 3.14;
@@ -10,3 +10,4 @@ export function mult(a: number, b: number) {
   return a * b;
 }
+

diff --git a/src/new.ts b/src/new.ts
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/src/new.ts
@@ -0,0 +1,2 @@
+export const created = true;
+`;

describe("parseUnifiedDiff", () => {
  it("parses files and hunks from raw .diff", () => {
    const result = parseUnifiedDiff(sampleDiff);

    expect(result.files).toHaveLength(2);
    expect(result.files[0].newPath).toBe("src/math.ts");
    expect(result.files[0].hunks).toHaveLength(2);
    expect(result.files[0].hunks[0].header).toBe("@@ -1,5 +1,5 @@");
    expect(result.files[0].hunks[0].lines[1].type).toBe("removed");
    expect(result.files[0].hunks[0].lines[2].type).toBe("added");

    expect(result.files[1].newPath).toBe("src/new.ts");
    expect(result.files[1].hunks).toHaveLength(1);
    expect(result.files[1].hunks[0].lines[0].type).toBe("added");
  });

  it("returns empty structure for empty input", () => {
    expect(parseUnifiedDiff("")).toEqual({ files: [] });
  });
});
