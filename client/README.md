# AI Nutrition Assistant — Standalone React Client Application

A decoupled, high-performance Single Page Application (SPA) powered by **React 19**, **Vite**, **Tailwind CSS v4**, and **Lucide Icons**.

This client communicates with the backend server via HTTP REST API endpoints (`/api/chat`, `/api/history`, `/api/health`, `/api/sessions`).

---

## 1. Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run local development server (proxies /api to http://localhost:3000)
npm run dev
```

The app will be accessible at `http://localhost:5173`.

---

## 2. Deploying to Vercel

The `client` directory includes [`vercel.json`](./vercel.json) pre-configured for Vite framework detection, static compilation, and SPA URL rewrite rules.

### Option A: Via Vercel Web Dashboard (Recommended)

1. Open [vercel.com/new](https://vercel.com/new) and import the repository.
2. In the project setup screen:
   - **Project Name**: `nutrition-chatbot-client`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client`.
3. In **Build and Output Settings**:
   - Build Command: `npm run build` (or leave default `vite build`)
   - Output Directory: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: Your deployed backend API URL (e.g. `https://nutrition-chatbot.up.railway.app`).
5. Click **Deploy**.

---

### Option B: Via Vercel CLI

```bash
# 1. Navigate into client directory
cd client

# 2. Link to Vercel
vercel link

# 3. Add backend API environment variable
vercel env add VITE_API_URL production
# Enter your backend URL when prompted: https://your-railway-app.up.railway.app

# 4. Deploy to production
vercel --prod
```

---

## 3. Environment Variables

| Variable | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API server | Empty (uses local `/api` proxy in dev) | `https://nutrition-chatbot.up.railway.app` |

---

## 4. Features Included

- **Multi-Session Conversation Drawer**: List, switch, and delete chat threads.
- **Atomic Claims Inspector**: Sidecar panel displaying extracted claims and `source: null` compliance.
- **Preset Nutrition Chips**: Fast queries filtered by Protein, Food Safety, Cooking, and Fasting.
- **Server Health & Model Status**: Live server connectivity indicator and active Groq model badge.
- **Theme Switcher**: Dark and Light mode toggle with local storage persistence.
- **Markdown & One-Click Copy**: Formatted tables, code blocks, lists, and copy-to-clipboard.
