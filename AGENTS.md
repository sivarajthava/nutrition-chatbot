<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI Nutrition Assistant Prototype (Milestone 1) — Agent Guidelines & System Architecture

## 1. Project Overview & Architectural Mission
This repository implements the **AI Nutrition Assistant Prototype (Milestone 1)**. The application is a fullstack Next.js + React conversational agent designed for objective food, human nutrition, cooking science, and culinary safety questions.

### Milestone 1 Invariants:
1. **Parametric Memory Only**: Operates strictly on LLM parametric memory (Groq LPU with `openai/gpt-oss-120b` / `qwen/qwen3.6-27b`, or Google Gemini `gemini-2.5-flash`). There is no retrieval layer in Milestone 1.
2. **Structured JSON Output**: Every assistant response MUST return `{ answer: string, claims: Array<{ claim_text: string, source: null }> }`.
3. **Mandatory Null Sources**: All `claims[].source` fields MUST be `null`. The Zod schema explicitly rejects non-null strings.
4. **Deterministic Pre-LLM Scope Guardrails**: A code-level interceptor (`src/lib/guardrails.ts`) evaluates all incoming queries before invoking the LLM, rejecting calorie/deficit calculations, target body weight prescriptions, clinical disease treatments, and eating disorder triggers.
5. **Zero-Breaking-Change Forward Compatibility**: The data model, API routes, and UI components are pre-architected so that Milestone 2 can inject a RAG retrieval layer and populate `source` strings without any breaking changes.

---

## 2. Technology Stack & Software Versions

- **Framework**: Next.js `16.3.6` (App Router)
- **UI Engine**: React `19.2.8`
- **Standalone Client**: Vite `v6.x` SPA located in `/client`
- **Styling**: Tailwind CSS `v4.x` with CSS variables & dark/light theme tokens
- **Type System**: TypeScript `v5.x`
- **LLM SDKs**: `groq-sdk` `^1.6.0` (Primary), `@google/genai` `^2.24.0` (Secondary/Fallback)
- **Validation**: Zod `^4.6.5`
- **Persistence**: Prisma ORM `^6.19.3` with SQLite (`dev.db` / `/data/nutrition.db`) and PostgreSQL support
- **Test Runner**: `tsx` `^4.23.15` running native Node.js test runner (`tsx --test tests/**/*.test.*`)

---

## 3. Essential Agent Workflows & Commands

### Development & Build:
```bash
npm run dev           # Start Next.js App Router fullstack dev server (Port 3000)
npm run client:dev    # Start standalone Vite React SPA (Port 5173)
npm run build         # Generate Prisma client and build Next.js application
npm run start         # Initialize database and launch production server
npm run lint          # Run ESLint across codebase
```

### Testing, Evaluation & Benchmarking:
```bash
npm test              # Run the complete 56-test automated test suite
npm run benchmark     # Run the 10-Question Failure Log Evaluation Benchmark
npm run smoke-test    # Run production 4-tier smoke testing suite
```

---

## 4. Key Architectural Modules & Directory Layout

- `src/lib/guardrails.ts`: Deterministic pre-LLM regex & intent interceptor.
- `src/lib/groq.ts`: Groq SDK client initialization, model selection (`openai/gpt-oss-120b`, `qwen/qwen3.6-27b`), JSON mode orchestration, exponential backoff.
- `src/lib/gemini.ts`: Google Gen AI SDK client and structured response schemas.
- `src/lib/sanitizer.ts`: Strips Markdown code blocks, sanitizes JSON, enforces `source: null`.
- `src/lib/validation.ts`: Zod schemas (`ClaimSchema`, `NutritionAssistantResponseSchema`).
- `src/lib/prompts/systemPrompt.ts`: Versioned system prompt and operational invariants.
- `src/lib/db.ts`: Prisma client singleton and database persistence methods.
- `src/app/api/chat/route.ts`: Core conversational route handler (Input validation -> Guardrails -> Context window -> LLM -> Validation -> Persistence).
- `src/app/api/health/route.ts`: Server health and active model telemetry.
- `src/app/api/sessions/route.ts`: Multi-session management (CRUD + cascade deletion).
- `src/app/api/history/[sessionId]/route.ts`: Session message & claims history retriever.
- `src/components/chat/`: Integrated Next.js UI components (ChatContainer, MessageList, HeaderBar, PromptChips, etc.).
- `src/components/sources/`: SourcesPanel and EmptySourcesPlaceholder.
- `client/`: Standalone Vite + React 19 Single Page Application.
- `prisma/schema.prisma`: Relational database schema (`Session`, `Message`, `Claim`, `BenchmarkRun`, `FailureLog`).
- `doc/`: Deep architectural specifications, implementation plans, failure logs, and deployment plans.

---

## 5. Coding Standards & Agent Constraints

1. **Strict Type Safety**: Always define TypeScript interfaces in `src/types/nutrition.ts` or `client/src/types.ts`. Never use `any` when structured types can be expressed.
2. **Preserve Next.js Agent Header**: Never delete or edit the `<!-- BEGIN:nextjs-agent-rules -->` block in this file.
3. **Guardrail Integrity**: Any modification to `src/lib/guardrails.ts` MUST be validated against the full 56-test test suite (`npm test`) to ensure no false positives or escapes are introduced.
4. **Never Expose API Keys**: `GROQ_API_KEY` and `GEMINI_API_KEY` must remain strictly server-side. Never expose them via `NEXT_PUBLIC_` or Vite client variables.
5. **Database Durability**: When deploying to container environments (e.g. Railway / Docker), ensure the database file is placed on a persistent volume (e.g. `/data/nutrition.db`).
