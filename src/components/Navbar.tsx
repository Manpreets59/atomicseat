'use client';

import React from 'react';
import {
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  RotateCcw,
  Users,
  Server,
  FileText,
} from 'lucide-react';

interface NavbarProps {
  onOpenStressTest: () => void;
  onOpenArchitecture: () => void;
  onReset: () => void;
  isWaitingRoomEnabled: boolean;
  onToggleWaitingRoom: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenStressTest,
  onOpenArchitecture,
  onReset,
  isWaitingRoomEnabled,
  onToggleWaitingRoom,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                Atomic<span className="text-cyan-400">Seat</span>
              </span>
              <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-800/50">
                Major Project
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Fault-Tolerant, Serverless Architecture for Zero Double-Booking • IKGPTU Mohali
            </p>
          </div>
        </div>

        {/* Live Architecture Status Indicators */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">Redis Ephemeral Holds</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="font-mono text-[11px]">Optimistic Conditional Writes</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="font-mono text-[11px]">Idempotency Shield</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Architecture & Docs */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
            title="View Synopsis Architecture, CAP Theorem & Research Findings"
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline">Architecture</span>
          </button>

          {/* Stress Test Simulator Trigger */}
          <button
            onClick={onOpenStressTest}
            className="flex items-center gap-1.5 rounded-lg border border-amber-600/40 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-300 transition-all hover:bg-amber-900/60 hover:border-amber-500 shadow-sm shadow-amber-950/50"
            title="Launch concurrent bot attack to test race condition resilience"
          >
            <Activity className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="font-semibold">Stress Test</span>
          </button>

          {/* Virtual Waiting Room Toggle */}
          <button
            onClick={onToggleWaitingRoom}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              isWaitingRoomEnabled
                ? 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Flash Crowd Virtual Waiting Room Queue"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Waiting Room</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isWaitingRoomEnabled ? 'bg-cyan-400' : 'bg-zinc-600'
              }`}
            />
          </button>

          {/* Reset System */}
          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            title="Reset All Seats, Holds & Bookings"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
