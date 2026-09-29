export interface ClaimItem {
  claim_text: string;
  source: string | null;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  claims?: ClaimItem[];
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  isEdited?: boolean;
}

export interface NutritionAssistantResponse {
  answer: string;
  claims: ClaimItem[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

export interface ServerHealth {
  status: "online" | "offline" | "checking";
  service?: string;
  version?: string;
  milestone?: string;
  provider?: string;
  model?: string;
  guardrails?: string;
}
