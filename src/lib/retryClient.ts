import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

/**
 * Wake-up-tolerant requests for Render-free hosting ($0, zero deps).
 * Sleeping services answer wake-up calls with 502/503/timeouts — retry with
 * backoff instead of surfacing a dead error toast.
 *
 * Only idempotent GETs retry by default. Pass { retryWrites: true } solely
 * for calls that are safe to repeat server-side.
 */

const BACKOFF_MS = [1000, 3000, 8000];
const RETRY_STATUS = new Set([0, 408, 429, 500, 502, 503, 504]);

export interface RetryOptions {
  retries?: number;
  timeout?: number;
  retryWrites?: boolean;
  onRetry?: (attempt: number, waitMs: number) => void;
}

function statusOf(error: any): number {
  if (error?.code === 'ECONNABORTED') return 408;
  if (error?.message === 'Network Error' && !error?.response) return 0;
  return error?.response?.status ?? 0;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function requestWithRetry<T = any>(
  config: AxiosRequestConfig & { _retried?: boolean },
  opts: RetryOptions = {}
): Promise<AxiosResponse<T>> {
  const method = (config.method || 'get').toLowerCase();
  const safe = method === 'get' || method === 'head' || method === 'options' || !!opts.retryWrites;
  const maxRetries = Math.min(opts.retries ?? 3, BACKOFF_MS.length);

  let attempt = 0;
  for (;;) {
    try {
      return await axios({ timeout: opts.timeout ?? 15000, ...config });
    } catch (error: any) {
      // User navigated away — never retry a cancelled request.
      if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') throw error;
      const retryable = safe && RETRY_STATUS.has(statusOf(error));
      if (!retryable || attempt >= maxRetries) throw error;
      const wait = BACKOFF_MS[attempt];
      attempt++;
      opts.onRetry?.(attempt, wait);
      await sleep(wait);
    }
  }
}

/** GET with wake-up retries. Drop-in for axios.get in load paths. */
export function getWithRetry<T = any>(url: string, config?: AxiosRequestConfig, opts?: RetryOptions) {
  return requestWithRetry<T>({ ...config, method: 'get', url }, opts);
}
