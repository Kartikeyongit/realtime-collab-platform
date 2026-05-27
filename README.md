<div>
<img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js">
<img src="https://img.shields.io/badge/TipTap-Editor-orange" alt="TipTap">
<img src="https://img.shields.io/badge/Prisma-ORM-blue" alt="Prisma">
<img src="https://img.shields.io/badge/PostgreSQL-Database-green" alt="PostgreSQL">
<img src="https://img.shields.io/badge/license-MIT-purple" alt="License">
</div>

<h1>📝 CollabDocs</h1>
<p><strong>Real-Time Collaborative Document Editor</strong></p>
<p>Create, edit, and collaborate on documents with your team.</p>

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

### 🤖 AI Assistant
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

### 💬 Comments
- Add comments to documents
- Reply to comments
- Resolve/unresolve threads
- Delete your own comments

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
| **Database** | PostgreSQL (via [Supabase](https://supabase.com/)) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) |
| **Styling** | Tailwind CSS + Inline Styles |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) |

## 📦 Project Structure

```
realtime-collab-platform/
├── prisma/                         # Database schema & migrations
│   ├── schema.prisma               # Prisma schema
│   └── seed.ts                     # Seed data
├── public/                         # Static assets
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── api/                    # API routes
│   │   ├── auth/                   # Auth pages (signin, register)
│   │   ├── dashboard/              # Dashboard page
│   │   ├── documents/              # Document editor page
│   │   └── trash/                  # Trash page
│   ├── components/
│   │   ├── ai/                     # AI Assistant panel
│   │   ├── comments/               # Comment thread
│   │   ├── editor/                 # TipTap editor & toolbar
│   │   ├── export/                 # Export dialog
│   │   ├── notifications/          # Notification center
│   │   ├── search/                 # Find & Replace panel
│   │   ├── share/                  # Share dialog
│   │   ├── templates/              # Template gallery
│   │   └── ui/                     # Reusable UI components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility functions
│   ├── store/                      # Zustand state management
│   └── types/                      # TypeScript type definitions
├── .env.example                    # Environment variables template
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
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

### 5. Start the development server

```
npm run dev
```

Open:

```
http://localhost:3000
```

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

## 🗄️ Database Setup (Supabase)

1. Create a project on Supabase
2. Copy the Session Pooler connection string
3. Add it as `DATABASE_URL` in Vercel environment variables
4. Run:

```
npx prisma db push
```

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Your application URL |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT encryption |
| `NEXT_PUBLIC_YJS_URL` | No | Yjs WebSocket server URL (optional) |

## 📄 License

MIT