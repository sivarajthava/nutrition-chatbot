import { useState } from "react";
import { ChatMessage, ClaimItem } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Bot, User, Copy, Check, ListChecks } from "lucide-react";

interface MessageItemProps {
  message: ChatMessage;
  onInspectClaims?: (claims: ClaimItem[]) => void;
}

export function MessageItem({ message, onInspectClaims }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const claimsCount = message.claims?.length || 0;

  return (
    <div className={`flex gap-3 my-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Card */}
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-xs relative group ${
          isUser
            ? "bg-emerald-600 text-white rounded-tr-xs"
            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs"
        }`}
      >
        {/* Message Content */}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div>
            <MarkdownRenderer content={message.content} />

            {/* Bottom Actions Bar for Assistant */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Claims Badge Counter */}
              {claimsCount > 0 ? (
                <button
                  type="button"
                  onClick={() => onInspectClaims && onInspectClaims(message.claims || [])}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                  title="Inspect atomic factual claims extracted from this answer"
                >
                  <ListChecks className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {claimsCount} {claimsCount === 1 ? "claim" : "claims"} extracted
                  </span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">Parametric response</span>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Copy answer to clipboard"
                  aria-label="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
