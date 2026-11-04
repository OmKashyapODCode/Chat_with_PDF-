# 📄 PDF RAG AI Chat

A lightweight, beginner-friendly **RAG (Retrieval-Augmented Generation)** application. Upload any PDF document (up to 50MB) and chat with it in real time using **Google Gemini AI** and **Qdrant Vector Database**.

---

## ✨ Features

- ⚡ **React + Vite Frontend** — Fast, simple and clean UI built with React 18, Axios, and Tailwind CSS.
- 🌙 **Dark Mode Support** — One-click toggle between light and dark themes with localStorage persistence.
- 🧠 **Google Gemini AI** — Uses `gemini-3.5-flash` for intelligent generation and `gemini-embedding-2` for accurate embeddings.
- 🗄️ **Qdrant Vector Database** — Fast semantic search to retrieve the top-4 relevant chunks for every query.
- 🧹 **Session-Scoped & Temp Cleanup** — Each upload creates an isolated session ID; uploading a new PDF deletes old vectors so your vector DB stays clean and free of bloat.
- 📌 **Accurate Citations** — Every AI response includes exact sources with page numbers and document names.
- 📦 **100% npm** — No complicated toolchains or pnpm workspaces; runs with standard `npm install` and `npm run dev`.

---

## 🏗️ Folder Structure

```
pdf-rag-code/
├── frontend/                  # React + Vite Client
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js       # Axios base instance
│   │   ├── components/
│   │   │   ├── Chat.jsx       # Chat UI with Markdown & source citations
│   │   │   └── FileUpload.jsx # PDF upload component
│   │   ├── App.jsx            # Main app shell with Dark Mode toggle
│   │   ├── index.css          # Tailwind directives
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                    # Node.js + Express Backend
│   ├── config/
│   │   ├── gemini.js          # Google Gemini chat & embedding models
│   │   └── qdrant.js          # Qdrant client connection
│   ├── controllers/
│   │   ├── chatController.js  # Embed query -> Qdrant search -> Gemini answer
│   │   └── uploadController.js# Parse PDF -> chunk -> embed -> Qdrant storage
│   ├── middlewares/
│   │   └── upload.js          # Multer memory storage (50MB limit)
│   ├── routes/
│   │   ├── chatRoutes.js      # POST /chat
│   │   └── uploadRoutes.js    # POST /upload/pdf
│   ├── index.js               # Express server entry point
│   └── package.json
│
├── README.md
├── render.yaml                # Render.com deployment blueprint
└── .gitignore
```

---

## ⚙️ How It Works (RAG Flow)

```
1. Upload PDF (up to 50MB)
   └─► Server receives file in-memory buffer
   └─► Deletes previous session vectors from Qdrant (auto-cleanup)
   └─► Splits text into chunks (~1000 characters with 200 overlap)
   └─► Embeds chunks via Gemini and stores in Qdrant with sessionId

2. User asks a question
   └─► Question is embedded via Gemini
   └─► Qdrant searches top-4 most semantically similar chunks (filtered by sessionId)
   └─► Context + Question passed to Gemini 3.5 Flash
   └─► Response returned with page citations!
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (version >= 20)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- API Keys:
  - **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))
  - **Qdrant URL & API Key** (from [Qdrant Cloud](https://cloud.qdrant.io/))

---

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:

```env
GOOGLE_API_KEY=your_gemini_api_key
QDRANT_URL=your_qdrant_cloud_url
QDRANT_API_KEY=your_qdrant_api_key
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

Start the backend:
```bash
npm run dev
```
*(Runs on `http://localhost:8000`)*

---

### 2. Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` directory (optional, defaults to `http://localhost:8000`):

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
```
*(Runs on `http://localhost:5173`)*

---

## 🌐 Deployment Guide (Free Tier)

### Step 1: Deploy Backend on [Render.com](https://render.com)
1. Go to [Render Dashboard](https://dashboard.render.com/) -> Click **New +** -> **Web Service**.
2. Connect your GitHub repository (`Chat_with_PDF-`).
3. Set the following settings:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`
4. In **Environment Variables**, add:
   - `GOOGLE_API_KEY` = your Gemini API key
   - `QDRANT_URL` = your Qdrant Cloud URL
   - `QDRANT_API_KEY` = your Qdrant API key
   - `CORS_ORIGIN` = `*` (or your frontend Vercel URL later)
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g., `https://pdf-chat-backend.onrender.com`).

---

### Step 2: Deploy Frontend on [Vercel](https://vercel.com)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) -> Click **Add New...** -> **Project**.
2. Import your GitHub repository (`Chat_with_PDF-`).
3. Set the following:
   - **Framework Preset:** `Vite`
   - **Root Directory:** click `Edit` and select `frontend`
4. In **Environment Variables**, add:
   - `VITE_API_URL` = your Render backend URL (e.g., `https://pdf-chat-backend.onrender.com`)
5. Click **Deploy**. Done! 🎉

---

## 📌 Roadmap / To-Do List

- [ ] **Multi-Document Support**: Chat across multiple uploaded PDFs simultaneously.
- [ ] **Streaming Responses (SSE)**: Stream AI answers token-by-token for a faster typing effect.
- [ ] **Chat History Persistence**: Option to save and restore past conversations per document.
- [ ] **PDF Viewer Integration**: In-app PDF preview panel highlighting cited pages directly.
- [ ] **Export Chat**: Export conversation history and citations as Markdown or PDF.
- [ ] **OCR Support**: Extract text from scanned/image-only PDF files.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Axios, React-Markdown
- **Backend:** Node.js, Express, LangChain (`@langchain/google-genai`, `@langchain/qdrant`, `@langchain/community`)
- **Vector DB:** Qdrant Cloud
- **AI Models:** Google Gemini 3.5 Flash, Gemini Embeddings
