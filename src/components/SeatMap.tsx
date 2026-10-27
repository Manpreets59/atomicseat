'use client';

import React, { useState } from 'react';
import { Seat, SeatTier } from '@/types';
import { Lock, Clock, Sparkles, AlertCircle, Shield } from 'lucide-react';

interface SeatMapProps {
  seats: Seat[];
  selectedSeatId: string | null;
  heldByMeToken: string | null;
  onSeatClick: (seat: Seat) => void;
  isLoading: boolean;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatId,
  heldByMeToken,
  onSeatClick,
  isLoading,
}) => {
  const [tierFilter, setTierFilter] = useState<SeatTier | 'ALL'>('ALL');
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  // Group seats by row
  const rowsMap = new Map<string, Seat[]>();
  for (const seat of seats) {
    if (!rowsMap.has(seat.row)) {
      rowsMap.set(seat.row, []);
    }
    rowsMap.get(seat.row)!.push(seat);
  }

  const sortedRows = Array.from(rowsMap.keys()).sort();

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl backdrop-blur-sm">
      {/* Top Controls: Title, Tier Filters, & Map Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            Interactive Live Seat Matrix
          </h3>
          <p className="text-xs text-zinc-400">
            Backed by sub-millisecond Redis ephemeral locks with 5-minute TTL auto-expiry
          </p>
        </div>

        {/* Tier filter pill buttons */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
          {(['ALL', 'VIP', 'PREMIUM', 'GENERAL'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                tierFilter === tier
                  ? 'bg-cyan-500 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {tier === 'ALL' ? 'All Tiers' : tier}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-3 text-xs border-b border-zinc-800/60 text-zinc-300">
        <div className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-md bg-emerald-500/20 border border-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-md bg-cyan-500 border border-cyan-300 ring-2 ring-cyan-500/40" />
          <span>Your Selection (Active Hold)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-md bg-amber-500/20 border border-amber-500 animate-pulse flex items-center justify-center">
            <Clock className="h-2 w-2 text-amber-400" />
          </span>
          <span>Held by Other (5m TTL)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-500 flex items-center justify-center">
            <Lock className="h-2 w-2" />
          </span>
          <span>Sold / Confirmed</span>
        </div>
      </div>

      {/* Stage Perspective Bar */}
      <div className="py-6 flex flex-col items-center">
        <div className="w-3/4 max-w-lg h-2.5 rounded-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-lg shadow-cyan-500/30" />
        <span className="text-[11px] font-mono tracking-widest text-cyan-400/80 uppercase mt-1">
          Stage / Performance Pitch
        </span>
      </div>

      {/* Seat Grid Layout */}
      <div className="overflow-x-auto pb-4 pt-1 flex justify-center">
        <div className="inline-flex flex-col gap-2 min-w-fit px-2">
          {sortedRows.map((rowName) => {
            const rowSeats = rowsMap.get(rowName) || [];
            const rowTier = rowSeats[0]?.tier || 'GENERAL';

            return (
              <div key={rowName} className="flex items-center gap-2">
                {/* Row Label */}
                <div className="w-6 text-center font-mono text-xs font-bold text-zinc-500">
                  {rowName}
                </div>

                {/* Seat row container */}
                <div className="flex items-center gap-1.5">
                  {rowSeats.map((seat) => {
                    const isFilteredOut =
                      tierFilter !== 'ALL' && seat.tier !== tierFilter;

                    const isHeldByMe =
                      seat.id === selectedSeatId ||
                      (seat.status === 'HELD' &&
                        heldByMeToken &&
                        seat.heldBy === heldByMeToken);

                    const isHeldByOther =
                      seat.status === 'HELD' && !isHeldByMe;

                    const isBooked = seat.status === 'BOOKED';
                    const isAvailable = seat.status === 'AVAILABLE';

                    let seatStyle =
                      'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400 hover:scale-105';

                    if (isHeldByMe) {
                      seatStyle =
                        'bg-cyan-500 border-white text-zinc-950 font-bold ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-950 scale-105 shadow-md shadow-cyan-500/40';
                    } else if (isHeldByOther) {
                      seatStyle =
                        'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse cursor-not-allowed';
                    } else if (isBooked) {
                      seatStyle =
                        'bg-zinc-800/80 border-zinc-700/80 text-zinc-600 cursor-not-allowed opacity-60';
                    }

                    if (isFilteredOut) {
                      seatStyle += ' opacity-20 pointer-events-none';
                    }

                    return (
                      <button
                        key={seat.id}
                        disabled={isBooked || isHeldByOther || isLoading}
                        onClick={() => onSeatClick(seat)}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        className={`h-7 w-7 rounded-md border text-[11px] font-mono transition-all flex items-center justify-center relative select-none ${seatStyle}`}
                        title={`Seat ${seat.label} - ${seat.tier} - ₹${seat.price.toLocaleString()} (${seat.status})`}
                      >
                        {isBooked ? (
                          <Lock className="h-3 w-3" />
                        ) : isHeldByOther ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          seat.number
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tier Badge on Row right */}
                <div className="w-16 text-right">
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      rowTier === 'VIP'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        : rowTier === 'PREMIUM'
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {rowTier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Hover Info Card */}
      <div className="mt-3 min-h-[40px] rounded-xl bg-zinc-950/80 border border-zinc-800/80 px-4 py-2.5 flex items-center justify-between text-xs">
        {hoveredSeat ? (
          <div className="flex items-center gap-4">
            <span className="font-bold text-zinc-200">
              Seat {hoveredSeat.label}
            </span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
              {hoveredSeat.tier} • ₹{hoveredSeat.price.toLocaleString()}
            </span>
            <span
              className={`font-mono text-[11px] ${
                hoveredSeat.status === 'AVAILABLE'
                  ? 'text-emerald-400'
                  : hoveredSeat.status === 'HELD'
                  ? 'text-amber-400'
                  : 'text-zinc-500'
              }`}
            >
              Status: {hoveredSeat.status}
              {hoveredSeat.status === 'HELD' && ' (Redis TTL Hold)'}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              Version: v{hoveredSeat.version}
            </span>
          </div>
        ) : (
          <span className="text-zinc-500 italic">
            Hover over any seat to inspect version stamp, tier, and real-time locking state. Click an available seat to acquire a 5-minute hold.
          </span>
        )}
      </div>
    </div>
  );
};
