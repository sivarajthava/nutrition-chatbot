"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { EmptySourcesPlaceholder } from "./EmptySourcesPlaceholder";

export function SourcesPanel() {
  return (
    <aside className="w-full h-full flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
            Sources & Grounding Panel
          </h2>
        </div>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          M1 Container
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <EmptySourcesPlaceholder />
      </div>
    </aside>
  );
}
