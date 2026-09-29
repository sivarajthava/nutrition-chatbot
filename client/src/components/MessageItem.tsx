import { useState } from "react";
import { ChatMessage, ClaimItem } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Bot, User, Copy, Check, ListChecks, Pin, PinOff, Pencil, Trash2, X } from "lucide-react";

interface MessageItemProps {
  message: ChatMessage;
  onInspectClaims?: (claims: ClaimItem[]) => void;
  onPinMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export function MessageItem({
  message,
  onInspectClaims,
  onPinMessage,
  onEditMessage,
  onDeleteMessage
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editDraft.trim() && editDraft.trim() !== message.content) {
      onEditMessage?.(message.id, editDraft.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditDraft(message.content);
    setIsEditing(false);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatFullDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return "";
    }
  };

  const claimsCount = message.claims?.length || 0;

  return (
    <div
      id={`msg-${message.id}`}
      className={`flex gap-3 my-4 group transition-all duration-200 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Card */}
      <div
        className={`max-w-[88%] md:max-w-[78%] rounded-2xl p-4 shadow-xs relative transition-all duration-150 ${
          message.isPinned
            ? "ring-2 ring-amber-400/80 dark:ring-amber-500/80"
            : ""
        } ${
          isUser
            ? "bg-emerald-600 text-white rounded-tr-xs"
            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs"
        }`}
      >
        {/* Pinned Tag Indicator */}
        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 dark:text-amber-400 mb-1.5 pb-1 border-b border-amber-400/20">
            <Pin className="w-3 h-3 fill-amber-400 text-amber-500" />
            <span>Pinned Message</span>
          </div>
        )}

        {/* Message Header (Sender label + Timestamp) */}
        <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] opacity-80">
          <span className="font-medium tracking-wide">
            {isUser ? "You" : "Nutrition Assistant"}
          </span>
          <div className="flex items-center gap-1.5">
            {message.isEdited && (
              <span className="text-[10px] italic opacity-75">(edited)</span>
            )}
            <time
              dateTime={message.createdAt}
              title={formatFullDate(message.createdAt)}
              className="text-[11px] select-none"
            >
              {formatTime(message.createdAt)}
            </time>
          </div>
        </div>

        {/* Message Content or Edit Mode */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={3}
              className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-y ${
                isUser
                  ? "bg-emerald-700/80 text-white placeholder-emerald-200 border-emerald-500 focus:ring-white/40"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
              }`}
              placeholder="Edit message..."
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isUser
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editDraft.trim()}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isUser
                    ? "bg-white text-emerald-800 hover:bg-emerald-50"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                Save
              </button>
            </div>
          </div>
        ) : isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div>
            <MarkdownRenderer content={message.content} />
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div
          className={`mt-3 pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
            isUser
              ? "border-emerald-500/40 text-emerald-100"
              : "border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400"
          }`}
        >
          {/* Claims Badge Counter (for assistant messages) */}
          {!isUser && (
            <div>
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
            </div>
          )}

          {/* Spacer if user message */}
          {isUser && <div className="text-[10px] text-emerald-200">Sent</div>}

          {/* Action Toolbar */}
          <div className="flex items-center gap-0.5">
            {/* Copy Message Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`p-1 rounded-md transition-colors ${
                isUser
                  ? "hover:bg-emerald-700 text-emerald-100 hover:text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
              title={copied ? "Copied!" : "Copy message text"}
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-300 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copied</span>
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Pin / Unpin Message Button */}
            {onPinMessage && (
              <button
                type="button"
                onClick={() => onPinMessage(message.id)}
                className={`p-1 rounded-md transition-colors ${
                  message.isPinned
                    ? "text-amber-400 hover:text-amber-500"
                    : isUser
                    ? "hover:bg-emerald-700 text-emerald-200 hover:text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title={message.isPinned ? "Unpin message" : "Pin message"}
                aria-label={message.isPinned ? "Unpin message" : "Pin message"}
              >
                {message.isPinned ? (
                  <PinOff className="w-3.5 h-3.5" />
                ) : (
                  <Pin className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* Edit Message Button */}
            {onEditMessage && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={`p-1 rounded-md transition-colors ${
                  isUser
                    ? "hover:bg-emerald-700 text-emerald-200 hover:text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title="Edit message"
                aria-label="Edit message"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete Message Button */}
            {onDeleteMessage && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                    <span className="text-[10px] text-rose-600 dark:text-rose-300">Delete?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteMessage(message.id);
                        setShowDeleteConfirm(false);
                      }}
                      className="px-1 py-0.2 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className={`p-1 rounded-md transition-colors ${
                      isUser
                        ? "hover:bg-emerald-700 text-emerald-200 hover:text-rose-200"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600"
                    }`}
                    title="Delete message"
                    aria-label="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
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
