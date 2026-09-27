import { GuardrailResult, NutritionAssistantResponse } from "@/types/nutrition";

/**
 * Normalizes input string by stripping zero-width unicode characters,
 * collapsing multiple spaces, and normalizing leetspeak/spaced characters.
 */
export function normalizeInput(input: string): string {
  // Strip zero-width characters (ZWSP, ZWNJ, ZWJ, BOM)
  let clean = input.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Collapse consecutive whitespaces
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

// ---------------------------------------------------------------------------
// 1. Calorie Target & Deficit Patterns
// ---------------------------------------------------------------------------

const PRESCRIPTIVE_CALORIE_REGEX = [
  // Direct & third-party calorie/kcal questions
  /\bhow\s+many\s+calories\s+(should|can|do|does|must|would|could)?\s*(i|we|a\s+person|someone|an\s+adult|she|he|my\s+friend|one)?\s*(need(\s+to)?|eat|consume|intake|take\s+in)\b/i,
  /\bhow\s+many\s+calories\s+.*(need\s+to\s+eat|should\s+eat|to\s+lose|to\s+burn)\b/i,
  /\bcalculate\s+(my|a|an|the)?\s*(daily\s+)?(calorie|calories|tdee|bmr|caloric)\s*(target|goal|deficit|need|allowance|intake)\b/i,
  /\b(exact|my|personal|daily|recommended|optimal|target|prescribed|ideal)\s*(calorie|calories|kcal|energy)\s*(target|goal|deficit|limit|intake|prescription)\b/i,
  /\b(\d{3,4})\s*(kcal|calorie|calories)\s*(daily\s+)?(meal\s+plan|diet|deficit|target|plan)\b/i,
  /\bcalorie\s+deficit\s+(to|for|of)\s+(\d+|\w+)?\s*(lose|weight|fat|drop)\b/i,
  /\bhow\s+many\s+calories\s+(to\s+lose|to\s+drop|for\s+weight\s+loss)\b/i,
  /\b(daily\s+)?(energy\s+restriction|negative\s+energy\s+balance)\s*(in\s+(kcal|kilocalories|calories)|for\s+weight\s+loss|to\s+lose|to\s+achieve)?\b/i,
  /\b(what\s+should|calculate)\s+(my\s+)?(daily\s+)?(energy\s+restriction|caloric\s+restriction)\b/i,
  /\b(to\s+)?achieve\s+negative\s+energy\s+balance\b/i,
  // Spaced / de-obfuscated: c-a-l-o-r-i-e or c a l o r i e target
  /\bc[\s\-]*a[\s\-]*l[\s\-]*o[\s\-]*r[\s\-]*i[\s\-]*e\s*(target|deficit|goal|plan)\b/i,
  // Macro calculations for caloric restriction / deficit
  /\bcalculate\s+(my|a|an|the)?\s*(daily\s+)?(macros?|caloric\s+macros?)\s*(target|goal|split|deficit|intake)\s*(for\s+weight\s+loss|to\s+cut|to\s+lose)?\b/i,
  // Direct deficit requests in kcal or calories
  /\b(what\s+should\s+my|how\s+much\s+should\s+my|what\s+is\s+my)\s*(daily\s+)?(deficit|caloric\s+deficit)\b/i,
  /\bdaily\s+deficit\s*(be)?\s*(in\s+kcal|in\s+calories|for\s+weight\s+loss|to\s+lose)\b/i,
  // Extreme starvation and purging requests
  /\b(starvation\s+diet|starve\s+myself\s+to\s+lose|how\s+to\s+purge|purge\s+after\s+(eating|a\s+meal))\b/i
];

// Educational queries about calories that MUST be allowed (false positive prevention)
const BENIGN_EDUCATIONAL_CALORIE_REGEX = [
  /\b(what\s+is\s+(a\s+)?calorie|definition\s+of\s+(a\s+)?calorie|history\s+of\s+(the\s+)?calorie)\b/i,
  /\b(how\s+(are|is)\s+calories?\s+measured|how\s+does\s+a\s+bomb\s+calorimeter\s+work|bomb\s+calorimeter)\b/i,
  /\bcalories?\s+in\s+(a|an|\d+g|\d+\s*grams?|100g)?\s*([a-zA-Z\s]+)\b/i, // "calories in an apple" -> food composition fact
  /\bhow\s+many\s+calories\s+(are\s+in|does\s+[a-zA-Z\s]+\s+contain)\b/i // "how many calories are in an egg" -> food composition
];

// ---------------------------------------------------------------------------
// 2. Weight Target Patterns
// ---------------------------------------------------------------------------

const WEIGHT_TARGET_PATTERNS = [
  /\bhow\s+much\s+(should|can|ought\s+to)\s+(i|we|she|he|someone|a\s+person|my\s+friend)\s+weigh\b/i,
  /\b(what\s+should|what\s+ought\s+to)\s+(my|her|his|a\s+person's|someone's)\s+weight\s+be\b/i,
  /\b(ideal|target|goal|healthy|optimal)\s+(body\s+)?weight\s*(for\s+(a\s+)?(female|male|man|woman|person|\d+'\d+|\d+\s*cm))?\b/i,
  /\bwhat\s+(bmi|body\s+mass\s+index)\s+(should\s+i\s+aim\s+for|target\s+should\s+i\s+have)\b/i,
  /\blose\s+\d+\s*(lbs|pounds|kg|kilos)\s+in\s+\d+\s*(days|weeks|months)\b/i,
  /\bwhat\s+should\s+(i|she|he)\s+weigh\s+at\b/i
];

// Educational queries about BMI/weight that should be allowed
const BENIGN_WEIGHT_REGEX = [
  /\bwhat\s+is\s+bmi\b/i,
  /\bhow\s+is\s+bmi\s+calculated\b/i,
  /\bhistory\s+of\s+body\s+mass\s+index\b/i
];

// ---------------------------------------------------------------------------
// 3. Medical Advice & Clinical Disease Treatment Patterns
// ---------------------------------------------------------------------------

const MEDICAL_ADVICE_PATTERNS = [
  /\b(cure|treat|heal|reverse|manage\s+my|eliminate)\s+(my\s+)?(diabetes|type\s*[12]\s*diabetes|cancer|hypertension|kidney\s+disease|ckd|eating\s+disorder|anorexia|bulimia|renal\s+failure|cirrhosis|pancreatitis|gallstones)\b/i,
  /\b(diagnosed\s+with|have)\s+.*(cure|treat|heal|reverse|what\s+foods?\s+(should|to)\s+(i\s+)?eat)\b/i,
  /\b(stage\s+\d+\s+)?(chronic\s+)?(kidney\s+disease|ckd|renal\s+disease|renal\s+failure)\b.*(protein|daily\s+grams|what\s+to\s+eat|diet|food|intake)\b/i,
  /\b(protein|daily\s+grams|what\s+to\s+eat|diet|food|intake)\b.*(stage\s+\d+\s+)?(chronic\s+)?(kidney\s+disease|ckd|renal\s+disease|renal\s+failure)\b/i,
  /\b(stage\s+\d+)\s+(chronic\s+)?(kidney\s+disease|ckd|cancer|renal\s+disease)\b/i,
  /\bwhat\s+should\s+i\s+eat\s+for\s+(stage\s+\d+\s+)?(kidney\s+disease|renal\s+disease|liver\s+failure|chemotherapy|renal\s+failure|cancer|tumors?)\b/i,
  /\bwhat\s+diet\s+will\s+(dissolve|cure|heal|reverse)\s+(my\s+)?(kidney\s+stones|diabetes|hypertension|tumors?)\b/i,
  /\b(fasting\s+blood\s+sugar|glucose|blood\s+pressure|hba1c)\s*(is\s*)?(\d{2,3}(\.\d)?)\s*(mg\/dl|mmhg|%)?\s*.*(what\s+to\s+eat|cure|treat|lower\s+immediately)\b/i,
  /\bdiagnose\s+(my|me)\b/i,
  /\bwithout\s+taking\s+(my\s+)?(insulin|metformin|blood\s+pressure|statin|medication|pills?|drugs?)\b/i,
  /\bstop\s+taking\s+(my\s+)?(insulin|metformin|blood\s+pressure|statin|medication)\b/i,
  /\bshould\s+i\s+stop\s+(my\s+)?medication\b/i
];

// ---------------------------------------------------------------------------
// Main Scope Evaluator
// ---------------------------------------------------------------------------

export function evaluateScopeGuardrail(
  rawInput: string,
  historyContext: Array<{ role: string; content: string }> = []
): GuardrailResult {
  const normalized = normalizeInput(rawInput);

  if (normalized.length === 0) {
    return {
      allowed: false,
      refusalResponse: createRefusal(
        "Please provide a valid question regarding food, nutrition principles, or culinary food safety."
      )
    };
  }

  // Combine context if recent turn introduced an ambiguous setup
  const lastUserTurn = historyContext
    .filter((m) => m.role === "user")
    .slice(-1)[0]?.content;
  const contextToCheck = lastUserTurn
    ? `${normalizeInput(lastUserTurn)} ${normalized}`
    : normalized;

  // 1. Check Calorie Targets
  const isEducationalCalorie = BENIGN_EDUCATIONAL_CALORIE_REGEX.some((re) =>
    re.test(normalized)
  );

  if (!isEducationalCalorie) {
    for (const pattern of PRESCRIPTIVE_CALORIE_REGEX) {
      if (pattern.test(normalized) || (lastUserTurn && pattern.test(contextToCheck))) {
        return {
          allowed: false,
          reason: "calorie_target",
          refusalResponse: createRefusal(
            "I cannot prescribe personal calorie targets, caloric deficits, or individualized energy intake plans. Caloric requirements depend on individual metabolic health, physical activity, and medical history. Please consult a Registered Dietitian (RD) or qualified healthcare provider for personalized guidance."
          )
        };
      }
    }
  }

  // 2. Check Weight Targets
  const isEducationalWeight = BENIGN_WEIGHT_REGEX.some((re) =>
    re.test(normalized)
  );

  if (!isEducationalWeight) {
    for (const pattern of WEIGHT_TARGET_PATTERNS) {
      if (pattern.test(normalized) || (lastUserTurn && pattern.test(contextToCheck))) {
        return {
          allowed: false,
          reason: "weight_recommendation",
          refusalResponse: createRefusal(
            "I cannot recommend target body weights or prescribe what any individual should weigh. Healthy body composition varies significantly based on genetics, frame, muscle mass, and clinical indicators. Please consult a physician or licensed dietitian for individualized body composition assessments."
          )
        };
      }
    }
  }

  // 3. Check Medical Advice & Clinical Disease Treatment
  for (const pattern of MEDICAL_ADVICE_PATTERNS) {
    if (pattern.test(normalized) || (lastUserTurn && pattern.test(contextToCheck))) {
      return {
        allowed: false,
        reason: "medical_advice",
        refusalResponse: createRefusal(
          "I cannot provide clinical medical nutrition therapy, diagnose health conditions, or prescribe diets to treat illnesses. Nutrition during chronic or acute medical conditions must be supervised by your treating physician and a clinical dietitian. Please consult your healthcare provider."
        )
      };
    }
  }

  return { allowed: true };
}

function createRefusal(answerText: string): NutritionAssistantResponse {
  return {
    answer: answerText,
    claims: [
      {
        claim_text:
          "Individualized calorie targets, body weight goals, and therapeutic medical diets require personalized evaluation by a licensed healthcare professional or registered dietitian.",
        source: null
      }
    ]
  };
}
