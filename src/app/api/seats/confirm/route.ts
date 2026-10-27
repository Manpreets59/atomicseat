import { NextRequest, NextResponse } from 'next/server';
import { concurrencyEngine } from '@/lib/concurrency-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      seatId,
      holdToken,
      customerName,
      customerEmail,
      idempotencyKey,
      mode = 'atomic',
    } = body;

    // Check header for idempotency key if not in body
    const finalIdempotencyKey =
      idempotencyKey || request.headers.get('x-idempotency-key') || `idem_${Date.now()}`;

    if (!eventId || !seatId || !holdToken || !customerName || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking details' },
        { status: 400 }
      );
    }

    const result = await concurrencyEngine.confirmBooking({
      eventId,
      seatId,
      holdToken,
      customerName,
      customerEmail,
      idempotencyKey: finalIdempotencyKey,
      mode,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
