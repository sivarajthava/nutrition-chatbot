# Production Deployment Plan
## AI Nutrition Assistant Prototype (Fullstack & Latest React Frontend)

This document provides the definitive, comprehensive operational guide for deploying the **AI Nutrition Assistant Prototype** to live public production environments on **Railway** and **Vercel**. It covers the complete system: the Next.js API orchestration backend, SQLite/PostgreSQL persistence, and both frontend implementations:
1. **The Integrated Next.js Fullstack React UI** (`src/app/page.tsx` + modular components).
2. **The Standalone Decoupled React Client Application** (`/client` Vite SPA).

---

## 1. System Architecture & Deployment Topologies

```mermaid
flowchart TD
    subgraph Repo["GitHub Repository (Master Branch)"]
        Code_Fullstack["Next.js 16 App Router (Backend APIs + Integrated UI)"]
        Code_Client["Standalone React 19 Client SPA (/client)"]
    end

    subgraph Strategy1["Topology 1: Unified Container on Railway (Recommended)"]
        RW_Next["Railway Next.js Container (Nixpacks / Docker)"]
        RW_Vol[("Persistent Storage Volume (/data/nutrition.db)")]
        RW_Next <--> RW_Vol
        User1["End Users"] <-->|HTTPS| RW_Next
    end

    subgraph Strategy2["Topology 2: Serverless Fullstack on Vercel"]
        VC_Edge["Vercel Edge Network (Global CDN)"]
        VC_Func["Serverless Functions (/api/chat, /api/history, /api/health)"]
        VC_DB[("Remote Postgres (Neon / Supabase / Railway)")]
        VC_Edge --> VC_Func
        VC_Func <--> VC_DB
        User2["End Users"] <-->|HTTPS| VC_Edge
    end

    subgraph Strategy3["Topology 3: Decoupled Hybrid (Vercel Client + Railway Backend)"]
        HY_Vercel["Vercel: Standalone React Client (/client Vite SPA)"]
        HY_Railway["Railway: API Server + Persistent SQLite (/data)"]
        HY_Vercel <-->|CORS / REST (VITE_API_URL)| HY_Railway
        User3["End Users"] <--> HY_Vercel
    end

    Repo --> Strategy1
    Repo --> Strategy2
    Repo --> Strategy3
```

---

## 2. Comparison of Deployment Topologies

| Dimension | Topology 1: Railway Unified | Topology 2: Vercel Fullstack | Topology 3: Decoupled Hybrid |
| :--- | :--- | :--- | :--- |
| **Frontend Served** | Integrated Next.js UI | Integrated Next.js UI | Standalone `/client` Vite SPA |
| **Backend Served** | Railway Container | Vercel Serverless Functions | Railway Container |
| **Runtime Model** | Persistent Node.js 20 | Ephemeral Serverless (AWS Lambda) | Client on Edge CDN, API on Container |
| **Cold Starts** | Zero (always warm) | Sub-second on idle instances | Zero on client; warm on Railway API |
| **SQLite Persistence** | **Native & Durable** (`/data` volume) | **Ephemeral** (requires PostgreSQL) | **Native & Durable** (`/data` volume) |
| **Best Used For** | Zero-external-dependency production | Serverless scale with Neon Postgres | Decoupled modern frontend on Vercel |

---

## 3. Environment Variables & Secrets Matrix

All deployments require server-side environment variables. **No LLM API keys must ever be bundled into client-side code.**

| Variable Name | Required In | Description | Example / Recommended Value |
| :--- | :---: | :--- | :--- |
| `GROQ_API_KEY` | Server | Groq Cloud API Secret Key (Primary LLM) | `gsk_...` (Never commit) |
| `GROQ_MODEL` | Server | Groq LLM model identifier | `openai/gpt-oss-120b` or `qwen/qwen3.6-27b` |
| `GEMINI_API_KEY` | Server | Google Gemini API Key (Fallback/Alternative) | `AIzaSy...` (Never commit) |
| `GEMINI_MODEL` | Server | Gemini model identifier | `gemini-2.5-flash` |
| `DATABASE_URL` | Server | SQLite or PostgreSQL connection string | `file:/data/nutrition.db` (Railway) |
| `NODE_ENV` | Build/Server | Node runtime environment | `production` |
| `PORT` | Server | HTTP port (injected automatically by Railway) | `3000` |
| `NEXT_PUBLIC_APP_URL` | Client/Server | Public URL of the fullstack application | `https://nutrition-chat.up.railway.app` |
| `VITE_API_URL` | Client SPA | Backend API URL for standalone `/client` | `https://nutrition-chat.up.railway.app` |

---

## 4. Topology 1: Deploying Fullstack to Railway (Step-by-Step)

Railway is the **recommended** hosting provider for the prototype because it supports mounting persistent disk volumes directly to Node.js containers, allowing zero-external-dependency SQLite persistence.

### 4.1 Railway Deployment via Web Dashboard

#### Step 1: Push Repository to GitHub
Ensure all latest changes are committed and pushed:
```bash
git add .
git commit -m "feat: complete Phase 9 brand new React UI and production deployment plan"
git push origin master
```

#### Step 2: Create Railway Project
1. Log in to [railway.app](https://railway.app/dashboard).
2. Click **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select your repository: `nutrition-chatbot`.
4. Click **"Deploy Now"**.

#### Step 3: Attach Persistent Storage Volume (For SQLite)
1. On the project canvas, click on the application service card.
2. Navigate to the **"Volumes"** tab.
3. Click **"Add Volume"**.
4. Set the Mount Path to `/data`.
5. Click **"Save Changes"**.

#### Step 4: Configure Environment Variables
Navigate to the **"Variables"** tab and add:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
DATABASE_URL=file:/data/nutrition.db
NODE_ENV=production
```

#### Step 5: Configure Build & Deploy Settings
Railway automatically detects [`railway.json`](file:///C:/Users/HP/workspace/AI_AI_AI/ToDo/nutrition-chatbot/railway.json). Verify under **Settings** -> **Deploy**:
- **Build Command**: `npx prisma generate && npx prisma db push && npm run build`
- **Start Command**: `npm run start`
- **Healthcheck Path**: `/api/health`

#### Step 6: Generate Public Domain
1. In the service **Settings** tab, scroll down to **"Networking"**.
2. Under **"Public Networking"**, click **"Generate Domain"** (e.g. `https://nutrition-chatbot.up.railway.app`).
3. Add `NEXT_PUBLIC_APP_URL` to your Variables tab with this domain.

---

## 5. Topology 2: Deploying Fullstack to Vercel (Step-by-Step)

Vercel provides edge delivery for Next.js. Because serverless lambda filesystems are read-only and ephemeral, an external database (e.g. Neon, Supabase, or Railway PostgreSQL) is recommended for multi-turn persistence across serverless invocations.

### 5.1 Vercel Deployment via Web Dashboard

#### Step 1: Import Project
1. Navigate to [vercel.com/new](https://vercel.com/new).
2. Select the `nutrition-chatbot` repository and click **"Import"**.

#### Step 2: Configure Project & Build Settings
- **Framework Preset**: `Next.js`
- **Root Directory**: `./`
- **Build Command**: `npx prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### Step 3: Configure Environment Variables
In the **Environment Variables** section, add:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
DATABASE_URL=postgresql://user:password@ep-host.neon.tech/nutrition_db?sslmode=require
NODE_ENV=production
```
*(For preview/demo without external PostgreSQL, use `file:/tmp/dev.db`)*.

#### Step 4: Deploy & Verify
Click **"Deploy"**. Vercel will build the project and issue a live URL (e.g. `https://nutrition-chatbot.vercel.app`).

---

## 6. Topology 3: Deploying Decoupled Standalone React Client (`/client`) to Vercel

The `/client` directory is equipped with a dedicated [`client/vercel.json`](file:///C:/Users/HP/workspace/AI_AI_AI/ToDo/nutrition-chatbot/client/vercel.json) pre-configured with Vite framework presets, output directory routing, and single-page application (SPA) rewrite rules:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 6.1 Option A: Deploying via Vercel Dashboard (Web GUI)
1. In [vercel.com/new](https://vercel.com/new), import the `nutrition-chatbot` repository.
2. In the project setup screen:
   - **Project Name**: `nutrition-chatbot-client`
   - **Framework Preset**: `Vite` (automatically detected via `client/vercel.json`)
   - **Root Directory**: Click "Edit" and choose `client`.
3. In **Environment Variables**:
   ```env
   VITE_API_URL=https://your-railway-backend.up.railway.app
   ```
4. Click **"Deploy"**. Vercel will build and distribute the React SPA globally across edge points of presence.

### 6.2 Option B: Deploying directly from the `client/` directory via Vercel CLI
```bash
# 1. Change directory to client
cd client

# 2. Link to Vercel project
vercel link

# 3. Add backend API URL environment variable
vercel env add VITE_API_URL production
# Enter your Railway backend domain: https://nutrition-chatbot.up.railway.app

# 4. Trigger production deployment
vercel --prod
```

---

## 7. Automated Production Smoke Testing & Verification

Once deployed to Railway or Vercel, execute the automated 4-tier smoke testing suite included in the repository.

### 7.1 Running the Automated Smoke Test Battery

Run the test against your deployed public URL:
```bash
npm run smoke-test https://nutrition-chatbot.up.railway.app
```

### 7.2 Manual Curl Verification Commands

You can also verify individual endpoints manually:

```bash
TARGET_URL="https://nutrition-chatbot.up.railway.app"

# 1. Verify Health & Active Model Status
curl -s "$TARGET_URL/api/health" | jq .
# Expected: { "status": "online", "model": "openai/gpt-oss-120b", "guardrails": "active" }

# 2. Verify Session Listing
curl -s "$TARGET_URL/api/sessions" | jq .
# Expected: { "sessions": [...] }

# 3. Verify Deterministic Guardrail Interception (Prohibited Calorie Query)
curl -s -X POST "$TARGET_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-guardrail", "message": "Calculate my personal daily calorie target to drop 15 lbs."}' \
  | jq .
# Expected: HTTP 200 Refusal stating inability to prescribe calories; claims array with 1 item; source: null

# 4. Verify Valid Nutritional Generation (Groq LLM Engine)
curl -s -X POST "$TARGET_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-nutrition", "message": "What plant foods provide high dietary protein?"}' \
  | jq .
# Expected: Factual nutrition response; atomic claims array; all source fields strictly null

# 5. Verify Multi-Turn Persistence & History Retrieval
curl -s "$TARGET_URL/api/history/test-nutrition" | jq .
# Expected: Array containing the user question and the assistant response
```

---

## 8. Frontend UI Verification Checklist

Open the production URL in desktop and mobile browsers to confirm visual integrity:

- [ ] **Dual-Panel & Multi-Session Layout**:
  - Desktop: Multi-session sidebar (left), Chat workspace (center), Claims & Grounding Panel (right).
  - Mobile: Collapsible hamburger drawer for sessions; slide-over drawer for claims.
- [ ] **Header Bar Status**:
  - Green pulsing indicator confirming "Connected".
  - Model badge showing active LLM (`gpt-oss-120b` or `qwen3.6-27b`).
  - "Guardrails Active" safety badge.
- [ ] **Interactive Prompt Chips**:
  - Category tabs (*Protein & Macros*, *Food Safety*, *Cooking Methods*, *Metabolism & Fasting*) load chips dynamically.
  - Clicking any chip sends or populates the query.
- [ ] **Atomic Claims Inspector**:
  - Assistant answers display the "X claims extracted" pill.
  - Clicking the pill opens the Claims Inspector displaying individual claims tagged with `source: null`.
  - Empty citation slots for Milestone 2 RAG are clearly pre-allocated.
- [ ] **Copy to Clipboard**:
  - Assistant responses include a copy button with checkmark confirmation.
- [ ] **Theme Switcher**:
  - Sun/Moon icon toggles between Light and Dark mode smoothly with localStorage persistence.

---

## 9. Troubleshooting & Failure Recovery Runbook

| Symptom / Error | Root Cause | Platform | Remediation |
| :--- | :--- | :---: | :--- |
| `PrismaClientInitializationError: Query engine library not found` | Prisma client was not generated during container build | Railway / Vercel | Update build command to `prisma generate && npm run build` (handled automatically via `postinstall` script). |
| `HTTP 500: Groq API key is not configured` | Missing `GROQ_API_KEY` in cloud dashboard | Railway / Vercel | Add `GROQ_API_KEY` in service Variables and trigger redeployment. |
| `SQLITE_BUSY: database is locked` | High concurrent writes to single SQLite file | Railway | Safe for prototype; for higher concurrency, switch to PostgreSQL. |
| `Read-only file system` error on `/api/chat` | SQLite trying to write to read-only lambda filesystem | Vercel | Set `DATABASE_URL="file:/tmp/dev.db"` or configure remote PostgreSQL (Neon). |
| `CORS Error` when calling API from `/client` | Backend API missing CORS headers | Railway / Vercel | CORS is enabled in `src/app/api/chat/route.ts` and `src/app/api/health/route.ts` with `Access-Control-Allow-Origin: *`. Ensure `VITE_API_URL` matches deployed API. |
| `FUNCTION_INVOCATION_TIMEOUT` | LLM generation exceeded serverless timeout | Vercel | `export const maxDuration = 30;` is present in `src/app/api/chat/route.ts`. |

---

## 10. Rollback Procedures

### Railway Instant Rollback:
1. Open the [Railway Dashboard](https://railway.app/dashboard) and navigate to the `nutrition-chatbot` project.
2. Select the **"Deployments"** tab.
3. Find the last known healthy deployment with a green checkmark.
4. Click the options menu `...` and select **"Rollback to this deployment"**.
5. Traffic will immediately shift back to the healthy deployment.

### Vercel Edge Rollback:
1. Open the [Vercel Dashboard](https://vercel.com) and navigate to the project.
2. Select the **"Deployments"** tab.
3. Locate the previous successful deployment.
4. Click `...` -> **"Instant Rollback"**.
5. Edge routing will instantly revert to the selected build.
