"use client";

import React, { useState, useEffect } from "react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatMessage, Claim, NutritionAssistantResponse } from "@/types/nutrition";

interface ChatContainerProps {
  sessionId: string;
  onInspectClaims?: (claims: Claim[]) => void;
  onSessionUpdated?: () => void;
}

export function ChatContainer({
  sessionId,
  onInspectClaims,
  onSessionUpdated
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/history/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages) && isMounted) {
            const parsed: ChatMessage[] = data.messages.map((m: any) => ({
              id: m.id,
              sessionId: m.sessionId,
              role: m.role as "user" | "assistant",
              content: m.content,
              claims: m.claims?.map((c: any) => ({
                claim_text: c.claimText,
                source: c.source ?? null
              })),
              createdAt: m.createdAt
            }));
            setMessages(parsed);

            // Automatically pass latest claims if available
            const lastAssistant = parsed.filter((m) => m.role === "assistant").pop();
            if (lastAssistant?.claims && onInspectClaims) {
              onInspectClaims(lastAssistant.claims);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load initial chat history:", err);
      }
    }
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const handleSendMessage = async (text: string) => {
    setErrorBanner(null);

    const userMessage: ChatMessage = {
      id: "usr-" + Date.now(),
      sessionId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Request failed");
      }

      const responsePayload = data as NutritionAssistantResponse;

      const assistantMessage: ChatMessage = {
        id: "ast-" + Date.now(),
        sessionId,
        role: "assistant",
        content: responsePayload.answer,
        claims: responsePayload.claims,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (responsePayload.claims && onInspectClaims) {
        onInspectClaims(responsePayload.claims);
      }

      if (onSessionUpdated) {
        onSessionUpdated();
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorBanner(err.message || "Failed to communicate with assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {errorBanner && (
        <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex justify-between items-center shrink-0">
          <span>Error: {errorBanner}</span>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="font-bold ml-2 text-rose-500 hover:text-rose-700"
          >
            ×
          </button>
        </div>
      )}

      <MessageList
        messages={messages}
        isLoading={isLoading}
        onInspectClaims={onInspectClaims}
        onSelectPrompt={handleSendMessage}
      />

      <div className="p-3 md:p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 shrink-0">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
