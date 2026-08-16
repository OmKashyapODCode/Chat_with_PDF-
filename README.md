# 📄 PDF AI Chat

A full-stack RAG (Retrieval-Augmented Generation) application. Upload any PDF and chat with it intelligently using **Google Gemini AI**, **Qdrant** vector database, and **Cloudinary** for file storage.

---

## ✨ Features

- 🤖 **Gemini AI** — Powered by `gemini-3.5-flash` for chat and `gemini-embedding-2` for embeddings
- ☁️ **Cloudinary** — PDFs stored in the cloud, no local disk needed
- 🗄️ **Qdrant Cloud** — Vector database for semantic similarity search
- 🐇 **CloudAMQP (RabbitMQ)** — Background queue for async PDF processing
- 🔐 **Clerk** — User authentication (Sign In / Sign Up)
- 💬 **WhatsApp-style Chat UI** — With Markdown rendering and page citations
- 📱 **Fully Responsive** — Works on mobile and desktop

---

## 🏗️ Folder Structure

```
pdf-rag-code/
├── client/                  # Next.js Frontend
│   ├── app/
│   │   ├── components/
│   │   │   ├── chat.tsx         # Chat UI with Markdown support
│   │   │   └── file-upload.tsx  # PDF upload with validation
│   │   ├── layout.tsx           # Clerk auth wrapper
│   │   └── page.tsx             # Main page
│   └── vercel.json              # Vercel deployment config
│
├── server/                  # Node.js Backend
│   ├── config/
│   │   ├── cloudinary.js    # Cloudinary client
│   │   ├── gemini.js        # Gemini chat + embedding models
│   │   ├── qdrant.js        # Qdrant vector DB client
│   │   └── queue.js         # RabbitMQ connection + helpers
│   ├── controllers/
│   │   ├── chatController.js    # RAG query logic
│   │   └── uploadController.js  # Cloudinary upload + queue publish
│   ├── middlewares/
│   │   └── upload.js        # Multer (memory storage, 5MB PDF limit)
│   ├── routes/
│   │   ├── chatRoutes.js
│   │   └── uploadRoutes.js
│   ├── index.js             # Express app entry point
│   └── worker.js            # Background worker entry point
│
├── render.yaml              # Render.com Blueprint (API + Worker)
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js >= 20
- pnpm (`npm install -g pnpm`)
- Accounts on: Cloudinary, Qdrant Cloud, CloudAMQP, Clerk, Google AI Studio

### 1. Clone the repo
```bash
git clone https://github.com/OmKashyapODCode/Chat_with_PDF-.git
cd Chat_with_PDF-
```

### 2. Server environment variables
Create `server/.env`:
```env
GOOGLE_API_KEY=your_gemini_api_key
CLOUDAMQP_URL=amqps://...
QDRANT_URL=https://...qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=http://localhost:3000
```

### 3. Client environment variables
Create `client/.env`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Install & Run

Open **3 terminals**:

```bash
# Terminal 1 — Frontend
cd client && pnpm install && pnpm dev

# Terminal 2 — Backend API
cd server && pnpm install && pnpm dev

# Terminal 3 — Background Worker
cd server && pnpm dev:worker
```

---

## ☁️ Deployment

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import this repo
2. Set **Root Directory** to `client`
3. Add environment variables:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard |
   | `CLERK_SECRET_KEY` | From Clerk dashboard |
   | `NEXT_PUBLIC_API_URL` | Your Render API URL (after deploying backend) |
4. Deploy ✅

### Backend + Worker → Render

> **Option A: Blueprint (Recommended — 1 click)**
1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect this GitHub repo — Render auto-reads `render.yaml`
3. Fill in all env variables in the dashboard
4. Deploy ✅ (Creates both Web Service + Worker automatically)

> **Option B: Manual**

**Web Service (API):**
- Root Directory: `server`
- Build Command: `npm install -g pnpm && pnpm install`
- Start Command: `pnpm start`

**Background Worker:**
- Root Directory: `server`
- Build Command: `npm install -g pnpm && pnpm install`
- Start Command: `pnpm start:worker`

**Environment Variables for both:**
```
GOOGLE_API_KEY, CLOUDAMQP_URL, QDRANT_URL, QDRANT_API_KEY,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
CORS_ORIGIN (= your Vercel frontend URL)
```

### Final Step
After deploying both:
- Copy your Render API URL → paste into Vercel's `NEXT_PUBLIC_API_URL`
- Copy your Vercel URL → paste into Render's `CORS_ORIGIN`
- Go to **Clerk Dashboard** → Allowed Origins → add your Vercel URL

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, Clerk |
| Backend | Node.js, Express.js |
| AI | Google Gemini (LangChain) |
| Vector DB | Qdrant Cloud |
| File Storage | Cloudinary |
| Queue | CloudAMQP (RabbitMQ) |
| Auth | Clerk |
