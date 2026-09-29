import { useEffect, useRef } from "react";
import { ChatMessage, ClaimItem } from "../types";
import { MessageItem } from "./MessageItem";
import { Salad, ShieldCheck, Sparkles, Pin } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onInspectClaims?: (claims: ClaimItem[]) => void;
  onSelectPrompt?: (text: string) => void;
  onPinMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  onInspectClaims,
  onPinMessage,
  onEditMessage,
  onDeleteMessage
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const pinnedMessages = messages.filter((m) => m.isPinned);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-emerald-500");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-emerald-500");
      }, 2000);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
          <Salad className="w-7 h-7" />
        </div>

        <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Nutrition & Food Safety Assistant
        </h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          Ask questions about dietary guidelines, nutrient requirements, culinary food storage, and cooking science.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-xl w-full text-left text-xs mb-4">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Parametric Baseline</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Operates from internal parametric knowledge with claims extracted and isolated for Milestone 2 RAG.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safety Guardrails</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Code-level interceptors strictly block personal calorie deficits, target weights, and clinical medical diets.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              <Salad className="w-3.5 h-3.5" />
              <span>Factual Food Safety</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Grounded in USDA/FDA culinary guidelines for refrigeration temperatures, bacterial safety, and cooking.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Pinned Messages Quick Bar */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/40 shrink-0 flex items-center gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 shrink-0">
            <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Pinned ({pinnedMessages.length}):</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {pinnedMessages.map((pm, idx) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => scrollToMessage(pm.id)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 text-slate-700 dark:text-slate-200 hover:border-amber-500 text-[11px] truncate max-w-[180px] transition-colors"
                title={pm.content}
              >
                <span className="font-bold text-amber-600 dark:text-amber-400">#{idx + 1}</span>
                <span className="truncate">{pm.content}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onInspectClaims={onInspectClaims}
            onPinMessage={onPinMessage}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
          />
        ))}

        {isLoading && (
          <div className="flex gap-3 my-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1 animate-pulse">
              <Salad className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs p-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Analyzing nutritional science & evaluating claims...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
