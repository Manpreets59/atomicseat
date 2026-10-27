import { NextRequest, NextResponse } from 'next/server';
import { waitingRoomEngine } from '@/lib/waiting-room';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId') || `sess_${Date.now()}`;

  const status = waitingRoomEngine.checkOrJoin(sessionId);
  return NextResponse.json({
    ...status,
    isEnabled: waitingRoomEngine.isEnabled(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.enabled === 'boolean') {
    waitingRoomEngine.setQueueStatus(body.enabled);
  }
  return NextResponse.json({
    isEnabled: waitingRoomEngine.isEnabled(),
    message: `Virtual Waiting Room is now ${waitingRoomEngine.isEnabled() ? 'ENABLED' : 'DISABLED'}`,
  });
}
