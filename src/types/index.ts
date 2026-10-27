export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED';

export type SeatTier = 'VIP' | 'PREMIUM' | 'GENERAL';

export interface Seat {
  id: string;
  eventId: string;
  row: string;
  number: number;
  label: string;
  tier: SeatTier;
  price: number;
  status: SeatStatus;
  version: number; // Optimistic locking version
  heldBy?: string | null; // Hold token or session id
  holdExpiresAt?: number | null; // Epoch ms
  confirmedBy?: {
    name: string;
    email: string;
    bookingReference: string;
  } | null;
  confirmedAt?: number | null;
}

export interface Event {
  id: string;
  title: string;
  subtitle: string;
  venue: string;
  date: string;
  time: string;
  category: string;
  totalSeats: number;
  availableSeats: number;
  heldSeats: number;
  bookedSeats: number;
  tags: string[];
}

export interface HoldSeatResponse {
  success: boolean;
  message: string;
  seatId?: string;
  seatLabel?: string;
  holdToken?: string;
  expiresAt?: number;
  ttlSeconds?: number;
  version?: number;
}

export interface ConfirmBookingRequest {
  eventId: string;
  seatId: string;
  holdToken: string;
  customerName: string;
  customerEmail: string;
  idempotencyKey: string;
  paymentNonce?: string;
  mode?: 'atomic' | 'naive';
}

export interface BookingConfirmation {
  bookingId: string;
  reference: string;
  eventId: string;
  eventTitle: string;
  venue: string;
  eventDate: string;
  seatId: string;
  seatLabel: string;
  tier: SeatTier;
  price: number;
  customerName: string;
  customerEmail: string;
  confirmedAt: number;
  securityHash: string;
  idempotencyKey: string;
  isIdempotentReplay?: boolean;
}

export interface StressTestRequest {
  eventId: string;
  seatId: string;
  concurrencyCount: number;
  mode: 'atomic' | 'naive';
}

export interface StressTestLogEntry {
  requestId: number;
  botName: string;
  status: 'SUCCESS' | 'CONFLICT_DEFLECTED' | 'DOUBLE_BOOKING_BUG' | 'EXPIRED_HOLD';
  latencyMs: number;
  message: string;
  timestamp: number;
  version?: number;
}

export interface StressTestResult {
  mode: 'atomic' | 'naive';
  targetSeatId: string;
  targetSeatLabel: string;
  concurrencyCount: number;
  successCount: number;
  conflictDeflectedCount: number;
  doubleBookingsDetected: number; // In naive mode this demonstrates the bug!
  totalTimeMs: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  logs: StressTestLogEntry[];
  summary: string;
}

export interface QueueStatus {
  inQueue: boolean;
  queuePosition: number;
  estimatedWaitSeconds: number;
  token?: string;
  isAdmitted: boolean;
}
