'use client';

import React from 'react';
import {
  X,
  Layers,
  Database,
  Cpu,
  Shield,
  Zap,
  Clock,
  ArrowRight,
  GitBranch,
  BookOpen,
  Award,
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                System Architecture & Concurrency Blueprint
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  AtomicSeat
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Major Project Synopsis • IKGPTU Mohali Campus-1
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

        {/* Content Body (Scrollable) */}
        <div className="py-4 space-y-6 overflow-y-auto pr-1 text-xs">
          {/* Author Credits Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
              <Award className="h-4 w-4" />
              <span>Academic Major Project Credentials</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300">
              <div>
                <p className="text-zinc-500 text-[11px]">Submitted To:</p>
                <p className="font-semibold text-zinc-200">Mrs. Manpreet</p>
                <p className="text-zinc-500 text-[11px] mt-1">Institution:</p>
                <p className="text-zinc-300">I.K. Gujral Punjab Technical University (IKGPTU), Mohali Campus-1</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[11px]">Project Authors:</p>
                <ul className="space-y-0.5 text-zinc-200 font-mono text-[11px]">
                  <li>• Sparsh Gupta (2328066)</li>
                  <li>• Manpreet Singh (2328040)</li>
                  <li>• Kamaldeep Singh (2328030)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* End-to-End Lifecycle Flow (Figure 6.1 from Synopsis) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-cyan-400" />
              End-to-End Seat Reservation Lifecycle (Figure 6.1)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-zinc-300">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 relative">
                <span className="h-5 w-5 rounded-full bg-cyan-500 text-zinc-950 font-bold flex items-center justify-center text-[10px] mb-2">
                  1
                </span>
                <h5 className="font-bold text-zinc-200 text-xs mb-1">Browse Seats</h5>
                <p className="text-[11px] text-zinc-400">
                  Availability served directly from Redis in-memory cache for sub-millisecond response under flash-crowd load.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/40 bg-zinc-950 p-3 relative">
                <span className="h-5 w-5 rounded-full bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-[10px] mb-2">
                  2
                </span>
                <h5 className="font-bold text-amber-300 text-xs mb-1">5-Min Ephemeral Hold</h5>
                <p className="text-[11px] text-zinc-400">
                  Atomic <code className="text-amber-400">SETNX</code> hold placed in Redis with 300s TTL. Prevents any concurrent user from selecting this seat.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 relative">
                <span className="h-5 w-5 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px] mb-2">
                  3
                </span>
                <h5 className="font-bold text-blue-300 text-xs mb-1">Idempotent Payment</h5>
                <p className="text-[11px] text-zinc-400">
                  Stripe processing keyed with a unique client-generated <code className="text-blue-400">Idempotency-Key</code> to eliminate duplicate transactions.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/40 bg-zinc-950 p-3 relative">
                <span className="h-5 w-5 rounded-full bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center text-[10px] mb-2">
                  4
                </span>
                <h5 className="font-bold text-emerald-300 text-xs mb-1">Conditional Write</h5>
                <p className="text-[11px] text-zinc-400">
                  DynamoDB atomic check-and-update commits booking only if version matches. If payment times out, TTL auto-releases seat.
                </p>
              </div>
            </div>
          </div>

          {/* CAP Theorem Trade-off (From Presentation Slides) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-2 mb-2">
              <GitBranch className="h-4 w-4 text-cyan-400" />
              Deliberate Architectural Trade-off: CAP Theorem in Practice
            </h4>
            <p className="text-zinc-400 text-xs mb-4">
              A distributed system can guarantee at most two of: Consistency, Availability, Partition tolerance. AtomicSeat divides responsibility explicitly:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-cyan-500/30 bg-zinc-950 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-cyan-400 text-xs">Redis Ephemeral Layer</span>
                  <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] text-cyan-300 border border-cyan-800">
                    Speed & Availability (AP)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Real-time seat status is eventually consistent, optimized for fast read throughput under 50,000+ requests. Handles 5-minute temporary holds without bogging down disk storage.
                </p>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-zinc-950 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-purple-400 text-xs">DynamoDB Persistent Layer</span>
                  <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] text-purple-300 border border-purple-800">
                    Strong Consistency (CP)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Final confirmed bookings execute via strict conditional writes (`WHERE version = currentVersion`). Guarantees mathematical zero double-sell tolerance across all nodes.
                </p>
              </div>
            </div>
          </div>

          {/* Comparative Concurrency Control Matrix (Table 4.1 from Synopsis) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-emerald-400" />
              Comparative Concurrency Control Mechanisms
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-2 pr-4 font-semibold">Strategy</th>
                    <th className="py-2 pr-4 font-semibold">Mechanism</th>
                    <th className="py-2 pr-4 font-semibold">Vulnerability / Bottleneck</th>
                    <th className="py-2 font-semibold">AtomicSeat Solution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-rose-400">Naive CRUD</td>
                    <td className="py-2.5 pr-4 font-mono text-[10px]">SELECT then UPDATE</td>
                    <td className="py-2.5 pr-4 text-rose-300">Race window allows duplicate sales</td>
                    <td className="py-2.5 text-zinc-500">Eliminated</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-amber-400">Pessimistic Locking</td>
                    <td className="py-2.5 pr-4 font-mono text-[10px]">SELECT FOR UPDATE</td>
                    <td className="py-2.5 pr-4 text-zinc-400">Connection exhaustion, deadlocks past 5k reqs</td>
                    <td className="py-2.5 text-zinc-400">Offloaded to Redis memory</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-cyan-400">Optimistic Locking</td>
                    <td className="py-2.5 pr-4 font-mono text-[10px]">Version stamp check</td>
                    <td className="py-2.5 pr-4 text-zinc-400">Retry thrashing if done without holds</td>
                    <td className="py-2.5 text-cyan-300 font-semibold">Paired with Ephemeral Holds</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-emerald-400">Two-Tier AtomicSeat</td>
                    <td className="py-2.5 pr-4 font-mono text-[10px]">Redis SETNX + Conditional DB</td>
                    <td className="py-2.5 pr-4 text-emerald-400 font-semibold">Zero Double-Booking Guarantee</td>
                    <td className="py-2.5 text-emerald-300 font-bold">100% Implemented & Tested</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-5 py-2 text-xs font-semibold transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
