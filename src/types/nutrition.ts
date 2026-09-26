export interface Claim {
  claim_text: string;
  source: null; // Strictly null in Milestone 1
}

export interface NutritionAssistantResponse {
  answer: string;
  claims: Claim[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  claims?: Claim[];
  createdAt: string;
}

export interface GuardrailResult {
  allowed: boolean;
  reason?: "calorie_target" | "weight_recommendation" | "medical_advice";
  refusalResponse?: NutritionAssistantResponse;
}
