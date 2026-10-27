'use client';

import React, { useState, useEffect } from 'react';
import { Seat, Event, BookingConfirmation } from '@/types';
import {
  Clock,
  ShieldCheck,
  CreditCard,
  Lock,
  Zap,
  AlertTriangle,
  X,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

interface CheckoutModalProps {
  seat: Seat;
  event: Event;
  holdToken: string;
  expiresAt: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (confirmation: BookingConfirmation) => void;
  onExpired: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  seat,
  event,
  holdToken,
  expiresAt,
  isOpen,
  onClose,
  onSuccess,
  onExpired,
}) => {
  const [name, setName] = useState('Manpreet Singh');
  const [email, setEmail] = useState('manpreet.singh@ikgptu.ac.in');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');

  // Idempotency key generated per checkout session
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [mode, setMode] = useState<'atomic' | 'naive'>('atomic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 5-minute countdown clock
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);

  useEffect(() => {
    if (isOpen) {
      // Generate client-side unique idempotency key
      const key = `idem_${seat.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      setIdempotencyKey(key);
      setErrorMessage(null);
    }
  }, [isOpen, seat.id]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const remainingMs = Math.max(0, expiresAt - Date.now());
      const sec = Math.ceil(remainingMs / 1000);
      setSecondsRemaining(sec);

      if (sec <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen, expiresAt, onExpired]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 300) * 100));

  const handlePayAndConfirm = async (isSimulatedRetry = false) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/seats/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          eventId: event.id,
          seatId: seat.id,
          holdToken,
          customerName: name,
          customerEmail: email,
          idempotencyKey,
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || data.message || 'Booking confirmation failed.');
        setIsSubmitting(false);
        return;
      }

      onSuccess(data.confirmation);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error during payment confirmation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative text-zinc-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 5-Minute TTL Reservation Banner */}
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-amber-300">
                Redis Ephemeral Lock Active
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-amber-300 tracking-wider">
              {timeFormatted}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400">
            Seat is temporarily held exclusively for your session. Complete checkout before TTL expires.
          </p>
        </div>

        {/* Order Summary */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs font-medium text-cyan-400">{event.category}</span>
              <h4 className="font-bold text-sm text-zinc-100">{event.title}</h4>
              <p className="text-xs text-zinc-400">{event.venue}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-400">Total Due</span>
              <div className="text-lg font-mono font-bold text-emerald-400">
                ₹{seat.price.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs">
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
              Seat: <strong className="text-cyan-400">{seat.label}</strong> ({seat.row}-{seat.number})
            </span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
              Tier: <strong>{seat.tier}</strong>
            </span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-400 text-[10px]">
              Lock Ver: v{seat.version}
            </span>
          </div>
        </div>

        {/* Customer & Stripe Card Form */}
        <div className="space-y-3 mb-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Simulated Stripe Card Fields */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                <CreditCard className="h-3.5 w-3.5 text-cyan-400" />
                Stripe Test Card
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">256-bit Encrypted</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full rounded bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 font-mono text-zinc-300 focus:border-cyan-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="rounded bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 font-mono text-zinc-300 text-center focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="rounded bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 font-mono text-zinc-300 text-center focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Idempotency Key Badge */}
        <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-2.5 mb-4 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Idempotency-Key:</span>
            <code className="text-zinc-300 font-mono">{idempotencyKey.slice(0, 24)}...</code>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Replay Safe</span>
        </div>

        {/* Concurrency Mode Selector */}
        <div className="flex items-center justify-between text-xs pb-4 border-b border-zinc-800 mb-4">
          <span className="text-zinc-400">Concurrency Strategy:</span>
          <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setMode('atomic')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mode === 'atomic'
                  ? 'bg-cyan-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              AtomicSeat (Optimistic Lock)
            </button>
            <button
              onClick={() => setMode('naive')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mode === 'naive'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Naive CRUD (Race Vulnerable)
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/50 bg-rose-950/30 p-3 mb-4 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Main Payment Button */}
          <button
            onClick={() => handlePayAndConfirm(false)}
            disabled={isSubmitting || secondsRemaining <= 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Atomic Conditional Write...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Confirm & Pay ₹{seat.price.toLocaleString()}
              </>
            )}
          </button>

          {/* Test Idempotency Retry Simulation Button */}
          <button
            onClick={() => handlePayAndConfirm(true)}
            disabled={isSubmitting || secondsRemaining <= 0}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Simulate network retry or accidental double-click using identical Idempotency-Key"
          >
            <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Test Double-Click</span>
          </button>
        </div>
      </div>
    </div>
  );
};
