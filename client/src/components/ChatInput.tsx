import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { PromptChips } from "./PromptChips";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 1500;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || trimmed.length > MAX_CHARS) return;

    onSendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isOverLimit = input.length > MAX_CHARS;

  return (
    <div className="w-full">
      {/* Preset Prompt Chips */}
      <PromptChips onSelectPrompt={(q) => onSendMessage(q)} disabled={isLoading} />

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all p-2"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about food, nutrition science, or food safety..."
          rows={1}
          disabled={isLoading}
          className="w-full px-2 py-1.5 bg-transparent resize-none outline-hidden text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 max-h-40 leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1 px-1 text-xs">
          <span
            className={`text-[11px] font-mono ${
              isOverLimit
                ? "text-rose-600 font-bold"
                : input.length > MAX_CHARS * 0.8
                ? "text-amber-500"
                : "text-slate-400"
            }`}
          >
            {input.length} / {MAX_CHARS}
          </span>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-slate-400">
              Shift+Enter for newline
            </span>
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isOverLimit}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
