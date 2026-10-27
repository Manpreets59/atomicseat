import { NextRequest, NextResponse } from 'next/server';
import { concurrencyEngine } from '@/lib/concurrency-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, seatId, sessionId } = body;

    if (!eventId || !seatId || !sessionId) {
      return NextResponse.json(
        { success: false, message: 'Missing eventId, seatId, or sessionId' },
        { status: 400 }
      );
    }

    const result = await concurrencyEngine.holdSeat(eventId, seatId, sessionId);

    if (!result.success) {
      return NextResponse.json(result, { status: 409 }); // 409 Conflict
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
