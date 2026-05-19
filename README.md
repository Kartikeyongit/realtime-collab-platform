# CollabDocs - Real-Time Collaborative Document Editor

A beautiful, feature-rich collaborative document editor where teams create and edit documents together in real-time.

**Demo:** [Realtime Collab App](https://realtime-collab-platform-pi.vercel.app/)

## Features

### 📝 Rich Text Editing

- Bold, italic, underline, strikethrough, highlight
- Headings (H1, H2, H3)
- Text alignment (left, center, right)
- Bullet lists, ordered lists, blockquotes
- Tables with row/column management
- Images and links
- Code blocks
- Find & Replace

### 🤖 AI Assistant

- Improve writing
- Fix grammar
- Summarize text
- Expand content

### 📤 Export

- PDF
- Word (DOCX)
- Markdown
- HTML
- Plain text

### 👥 Collaboration

- Real-time editing with live cursors
- Document sharing with collaborators
- Share links with password protection and expiry
- Comments with replies and resolve

### 📋 Document Management

- Dashboard with search
- Inline document rename
- Duplicate documents
- Templates gallery (6 templates)
- Trash with restore & permanent delete
- Word/character count

### 🎨 UI/UX

- Warm, modern design system
- Custom toast notifications
- Confirmation dialogs
- Keyboard shortcuts (press `?`)
- Responsive design
- Loading skeletons

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 |
| Editor | TipTap |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth.js |
| Styling | Tailwind CSS + Inline Styles |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/realtime-collab-platform.git
cd realtime-collab-platform
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

4. Set up the database:

```bash
npx prisma db push
npx prisma generate
npx prisma db seed
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| NEXTAUTH_URL | Your app URL |
| NEXTAUTH_SECRET | Random secret for auth |
| NEXT_PUBLIC_YJS_URL | Yjs WebSocket server URL (optional) |

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database

Use Supabase for a free PostgreSQL database:

1. Create a project
2. Copy the connection string
3. Add to Vercel environment variables
4. Run `npx prisma db push` to create tables

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Dashboard
│   ├── documents/         # Document editor
│   └── trash/             # Trash page
├── components/            # React components
│   ├── ai/                # AI Assistant
│   ├── collaboration/     # Online users
│   ├── comments/          # Comment thread
│   ├── dashboard/         # Document card
│   ├── editor/            # TipTap editor & toolbar
│   ├── export/            # Export dialog
│   ├── notifications/     # Notification center
│   ├── search/            # Find & Replace
│   ├── share/             # Share dialog
│   ├── templates/         # Template gallery
│   └── ui/                # UI components
├── hooks/                 # Custom hooks
├── lib/                   # Utilities
├── store/                 # Zustand store
└── types/                 # TypeScript types
```

## License

MIT