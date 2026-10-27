import { NextRequest, NextResponse } from 'next/server';
import { concurrencyEngine } from '@/lib/concurrency-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, seatId, concurrencyCount = 50, mode = 'atomic' } = body;

    if (!eventId || !seatId) {
      return NextResponse.json(
        { error: 'Missing eventId or seatId for concurrency test' },
        { status: 400 }
      );
    }

    const clampedCount = Math.min(Math.max(concurrencyCount, 5), 200);

    const result = await concurrencyEngine.runStressTest({
      eventId,
      seatId,
      concurrencyCount: clampedCount,
      mode,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Stress test execution failed',
      },
      { status: 500 }
    );
  }
}
