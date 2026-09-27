"use client";

import React, { useState, useEffect } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { SourcesPanel } from "@/components/sources/SourcesPanel";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { SessionSidebar } from "@/components/chat/SessionSidebar";
import { Claim, ChatSession, ServerHealth } from "@/types/nutrition";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("default-session");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeClaims, setActiveClaims] = useState<Claim[]>([]);
  const [isClaimsOpen, setIsClaimsOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [serverHealth, setServerHealth] = useState<ServerHealth>({
    status: "checking"
  });

  // Check server health
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          setServerHealth({
            status: "online",
            service: data.service,
            version: data.version,
            milestone: data.milestone,
            provider: data.provider,
            model: data.model,
            guardrails: data.guardrails
          });
        } else {
          setServerHealth({ status: "offline" });
        }
      } catch (err) {
        setServerHealth({ status: "offline" });
      }
    }

    checkHealth();
  }, []);

  // Fetch sessions list
  const refreshSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      }
    } catch (err) {
      console.warn("Could not fetch sessions list:", err);
    }
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    setSessionId(newId);
    setActiveClaims([]);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = async (idToDelete: string) => {
    try {
      await fetch(`/api/sessions?sessionId=${idToDelete}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== idToDelete));
      if (sessionId === idToDelete) {
        handleNewSession();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* Multi-Session Sidebar Drawer */}
      <SessionSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onSelectSession={(id) => {
          setSessionId(id);
          setIsSidebarOpen(false);
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <HeaderBar
          serverHealth={serverHealth}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onToggleClaims={() => setIsClaimsOpen((prev) => !prev)}
          claimsCount={activeClaims.length}
        />

        {/* Main Content Area: Chat Panel + Claims Sidecar */}
        <div className="flex-1 flex overflow-hidden p-3 md:p-6 gap-4 md:gap-6 min-h-0">
          {/* Chat Panel */}
          <main className="flex-1 flex flex-col h-full min-w-0">
            <ChatContainer
              sessionId={sessionId}
              onInspectClaims={(claims) => {
                setActiveClaims(claims);
              }}
              onSessionUpdated={refreshSessions}
            />
          </main>

          {/* Sources & Citations Sidecar */}
          <aside
            className={`transition-all duration-200 ease-in-out shrink-0 ${
              isClaimsOpen
                ? "w-80 md:w-96 rounded-2xl overflow-hidden shadow-sm flex flex-col"
                : "hidden"
            }`}
          >
            <SourcesPanel
              claims={activeClaims}
              isOpen={isClaimsOpen}
              onClose={() => setIsClaimsOpen(false)}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
