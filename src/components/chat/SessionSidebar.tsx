"use client";

import { ChatSession } from "@/types/nutrition";
import { Plus, MessageSquare, Trash2, X, Salad } from "lucide-react";

interface SessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  onClose
}: SessionSidebarProps) {
  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Salad className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Nutrition Chat
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <span className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Recent Sessions
        </span>

        {sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No saved conversations yet. Start a new chat!
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/80 font-medium"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
                onClick={() => onSelectSession(sess.id)}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                  <MessageSquare
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  <div className="truncate">
                    <p className="truncate">{sess.title || "Nutrition Query"}</p>
                    <p className="text-[10px] text-slate-400 truncate font-normal">
                      {new Date(sess.updatedAt || sess.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(sess.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shrink-0"
                  title="Delete session"
                  aria-label="Delete session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-600 dark:text-slate-300">Milestone 1 Prototype</p>
        <p>Parametric Memory Baseline</p>
      </div>
    </aside>
  );
}
