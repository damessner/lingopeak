import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.resolve(process.cwd(), 'dev.db');
const db = new Database(DB_PATH);

// Categories Mapping for Unit 1: "Time for school"
const unit1Cats = {
  GRAMMAR: '4e01cdc5-9e47-4526-b255-9e504b1fbaf8',
  VOCABULARY: 'a3911bed-0be1-4b15-9ad9-7cb8dda954e9',
  READING: '28453603-50ff-456b-8995-eb6600ea9027',
  WRITING: '29f88a81-763e-4c14-b948-025a12b0c866',
  LISTENING: '361ec065-ef69-4b51-a408-a66b9d4d5313'
};

const block2Worksheets = [
  // ==========================================
  // CATEGORY 1: GRAMMAR (Learning Style: Visual / Auditory & Spelling Rhythms)
  // ==========================================
  {
    category_id: unit1Cats.GRAMMAR,
    title: 'Grammar Detective: Letters & Sounds',
    tier: 'EXPLORER',
    badge_emoji: '🔎',
    questions: [
      { id: 'g_e2_1', type: 'matching_pairs', question: 'Match uppercase vowel sounds to lowercase.', pairs: { 'A': 'a', 'E': 'e', 'I': 'i', 'O': 'o', 'U': 'u' } },
      { id: 'g_e2_2', type: 'matching_pairs', question: 'Match letters with their alphabetic next neighbors.', pairs: { 'X': 'y', 'B': 'c', 'H': 'i', 'O': 'p', 'V': 'w' } },
      { id: 'g_e2_3', type: 'multiple_choice', question: 'Which letter sounds like the word "see"?', options: ['C', 'S', 'B', 'Z'], answer: 'C' },
      { id: 'g_e2_4', type: 'multiple_choice', question: 'Which letter sounds like the word "why"?', options: ['Y', 'W', 'I', 'J'], answer: 'Y' },
      { id: 'g_e2_5', type: 'fill_in_gap', question: 'Write the plural form (adding -s).', text: 'One pencil, three [pencils]. One rubber, four [rubbers]. One clock, two [clocks].' },
      { id: 'g_e2_6', type: 'fill_in_gap', question: 'Write the plural form (adding -es).', text: 'One brush, two [brushes]. One flash, five [flashes]. One class, three [classes].' },
      { id: 'g_e2_7', type: 'multiple_choice', question: 'Choose correct word form for the number 8.', options: ['eight', 'eigth', 'eigt', 'eighteen'], answer: 'eight' },
      { id: 'g_e2_8', type: 'multiple_choice', question: 'Choose correct word form for the number 12.', options: ['twelve', 'twelv', 'twelwe', 'twenty'], answer: 'twelve' },
      { id: 'g_e2_9', type: 'correct_the_mistake', question: 'Click the incorrect plural word and type its correct form.', text: 'There are four watch on the shelf.', mistake: 'watch', correction: 'watches' },
      { id: 'g_e2_10', type: 'correct_the_mistake', question: 'Correct the singular noun form.', text: 'I see one classes in the room.', mistake: 'classes', correction: 'class' },
      { id: 'g_e2_11', type: 'sentence_unscramble', question: 'Unscramble the number math sentence.', words: ['Two', 'plus', 'three', 'is', 'five', '.'] },
      { id: 'g_e2_12', type: 'choice_matrix', question: 'Classify spelling forms.', rows: ['boxs##incorrect', 'boxes##correct', 'pens##correct', 'ruleres##incorrect'], columns: ['correct', 'incorrect'], answers: { 'boxs': 'incorrect', 'boxes': 'correct', 'pens': 'correct', 'ruleres': 'incorrect' } },
      { id: 'g_e2_13', type: 'category_sorting', question: 'Sort the numbers by even vs odd.', categories: ['Even Numbers', 'Odd Numbers'], items: [{ text: 'two', category: 'Even Numbers' }, { text: 'three', category: 'Odd Numbers' }, { text: 'four', category: 'Even Numbers' }, { text: 'five', category: 'Odd Numbers' }, { text: 'six', category: 'Even Numbers' }, { text: 'seven', category: 'Odd Numbers' }] },
      { id: 'g_e2_14', type: 'drag_and_drop', question: 'Complete spelling blanks.', sentences: ['There is one #pen# on the desk.', 'There are six #rubbers# in the drawer.', 'We have five #books#.'], distractors: ['pens', 'rubber', 'book'] },
      { id: 'g_e2_15', type: 'matching_pairs', question: 'Match digit values.', pairs: { '3': 'three', '7': 'seven', '9': 'nine', '14': 'fourteen', '21': 'twenty-one' } },
      { id: 'g_e2_16', type: 'multiple_choice', question: 'Which letter comes immediately before M?', options: ['L', 'N', 'K', 'O'], answer: 'L' }
    ]
  },
  {
    category_id: unit1Cats.GRAMMAR,
    title: 'Plurals & Commands: The Active Classroom',
    tier: 'VOYAGER',
    badge_emoji: '🤸',
    questions: [
      { id: 'g_v2_1', type: 'matching_pairs', question: 'Match action verb commands to physical directions.', pairs: { 'Stand': 'up', 'Sit': 'down', 'Go': 'to the board', 'Turn': 'around', 'Look': 'at the window' } },
      { id: 'g_v2_2', type: 'matching_pairs', question: 'Match verbs to classroom nouns.', pairs: { 'open': 'your book', 'write': 'your name', 'listen': 'to the teacher', 'clean': 'the board' } },
      { id: 'g_v2_3', type: 'multiple_choice', question: 'Which word completes the instruction: "Please ________ quiet."', options: ['be', 'do', 'go', 'have'], answer: 'be' },
      { id: 'g_v2_4', type: 'multiple_choice', question: 'Complete the negative command: "________ talk during the listening test!"', options: ['Don\'t', 'No', 'Not', 'Aren\'t'], answer: 'Don\'t' },
      { id: 'g_v2_5', type: 'fill_in_gap', question: 'Complete commands with active verbs.', text: '[Listen] to the music track and [write] down the answers.' },
      { id: 'g_v2_6', type: 'fill_in_gap', question: 'Write the imperative verbs.', text: '[Open] your eyes, [look] at me, and [be] quiet.' },
      { id: 'g_v2_7', type: 'correct_the_mistake', question: 'Find and correct the imperative form.', text: 'Please listing to the teacher.', mistake: 'listing', correction: 'listen' },
      { id: 'g_v2_8', type: 'correct_the_mistake', question: 'Find and correct the pronoun.', text: 'Open me book to page six.', mistake: 'me', correction: 'your' },
      { id: 'g_v2_9', type: 'sentence_unscramble', question: 'Unscramble the instruction.', words: ['Don\'t', 'speak', 'German', 'in', 'class', '.'] },
      { id: 'g_v2_10', type: 'choice_matrix', question: 'Is the command positive or negative?', rows: ['Stand up!##Positive', 'Don\'t run!##Negative', 'Write your name!##Positive', 'Don\'t speak!##Negative'], columns: ['Positive', 'Negative'], answers: { 'Stand up!': 'Positive', 'Don\'t run!': 'Negative', 'Write your name!': 'Positive', 'Don\'t speak!': 'Negative' } },
      { id: 'g_v2_11', type: 'category_sorting', question: 'Sort these verbs into Commands vs Statements.', categories: ['Command (Imperative)', 'Statement Verb'], items: [{ text: 'Listen!', category: 'Command (Imperative)' }, { text: 'likes', category: 'Statement Verb' }, { text: 'Stand up!', category: 'Command (Imperative)' }, { text: 'have', category: 'Statement Verb' }, { text: 'Be quiet!', category: 'Command (Imperative)' }] },
      { id: 'g_v2_12', type: 'drag_and_drop', question: 'Complete instructions.', sentences: ['Please #close# the door.', 'Do not #run# in the class.', '#Write# your homework.'], distractors: ['opening', 'runs', 'Writes'] },
      { id: 'g_v2_13', type: 'order_sentences', question: 'Order commands logically.', sentences: ['First, stand up from your chair.', 'Second, walk quietly to the front.', 'Third, pick up the white chalk.', 'Finally, draw a circle on the board.'] },
      { id: 'g_v2_14', type: 'multiple_choice', question: 'Which sentence is a correct imperative?', options: ['Close the window, please.', 'Closing the window, please.', 'Closes the window, please.', 'Please to close the window.'], answer: 'Close the window, please.' },
      { id: 'g_v2_15', type: 'fill_in_gap', question: 'Complete plural items.', text: 'I have three [boxes] and four irregular [mice] in my project case.' },
      { id: 'g_v2_16', type: 'matching_pairs', question: 'Match plural rules.', pairs: { 'child': 'children', 'person': 'people', 'box': 'boxes', 'bag': 'bags' } }
    ]
  },
  {
    category_id: unit1Cats.GRAMMAR,
    title: 'Master of Tenses: There is, There are & No Commands',
    tier: 'CHALLENGER',
    badge_emoji: '👑',
    questions: [
      { id: 'g_c2_1', type: 'matching_pairs', question: 'Match the sentence starters to plurals.', pairs: { 'There is a': 'pencil on my desk.', 'There are five': 'pencils on my desk.', 'There is one': 'child in the corridor.', 'There are ten': 'children in the corridor.' } },
      { id: 'g_c2_2', type: 'matching_pairs', question: 'Match irregular plurals.', pairs: { 'man': 'men', 'woman': 'women', 'person': 'people', 'mouse': 'mice' } },
      { id: 'g_c2_3', type: 'multiple_choice', question: 'Choose the correct form: "In our class, there ________ twenty-five desks."', options: ['are', 'is', 'am', 'be'], answer: 'are' },
      { id: 'g_c2_4', type: 'multiple_choice', question: 'Choose the correct form: "There ________ a clock on the wall."', options: ['is', 'are', 'am', 'be'], answer: 'is' },
      { id: 'g_c2_5', type: 'fill_in_gap', question: 'Complete with there is or there are.', text: 'In my room, [there is] a board. On the board, [there are] many posters.' },
      { id: 'g_c2_6', type: 'fill_in_gap', question: 'Complete the irregular plurals.', text: 'Many [men] and [women] work at the school. They are nice [people].' },
      { id: 'g_c2_7', type: 'correct_the_mistake', question: 'Correct the error in there is/are.', text: 'There are a green pen in my case.', mistake: 'are', correction: 'is' },
      { id: 'g_c2_8', type: 'correct_the_mistake', question: 'Correct the negative imperative form.', text: 'Don\'t running in the library.', mistake: 'running', correction: 'run' },
      { id: 'g_c2_9', type: 'sentence_unscramble', question: 'Unscramble the description.', words: ['There', 'is', 'an', 'irregular', 'plural', 'noun', 'here', '.'] },
      { id: 'g_c2_10', type: 'choice_matrix', question: 'Is the grammar form correct or incorrect?', rows: ['There is children.##incorrect', 'There are children.##correct', 'Don\'t shout!##correct', 'Don\'t to shout!##incorrect'], columns: ['correct', 'incorrect'], answers: { 'There is children.': 'incorrect', 'There are children.': 'correct', 'Don\'t shout!': 'correct', 'Don\'t to shout!': 'incorrect' } },
      { id: 'g_c2_11', type: 'category_sorting', question: 'Sort these statements.', categories: ['There is (Singular)', 'There are (Plural)'], items: [{ text: 'a yellow desk', category: 'There is (Singular)' }, { text: 'five books', category: 'There are (Plural)' }, { text: 'two doors', category: 'There are (Plural)' }, { text: 'an orange rubber', category: 'There is (Singular)' }] },
      { id: 'g_c2_12', type: 'drag_and_drop', question: 'Complete the description.', sentences: ['In the bag #there is# a ruler.', 'On the wall #there are# three posters.', 'Please #be# quiet.'], distractors: ['there are', 'there is', 'do'] },
      { id: 'g_c2_13', type: 'order_sentences', question: 'Order rules.', sentences: ['First, check if the noun is singular or plural.', 'Second, use \"there is\" for singular.', 'Third, use \"there are\" for plural.', 'Finally, write down your complete sentence.'] },
      { id: 'g_c2_14', type: 'multiple_choice', question: 'Which sentence is fully correct?', options: ['There are twelve children in the room.', 'There is twelve children in the room.', 'There are twelve childs in the room.', 'There is twelve childs in the room.'], answer: 'There are twelve children in the room.' },
      { id: 'g_c2_15', type: 'fill_in_gap', question: 'Complete instructions.', text: 'Please [stand] up and [close] the windowes.' },
      { id: 'g_c2_16', type: 'matching_pairs', question: 'Match the opposites.', pairs: { 'is': 'are', 'regular': 'irregular', 'positive': 'negative', 'singular': 'plural' } }
    ]
  },

  // ==========================================
  // CATEGORY 2: VOCABULARY (Learning Style: Visual / Color-Map Associations)
  // ==========================================
  {
    category_id: unit1Cats.VOCABULARY,
    title: 'Spectrum of Colors: Emojis & Nature',
    tier: 'EXPLORER',
    badge_emoji: '🌈',
    questions: [
      { id: 'v_e2_1', type: 'multiple_choice', question: 'What color is a ripe banana?', options: ['blue', 'yellow', 'purple', 'red'], answer: 'yellow' },
      { id: 'v_e2_2', type: 'multiple_choice', question: 'What color is a clear sky?', options: ['blue', 'black', 'white', 'orange'], answer: 'blue' },
      { id: 'v_e2_3', type: 'matching_pairs', question: 'Match colors to emojis.', pairs: { 'orange': '🍊', 'purple': '🍇', 'pink': '🌸', 'brown': '🪵' } },
      { id: 'v_e2_4', type: 'matching_pairs', question: 'Match items to colors.', pairs: { 'grass': 'green', 'milk': 'white', 'coal': 'black', 'carrot': 'orange' } },
      { id: 'v_e2_5', type: 'fill_in_gap', question: 'Complete color sentences.', text: 'Apples can be red or [green]. Carrots are [orange].' },
      { id: 'v_e2_6', type: 'fill_in_gap', question: 'Spelling colors.', text: 'Pink is spelled p[in]k. Brown is b[ro]wn.' },
      { id: 'v_e2_7', type: 'correct_the_mistake', question: 'Correct spelling.', text: 'The sky is blew.', mistake: 'blew', correction: 'blue' },
      { id: 'v_e2_8', type: 'correct_the_mistake', question: 'Correct spelling.', text: 'My pen is orang.', mistake: 'orang', correction: 'orange' },
      { id: 'v_e2_9', type: 'sentence_unscramble', question: 'Unscramble color details.', words: ['Pigs', 'are', 'usually', 'pink', '.'] },
      { id: 'v_e2_10', type: 'choice_matrix', question: 'Are these colors warm or cool?', rows: ['red##warm', 'blue##cool', 'orange##warm', 'green##cool'], columns: ['warm', 'cool'], answers: { 'red': 'warm', 'blue': 'cool', 'orange': 'warm', 'green': 'cool' } },
      { id: 'v_e2_11', type: 'category_sorting', question: 'Sort color words.', categories: ['Light Colors', 'Dark Colors'], items: [{ text: 'white', category: 'Light Colors' }, { text: 'black', category: 'Dark Colors' }, { text: 'yellow', category: 'Light Colors' }, { text: 'brown', category: 'Dark Colors' }] },
      { id: 'v_e2_12', type: 'drag_and_drop', question: 'Complete color sentences.', sentences: ['The grass is #green#.', 'The sun is #yellow#.', 'Milk is #white#.'], distractors: ['red', 'black', 'blue'] },
      { id: 'v_e2_13', type: 'order_sentences', question: 'Order rainbow colors.', sentences: ['First comes red and orange.', 'Second comes yellow and green.', 'Third comes blue and indigo.', 'Finally comes violet at the end.'] },
      { id: 'v_e2_14', type: 'multiple_choice', question: 'Which color is mixed from red and blue?', options: ['green', 'purple', 'orange', 'yellow'], answer: 'purple' },
      { id: 'v_e2_15', type: 'fill_in_gap', question: 'Complete colors.', text: 'Flamingos are [pink] and pandas are [black] and [white].' },
      { id: 'v_e2_16', type: 'matching_pairs', question: 'Match colors.', pairs: { 'red': '🔴', 'blue': '🔵', 'white': '⚪', 'black': '⚫' } }
    ]
  },
  {
    category_id: unit1Cats.VOCABULARY,
    title: 'Bag Inspector: Stationery Drill',
    tier: 'VOYAGER',
    badge_emoji: '✏️',
    questions: [
      { id: 'v_v2_1', type: 'multiple_choice', question: 'What item holds all your pens and rubbers?', options: ['schoolbag', 'pencilcase', 'notebook', 'desk'], answer: 'pencilcase' },
      { id: 'v_v2_2', type: 'multiple_choice', question: 'What item do you use to stick paper together?', options: ['glue', 'sharpener', 'ruler', 'rubber'], answer: 'glue' },
      { id: 'v_v2_3', type: 'matching_pairs', question: 'Match school items to their emojis.', pairs: { 'pencilcase': '👝', 'ruler': '📏', 'glue': '🧪', 'notebook': '📓' } },
      { id: 'v_v2_4', type: 'matching_pairs', question: 'Match items to uses.', pairs: { 'pencil': 'drawing', 'rubber': 'cleaning paper', 'notebook': 'taking notes', 'schoolbag': 'carrying items' } },
      { id: 'v_v2_5', type: 'fill_in_gap', question: 'Complete the list.', text: 'In my case, I have a green [pencil] and a blue [rubber].' },
      { id: 'v_v2_6', type: 'fill_in_gap', question: 'Complete stationery spelling.', text: 'I keep my sheets in a plastic [folder] and glue them with [glue].' },
      { id: 'v_v2_7', type: 'correct_the_mistake', question: 'Correct logical mismatch.', text: 'I sharpen my pencil with a rubber.', mistake: 'rubber', correction: 'sharpener' },
      { id: 'v_v2_8', type: 'correct_the_mistake', question: 'Correct spelling.', text: 'I write in my notbook.', mistake: 'notbook', correction: 'notebook' },
      { id: 'v_v2_9', type: 'sentence_unscramble', question: 'Unscramble the question.', words: ['Do', 'you', 'have', 'a', 'ruler', 'in', 'your', 'bag', '?'] },
      { id: 'v_v2_10', type: 'choice_matrix', question: 'Does it fit in a small pencil case?', rows: ['pen##yes', 'ruler##no', 'rubber##yes', 'schoolbag##no'], columns: ['yes', 'no'], answers: { 'pen': 'yes', 'ruler': 'no', 'rubber': 'yes', 'schoolbag': 'no' } },
      { id: 'v_v2_11', type: 'category_sorting', question: 'Sort paper products vs tools.', categories: ['Paper Products', 'Tools'], items: [{ text: 'book', category: 'Paper Products' }, { text: 'ruler', category: 'Tools' }, { text: 'notebook', category: 'Paper Products' }, { text: 'sharpener', category: 'Tools' }, { text: 'folder', category: 'Paper Products' }] },
      { id: 'v_v2_12', type: 'drag_and_drop', question: 'Complete sentences.', sentences: ['Stick the photo with #glue#.', 'Keep your sheets in a #folder#.', 'Write notes in your #notebook#.'], distractors: ['pen', 'ruler', 'rubber'] },
      { id: 'v_v2_13', type: 'order_sentences', question: 'Order packing tasks.', sentences: ['First, get your empty schoolbag.', 'Second, pack your books and folder.', 'Third, slide in your pencil case.', 'Finally, zip up the schoolbag.'] },
      { id: 'v_v2_14', type: 'multiple_choice', question: 'Which item is used for sharpening pencils?', options: ['sharpener', 'eraser', 'ruler', 'folder'], answer: 'sharpener' },
      { id: 'v_v2_15', type: 'fill_in_gap', question: 'Complete nouns.', text: 'We use a [pen] for writing and [glue] for sticking.' },
      { id: 'v_v2_16', type: 'matching_pairs', question: 'Match items.', pairs: { 'folder': '📁', 'sharpener': '✏️', 'glue': '🧪', 'rubber': '🧽' } }
    ]
  },
  {
    category_id: unit1Cats.VOCABULARY,
    title: 'Classroom Architect: Rooms & Spots',
    tier: 'CHALLENGER',
    badge_emoji: '🏛️',
    questions: [
      { id: 'v_c2_1', type: 'multiple_choice', question: 'What structural object holds posters on the walls?', options: ['board', 'shelf', 'floor', 'clock'], answer: 'shelf' },
      { id: 'v_c2_2', type: 'multiple_choice', question: 'What do we look through to see outside?', options: ['door', 'window', 'board', 'bin'], answer: 'window' },
      { id: 'v_c2_3', type: 'matching_pairs', question: 'Match location descriptions.', pairs: { 'front': 'where the board is', 'wall': 'where posters hang', 'floor': 'where desks stand', 'ceiling': 'where lights are' } },
      { id: 'v_c2_4', type: 'matching_pairs', question: 'Match classroom zones.', pairs: { 'teacher\'s desk': 'front of room', 'bin': 'corner of room', 'window': 'side of room', 'shelves': 'back of room' } },
      { id: 'v_c2_5', type: 'fill_in_gap', question: 'Complete descriptions.', text: 'The teacher sits at the front [desk]. The students sit on [chairs].' },
      { id: 'v_c2_6', type: 'fill_in_gap', question: 'Complete spelling.', text: 'Please throw paper in the waste [bin]. Check the time on the [clock].' },
      { id: 'v_c2_7', type: 'correct_the_mistake', question: 'Correct logical object.', text: 'We write notes on the window.', mistake: 'window', correction: 'board' },
      { id: 'v_c2_8', type: 'correct_the_mistake', question: 'Correct spelling.', text: 'Close the classrom door.', mistake: 'classrom', correction: 'classroom' },
      { id: 'v_c2_9', type: 'sentence_unscramble', question: 'Unscramble location details.', words: ['The', 'bin', 'is', 'in', 'the', 'corner', '.'] },
      { id: 'v_c2_10', type: 'choice_matrix', question: 'Are these structural parts of a room?', rows: ['wall##yes', 'chair##no', 'ceiling##yes', 'rubber##no'], columns: ['yes', 'no'], answers: { 'wall': 'yes', 'chair': 'no', 'ceiling': 'yes', 'rubber': 'no' } },
      { id: 'v_c2_11', type: 'category_sorting', question: 'Sort items by typical location.', categories: ['On the Wall', 'On the Floor'], items: [{ text: 'clock', category: 'On the Wall' }, { text: 'desk', category: 'On the Floor' }, { text: 'board', category: 'On the Wall' }, { text: 'chair', category: 'On the Floor' }, { text: 'poster', category: 'On the Wall' }] },
      { id: 'v_c2_12', type: 'drag_and_drop', question: 'Complete classroom setup descriptions.', sentences: ['The teacher writes on the #board#.', 'The clocks hang on the #wall#.', 'Sit down on your #chair#.'], distractors: ['floor', 'desk', 'bin'] },
      { id: 'v_c2_13', type: 'order_sentences', question: 'Order cleaning steps.', sentences: ['First, pick up scraps from the floor.', 'Second, throw them in the waste bin.', 'Third, clean the writing board.', 'Finally, align the student desks.'] },
      { id: 'v_c2_14', type: 'multiple_choice', question: 'Where is the teacher\'s desk usually located?', options: ['at the front', 'at the back', 'outside', 'in the bin'], answer: 'at the front' },
      { id: 'v_c2_15', type: 'fill_in_gap', question: 'Complete objects.', text: 'We look out the [window] and go out the [door].' },
      { id: 'v_c2_16', type: 'matching_pairs', question: 'Match items.', pairs: { 'board': '🖥️', 'bin': '🗑️', 'desk': '🪑', 'clock': '⏰' } }
    ]
  },

  // ==========================================
  // CATEGORY 3: READING (Learning Style: Visual Stories & Dialogues)
  // ==========================================
  {
    category_id: unit1Cats.READING,
    title: 'Animal Friends: Mini-Tales',
    tier: 'EXPLORER',
    badge_emoji: '😺',
    questions: [
      { id: 'r_e2_1', type: 'multiple_choice', question: 'Read: "Bella is a white rabbit. She has long pink ears. She lives in a wooden hutch in the garden. Every morning, she eats carrots."\n\nWhat animal is Bella?', options: ['a dog', 'a cat', 'a rabbit', 'a mouse'], answer: 'a rabbit' },
      { id: 'r_e2_2', type: 'multiple_choice', question: 'What color are Bella\'s ears?', options: ['white', 'pink', 'brown', 'black'], answer: 'pink' },
      { id: 'r_e2_3', type: 'matching_pairs', question: 'Match the character details.', pairs: { 'Bella': 'white rabbit', 'ears': 'pink and long', 'hutch': 'wooden home', 'garden': 'where she lives' } },
      { id: 'r_e2_4', type: 'matching_pairs', question: 'Match singular to plural forms.', pairs: { 'rabbit': 'rabbits', 'ear': 'ears', 'hutch': 'hutches', 'carrot': 'carrots' } },
      { id: 'r_e2_5', type: 'fill_in_gap', question: 'Complete the sentence.', text: 'Bella is a white [rabbit] and lives in the [garden].' },
      { id: 'r_e2_6', type: 'fill_in_gap', question: 'Complete food details.', text: 'Every morning, Bella eats [carrots].' },
      { id: 'r_e2_7', type: 'correct_the_mistake', question: 'Correct the mismatch based on the text.', text: 'Bella lives in a plastic hutch.', mistake: 'plastic', correction: 'wooden' },
      { id: 'r_e2_8', type: 'correct_the_mistake', question: 'Correct the color detail.', text: 'Bella is a brown rabbit.', mistake: 'brown', correction: 'white' },
      { id: 'r_e2_9', type: 'sentence_unscramble', question: 'Unscramble the rabbit sentence.', words: ['Every', 'morning', ',', 'she', 'eats', 'carrots', '.'] },
      { id: 'r_e2_10', type: 'choice_matrix', question: 'Are these facts True or False based on the story?', rows: ['Bella is a cat.##False', 'Bella has pink ears.##True', 'She lives in the garden.##True', 'She eats chocolate.##False'], columns: ['True', 'False'], answers: { 'Bella is a cat.': 'False', 'Bella has pink ears.': 'True', 'She lives in the garden.': 'True', 'She eats chocolate.': 'False' } },
      { id: 'r_e2_11', type: 'category_sorting', question: 'Sort details into Bella vs Tim\'s dog Max.', categories: ['Bella (Rabbit)', 'Max (Dog)'], items: [{ text: 'is white', category: 'Bella (Rabbit)' }, { text: 'is brown', category: 'Max (Dog)' }, { text: 'eats carrots', category: 'Bella (Rabbit)' }, { text: 'plays in park', category: 'Max (Dog)' }] },
      { id: 'r_e2_12', type: 'drag_and_drop', question: 'Complete the rabbit summary.', sentences: ['Bella #is# a rabbit.', 'She lives in the #garden#.', 'She eats #carrots#.'], distractors: ['has', 'park', 'grass'] },
      { id: 'r_e2_13', type: 'order_sentences', question: 'Order the rabbit\'s morning tasks.', sentences: ['First, Bella wakes up in her hutch.', 'Second, she hops out into the grass.', 'Third, she eats a crunchy carrot.', 'Finally, she plays with other rabbits.'] },
      { id: 'r_e2_14', type: 'multiple_choice', question: 'Where is the hutch located?', options: ['in the kitchen', 'in the garden', 'at school', 'in the park'], answer: 'in the garden' },
      { id: 'r_e2_15', type: 'fill_in_gap', question: 'Complete descriptors.', text: 'Bella has [long] pink ears. Her home is [wooden].' },
      { id: 'r_e2_16', type: 'matching_pairs', question: 'Match words.', pairs: { 'wooden': 'hutch', 'pink': 'ears', 'white': 'rabbit', 'morning': 'carrots' } }
    ]
  },
  {
    category_id: unit1Cats.READING,
    title: 'Pond Tales: The Talking Frog',
    tier: 'VOYAGER',
    badge_emoji: '🗣️',
    questions: [
      { id: 'r_v2_1', type: 'multiple_choice', question: 'Read: "A small green frog sits on a wet log. \'Hello!\' says the frog to a passing duck. \'I can hop very high! Can you hop?\' The duck replies, \'No, I cannot hop, but I can swim.\'"\n\nWhat does the frog say to the duck?', options: ['Goodbye', 'Hello!', 'I can swim', 'I like flies'], answer: 'Hello!' },
      { id: 'r_v2_2', type: 'multiple_choice', question: 'What can the duck do?', options: ['hop high', 'fly high', 'swim', 'read'], answer: 'swim' },
      { id: 'r_v2_3', type: 'matching_pairs', question: 'Match characters to their actions.', pairs: { 'frog': 'hops very high', 'duck': 'can swim', 'log': 'where the frog sits', 'Hello': 'what the frog says' } },
      { id: 'r_v2_4', type: 'matching_pairs', question: 'Match words to spelling changes.', pairs: { 'sit': 'sitting', 'duck': 'ducks', 'frog': 'frogs', 'log': 'logs' } },
      { id: 'r_v2_5', type: 'fill_in_gap', question: 'Complete dialogue gaps.', text: 'The frog sits on a wet [log]. The duck can [swim] but cannot [hop].' },
      { id: 'r_v2_6', type: 'fill_in_gap', question: 'Complete words.', text: 'The green [frog] talks to a passing [duck].' },
      { id: 'r_v2_7', type: 'correct_the_mistake', question: 'Correct the mismatch based on the text.', text: 'The frog sits on a dry log.', mistake: 'dry', correction: 'wet' },
      { id: 'r_v2_8', type: 'correct_the_mistake', question: 'Correct character abilities.', text: 'The duck says: I can hop.', mistake: 'hop', correction: 'swim' },
      { id: 'r_v2_9', type: 'sentence_unscramble', question: 'Unscramble dialogue sentence.', words: ['The', 'duck', 'replies', ',', 'I', 'can', 'swim', '.'] },
      { id: 'r_v2_10', type: 'choice_matrix', question: 'Are these dialogue details True or False?', rows: ['Frog can swim.##False', 'Duck can swim.##True', 'Frog can hop.##True', 'Duck can hop.##False'], columns: ['True', 'False'], answers: { 'Frog can swim.': 'False', 'Duck can swim.': 'True', 'Frog can hop.': 'True', 'Duck can hop.': 'False' } },
      { id: 'r_v2_11', type: 'category_sorting', question: 'Sort activities.', categories: ['Frog Ability', 'Duck Ability'], items: [{ text: 'hop high', category: 'Frog Ability' }, { text: 'swim', category: 'Duck Ability' }, { text: 'sit on log', category: 'Frog Ability' }, { text: 'fly', category: 'Duck Ability' }] },
      { id: 'v_v2_12', type: 'drag_and_drop', question: 'Complete pond summary.', sentences: ['The frog is #green#.', 'The duck can #swim#.', 'The frog can #hop#.'], distractors: ['blue', 'run', 'sing'] },
      { id: 'v_v2_13', type: 'order_sentences', question: 'Order dialogue.', sentences: ['First, the frog sits on the log.', 'Second, the frog greets the duck.', 'Third, the frog boasts about hopping.', 'Finally, the duck explains it can swim.'] },
      { id: 'v_v2_14', type: 'multiple_choice', question: 'What color is the frog?', options: ['brown', 'green', 'yellow', 'red'], answer: 'green' },
      { id: 'v_v2_15', type: 'fill_in_gap', question: 'Complete dialogue descriptors.', text: 'The log is [wet] and the frog is [green].' },
      { id: 'v_v2_16', type: 'matching_pairs', question: 'Match dialogue words.', pairs: { 'Hello': 'frog', 'swim': 'duck', 'wet': 'log', 'high': 'hop' } }
    ]
  },
  {
    category_id: unit1Cats.READING,
    title: 'The Mystery of Midnight: Classroom Stories',
    tier: 'CHALLENGER',
    badge_emoji: '🕵️‍♀️',
    questions: [
      { id: 'r_c2_1', type: 'multiple_choice', question: 'Read: "At midnight, the toys in the school cupboard wake up. The brown teddy bear sits on the teacher\'s desk. The red toy car races across the floor. The wooden blocks build a big castle. At 5:00 AM, they jump back into the cupboard."\n\nWhere do the toys sleep during the day?', options: ['on the desk', 'on the floor', 'in the school cupboard', 'in the castle'], answer: 'in the school cupboard' },
      { id: 'r_c2_2', type: 'multiple_choice', question: 'What does the toy car do at midnight?', options: ['sits on desk', 'races across floor', 'builds a castle', 'sings songs'], answer: 'races across floor' },
      { id: 'r_c2_3', type: 'matching_pairs', question: 'Match toys to activities.', pairs: { 'teddy bear': 'sits on desk', 'toy car': 'races across floor', 'wooden blocks': 'build castle', 'cupboard': 'where they sleep' } },
      { id: 'r_c2_4', type: 'matching_pairs', question: 'Match singular to plural.', pairs: { 'toy': 'toys', 'block': 'blocks', 'car': 'cars', 'bear': 'bears' } },
      { id: 'r_c2_5', type: 'fill_in_gap', question: 'Complete summary.', text: 'The teddy bear sits on the [desk] and the blocks build a [castle].' },
      { id: 'r_c2_6', type: 'fill_in_gap', question: 'Complete times.', text: 'They wake up at [midnight] and sleep at [5:00 AM].' },
      { id: 'r_c2_7', type: 'correct_the_mistake', question: 'Correct detail mistake.', text: 'The toy car is green.', mistake: 'green', correction: 'red' },
      { id: 'r_c2_8', type: 'correct_the_mistake', question: 'Correct object detail.', text: 'The bear sits on the floor.', mistake: 'floor', correction: 'desk' },
      { id: 'r_c2_9', type: 'sentence_unscramble', question: 'Unscramble story sentence.', words: ['The', 'wooden', 'blocks', 'build', 'a', 'big', 'castle', '.'] },
      { id: 'r_c2_10', type: 'choice_matrix', question: 'Are these toy activities True or False?', rows: ['Teddy bear races.##False', 'Toy car races.##True', 'Blocks build castle.##True', 'Teddy bear builds.##False'], columns: ['True', 'False'], answers: { 'Teddy bear races.': 'False', 'Toy car races.': 'True', 'Blocks build castle.': 'True', 'Teddy bear builds.': 'False' } },
      { id: 'r_c2_11', type: 'category_sorting', question: 'Sort toys by action.', categories: ['Active movement', 'Static sitting', 'Construction'], items: [{ text: 'toy car', category: 'Active movement' }, { text: 'teddy bear', category: 'Static sitting' }, { text: 'wooden blocks', category: 'Construction' }] },
      { id: 'r_c2_12', type: 'drag_and_drop', question: 'Complete story summary.', sentences: ['The car is #red#.', 'The blocks are #wooden#.', 'The bear is #brown#.'], distractors: ['blue', 'plastic', 'black'] },
      { id: 'r_c2_13', type: 'order_sentences', question: 'Order midnight events.', sentences: ['First, the toys wake up at midnight.', 'Second, the car races and the bear sits.', 'Third, the blocks construct a castle.', 'Finally, they return to the cupboard at 5:00 AM.'] },
      { id: 'r_c2_14', type: 'multiple_choice', question: 'What color is the teddy bear?', options: ['black', 'brown', 'white', 'pink'], answer: 'brown' },
      { id: 'r_c2_15', type: 'fill_in_gap', question: 'Complete adjectives.', text: 'The bear is [brown] and the blocks are [wooden].' },
      { id: 'r_c2_16', type: 'matching_pairs', question: 'Match toys.', pairs: { 'bear': 'teddy', 'blocks': 'wooden', 'car': 'toy', 'desk': 'teacher\'s' } }
    ]
  },

  // ==========================================
  // CATEGORY 4: WRITING (Learning Style: Kinetic / Spelling & Syntax Mechanics)
  // ==========================================
  {
    category_id: unit1Cats.WRITING,
    title: 'My First Profile: Sentence Builder',
    tier: 'EXPLORER',
    badge_emoji: '📝',
    questions: [
      { id: 'w_e2_1', type: 'sentence_unscramble', question: 'Unscramble greeting.', words: ['Hello', ',', 'I', 'am', 'Peter', '.'] },
      { id: 'w_e2_2', type: 'sentence_unscramble', question: 'Unscramble age.', words: ['I', 'am', 'eleven', 'years', 'old', '.'] },
      { id: 'w_e2_3', type: 'sentence_unscramble', question: 'Unscramble color statement.', words: ['My', 'bag', 'is', 'bright', 'yellow', '.'] },
      { id: 'w_e2_4', type: 'sentence_unscramble', question: 'Unscramble command.', words: ['Please', 'sit', 'on', 'the', 'chair', '.'] },
      { id: 'w_e2_5', type: 'fill_in_gap', question: 'Complete profile.', text: 'My name is [Peter]. I am [eleven] years old.' },
      { id: 'w_e2_6', type: 'fill_in_gap', question: 'Complete colors.', text: 'My pen is [blue] and my pencil is [green].' },
      { id: 'w_e2_7', type: 'correct_the_mistake', question: 'Correct helper verb.', text: 'They is my classmates.', mistake: 'is', correction: 'are' },
      { id: 'w_e2_8', type: 'correct_the_mistake', question: 'Correct spelling.', text: 'My nam is Peter.', mistake: 'nam', correction: 'name' },
      { id: 'w_e2_9', type: 'multiple_choice', question: 'Which sentence is capitalized correctly?', options: ['I live in Austria.', 'i live in austria.', 'I live in austria.', 'i Live in Austria.'], answer: 'I live in Austria.' },
      { id: 'w_e2_10', type: 'multiple_choice', question: 'Choose correct profile start.', options: ['Hello, my name is Peter.', 'Hello, me name is Peter.', 'Hello, I name is Peter.', 'Hello, name is Peter.'], answer: 'Hello, my name is Peter.' },
      { id: 'w_e2_11', type: 'choice_matrix', question: 'Verify correct sentences.', rows: ['I am 11.##correct', 'He name is Peter.##incorrect', 'We are students.##correct', 'She is write.##incorrect'], columns: ['correct', 'incorrect'], answers: { 'I am 11.': 'correct', 'He name is Peter.': 'incorrect', 'We are students.': 'correct', 'She is write.': 'incorrect' } },
      { id: 'w_e2_12', type: 'matching_pairs', question: 'Match prompts to goals.', pairs: { 'How do you spell Anna?': 'A-N-N-A', 'What color is the bag?': 'yellow', 'How many pens?': 'three', 'Who is he?': 'teacher' } },
      { id: 'w_e2_13', type: 'order_sentences', question: 'Order profile steps.', sentences: ['First, write your greeting.', 'Second, write your name.', 'Third, write your age.', 'Finally, add your favorite subject.'] },
      { id: 'w_e2_14', type: 'multiple_choice', question: 'How do you write "15"?', options: ['fifteen', 'fiveteen', 'fifty', 'fiftean'], answer: 'fifteen' },
      { id: 'w_e2_15', type: 'fill_in_gap', question: 'Complete profile blanks.', text: 'My school is [big]. My teacher is [nice].' },
      { id: 'w_e2_16', type: 'matching_pairs', question: 'Match pronouns.', pairs: { 'boy': 'he', 'girl': 'she', 'object': 'it', 'plural': 'they' } }
    ]
  },
  {
    category_id: unit1Cats.WRITING,
    title: 'Spelling Inspector: Capital Letters & Punctuation',
    tier: 'VOYAGER',
    badge_emoji: '🧐',
    questions: [
      { id: 'w_v2_1', type: 'correct_the_mistake', question: 'Correct capitalization.', text: 'We have English on monday.', mistake: 'monday', correction: 'Monday' },
      { id: 'w_v2_2', type: 'correct_the_mistake', question: 'Correct plural spelling.', text: 'I see three watchs on the wall.', mistake: 'watchs', correction: 'watches' },
      { id: 'w_v2_3', type: 'correct_the_mistake', question: 'Correct imperative.', text: 'Please opening your book.', mistake: 'opening', correction: 'open' },
      { id: 'w_v2_4', type: 'sentence_unscramble', question: 'Unscramble capitalization.', words: ['We', 'speak', 'English', 'in', 'class', '.'] },
      { id: 'w_v2_5', type: 'sentence_unscramble', question: 'Unscramble punctuation.', words: ['Where', 'is', 'my', 'blue', 'ruler', '?'] },
      { id: 'w_v2_6', type: 'fill_in_gap', question: 'Complete capital letters.', text: 'My teacher is Mr. [Green]. He teaches [English].' },
      { id: 'w_v2_7', type: 'fill_in_gap', question: 'Complete spelling.', text: 'We have school on [Monday] and [Tuesday].' },
      { id: 'w_v2_8', type: 'multiple_choice', question: 'Which word needs a capital letter?', options: ['english', 'pencil', 'rubber', 'board'], answer: 'english' },
      { id: 'w_v2_9', type: 'multiple_choice', question: 'Which day is capitalized correctly?', options: ['Tuesday', 'tuesday', 'Tues-day', 'tuesDay'], answer: 'Tuesday' },
      { id: 'w_v2_10', type: 'choice_matrix', question: 'Are these capitalized correctly?', rows: ['monday##incorrect', 'Austria##correct', 'pencil##correct', 'english##incorrect'], columns: ['correct', 'incorrect'], answers: { 'monday': 'incorrect', 'Austria': 'correct', 'pencil': 'correct', 'english': 'incorrect' } },
      { id: 'w_v2_11', type: 'category_sorting', question: 'Sort words.', categories: ['Capital letter', 'Lowercase'], items: [{ text: 'vienna', category: 'Capital letter' }, { text: 'tuesday', category: 'Capital letter' }, { text: 'clock', category: 'Lowercase' }, { text: 'ben', category: 'Capital letter' }, { text: 'chair', category: 'Lowercase' }] },
      { id: 'w_v2_12', type: 'drag_and_drop', question: 'Complete capital checks.', sentences: ['He lives in #Austria#.', 'We study #English#.', 'Today is #Monday#.'], distractors: ['austria', 'english', 'monday'] },
      { id: 'w_v2_13', type: 'order_sentences', question: 'Order rules.', sentences: ['First, check for the start of the sentence.', 'Second, check for names of people.', 'Third, check for days of the week.', 'Finally, check for languages and countries.'] },
      { id: 'w_v2_14', type: 'multiple_choice', question: 'Choose correct spelling.', options: ['children', 'childs', 'childrens', 'childes'], answer: 'children' },
      { id: 'w_v2_15', type: 'fill_in_gap', question: 'Complete plurals.', text: 'We have two [classes] today.' },
      { id: 'w_v2_16', type: 'matching_pairs', question: 'Match capitals.', pairs: { 'english': 'English', 'monday': 'Monday', 'austria': 'Austria', 'anna': 'Anna' } }
    ]
  },
  {
    category_id: unit1Cats.WRITING,
    title: 'Curriculum Writer: Story Weaver',
    tier: 'CHALLENGER',
    badge_emoji: '🧶',
    questions: [
      { id: 'w_c2_1', type: 'correct_the_mistake', question: 'Correct spelling.', text: 'I love my new classrom.', mistake: 'classrom', correction: 'classroom' },
      { id: 'w_c2_2', type: 'correct_the_mistake', question: 'Correct imperative.', text: 'Listen to the teachers instructions.', mistake: 'teachers', correction: 'teacher\'s' },
      { id: 'w_c2_3', type: 'correct_the_mistake', question: 'Correct helper.', text: 'There is twelve desks.', mistake: 'is', correction: 'are' },
      { id: 'w_c2_4', type: 'sentence_unscramble', question: 'Unscramble description.', words: ['The', 'waste', 'bin', 'is', 'near', 'the', 'door', '.'] },
      { id: 'w_c2_5', type: 'sentence_unscramble', question: 'Unscramble instruction.', words: ['Do', 'not', 'write', 'on', 'your', 'desk', '.'] },
      { id: 'w_c2_6', type: 'fill_in_gap', question: 'Complete paragraph.', text: 'In my room, there are ten [chairs] and one big [board].' },
      { id: 'w_c2_7', type: 'fill_in_gap', question: 'Complete counts.', text: 'I see three [mice] behind the school [cupboard].' },
      { id: 'w_c2_8', type: 'choice_matrix', question: 'Are these correct sentences?', rows: ['There are books.##correct', 'There is books.##incorrect', 'Listen to me.##correct', 'Don\'t shouting.##incorrect'], columns: ['correct', 'incorrect'], answers: { 'There are books.': 'correct', 'There is books.': 'incorrect', 'Listen to me.': 'correct', 'Don\'t shouting.': 'incorrect' } },
      { id: 'w_c2_9', type: 'category_sorting', question: 'Sort words.', categories: ['Noun', 'Verb'], items: [{ text: 'desk', category: 'Noun' }, { text: 'listen', category: 'Verb' }, { text: 'board', category: 'Noun' }, { text: 'write', category: 'Verb' }, { text: 'chair', category: 'Noun' }] },
      { id: 'w_c2_10', type: 'multiple_choice', question: 'Which sentence is grammatically correct?', options: ['There are twelve children in the library.', 'There is twelve children in the library.', 'There are twelve childs in the library.', 'There are twelve children in library.'], answer: 'There are twelve children in the library.' },
      { id: 'w_c2_11', type: 'order_sentences', question: 'Order descriptions.', sentences: ['This is my classroom.', 'It has four green walls.', 'There are twenty desks in rows.', 'A clock is hanging above the board.'] },
      { id: 'w_c2_12', type: 'drag_and_drop', question: 'Complete paragraph.', sentences: ['We study #English#.', 'We read #books#.', 'We sit on #chairs#.'], distractors: ['Monday', 'pencil', 'floor'] },
      { id: 'w_c2_13', type: 'matching_pairs', question: 'Match rules.', pairs: { 'first word': 'Capital letter', 'instructions': 'Imperative verb', 'more than one': 'Plural noun', 'singular there': 'There is' } },
      { id: 'w_c2_14', type: 'multiple_choice', question: 'Choose correct instruction.', options: ['Write your name on the sheet.', 'Writes your name on the sheet.', 'Writing your name on the sheet.', 'Write name on sheet.'], answer: 'Write your name on the sheet.' },
      { id: 'w_c2_15', type: 'fill_in_gap', question: 'Complete blanks.', text: 'Look at the [clock] and stop [talking].' },
      { id: 'w_c2_16', type: 'matching_pairs', question: 'Match nouns.', pairs: { 'child': 'children', 'tooth': 'teeth', 'foot': 'feet', 'man': 'men' } }
    ]
  },

  // ==========================================
  // CATEGORY 5: LISTENING (Learning Style: Auditory & Speech-Synthesis Boundaries)
  // ==========================================
  {
    category_id: unit1Cats.LISTENING,
    title: 'Sound Checker: Letter & Color Drills',
    tier: 'EXPLORER',
    badge_emoji: '🔊',
    audio_url: 'tts://Listen to the colors and spellings carefully. Spell each word out.',
    questions: [
      { id: 'l_e2_1', type: 'multiple_choice', question: 'Listen: "My pen is red. R-E-D."\n\nHow do you spell the color?', options: ['RAD', 'RED', 'RID', 'RUD'], answer: 'RED' },
      { id: 'l_e2_2', type: 'multiple_choice', question: 'Listen: "The number is ten. T-E-N."\n\nWhat was spelled?', options: ['TAN', 'TEN', 'TIN', 'NET'], answer: 'TEN' },
      { id: 'l_e2_3', type: 'matching_pairs', question: 'Match spelling sounds.', pairs: { 'B-L-U-E': 'Blue', 'P-E-N-C-I-L': 'Pencil', 'F-I-V-E': 'Five', 'A-N-N-A': 'Anna' } },
      { id: 'l_e2_4', type: 'matching_pairs', question: 'Match number spellings.', pairs: { 'S-I-X': 'Six', 'T-E-N': 'Ten', 'N-I-N-E': 'Nine', 'O-N-E': 'One' } },
      { id: 'l_e2_5', type: 'fill_in_gap', question: 'Listen and fill missing letter: "B-A-G".', text: 'B-[A]-G' },
      { id: 'l_e2_6', type: 'fill_in_gap', question: 'Listen: "R-U-B-B-E-R". Fill gaps.', text: 'R-U-[B]-B-[E]-R' },
      { id: 'l_e2_7', type: 'correct_the_mistake', question: 'Listen: "The bag is pink. P-I-N-K."\n\nCorrect the mistake.', text: 'The bag is pinck.', mistake: 'pinck', correction: 'pink' },
      { id: 'l_e2_8', type: 'correct_the_mistake', question: 'Listen: "My desk is brown."\n\nCorrect the mistake.', text: 'My desk is black.', mistake: 'black', correction: 'brown' },
      { id: 'l_e2_9', type: 'sentence_unscramble', question: 'Listen: "Red is my favorite color."\n\nUnscramble.', words: ['Red', 'is', 'my', 'favorite', 'color', '.'] },
      { id: 'l_e2_10', type: 'choice_matrix', question: 'Is spelling correct?', rows: ['B-L-U-E##correct', 'G-R-E-A-N##incorrect', 'R-E-D##correct', 'Y-E-L-O-W##incorrect'], columns: ['correct', 'incorrect'], answers: { 'B-L-U-E': 'correct', 'G-R-E-A-N': 'incorrect', 'R-E-D': 'correct', 'Y-E-L-O-W': 'incorrect' } },
      { id: 'l_e2_11', type: 'category_sorting', question: 'Sort spelled words.', categories: ['Color Spelling', 'Object Spelling'], items: [{ text: 'R-E-D', category: 'Color Spelling' }, { text: 'P-E-N', category: 'Object Spelling' }, { text: 'B-L-U-E', category: 'Color Spelling' }, { text: 'B-A-G', category: 'Object Spelling' }] },
      { id: 'l_e2_12', type: 'drag_and_drop', question: 'Listen and drag spelled words.', sentences: ['The color is #R-E-D#.', 'Pack your #B-A-G#.', 'The sky is #B-L-U-E#.'], distractors: ['T-E-N', 'P-E-N', 'G-R-E-E-N'] },
      { id: 'l_e2_13', type: 'order_sentences', question: 'Order spelling steps.', sentences: ['First, hear the full word.', 'Second, listen to each letter sound.', 'Third, write down the letters.', 'Finally, read the spelled word.'] },
      { id: 'l_e2_14', type: 'multiple_choice', question: 'What was spelled: "P-E-N-C-I-L"?', options: ['pen', 'pencil', 'paper', 'pencilcase'], answer: 'pencil' },
      { id: 'l_e2_15', type: 'fill_in_gap', question: 'Complete spelling.', text: 'The number is [eight] and the color is [green].' },
      { id: 'l_e2_16', type: 'matching_pairs', question: 'Match sounds.', pairs: { 'r-e-d': 'red', 'b-l-u-e': 'blue', 'p-e-n': 'pen', 't-e-n': 'ten' } }
    ]
  },
  {
    category_id: unit1Cats.LISTENING,
    title: 'Simon Says: Classroom Action Listening',
    tier: 'VOYAGER',
    badge_emoji: '🗣️',
    audio_url: 'tts://Play Simon Says. Follow only the instructions that start with Simon says.',
    questions: [
      { id: 'l_v2_1', type: 'multiple_choice', question: 'Listen: "Simon says: Open your pencil case."\n\nWhat should you do?', options: ['open your book', 'open your pencil case', 'close your pencil case', 'do nothing'], answer: 'open your pencil case' },
      { id: 'l_v2_2', type: 'multiple_choice', question: 'Listen: "Stand up! (No Simon says)"\n\nWhat should you do?', options: ['stand up', 'sit down', 'do nothing', 'be quiet'], answer: 'do nothing' },
      { id: 'l_v2_3', type: 'matching_pairs', question: 'Match Simon Says rules.', pairs: { 'Simon says: Sit down': 'Sit down', 'Simon says: Stand up': 'Stand up', 'Close your book': 'Do nothing', 'Simon says: Be quiet': 'Be quiet' } },
      { id: 'l_v2_4', type: 'matching_pairs', question: 'Match commands.', pairs: { 'Simon says: Open': 'your book', 'Simon says: Clean': 'the board', 'Simon says: Listen': 'to me', 'Write your name': 'do nothing' } },
      { id: 'l_v2_5', type: 'fill_in_gap', question: 'Listen and complete: "Simon says: [Open] your book."', text: 'Simon says: [Open] your book.' },
      { id: 'l_v2_6', type: 'fill_in_gap', question: 'Listen: "Simon says: Sit down."\n\nFill gap.', text: 'Simon says: [Sit] [down].' },
      { id: 'l_v2_7', type: 'correct_the_mistake', question: 'Listen: "Simon says: Don\'t run."\n\nCorrect the mistake.', text: 'Simon says: Run.', mistake: 'Run', correction: 'Don\'t run' },
      { id: 'l_v2_8', type: 'correct_the_mistake', question: 'Listen: "Simon says: Look at the board."\n\nCorrect the mistake.', text: 'Simon says: Look at the window.', mistake: 'window', correction: 'board' },
      { id: 'l_v2_9', type: 'sentence_unscramble', question: 'Listen: "Simon says: Be quiet please."\n\nUnscramble.', words: ['Simon', 'says', ':', 'Be', 'quiet', 'please', '.'] },
      { id: 'l_v2_10', type: 'choice_matrix', question: 'Should you perform the action?', rows: ['Simon says: Stand up!##yes', 'Close the door!##no', 'Simon says: Close the door!##yes', 'Stand up!##no'], columns: ['yes', 'no'], answers: { 'Simon says: Stand up!': 'yes', 'Close the door!': 'no', 'Simon says: Close the door!': 'yes', 'Stand up!': 'no' } },
      { id: 'l_v2_11', type: 'category_sorting', question: 'Sort spoken actions.', categories: ['Action Required', 'No Action (No Simon Says)'], items: [{ text: 'Simon says: Look', category: 'Action Required' }, { text: 'Look', category: 'No Action (No Simon Says)' }, { text: 'Simon says: Write', category: 'Action Required' }, { text: 'Write', category: 'No Action (No Simon Says)' }] },
      { id: 'l_v2_12', type: 'drag_and_drop', question: 'Listen and complete game commands.', sentences: ['Simon says: #Sit# down.', 'Simon says: #Don\'t# talk.', 'Stand up (action: #nothing#).'], distractors: ['Standing', 'Do', 'Stand'] },
      { id: 'l_v2_13', type: 'order_sentences', question: 'Order game steps.', sentences: ['First, listen to the trigger words.', 'Second, check for \"Simon says\".', 'Third, perform action if trigger is present.', 'Finally, stay still if trigger is missing.'] },
      { id: 'l_v2_14', type: 'multiple_choice', question: 'Listen: "Simon says: Spell pen."\n\nWhat did Simon say to spell?', options: ['pen', 'pencil', 'pin', 'paper'], answer: 'pen' },
      { id: 'l_v2_15', type: 'fill_in_gap', question: 'Complete commands.', text: 'Simon says: [Listen] to the song and [don\'t] talk.' },
      { id: 'l_v2_16', type: 'matching_pairs', question: 'Match commands.', pairs: { 'Stand': 'up', 'Sit': 'down', 'Simon': 'says', 'Be': 'quiet' } }
    ]
  },
  {
    category_id: unit1Cats.LISTENING,
    title: 'Uniform Talk: The Colorful Wardrobe',
    tier: 'CHALLENGER',
    badge_emoji: '👔',
    audio_url: 'tts://Hello, I am Peter. Today I am wearing my school uniform. It is grey trousers, a blue shirt, and a black jumper. I also wear brown shoes. I like my uniform because it is clean.',
    questions: [
      { id: 'l_c2_1', type: 'multiple_choice', question: 'Listen to Peter: What color are his trousers?', options: ['blue', 'black', 'grey', 'brown'], answer: 'grey' },
      { id: 'l_c2_2', type: 'multiple_choice', question: 'What color is Peter\'s shirt?', options: ['white', 'blue', 'grey', 'black'], answer: 'blue' },
      { id: 'l_c2_3', type: 'matching_pairs', question: 'Match Peter\'s clothing items to their colors.', pairs: { 'trousers': 'grey', 'shirt': 'blue', 'jumper': 'black', 'shoes': 'brown' } },
      { id: 'l_c2_4', type: 'matching_pairs', question: 'Match uniforms.', pairs: { 'Peter': 'grey trousers, blue shirt', 'Luna (previous)': 'blue skirt, white shirt', 'jumper': 'black', 'shoes': 'brown' } },
      { id: 'l_c2_5', type: 'fill_in_gap', question: 'Listen and complete what Peter is wearing.', text: 'Peter is wearing grey [trousers] and a blue [shirt].' },
      { id: 'l_c2_6', type: 'fill_in_gap', question: 'Listen and complete.', text: 'Peter also wears brown [shoes] and a black [jumper].' },
      { id: 'l_c2_7', type: 'correct_the_mistake', question: 'Listen and correct.', text: 'Peter is wearing black trousers.', mistake: 'black', correction: 'grey' },
      { id: 'l_c2_8', type: 'correct_the_mistake', question: 'Listen and correct.', text: 'Peter thinks his uniform is dirty.', mistake: 'dirty', correction: 'clean' },
      { id: 'l_c2_9', type: 'sentence_unscramble', question: 'Listen: "I also wear brown shoes."\n\nUnscramble.', words: ['I', 'also', 'wear', 'brown', 'shoes', '.'] },
      { id: 'l_c2_10', type: 'choice_matrix', question: 'Are these statements about Peter\'s uniform True or False?', rows: ['Trousers are grey.##True', 'Shirt is white.##False', 'Jumper is black.##True', 'Shoes are black.##False'], columns: ['True', 'False'], answers: { 'Trousers are grey.': 'True', 'Shirt is white.': 'False', 'Jumper is black.': 'True', 'Shoes are black.': 'False' } },
      { id: 'l_c2_11', type: 'category_sorting', question: 'Sort colors.', categories: ['Peter\'s Uniform Colors', 'Luna\'s Uniform Colors'], items: [{ text: 'grey', category: 'Peter\'s Uniform Colors' }, { text: 'white', category: 'Luna\'s Uniform Colors' }, { text: 'brown', category: 'Peter\'s Uniform Colors' }, { text: 'red', category: 'Luna\'s Uniform Colors' }] },
      { id: 'l_c2_12', type: 'drag_and_drop', question: 'Complete clothing details.', sentences: ['Peter is wearing a blue #shirt#.', 'He is wearing a black #jumper#.', 'He thinks it is #clean#.'], distractors: ['trousers', 'skirt', 'dirty'] },
      { id: 'l_c2_13', type: 'order_sentences', question: 'Order uniform dress sequence.', sentences: ['First, put on the blue shirt.', 'Second, put on the grey trousers.', 'Third, slide on the black jumper.', 'Finally, tie the laces of the brown shoes.'] },
      { id: 'l_c2_14', type: 'multiple_choice', question: 'Why does Peter like his uniform?', options: ['because it is colorful', 'because it is clean', 'because it is warm', 'because it is cheap'], answer: 'because it is clean' },
      { id: 'l_c2_15', type: 'fill_in_gap', question: 'Complete clothes nouns.', text: 'We wear [shoes] on our feet and a [jumper] on our body.' },
      { id: 'l_c2_16', type: 'matching_pairs', question: 'Match clothes.', pairs: { 'grey': 'trousers', 'blue': 'shirt', 'black': 'jumper', 'brown': 'shoes' } }
    ]
  }
];

try {
  console.log('Starting Seeding of Block 2 (Alternative Learning Styles) Worksheets for Unit 1...');
  
  db.transaction(() => {
    for (const ws of block2Worksheets) {
      // 1. Delete if duplicate title exists in this category
      db.prepare('DELETE FROM worksheets WHERE category_id = ? AND title = ?').run(ws.category_id, ws.title);
      
      // 2. Insert new worksheet
      const wsId = crypto.randomUUID();
      const insert = db.prepare(`
        INSERT INTO worksheets (id, category_id, title, tier, questions_json, badge_emoji, audio_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      insert.run(
        wsId,
        ws.category_id,
        ws.title,
        ws.tier,
        JSON.stringify(ws.questions),
        ws.badge_emoji,
        ws.audio_url || null
      );
      
      console.log(`Seeded Block 2 [${ws.tier}] "${ws.title}" in ${ws.category_id} with ${ws.questions.length} items.`);
    }
  })();
  
  console.log('Block 2 Seeding completed successfully!');
} catch (error) {
  console.error('Block 2 Seeding failed:', error);
}
