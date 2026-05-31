# ⛰️ LingoPeak — Gamified ESL Learning Hub

[![Self-Hosted](https://img.shields.io/badge/Self--Hosted-Proxmox%20LXC-indigo?style=for-the-badge&logo=proxmox)](https://proxmox.com)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2016%20%7C%20React%2019%20%7C%20SQLite-darkgreen?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![Aesthetics](https://img.shields.io/badge/UI--UX-Premium%20Glassmorphism-violet?style=for-the-badge)](https://tailwindcss.com)

LingoPeak is a gamified, self-hosted English as a Second Language (ESL) learning platform custom-tailored for school environments (~400 students) and optimized for iPad Progressive Web Apps (PWAs).

It is designed to run with **zero external database dependencies**, utilizing an embedded, high-performance SQLite engine, and features an integrated **Socratic AI Learning Coach**, **AI Writing Coach**, **click-to-define Book Club**, **AI-driven Teacher dashboards**, and a full-featured **Worksheet Builder** with AI generation.

Built with 💻 and 💜 for educators and pupils.

---

## 🎨 Inside LingoPeak

```
                       [ ⛰️ Student Dashboard ]
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
[ 📝 Syllabus Units ]    [ 📚 Book Club Library ]  [ ✍️ AI Writing Coach ]
  Explorer (Easy)          Chapter 1 (Basic)         Draft Essay Workspace
  Voyager (Medium)         Chapter 2 (Interm.)       Formative Inline Hints
  Challenger (Hard)        Tap-to-Define Token       Criteria Evaluations
  AI Summit (Finisher)     Comprehension Checks      Locked Roster Sheets

         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
[ 🤖 Coach (AI Tutor) ]  [ 🏆 Achievements ]     [ 👤 Profile & Settings ]
  Socratic Guidance        Badge Showcase           Avatar & Preferences
  Persistent Memory        Progress Timeline        Class Roster View
  Spaced Repetition        Streak Tracking          Password Management
```

---

## ✨ Core Features

### 🧩 1. Interactive Syllabus Engine (10 Widget Types)
Worksheets render responsive, tactile game boards designed for iPad touch grids (minimum 44×44px target sizes):
- **Multiple Choice**: Card-based options.
- **Fill in the Gap**: Text input or dropdown fields.
- **Drag and Drop**: Tokens dragged into sentence targets.
- **Category Sorting**: Cards sorted into distinct bins.
- **Correct the Mistake**: Tapping mistakes opens correction bubbles.
- **Choice Matrix**: Table matching grids.
- **Crosswords**: Touch-friendly crossword navigation.
- **Sentence Unscramble**: Ordering word arrays.
- **Matching Pairs**: Card matching grids.
- **Word Search**: Touch grids for finding hidden letters.

### 🏗️ 2. Teacher Worksheet Builder
A full-featured, modular standalone builder for creating custom worksheets:
- **10 question type editors** — type-specific editors with validation
- **AI Co-Pilot** — generate worksheets from a natural language prompt, or ✨ Smart Fill individual question cards
- **Auto-save drafts** — localStorage autosave every 30s with recover/discard on reload
- **Undo/Redo** — full history stack (Ctrl+Z / Ctrl+Y)
- **8 curriculum-aligned templates** — Verb Tenses, Vocabulary, Sentence Construction, Gap Fill, Grammar Correction, Idioms Crossword, Parts of Speech, Subject-Verb Agreement
- **Test Drive modal** — full student preview before saving
- **Badge emoji picker** — popover grid of 18 curated emojis
- **Export/Import JSON** — share worksheets between instances
- **Unsaved changes guard** — `beforeunload` + Next.js router interception
- **Error boundaries** — per-card crash isolation with reset/delete options
- **Unit tests** — 11 test cases across all 10 question types
- **Keyboard shortcuts** — Ctrl+S/Ctrl+Enter (save), Ctrl+Alt+N (new question)

### 🤖 3. Coach — Socratic AI Learning Coach 2.0
An autonomous Socratic AI tutor that never gives direct answers — it guides students through reasoning with hints, questions, and scaffolding, backed by a persistent narrative observation system:

- **🧠 Persistent Memory** — remembers each student's goals, weak areas, and name across sessions via hidden `MEMORY_UPDATE` tags embedded in AI replies
- **📊 Context-Aware Prompting** — injects recent worksheet failures and category mastery levels into every conversation, weaving targeted review into natural dialogue
- **🎙️ Voice Input & TTS** — browser Speech-to-Text microphone button + Speech Synthesis playback (0.85x speed for ESL learners)
- **🔊 Pronunciation Guides** — syllable stress markers in responses (e.g. `de-VEL-op`, `pho-to-GRAPH-ic`)
- **📈 Dynamic Scaffolding** — automatically detects student level from average scores and adjusts hint depth (MINIMAL / MODERATE / MAXIMUM support)
- **🔄 Spaced Repetition** — background cron daemon scans for weak areas (<60% score, >3 days since review) and sends Socratic review prompts to the student's chat
- **📝 Agentic Practice Worksheets** — Coach can silently generate a personalized practice worksheet via `<!--CREATE_PRACTICE:{}-->` tag, rendered as a clickable link in chat
- **❓ Worksheet Help Drawer** — floating "Ask Coach" button on every worksheet opens a slide-over Socratic assistant pre-seeded with the current question
- **📓 Coach Notes** — narrative observations written to SQLite via `<!--COACH_NOTE:{}-->` tags, building a longitudinal record of each student's progress, struggles, and confidence
- **🎯 Goal Tracking** — students set personal learning goals in chat; Coach tracks progress and asks for confirmation before marking complete
- **📉 Confidence Detection** — Coach monitors for hedging/uncertainty patterns and logs observations (max 1/day) without interrupting the flow
- **📋 Session Summaries** — every 5th exchange, Coach writes a professional narrative summary as a coach note
- **🚨 Teacher Handover** — if a student fails 3+ worksheets in a category within 14 days, Coach auto-generates a high-priority alert and notifies the teacher via MS Teams
- **📬 Weekly Recap** — cron generates a friendly weekly progress summary in each student's chat, archives stale notes, and broadcasts a class summary to the teacher's Teams webhook
- **🔒 Teacher Note Privacy** — teacher-authored observations are excluded from the AI prompt context to prevent sensitive information from leaking into chat
- **🗑️ Note Archival** — `archiveAndKeepRecentHigh()` runs weekly to prevent prompt bloat while preserving critical observations
- **💬 Persistent Chat History** — last 15 messages loaded on mount, conversation survives page reloads, full reset available
- **🤖 AI Coach Label** — clearly marked as AI in the UI

### 📚 4. Progressive Book Club Library
- **Sequential Scaffolding**: Difficulty scales chapter-by-chapter.
- **Click-to-Define Tokenizer**: Tapping any word displays definitions and pronunciation keys instantly without breaking reader context.
- **Embedded Checks**: Vocabulary and reading checkpoints block chapter progression until answered correctly (Score ≥ 80%).

### ✍️ 5. AI Writing Coach
- **Draft Iterations**: Students draft stories or reports in response to prompt rubrics.
- **Formative Highlights**: The AI highlights problematic segments, writing leading hints (e.g. *"Think about the past tense here"*) instead of supplying the answer.
- **Revision History Logs**: Teachers can review the entire drafting timeline (Draft 1 → AI hints → Draft 2 → AI evaluation) to monitor progress.

### 🥇 6. AI "Summit" Finisher
Completing the Explorer, Voyager, and Challenger worksheets unlocks **The Summit**. The database compiles the student's historical errors and calls the AI API to generate a personalized practice worksheet. Passing awards the student the category's Gold Badge.

### 📊 7. Teacher Dashboards & Class Revision Planner
- **Mastery Heatmaps**: Renders student mastery averages colored by grade (Grey = Unstarted, Red = <60%, Yellow = 60–79%, Green = ≥80%).
- **Struggle Indicators**: Flags students with low attempt averages.
- **AI Class Review Planner**: Analyzes collective class mistakes and generates a custom 30-minute lesson warmup, board activity, and review questions.
- **Printable Reports**: Style sheets override headers, footers, and dashboard blocks to print progress reports to clean A4 PDFs.
- **Student View**: Teachers can preview the student experience with a single click.
- **Class CRUD**: Create, rename, and delete classes with student roster reassignment.
- **Staff-to-Class Assignment**: Bind teachers and admins to specific classes.
- **Live Notifications**: Bell indicator polling worksheet completions and coach alerts.
- **MS Teams Integration**: Incoming Webhook connector for struggle alerts and weekly class reports.

---

## 🛠️ Folder & Application Structure

```
lingopeak/
├── deployment/                     # Proxmox LXC provisioning & upkeep scripts
│   ├── create-lxc.sh              # Host provisioner (run on Proxmox Shell)
│   ├── setup.sh                   # Container setup (installs Node, PM2, app)
│   ├── update.sh                  # Git fetch, package audits, PM2 hot reloading
│   └── rollback.sh                # Reverts container state to specific commits
├── public/
│   ├── uploads/                   # Teacher-uploaded audios, pictures, videos
│   └── icons/                     # PWA manifest icons
├── scripts/
│   └── cron-coach.ts              # Background spaced repetition + Teams alerts + weekly recap daemon
├── src/
│   ├── app/
│   │   ├── api/                   # 30+ API routes (auth, attempts, AI, tutor, teacher, admin)
│   │   │   ├── student/           # Attempts, writing, tutor, worksheet help, practice
│   │   │   ├── teacher/           # Worksheets, roster, class-revision, teams webhook,
│   │   │   │                      #   coach/notes (CRUD narrative observations)
│   │   │   └── admin/             # Backup, curriculum generation
│   │   ├── student/               # Dashboard, units, worksheets, book-club, writing, tutor, profile
│   │   ├── teacher/               # Dashboard, reports, worksheet builder, approvals
│   │   └── register/              # Student & teacher self-registration
│   ├── components/
│   │   ├── worksheets/            # 10 student-facing question widgets + WorksheetContainer
│   │   ├── teacher/               # WorksheetBuilder, TeamsSettingsPanel
│   │   │   └── builder/           # 10 editors, AI panel, templates, validation, tests, hooks
│   │   ├── NotificationBell.tsx   # Live notification bell component
│   │   └── ui/                    # Shared UI primitives
│   └── lib/
│       ├── db.ts                  # SQLite connection, migrations, seed data (15 units)
│       ├── schema.sql             # 15 tables: users, units, worksheets, attempts, badges,
│       │                          #   tutor_messages, student_memories, coach_notes, notifications, etc.
│       ├── session.ts             # HMAC-signed cookie session
│       ├── aiService.ts           # AI integrations (Gemini & OpenCode Zen)
│       ├── hermesMemory.ts        # Per-student persistent memory read/write + tag parser
│       ├── coachNotes.ts          # Coach narrative observations CRUD + tag parser + archival
│       ├── teamsNotify.ts         # MS Teams Adaptive Card sender
│       ├── gridGenerators.ts      # Crossword & word search grid auto-generation
│       └── worksheet-types.ts     # Discriminated union types (10 question variants)
├── task.md                        # Project roadmap & progress tracker
├── walkthrough.md                 # Session-by-session development log
└── PLAN.md                        # Current priorities & gap analysis
```

---

## 📈 Project Status

| Area | Status |
|------|--------|
| **Syllabus Engine** (10 widgets, student player) | ✅ Complete |
| **Worksheet Builder** (Phases 1, 2, 2.5) | ✅ Complete — hardened with tests, AI, autosave, undo/redo |
| **Coach 2.0 (Socratic AI Learning Coach)** — persistent memory, notes, goals, scaffolding, spaced repetition, voice, worksheet help, practice generation, confidence detection, session summaries, teacher handover, weekly recaps | ✅ Complete |
| **Book Club** | ✅ Complete — 1 seeded book with chapters |
| **AI Writing Coach** | ✅ Complete |
| **Summit AI Generator** | ✅ Complete |
| **Teacher Dashboards** | ✅ Complete — heatmap, struggles, AI review, reports, class CRUD, Teams |
| **Student Experience** (profile, badges, timeline, avatar) | ✅ Complete |
| **Teacher Admin** (class CRUD, roster, staff assignment, notifications) | ✅ Complete |
| **Content Population** (Units 2–15) | ⚠️ Not started — 14/15 units are empty shells |
| **MS Teams Integration** (webhook, struggle alerts, weekly reports) | ✅ Complete |
| **Security Hardening** (PBKDF2, rate limiting, CSRF, session validation, upload sanitization) | ✅ Complete |

**Curriculum**: 15 units aligned to MORE! 1 textbook. Unit 1 "Time for School" is fully populated (15 worksheets × 3 tiers). Units 2–15 await content seeding.

---

## ⚡ Self-Hosting Setup on Proxmox

Provision LingoPeak directly on your Proxmox VE server shell (installs Debian 12, Node.js 26.2.0, PM2, and configures the daemon on container startup):

```bash
curl -fsSL https://raw.githubusercontent.com/damessner/lingopeak/master/deployment/create-lxc.sh | bash
```

### Upkeep and Updates
Pull new versions, run dependency checks, compile Next.js builds, and hot-reload PM2:

```bash
cd /var/www/lingopeak && bash deployment/update.sh
```

### Emergency Rollback
Revert the container files to a previous git hash or release reference:

```bash
cd /var/www/lingopeak && bash deployment/rollback.sh [optional_commit_hash_or_ref]
```

---

## ⚙️ Environment Variables

Open `/var/www/lingopeak/.env` inside the container to configure API access:

```env
PORT=3000
NODE_ENV=production
DATABASE_URL="file:./dev.db"

# Public URL for Teams action links (set to your production domain)
NEXT_PUBLIC_APP_URL=http://192.168.178.159:3000

# AI Provider: OPENCODE_ZEN (recommended) or GEMINI
AI_PROVIDER=OPENCODE_ZEN
AI_API_KEY="your_opencode_zen_api_key_here"
AI_MODEL_NAME=deepseek-v4-flash

# Alternative: Google Gemini
# AI_PROVIDER=GEMINI
# AI_API_KEY="your_gemini_api_key_here"
# AI_MODEL_NAME=gemini-2.5-flash

# Session signing secret (min 32 characters)
SESSION_SECRET="replace_with_random_hex_string"

# Database path for standalone cron-coach daemon (optional)
DATABASE_PATH=dev.db
```

Reload PM2 after making environment changes:
```bash
pm2 reload lingopeak
```

### Background Cron (Coach Daemon)

The Coach daemon runs outside Next.js. Schedule via Windows Task Scheduler or cron:

```bash
# Daily coaching — spaced repetition + confidence checks (Mon–Fri 08:00)
npx tsx scripts/cron-coach.ts

# Weekly teacher report — class averages + at-risk counts (Fri 17:00)
npx tsx scripts/cron-coach.ts weekly

# Weekly student recap — progress summary + note archival (Sun 18:00)
npx tsx scripts/cron-coach.ts weekly-recap
```

---

## 💻 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/damessner/lingopeak.git
   cd lingopeak
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env` and fill in your AI API key
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Access the workspace at `http://localhost:3000`.

### Running Tests
```bash
npm run test
```

---

## 🗺️ Curriculum (MORE! 1 Textbook)

| Unit | Theme | Worksheets |
|------|-------|-----------|
| 1 | Time for school | ✅ 15 (3 tiers × 5 categories) |
| 2 | At the zoo | ⬜ 0 |
| 3 | Pirates | ⬜ 0 |
| 4 | Emotions | ⬜ 0 |
| 5 | The Alps | ⬜ 0 |
| 6 | That's my opinion | ⬜ 0 |
| 7 | In my own words | ⬜ 0 |
| 8 | Media | ⬜ 0 |
| 9 | Let's celebrate | ⬜ 0 |
| 10 | Once upon a time | ⬜ 0 |
| 11 | The world around us | ⬜ 0 |
| 12 | It's a bargain | ⬜ 0 |
| 13 | Food | ⬜ 0 |
| 14 | The world is calling | ⬜ 0 |
| 15 | Revision | ⬜ 0 |

---

## 💜 Built with Love
LingoPeak is built using:
- **Next.js 16** (App Router) & **TypeScript**
- **React 19**
- **better-sqlite3** for zero-config database storage
- **canvas-confetti** for milestoning animations
- **Tailwind CSS** for responsive layout design
- **Web Speech API** for client-side Text-to-Speech playback
- **Web Speech Recognition** for voice input
- **Node.js built-in test runner** for validation unit tests
- **DeepSeek V4 Flash** via OpenCode Zen (default AI model)
