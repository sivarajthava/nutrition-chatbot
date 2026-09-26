"use client";

import React from "react";
import { Database, AlertCircle, Sparkles } from "lucide-react";

export function EmptySourcesPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-3">
      <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full">
        <Database className="w-6 h-6" />
      </div>
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 mb-2">
          <Sparkles className="w-3 h-3" />
          Milestone 1: Parametric Memory
        </div>
        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
          No External Citations Available
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          The assistant is answering strictly from model weights without a retrieval
          layer. External source citations will populate here in Milestone 2.
        </p>
      </div>
      <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-3 w-full flex items-center justify-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" />
        All claim source fields are set to null by design.
      </div>
    </div>
  );
}
