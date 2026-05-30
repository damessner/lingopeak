# ⛰️ LingoPeak — Gamified ESL Learning Hub

[![Self-Hosted](https://img.shields.io/badge/Self--Hosted-Proxmox%20LXC-indigo?style=for-the-badge&logo=proxmox)](https://proxmox.com)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2016%20%7C%20React%2019%20%7C%20SQLite-darkgreen?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![Aesthetics](https://img.shields.io/badge/UI--UX-Premium%20Glassmorphism-violet?style=for-the-badge)](https://tailwindcss.com)

LingoPeak is a gamified, self-hosted English as a Second Language (ESL) learning platform custom-tailored for school environments (~400 students) and optimized for iPad Progressive Web Apps (PWAs). 

It is designed to run with **zero external database dependencies**, utilizing an embedded, high-performance SQLite engine, and features an integrated **FelloFish-style AI Writing Coach**, a **click-to-define progressive Book Club**, and **AI-driven Teacher dashboards**.

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
```

---

## 🛠️ Folder & Application Structure

```
lingopeak/
├── deployment/                 # Proxmox LXC provisioning & upkeep scripts
│   ├── create-lxc.sh           # Host provisioner (run on Proxmox Shell)
│   ├── setup.sh                # Container setup (installs Node, PM2, app)
│   ├── update.sh               # Git fetch, package audits, PM2 hot reloading
│   └── rollback.sh             # Reverts container state to specific commits
├── public/                     # Static media & manifest assets
│   ├── uploads/                # Teacher-uploaded audios, pictures, videos
│   ├── manifest.json           # Web Manifest for PWA installations
│   └── sw.js                   # Service worker caching and offline fallback
├── src/
│   ├── app/                    # Next.js App Router endpoints & views
│   │   ├── api/                # Backend API routes (DB writes, AI clients)
│   │   ├── student/            # Student learning interfaces & workspaces
│   │   ├── teacher/            # Teacher analytics heatmaps & staff portals
│   │   └── offline/            # Offline static placeholder page
│   ├── components/
│   │   └── worksheets/         # Interactive React questions & widgets
│   ├── lib/
│   │   ├── db.ts               # Direct SQLite connection & seed scripts
│   │   ├── schema.sql          # SQLite table structures
│   │   ├── session.ts          # Signed cookie token validators
│   │   └── aiService.ts        # AI API integrations (Gemini & OpenCode Zen)
│   └── utils/
│       └── dialogueParser.ts   # Monologue/dialogue chat bubbles formatter
├── package.json                # Project configurations & dependencies
├── tsconfig.json               # TypeScript configurations
└── README.md                   # You are here!
```

---

## ✨ Core Features

### 🧩 1. The Interactive Syllabus Engine (10 Widgets)
Worksheets render responsive, tactile game boards designed for iPad touch grids (minimum 44x44px target sizes):
*   **Multiple Choice**: Card-based options.
*   **Fill in the Gap**: Text input or dropdown fields.
*   **Drag and Drop**: Tokens dragged into sentence targets.
*   **Category Sorting**: Cards sorted into distinct bins.
*   **Correct the Mistake**: Tapping mistakes opens simple correction bubbles.
*   **Choice Matrix**: Table matching grids.
*   **Crosswords**: Touch-friendly crossword navigation.
*   **Sentence Unscramble**: Ordering word arrays.
*   **Matching Pairs**: Card matching grids.
*   **Word Search**: Touch grids for finding hidden letters.

### 📚 2. Progressive Book Club Library
*   **Sequential Scaffolding**: Difficulty scales chapter-by-chapter.
*   **Click-to-Define Tokenizer**: Tapping any word displays definitions and pronunciation keys instantly without breaking reader context.
*   **Embedded Checks**: Vocabulary and reading checkpoints block chapter progression until answered correctly (Score $\ge 80\%$).

### 🤖 3. FelloFish-style AI Writing Coach
*   **Draft Iterations**: Students draft stories or reports in response to prompt rubrics.
*   **Formative Highlights**: The AI highlights problematic segments, writing leading hints (e.g. *"Think about the past tense here"*) instead of supplying the answer.
*   **Revision History Logs**: Teachers can review the entire drafting timeline (Draft 1 $\rightarrow$ AI hints $\rightarrow$ Draft 2 $\rightarrow$ AI evaluation) to monitor progress.

### 🥇 4. The AI "Summit" Finisher
Completing the Explorer, Voyager, and Challenger worksheets unlocks **The Summit**. The database compiles the student's historical errors and calls the Gemini/OpenCode Zen API to generate a personalized practice worksheet. Passing awards the student the category's Gold Badge.

### 📊 5. Teacher Dashboards & Class Revision Planner
*   **Mastery Heatmaps**: Renders student mastery averages colored by grade (Grey = Unstarted, Red = `<60%`, Yellow = `60-79%`, Green = `80%+`).
*   **Struggle Indicators**: Flags students with low attempt averages.
*   **AI Class Review Planner**: Analyzes collective class mistakes and generates a custom 30-minute lesson warmup, board activity, and review questions.
*   **Printable Reports**: Style sheets override headers, footers, and dashboard blocks to print progress reports to clean A4 PDFs.

---

## ⚡ Self-Hosting Setup on Proxmox

Provision LingoPeak directly on your Proxmox VE server shell (installs Debian 12, Node.js 26.2.0, PM2, and configures the daemon on container startup):

```bash
curl -fsSL https://raw.githubusercontent.com/damessner/lingopeak/master/deployment/create-lxc.sh | bash
```

### Upkeep and Updates
To pull new versions, run dependency checks, compileNext.js builds, and hot-reload PM2:

```bash
cd /var/www/lingopeak && bash deployment/update.sh
```

### Emergency Rollback
To revert the container files to a previous git hash or release reference:

```bash
cd /var/www/lingopeak && bash deployment/rollback.sh [optional_commit_hash_or_ref]
```

---

## ⚙️ Environment Variables

Open `/var/www/lingopeak/.env` inside the container to configure API access:

```env
PORT=3000
NODE_ENV=production

# Choose GEMINI or OPENCODE_ZEN
AI_PROVIDER=GEMINI
AI_API_KEY="your_api_key_here"

# For OpenCode Zen configuration (if chosen):
# AI_ENDPOINT_URL=https://api.opencode.ai/v1/chat/completions
# AI_MODEL_NAME=zen-model

# Auto-generated signature secret
SESSION_SECRET="random_hex_string"
```

Reload PM2 server after making environment changes:
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
4. Access the workspace at: `http://localhost:3000`.

---

## 💜 Built with Love
LingoPeak is built using:
*   **Next.js 16** (App Router) & **TypeScript**
*   **React 19**
*   **better-sqlite3** for zero-config database storage
*   **canvas-confetti** for milestoning animations
*   **Tailwind CSS** for responsive layout design
*   **Web Speech API** for client-side Text-to-Speech playback
