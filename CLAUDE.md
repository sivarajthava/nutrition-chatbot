@AGENTS.md

# AI Nutrition Assistant Prototype (Milestone 1) — Claude Quick Reference

This file provides quick operational reference rules, architecture context, and commands for developing and maintaining the **AI Nutrition Assistant Prototype (Milestone 1)**.

---

## 1. Quick Technical Summary
- **Fullstack Framework**: Next.js 16.3.6 (App Router) + React 19.2.8 + TypeScript 5
- **Standalone Client**: Vite 6 SPA in `/client` (React 19 + Tailwind CSS v4)
- **Styling**: Tailwind CSS v4 (CSS variables, responsive dual-panel layout, dark/light themes)
- **Primary LLM**: Groq Cloud LPU (`openai/gpt-oss-120b` / `qwen/qwen3.6-27b`) with native JSON mode
- **Fallback LLM**: Google Gemini (`gemini-2.5-flash` via `@google/genai`)
- **Schema Validation**: Zod 4.6.5
- **ORM & Database**: Prisma ORM 6.19.3 with SQLite (`dev.db` / `/data/nutrition.db`) & PostgreSQL
- **Test Runner**: `tsx` native test runner

---

## 2. Essential Commands

```bash
# Development
npm run dev           # Start Next.js App Router fullstack server (http://localhost:3000)
npm run client:dev    # Start standalone Vite React client (http://localhost:5173)

# Build & Production Start
npm run build         # Generate Prisma client and compile Next.js
npm run start         # Run database migration check & launch production server

# Testing & Verification
npm test              # Run full 56-test automated test suite
npm run benchmark     # Run 10-Question 3x Failure Log Benchmark
npm run smoke-test    # Run 4-tier live deployment smoke test (e.g. against local or Railway URL)

# Linting
npm run lint          # Run ESLint
```

---

## 3. Core Architectural Invariants

1. **Parametric Memory Only (Milestone 1)**:
   - System answers solely from LLM parametric memory.
   - Every claim in `claims[]` MUST have `source: null`. Zod rejects any non-null strings.
2. **Dual-Layer Scope Guardrails**:
   - `src/lib/guardrails.ts` deterministic code interceptor runs BEFORE any LLM call.
   - Prohibited categories: Calorie/deficit targets, ideal body weight prescriptions, disease curing/medical treatment, disordered eating/starvation triggers, and persona jailbreaks.
   - Permitted categories: Educational definitions (e.g., "what is a calorie"), food composition data ("calories in an apple"), general culinary and food safety guidelines.
3. **Structured Response Contract**:
   - Every `/api/chat` response returns `{ answer: string, claims: Array<{ claim_text: string, source: null }> }`.
4. **Context Window Management**:
   - Context is capped at a rolling 6-turn history to prevent token bloat and context dilution.
5. **Forward Compatibility**:
   - The UI, database models, and API interfaces are pre-architected so that Milestone 2 can inject RAG citations directly into `claims[].source` without breaking changes.

---

## 4. Key File Locations

- **API Route Handlers**:
  - `src/app/api/chat/route.ts` - Main conversational endpoint
  - `src/app/api/health/route.ts` - Server health and active model telemetry
  - `src/app/api/sessions/route.ts` - Session listing, creation, and cascading deletion
  - `src/app/api/history/[sessionId]/route.ts` - Conversation history retrieval
  - `src/app/api/messages/[messageId]/route.ts` - Message deletion and editing
- **Backend Core Logic**:
  - `src/lib/guardrails.ts` - Pre-LLM deterministic guardrail regex & intent engine
  - `src/lib/groq.ts` - Groq client, model selection, structured JSON orchestration
  - `src/lib/gemini.ts` - Google Gen AI SDK client and structured schemas
  - `src/lib/sanitizer.ts` - JSON fence stripper & null source enforcement
  - `src/lib/validation.ts` - Zod schemas and validation helpers
  - `src/lib/db.ts` - Prisma ORM database client & persistence queries
  - `src/lib/prompts/systemPrompt.ts` - System prompt instructions and rules
- **UI Components**:
  - `src/components/chat/` - ChatContainer, MessageList, HeaderBar, PromptChips, ChatInput
  - `src/components/sources/` - SourcesPanel, EmptySourcesPlaceholder
  - `client/src/` - Standalone Vite React 19 application
- **Database & Schemas**:
  - `prisma/schema.prisma` - Prisma database models (Session, Message, Claim, BenchmarkRun, FailureLog)
- **Documentation**:
  - `doc/architecture-plan.md` - System architecture specification
  - `doc/implementation-plan.md` - Phase-by-phase implementation roadmap
  - `doc/deployment-plan.md` - Production multi-topology deployment guide
  - `doc/failure-log.md` - Benchmark results & hallucination taxonomy
