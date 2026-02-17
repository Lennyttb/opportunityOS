import { retry, sleep } from './retry';
import { Logger } from './Logger';

jest.mock('./Logger');

describe('retry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Logger.getInstance = jest.fn().mockReturnValue({
      warn: jest.fn(),
      error: jest.fn(),
    });
  });

  describe('successful execution', () => {
    it('should return result on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return result after retries', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const result = await retry(fn, { maxAttempts: 3, delayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('failed execution', () => {
    it('should throw error after max attempts', async () => {
      const error = new Error('persistent failure');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(retry(fn, { maxAttempts: 3, delayMs: 10 })).rejects.toThrow(
        'persistent failure'
      );

      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('retry options', () => {
    it('should respect maxAttempts option', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(retry(fn, { maxAttempts: 5, delayMs: 10 })).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(5);
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const error = new Error('fail');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      await retry(fn, { maxAttempts: 3, delayMs: 10, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(error, 1);
      expect(onRetry).toHaveBeenCalledWith(error, 2);
    });

    it('should apply exponential backoff', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const start = Date.now();
      await retry(fn, {
        maxAttempts: 3,
        delayMs: 100,
        backoffMultiplier: 2,
      });
      const duration = Date.now() - start;

      // First retry: 100ms, second retry: 200ms = ~300ms total
      expect(duration).toBeGreaterThanOrEqual(250);
      expect(duration).toBeLessThan(500);
    });

    it('should respect maxDelayMs', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const start = Date.now();
      await retry(fn, {
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 10,
        maxDelayMs: 50,
      });
      const duration = Date.now() - start;

      // Both retries should be capped at 50ms
      expect(duration).toBeLessThan(200);
    });
  });
});

describe('sleep', () => {
  it('should sleep for specified duration', async () => {
    const start = Date.now();
    await sleep(100);
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThanOrEqual(90);
    expect(duration).toBeLessThan(150);
  });
});

