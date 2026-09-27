import { ServerHealth } from "../types";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, ShieldCheck, Cpu, ListChecks } from "lucide-react";

interface HeaderBarProps {
  serverHealth: ServerHealth;
  onToggleSidebar: () => void;
  onToggleClaims: () => void;
  claimsCount: number;
}

export function HeaderBar({
  serverHealth,
  onToggleSidebar,
  onToggleClaims,
  claimsCount
}: HeaderBarProps) {
  const isOnline = serverHealth.status === "online";
  const isChecking = serverHealth.status === "checking";

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 md:px-6 flex items-center justify-between shrink-0 z-30">
      {/* Left section: Hamburger + App Title */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            AI Nutrition Assistant
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold tracking-wide">
              M1
            </span>
          </h1>
        </div>
      </div>

      {/* Right section: Status pills, claims toggle, theme switcher */}
      <div className="flex items-center gap-2 md:gap-3 text-xs">
        {/* Server Connection Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
            isOnline
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
              : isChecking
              ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
              : "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
          }`}
          title={`Server status: ${serverHealth.status}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline
                ? "bg-emerald-500 animate-pulse"
                : isChecking
                ? "bg-amber-500 animate-pulse"
                : "bg-rose-500"
            }`}
          />
          <span className="hidden sm:inline">
            {isOnline ? "Connected" : isChecking ? "Connecting..." : "Server Offline"}
          </span>
        </div>

        {/* Model Badge */}
        {serverHealth.model && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-mono">
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            <span>{serverHealth.model.split("/").pop()}</span>
          </div>
        )}

        {/* Guardrail Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Guardrails Active</span>
        </div>

        {/* Toggle Claims Sidecar */}
        <button
          type="button"
          onClick={onToggleClaims}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
          title="Toggle Claims Inspector sidecar"
        >
          <ListChecks className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline">Claims</span>
          {claimsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
              {claimsCount}
            </span>
          )}
        </button>

        {/* Theme Switcher */}
        <ThemeToggle />
      </div>
    </header>
  );
}
