"use client";

import React, { useEffect, useRef } from "react";
import { MessageItem } from "./MessageItem";
import { ChatMessage } from "@/types/nutrition";
import { Sparkles, ShieldAlert } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSelectPrompt?: (prompt: string) => void;
}

const SAMPLE_PROMPTS = [
  "How many grams of protein does a 70kg vegetarian need?",
  "How long can cooked rice be safely stored in the fridge?",
  "Does boiling broccoli destroy its vitamin C?",
  "What are healthy high-iron plant foods?"
];

export function MessageList({
  messages,
  isLoading,
  onSelectPrompt
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          AI Nutrition Assistant Prototype
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6">
          Ask questions about human nutrition, culinary food safety, and cooking science.
          Answering from model memory for Milestone 1.
        </p>

        <div className="w-full max-w-md grid grid-cols-1 gap-2 text-left">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt?.(prompt)}
              className="text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xs text-slate-700 dark:text-slate-300 transition-all text-left"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 max-w-sm">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            Calorie deficit targets, weight targets, and medical advice are declined by code-level guardrails.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          role={msg.role}
          content={msg.content}
          claims={msg.claims}
        />
      ))}
      {isLoading && (
        <div className="flex gap-3.5 items-center text-slate-400 text-xs py-2 pl-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Generating structured nutritional response...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
