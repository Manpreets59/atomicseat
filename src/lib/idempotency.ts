/**
 * AtomicSeat Idempotency Engine
 * Guarantees that duplicate requests (due to retries, network glitches, or double-clicks)
 * resolve to the exact same outcome without creating duplicate transactions or double bookings.
 */

export interface IdempotencyEntry {
  key: string;
  status: 'PENDING' | 'RESOLVED' | 'FAILED';
  createdAt: number;
  responsePayload?: unknown;
}

class IdempotencyEngine {
  private cache: Map<string, IdempotencyEntry> = new Map();

  /**
   * Checks if an idempotency key is already recorded.
   * If RESOLVED, returns the cached response.
   * If PENDING, flags that an identical transaction is currently in-flight (preventing concurrent duplicates).
   */
  public check(key: string): {
    exists: boolean;
    status?: 'PENDING' | 'RESOLVED' | 'FAILED';
    responsePayload?: unknown;
  } {
    const entry = this.cache.get(key);
    if (!entry) {
      return { exists: false };
    }
    return {
      exists: true,
      status: entry.status,
      responsePayload: entry.responsePayload,
    };
  }

  /**
   * Locks the idempotency key as PENDING before starting execution
   */
  public acquire(key: string): boolean {
    const existing = this.cache.get(key);
    if (existing) {
      return false; // Already in-flight or completed
    }

    this.cache.set(key, {
      key,
      status: 'PENDING',
      createdAt: Date.now(),
    });
    return true;
  }

  /**
   * Resolves the idempotency key with the final confirmed booking response
   */
  public resolve(key: string, responsePayload: unknown): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.status = 'RESOLVED';
      entry.responsePayload = responsePayload;
    } else {
      this.cache.set(key, {
        key,
        status: 'RESOLVED',
        createdAt: Date.now(),
        responsePayload,
      });
    }
  }

  /**
   * Flags the key as failed if the transaction encountered an unrecoverable error
   */
  public fail(key: string, reason: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.status = 'FAILED';
      entry.responsePayload = { error: reason };
    }
  }

  /**
   * Reset the store
   */
  public clear(): void {
    this.cache.clear();
  }
}

const globalForIdempotency = globalThis as unknown as {
  idempotencyEngineInstance?: IdempotencyEngine;
};

export const idempotencyEngine =
  globalForIdempotency.idempotencyEngineInstance || new IdempotencyEngine();

if (process.env.NODE_ENV !== 'production') {
  globalForIdempotency.idempotencyEngineInstance = idempotencyEngine;
}
