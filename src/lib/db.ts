import { Event, Seat, SeatTier } from '@/types';

/**
 * AtomicSeat Persistent Storage Engine (Simulating DynamoDB / PostgreSQL with Optimistic Locking)
 * Implements Conditional Writes with version stamps to eliminate double-booking.
 */

export interface BookingRecord {
  bookingId: string;
  reference: string;
  eventId: string;
  seatId: string;
  customerName: string;
  customerEmail: string;
  confirmedAt: number;
  securityHash: string;
  idempotencyKey: string;
}

class DatabaseEngine {
  private events: Map<string, Event> = new Map();
  private seats: Map<string, Seat> = new Map();
  private bookings: Map<string, BookingRecord> = new Map();

  // Audit log of double bookings (used in naive demonstration mode)
  private doubleBookingAnomalies: Array<{
    seatId: string;
    bookingIds: string[];
    customers: string[];
    timestamp: number;
  }> = [];

  constructor() {
    this.seedDatabase();
  }

  public seedDatabase(): void {
    this.events.clear();
    this.seats.clear();
    this.bookings.clear();
    this.doubleBookingAnomalies = [];

    const sampleEvents: Event[] = [
      {
        id: 'event-coldplay-2026',
        title: 'Coldplay: Music of the Spheres Tour',
        subtitle: 'High-Demand Flash On-Sale (Stadium Arena)',
        venue: 'PCA International Stadium, Mohali',
        date: 'Nov 14, 2026',
        time: '19:30 IST',
        category: 'Concert',
        totalSeats: 120,
        availableSeats: 120,
        heldSeats: 0,
        bookedSeats: 0,
        tags: ['High Concurrency', 'Stadium Tour', 'Flash Crowd'],
      },
      {
        id: 'event-champions-trophy',
        title: 'ICC Champions Trophy 2026: Grand Final',
        subtitle: 'Championship Match - Extreme Traffic Burst',
        venue: 'Mohali Cricket Arena, Punjab',
        date: 'Dec 06, 2026',
        time: '14:00 IST',
        category: 'Sports',
        totalSeats: 120,
        availableSeats: 120,
        heldSeats: 0,
        bookedSeats: 0,
        tags: ['Cricket', 'Championship', 'Peak Contention'],
      },
      {
        id: 'event-tech-summit-ikgptu',
        title: 'Global AI & Cloud Distributed Systems Summit',
        subtitle: 'IKGPTU Mohali Campus-1 Keynote Hall',
        venue: 'Main Auditorium, IKGPTU Mohali Campus-1',
        date: 'Oct 30, 2026',
        time: '10:00 IST',
        category: 'Tech Conference',
        totalSeats: 96,
        availableSeats: 96,
        heldSeats: 0,
        bookedSeats: 0,
        tags: ['Distributed Systems', 'Cloud Native', 'Keynote'],
      },
    ];

    for (const ev of sampleEvents) {
      this.events.set(ev.id, ev);
      this.generateSeatsForEvent(ev);
    }
  }

  private generateSeatsForEvent(event: Event): void {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = event.id === 'event-tech-summit-ikgptu' ? 12 : 15;

    let availableCount = 0;

    for (const row of rows) {
      let tier: SeatTier = 'GENERAL';
      let price = 1500;

      if (row === 'A' || row === 'B') {
        tier = 'VIP';
        price = 6500;
      } else if (row === 'C' || row === 'D' || row === 'E') {
        tier = 'PREMIUM';
        price = 3500;
      } else {
        tier = 'GENERAL';
        price = 1500;
      }

      for (let num = 1; num <= seatsPerRow; num++) {
        const seatId = `${event.id}_${row}${num}`;
        const label = `${row}${num}`;

        const seat: Seat = {
          id: seatId,
          eventId: event.id,
          row,
          number: num,
          label,
          tier,
          price,
          status: 'AVAILABLE',
          version: 1, // Base optimistic locking version
          heldBy: null,
          holdExpiresAt: null,
          confirmedBy: null,
          confirmedAt: null,
        };

        this.seats.set(seatId, seat);
        availableCount++;
      }
    }

    event.totalSeats = availableCount;
    event.availableSeats = availableCount;
    event.heldSeats = 0;
    event.bookedSeats = 0;
  }

  public getEvents(): Event[] {
    return Array.from(this.events.values()).map(event => {
      this.recalculateEventCounts(event.id);
      return this.events.get(event.id)!;
    });
  }

  public getEvent(eventId: string): Event | null {
    this.recalculateEventCounts(eventId);
    return this.events.get(eventId) || null;
  }

  public getSeatsForEvent(eventId: string): Seat[] {
    const eventSeats: Seat[] = [];
    for (const seat of this.seats.values()) {
      if (seat.eventId === eventId) {
        eventSeats.push({ ...seat });
      }
    }
    return eventSeats;
  }

  public getSeat(seatId: string): Seat | null {
    const seat = this.seats.get(seatId);
    return seat ? { ...seat } : null;
  }

  /**
   * Recalculates seat statistics for an event
   */
  public recalculateEventCounts(eventId: string): void {
    const event = this.events.get(eventId);
    if (!event) return;

    let available = 0;
    let held = 0;
    let booked = 0;

    for (const seat of this.seats.values()) {
      if (seat.eventId === eventId) {
        if (seat.status === 'AVAILABLE') available++;
        else if (seat.status === 'HELD') held++;
        else if (seat.status === 'BOOKED') booked++;
      }
    }

    event.availableSeats = available;
    event.heldSeats = held;
    event.bookedSeats = booked;
  }

  /**
   * Updates seat state to HELD
   */
  public markSeatHeld(
    seatId: string,
    holdToken: string,
    expiresAt: number
  ): { success: boolean; seat?: Seat } {
    const seat = this.seats.get(seatId);
    if (!seat) return { success: false };

    seat.status = 'HELD';
    seat.heldBy = holdToken;
    seat.holdExpiresAt = expiresAt;
    seat.version += 1;

    this.recalculateEventCounts(seat.eventId);
    return { success: true, seat: { ...seat } };
  }

  /**
   * Releases a held seat back to AVAILABLE
   */
  public releaseSeatHold(seatId: string, holdToken?: string): boolean {
    const seat = this.seats.get(seatId);
    if (!seat) return false;

    if (seat.status !== 'HELD') return false;

    // If holdToken provided, verify ownership
    if (holdToken && seat.heldBy && seat.heldBy !== holdToken) {
      return false;
    }

    seat.status = 'AVAILABLE';
    seat.heldBy = null;
    seat.holdExpiresAt = null;
    seat.version += 1;

    this.recalculateEventCounts(seat.eventId);
    return true;
  }

  /**
   * CONDITIONAL WRITE (Strong Consistency / DynamoDB Optimistic Locking pattern)
   * Equation: UPDATE seat SET status = 'BOOKED', version = version + 1
   *           WHERE id = :id AND version = :expectedVersion AND status = 'HELD' AND heldBy = :token
   */
  public conditionalConfirmBooking(
    seatId: string,
    expectedVersion: number,
    holdToken: string,
    bookingDetails: {
      bookingId: string;
      reference: string;
      customerName: string;
      customerEmail: string;
      idempotencyKey: string;
    }
  ): {
    success: boolean;
    reason?: 'SEAT_NOT_FOUND' | 'VERSION_MISMATCH' | 'HOLD_EXPIRED' | 'TOKEN_MISMATCH' | 'ALREADY_BOOKED';
    seat?: Seat;
    booking?: BookingRecord;
  } {
    const seat = this.seats.get(seatId);
    if (!seat) {
      return { success: false, reason: 'SEAT_NOT_FOUND' };
    }

    if (seat.status === 'BOOKED') {
      return { success: false, reason: 'ALREADY_BOOKED' };
    }

    // Check version condition (Optimistic Concurrency Check)
    if (seat.version !== expectedVersion) {
      return { success: false, reason: 'VERSION_MISMATCH' };
    }

    // Check hold ownership
    if (seat.heldBy !== holdToken) {
      return { success: false, reason: 'TOKEN_MISMATCH' };
    }

    // Check hold expiration
    if (seat.holdExpiresAt && seat.holdExpiresAt < Date.now()) {
      return { success: false, reason: 'HOLD_EXPIRED' };
    }

    // Atomic Update Commit
    const now = Date.now();
    seat.status = 'BOOKED';
    seat.version += 1;
    seat.heldBy = null;
    seat.holdExpiresAt = null;
    seat.confirmedBy = {
      name: bookingDetails.customerName,
      email: bookingDetails.customerEmail,
      bookingReference: bookingDetails.reference,
    };
    seat.confirmedAt = now;

    // Generate SHA-like cryptographic security hash for ticket verification
    const securityHash = `SEC-${seat.id.slice(-6)}-${bookingDetails.reference}-${Math.floor(Math.random() * 90000 + 10000)}`;

    const bookingRecord: BookingRecord = {
      bookingId: bookingDetails.bookingId,
      reference: bookingDetails.reference,
      eventId: seat.eventId,
      seatId: seat.id,
      customerName: bookingDetails.customerName,
      customerEmail: bookingDetails.customerEmail,
      confirmedAt: now,
      securityHash,
      idempotencyKey: bookingDetails.idempotencyKey,
    };

    this.bookings.set(bookingDetails.bookingId, bookingRecord);
    this.recalculateEventCounts(seat.eventId);

    return {
      success: true,
      seat: { ...seat },
      booking: bookingRecord,
    };
  }

  /**
   * NAIVE CRUD IMPLEMENTATION (Vulnerable to Race Conditions)
   * Simulates traditional read-then-write anti-pattern:
   * 1. SELECT WHERE available = true
   * 2. (Thread sleeps/IO delay occurs)
   * 3. UPDATE SET available = false
   * This is deliberately provided to reproduce and demonstrate real double-booking in stress tests!
   */
  public async naiveConfirmBooking(
    seatId: string,
    bookingDetails: {
      bookingId: string;
      reference: string;
      customerName: string;
      customerEmail: string;
      idempotencyKey: string;
    }
  ): Promise<{
    success: boolean;
    isDoubleBookingBug: boolean;
    seat?: Seat;
    booking?: BookingRecord;
  }> {
    const seat = this.seats.get(seatId);
    if (!seat) return { success: false, isDoubleBookingBug: false };

    // Step 1: Naive check (vulnerable window begins)
    const wasAlreadyBooked = seat.status === 'BOOKED';

    // Step 2: Inject simulated 20ms I/O latency to open the race window
    await new Promise(resolve => setTimeout(resolve, 20));

    // Step 3: Blind write without conditional check
    const now = Date.now();
    seat.status = 'BOOKED';
    seat.version += 1;
    seat.confirmedBy = {
      name: bookingDetails.customerName,
      email: bookingDetails.customerEmail,
      bookingReference: bookingDetails.reference,
    };
    seat.confirmedAt = now;

    const securityHash = `NAIVE-SEC-${seat.id.slice(-6)}-${Math.floor(Math.random() * 90000 + 10000)}`;
    const bookingRecord: BookingRecord = {
      bookingId: bookingDetails.bookingId,
      reference: bookingDetails.reference,
      eventId: seat.eventId,
      seatId: seat.id,
      customerName: bookingDetails.customerName,
      customerEmail: bookingDetails.customerEmail,
      confirmedAt: now,
      securityHash,
      idempotencyKey: bookingDetails.idempotencyKey,
    };

    this.bookings.set(bookingDetails.bookingId, bookingRecord);

    if (wasAlreadyBooked) {
      // Record double booking anomaly
      this.doubleBookingAnomalies.push({
        seatId,
        bookingIds: [seat.confirmedBy.bookingReference, bookingDetails.reference],
        customers: [seat.confirmedBy.name, bookingDetails.customerName],
        timestamp: now,
      });
    }

    this.recalculateEventCounts(seat.eventId);

    return {
      success: true,
      isDoubleBookingBug: wasAlreadyBooked,
      seat: { ...seat },
      booking: bookingRecord,
    };
  }

  public getDoubleBookingAnomalies() {
    return [...this.doubleBookingAnomalies];
  }

  public getBooking(bookingId: string): BookingRecord | null {
    return this.bookings.get(bookingId) || null;
  }
}

// Preserve singleton across Next.js hot module reloads
const globalForDb = globalThis as unknown as {
  dbEngineInstance?: DatabaseEngine;
};

export const db = globalForDb.dbEngineInstance || new DatabaseEngine();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.dbEngineInstance = db;
}
