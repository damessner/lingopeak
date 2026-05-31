# Worksheet Builder — Implementation Audit

**Audit date**: 2026-05-31
**Source**: Strategic Improvement Plan (previous version of this file) vs current codebase

---

## ✅ Fully Implemented

| Area | Detail |
|------|--------|
| **Missing question types** | All 6 types added: `drag_and_drop`, `category_sorting`, `correct_the_mistake`, `choice_matrix`, `crossword`, `word_search`. Dialogue exists at worksheet level (flag + transcript), not as a question type — correct architecture. |
| **Grid generators** | `src/lib/gridGenerators.ts` auto-generates crossword and word search grids from word lists (matches recommendation — no manual grid editing). |
| **Drag-and-drop reordering** | Native HTML5 DnD on question cards in the builder. |
| **Collapsible question cards** | Each card can collapse to title+type to save vertical space. |
| **Quick-add palette** | Expanded from 4 to 10 question types in the add-question dropdown. |
| **Keyboard shortcuts** | Ctrl+S (save), Ctrl+Enter (save), Ctrl+Alt+N (new question). |

## ⚠️ Partially Implemented

| Area | What's there | What's missing |
|------|-------------|----------------|
| **Preview** | Inline grid previews for crossword and word search. | No general question preview (render actual student widget inline). No "Test Drive" mode (full WorksheetContainer in modal). |

## ❌ Not Implemented

| Area | Detail |
|------|--------|
| **Duplicate/clone question** | No button to copy a question within the builder. |
| **Standalone builder page** | Builder is still embedded as a tab in `TeacherDashboardClient.tsx`. No `/teacher/worksheets/builder` route. Cannot deep-link to an editor session. |
| **AI integration** | No AI generate, smart fill, curriculum-aligned generation, or any AI-assisted creation. (Student-facing AI for Summit + Writing Coach exists separately.) |
| **Templates & cloning** | No template system, no clone-worksheet button, no "start from template" flow. |
| **Test Drive preview** | No way to preview the full worksheet as a student would see it before saving/publishing. |
| **Shared types** | `Question` interface is defined inline in `WorksheetBuilder.tsx` (lines 13-69). Not extracted to `src/lib/worksheet-types.ts` for reuse across builder + student player. |
| **Modular file structure** | All builder code is in a single 1,370-line file (`WorksheetBuilder.tsx`). No `QuestionCard.tsx`, no type-specific editor files, no `QuestionTypePicker.tsx`, no `TemplatePicker.tsx`. |

---

## Summary

| Phase | Items | Status |
|-------|-------|--------|
| **Phase 1** (Quick wins) | Question types, grid generators, DnD, collapsible cards, palette, shortcuts | ✅ Done |
| **Phase 2** (Core experience) | Standalone page, AI generate+smart fill, preview/Test Drive, templates, cloning, shared types, modular files | ❌ Not started |
| **Phase 3** (AI advanced) | Curriculum-aligned generation, worksheet variants, undo/redo, bulk ops, streaming AI | ❌ Not started |
