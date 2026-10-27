import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redisMock } from '@/lib/redis-mock';
import { idempotencyEngine } from '@/lib/idempotency';
import { waitingRoomEngine } from '@/lib/waiting-room';

export async function POST() {
  db.seedDatabase();
  redisMock.flushAll();
  idempotencyEngine.clear();
  waitingRoomEngine.reset();

  return NextResponse.json({
    success: true,
    message: 'System state reset to clean initial seeds. All holds and bookings cleared.',
    timestamp: Date.now(),
  });
}
