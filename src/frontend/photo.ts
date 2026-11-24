// photo.ts — the one place a picked photo is resized before it leaves the browser.
//
// The twin of the phone's `shrink` (`src/mobile/lib/capture.ts`, in the app repo): same longest
// edge, same JPEG re-encode, both read from the server's `Limits` (ieat-app#3421): a web upload and
// a phone upload are the same billed analysis and two sizes would be two cost/accuracy profiles.
// 768 px was the measured knee — a 960×1280 frame costs ~1200 vision tokens where 576×768 ~436.
//
// The re-encode also narrows what the server is ever asked to refuse: a browser that decodes HEIC
// (Safari) sends JPEG out the other side instead of eating the 415, and a format the browser
// cannot decode falls back to the original file for the server's own sniff to answer.

/** The frame a w×h image is drawn into: the longest edge capped at `edge`, aspect kept. */
export function fitWithin(
  width: number, height: number, edge: number,
): { width: number; height: number } {
  const scale = edge / Math.max(width, height);
  return scale >= 1
    ? { width, height }
    : { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * One picked file as it should go up: at most `edge` px on the long edge (the server's
 * `Limits.photoMaxEdge`), JPEG at `quality` (`Limits.photoCompression`) — ieat-app#3421, both read by
 * the caller so the values sent on the form and the values the bytes were made at can never disagree. A file already
 * small enough is returned untouched, and anything the browser cannot decode — or canvas refuses —
 * is too: the upload proceeds with the original bytes and the server's `imageMime` sniff answers
 * for it, exactly as before this step existed.
 */
export async function shrinkPhoto(file: File, quality: number, edge: number): Promise<File> {
  // A server that predates the edge sends none: NaN dimensions would fail silently inside the canvas.
  if (!Number.isFinite(edge)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const { width, height } = fitWithin(bitmap.width, bitmap.height, edge);
      if (width === bitmap.width && height === bitmap.height) return file;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx === null) return file;
      // JPEG has no alpha — a transparent PNG composited on nothing reads as black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
      if (blob === null) return file;
      return new File([blob], file.name.replace(/\.[^.]*$/, "") + ".jpg", { type: "image/jpeg" });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}

/** Every picked file, resized in parallel — several files are angles of one meal. */
export function shrinkPhotos(files: File[], quality: number, edge: number): Promise<File[]> {
  return Promise.all(files.map((f) => shrinkPhoto(f, quality, edge)));
}

/**
 * The `compression` or `maxEdge` value a send of `shrunk` may report: `value` when EVERY file was re-encoded
 * at it, `undefined` when anything went up untouched — a pick already inside the edge, or one
 * the browser could not decode (ieat-app#3421). Claiming the coefficient for bytes it was never
 * applied to would mislabel the meal's provenance, the whole point of the field; `undefined`
 * leaves it null, which is the truth.
 */
export function appliedAt(files: readonly File[], shrunk: readonly File[], value: number): number | undefined {
  return shrunk.every((s, i) => s !== files[i]) ? value : undefined;
}
