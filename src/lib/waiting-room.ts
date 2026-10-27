/**
 * AtomicSeat Virtual Waiting Room Engine
 * Implements a FIFO queue with rate-limited admission tokens to protect APIs from flash-crowd saturation.
 */

export interface WaitingUser {
  sessionId: string;
  enqueuedAt: number;
  admittedAt?: number;
  admittedToken?: string;
}

class WaitingRoomEngine {
  private queue: string[] = []; // Session IDs in order
  private userMeta: Map<string, WaitingUser> = new Map();
  private maxActiveAdmitted: number = 200; // Simulated capacity
  private currentlyActive: number = 0;
  private isWaitingRoomActive: boolean = false; // Can be toggled for flash crowd simulation

  public setQueueStatus(enabled: boolean): void {
    this.isWaitingRoomActive = enabled;
  }

  public isEnabled(): boolean {
    return this.isWaitingRoomActive;
  }

  /**
   * Enqueue or check status of a user in the waiting room
   */
  public checkOrJoin(sessionId: string): {
    inQueue: boolean;
    queuePosition: number;
    estimatedWaitSeconds: number;
    token?: string;
    isAdmitted: boolean;
  } {
    if (!this.isWaitingRoomActive) {
      return {
        inQueue: false,
        queuePosition: 0,
        estimatedWaitSeconds: 0,
        isAdmitted: true,
      };
    }

    const existing = this.userMeta.get(sessionId);
    if (existing && existing.admittedToken) {
      return {
        inQueue: false,
        queuePosition: 0,
        estimatedWaitSeconds: 0,
        token: existing.admittedToken,
        isAdmitted: true,
      };
    }

    let index = this.queue.indexOf(sessionId);
    if (index === -1) {
      this.queue.push(sessionId);
      this.userMeta.set(sessionId, {
        sessionId,
        enqueuedAt: Date.now(),
      });
      index = this.queue.length - 1;
    }

    // Auto-admit top of queue if below active threshold
    if (index < 5 && this.currentlyActive < this.maxActiveAdmitted) {
      const admittedToken = `ADMIT-${sessionId.slice(-6)}-${Date.now()}`;
      const record = this.userMeta.get(sessionId)!;
      record.admittedAt = Date.now();
      record.admittedToken = admittedToken;
      this.queue = this.queue.filter(id => id !== sessionId);
      this.currentlyActive++;

      return {
        inQueue: false,
        queuePosition: 0,
        estimatedWaitSeconds: 0,
        token: admittedToken,
        isAdmitted: true,
      };
    }

    const queuePosition = index + 1;
    const estimatedWaitSeconds = Math.ceil(queuePosition * 1.5);

    return {
      inQueue: true,
      queuePosition,
      estimatedWaitSeconds,
      isAdmitted: false,
    };
  }

  /**
   * Release session slot
   */
  public releaseSession(sessionId: string): void {
    this.queue = this.queue.filter(id => id !== sessionId);
    this.userMeta.delete(sessionId);
    if (this.currentlyActive > 0) {
      this.currentlyActive--;
    }
  }

  public reset(): void {
    this.queue = [];
    this.userMeta.clear();
    this.currentlyActive = 0;
  }
}

const globalForQueue = globalThis as unknown as {
  waitingRoomEngineInstance?: WaitingRoomEngine;
};

export const waitingRoomEngine =
  globalForQueue.waitingRoomEngineInstance || new WaitingRoomEngine();

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.waitingRoomEngineInstance = waitingRoomEngine;
}
