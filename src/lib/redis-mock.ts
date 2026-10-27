/**
 * AtomicSeat In-Memory Redis Simulation Engine
 * Implements atomic distributed locking primitives:
 * - SETNX with PX (Set if Not Exists with millisecond TTL)
 * - Atomic Lua release (check token before DEL)
 * - Automatic hold expiration via TTL verification
 * - Sub-millisecond reads matching ElastiCache/Redis specifications
 */

export interface RedisHoldRecord {
  seatId: string;
  eventId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
}

class RedisMockEngine {
  private store: Map<string, RedisHoldRecord> = new Map();

  constructor() {
    // Background garbage collection sweep for expired keys every second
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.cleanupExpired();
      }, 1000);
    }
  }

  /**
   * Generates standard cache key for seat lock
   * Key pattern: seat:lock:{eventId}:{seatId}
   */
  private makeKey(eventId: string, seatId: string): string {
    return `seat:lock:${eventId}:${seatId}`;
  }

  /**
   * Simulates: SET key token NX PX ttlMs
   * Atomically acquires hold if not currently held or if previous hold has expired.
   */
  public acquireLock(
    eventId: string,
    seatId: string,
    token: string,
    ttlMs: number = 300000 // 5 minutes standard as per project spec
  ): { success: boolean; record?: RedisHoldRecord; remainingTtlMs?: number } {
    const key = this.makeKey(eventId, seatId);
    const now = Date.now();
    const existing = this.store.get(key);

    // If key exists and is still active
    if (existing && existing.expiresAt > now) {
      // If the caller already owns this hold token, renew/maintain
      if (existing.token === token) {
        return {
          success: true,
          record: existing,
          remainingTtlMs: existing.expiresAt - now,
        };
      }
      return {
        success: false,
        remainingTtlMs: existing.expiresAt - now,
      };
    }

    // Key either does not exist or has expired -> Atomically acquire
    const record: RedisHoldRecord = {
      seatId,
      eventId,
      token,
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    this.store.set(key, record);
    return {
      success: true,
      record,
      remainingTtlMs: ttlMs,
    };
  }

  /**
   * Simulates Redis Lua script for safe atomic unlock:
   * if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end
   */
  public releaseLock(eventId: string, seatId: string, token: string): boolean {
    const key = this.makeKey(eventId, seatId);
    const existing = this.store.get(key);

    if (!existing) {
      return false; // Lock already expired or does not exist
    }

    if (existing.token === token) {
      this.store.delete(key);
      return true; // Released successfully
    }

    return false; // Token mismatch (prevent releasing another user's lock)
  }

  /**
   * Force delete lock (used by admin or when booking is confirmed)
   */
  public deleteLock(eventId: string, seatId: string): void {
    const key = this.makeKey(eventId, seatId);
    this.store.delete(key);
  }

  /**
   * Inspect current hold status
   */
  public getLock(eventId: string, seatId: string): RedisHoldRecord | null {
    const key = this.makeKey(eventId, seatId);
    const record = this.store.get(key);
    if (!record) return null;

    if (record.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return record;
  }

  /**
   * Get all active holds for an event
   */
  public getActiveHoldsForEvent(eventId: string): Map<string, RedisHoldRecord> {
    const now = Date.now();
    const eventHolds = new Map<string, RedisHoldRecord>();

    for (const [key, record] of this.store.entries()) {
      if (record.eventId === eventId) {
        if (record.expiresAt > now) {
          eventHolds.set(record.seatId, record);
        } else {
          this.store.delete(key);
        }
      }
    }

    return eventHolds;
  }

  /**
   * Periodic eviction of expired holds
   */
  public cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset store (for testing/demo)
   */
  public flushAll(): void {
    this.store.clear();
  }
}

// Preserve singleton across Next.js hot module reloads
const globalForRedis = globalThis as unknown as {
  redisMockInstance?: RedisMockEngine;
};

export const redisMock = globalForRedis.redisMockInstance || new RedisMockEngine();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisMockInstance = redisMock;
}
