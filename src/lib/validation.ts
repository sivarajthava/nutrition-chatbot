import { z } from "zod";

export const ClaimSchema = z.object({
  claim_text: z.string().min(3, "Claim text must be at least 3 characters"),
  source: z.null()
});

export const NutritionAssistantResponseSchema = z.object({
  answer: z.string().min(10, "Answer must be at least 10 characters"),
  claims: z.array(ClaimSchema).min(1, "At least one claim must be extracted")
});

export type ValidatedNutritionResponse = z.infer<typeof NutritionAssistantResponseSchema>;
