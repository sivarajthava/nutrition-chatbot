import React from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { SourcesPanel } from "@/components/sources/SourcesPanel";
import { Salad, ShieldCheck } from "lucide-react";

export default function Home() {
  const sessionId = "default-session";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Salad className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              AI Nutrition Assistant
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold tracking-wide">
                Milestone 1
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Guardrails Active</span>
          </div>
        </div>
      </header>

      {/* Main Dual-Panel View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 min-h-0">
        {/* Chat Panel */}
        <section className="lg:col-span-8 h-[calc(100vh-5rem)] min-h-[500px]">
          <ChatContainer sessionId={sessionId} />
        </section>

        {/* Sources & Citations Sidecar */}
        <section className="lg:col-span-4 h-[calc(100vh-5rem)] min-h-[300px]">
          <SourcesPanel />
        </section>
      </main>
    </div>
  );
}
