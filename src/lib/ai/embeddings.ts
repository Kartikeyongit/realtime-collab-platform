/**
 * Isomorphic embeddings module — deliberately NO 'use client' directive.
 * Reason: server routes import EMBED_DIMS from here. With 'use client',
 * Next.js hands server code a client-reference proxy where the constant is
 * `undefined`, silently failing every vector validation (384 !== undefined).
 * The module is server-safe: browser APIs are touched only inside functions
 * that client components call (guarded by `typeof window`), never at top level.
 *
 * Browser-only embeddings via transformers.js from CDN ($0).
 * - Never bundled: dynamic `import()` through `new Function` so webpack
 *   leaves it alone (and it can never run on the server/Render anyway).
 * - Model + ONNX runtime cached by the browser after first download (~90MB).
 * - MiniLM-L6-v2 → 384 dims, matching the `vector(384)` column.
 */

export const EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBED_DIMS = 384;
// esm.sh: resolves the package's browser field + node polyfills correctly.
// (jsdelivr +esm leaves broken relative onnxruntime imports — verified.)
const CDN = 'https://esm.sh/@xenova/transformers@2.17.2';
const LOAD_TIMEOUT_MS = 90000;

type Extractor = (texts: string[], opts?: any) => Promise<any>;

let extractorPromise: Promise<Extractor> | null = null;
let loadError: string | null = null;

async function loadExtractor(
  onProgress?: (pct: number, stage: string) => void
): Promise<Extractor> {
  if (extractorPromise) return extractorPromise;
  if (typeof window === 'undefined') {
    throw new Error('Embeddings only run in the browser');
  }
  extractorPromise = (async () => {
    onProgress?.(2, 'Loading AI engine…');
    // eslint-disable-next-line no-new-func
    const importPromise = new Function('u', 'return import(u)')(CDN) as Promise<any>;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI engine download timed out (CDN slow/blocked)')), LOAD_TIMEOUT_MS)
    );
    const mod = await Promise.race([importPromise, timeout]);
    if (!mod || typeof mod.pipeline !== 'function') {
      throw new Error('AI engine loaded but has no usable pipeline export');
    }
    mod.env.allowLocalModels = false;
    onProgress?.(8, 'Downloading memory model (one-time, ~90MB)…');
    const extractor = await mod.pipeline('feature-extraction', EMBED_MODEL, {
      progress_callback: (info: any) => {
        if (info?.status === 'progress' && typeof info.progress === 'number') {
          onProgress?.(8 + Math.round(info.progress * 0.8), 'Downloading memory model (one-time, ~90MB)…');
        }
      },
    });
    onProgress?.(92, 'Warming up…');
    // Warmup so first real batch isn't the slow one.
    await extractor(['warmup'], { pooling: 'mean', normalize: true });
    onProgress?.(100, 'Ready');
    return extractor as Extractor;
  })().catch((err) => {
    extractorPromise = null;
    loadError = err?.message || 'Failed to load AI engine';
    throw err;
  });
  return extractorPromise;
}

export function embeddingLoadError(): string | null {
  return loadError;
}

/** Embed texts → L2-normalized 384-dim vectors. Batches to stay smooth. */
export async function embedTexts(
  texts: string[],
  onProgress?: (done: number, total: number) => void
): Promise<number[][]> {
  const extractor = await loadExtractor();
  return embedWith(extractor, texts, onProgress);
}

async function embedWith(
  extractor: Extractor,
  texts: string[],
  onProgress?: (done: number, total: number) => void
): Promise<number[][]> {
  const out: number[][] = [];
  const BATCH = 8;
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const tensor = await extractor(batch, { pooling: 'mean', normalize: true });
    const rows: number[][] = tensor.tolist();
    if (!Array.isArray(rows) || rows.length !== batch.length || rows.some((r) => r.length !== EMBED_DIMS)) {
      throw new Error('Unexpected embedding shape from AI engine');
    }
    out.push(...rows);
    onProgress?.(Math.min(i + BATCH, texts.length), texts.length);
  }
  return out;
}

/** Describe exactly what's wrong with a batch of vectors (null = healthy). */
export function describeEmbeddingProblem(vecs: unknown, expectedCount: number): string | null {
  if (!Array.isArray(vecs)) return `engine returned ${typeof vecs} instead of an array`;
  if (vecs.length !== expectedCount) {
    return `engine returned ${vecs.length} vectors for ${expectedCount} texts`;
  }
  for (let k = 0; k < vecs.length; k++) {
    const v = vecs[k] as unknown;
    if (!Array.isArray(v)) return `vector ${k} is ${typeof v}, not an array`;
    if (v.length !== EMBED_DIMS) return `vector ${k} has ${v.length} dims, expected ${EMBED_DIMS}`;
    for (let j = 0; j < v.length; j++) {
      if (typeof v[j] !== 'number' || !Number.isFinite(v[j] as number)) {
        return `vector ${k} has non-finite value at position ${j}`;
      }
    }
  }
  return null;
}

/** Embed with engine-load progress folded into one callback (0..100). */
export async function embedTextsWithLoadProgress(
  texts: string[],
  onProgress?: (pct: number, stage: string, done?: number, total?: number) => void
): Promise<number[][]> {
  const extractor = await loadExtractor((pct, stage) => onProgress?.(Math.min(pct, 90), stage));
  return embedWith(extractor, texts, (done, total) =>
    onProgress?.(90 + Math.round((done / Math.max(total, 1)) * 10), `Embedding ${done}/${total}…`, done, total)
  );
}
