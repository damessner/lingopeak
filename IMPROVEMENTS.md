# LingoPeak - Improvement Plan

> Analysis generated 2026-05-30. Stack: Next.js 16 / React 19 / Tailwind v4 / SQLite (better-sqlite3) / PM2 on Proxmox LXC.

---

## Current State

LingoPeak is a well-structured gamified ESL platform with solid foundations:

- **Middleware** correctly routes users by role (STUDENT / TEACHER / ADMIN / PENDING_TEACHER)
- **10 worksheet widget types** with a shared scoring orchestrator
- **AI Writing Coach** with draft versioning and inline formative feedback
- **Teacher dashboards** with mastery heatmaps and class revision planner
- **AI Summit** generator that creates personalized worksheets from student errors
- **Deployment pipeline** with create / setup / update / rollback scripts
- **Book Club** with progressive chapters and tap-to-define dictionary

The main gaps are in **security hardening**, **scoring correctness**, **type safety**, and **PWA polish**.

---

## 🔴 Critical (fix first)

### 1. No per-user salt for password hashing

**File:** `src/lib/db.ts:16`

PBKDF2 is used with a hardcoded salt (`lingopeak_salt_secret`). Any two users with the same password will have identical password hashes. An attacker with a DB dump can crack all matching passwords at once.

**Fix:** Generate a random per-user salt on registration, store it alongside the hash. Use bcrypt or argon2 instead.

---

### 2. Hardcoded session secret in source code

**File:** `src/lib/session.ts:3`

```ts
const SESSION_SECRET = process.env.SESSION_SECRET || 'lingopeak_secret_default_key_change_me_12345';
```

The fallback secret is checked into git. Anyone with repository access can forge session tokens and impersonate any user.

**Fix:** Remove the fallback. Crash at startup if `SESSION_SECRET` is unset. Enforce a minimum key length.

---

### 3. No authorization on teacher approval API

**File:** `src/app/api/teacher/approve/route.ts`

The endpoint calls `verifySession` but does not check that the requester has `ADMIN` role. Any authenticated user (even a student) can promote themselves to `TEACHER`.

**Fix:** Add role check after `verifySession` — only `ADMIN` may approve pending teachers.

---

### 4. File upload: no validation, no size limit, path injection risk

**File:** `src/app/api/teacher/upload/route.ts`

- Accepts any file extension — no MIME type or magic-byte check
- No size limit — a student could fill the disk
- `worksheetId` from user input is used directly in the filename path
- Uploads land in `public/uploads/` — world-accessible, no hotlink protection

**Fix:** Validate extensions against a whitelist, enforce a size cap, sanitize `worksheetId`, serve uploads through an API route with auth.

---

### 5. Book Club uses external dictionary API

**File:** `src/components/worksheets/BookReader.tsx:43`

```ts
const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
```

Every student word-tap sends the word to a third-party API with no guarantee of privacy, uptime, or rate limits. This is a privacy concern for school deployments.

**Fix:** Bundle or download a local dictionary (e.g., `wordnet` or a simple JSON word-list). Add a caching layer so repeated lookups don't re-fetch.

---

### 6. Missing PWA icon files

**File:** `public/manifest.json`

```json
"icons": [
  { "src": "/icons/icon-192.png", ... },
  { "src": "/icons/icon-512.png", ... }
]
```

These files do not exist in the `public/` directory. The PWA will not install on iPads (the primary target platform).

**Fix:** Generate the icon files and add them to `public/icons/`. Verify with Lighthouse.

---

## 🟠 High Priority

### 7. Three worksheet types always score as correct

**File:** `src/components/worksheets/WorksheetContainer.tsx:148-160`

```ts
// matching_pairs and word_search scoring:
if (question.type === 'matching_pairs' || question.type === 'word_search') {
  // Only checks array length — no answer comparison
  score += 1;
}
```

These two question types always grant a point regardless of whether the student's answer is correct.

**Fix:** Implement actual answer comparison for both types before incrementing score.

---

### 8. No rate limiting on auth endpoints

**Files:** `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`

No rate limiting, account lockout, or CAPTCHA on authentication endpoints. A 400-student school deployment is vulnerable to brute-force attacks.

**Fix:** Add in-memory rate limiting (or use a middleware wrapper). Implement account lockout after N failed attempts.

---

### 9. Password reset uses native `prompt()` dialog

**File:** `src/app/teacher/dashboard/TeacherDashboardClient.tsx:88`

```ts
const newPassword = prompt('Enter new password for student:');
```

`prompt()` is a blocking browser dialog — terrible UX on iPad, no confirmation step, no validation.

**Fix:** Build a proper modal component with password confirmation field and client-side validation.

---

### 10. Summit worksheet is shared per-category, not per-student

**File:** `src/app/student/units/[unitId]/[category]/page.tsx:88-94`

The comment says: _"Note: In the future, we will link summits to specific students."_

When one student generates and passes a summit worksheet, it overwrites the category's shared summit. All other students see it as passed.

**Fix:** Add a `student_id` column to the summit worksheets so they are per-student. Update the query and the generation API.

---

### 11. `as any[]` type casting throughout

**Files:** Multiple server components

```tsx
const categories = db.prepare(...).all() as any[];
```

Bypasses TypeScript's type system entirely. A schema change won't be caught at compile time — it will silently produce runtime errors.

**Fix:** Define proper TypeScript interfaces for all DB query results. Replace `as any[]` with typed generics.

---

### 12. No database indexes

**File:** `src/lib/schema.sql`

The schema defines 10+ tables with foreign keys but zero `CREATE INDEX` statements. Queries that join on `student_id`, `category_id`, `unit_id`, or `user_id` will perform full table scans. At 400 students this will be slow.

**Fix:** Add indexes on all foreign key columns and frequently-queried columns (e.g., `student_id`, `category_name`, `session_token`).

---

### 13. Fragile AI response parsing

**Files:**
- `src/app/api/student/writing/coach/route.ts:85`
- `src/app/api/student/summit/generate/route.ts:79`
- `src/app/api/teacher/class-revision/route.ts:41`

All three routes parse AI output by splitting on `\`\`\`json` then calling `JSON.parse()` without a try/catch. If the AI returns malformed JSON, the server crashes with an uncaught exception.

**Fix:** Wrap all `JSON.parse` calls on AI output in try/catch. Add fallback behavior or retry logic. Validate the response shape before using it.

---

### 14. AI class revision leaks identifiable student data

**File:** `src/app/api/teacher/class-revision/route.ts`

The AI prompt includes raw student names and their specific errors. For a school deployment, sending identifiable student data to a third-party AI API may violate privacy policies.

**Fix:** Anonymize student names before sending to the AI provider. Add a configuration flag to enable/disable sending student data.

---

### 15. Session tokens never expire

**File:** `src/lib/session.ts`

The session payload contains `{ userId, username, role }` with no expiration timestamp. Tokens are valid forever unless the cookie is deleted. There is no token rotation on role change.

**Fix:** Add an `expiresAt` field to the session payload. Reject expired tokens on read. Re-issue tokens on role changes.

---

### 16. No limit on writing draft versions

**File:** `src/app/api/student/writing/coach/route.ts`

Students can create unlimited draft versions of a writing submission. For a 400-student deployment, this could grow unbounded and fill storage.

**Fix:** Enforce a maximum number of drafts per prompt (e.g., 10). Prune oldest drafts when the limit is reached.

---

## 🟡 Medium Priority

### 17. Large components need splitting

| Component | Lines | Problem |
|-----------|-------|---------|
| `TeacherDashboardClient.tsx` | 756 | 5 tabs in one file. Hard to maintain, test, or modify independently. |
| `WorksheetContainer.tsx` | 392 | 10 scoring functions in one file. Each widget type could be its own scorer module. |

**Fix:** Split `TeacherDashboardClient` into per-tab components. Extract each worksheet scoring function into its own file under `src/components/worksheets/scoring/`.

---

### 18. Progress counter hardcoded on student dashboard

**File:** `src/app/student/dashboard/page.tsx:162`

```tsx
<div className="text-white/60 text-xs">0 / 4 Completed</div>
```

This counter is a static string — it never reflects actual student progress.

**Fix:** Query the DB for completed units/categories and compute the real count.

---

### 19. Dialogue parser fails on colons in dialogue text

**File:** `src/utils/dialogueParser.ts:22`

```ts
const colonIndex = line.indexOf(':');
```

If a character name or dialogue contains a colon, the parser misidentifies the speaker/dialogue boundary.

**Fix:** Use a more precise pattern (e.g., match only at the first colon after a word boundary). Add support for escaped colons.

---

### 20. No error boundaries or loading states

The app uses server components throughout with no `error.tsx` files or `<Suspense>` fallbacks. If any page's data fetching throws, the user sees a Next.js white error page.

**Fix:** Add `error.tsx` and `loading.tsx` at each route segment level. Wrap client interactions in try/catch with toast notifications.

---

### 21. Service worker has no cache versioning

**File:** `public/sw.js`

The service worker uses a cache-first strategy with no versioning. When the app updates, students will continue to see the old cached version until the SW's `install` event triggers — which it won't without a version bump.

**Fix:** Add a `CACHE_VERSION` constant and increment it on each deploy. Add an `activate` handler to purge old caches.

---

## 🟢 Low Priority / Polish

| # | Issue | Detail |
|---|-------|--------|
| 22 | **Homepage `page.tsx` is default Next.js starter** | Middleware redirects away from `/`, but the file still has "Get started by editing page.tsx" content. Replace with a proper landing or a redirect. |
| 23 | **No keyboard accessibility on some widgets** | Crossword and DragAndDrop rely on pointer/touch events. Add keyboard navigation for accessibility compliance. |
| 24 | **DialogRenderer voice loading is synchronous** | `synth.getVoices()` is called before voices are populated. Listen for `voiceschanged` event. |
| 25 | **TTS doesn't stop on navigation** | Speaking continues after the user leaves the page. Clean up speech synthesis on unmount. |
| 26 | **Hardcoded emoji picker** | 14 emojis hardcoded in registration form. Could be data-driven or expanded. |
| 27 | **`as any[]` in worksheets typings** | Consistent type definitions would prevent regression on worksheet data shape changes. |

---

## Quick Wins (can be done in <30 min each)

1. Remove hardcoded session fallback and crash on missing env var
2. Add auth check on teacher/approve endpoint
3. Add file extension whitelist + size limit on upload
4. Add try/catch on AI JSON parse calls (3 locations)
5. Add missing PWA icons
6. Fix hardcoded "0 / 4 Completed" counter with a DB query
7. Add `error.tsx` and `loading.tsx` at the root layout level

---

## Suggested Roadmap

```
Phase 1 (Security)  →  Items 1-6, 8, 9, 15
Phase 2 (Correctness) → Items 7, 10, 11, 12, 16
Phase 3 (Robustness) → Items 13, 14, 17, 20
Phase 4 (Polish)    → Items 18, 19, 21, 22-27
```

Each phase can be worked independently in parallel.
