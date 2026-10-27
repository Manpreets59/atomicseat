import { NextRequest, NextResponse } from 'next/server';
import { concurrencyEngine } from '@/lib/concurrency-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, seatId, holdToken } = body;

    if (!eventId || !seatId || !holdToken) {
      return NextResponse.json(
        { success: false, message: 'Missing parameters' },
        { status: 400 }
      );
    }

    const result = await concurrencyEngine.releaseHold(eventId, seatId, holdToken);
    return NextResponse.json(result);
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
