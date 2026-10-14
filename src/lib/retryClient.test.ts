import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';
import { requestWithRetry, getWithRetry } from './retryClient';

vi.mock('axios');
const mocked = axios as unknown as ReturnType<typeof vi.fn>;

function netError() {
  const e: any = new Error('Network Error');
  e.message = 'Network Error';
  return e;
}

function statusError(status: number) {
  const e: any = new Error(`HTTP ${status}`);
  e.response = { status };
  return e;
}

describe('requestWithRetry', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('returns on first success without waiting', async () => {
    vi.useFakeTimers();
    mocked.mockResolvedValueOnce({ data: 'ok' });
    const p = requestWithRetry({ method: 'get', url: '/x' });
    await vi.runAllTimersAsync();
    await expect(p).resolves.toEqual({ data: 'ok' });
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it('retries 502s with backoff then succeeds', async () => {
    vi.useFakeTimers();
    mocked.mockRejectedValueOnce(statusError(502)).mockResolvedValueOnce({ data: 'woke' });
    const seen: number[] = [];
    const p = requestWithRetry({ method: 'get', url: '/x' }, { onRetry: (_a, w) => seen.push(w) });
    await vi.runAllTimersAsync();
    await expect(p).resolves.toEqual({ data: 'woke' });
    expect(mocked).toHaveBeenCalledTimes(2);
    expect(seen).toEqual([1000]);
  });

  it('gives up after max retries and rethrows', async () => {
    vi.useFakeTimers();
    mocked.mockRejectedValue(statusError(503));
    const p = requestWithRetry({ method: 'get', url: '/x' }, { retries: 2 }).catch((e) => e);
    await vi.runAllTimersAsync();
    const err = await p;
    expect(err?.response?.status).toBe(503);
    expect(mocked).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('never retries unsafe methods unless opted in', async () => {
    vi.useFakeTimers();
    mocked.mockRejectedValue(statusError(502));
    const p1 = requestWithRetry({ method: 'post', url: '/x' }).catch((e) => e);
    await vi.runAllTimersAsync();
    await p1;
    expect(mocked).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    mocked.mockRejectedValueOnce(statusError(502)).mockResolvedValueOnce({ data: 1 });
    const p2 = requestWithRetry({ method: 'post', url: '/x' }, { retryWrites: true });
    await vi.runAllTimersAsync();
    await expect(p2).resolves.toEqual({ data: 1 });
    expect(mocked).toHaveBeenCalledTimes(2);
  });

  it('does not retry 4xx client errors', async () => {
    vi.useFakeTimers();
    mocked.mockRejectedValue(statusError(404));
    const p = requestWithRetry({ method: 'get', url: '/x' }).catch((e) => e);
    await vi.runAllTimersAsync();
    await p;
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it('getWithRetry delegates as GET', async () => {
    vi.useFakeTimers();
    mocked.mockResolvedValueOnce({ data: [] });
    const p = getWithRetry('/docs');
    await vi.runAllTimersAsync();
    await expect(p).resolves.toEqual({ data: [] });
    expect(mocked).toHaveBeenCalledWith(expect.objectContaining({ method: 'get', url: '/docs' }));
  });
});
