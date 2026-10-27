'use client';

import React, { useEffect } from 'react';
import { BookingConfirmation } from '@/types';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Printer,
  X,
  ShieldCheck,
  Calendar,
  MapPin,
  QrCode,
  Ticket,
  Lock,
  Zap,
} from 'lucide-react';

interface TicketModalProps {
  confirmation: BookingConfirmation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  confirmation,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && confirmation) {
      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b'],
      });
    }
  }, [isOpen, confirmation]);

  if (!isOpen || !confirmation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/30 bg-zinc-950 p-6 shadow-2xl shadow-cyan-950/60 relative text-zinc-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Booking Guaranteed!</h3>
          <p className="text-xs text-zinc-400">
            Committed atomically with zero double-booking tolerance
          </p>

          {confirmation.isIdempotentReplay && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-950/60 border border-amber-600/50 px-3 py-0.5 text-[11px] font-medium text-amber-300">
              <Zap className="h-3 w-3 text-amber-400" />
              Idempotent Replay Safely Handled (No Double Charge)
            </div>
          )}
        </div>

        {/* Digital Boarding Pass Ticket */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden relative shadow-lg">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-4 text-white">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                  AtomicSeat Verified Pass
                </span>
                <h4 className="font-bold text-sm leading-tight mt-0.5">
                  {confirmation.eventTitle}
                </h4>
              </div>
              <span className="rounded-lg bg-black/30 backdrop-blur-sm px-2 py-0.5 font-mono text-xs font-bold border border-white/20">
                {confirmation.tier}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px] opacity-90">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {confirmation.eventDate}
              </span>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono">
                  Assigned Seat
                </span>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {confirmation.seatLabel}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase font-mono">
                  Price Paid
                </span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  ₹{confirmation.price.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase block">Attendee</span>
                <span className="font-medium text-zinc-200 truncate block">
                  {confirmation.customerName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase block">Booking Ref</span>
                <span className="font-mono text-zinc-300 font-bold block">
                  {confirmation.reference}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="text-zinc-300">{confirmation.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span>Security Hash:</span>
                <span className="text-cyan-400">{confirmation.securityHash}</span>
              </div>
            </div>

            {/* QR Code Simulation */}
            <div className="pt-3 border-t border-dashed border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white p-1.5 rounded-lg">
                  <QrCode className="h-10 w-10 text-black" />
                </div>
                <div className="text-[10px] text-zinc-400">
                  <p className="font-bold text-zinc-300">Scan at Turnstile</p>
                  <p>Cryptographically Signed</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] text-emerald-400 font-mono">
                  <ShieldCheck className="h-3 w-3" /> VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print / Save Ticket
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-5 py-2.5 text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
