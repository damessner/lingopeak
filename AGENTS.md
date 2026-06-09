# LingoPeak — Development Guide for AI Agents

## Stack
- **Next.js 16** (App Router) with React 19
- **better-sqlite3** for synchronous SQLite access
- **Tailwind CSS v4** with `@tailwindcss/postcss`
- **TypeScript 5** with strict mode

## Project Conventions

### File Structure
- `src/app/api/` — API route handlers (one `route.ts` per endpoint)
- `src/app/` — Pages using App Router (server components by default)
- `src/components/` — Client components (all use `'use client'`)
- `src/lib/` — Shared utilities, DB connection, session, AI service
- `src/proxy.ts` — Next.js middleware for auth routing
- `scripts/` — Standalone scripts run with `npx tsx`

### Database
- Single SQLite file at `dev.db` (WAL mode, foreign keys ON)
- Schema defined in `src/lib/schema.sql`
- Migrations are inline in `src/lib/db.ts` `initDb()` using try/catch pattern
- Use `db.prepare(...).all()` / `.get()` / `.run()` for queries
- Always use parameterized queries — never string interpolation

### Session & Auth
- HMAC-signed cookie sessions via `src/lib/session.ts`
- Password hashing: PBKDF2 with per-user random salt
- Rate limiting: in-memory Map in `src/lib/rateLimit.ts`
- CSRF protection: Origin/Referer check in middleware (`src/proxy.ts`)

### AI Integration
- AI provider config in `src/lib/aiService.ts`
- Supports Gemini and OpenCode Zen (OpenAI-compatible)
- Always wrap AI JSON parsing in try/catch
- Student names must NOT be sent to AI — use pseudonyms in prompts

### Styling
- Tailwind utility classes only — no CSS modules
- Dark theme (slate-950, slate-900, indigo accents)
- Touch targets: minimum 44×44px for iPad compatibility
- Glassmorphism: `bg-slate-900/60 backdrop-blur-xl border border-slate-800`

### Testing
- Node.js built-in test runner: `node --experimental-strip-types`
- Test files in `src/__tests__/`
- Run with: `npm run test`

### Worksheet Types
- 11 question types defined in `src/lib/worksheet-types.ts`
- Scoring logic in `src/components/worksheets/WorksheetContainer.tsx`
- Builder components in `src/components/teacher/builder/`

## Common Pitfalls
- Don't use `as any[]` on DB queries — define proper types
- Session tokens have expiration — check `expiresAt` field
- Summit worksheets are per-student (filter by `student_id`)
- Coach notes from teachers (`source='teacher'`) must NOT be injected into AI prompts
- TTS must be cancelled on component unmount
