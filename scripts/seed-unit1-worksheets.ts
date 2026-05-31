import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.resolve(process.cwd(), 'dev.db');
const db = new Database(DB_PATH);

// Categories Mapping for Unit 1: "Time for school"
// ID definitions derived directly from database queries:
const unit1Cats = {
  GRAMMAR: '4e01cdc5-9e47-4526-b255-9e504b1fbaf8',
  VOCABULARY: 'a3911bed-0be1-4b15-9ad9-7cb8dda954e9',
  READING: '28453603-50ff-456b-8995-eb6600ea9027',
  WRITING: '29f88a81-763e-4c14-b948-025a12b0c866',
  LISTENING: '361ec065-ef69-4b51-a408-a66b9d4d5313'
};

const worksheetsData = [
  // ==========================================
  // CATEGORY 1: GRAMMAR
  // ==========================================
  {
    category_id: unit1Cats.GRAMMAR,
    title: 'Alphabet & Numbers',
    tier: 'EXPLORER',
    badge_emoji: '🔤',
    questions: [
      { id: 'g_e1', type: 'matching_pairs', question: 'Match the uppercase letters to their lowercase partners.', pairs: { 'A': 'a', 'B': 'b', 'C': 'c', 'D': 'd', 'E': 'e' } },
      { id: 'g_e2', type: 'matching_pairs', question: 'Match the letters in alphabetical order.', pairs: { 'K': 'l', 'M': 'n', 'P': 'q', 'S': 't', 'Y': 'z' } },
      { id: 'g_e3', type: 'multiple_choice', question: 'What letter comes after F?', options: ['E', 'G', 'H', 'I'], answer: 'G' },
      { id: 'g_e4', type: 'multiple_choice', question: 'Which letter is missing here: T, U, __, W, X?', options: ['V', 'S', 'R', 'Y'], answer: 'V' },
      { id: 'g_e5', type: 'fill_in_gap', question: 'Complete the regular plural forms.', text: 'One cat, two [cats]. One book, three [books]. One bag, four [bags].' },
      { id: 'g_e6', type: 'fill_in_gap', question: 'Complete the plural forms that end in -es.', text: 'One box, two [boxes]. One watch, three [watches]. One glass, four [glasses].' },
      { id: 'g_e7', type: 'multiple_choice', question: 'Choose the correct word for the number 5.', options: ['five', 'fiv', 'fifteen', 'fifty'], answer: 'five' },
      { id: 'g_e8', type: 'multiple_choice', question: 'Choose the correct word for the number 11.', options: ['eleven', 'elevean', 'elven', 'twelve'], answer: 'eleven' },
      { id: 'g_e9', type: 'correct_the_mistake', question: 'Click the wrong plural spelling and type the correct spelling.', text: 'I have ten pencil in my bag.', mistake: 'pencil', correction: 'pencils' },
      { id: 'g_e10', type: 'correct_the_mistake', question: 'Click the wrong singular spelling and type the correct form.', text: 'There is only one books on my desk.', mistake: 'books', correction: 'book' },
      { id: 'g_e11', type: 'sentence_unscramble', question: 'Unscramble the numbers sentence.', words: ['One', 'plus', 'two', 'is', 'three', '.'] },
      { id: 'g_e12', type: 'choice_matrix', question: 'Triage the nouns into Singular or Plural forms.', rows: ['cat##Singular', 'dogs##Plural', 'watches##Plural', 'ruler##Singular'], columns: ['Singular', 'Plural'], answers: { 'cat': 'Singular', 'dogs': 'Plural', 'watches': 'Plural', 'ruler': 'Singular' } }
    ]
  },
  {
    category_id: unit1Cats.GRAMMAR,
    title: 'Grammar Climber',
    tier: 'CHALLENGER',
    badge_emoji: '⛰️',
    questions: [
      { id: 'g_c1', type: 'matching_pairs', question: 'Match each singular noun to its correct irregular plural form.', pairs: { 'child': 'children', 'mouse': 'mice', 'man': 'men', 'foot': 'feet', 'tooth': 'teeth' } },
      { id: 'g_c2', type: 'fill_in_gap', question: 'Write the correct irregular plural forms.', text: 'One woman, two [women]. One person, three [people]. One fish, four [fish].' },
      { id: 'g_c3', type: 'correct_the_mistake', question: 'Grammar checking: Correct the helper verb agreement.', text: 'There is five books on the teachers desk.', mistake: 'is', correction: 'are' },
      { id: 'g_c4', type: 'correct_the_mistake', question: 'Imperatives: Fix the double verb instruction.', text: 'Please to sit down on your chair.', mistake: 'to', correction: '' },
      { id: 'g_c5', type: 'sentence_unscramble', question: 'Word Order: Unscramble the classroom statement.', words: ['There', 'are', 'twelve', 'desks', 'in', 'the', 'classroom', '.'] },
      { id: 'g_c6', type: 'choice_matrix', question: 'Decide if these irregular plurals are correct or incorrect.', rows: ['children##correct', 'mices##incorrect', 'peoples##incorrect', 'women##correct'], columns: ['correct', 'incorrect'], answers: { 'children': 'correct', 'mices': 'incorrect', 'peoples': 'incorrect', 'women': 'correct' } },
      { id: 'g_c7', type: 'drag_and_drop', question: 'Drag the correct words to complete the sentences.', sentences: ['There #are# twenty children here.', 'There #is# one teacher at the board.', 'Do #not# run in the corridors.'], distractors: ['am', 'be', 'run'] },
      { id: 'g_c8', type: 'category_sorting', question: 'Sort these nouns into Regular vs Irregular Plurals.', categories: ['Regular Plural', 'Irregular Plural'], items: [{ text: 'cats', category: 'Regular Plural' }, { text: 'mice', category: 'Irregular Plural' }, { text: 'books', category: 'Regular Plural' }, { text: 'men', category: 'Irregular Plural' }, { text: 'windows', category: 'Regular Plural' }, { text: 'children', category: 'Irregular Plural' }] },
      { id: 'g_c9', type: 'order_sentences', question: 'Put the instructions in a logical lesson sequence.', sentences: ['First, sit down at your desks.', 'Second, open your books to page 5.', 'Third, listen to the English teacher.', 'Finally, close your books when the bell rings.'] },
      { id: 'g_c10', type: 'multiple_choice', question: 'Choose the correct sentence form.', options: ['There are fifteen students.', 'There is fifteen students.', 'There are fifteen student.', 'There is fifteen student.'], answer: 'There are fifteen students.' },
      { id: 'g_c11', type: 'fill_in_gap', question: 'Complete the negative imperatives.', text: 'Don\'t [talk] in class. Don\'t [run] in the hallway. Please [be] quiet.' },
      { id: 'g_c12', type: 'matching_pairs', question: 'Match the opposite instructions.', pairs: { 'Sit down': 'Stand up', 'Open': 'Close', 'Speak': 'Be quiet', 'Go': 'Stop' } }
    ]
  },

  // ==========================================
  // CATEGORY 2: VOCABULARY
  // ==========================================
  {
    category_id: unit1Cats.VOCABULARY,
    title: 'Colourful World',
    tier: 'EXPLORER',
    badge_emoji: '🎨',
    questions: [
      { id: 'v_e1', type: 'multiple_choice', question: 'What color is a ripe tomato?', options: ['green', 'blue', 'red', 'black'], answer: 'red' },
      { id: 'v_e2', type: 'multiple_choice', question: 'What color is the green grass?', options: ['yellow', 'green', 'white', 'purple'], answer: 'green' },
      { id: 'v_e3', type: 'matching_pairs', question: 'Match the colors to their emojis.', pairs: { 'red': '🔴', 'blue': '🔵', 'green': '🟢', 'yellow': '🟡', 'black': '⚫' } },
      { id: 'v_e4', type: 'matching_pairs', question: 'Match the objects to their typical color.', pairs: { 'snow': 'white', 'sun': 'yellow', 'chocolate': 'brown', 'sky': 'blue' } },
      { id: 'v_e5', type: 'fill_in_gap', question: 'Complete the color descriptions.', text: 'The sun is [yellow] and the sky is [blue].' },
      { id: 'v_e6', type: 'fill_in_gap', question: 'Spelling colors: Fill in the missing vowels.', text: 'Black is spelled b[la]ck, pink is spelled p[in]k, and white is w[hi]te.' },
      { id: 'v_e7', type: 'correct_the_mistake', question: 'Correct the color description singular noun issue.', text: 'I see a green apples.', mistake: 'apples', correction: 'apple' },
      { id: 'v_e8', type: 'correct_the_mistake', question: 'Find the spelling error for the color.', text: 'My favorite color is yelow.', mistake: 'yelow', correction: 'yellow' },
      { id: 'v_e9', type: 'sentence_unscramble', question: 'Unscramble the color statement.', words: ['My', 'favourite', 'colour', 'is', 'red', '.'] },
      { id: 'v_e10', type: 'choice_matrix', question: 'Check if these color spellings are correct or incorrect.', rows: ['blue##correct', 'green##correct', 'purpel##incorrect', 'orang##incorrect'], columns: ['correct', 'incorrect'], answers: { 'blue': 'correct', 'green': 'correct', 'purpel': 'incorrect', 'orang': 'incorrect' } },
      { id: 'v_e11', type: 'category_sorting', question: 'Sort the colors into Warm or Cool categories.', categories: ['Warm Colors', 'Cool Colors'], items: [{ text: 'red', category: 'Warm Colors' }, { text: 'blue', category: 'Cool Colors' }, { text: 'orange', category: 'Warm Colors' }, { text: 'green', category: 'Cool Colors' }, { text: 'yellow', category: 'Warm Colors' }] },
      { id: 'v_e12', type: 'drag_and_drop', question: 'Complete the color sentences.', sentences: ['The flag is red, white, and #blue#.', 'Lemons are bright #yellow#.', 'Crows are dark #black#.'], distractors: ['green', 'pink', 'white'] }
    ]
  },
  {
    category_id: unit1Cats.VOCABULARY,
    title: 'My School Bag',
    tier: 'VOYAGER',
    badge_emoji: '🎒',
    questions: [
      { id: 'v_v1', type: 'multiple_choice', question: 'What item do you use to measure straight lines?', options: ['rubber', 'pen', 'ruler', 'sharpener'], answer: 'ruler' },
      { id: 'v_v2', type: 'multiple_choice', question: 'What item do you use to erase pencil mistakes?', options: ['rubber', 'book', 'folder', 'glue'], answer: 'rubber' },
      { id: 'v_v3', type: 'matching_pairs', question: 'Match the school things to their words.', pairs: { 'pen': '🖊️', 'book': '📖', 'pencil': '✏️', 'bag': '🎒' } },
      { id: 'v_v4', type: 'matching_pairs', question: 'Match the school item to its function.', pairs: { 'ruler': 'measuring', 'sharpener': 'sharpening', 'glue': 'sticking', 'pen': 'writing' } },
      { id: 'v_v5', type: 'fill_in_gap', question: 'Complete the schoolbag items list.', text: 'In my schoolbag I have a [ruler] and a [sharpener].' },
      { id: 'v_v6', type: 'fill_in_gap', question: 'Spelling check for bag items.', text: 'We keep our pens in a pencil [case]. We stick paper with [glue].' },
      { id: 'v_v7', type: 'correct_the_mistake', question: 'Correct the logical item swap.', text: 'I write my essay with a rubber.', mistake: 'rubber', correction: 'pen' },
      { id: 'v_v8', type: 'correct_the_mistake', question: 'Correct the spelling of the school bag.', text: 'I have a new shoolbag.', mistake: 'shoolbag', correction: 'schoolbag' },
      { id: 'v_v9', type: 'sentence_unscramble', question: 'Unscramble the question.', words: ['Do', 'you', 'have', 'a', 'pencil', 'case', '?'] },
      { id: 'v_v10', type: 'choice_matrix', question: 'Decide if these items belong in a school bag.', rows: ['ruler##yes', 'board##no', 'desk##no', 'rubber##yes'], columns: ['yes', 'no'], answers: { 'ruler': 'yes', 'board': 'no', 'desk': 'no', 'rubber': 'yes' } },
      { id: 'v_v11', type: 'category_sorting', question: 'Sort these items into Writing tools vs non-writing tools.', categories: ['Writing Tool', 'Other Tool'], items: [{ text: 'pencil', category: 'Writing Tool' }, { text: 'rubber', category: 'Other Tool' }, { text: 'pen', category: 'Writing Tool' }, { text: 'sharpener', category: 'Other Tool' }, { text: 'ruler', category: 'Other Tool' }] },
      { id: 'v_v12', type: 'drag_and_drop', question: 'Fill in the correct bag items.', sentences: ['Put your books in your #schoolbag#.', 'Sharpen your pencil with a #sharpener#.', 'Draw a line with your #ruler#.'], distractors: ['pen', 'desk', 'board'] }
    ]
  },
  {
    category_id: unit1Cats.VOCABULARY,
    title: 'In the Classroom',
    tier: 'CHALLENGER',
    badge_emoji: '🏫',
    questions: [
      { id: 'v_c1', type: 'multiple_choice', question: 'What does the teacher write on at the front of the room?', options: ['desk', 'board', 'window', 'floor'], answer: 'board' },
      { id: 'v_c2', type: 'multiple_choice', question: 'What object tells the time in the classroom?', options: ['clock', 'poster', 'door', 'bin'], answer: 'clock' },
      { id: 'v_c3', type: 'matching_pairs', question: 'Match classroom items to their emojis.', pairs: { 'door': '🚪', 'window': '🪟', 'waste bin': '🗑️', 'desk': '🪑' } },
      { id: 'v_c4', type: 'matching_pairs', question: 'Match classroom objects to their actions.', pairs: { 'door': 'open/close', 'bin': 'throw trash', 'clock': 'tell time', 'board': 'read text' } },
      { id: 'v_c5', type: 'fill_in_gap', question: 'Complete the classroom descriptions.', text: 'Look at the [board] and sit at your [desk].' },
      { id: 'v_c6', type: 'fill_in_gap', question: 'Complete spelling of classroom parts.', text: 'We walk on the [floor]. The classroom has four [walls] and two [windows].' },
      { id: 'v_c7', type: 'correct_the_mistake', question: 'Find the misplaced object.', text: 'The clock is hanging on the floor.', mistake: 'floor', correction: 'wall' },
      { id: 'v_c8', type: 'correct_the_mistake', question: 'Find the spelling error for the board.', text: 'The teacher cleans the bord.', mistake: 'bord', correction: 'board' },
      { id: 'v_c9', type: 'sentence_unscramble', question: 'Unscramble the classroom object statement.', words: ['There', 'is', 'a', 'poster', 'on', 'the', 'wall', '.'] },
      { id: 'v_c10', type: 'choice_matrix', question: 'Are these items typically mounted on a wall?', rows: ['poster##yes', 'desk##no', 'clock##yes', 'door##yes'], columns: ['yes', 'no'], answers: { 'poster': 'yes', 'desk': 'no', 'clock': 'yes', 'door': 'yes' } },
      { id: 'v_c11', type: 'category_sorting', question: 'Sort these objects.', categories: ['Furniture', 'Structural'], items: [{ text: 'desk', category: 'Furniture' }, { text: 'door', category: 'Structural' }, { text: 'chair', category: 'Furniture' }, { text: 'window', category: 'Structural' }, { text: 'wall', category: 'Structural' }] },
      { id: 'v_c12', type: 'drag_and_drop', question: 'Complete the classroom rules.', sentences: ['Clean the chalk off the #board#.', 'Throw the trash in the #bin#.', 'Open the #window# for fresh air.'], distractors: ['door', 'desk', 'wall'] }
    ]
  },

  // ==========================================
  // CATEGORY 3: READING
  // ==========================================
  {
    category_id: unit1Cats.READING,
    title: 'My Pet Dog',
    tier: 'EXPLORER',
    badge_emoji: '🐶',
    questions: [
      { id: 'r_e1', type: 'multiple_choice', question: 'Read: "Tim has a pet dog. The dog is brown. Its name is Max. Tim and Max play in the park every day."\n\nWhat is the dog\'s name?', options: ['Tim', 'Max', 'Brown', 'Park'], answer: 'Max' },
      { id: 'r_e2', type: 'multiple_choice', question: 'What color is Max?', options: ['black', 'white', 'brown', 'grey'], answer: 'brown' },
      { id: 'r_e3', type: 'matching_pairs', question: 'Match the character to their identity in the story.', pairs: { 'Tim': 'the boy', 'Max': 'the pet dog', 'brown': 'the color of Max', 'park': 'where they play' } },
      { id: 'r_e4', type: 'matching_pairs', question: 'Match nouns from the text to their plurals.', pairs: { 'dog': 'dogs', 'park': 'parks', 'day': 'days', 'friend': 'friends' } },
      { id: 'r_e5', type: 'fill_in_gap', question: 'Complete the sentence from the text.', text: 'Tim and Max play in the [park] every day.' },
      { id: 'r_e6', type: 'fill_in_gap', question: 'Complete the details.', text: 'Tim [has] a pet dog. The dog [is] brown.' },
      { id: 'r_e7', type: 'correct_the_mistake', question: 'Correct the mistake based on the reading text.', text: 'Tim and Max play in the school every day.', mistake: 'school', correction: 'park' },
      { id: 'r_e8', type: 'correct_the_mistake', question: 'Correct the color mistake based on the story.', text: 'The pet dog Max is black.', mistake: 'black', correction: 'brown' },
      { id: 'r_e9', type: 'sentence_unscramble', question: 'Unscramble the sentence from the story.', words: ['Tim', 'and', 'Max', 'play', 'in', 'the', 'park', '.'] },
      { id: 'r_e10', type: 'choice_matrix', question: 'Decide if these statements about the story are True or False.', rows: ['Tim has a cat.##False', 'Max is brown.##True', 'They play in the park.##True', 'Max is a person.##False'], columns: ['True', 'False'], answers: { 'Tim has a cat.': 'False', 'Max is brown.': 'True', 'They play in the park.': 'True', 'Max is a person.': 'False' } },
      { id: 'r_e11', type: 'category_sorting', question: 'Sort the details into Tim vs Max categories.', categories: ['Tim', 'Max'], items: [{ text: 'is the boy', category: 'Tim' }, { text: 'is the dog', category: 'Max' }, { text: 'is brown', category: 'Max' }, { text: 'has a pet', category: 'Tim' }] },
      { id: 'r_e12', type: 'drag_and_drop', question: 'Fill in the gaps of the story summary.', sentences: ['Tim #has# a pet.', 'Its name is #Max#.', 'They play in the #park#.'], distractors: ['is', 'dog', 'school'] }
    ]
  },
  {
    category_id: unit1Cats.READING,
    title: 'The Wide-Mouthed Frog',
    tier: 'VOYAGER',
    badge_emoji: '🐸',
    questions: [
      { id: 'r_v1', type: 'multiple_choice', question: 'Read: "A wide-mouthed frog lives in a green pond. He likes to eat flies. Every day, he hops on logs and talks to other animals. He has a very big mouth."\n\nWhere does the frog live?', options: ['in a forest', 'in a green pond', 'in a school bag', 'on a clock'], answer: 'in a green pond' },
      { id: 'r_v2', type: 'multiple_choice', question: 'What does the frog like to eat?', options: ['worms', 'flies', 'fish', 'leaves'], answer: 'flies' },
      { id: 'r_v3', type: 'matching_pairs', question: 'Match the character to their food preference.', pairs: { 'wide-mouthed frog': 'flies', 'color of pond': 'green', 'pond': 'home of frog', 'logs': 'what he hops on' } },
      { id: 'r_v4', type: 'matching_pairs', question: 'Match singular to plural from the story.', pairs: { 'frog': 'frogs', 'pond': 'ponds', 'fly': 'flies', 'animal': 'animals' } },
      { id: 'r_v5', type: 'fill_in_gap', question: 'Complete the sentence from the text.', text: 'The frog lives in a green [pond] and likes to eat [flies].' },
      { id: 'r_v6', type: 'fill_in_gap', question: 'Fill in the verbs from the story.', text: 'He [hops] on logs and [talks] to other animals.' },
      { id: 'r_v7', type: 'correct_the_mistake', question: 'Correct the mistake based on the story details.', text: 'He likes to eat spiders.', mistake: 'spiders', correction: 'flies' },
      { id: 'r_v8', type: 'correct_the_mistake', question: 'Correct the mouth size based on the text.', text: 'The frog has a very small mouth.', mistake: 'small', correction: 'big' },
      { id: 'r_v9', type: 'sentence_unscramble', question: 'Unscramble the frog story sentence.', words: ['A', 'wide-mouthed', 'frog', 'lives', 'in', 'a', 'green', 'pond', '.'] },
      { id: 'r_v10', type: 'choice_matrix', question: 'Are these statements about the frog True or False?', rows: ['He lives in a tree.##False', 'He eats flies.##True', 'He has a big mouth.##True', 'He talks to people.##False'], columns: ['True', 'False'], answers: { 'He lives in a tree.': 'False', 'He eats flies.': 'True', 'He has a big mouth.': 'True', 'He talks to people.': 'False' } },
      { id: 'r_v11', type: 'category_sorting', question: 'Sort the items into Frog habits vs Pond characteristics.', categories: ['Frog Habit', 'Pond Characteristic'], items: [{ text: 'eats flies', category: 'Frog Habit' }, { text: 'is green', category: 'Pond Characteristic' }, { text: 'has water', category: 'Pond Characteristic' }, { text: 'hops on logs', category: 'Frog Habit' }] },
      { id: 'r_v12', type: 'drag_and_drop', question: 'Complete the story summary.', sentences: ['The frog lives in a green #pond#.', 'He eats #flies# every day.', 'He #talks# to other animals.'], distractors: ['forest', 'cats', 'reads'] }
    ]
  },
  {
    category_id: unit1Cats.READING,
    title: 'Midnight in the Classroom',
    tier: 'CHALLENGER',
    badge_emoji: '🕵️',
    questions: [
      { id: 'r_c1', type: 'multiple_choice', question: 'Read: "At midnight, the classroom comes alive. The pencils jump out of the pencil cases. They write funny stories on the board. The rubber erases the mistakes, and the clocks sing songs. At 6:00 AM, the objects go back to sleep."\n\nWhen does the classroom come alive?', options: ['in the morning', 'at noon', 'at midnight', 'at 6:00 AM'], answer: 'at midnight' },
      { id: 'r_c2', type: 'multiple_choice', question: 'What do the pencils do at midnight?', options: ['sleep', 'sing songs', 'write funny stories', 'measure desks'], answer: 'write funny stories' },
      { id: 'r_c3', type: 'matching_pairs', question: 'Match the classroom object to its midnight activity.', pairs: { 'pencils': 'write stories', 'rubber': 'erases mistakes', 'clocks': 'sing songs', '6:00 AM': 'go back to sleep' } },
      { id: 'r_c4', type: 'matching_pairs', question: 'Match the plurals from the text.', pairs: { 'pencil': 'pencils', 'case': 'cases', 'mistake': 'mistakes', 'song': 'songs' } },
      { id: 'r_c5', type: 'fill_in_gap', question: 'Complete the story summary.', text: 'The pencils write stories on the [board] and the [rubber] erases mistakes.' },
      { id: 'r_c6', type: 'fill_in_gap', question: 'Complete the time markers.', text: 'At [midnight], the classroom comes alive. At [6:00 AM], they sleep.' },
      { id: 'r_c7', type: 'correct_the_mistake', question: 'Correct the story detail mistake.', text: 'The pencils write funny stories on the wall.', mistake: 'wall', correction: 'board' },
      { id: 'r_c8', type: 'correct_the_mistake', question: 'Correct the action details.', text: 'The clocks eat funny stories.', mistake: 'eat', correction: 'write' },
      { id: 'r_c9', type: 'sentence_unscramble', question: 'Unscramble the midnight text sentence.', words: ['At', 'midnight', ',', 'the', 'classroom', 'comes', 'alive', '.'] },
      { id: 'r_c10', type: 'choice_matrix', question: 'Are these classroom events True or False based on the text?', rows: ['Pencils sleep at midnight.##False', 'Clocks sing songs.##True', 'Objects sleep at 6:00 AM.##True', 'Rubbers write stories.##False'], columns: ['True', 'False'], answers: { 'Pencils sleep at midnight.': 'False', 'Clocks sing songs.': 'True', 'Objects sleep at 6:00 AM.': 'True', 'Rubbers write stories.': 'False' } },
      { id: 'r_c11', type: 'category_sorting', question: 'Sort the actions by who performs them in the story.', categories: ['Pencils', 'Clocks', 'Rubber'], items: [{ text: 'write funny stories', category: 'Pencils' }, { text: 'sing songs', category: 'Clocks' }, { text: 'erases mistakes', category: 'Rubber' }, { text: 'jump out of cases', category: 'Pencils' }] },
      { id: 'r_c12', type: 'drag_and_drop', question: 'Fill in the blanks to complete the midnight summary.', sentences: ['The pencils #write# stories.', 'The rubber #erases# mistakes.', 'The clocks #sing# songs.'], distractors: ['read', 'pencils', 'clean'] }
    ]
  },

  // ==========================================
  // CATEGORY 4: WRITING
  // ==========================================
  {
    category_id: unit1Cats.WRITING,
    title: 'Building Sentences',
    tier: 'EXPLORER',
    badge_emoji: '✍️',
    questions: [
      { id: 'w_e1', type: 'sentence_unscramble', question: 'Unscramble to introduce yourself.', words: ['My', 'name', 'is', 'Anna', '.'] },
      { id: 'w_e2', type: 'sentence_unscramble', question: 'Unscramble your age details.', words: ['I', 'am', 'ten', 'years', 'old', '.'] },
      { id: 'w_e3', type: 'sentence_unscramble', question: 'Unscramble your favorite color statement.', words: ['My', 'favourite', 'colour', 'is', 'blue', '.'] },
      { id: 'w_e4', type: 'sentence_unscramble', question: 'Unscramble the simple description.', words: ['My', 'schoolbag', 'is', 'red', '.'] },
      { id: 'w_e5', type: 'fill_in_gap', question: 'Complete the personal profile.', text: 'Hello, my name is [Anna]. I am [ten] years old. My favourite colour is [blue].' },
      { id: 'w_e6', type: 'fill_in_gap', question: 'Complete sentences about your bag.', text: 'In my school bag, I have a [pencil] and a [ruler].' },
      { id: 'w_e7', type: 'correct_the_mistake', question: 'Correct the verb to be.', text: 'I is ten years old.', mistake: 'is', correction: 'am' },
      { id: 'w_e8', type: 'correct_the_mistake', question: 'Correct the capitalization error.', text: 'my name is Anna.', mistake: 'my', correction: 'My' },
      { id: 'w_e9', type: 'multiple_choice', question: 'Which sentence has correct capitalization?', options: ['My name is Tom.', 'my name is tom.', 'My Name Is tom.', 'my Name is Tom.'], answer: 'My name is Tom.' },
      { id: 'w_e10', type: 'multiple_choice', question: 'Choose the correct form to say your age.', options: ['I am ten years old.', 'I have ten years.', 'I am ten years.', 'I got ten years.'], answer: 'I am ten years old.' },
      { id: 'w_e11', type: 'choice_matrix', question: 'Identify correct and incorrect sentences.', rows: ['I am 10.##correct', 'My name Tom.##incorrect', 'I like school.##correct', 'He are my friend.##incorrect'], columns: ['correct', 'incorrect'], answers: { 'I am 10.': 'correct', 'My name Tom.': 'incorrect', 'I like school.': 'correct', 'He are my friend.': 'incorrect' } },
      { id: 'w_e12', type: 'matching_pairs', question: 'Match the questions to the correct writing goals.', pairs: { 'What is your name?': 'Write your name.', 'How old are you?': 'Write your age.', 'What is in your bag?': 'Write school items.', 'What is your favourite colour?': 'Write colours.' } }
    ]
  },
  {
    category_id: unit1Cats.WRITING,
    title: 'Fix & Improve',
    tier: 'VOYAGER',
    badge_emoji: '✏️',
    questions: [
      { id: 'w_v1', type: 'correct_the_mistake', question: 'Correct the name capitalization.', text: 'My best friend is lucy.', mistake: 'lucy', correction: 'Lucy' },
      { id: 'w_v2', type: 'correct_the_mistake', question: 'Correct the plural spelling mistake.', text: 'There are two boxs in the classroom.', mistake: 'boxs', correction: 'boxes' },
      { id: 'w_v3', type: 'correct_the_mistake', question: 'Correct the classroom imperative form.', text: 'Listen you to the teacher.', mistake: 'you', correction: '' },
      { id: 'w_v4', type: 'sentence_unscramble', question: 'Unscramble this writing sentence.', words: ['Our', 'classroom', 'has', 'four', 'walls', '.'] },
      { id: 'w_v5', type: 'sentence_unscramble', question: 'Unscramble the description.', words: ['The', 'board', 'is', 'at', 'the', 'front', '.'] },
      { id: 'w_v6', type: 'fill_in_gap', question: 'Complete the description of your classroom.', text: 'In my classroom, there is a big [board] and a [clock] on the wall.' },
      { id: 'w_v7', type: 'fill_in_gap', question: 'Complete the plural counts.', text: 'I have three blue [pens] and four green [pencils] in my pencil case.' },
      { id: 'w_v8', type: 'multiple_choice', question: 'Choose the correct way to write about someone else.', options: ['Her name is Lucy.', 'His name is Lucy.', 'Its name is Lucy.', 'She name is Lucy.'], answer: 'Her name is Lucy.' },
      { id: 'w_v9', type: 'multiple_choice', question: 'Choose the correct way to write about a boy.', options: ['His name is Ben.', 'Her name is Ben.', 'He name is Ben.', 'Its name is Ben.'], answer: 'His name is Ben.' },
      { id: 'w_v10', type: 'choice_matrix', question: 'Are these capitalized words correct or incorrect?', rows: ['English##correct', 'monday##incorrect', 'Anna##correct', 'schoolbag##correct'], columns: ['correct', 'incorrect'], answers: { 'English': 'correct', 'monday': 'incorrect', 'Anna': 'correct', 'schoolbag': 'correct' } },
      { id: 'w_v11', type: 'category_sorting', question: 'Sort the words by whether they need a Capital letter.', categories: ['Needs Capital', 'Lowercase'], items: [{ text: 'english', category: 'Needs Capital' }, { text: 'monday', category: 'Needs Capital' }, { text: 'pencil', category: 'Lowercase' }, { text: 'anna', category: 'Needs Capital' }, { text: 'desk', category: 'Lowercase' }] },
      { id: 'w_v12', type: 'drag_and_drop', question: 'Complete the description text.', sentences: ['My name is #Tom#.', 'I #like# English class.', 'We write on the #board#.'], distractors: ['Lucy', 'writes', 'floor'] }
    ]
  },
  {
    category_id: unit1Cats.WRITING,
    title: 'Write About You',
    tier: 'CHALLENGER',
    badge_emoji: '📝',
    questions: [
      { id: 'w_c1', type: 'correct_the_mistake', question: 'Find and correct the spelling of school.', text: 'I walk to my new scool every morning.', mistake: 'scool', correction: 'school' },
      { id: 'w_c2', type: 'correct_the_mistake', question: 'Find and correct the imperative form.', text: 'Please writes your name here.', mistake: 'writes', correction: 'write' },
      { id: 'w_c3', type: 'correct_the_mistake', question: 'Find the verb agreement error.', text: 'There is twenty children in my class.', mistake: 'is', correction: 'are' },
      { id: 'w_c4', type: 'sentence_unscramble', question: 'Unscramble the question.', words: ['Can', 'you', 'spell', 'your', 'name', 'please', '?'] },
      { id: 'w_c5', type: 'sentence_unscramble', question: 'Unscramble the routine statement.', words: ['We', 'have', 'English', 'lessons', 'every', 'Monday', '.'] },
      { id: 'w_c6', type: 'fill_in_gap', question: 'Complete the school routine text.', text: 'First, I get up. Next, I pack my [schoolbag]. Finally, I walk to [school].' },
      { id: 'w_c7', type: 'fill_in_gap', question: 'Complete the irregular plurals.', text: 'There are five [men] and ten [women] in the school staff room.' },
      { id: 'w_c8', type: 'choice_matrix', question: 'Check if these sentences are structurally correct.', rows: ['We have 5 classes.##correct', 'There are one board.##incorrect', 'Stand up please.##correct', 'Don\'t running in class.##incorrect'], columns: ['correct', 'incorrect'], answers: { 'We have 5 classes.': 'correct', 'There are one board.': 'incorrect', 'Stand up please.': 'correct', 'Don\'t running in class.': 'incorrect' } },
      { id: 'w_c9', type: 'category_sorting', question: 'Sort the items by correct category.', categories: ['Capitalize', 'Do not capitalize'], items: [{ text: 'Austria', category: 'Capitalize' }, { text: 'Tuesday', category: 'Capitalize' }, { text: 'ruler', category: 'Do not capitalize' }, { text: 'Peter', category: 'Capitalize' }, { text: 'classroom', category: 'Do not capitalize' }] },
      { id: 'w_c10', type: 'multiple_choice', question: 'Which sentence has correct punctuation and capitalization?', options: ['My friend is Anna.', 'my friend is Anna', 'My friend is anna.', 'My friend are Anna.'], answer: 'My friend is Anna.' },
      { id: 'w_c11', type: 'order_sentences', question: 'Order the sentences to write a neat self-introduction.', sentences: ['Hello, my name is Anna.', 'I am ten years old.', 'I live in a small town in Austria.', 'My favourite subject is English.'] },
      { id: 'w_c12', type: 'drag_and_drop', question: 'Complete the paragraph.', sentences: ['I have a blue #pencilcase#.', 'Inside, there are five #pencils#.', 'Please #give# me a rubber.'], distractors: ['schoolbag', 'pencil', 'takes'] }
    ]
  },

  // ==========================================
  // CATEGORY 5: LISTENING
  // ==========================================
  {
    category_id: unit1Cats.LISTENING,
    title: 'Spell It Out',
    tier: 'EXPLORER',
    badge_emoji: '🎧',
    audio_url: 'tts://Hello. Welcome to LingoPeak. Listen carefully to the letters and spell them out.',
    questions: [
      { id: 'l_e1', type: 'multiple_choice', question: 'Listen: "My name is Tom. T-O-M."\n\nHow do you spell the name?', options: ['TAM', 'TOM', 'TIM', 'TUM'], answer: 'TOM' },
      { id: 'l_e2', type: 'multiple_choice', question: 'Listen: "The code is B-L-U-E."\n\nWhat word was spelled?', options: ['BLOW', 'BLUE', 'BLUR', 'BOWL'], answer: 'BLUE' },
      { id: 'l_e3', type: 'matching_pairs', question: 'Listen to spelling sounds and match spelling pairs.', pairs: { 'A-N-N-A': 'Anna', 'R-E-D': 'Red', 'P-E-N': 'Pen', 'F-I-V-E': 'Five' } },
      { id: 'l_e4', type: 'matching_pairs', question: 'Listen to the number spelling sounds.', pairs: { 'O-N-E': 'One', 'T-W-O': 'Two', 'T-H-R-E-E': 'Three', 'F-O-U-R': 'Four' } },
      { id: 'l_e5', type: 'fill_in_gap', question: 'Listen and fill in the missing letters: "T-E-A-C-H-E-R"', text: 'T-E-[A]-C-H-[E]-R' },
      { id: 'l_e6', type: 'fill_in_gap', question: 'Listen and fill in the missing numbers: "One, two, three, four, five."', text: 'One, two, [three], four, [five]' },
      { id: 'l_e7', type: 'correct_the_mistake', question: 'Listen: "My name is Max. M-A-X."\n\nCorrect the spelling mistake in the sentence.', text: 'The boy\'s name is Mac.', mistake: 'Mac', correction: 'Max' },
      { id: 'l_e8', type: 'correct_the_mistake', question: 'Listen: "The color is yellow."\n\nCorrect the mistake.', text: 'The desk is yelow.', mistake: 'yelow', correction: 'yellow' },
      { id: 'l_e9', type: 'sentence_unscramble', question: 'Listen: "Spell your name please."\n\nUnscramble what you heard.', words: ['Spell', 'your', 'name', 'please', '.'] },
      { id: 'l_e10', type: 'choice_matrix', question: 'Listen and triage if spelling is correct.', rows: ['C-A-T##correct', 'D-O-G##correct', 'B-O-X-S##incorrect', 'P-E-N-S##correct'], columns: ['correct', 'incorrect'], answers: { 'C-A-T': 'correct', 'D-O-G': 'correct', 'B-O-X-S': 'incorrect', 'P-E-N-S': 'correct' } },
      { id: 'l_e11', type: 'category_sorting', question: 'Sort these spelled words.', categories: ['Spelled Name', 'Spelled Object'], items: [{ text: 'A-N-N-A', category: 'Spelled Name' }, { text: 'P-E-N', category: 'Spelled Object' }, { text: 'T-O-M', category: 'Spelled Name' }, { text: 'B-O-O-K', category: 'Spelled Object' }] },
      { id: 'l_e12', type: 'drag_and_drop', question: 'Listen and drag spelled words.', sentences: ['My name is #A-N-N-A#.', 'I have a #R-E-D# pen.', 'The color is #B-L-U-E#.'], distractors: ['T-O-M', 'G-R-E-E-N', 'B-A-G'] }
    ]
  },
  {
    category_id: unit1Cats.LISTENING,
    title: 'Follow the Teacher',
    tier: 'VOYAGER',
    badge_emoji: '🔔',
    audio_url: 'tts://Listen to the teacher\'s classroom instructions and follow them carefully.',
    questions: [
      { id: 'l_v1', type: 'multiple_choice', question: 'Listen: "Open your books to page ten."\n\nWhat should you open?', options: ['your notebooks', 'your pencil case', 'your books', 'the door'], answer: 'your books' },
      { id: 'l_v2', type: 'multiple_choice', question: 'Listen: "Don\'t run in the classroom."\n\nWhat shouldn\'t you do?', options: ['talk', 'run', 'sing', 'write'], answer: 'run' },
      { id: 'l_v3', type: 'matching_pairs', question: 'Listen to the instructions and match them.', pairs: { 'Stand up': 'get up from chair', 'Sit down': 'sit on chair', 'Be quiet': 'don\'t make noise', 'Listen': 'pay attention' } },
      { id: 'l_v4', type: 'matching_pairs', question: 'Listen to the imperative sounds.', pairs: { 'Close': 'the window', 'Clean': 'the board', 'Spell': 'your name', 'Write': 'with a pen' } },
      { id: 'l_v5', type: 'fill_in_gap', question: 'Listen and fill in the missing imperative: "Open your school bag."', text: '[Open] your school bag.' },
      { id: 'l_v6', type: 'fill_in_gap', question: 'Listen: "Be quiet, please."\n\nFill in the gap.', text: '[Be] quiet, please.' },
      { id: 'l_v7', type: 'correct_the_mistake', question: 'Listen: "Write your name on the board."\n\nCorrect the mistake.', text: 'Write your name on the paper.', mistake: 'paper', correction: 'board' },
      { id: 'l_v8', type: 'correct_the_mistake', question: 'Listen: "Stand up, please."\n\nCorrect the mistake.', text: 'Sit up, please.', mistake: 'Sit', correction: 'Stand' },
      { id: 'l_v9', type: 'sentence_unscramble', question: 'Listen: "Clean the board please."\n\nUnscramble what you heard.', words: ['Clean', 'the', 'board', 'please', '.'] },
      { id: 'l_v10', type: 'choice_matrix', question: 'Listen and triage if command is positive or negative.', rows: ['Stand up.##Positive', 'Don\'t run.##Negative', 'Listen.##Positive', 'Don\'t talk.##Negative'], columns: ['Positive', 'Negative'], answers: { 'Stand up.': 'Positive', 'Don\'t run.': 'Negative', 'Listen.': 'Positive', 'Don\'t talk.': 'Negative' } },
      { id: 'l_v11', type: 'category_sorting', question: 'Sort the spoken commands by target.', categories: ['Target: Book', 'Target: Desk'], items: [{ text: 'Open your book', category: 'Target: Book' }, { text: 'Sit at your desk', category: 'Target: Desk' }, { text: 'Close your book', category: 'Target: Book' }, { text: 'Clean your desk', category: 'Target: Desk' }] },
      { id: 'l_v12', type: 'drag_and_drop', question: 'Listen and drag correct instructions.', sentences: ['Please #open# your book.', 'Don\'t #talk# in class.', '#Stand# up please.'], distractors: ['close', 'run', 'Sit'] }
    ]
  },
  {
    category_id: unit1Cats.LISTENING,
    title: 'School Uniform Talk',
    tier: 'CHALLENGER',
    badge_emoji: '👕',
    audio_url: 'tts://Hello, I am Luna. Today I am wearing my school uniform. It is a blue skirt, a white shirt, and a red jumper. I also wear black shoes. I like my uniform because it is very colorful.',
    questions: [
      { id: 'l_c1', type: 'multiple_choice', question: 'Listen to Luna: What is she wearing today?', options: ['a green dress', 'her school uniform', 'a blue t-shirt', 'black trousers'], answer: 'her school uniform' },
      { id: 'l_c2', type: 'multiple_choice', question: 'What color is Luna\'s skirt?', options: ['red', 'white', 'blue', 'black'], answer: 'blue' },
      { id: 'l_c3', type: 'matching_pairs', question: 'Listen to uniform details and match item to color.', pairs: { 'skirt': 'blue', 'shirt': 'white', 'jumper': 'red', 'shoes': 'black' } },
      { id: 'l_c4', type: 'matching_pairs', question: 'Match the speakers to their details.', pairs: { 'Luna': 'school uniform wearer', 'blue': 'skirt color', 'red': 'jumper color', 'black': 'shoes color' } },
      { id: 'l_c5', type: 'fill_in_gap', question: 'Listen and complete what Luna is wearing.', text: 'Luna is wearing a white [shirt] and a red [jumper].' },
      { id: 'l_c6', type: 'fill_in_gap', question: 'Listen: "I also wear black shoes."\n\nComplete the gap.', text: 'I also wear black [shoes].' },
      { id: 'l_c7', type: 'correct_the_mistake', question: 'Listen and correct the statement.', text: 'Luna is wearing a green skirt.', mistake: 'green', correction: 'blue' },
      { id: 'l_c8', type: 'correct_the_mistake', question: 'Listen and correct the adjective.', text: 'Luna thinks her school uniform is boring.', mistake: 'boring', correction: 'colorful' },
      { id: 'l_c9', type: 'sentence_unscramble', question: 'Listen: "Today I am wearing my school uniform."\n\nUnscramble what you heard.', words: ['Today', 'I', 'am', 'wearing', 'my', 'school', 'uniform', '.'] },
      { id: 'l_c10', type: 'choice_matrix', question: 'Listen and verify if uniform statements are True or False.', rows: ['Skirts are red.##False', 'Jumpers are red.##True', 'Shoes are black.##True', 'Shirts are blue.##False'], columns: ['True', 'False'], answers: { 'Skirts are red.': 'False', 'Jumpers are red.': 'True', 'Shoes are black.': 'True', 'Shirts are blue.': 'False' } },
      { id: 'l_c11', type: 'category_sorting', question: 'Sort the items by color based on the listening.', categories: ['Red Items', 'Blue Items', 'Black Items'], items: [{ text: 'jumper', category: 'Red Items' }, { text: 'skirt', category: 'Blue Items' }, { text: 'shoes', category: 'Black Items' }] },
      { id: 'l_c12', type: 'drag_and_drop', question: 'Listen and drag matching clothes descriptors.', sentences: ['She is wearing a blue #skirt#.', 'She is wearing a white #shirt#.', 'She likes her #uniform#.'], distractors: ['jumper', 'socks', 'dress'] }
    ]
  }
];

try {
  console.log('Starting Master Seeding of Unit 1 worksheets...');
  
  db.transaction(() => {
    for (const ws of worksheetsData) {
      // 1. Delete existing worksheet with this title in this category
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
      
      console.log(`Seeded [${ws.tier}] "${ws.title}" in ${ws.category_id} with ${ws.questions.length} items.`);
    }
  })();
  
  console.log('Master Seeding of Unit 1 completed successfully!');
} catch (error) {
  console.error('Master Seeding of Unit 1 failed:', error);
}
