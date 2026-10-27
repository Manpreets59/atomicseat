'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Event, Seat, BookingConfirmation, QueueStatus } from '@/types';
import { Navbar } from '@/components/Navbar';
import { EventSelector } from '@/components/EventSelector';
import { SeatMap } from '@/components/SeatMap';
import { CheckoutModal } from '@/components/CheckoutModal';
import { TicketModal } from '@/components/TicketModal';
import { StressTestModal } from '@/components/StressTestModal';
import { ArchitectureModal } from '@/components/ArchitectureModal';
import { WaitingRoomBanner } from '@/components/WaitingRoomBanner';
import {
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('event-coldplay-2026');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  // Active hold state for the current user's session
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isStressTestOpen, setIsStressTestOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  // Confirmed booking for the digital ticket
  const [confirmedBooking, setConfirmedBooking] = useState<BookingConfirmation | null>(null);

  // Virtual Waiting Room status
  const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Persistent browser session ID
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('atomicseat_session_id');
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('atomicseat_session_id', id);
    }
    setSessionId(id);
  }, []);

  // Fetch all events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, []);

  // Fetch seats for the selected event
  const fetchSeats = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/events?eventId=${encodeURIComponent(eventId)}`);
      if (res.ok) {
        const data = await res.json();
        setSeats(data.seats || []);
      }
    } catch (err) {
      console.error('Failed to fetch seats:', err);
    }
  }, []);

  // Check waiting room queue status
  const checkQueueStatus = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/queue?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setIsWaitingRoomEnabled(data.isEnabled);
        setQueueStatus(data);
      }
    } catch (err) {
      console.error('Failed to check queue:', err);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Load seats when event changes
  useEffect(() => {
    if (selectedEventId) {
      fetchSeats(selectedEventId);
    }
  }, [selectedEventId, fetchSeats]);

  // Real-time polling every 3 seconds to keep seat map in sync with Redis holds and purchases
  useEffect(() => {
    if (!selectedEventId) return;

    const interval = setInterval(() => {
      fetchSeats(selectedEventId);
      fetchEvents();
      if (isWaitingRoomEnabled) {
        checkQueueStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedEventId, isWaitingRoomEnabled, fetchSeats, fetchEvents, checkQueueStatus]);

  // Handle seat selection -> Acquire Redis Ephemeral Hold
  const handleSeatClick = async (seat: Seat) => {
    if (!sessionId) return;

    // If seat is already booked
    if (seat.status === 'BOOKED') {
      setNotification({
        type: 'error',
        message: `Seat ${seat.label} has already been permanently sold and confirmed in the database.`,
      });
      return;
    }

    // If seat is held by someone else
    if (seat.status === 'HELD' && seat.heldBy !== holdToken) {
      setNotification({
        type: 'warning',
        message: `Contention Alert: Seat ${seat.label} is currently locked by another customer in Redis (5-minute TTL checkout window).`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/seats/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          seatId: seat.id,
          sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setNotification({
          type: 'error',
          message: data.message || 'Unable to hold seat due to concurrent request.',
        });
        await fetchSeats(selectedEventId);
        return;
      }

      // Successfully held in Redis
      setSelectedSeat(seat);
      setHoldToken(data.holdToken);
      setHoldExpiresAt(data.expiresAt);
      setIsCheckoutOpen(true);
      setNotification({
        type: 'success',
        message: `Distributed lock acquired for Seat ${seat.label}! 5-minute checkout timer started.`,
      });
      await fetchSeats(selectedEventId);
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error acquiring seat hold.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful booking
  const handleBookingSuccess = (confirmation: BookingConfirmation) => {
    setIsCheckoutOpen(false);
    setConfirmedBooking(confirmation);
    setIsTicketOpen(true);
    setHoldToken(null);
    setHoldExpiresAt(null);
    setSelectedSeat(null);
    fetchSeats(selectedEventId);
    fetchEvents();
    setNotification({
      type: 'success',
      message: `Booking for Seat ${confirmation.seatLabel} confirmed with conditional write!`,
    });
  };

  // Handle 5-minute TTL expiration
  const handleHoldExpired = () => {
    setIsCheckoutOpen(false);
    setSelectedSeat(null);
    setHoldToken(null);
    setHoldExpiresAt(null);
    fetchSeats(selectedEventId);
    fetchEvents();
    setNotification({
      type: 'warning',
      message: 'Your 5-minute reservation window has expired. The seat hold was automatically released in Redis.',
    });
  };

  // System reset
  const handleResetSystem = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      setSelectedSeat(null);
      setHoldToken(null);
      setHoldExpiresAt(null);
      setIsCheckoutOpen(false);
      setIsTicketOpen(false);
      await fetchEvents();
      if (selectedEventId) {
        await fetchSeats(selectedEventId);
      }
      setNotification({
        type: 'info',
        message: 'System database and Redis cache successfully reset to initial states.',
      });
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  // Toggle Waiting Room
  const handleToggleWaitingRoom = async () => {
    try {
      const nextState = !isWaitingRoomEnabled;
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState }),
      });
      const data = await res.json();
      setIsWaitingRoomEnabled(data.isEnabled);
      setNotification({
        type: 'info',
        message: data.message,
      });
      checkQueueStatus();
    } catch (err) {
      console.error('Queue toggle failed:', err);
    }
  };

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <Navbar
        onOpenStressTest={() => setIsStressTestOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onReset={handleResetSystem}
        isWaitingRoomEnabled={isWaitingRoomEnabled}
        onToggleWaitingRoom={handleToggleWaitingRoom}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Flash-Crowd Virtual Waiting Room Banner */}
        <WaitingRoomBanner
          status={queueStatus}
          isEnabled={isWaitingRoomEnabled}
        />

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`rounded-xl border p-3 text-xs flex items-center justify-between transition-all ${
              notification.type === 'success'
                ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                : notification.type === 'warning'
                ? 'border-amber-500/50 bg-amber-950/30 text-amber-300'
                : notification.type === 'error'
                ? 'border-rose-500/50 bg-rose-950/30 text-rose-300'
                : 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {notification.type === 'warning' && <Clock className="h-4 w-4 shrink-0" />}
              {notification.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0" />}
              {notification.type === 'info' && <Info className="h-4 w-4 shrink-0" />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-zinc-400 hover:text-white text-xs underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Banner: Architectural High-Concurrency Highlights */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 md:p-8 shadow-2xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-950/80 border border-cyan-800/80 px-3 py-1 text-xs font-semibold text-cyan-300 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Zero Double-Booking Guarantee Under 50,000+ Concurrent Users</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3">
              Scalable Ticket Management System
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
              A high-concurrency event ticketing platform engineered to counter race conditions,
              database lock exhaustion, and inventory hoarding. Combining <strong>Redis ephemeral holds</strong> (5-min TTL) with <strong>DynamoDB optimistic locking conditional writes</strong> and <strong>idempotent payment verification</strong>.
            </p>

            {/* Micro KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">
                  Concurrency Strategy
                </span>
                <span className="font-bold text-cyan-400">Two-Tier Hold + Write</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">
                  Ephemeral Window
                </span>
                <span className="font-bold text-amber-400">5-Minute Redis TTL</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">
                  Consistency Model
                </span>
                <span className="font-bold text-purple-400">Strict ACID Conditional</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">
                  Double-Sell Tolerance
                </span>
                <span className="font-bold text-emerald-400">0.00% (Mathematically 0)</span>
              </div>
            </div>
          </div>

          {/* Decorative glowing gradient backdrop */}
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-40 -bottom-20 h-60 w-60 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        </div>

        {/* Event Selector Cards */}
        <EventSelector
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={(id) => {
            setSelectedEventId(id);
            setSelectedSeat(null);
            setHoldToken(null);
          }}
        />

        {/* Interactive Live Seat Map */}
        <SeatMap
          seats={seats}
          selectedSeatId={selectedSeat?.id || null}
          heldByMeToken={holdToken}
          onSeatClick={handleSeatClick}
          isLoading={isLoading}
        />
      </main>

      {/* Footer with Academic Information */}
      <footer className="mt-12 border-t border-zinc-800 bg-zinc-950 py-6 text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-zinc-300">AtomicSeat</span> • Bachelor of Technology (CSE) Major Project
            <p className="text-[11px] text-zinc-500 mt-0.5">
              I.K. Gujral Punjab Technical University (IKGPTU) Mohali Campus-1 • Submitted to Mrs. Manpreet
            </p>
          </div>
          <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px]">
            <span>Kamaldeep Singh (2328030)</span>
            <span>•</span>
            <span>Manpreet Singh (2328040)</span>
            <span>•</span>
            <span>Sparsh Gupta (2328066)</span>
          </div>
        </div>
      </footer>

      {/* 5-Minute Checkout Modal */}
      {selectedSeat && currentEvent && holdToken && holdExpiresAt && (
        <CheckoutModal
          seat={selectedSeat}
          event={currentEvent}
          holdToken={holdToken}
          expiresAt={holdExpiresAt}
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handleBookingSuccess}
          onExpired={handleHoldExpired}
        />
      )}

      {/* Verified Digital Ticket Modal */}
      <TicketModal
        confirmation={confirmedBooking}
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
      />

      {/* High-Concurrency Stress Test Simulator Modal */}
      <StressTestModal
        eventId={selectedEventId}
        isOpen={isStressTestOpen}
        onClose={() => setIsStressTestOpen(false)}
        onRefreshSeats={() => fetchSeats(selectedEventId)}
      />

      {/* Architecture & Documentation Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
