<div>
<img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js">
<img src="https://img.shields.io/badge/TipTap-Editor-orange" alt="TipTap">
<img src="https://img.shields.io/badge/Yjs-CRDT-blue" alt="Yjs">
<img src="https://img.shields.io/badge/Socket.IO-Realtime-lightgrey" alt="Socket.IO">
<img src="https://img.shields.io/badge/Prisma-ORM-blue" alt="Prisma">
<img src="https://img.shields.io/badge/PostgreSQL-Database-green" alt="PostgreSQL">
<img src="https://img.shields.io/badge/license-MIT-purple" alt="License">
</div>

<h1>CollabDocs</h1>
<p><strong>Real-Time Collaborative Document Editor</strong></p>
<p>Create, edit, and collaborate on documents with your team in real time.</p>

## ✨ Live Demo

<a href="https://realtime-collab-platform-pi.vercel.app/">
<img src="https://img.shields.io/badge/LIVE_DEMO-Visit_Site-f97316?style=for-the-badge" alt="Live Demo">
</a>

### 🔑 Demo Credentials

| Email | Password |
|-------|----------|
| `test@example.com` | `password123` |

## 🚀 Features

### 📝 Rich Text Editing
- **Text Formatting:** Bold, Italic, Underline, Strikethrough, Highlight, Code
- **Headings:** H1, H2, H3
- **Alignment:** Left, Center, Right
- **Lists:** Bullet, Ordered, Blockquotes
- **Advanced:** Tables (with row/column controls), Images, Links, Code Blocks, Horizontal Rules
- **Undo/Redo** with keyboard shortcuts (`Ctrl + Z` / `Ctrl + Y`)

### 🔍 Find & Replace
- Search across entire document
- Case-sensitive, whole word, and regex modes
- Navigate between results
- Replace individual or all occurrences

### 🤖 AI Assistant (powered by Groq)
- **Improve Writing:** Enhance vocabulary and flow
- **Fix Grammar:** Correct common grammar mistakes
- **Summarize:** Condense long text
- **Expand:** Add more detail and context

### 👥 Sharing & Collaboration
- Share documents with collaborators (Editor/Viewer roles)
- Generate shareable links with optional:
  - Password protection
  - Expiry date/time
- Manage and revoke access

### Real-Time Coediting
- **CRDT-based** via Yjs — no merge conflicts, no operational transformation
- Yjs WebSocket server persists document state to both **LevelDB** (fast) and **PostgreSQL** (durable)
- See collaborators' **cursors** and **selections** in real time
- **Presence indicators** — who's viewing or editing right now

### 💬 Comments & Notifications
- Add comments to documents with optional position anchors
- Reply to comments (threaded)
- Resolve/unresolve threads
- Delete your own comments
- Get notified when someone comments on your document
- @mention collaborators in comments

### 📋 Templates
Start with pre-made templates:
- 📅 Meeting Notes
- 🚀 Project Proposal
- ⚙️ Technical Specification
- 📊 Weekly Report
- ✍️ Blog Post
- 📚 Research Notes

### 📤 Export
Download documents in multiple formats:
- **PDF** – Best for sharing and printing
- **Word (DOCX)** – Editable in Microsoft Word
- **Markdown** – Plain text with formatting
- **HTML** – Web page format
- **Plain Text** – Simple text format

### 🗑️ Trash & Recovery
- Soft delete documents (move to trash)
- Restore from trash
- Permanent delete option
- Empty trash in one click

### 📊 Document Management
- Dashboard with search functionality
- Inline document rename (click title to edit)
- Duplicate documents
- Word and character count
- Last modified timestamp

### 🎨 User Interface
- Warm, modern design system
- Consistent component styling
- Custom toast notifications (success, error, warning, info)
- Confirmation dialogs for destructive actions
- Loading skeletons for better UX
- Responsive design (mobile-friendly)
- Keyboard shortcuts panel (press `?`)

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save document |
| `Ctrl + B` | Bold |
| `Ctrl + I` | Italic |
| `Ctrl + U` | Underline |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + F` | Find & Replace |
| `Ctrl + K` | Add link |
| `?` | Show all shortcuts |

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 14](https://nextjs.org/) |
| **Editor** | [TipTap](https://tiptap.dev/) |
| **Real-Time CRDT** | [Yjs](https://yjs.dev/) + [y-websocket](https://github.com/yjs/y-websocket) |
| **Presence & Cursors** | [Socket.IO](https://socket.io/) |
| **Database** | PostgreSQL (via [Supabase](https://supabase.com/)) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) (Credentials + Google OAuth) |
| **AI** | [Groq](https://groq.com/) (OpenAI-compatible API) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) + [Immer](https://immerjs.github.io/immer/) |
| **Styling** | Tailwind CSS + [class-variance-authority](https://cva-docs.vercel.app/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Export** | [jsPDF](https://github.com/parallax/jsPDF), [docx](https://docx.js.org/), [Turndown](https://github.com/mixmark-io/turndown) |
| **Testing** | [Vitest](https://vitest.dev/) |
| **Deployment** | Docker / Vercel |
| **Containers** | [Docker](https://www.docker.com/) + [docker-compose](https://docs.docker.com/compose/) |

## 📦 Project Structure

```
realtime-collab-platform/
├── prisma/                         # Database schema & migrations
│   ├── schema.prisma               # Prisma schema
│   ├── seed.ts                     # Seed data
│   └── migrations/                 # Migration files
├── public/                         # Static assets (icons, templates, avatars)
├── server/                         # Standalone servers (Yjs WebSocket, start script)
│   ├── yjs-server.js               # Yjs CRDT WebSocket server
│   └── start.js                    # Production orchestrator (Next.js + Yjs + Socket.IO)
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── api/                    # API routes
│   │   ├── auth/                   # Auth pages (signin, register)
│   │   ├── contact/                # Contact page
│   │   ├── dashboard/              # Dashboard page
│   │   ├── docs/                   # Documentation
│   │   ├── documents/              # Document editor page
│   │   ├── features/               # Features page
│   │   ├── privacy/                # Privacy policy
│   │   ├── settings/               # User settings
│   │   ├── shared/                 # Shared with me
│   │   ├── status/                 # System status
│   │   ├── templates/              # Template gallery
│   │   ├── terms/                  # Terms of service
│   │   └── trash/                  # Trash page
│   ├── components/
│   │   ├── ai/                     # AI Assistant panel (Groq)
│   │   ├── collaboration/          # Presence indicators
│   │   ├── comments/               # Comment threads
│   │   ├── dashboard/              # Dashboard components
│   │   ├── documents/              # Document list/card components
│   │   ├── editor/                 # TipTap editor & toolbar
│   │   ├── export/                 # Export dialog
│   │   ├── landing/                # Landing page components
│   │   ├── notifications/          # Notification center
│   │   ├── search/                 # Find & Replace panel
│   │   ├── share/                  # Share dialog
│   │   ├── templates/              # Template gallery
│   │   └── ui/                     # Reusable UI components
│   ├── hooks/                      # Custom React hooks
│   │   ├── useCollaboration.ts     # Socket.IO collaboration hook
│   │   └── useYjsCollaboration.ts  # Yjs CRDT hook
│   ├── lib/                        # Utility functions
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── documentAccess.ts       # Access control helpers
│   │   ├── exportService.ts        # Export to PDF/DOCX/MD/HTML/TXT
│   │   ├── password.ts             # Password hashing & verification
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── rateLimit.ts            # Rate limiter
│   │   └── toast.tsx               # Toast notification component
│   ├── server/                     # Socket.IO server (compiled separately)
│   │   ├── index.ts                # Entry point
│   │   └── socketServer.ts         # Socket.IO setup (presence, cursors, comments)
│   ├── store/                      # Zustand + Immer state management
│   │   └── documentStore.ts        # Document, presence, comment state
│   └── types/                      # TypeScript type definitions
│       ├── index.ts                # Shared types
│       └── next-auth.d.ts          # NextAuth type augmentations
├── .dockerignore
├── .env.example                    # Environment variables template
├── .gitignore
├── docker-compose.yml              # Full-stack Docker setup
├── Dockerfile                      # Multi-stage production build
├── next.config.mjs                 # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── vitest.config.ts                # Vitest test configuration
├── eslint.config.mjs               # ESLint flat config
├── postcss.config.js               # PostCSS configuration
└── package.json                    # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (local or Supabase)

## 💻 Local Development

### 1. Clone the repository

```
git clone https://github.com/YOUR_USERNAME/realtime-collab-platform.git
cd realtime-collab-platform
```

### 2. Install dependencies

```
npm install
```

### 3. Set up environment variables

```
cp .env.example .env.local
```

Edit `.env.local` with your database URL and NextAuth configuration.

### 4. Set up the database

```
npx prisma db push
npx prisma generate
npx prisma db seed
```

### 5. Start the development servers

The app requires three services: Next.js, Yjs WebSocket, and Socket.IO.

```
npm run dev:all
```

Or start them individually:

```
npm run dev           # Next.js on http://localhost:3000
npm run yjs-server    # Yjs on ws://localhost:1234
npm run socket-server # Socket.IO on http://localhost:3001
```

Open:

```
http://localhost:3000
```

### Testing

```
npm test              # run vitest
npm run test:watch    # watch mode
```

### Database management

```
npm run db:migrate    # run Prisma migrations
npm run db:studio     # open Prisma Studio
npm run db:generate   # regenerate Prisma client
```

## 🐳 Docker Deployment

```
docker compose up -d --build
```

This starts:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **Next.js app** on port `3000`
- **Yjs WebSocket** on port `1234`
- **Socket.IO** on port `3001`

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add the following environment variables:

```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

4. Set build command:

```
prisma generate && next build
```

5. Deploy 🎉

## 🗄️ Database Setup

### Supabase (recommended for Vercel)

1. Create a project on Supabase
2. Copy the Session Pooler connection string
3. Add it as `DATABASE_URL` in Vercel environment variables
4. Run:

```
npx prisma db push
```

### Local (via Docker)

```
docker compose up -d postgres redis
```

The `docker-compose.yml` includes PostgreSQL and Redis for local development.

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Your application URL |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT encryption |
| `AI_API_KEY` | Yes | Groq API key (or any OpenAI-compatible API key) |
| `AI_BASE_URL` | Yes | `https://api.groq.com/openai/v1` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `NEXT_PUBLIC_YJS_URL` | No | Yjs WebSocket server URL (`ws://localhost:1234`) |
| `NEXT_PUBLIC_SOCKET_URL` | No | Socket.IO server URL (`http://localhost:3001`) |
| `CORS_ORIGIN` | No | Allowed CORS origin (defaults to NEXTAUTH_URL) |
| `SOCKET_PORT` | No | Socket.IO server port (default `3001`) |
| `YJS_PORT` | No | Yjs server port (default `1234`) |

## 📄 License

MIT