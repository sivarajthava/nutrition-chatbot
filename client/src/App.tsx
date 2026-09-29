import { useState, useEffect, useMemo } from "react";
import { ChatMessage, ChatSession, ClaimItem, NutritionAssistantResponse, ServerHealth } from "./types";
import { HeaderBar } from "./components/HeaderBar";
import { SessionSidebar } from "./components/SessionSidebar";
import { ChatBox } from "./components/ChatBox";
import { ClaimsInspector } from "./components/ClaimsInspector";

// Resolve API endpoint URL:
// 1. If VITE_API_URL is set, use it.
// 2. In Vite dev mode (import.meta.env.DEV), use relative paths handled by Vite proxy.
// 3. In production/preview/static deployment, default directly to Railway production backend.
const getApiUrl = (path: string): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/+$/, "")}${path}`;
  }
  if (import.meta.env.DEV) {
    return path;
  }
  return `https://nutrition-chatbot-production.up.railway.app${path}`;
};

export function App() {
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem("active_session_id") || `session-${Date.now()}`;
  });
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [activeClaims, setActiveClaims] = useState<ClaimItem[]>([]);
  const [isClaimsOpen, setIsClaimsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [serverHealth, setServerHealth] = useState<ServerHealth>({
    status: "checking"
  });

  // Determine active session title
  const activeSessionTitle = useMemo(() => {
    const found = sessions.find((s) => s.id === sessionId);
    return found?.title || "Nutrition Chat";
  }, [sessions, sessionId]);

  // Check server health on mount and periodically
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(getApiUrl("/api/health"));
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
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
        console.warn("Server health check failed:", err);
        setServerHealth({ status: "offline" });
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch session list
  const refreshSessions = async () => {
    try {
      const res = await fetch(getApiUrl("/api/sessions"));
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
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

  // Fetch message history whenever sessionId changes
  useEffect(() => {
    let isMounted = true;
    localStorage.setItem("active_session_id", sessionId);

    async function fetchHistory() {
      try {
        const res = await fetch(getApiUrl(`/api/history/${sessionId}`));
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          if (Array.isArray(data.messages) && isMounted) {
            // Retrieve pinned message IDs for this session
            const pinnedSet = new Set<string>();
            try {
              const storedPins = localStorage.getItem(`pinned_${sessionId}`);
              if (storedPins) {
                JSON.parse(storedPins).forEach((id: string) => pinnedSet.add(id));
              }
            } catch {}

            const parsed: ChatMessage[] = data.messages.map((m: any) => ({
              id: m.id,
              sessionId: m.sessionId,
              role: m.role as "user" | "assistant",
              content: m.content,
              claims: m.claims?.map((c: any) => ({
                claim_text: c.claimText,
                source: c.source ?? null
              })),
              createdAt: m.createdAt,
              isPinned: pinnedSet.has(m.id)
            }));
            setMessages(parsed);

            // Automatically load claims from the last assistant message if available
            const lastAssistant = parsed.filter((m) => m.role === "assistant").pop();
            if (lastAssistant?.claims && lastAssistant.claims.length > 0) {
              setActiveClaims(lastAssistant.claims);
            } else {
              setActiveClaims([]);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load message history:", err);
      }
    }

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Handle message sending
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
      const res = await fetch(getApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text })
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Unexpected server response (HTTP ${res.status}). Ensure backend is reachable.`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || `Request failed with status ${res.status}`);
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

      if (responsePayload.claims && responsePayload.claims.length > 0) {
        setActiveClaims(responsePayload.claims);
      }

      // Refresh session sidebar to reflect new message/timestamp
      refreshSessions();
    } catch (err: any) {
      console.error("Chat transmission error:", err);
      setErrorBanner(err.message || "Failed to communicate with assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new session
  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    setSessionId(newId);
    setMessages([]);
    setActiveClaims([]);
    setIsSidebarOpen(false);
  };

  // Rename a session
  const handleRenameSession = async (idToRename: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === idToRename ? { ...s, title: newTitle } : s))
    );

    try {
      await fetch(getApiUrl("/api/sessions"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: idToRename, title: newTitle })
      });
    } catch (err) {
      console.warn("Failed to persist session rename to server:", err);
    }
  };

  // Delete a session
  const handleDeleteSession = async (idToDelete: string) => {
    try {
      await fetch(getApiUrl(`/api/sessions?sessionId=${idToDelete}`), { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== idToDelete));
      try {
        localStorage.removeItem(`pinned_${idToDelete}`);
      } catch {}
      if (sessionId === idToDelete) {
        handleNewSession();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Pin or Unpin a message
  const handlePinMessage = (messageId: string) => {
    setMessages((prev) => {
      const updated = prev.map((m) =>
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
      );

      // Persist to localStorage
      try {
        const pinnedIds = updated.filter((m) => m.isPinned).map((m) => m.id);
        localStorage.setItem(`pinned_${sessionId}`, JSON.stringify(pinnedIds));
      } catch (err) {
        console.warn("Could not save pinned messages to localStorage:", err);
      }

      return updated;
    });
  };

  // Edit a message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
      )
    );

    try {
      await fetch(getApiUrl(`/api/messages/${messageId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent })
      });
    } catch (err) {
      console.warn("Failed to sync edited message with server:", err);
    }
  };

  // Delete a message
  const handleDeleteMessage = async (messageId: string) => {
    setMessages((prev) => {
      const updated = prev.filter((m) => m.id !== messageId);
      try {
        const pinnedIds = updated.filter((m) => m.isPinned).map((m) => m.id);
        localStorage.setItem(`pinned_${sessionId}`, JSON.stringify(pinnedIds));
      } catch {}
      return updated;
    });

    try {
      await fetch(getApiUrl(`/api/messages/${messageId}`), { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete message on server:", err);
    }
  };

  // Inspect claims
  const handleInspectClaims = (claims: ClaimItem[]) => {
    setActiveClaims(claims);
    setIsClaimsOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* Multi-Session Sidebar */}
      <SessionSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onSelectSession={(id) => {
          setSessionId(id);
          setIsSidebarOpen(false);
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <HeaderBar
          serverHealth={serverHealth}
          activeSessionTitle={activeSessionTitle}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onToggleClaims={() => setIsClaimsOpen((prev) => !prev)}
          onRenameSession={(newTitle) => handleRenameSession(sessionId, newTitle)}
          claimsCount={activeClaims.length}
        />

        {/* Content Area: Chat Box + Claims Inspector */}
        <div className="flex-1 flex overflow-hidden p-3 md:p-6 gap-4 md:gap-6 min-h-0">
          {/* Chat Workspace */}
          <main className="flex-1 flex flex-col h-full min-w-0">
            <ChatBox
              sessionId={sessionId}
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onInspectClaims={handleInspectClaims}
              errorBanner={errorBanner}
              onDismissError={() => setErrorBanner(null)}
              onPinMessage={handlePinMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
            />
          </main>

          {/* Claims Inspector Sidecar (Desktop or Toggled) */}
          <div
            className={`transition-all duration-200 ease-in-out shrink-0 ${
              isClaimsOpen
                ? "w-80 md:w-96 rounded-2xl overflow-hidden shadow-sm flex flex-col"
                : "hidden"
            }`}
          >
            <ClaimsInspector
              claims={activeClaims}
              isOpen={isClaimsOpen}
              onClose={() => setIsClaimsOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
