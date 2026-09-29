import { ChatMessage, ClaimItem } from "../types";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { AlertCircle, X } from "lucide-react";

interface ChatBoxProps {
  sessionId?: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onInspectClaims: (claims: ClaimItem[]) => void;
  errorBanner: string | null;
  onDismissError: () => void;
  onPinMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export function ChatBox({
  messages,
  isLoading,
  onSendMessage,
  onInspectClaims,
  errorBanner,
  onDismissError,
  onPinMessage,
  onEditMessage,
  onDeleteMessage
}: ChatBoxProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-1 min-w-0">
      {/* Error Banner */}
      {errorBanner && (
        <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="font-bold text-rose-500 hover:text-rose-700 p-1"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable Message List */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onInspectClaims={onInspectClaims}
        onPinMessage={onPinMessage}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
      />

      {/* Chat Input Container */}
      <div className="p-3 md:p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 shrink-0">
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
