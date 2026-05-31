# ⛰️ LingoPeak — Gamified ESL Learning Hub

[![Self-Hosted](https://img.shields.io/badge/Self--Hosted-Proxmox%20LXC-indigo?style=for-the-badge&logo=proxmox)](https://proxmox.com)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2016%20%7C%20React%2019%20%7C%20SQLite-darkgreen?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![Aesthetics](https://img.shields.io/badge/UI--UX-Premium%20Glassmorphism-violet?style=for-the-badge)](https://tailwindcss.com)

LingoPeak is a gamified, self-hosted English as a Second Language (ESL) learning platform custom-tailored for school environments (~400 students) and optimized for iPad Progressive Web Apps (PWAs).

It is designed to run with **zero external database dependencies**, utilizing an embedded, high-performance SQLite engine, and features an integrated **AI Writing Coach**, **click-to-define Book Club**, **Hermes AI Tutor**, **AI-driven Teacher dashboards**, and a full-featured **Worksheet Builder** with AI generation.

Built with 💻 and 💜 for educators and pupils.

---

## 🎨 Inside LingoPeak

```
                       [ ⛰️ Student Dashboard ]
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
[ 📝 Syllabus Units ]    [ 📚 Book Club Library ]  [ 🤖 AI Writing Coach ]
  Explorer (Easy)          Chapter 1 (Basic)         Draft Essay Workspace
  Voyager (Medium)         Chapter 2 (Interm.)       Formative Inline Hints
  Challenger (Hard)        Tap-to-Define Token       Criteria Evaluations
  AI Summit (Finisher)     Comprehension Checks      Locked Roster Sheets

         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
[ 🤖 Hermes AI Tutor ]   [ 🏆 Achievements ]     [ 👤 Profile & Settings ]
  Persistent Chat          Badge Showcase           Avatar & Preferences
  Context-Aware Help       Progress Timeline        Class Roster View
  Pronunciation Guides     Streak Tracking          Password Management
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

### 🤖 3. Hermes AI Tutor
A conversational AI tutor with persistent memory and curriculum awareness:
- **Context-aware help** — the tutor queries the student's recent worksheet failures and mastery levels, weaving targeted review into natural conversation
- **Persistent chat history** — last 15 messages loaded on mount, full conversation survives page reloads
- **Pronunciation guides** — uppercase syllable stress markers (e.g. `de-VEL-op`, `pho-to-GRAPH-ic`) + browser Web Speech TTS playback
- **Reset chat** — clears history from both UI and database

### 📚 4. Progressive Book Club Library
- **Sequential Scaffolding**: Difficulty scales chapter-by-chapter.
- **Click-to-Define Tokenizer**: Tapping any word displays definitions and pronunciation keys instantly without breaking reader context.
- **Embedded Checks**: Vocabulary and reading checkpoints block chapter progression until answered correctly (Score ≥ 80%).

### ✍️ 5. AI Writing Coach
- **Draft Iterations**: Students draft stories or reports in response to prompt rubrics.
- **Formative Highlights**: The AI highlights problematic segments, writing leading hints (e.g. *"Think about the past tense here"*) instead of supplying the answer.
- **Revision History Logs**: Teachers can review the entire drafting timeline (Draft 1 → AI hints → Draft 2 → AI evaluation) to monitor progress.

### 🥇 6. AI "Summit" Finisher
Completing the Explorer, Voyager, and Challenger worksheets unlocks **The Summit**. The database compiles the student's historical errors and calls the Gemini/OpenCode Zen API to generate a personalized practice worksheet. Passing awards the student the category's Gold Badge.

### 📊 7. Teacher Dashboards & Class Revision Planner
- **Mastery Heatmaps**: Renders student mastery averages colored by grade (Grey = Unstarted, Red = <60%, Yellow = 60–79%, Green = ≥80%).
- **Struggle Indicators**: Flags students with low attempt averages.
- **AI Class Review Planner**: Analyzes collective class mistakes and generates a custom 30-minute lesson warmup, board activity, and review questions.
- **Printable Reports**: Style sheets override headers, footers, and dashboard blocks to print progress reports to clean A4 PDFs.
- **Student View**: Teachers can preview the student experience with a single click.

---

## 🛠️ Folder & Application Structure

```
lingopeak/
├── deployment/                     # Proxmox LXC provisioning & upkeep scripts
│   ├── create-lxc.sh              # Host provisioner (run on Proxmox Shell)
│   ├── setup.sh                   # Container setup (installs Node, PM2, app)
│   ├── update.sh                  # Git fetch, package audits, PM2 hot reloading
│   └── rollback.sh                # Reverts container state to specific commits
├── public/                        # Static media & manifest assets
│   └── uploads/                   # Teacher-uploaded audios, pictures, videos
├── src/
│   ├── app/
│   │   ├── api/                   # 19 API routes (auth, attempts, AI, teacher, admin)
│   │   ├── student/               # Dashboard, units, worksheets, book-club, writing, tutor
│   │   ├── teacher/               # Dashboard, reports, worksheet builder, approvals
│   │   └── register/              # Student & teacher self-registration
│   ├── components/
│   │   ├── worksheets/            # 10 student-facing question widgets
│   │   ├── teacher/               # Worksheet builder (modular), teacher UI
│   │   │   └── builder/           # 10 editors, AI panel, templates, validation, tests
│   │   └── ui/                    # Shared UI primitives
│   └── lib/
│       ├── db.ts                  # SQLite connection, migrations, seed data (15 units)
│       ├── schema.sql             # 12 tables: users, units, worksheets, attempts, badges, etc.
│       ├── session.ts             # HMAC-signed cookie session
│       ├── aiService.ts           # AI integrations (Gemini & OpenCode Zen)
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
| **Book Club** | ✅ Complete — 1 seeded book with chapters |
| **AI Writing Coach** | ✅ Complete |
| **Summit AI Generator** | ✅ Complete |
| **Teacher Dashboards** | ✅ Complete — heatmap, struggles, AI review, reports |
| **Hermes AI Tutor** | ✅ Complete — persistent chat, context-aware, pronunciation |
| **Content Population** (Units 2–15) | ⚠️ Not started — 14/15 units are empty shells |
| **Student Experience** (profile, badges, timeline) | 🔄 In progress |
| **Teacher Admin** (class CRUD, roster management) | 🔄 In progress |

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

# AI Provider: GEMINI or OPENCODE_ZEN
AI_PROVIDER=GEMINI
AI_API_KEY="your_gemini_api_key_here"

# For OpenCode Zen (alternative provider):
# AI_PROVIDER=OPENCODE_ZEN
# AI_API_KEY=your_opencode_zen_key_here
# AI_ENDPOINT_URL=https://api.opencode.ai/v1/chat/completions
# AI_MODEL_NAME=zen-model

# Session signing secret
SESSION_SECRET="random_hex_string"
```

Reload PM2 after making environment changes:
```bash
pm2 reload lingopeak
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
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Access the workspace at `http://localhost:3000`.

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
- **Node.js built-in test runner** for validation unit tests
