export const LOG_URLS = ['https://assets.uberdesigner.ai/easylog/log-bare.webp', 'https://assets.uberdesigner.ai/easylog/log-moss.webp'] as const;
export type LogImages = [ImageBitmap, ImageBitmap];
export async function loadImages(signal: AbortSignal, onProgress: (progress: number) => void): Promise<LogImages> {
  const responses = await Promise.all(LOG_URLS.map(async url => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Image load failed: ${response.status} ${url}`);
    return response;
  }));
  const lengths = responses.map(response => Number(response.headers.get('Content-Length')));
  const byteProgress = lengths.every(length => length > 0);
  const total = lengths.reduce((a,b) => a+b,0);
  let bytes = 0, completed = 0;
  const results = await Promise.allSettled(responses.map(async response => {
    const reader = response.body?.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(new Uint8Array(value)); bytes += value.byteLength;
        if (byteProgress) onProgress(Math.min(bytes / total, 1));
      }
    }
    const bitmap = await createImageBitmap(reader ? new Blob(chunks) : await response.blob());
    completed++; onProgress(byteProgress ? Math.min(bytes / total, 1) : completed / responses.length);
    return bitmap;
  }));
  if (signal.aborted || results.some(result => result.status === 'rejected')) {
    results.forEach(result => { if (result.status === 'fulfilled') result.value.close(); });
    throw new Error(signal.aborted ? 'Image loading aborted' : 'Unable to decode log images');
  }
  return results.map(result => (result as PromiseFulfilledResult<ImageBitmap>).value) as LogImages;
}
