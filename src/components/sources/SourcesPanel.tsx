"use client";

import React from "react";
import { BookOpen, ListChecks, ShieldCheck, Database, Layers, X } from "lucide-react";
import { Claim } from "@/types/nutrition";
import { EmptySourcesPlaceholder } from "./EmptySourcesPlaceholder";

interface SourcesPanelProps {
  claims?: Claim[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function SourcesPanel({ claims = [], isOpen, onClose }: SourcesPanelProps) {
  return (
    <aside className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              Claims & Grounding Panel
            </h2>
            <p className="text-[11px] text-slate-400">
              {claims.length} atomic {claims.length === 1 ? "claim" : "claims"} extracted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            Milestone 1
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Extracted claims view if available */}
        {claims.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Extracted Atomic Claims</span>
            </div>

            <div className="space-y-2">
              {claims.map((claim, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono text-[10px] shrink-0 font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {claim.claim_text}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      Source:
                    </span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                      {claim.source === null ? "null (Parametric Memory)" : claim.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestone 1 Baseline Container & M2 Forward Compatibility */}
        <EmptySourcesPlaceholder />
      </div>
    </aside>
  );
}
