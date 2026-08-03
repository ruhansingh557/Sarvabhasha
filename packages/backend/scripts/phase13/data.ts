/**
 * Phase 13 pilot content — Hindi/Devanagari only. Hand-researched, not
 * invented (see the accompanying report for sourcing notes on the trickier
 * calls: ङ/ञ/ष/अः having no natural word-INITIAL example in Hindi, the
 * क्ष/त्र/ज्ञ conjunct-inclusion decision, the दादी/नानी paternal/maternal
 * split, and the अंकल/आंटी loanword decision for uncle/aunt).
 */

export type CharacterType = 'vowel' | 'consonant' | 'conjunct';

export interface DevanagariCharacter {
  character: string;
  characterType: CharacterType;
  romanization: string;
  exampleWord: string;
  exampleTransliteration: string;
  sortOrder: number;
  /** English gloss of the example word — for the review report only, not stored. */
  exampleGloss: string;
  /** Non-null only for the handful of characters with no natural word-initial example. */
  note?: string;
}

export const DEVANAGARI_CHARACTERS: DevanagariCharacter[] = [
  // ---- स्वर (vowels) — 11 core + अनुस्वार/विसर्ग (2) = 13 ----
  { character: 'अ', characterType: 'vowel', romanization: 'a', exampleWord: 'अनार', exampleTransliteration: 'anaar', exampleGloss: 'pomegranate', sortOrder: 1 },
  { character: 'आ', characterType: 'vowel', romanization: 'aa', exampleWord: 'आम', exampleTransliteration: 'aam', exampleGloss: 'mango', sortOrder: 2 },
  { character: 'इ', characterType: 'vowel', romanization: 'i', exampleWord: 'इमली', exampleTransliteration: 'imli', exampleGloss: 'tamarind', sortOrder: 3 },
  { character: 'ई', characterType: 'vowel', romanization: 'ee', exampleWord: 'ईख', exampleTransliteration: 'eekh', exampleGloss: 'sugarcane', sortOrder: 4 },
  { character: 'उ', characterType: 'vowel', romanization: 'u', exampleWord: 'उल्लू', exampleTransliteration: 'ullu', exampleGloss: 'owl', sortOrder: 5 },
  { character: 'ऊ', characterType: 'vowel', romanization: 'oo', exampleWord: 'ऊन', exampleTransliteration: 'oon', exampleGloss: 'wool', sortOrder: 6 },
  { character: 'ऋ', characterType: 'vowel', romanization: 'ri', exampleWord: 'ऋषि', exampleTransliteration: 'rishi', exampleGloss: 'sage', sortOrder: 7 },
  { character: 'ए', characterType: 'vowel', romanization: 'e', exampleWord: 'एक', exampleTransliteration: 'ek', exampleGloss: 'one', sortOrder: 8 },
  { character: 'ऐ', characterType: 'vowel', romanization: 'ai', exampleWord: 'ऐनक', exampleTransliteration: 'ainak', exampleGloss: 'spectacles', sortOrder: 9 },
  { character: 'ओ', characterType: 'vowel', romanization: 'o', exampleWord: 'ओखली', exampleTransliteration: 'okhli', exampleGloss: 'mortar (grinding vessel)', sortOrder: 10 },
  { character: 'औ', characterType: 'vowel', romanization: 'au', exampleWord: 'औरत', exampleTransliteration: 'aurat', exampleGloss: 'woman', sortOrder: 11 },
  { character: 'अं', characterType: 'vowel', romanization: 'am', exampleWord: 'अंगूर', exampleTransliteration: 'angoor', exampleGloss: 'grape', sortOrder: 12 },
  { character: 'अः', characterType: 'vowel', romanization: 'ah', exampleWord: 'दुःख', exampleTransliteration: 'dukh', exampleGloss: 'sorrow', sortOrder: 13, note: 'Visarga essentially never begins a native Hindi word — दुःख is the standard textbook example even though अः is medial there, not initial.' },

  // ---- व्यंजन (consonants) — 5x5 varga + अंतस्थ + ऊष्म = 33 ----
  { character: 'क', characterType: 'consonant', romanization: 'ka', exampleWord: 'कमल', exampleTransliteration: 'kamal', exampleGloss: 'lotus', sortOrder: 14 },
  { character: 'ख', characterType: 'consonant', romanization: 'kha', exampleWord: 'खरगोश', exampleTransliteration: 'khargosh', exampleGloss: 'rabbit', sortOrder: 15 },
  { character: 'ग', characterType: 'consonant', romanization: 'ga', exampleWord: 'गाय', exampleTransliteration: 'gaay', exampleGloss: 'cow', sortOrder: 16 },
  { character: 'घ', characterType: 'consonant', romanization: 'gha', exampleWord: 'घड़ी', exampleTransliteration: 'ghadi', exampleGloss: 'clock/watch', sortOrder: 17 },
  { character: 'ङ', characterType: 'consonant', romanization: 'nga', exampleWord: 'वाङ्मय', exampleTransliteration: 'vaangmaya', exampleGloss: 'literature (the body of speech)', sortOrder: 18, note: 'ङ does not occur word-initially in Sanskrit or Hindi (a linguistic fact, not a research gap) — वाङ्मय is a genuine, standard word containing it, used medially.' },
  { character: 'च', characterType: 'consonant', romanization: 'cha', exampleWord: 'चम्मच', exampleTransliteration: 'chammach', exampleGloss: 'spoon', sortOrder: 19 },
  { character: 'छ', characterType: 'consonant', romanization: 'chha', exampleWord: 'छाता', exampleTransliteration: 'chhata', exampleGloss: 'umbrella', sortOrder: 20 },
  { character: 'ज', characterType: 'consonant', romanization: 'ja', exampleWord: 'जूता', exampleTransliteration: 'joota', exampleGloss: 'shoe', sortOrder: 21 },
  { character: 'झ', characterType: 'consonant', romanization: 'jha', exampleWord: 'झंडा', exampleTransliteration: 'jhanda', exampleGloss: 'flag', sortOrder: 22 },
  { character: 'ञ', characterType: 'consonant', romanization: 'nya', exampleWord: 'यज्ञ', exampleTransliteration: 'yagya', exampleGloss: 'sacrifice/ritual', sortOrder: 23, note: 'ञ almost never occurs word-initially either — यज्ञ is the standard example, where ञ appears inside the ज्ञ conjunct (ज+ञ).' },
  { character: 'ट', characterType: 'consonant', romanization: 'Ta', exampleWord: 'टमाटर', exampleTransliteration: 'tamatar', exampleGloss: 'tomato', sortOrder: 24 },
  { character: 'ठ', characterType: 'consonant', romanization: 'Tha', exampleWord: 'ठेला', exampleTransliteration: 'thela', exampleGloss: 'handcart', sortOrder: 25 },
  { character: 'ड', characterType: 'consonant', romanization: 'Da', exampleWord: 'डिब्बा', exampleTransliteration: 'dibba', exampleGloss: 'box', sortOrder: 26 },
  { character: 'ढ', characterType: 'consonant', romanization: 'Dha', exampleWord: 'ढोल', exampleTransliteration: 'dhol', exampleGloss: 'drum', sortOrder: 27 },
  { character: 'ण', characterType: 'consonant', romanization: 'Na', exampleWord: 'गणेश', exampleTransliteration: 'ganesh', exampleGloss: 'Ganesh (deity name)', sortOrder: 28, note: 'ण rarely starts native Hindi words; गणेश is the standard, universally-known example, medial rather than initial.' },
  { character: 'त', characterType: 'consonant', romanization: 'ta', exampleWord: 'तरबूज', exampleTransliteration: 'tarbuj', exampleGloss: 'watermelon', sortOrder: 29 },
  { character: 'थ', characterType: 'consonant', romanization: 'tha', exampleWord: 'थाली', exampleTransliteration: 'thali', exampleGloss: 'plate', sortOrder: 30 },
  { character: 'द', characterType: 'consonant', romanization: 'da', exampleWord: 'दरवाज़ा', exampleTransliteration: 'darwaza', exampleGloss: 'door', sortOrder: 31 },
  { character: 'ध', characterType: 'consonant', romanization: 'dha', exampleWord: 'धनुष', exampleTransliteration: 'dhanush', exampleGloss: 'bow', sortOrder: 32 },
  { character: 'न', characterType: 'consonant', romanization: 'na', exampleWord: 'नल', exampleTransliteration: 'nal', exampleGloss: 'tap/faucet', sortOrder: 33 },
  { character: 'प', characterType: 'consonant', romanization: 'pa', exampleWord: 'पतंग', exampleTransliteration: 'patang', exampleGloss: 'kite', sortOrder: 34 },
  { character: 'फ', characterType: 'consonant', romanization: 'pha', exampleWord: 'फल', exampleTransliteration: 'phal', exampleGloss: 'fruit', sortOrder: 35 },
  { character: 'ब', characterType: 'consonant', romanization: 'ba', exampleWord: 'बकरी', exampleTransliteration: 'bakri', exampleGloss: 'goat', sortOrder: 36 },
  { character: 'भ', characterType: 'consonant', romanization: 'bha', exampleWord: 'भालू', exampleTransliteration: 'bhalu', exampleGloss: 'bear', sortOrder: 37 },
  { character: 'म', characterType: 'consonant', romanization: 'ma', exampleWord: 'मछली', exampleTransliteration: 'machli', exampleGloss: 'fish', sortOrder: 38 },
  { character: 'य', characterType: 'consonant', romanization: 'ya', exampleWord: 'योग', exampleTransliteration: 'yog', exampleGloss: 'yoga/union', sortOrder: 39 },
  { character: 'र', characterType: 'consonant', romanization: 'ra', exampleWord: 'रोटी', exampleTransliteration: 'roti', exampleGloss: 'flatbread', sortOrder: 40 },
  { character: 'ल', characterType: 'consonant', romanization: 'la', exampleWord: 'लड्डू', exampleTransliteration: 'laddoo', exampleGloss: 'a round Indian sweet', sortOrder: 41 },
  { character: 'व', characterType: 'consonant', romanization: 'va', exampleWord: 'वन', exampleTransliteration: 'van', exampleGloss: 'forest', sortOrder: 42 },
  { character: 'श', characterType: 'consonant', romanization: 'sha', exampleWord: 'शेर', exampleTransliteration: 'sher', exampleGloss: 'lion', sortOrder: 43 },
  { character: 'ष', characterType: 'consonant', romanization: 'Sha', exampleWord: 'षड्यंत्र', exampleTransliteration: 'shadyantra', exampleGloss: 'conspiracy', sortOrder: 44, note: 'ष rarely starts native Hindi words; षड्यंत्र is a genuinely common word (news/media Hindi) rather than a rarer literary pick like षटकोण.' },
  { character: 'स', characterType: 'consonant', romanization: 'sa', exampleWord: 'सूरज', exampleTransliteration: 'sooraj', exampleGloss: 'sun', sortOrder: 45 },
  { character: 'ह', characterType: 'consonant', romanization: 'ha', exampleWord: 'हाथी', exampleTransliteration: 'hathi', exampleGloss: 'elephant', sortOrder: 46 },

  // ---- संयुक्ताक्षर (conjuncts) — see report for the inclusion decision ----
  { character: 'क्ष', characterType: 'conjunct', romanization: 'ksha', exampleWord: 'क्षमा', exampleTransliteration: 'kshama', exampleGloss: 'forgiveness', sortOrder: 47 },
  { character: 'त्र', characterType: 'conjunct', romanization: 'tra', exampleWord: 'त्रिकोण', exampleTransliteration: 'trikon', exampleGloss: 'triangle', sortOrder: 48 },
  { character: 'ज्ञ', characterType: 'conjunct', romanization: 'gya', exampleWord: 'ज्ञान', exampleTransliteration: 'gyaan', exampleGloss: 'knowledge', sortOrder: 49 },
];

export interface NumberItem {
  itemKey: string;
  englishWord: string;
  text: string;
  transliteration: string;
  objectDescription: string;
}

export const NUMBERS: NumberItem[] = [
  { itemKey: '1', englishWord: 'One', text: 'एक', transliteration: 'ek', objectDescription: 'ripe mangoes' },
  { itemKey: '2', englishWord: 'Two', text: 'दो', transliteration: 'do', objectDescription: 'yellow bananas' },
  { itemKey: '3', englishWord: 'Three', text: 'तीन', transliteration: 'teen', objectDescription: 'red apples' },
  { itemKey: '4', englishWord: 'Four', text: 'चार', transliteration: 'chaar', objectDescription: 'colourful paper kites' },
  { itemKey: '5', englishWord: 'Five', text: 'पांच', transliteration: 'paanch', objectDescription: 'five-pointed stars' },
  { itemKey: '6', englishWord: 'Six', text: 'छह', transliteration: 'chhah', objectDescription: 'orange marigold flowers' },
  { itemKey: '7', englishWord: 'Seven', text: 'सात', transliteration: 'saat', objectDescription: 'small seashells' },
  { itemKey: '8', englishWord: 'Eight', text: 'आठ', transliteration: 'aath', objectDescription: 'round balloons' },
  { itemKey: '9', englishWord: 'Nine', text: 'नौ', transliteration: 'nau', objectDescription: 'green leaves' },
  { itemKey: '10', englishWord: 'Ten', text: 'दस', transliteration: 'das', objectDescription: 'glass marbles' },
  { itemKey: '11', englishWord: 'Eleven', text: 'ग्यारह', transliteration: 'gyarah', objectDescription: 'small buttons' },
  { itemKey: '12', englishWord: 'Twelve', text: 'बारह', transliteration: 'barah', objectDescription: 'smooth river pebbles' },
  { itemKey: '13', englishWord: 'Thirteen', text: 'तेरह', transliteration: 'terah', objectDescription: 'small berries' },
  { itemKey: '14', englishWord: 'Fourteen', text: 'चौदह', transliteration: 'chaudah', objectDescription: 'gold coins' },
  { itemKey: '15', englishWord: 'Fifteen', text: 'पंद्रह', transliteration: 'pandrah', objectDescription: 'wrapped candies' },
  { itemKey: '16', englishWord: 'Sixteen', text: 'सोलह', transliteration: 'solah', objectDescription: 'colourful beads' },
  { itemKey: '17', englishWord: 'Seventeen', text: 'सत्रह', transliteration: 'satrah', objectDescription: 'roasted peanuts' },
  { itemKey: '18', englishWord: 'Eighteen', text: 'अठारह', transliteration: 'atharah', objectDescription: 'purple grapes' },
  { itemKey: '19', englishWord: 'Nineteen', text: 'उन्नीस', transliteration: 'unnis', objectDescription: 'small paper boats' },
  { itemKey: '20', englishWord: 'Twenty', text: 'बीस', transliteration: 'bees', objectDescription: 'small paper lanterns' },
];

export interface FamilyItem {
  itemKey: string;
  englishWord: string;
  text: string;
  transliteration: string;
  imageSubject: string;
}

export const FAMILY: FamilyItem[] = [
  { itemKey: 'mother', englishWord: 'Mother', text: 'माँ', transliteration: 'maa', imageSubject: 'a warm adult woman, mother figure, simple everyday clothing, no elaborate jewelry' },
  { itemKey: 'father', englishWord: 'Father', text: 'पापा', transliteration: 'papa', imageSubject: 'an adult man, father figure, simple plain shirt, no facial hair details, no watch or accessories' },
  { itemKey: 'brother', englishWord: 'Brother', text: 'भाई', transliteration: 'bhai', imageSubject: 'a young boy, sibling figure, simple plain green t-shirt, short hair' },
  { itemKey: 'sister', englishWord: 'Sister', text: 'बहन', transliteration: 'bahan', imageSubject: 'a young girl, sibling figure, simple plain yellow kurta, hair in a single braid' },
  { itemKey: 'grandmother-paternal', englishWord: "Grandmother (father's side)", text: 'दादी', transliteration: 'dadi', imageSubject: "an elderly woman, paternal grandmother figure, simple plain cream-coloured saree, grey hair in a low bun, no nose pin, no elaborate jewelry — a different, simpler generic figure, not a specific named character's design" },
  { itemKey: 'grandmother-maternal', englishWord: "Grandmother (mother's side)", text: 'नानी', transliteration: 'nani', imageSubject: 'an elderly woman, maternal grandmother figure, simple plain soft blue saree, grey hair in a single braid, no jewelry — visually distinct from a paternal-grandmother design, generic, not a specific named character' },
  { itemKey: 'grandfather-paternal', englishWord: "Grandfather (father's side)", text: 'दादा', transliteration: 'dada', imageSubject: 'an elderly man, paternal grandfather figure, simple plain white kurta-pyjama, a walking stick, no moustache — generic, not a specific named character' },
  { itemKey: 'grandfather-maternal', englishWord: "Grandfather (mother's side)", text: 'नाना', transliteration: 'nana', imageSubject: 'an elderly man, maternal grandfather figure, simple plain beige kurta, round eyeglasses, no walking stick — visually distinct from a paternal-grandfather design, generic, not a specific named character' },
  { itemKey: 'uncle', englishWord: 'Uncle', text: 'अंकल', transliteration: 'ankal', imageSubject: 'a friendly adult man, generic uncle figure, simple plain maroon shirt, no moustache, no wristwatch — generic, not a specific named character' },
  { itemKey: 'aunt', englishWord: 'Aunt', text: 'आंटी', transliteration: 'aanti', imageSubject: 'a friendly adult woman, generic aunt figure, simple plain purple salwar-kameez, hair tied back — generic, not a specific named character' },
  { itemKey: 'son', englishWord: 'Son', text: 'बेटा', transliteration: 'beta', imageSubject: 'a young boy, son figure, simple plain blue t-shirt, short hair' },
  { itemKey: 'daughter', englishWord: 'Daughter', text: 'बेटी', transliteration: 'beti', imageSubject: 'a young girl, daughter figure, simple plain lavender frock, hair in two small ponytails' },
  { itemKey: 'husband', englishWord: 'Husband', text: 'पति', transliteration: 'pati', imageSubject: 'an adult man, husband figure, simple plain navy-blue kurta, a simple wedding band visible on one hand' },
  { itemKey: 'wife', englishWord: 'Wife', text: 'पत्नी', transliteration: 'patni', imageSubject: 'an adult woman, wife figure, simple plain rose-pink saree, a simple wedding bangle visible on one wrist, a small red bindi' },
];
