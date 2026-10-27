import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redisMock } from '@/lib/redis-mock';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (eventId) {
    const event = db.getEvent(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Synchronize live Redis holds with DB seat status
    const seats = db.getSeatsForEvent(eventId);
    const activeHolds = redisMock.getActiveHoldsForEvent(eventId);
    const now = Date.now();

    const synchronizedSeats = seats.map(seat => {
      // Check if held in Redis
      const redisHold = activeHolds.get(seat.id);
      if (redisHold && seat.status !== 'BOOKED') {
        return {
          ...seat,
          status: 'HELD' as const,
          heldBy: redisHold.token,
          holdExpiresAt: redisHold.expiresAt,
          remainingTtlMs: Math.max(0, redisHold.expiresAt - now),
        };
      }

      // If DB marked as HELD but expired in Redis, auto-expire
      if (seat.status === 'HELD' && (!redisHold || (seat.holdExpiresAt && seat.holdExpiresAt <= now))) {
        db.releaseSeatHold(seat.id);
        return {
          ...seat,
          status: 'AVAILABLE' as const,
          heldBy: null,
          holdExpiresAt: null,
        };
      }

      return seat;
    });

    return NextResponse.json({
      event: db.getEvent(eventId),
      seats: synchronizedSeats,
      timestamp: Date.now(),
    });
  }

  const events = db.getEvents();
  return NextResponse.json({ events, timestamp: Date.now() });
}
