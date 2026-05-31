# Plan: Unit 2 "At the Zoo" — 30 High-Quality Worksheet Seeders

## Summary
Generate a complete `scripts/seed-unit2-worksheets.ts` with **30 worksheets** (2 alternatives × 3 tiers × 5 categories) totaling ~510 questions for Unit 2: At the Zoo (CEFR A1). Follows the Blueprint's content layout specs exactly, meeting the strict 16-18 question count per worksheet requirement.

## Current State
- **DB**: Unit 2 "At the zoo" exists with 5 empty categories (line 420 of `src/lib/db.ts`)
- **Category UUIDs** (queried from dev.db):
  - GRAMMAR: `0d6a8706-50fa-4234-99c0-c755cded7be1`
  - VOCABULARY: `d2552a83-3815-4007-a1f7-4b9092b260cb`
  - READING: `503f14b3-567a-4988-a2aa-3381bbe8096d`
  - WRITING: `eb56f268-5c0f-4ff5-8ad3-7f90859ea622`
  - LISTENING: `5b50bda1-fe23-4fdd-b194-299f01115be8`
- **Reference pattern**: `scripts/seed-unit1-worksheets.ts` (355 lines) and `scripts/seed-unit1-worksheets-block2.ts` (434 lines)
- **Conventions discovered** in existing seeders:
  - `fill_in_gap` blanks use `[brackets]` (not `#...#` as in the blueprint prompt)
  - `choice_matrix` rows: `"sentence##ColumnName"` format, `answers: { "sentence": "ColumnName" }`
  - `drag_and_drop` uses `#word#` for blanks in the `sentences` array
  - Question IDs follow pattern: `{category_tier_alt_number}` e.g., `g_e_a1`, `g_e_b1`
  - Listening worksheets include `audio_url` and `transcript` fields

## Approach
**Why parallel by category?** Generating 30 worksheets with ~510 unique, pedagogically sound questions is beyond a single context window. Splitting into 5 independent category files, generated in parallel, then assembled into one combined seeder is the most efficient path.

1. **Research** (done) — category UUIDs, seeder conventions, content blueprint
2. **Generate 5 category files in parallel** via subtasks — each subtask produces 6 worksheets (2 alternatives × 3 tiers) with 16-18 questions each
3. **Assemble** — combine all 5 category files into one `scripts/seed-unit2-worksheets.ts`
4. **Test** — run the seeder against dev.db, verify worksheet counts

## Files to Change

| File | Change Type | What Changes |
|------|-------------|--------------|
| `scripts/seed-unit2-grammar.ts` | **Create** | 6 Grammar worksheets (96-108 questions) |
| `scripts/seed-unit2-vocabulary.ts` | **Create** | 6 Vocabulary worksheets (96-108 questions) |
| `scripts/seed-unit2-reading.ts` | **Create** | 6 Reading worksheets (96-108 questions) |
| `scripts/seed-unit2-writing.ts` | **Create** | 6 Writing worksheets (96-108 questions) |
| `scripts/seed-unit2-listening.ts` | **Create** | 6 Listening worksheets (96-108 questions) with audio_url |
| `scripts/seed-unit2-worksheets.ts` | **Create** | Combined seeder (assembled from 5 category files) |

## Content Blueprint (from user's spec)

### Grammar Scope: to be (am/is/are), prepositions of place, there is/there are
1. GRAMMAR Explorer A: *The Animal Team: Verb 'To Be'* (am/is/are affirmative)
2. GRAMMAR Explorer B: *Who is Who? Zoo Negatives* (am not/isn't/aren't)
3. GRAMMAR Voyager A: *Zoo Coordinates: Prepositions of Place* (in, on, under, next to)
4. GRAMMAR Voyager B: *Safari Positions: Spatial Clues* (behind, in front of)
5. GRAMMAR Challenger A: *Zoo Inspector: There is & There are* (singular/plural)
6. GRAMMAR Challenger B: *Monkey Counts: There is/are vs to be* (mixed agreements)

### Vocabulary Scope: 11 zoo animals, park parts, pencil case items
7. VOCABULARY Explorer A: *Safari Animals: Emojis & Sounds* (spelling animal nouns)
8. VOCABULARY Explorer B: *Zoo Habitats: Enclosures & Spots* (cage, pond, tree, fence)
9. VOCABULARY Voyager A: *Wild Enclosures: Park Mapping* (land vs water animals)
10. VOCABULARY Voyager B: *Pencil Case Safari* (pencil case + wildlife counts)
11. VOCABULARY Challenger A: *Park Ranger Check: Enclosure Details* (animal descriptions)
12. VOCABULARY Challenger B: *Zoo Map Planner* (spatial map locations)

### Reading Scope: Simple stories and dialogues
13. READING Explorer A: *Leo the Sleepy Lion* (lion sleeping under tree)
14. READING Explorer B: *The Hungry Giraffe* (giraffe eating leaves)
15. READING Voyager A: *Pond Chatter: The Crocodile and Frog* (dialogue about swimming)
16. READING Voyager B: *Monkey Shenanigans* (monkeys playing)
17. READING Challenger A: *Night at the Wildlife Park* (nocturnal zoo story)
18. READING Challenger B: *The Runaway Parrot* (rangers search story)

### Writing Scope: Descriptions, diary, reports
19. WRITING Explorer A: *Animal Profiles: Who Am I?* (animal profile lines)
20. WRITING Explorer B: *My Favourite Animal Card* (colors + habitats)
21. WRITING Voyager A: *Picture Definer: Zoo Scenes* (coordinate sentences)
22. WRITING Voyager B: *Ranger Diary: Enclosure Checks* (count sentences)
23. WRITING Challenger A: *The Zoo Inspector Report* (full scene descriptions)
24. WRITING Challenger B: *A Day at the Wildlife Park* (story with connectors)

### Listening Scope: Audio-based spelling, commands, narratives
25. LISTENING Explorer A: *Animal Spelling Rhythms* (spelled words: L-I-O-N)
26. LISTENING Explorer B: *Sound Enclosure Drills* (animal sound descriptions)
27. LISTENING Voyager A: *Simon Says: Ranger Commands* (spoken instructions)
28. LISTENING Voyager B: *Where is Fido?* (preposition clues)
29. LISTENING Challenger A: *Zoo Tour: Guide Description* (tour guide narrative)
30. LISTENING Challenger B: *The Lost Parrot Search* (ranger location descriptions)

## Step-by-Step Execution

1. **Generate Grammar worksheets (6)** — subtask, creates `scripts/seed-unit2-grammar.ts`
2. **Generate Vocabulary worksheets (6)** — subtask, creates `scripts/seed-unit2-vocabulary.ts`  
3. **Generate Reading worksheets (6)** — subtask, creates `scripts/seed-unit2-reading.ts`
4. **Generate Writing worksheets (6)** — subtask, creates `scripts/seed-unit2-writing.ts`
5. **Generate Listening worksheets (6)** — subtask, creates `scripts/seed-unit2-listening.ts`
   *(Steps 1-5 run in parallel)*
6. **Assemble** combined `scripts/seed-unit2-worksheets.ts` from all 5 category files
7. **Test** — run `npx tsx scripts/seed-unit2-worksheets.ts` against dev.db
8. **Verify** — query worksheet count per tier and category

## Risks and Edge Cases
- **Question count**: Each worksheet MUST have 16-18 questions — automated count check after assembly
- **Grammar boundary**: No present continuous, past tense, or modal verbs — only to be, prepositions, there is/are
- **UUID consistency**: Category UUIDs must match the actual dev.db values, not the blueprint's (which are Unit 1's)
- **Listening worksheets** need `audio_url: "tts://..."` and `transcript` fields
- **fill_in_gap convention**: Must use `[brackets]`, not `#...#` as the blueprint prompt suggests (the codebase uses brackets)

## Verification
```bash
# 1. Run the combined seeder
npx tsx scripts/seed-unit2-worksheets.ts

# 2. Verify worksheet counts per tier
npx tsx -e "import Database from 'better-sqlite3'; const db = new Database('dev.db'); const r = db.prepare(\`SELECT tier, COUNT(*) as cnt FROM worksheets w JOIN categories c ON w.category_id = c.id JOIN units u ON c.unit_id = u.id WHERE u.title = 'At the zoo' GROUP BY tier\`).all(); console.log(JSON.stringify(r, null, 2)); db.close();"

# 3. Verify total worksheet count = 30
npx tsx -e "import Database from 'better-sqlite3'; const db = new Database('dev.db'); const r = db.prepare(\`SELECT COUNT(*) as cnt FROM worksheets w JOIN categories c ON w.category_id = c.id JOIN units u ON c.unit_id = u.id WHERE u.title = 'At the zoo'\`).get(); console.log(r); db.close();"

# 4. Verify each worksheet has 16-18 questions  
npx tsx -e "import Database from 'better-sqlite3'; const db = new Database('dev.db'); const r = db.prepare(\`SELECT w.title, json_array_length(w.questions_json) as qcount FROM worksheets w JOIN categories c ON w.category_id = c.id JOIN units u ON c.unit_id = u.id WHERE u.title = 'At the zoo' ORDER BY w.title\`).all(); console.log(JSON.stringify(r, null, 2)); db.close();"
```

## Open Questions
1. Should listening worksheets include both `audio_url` AND `transcript` fields? (Existing Unit 1 listening worksheets do — confirming yes)
2. Should I also clean up the temporary `_query-unit2-cats.ts` after completion?
