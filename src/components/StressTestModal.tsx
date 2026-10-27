'use client';

import React, { useState } from 'react';
import { StressTestResult } from '@/types';
import {
  Activity,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  X,
  RefreshCw,
  BarChart3,
  Bot,
  Clock,
} from 'lucide-react';

interface StressTestModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefreshSeats: () => void;
}

export const StressTestModal: React.FC<StressTestModalProps> = ({
  eventId,
  isOpen,
  onClose,
  onRefreshSeats,
}) => {
  const [concurrencyCount, setConcurrencyCount] = useState<number>(50);
  const [mode, setMode] = useState<'atomic' | 'naive'>('atomic');
  const [targetSeatNumber, setTargetSeatNumber] = useState<string>('A1');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<StressTestResult | null>(null);

  if (!isOpen) return null;

  const targetSeatId = `${eventId}_${targetSeatNumber}`;

  const handleRunTest = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          seatId: targetSeatId,
          concurrencyCount,
          mode,
        }),
      });

      const data: StressTestResult = await res.json();
      setResult(data);
      onRefreshSeats();
    } catch (err: unknown) {
      console.error('Stress test failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                High-Concurrency Flash Crowd Simulator
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  50k Load Emulation
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Direct empirical comparison between Naive CRUD vs. AtomicSeat Optimistic Locking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration Controls Bar */}
        <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-800/80 text-xs">
          {/* Target Seat */}
          <div>
            <label className="block text-zinc-400 mb-1.5 font-medium">Contested Hot Seat</label>
            <div className="flex items-center gap-2">
              <select
                value={targetSeatNumber}
                onChange={(e) => setTargetSeatNumber(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-200 font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="A1">Seat A1 (Front Row VIP)</option>
                <option value="A2">Seat A2 (Front Row VIP)</option>
                <option value="B1">Seat B1 (VIP Stage-Center)</option>
                <option value="C1">Seat C1 (Premium)</option>
              </select>
            </div>
          </div>

          {/* Concurrency Level */}
          <div>
            <label className="block text-zinc-400 mb-1.5 font-medium">
              Simultaneous Bot Threads: <strong className="text-cyan-400">{concurrencyCount}</strong>
            </label>
            <div className="flex items-center gap-1">
              {[10, 25, 50, 100].map((count) => (
                <button
                  key={count}
                  onClick={() => setConcurrencyCount(count)}
                  className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] font-medium border transition-all ${
                    concurrencyCount === count
                      ? 'bg-cyan-500 text-zinc-950 border-cyan-400 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Mode */}
          <div>
            <label className="block text-zinc-400 mb-1.5 font-medium">Test Architecture</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setMode('atomic')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                  mode === 'atomic'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                AtomicSeat Mode
              </button>
              <button
                onClick={() => setMode('naive')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                  mode === 'naive'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                Naive CRUD Mode
              </button>
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <div className="py-3 flex items-center justify-between">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-cyan-400" />
            <span>
              {concurrencyCount} bots will simultaneously target Seat {targetSeatNumber} in parallel
            </span>
          </div>
          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-lg ${
              mode === 'atomic'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500'
                : 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-rose-600/20 hover:from-rose-500 hover:to-amber-500'
            } disabled:opacity-50`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Firing Concurrent Bursts...
              </>
            ) : (
              <>
                <Flame className="h-4 w-4" />
                Launch {concurrencyCount}-Bot Burst Attack
              </>
            )}
          </button>
        </div>

        {/* Live Metrics Display */}
        {result && (
          <div className="space-y-4 pt-2 overflow-y-auto pr-1">
            {/* Summary Banner */}
            <div
              className={`rounded-2xl border p-4 text-xs ${
                result.doubleBookingsDetected > 0
                  ? 'border-rose-500/60 bg-rose-950/30 text-rose-200'
                  : 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {result.doubleBookingsDetected > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {result.doubleBookingsDetected > 0
                      ? 'RACE CONDITION REPRODUCED: Double Booking Anomaly Detected!'
                      : 'ACID INTEGRITY VERIFIED: Zero Double-Booking Anomaly'}
                  </h4>
                  <p className="mt-1 leading-relaxed opacity-90">{result.summary}</p>
                </div>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <span className="text-[10px] text-zinc-400 uppercase font-mono">
                  Initial Winner
                </span>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {result.successCount}
                </div>
                <span className="text-[10px] text-zinc-500">Seat Owner</span>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <span className="text-[10px] text-zinc-400 uppercase font-mono">
                  Deflected Attempts
                </span>
                <div className="text-xl font-bold font-mono text-cyan-400">
                  {result.conflictDeflectedCount}
                </div>
                <span className="text-[10px] text-zinc-500">Safe Rejections</span>
              </div>

              <div
                className={`rounded-xl border p-3 ${
                  result.doubleBookingsDetected > 0
                    ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                    : 'border-emerald-500/40 bg-zinc-900/60 text-emerald-400'
                }`}
              >
                <span className="text-[10px] text-zinc-400 uppercase font-mono">
                  Double-Sells Detected
                </span>
                <div className="text-xl font-bold font-mono">
                  {result.doubleBookingsDetected}
                </div>
                <span className="text-[10px] text-zinc-500">
                  {result.doubleBookingsDetected === 0 ? 'Zero Tolerance Met' : 'System Defect'}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <span className="text-[10px] text-zinc-400 uppercase font-mono">
                  Average Latency
                </span>
                <div className="text-xl font-bold font-mono text-amber-400">
                  {result.averageLatencyMs} ms
                </div>
                <span className="text-[10px] text-zinc-500">p95: {result.p95LatencyMs}ms</span>
              </div>
            </div>

            {/* Live Telemetry Trace Log */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                  Bot Request Telemetry Log (Real Execution Trace)
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {result.logs.length} threads traced
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-2">
                {result.logs.map((log) => {
                  let badge = 'text-cyan-400 bg-cyan-950/80 border-cyan-800';
                  if (log.status === 'SUCCESS') {
                    badge = 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
                  } else if (log.status === 'DOUBLE_BOOKING_BUG') {
                    badge = 'text-rose-400 bg-rose-950/80 border-rose-600 animate-pulse font-bold';
                  }

                  return (
                    <div
                      key={log.requestId}
                      className="flex items-center justify-between rounded-lg bg-zinc-950/80 border border-zinc-800/80 px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] ${badge}`}>
                          {log.botName}
                        </span>
                        <span className="text-zinc-300">{log.message}</span>
                      </div>
                      <span className="text-zinc-500 text-[10px] shrink-0">
                        {log.latencyMs}ms
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
