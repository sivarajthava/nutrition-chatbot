"use client";

import React, { useState } from "react";
import { User, Bot, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Claim } from "@/types/nutrition";

interface MessageItemProps {
  role: "user" | "assistant" | "system";
  content: string;
  claims?: Claim[];
}

export function MessageItem({ role, content, claims }: MessageItemProps) {
  const [showClaims, setShowClaims] = useState(false);
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3.5 ${
        isUser ? "flex-row-reverse" : "flex-row"
      } items-start`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-slate-800 dark:bg-slate-700 text-white"
            : "bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs space-y-2 ${
          isUser
            ? "bg-slate-900 text-white dark:bg-slate-800"
            : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <div>
            <MarkdownRenderer content={content} />

            {claims && claims.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowClaims(!showClaims)}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
                >
                  <span>
                    {claims.length} {claims.length === 1 ? "claim" : "claims"} extracted
                  </span>
                  {showClaims ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showClaims && (
                  <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-emerald-500/40">
                    {claims.map((claim, idx) => (
                      <div key={idx} className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1.5">
                          #{idx + 1}
                        </span>
                        <span>{claim.claim_text}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Source:{" "}
                          <span className="font-mono text-amber-600 dark:text-amber-400">
                            null (unverified baseline)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
