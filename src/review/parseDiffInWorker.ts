import type { DiffFile } from "../workers/diff/types";

export interface ParsedHunkFromWorker {
  header: string;
  patchId: string;
  lines: DiffFile["hunks"][number]["lines"];
}

export interface ParsedFileFromWorker {
  oldPath: string;
  newPath: string;
  hunks: ParsedHunkFromWorker[];
}

export async function parseDiffInWorker(
  diff: string
): Promise<ParsedFileFromWorker[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/diff/worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (
      event: MessageEvent<{ files: ParsedFileFromWorker[] }>
    ) => {
      worker.terminate();
      resolve(event.data.files);
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(event.error ?? new Error("Diff worker failed"));
    };

    worker.postMessage({ diff });
  });
}
