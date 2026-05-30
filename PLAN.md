# Restructure Units to MORE! 1 Textbook + Populate Unit 1

## What's Changing

### Database: Replace 2 placeholder units → 15 textbook units
The current `units` table has:
- Unit 1: "All About Me"
- Unit 2: "Around the World"

Replace with 15 units from the MORE! 1 Jahresplanung:

| # | Theme | Grammar | Vocabulary |
|---|-------|---------|------------|
| 1 | Time for school | Alphabet, numbers 1-25, plurals, imperatives | Colours, school things, classroom objects |
| 2 | At the zoo | verb to be, prepositions of place, there is/are | Animals, wildlife park |
| 3 | Pirates | have got/haven't got, irregular plurals | Body parts |
| 4 | Emotions | Questions/negatives with to be, days/week | Feelings |
| 5 | This is our band | can/can't, possessives | Musicians, instruments |
| 6 | The world's best detective | Present simple, a lot of/lots of | Action verbs |
| 7 | I love noodles | Present simple negative, articles a/an, adverbs of frequency | Food |
| 8 | Clothes | Present simple questions | Clothes |
| 9 | Shopping | Question words, object pronouns, possessive 's | Pets |
| 10 | In a shop | this/that/these/those, How much...?, numbers 25-1000 | Shopping |
| 11 | What's the time? | Present continuous, telling time | Free time activities |
| 12 | The birthday cake | Past simple (was/were), ordinal numbers, time prepositions | Months, rooms |
| 13 | Help! | Past simple (regular verbs), linking words | Emergency services |
| 14 | It's my favourite | Past simple (negative), irregular past | TV programmes, books |
| 15 | What are you going to do? | (be) going to, future plans | Holiday activities |

### Unit 1 Content: 15 New Worksheets (5 categories × 3 tiers)

Each category gets EXPLORER, VOYAGER, CHALLENGER worksheets:

**GRAMMAR — "Time for School Grammar"**
| Tier | Title | Topics | Question Types |
|------|-------|--------|----------------|
| Explorer | Alphabet & Numbers | ABC order, numbers 1-25, basic plural -s | multiple_choice, fill_in_gap, matching_pairs |
| Voyager | Plurals & Orders | Irregular plurals, imperatives | category_sorting, correct_the_mistake, fill_in_gap |
| Challenger | Grammar Climber | Mixed: plurals + imperatives + numbers | choice_matrix, crossword, correct_the_mistake |

**VOCABULARY — "School Words"**
| Tier | Title | Topics | Question Types |
|------|-------|--------|----------------|
| Explorer | Colourful World | 10 colours | multiple_choice, matching_pairs, fill_in_gap |
| Voyager | My School Bag | 11 school things | multiple_choice, category_sorting, matching_pairs |
| Challenger | In the Classroom | 11 classroom objects | correct_the_mistake, word_search, fill_in_gap |

**READING — "First Stories"**
| Tier | Title | Topics | Question Types |
|------|-------|--------|----------------|
| Explorer | My Pet Dog | Short simple animal text | multiple_choice, fill_in_gap |
| Voyager | The Wide-Mouthed Frog | Textbook story | sentence_unscramble, multiple_choice, fill_in_gap |
| Challenger | Midnight in the Classroom | Longer story | correct_the_mistake, drag_and_drop, category_sorting |

**WRITING — "First Sentences"**
| Tier | Title | Topics | Question Types |
|------|-------|--------|----------------|
| Explorer | Building Sentences | Word order, basic sentences | sentence_unscramble, fill_in_gap |
| Voyager | Fix & Improve | Spelling, punctuation, structure | correct_the_mistake, drag_and_drop, fill_in_gap |
| Challenger | Write About You | Paragraph organization | category_sorting, choice_matrix, correct_the_mistake |

**LISTENING — "Listen & Learn"** (all use transcript + is_dialogue=1)
| Tier | Title | Topics | Question Types |
|------|-------|--------|----------------|
| Explorer | Spell It Out | Spelling names, email addresses | multiple_choice |
| Voyager | Follow the Teacher | Classroom instructions | fill_in_gap, multiple_choice |
| Challenger | School Uniform Talk | Video-based comprehension | correct_the_mistake, multiple_choice, category_sorting |

### Migration Strategy
Since existing units have random UUIDs, I'll add a migration in `initDb()` that:
1. Detects old-style unit titles ("All About Me", "Around the World")
2. Removes old units (cascades to categories → worksheets → attempts/badges)
3. Seeds the 15 new units with their categories
4. Populates Unit 1 with all 15 worksheets

### Badges
Badges are earned per category per unit — the existing UI logic handles this automatically once worksheets exist.

## Files to Modify
- `src/lib/db.ts` — rewrite `runSeed()` + add migration

## Out of Scope (for now)
- Units 2-15 worksheets (will populate gradually)
- The PDF's competence grid content (can align later)
