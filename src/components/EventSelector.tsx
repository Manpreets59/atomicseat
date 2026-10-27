'use client';

import React from 'react';
import { Event } from '@/types';
import { Calendar, MapPin, Clock, Users, Ticket, CheckCircle2, ShieldAlert } from 'lucide-react';

interface EventSelectorProps {
  events: Event[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Ticket className="h-4 w-4 text-cyan-400" />
          Select High-Demand Event
        </h2>
        <span className="text-xs text-zinc-400">
          Showing real-time concurrency metrics
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.map((event) => {
          const isSelected = event.id === selectedEventId;
          const bookedPct = Math.round((event.bookedSeats / event.totalSeats) * 100);
          const heldPct = Math.round((event.heldSeats / event.totalSeats) * 100);
          const availablePct = 100 - bookedPct - heldPct;

          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className={`cursor-pointer rounded-2xl border p-4.5 transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-cyan-500 bg-zinc-900/90 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              {/* Category & Status Pill */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300 border border-zinc-700/60">
                  {event.category}
                </span>
                {event.availableSeats === 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                    <ShieldAlert className="h-3 w-3" /> Sold Out
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Live On-Sale
                  </span>
                )}
              </div>

              {/* Event Title */}
              <h3 className="font-bold text-zinc-100 text-sm leading-snug mb-1">
                {event.title}
              </h3>
              <p className="text-xs text-zinc-400 mb-3">{event.subtitle}</p>

              {/* Location & Time */}
              <div className="space-y-1 text-[11px] text-zinc-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{event.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span>{event.date}</span>
                  <span className="text-zinc-600">•</span>
                  <Clock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span>{event.time}</span>
                </div>
              </div>

              {/* Live Inventory Bar */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Inventory Status:</span>
                  <span className="font-mono text-zinc-300">
                    <strong className="text-emerald-400">{event.availableSeats}</strong> free /{' '}
                    <strong className="text-amber-400">{event.heldSeats}</strong> held /{' '}
                    <strong className="text-zinc-400">{event.bookedSeats}</strong> sold
                  </span>
                </div>

                {/* Multi-segment capacity progress */}
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${availablePct}%` }}
                    title={`Available: ${event.availableSeats}`}
                  />
                  <div
                    className="h-full bg-amber-500 animate-pulse transition-all duration-500"
                    style={{ width: `${heldPct}%` }}
                    title={`Held in Redis (5m TTL): ${event.heldSeats}`}
                  />
                  <div
                    className="h-full bg-zinc-600 transition-all duration-500"
                    style={{ width: `${bookedPct}%` }}
                    title={`Sold/Booked: ${event.bookedSeats}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
