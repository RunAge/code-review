import { parseUnifiedDiff } from "./parser";
import { createPatchId } from "./patchId";

self.onmessage = async (event: MessageEvent<{ diff: string }>) => {
  const { diff } = event.data;
  const parsed = parseUnifiedDiff(diff);

  const files = await Promise.all(
    parsed.files.map(async (file) => ({
      ...file,
      hunks: await Promise.all(
        file.hunks.map(async (hunk) => ({
          ...hunk,
          patchId: await createPatchId(hunk)
        }))
      )
    }))
  );

  self.postMessage({ files });
};
