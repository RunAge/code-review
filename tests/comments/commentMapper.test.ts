import { describe, expect, it } from "vitest";

import { mapCommentsToFileTree } from "../../src/comments/commentMapper";

describe("comment mapper", () => {
  it("maps raw GitHub comments to file-line tree", () => {
    const mapped = mapCommentsToFileTree([
      {
        id: 1,
        path: "src/a.ts",
        line: 10,
        body: "Please rename this",
        user: { login: "alice", type: "User" }
      },
      {
        id: 2,
        path: "src/a.ts",
        line: 10,
        body: "Done",
        user: { login: "bot-ai", type: "Bot" }
      },
      {
        id: 3,
        path: "src/b.ts",
        line: 3,
        body: "Looks good",
        user: { login: "bob", type: "User" }
      }
    ]);

    expect(Object.keys(mapped)).toEqual(["src/a.ts", "src/b.ts"]);
    expect(mapped["src/a.ts"][10]).toHaveLength(2);
    expect(mapped["src/b.ts"][3][0].body).toBe("Looks good");
  });
});
