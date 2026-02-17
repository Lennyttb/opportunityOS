import { Logger } from './Logger';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    onRetry,
  } = options;

  const logger = Logger.getInstance();
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        logger.error(`All ${maxAttempts} retry attempts failed`, lastError);
        throw lastError;
      }

      const delay = Math.min(delayMs * Math.pow(backoffMultiplier, attempt - 1), maxDelayMs);

      logger.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`, {
        error: lastError.message,
      });

      if (onRetry) {
        onRetry(lastError, attempt);
      }

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

