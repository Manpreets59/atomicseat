'use client';

import React from 'react';
import { QueueStatus } from '@/types';
import { Users, ShieldCheck, Clock, Zap } from 'lucide-react';

interface WaitingRoomBannerProps {
  status: QueueStatus | null;
  isEnabled: boolean;
}

export const WaitingRoomBanner: React.FC<WaitingRoomBannerProps> = ({
  status,
  isEnabled,
}) => {
  if (!isEnabled) return null;

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-300">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <span className="font-bold text-white">
            Virtual Waiting Room Queue Active
          </span>
          <p className="text-[11px] text-zinc-400">
            Incoming request spikes are queued sequentially to protect the seat allocation layer.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {status?.isAdmitted ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 font-mono text-[11px] text-emerald-300 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Admitted (Token: {status.token?.slice(0, 14)}...)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 border border-amber-700/60 px-3 py-1 font-mono text-[11px] text-amber-300">
            <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />
            Position #{status?.queuePosition || 1} • Wait: ~
            {status?.estimatedWaitSeconds || 5}s
          </span>
        )}
      </div>
    </div>
  );
};
