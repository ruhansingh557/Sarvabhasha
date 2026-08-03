/**
 * Phase 13 pilot content. Hand-researched, not invented (see the
 * accompanying report for sourcing notes on the trickier calls: ङ/ञ/ष/अः
 * having no natural word-INITIAL example in Hindi, the क्ष/त्र/ज्ञ
 * conjunct-inclusion decision, the दादी/नानी paternal/maternal split, and
 * the अंकल/आंटी loanword decision for uncle/aunt).
 *
 * `ScriptCharacterData` (renamed from the original `DevanagariCharacter`
 * 2026-08-03, when Bengali became the SECOND script authored through this
 * pipeline) is deliberately script-agnostic — every field generalizes
 * cleanly across scripts. See `BENGALI_CHARACTERS`'s own header for a real
 * structural difference this renaming had to accommodate: Bengali's own
 * authoritative convention classifies its anusvara/visarga/chandrabindu
 * (ং/ঃ/ঁ) as CONSONANTS, unlike Devanagari's practice of grouping its
 * equivalents (अं/अः) with the VOWELS — `characterType` faithfully follows
 * each script's own convention rather than forcing Devanagari's onto Bengali.
 */

export type CharacterType = 'vowel' | 'consonant' | 'conjunct';

export interface ScriptCharacterData {
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

export const DEVANAGARI_CHARACTERS: ScriptCharacterData[] = [
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

/**
 * Bengali (`script: 'bengali'` in `@sarvabhasha/shared`'s `languages.ts`) —
 * serves both bn and as, the SECOND script authored through this pipeline
 * (2026-08-03), proving the multi-script design generalizes before this
 * project commits to translating all Foundations content into every live
 * language.
 *
 * SOURCING (verified against a real authoritative count, not improvised —
 * cross-checked against ebanglalibrary.com/mytestseries.in/7rongs.com, which
 * all independently agree): standard Bengali বর্ণমালা (bornomala) is 50
 * letters — 11 স্বরবর্ণ (vowels) + 39 ব্যঞ্জনবর্ণ (consonants) — plus 3
 * conjuncts included here on the SAME "3 most standard, not exhaustive"
 * precedent Devanagari set (ক্ষ/ত্র/জ্ঞ mirror Devanagari's क्ष/त्र/ज्ञ
 * almost exactly, since both scripts inherit the same Sanskrit conjunct
 * forms) = 53 rows total.
 *
 * STRUCTURAL DIFFERENCE FROM DEVANAGARI (do not "fix" this to match — it is
 * Bengali's own convention, confirmed across all three sources above):
 * অনুস্বার/বিসর্গ/চন্দ্রবিন্দু (anusvara/visarga/chandrabindu — ং/ঃ/ঁ) are
 * counted among the 39 CONSONANTS, at the very end of the consonant
 * sequence, alongside ড়/ঢ়/য়/ৎ — NOT grouped with the vowels the way
 * Devanagari folds अं/अः into its own vowel row. `characterType:
 * 'consonant'` for all 7 of these reflects that real difference.
 *
 * MNEMONIC CONVENTION (Bengali's own, researched — not Hindi's "से" ported
 * over): the traditional Bengali primer pattern is "<character>-এ
 * <exampleWord>" (locative "e", e.g. "অ-এ অজগর" — "O, as in Ajagar/python"),
 * traceable directly to Ishwar Chandra Vidyasagar's 1855 "বর্ণপরিচয়"
 * (Bornoparichay), THE foundational Bengali primer still referenced today —
 * an even more authoritative source than Devanagari's own generic "as in"
 * convention had available. Some regional materials use "-তে" (also a
 * locative case marker, grammatically equivalent) interchangeably; this
 * dataset standardizes on "-এ" for consistency, matching Vidyasagar's
 * original. Every example word below was verified via Wikijunior's
 * (bn.wikibooks.org) per-letter pages and/or Vidyasagar's own primer
 * examples (ঈগল for ঈ is literally Vidyasagar's 1855 choice, not a modern
 * shortcut — despite being an English loanword, it is THE traditional pick
 * because native ঈ-initial Bengali words are genuinely rare, the same
 * category of decision Devanagari's own report already documents for
 * ঈ-equivalent trickier vowels).
 *
 * NON-INITIAL CHARACTERS (same "linguistic fact, not a research gap" framing
 * as Devanagari's ङ/ञ/ष/अः notes): ঙ, ঞ, ণ, ড়, ঢ়, য়, ৎ, ং, ঃ, ঁ — ten of
 * Bengali's 39 consonants — never or almost never begin a native Bengali
 * word. Each has a `note` explaining why its standard example word uses the
 * character medially/finally instead.
 *
 * A REAL BENGALI-SPECIFIC PRONUNCIATION NOTE (য়/গয়না vs. দ/জাহাজ ja): য
 * ("অন্তঃস্থ য" — antôsthô ja) is pronounced like জ (/dʒ/, "j") at the start
 * of a modern Bengali word — the Sanskrit semivowel "y" sound it
 * historically represented has shifted entirely onto the separate letter
 * য়, which only ever occurs medially/finally (গয়না, ময়না). This is a real,
 * commonly-taught fact of modern Bengali orthography (not a Hindi-derived
 * assumption ported over), flagged via `note` on both letters.
 */
export const BENGALI_CHARACTERS: ScriptCharacterData[] = [
  // ---- স্বরবর্ণ (vowels) — 11 ----
  { character: 'অ', characterType: 'vowel', romanization: 'ô', exampleWord: 'অজগর', exampleTransliteration: 'ojôgor', exampleGloss: 'python', sortOrder: 1 },
  { character: 'আ', characterType: 'vowel', romanization: 'a', exampleWord: 'আম', exampleTransliteration: 'aam', exampleGloss: 'mango', sortOrder: 2 },
  { character: 'ই', characterType: 'vowel', romanization: 'i', exampleWord: 'ইঁদুর', exampleTransliteration: 'idur', exampleGloss: 'mouse', sortOrder: 3 },
  { character: 'ঈ', characterType: 'vowel', romanization: 'ii', exampleWord: 'ঈগল', exampleTransliteration: 'eegol', exampleGloss: 'eagle', sortOrder: 4, note: 'Vidyasagar’s own 1855 Bornoparichay choice — an English loanword, but THE traditional pick since native ঈ-initial Bengali words are genuinely rare (same category of call as Devanagari’s trickier vowel picks).' },
  { character: 'উ', characterType: 'vowel', romanization: 'u', exampleWord: 'উট', exampleTransliteration: 'uT', exampleGloss: 'camel', sortOrder: 5 },
  { character: 'ঊ', characterType: 'vowel', romanization: 'uu', exampleWord: 'ঊষা', exampleTransliteration: 'usha', exampleGloss: 'dawn', sortOrder: 6 },
  { character: 'ঋ', characterType: 'vowel', romanization: 'ri', exampleWord: 'ঋষি', exampleTransliteration: 'rishi', exampleGloss: 'sage', sortOrder: 7 },
  { character: 'এ', characterType: 'vowel', romanization: 'e', exampleWord: 'এক্তারা', exampleTransliteration: 'ektara', exampleGloss: 'ektara (one-stringed folk instrument)', sortOrder: 8 },
  { character: 'ঐ', characterType: 'vowel', romanization: 'oi', exampleWord: 'ঐরাবত', exampleTransliteration: 'oirabot', exampleGloss: "Airavata (Indra's mythical elephant)", sortOrder: 9 },
  { character: 'ও', characterType: 'vowel', romanization: 'o', exampleWord: 'ওল', exampleTransliteration: 'ol', exampleGloss: 'elephant foot yam', sortOrder: 10 },
  { character: 'ঔ', characterType: 'vowel', romanization: 'ou', exampleWord: 'ঔষধ', exampleTransliteration: 'oushudh', exampleGloss: 'medicine', sortOrder: 11 },

  // ---- ব্যঞ্জনবর্ণ (consonants) — 5x5 varga + অন্তঃস্থ + উষ্ম + additional letters = 39 ----
  { character: 'ক', characterType: 'consonant', romanization: 'ka', exampleWord: 'কলম', exampleTransliteration: 'kolom', exampleGloss: 'pen', sortOrder: 12 },
  { character: 'খ', characterType: 'consonant', romanization: 'kha', exampleWord: 'খরগোশ', exampleTransliteration: 'khôrgosh', exampleGloss: 'rabbit', sortOrder: 13 },
  { character: 'গ', characterType: 'consonant', romanization: 'ga', exampleWord: 'গরু', exampleTransliteration: 'goru', exampleGloss: 'cow', sortOrder: 14 },
  { character: 'ঘ', characterType: 'consonant', romanization: 'gha', exampleWord: 'ঘড়ি', exampleTransliteration: 'ghôri', exampleGloss: 'clock/watch', sortOrder: 15 },
  { character: 'ঙ', characterType: 'consonant', romanization: 'nga', exampleWord: 'ব্যাঙ', exampleTransliteration: 'bæng', exampleGloss: 'frog', sortOrder: 16, note: 'ঙ does not occur word-initially in Bengali — ব্যাঙ is the standard mnemonic, with ঙ appearing finally, not initially.' },
  { character: 'চ', characterType: 'consonant', romanization: 'cha', exampleWord: 'চশমা', exampleTransliteration: 'chôshma', exampleGloss: 'spectacles', sortOrder: 17 },
  { character: 'ছ', characterType: 'consonant', romanization: 'chha', exampleWord: 'ছাতা', exampleTransliteration: 'chata', exampleGloss: 'umbrella', sortOrder: 18 },
  { character: 'জ', characterType: 'consonant', romanization: 'ja', exampleWord: 'জাহাজ', exampleTransliteration: 'jahaj', exampleGloss: 'ship', sortOrder: 19 },
  { character: 'ঝ', characterType: 'consonant', romanization: 'jha', exampleWord: 'ঝুড়ি', exampleTransliteration: 'jhuri', exampleGloss: 'basket', sortOrder: 20 },
  { character: 'ঞ', characterType: 'consonant', romanization: 'nya', exampleWord: 'মিঞা', exampleTransliteration: 'mia', exampleGloss: 'Mia (a respectful term of address)', sortOrder: 21, note: 'ঞ almost never occurs word-initially in Bengali — মিঞা is the standard mnemonic, medial rather than initial (same category as Devanagari’s ञ/यज्ञ).' },
  { character: 'ট', characterType: 'consonant', romanization: 'Ta', exampleWord: 'টিয়া', exampleTransliteration: 'Tia', exampleGloss: 'parakeet', sortOrder: 22 },
  { character: 'ঠ', characterType: 'consonant', romanization: 'Tha', exampleWord: 'ঠেলাগাড়ি', exampleTransliteration: 'Thelagari', exampleGloss: 'handcart', sortOrder: 23 },
  { character: 'ড', characterType: 'consonant', romanization: 'Da', exampleWord: 'ডিম', exampleTransliteration: 'Dim', exampleGloss: 'egg', sortOrder: 24 },
  { character: 'ঢ', characterType: 'consonant', romanization: 'Dha', exampleWord: 'ঢোল', exampleTransliteration: 'Dhol', exampleGloss: 'drum', sortOrder: 25 },
  { character: 'ণ', characterType: 'consonant', romanization: 'Na', exampleWord: 'হরিণ', exampleTransliteration: 'horin', exampleGloss: 'deer', sortOrder: 26, note: 'ণ rarely starts native Bengali words (mostly tatsama, medial) — হরিণ is the standard mnemonic, medial/final rather than initial (same category as Devanagari’s ण/गणेश).' },
  { character: 'ত', characterType: 'consonant', romanization: 'ta', exampleWord: 'তরমুজ', exampleTransliteration: 'tôrmuj', exampleGloss: 'watermelon', sortOrder: 27 },
  { character: 'থ', characterType: 'consonant', romanization: 'tha', exampleWord: 'থালা', exampleTransliteration: 'thala', exampleGloss: 'plate', sortOrder: 28 },
  { character: 'দ', characterType: 'consonant', romanization: 'da', exampleWord: 'দোয়েল', exampleTransliteration: 'doyel', exampleGloss: "magpie robin (Bangladesh's national bird)", sortOrder: 29 },
  { character: 'ধ', characterType: 'consonant', romanization: 'dha', exampleWord: 'ধান', exampleTransliteration: 'dhan', exampleGloss: 'paddy/rice (unharvested)', sortOrder: 30 },
  { character: 'ন', characterType: 'consonant', romanization: 'na', exampleWord: 'নৌকা', exampleTransliteration: 'nouka', exampleGloss: 'boat', sortOrder: 31 },
  { character: 'প', characterType: 'consonant', romanization: 'pa', exampleWord: 'পায়রা', exampleTransliteration: 'payra', exampleGloss: 'pigeon', sortOrder: 32 },
  { character: 'ফ', characterType: 'consonant', romanization: 'pha', exampleWord: 'ফল', exampleTransliteration: 'phôl', exampleGloss: 'fruit', sortOrder: 33 },
  { character: 'ব', characterType: 'consonant', romanization: 'ba', exampleWord: 'বাঘ', exampleTransliteration: 'bagh', exampleGloss: 'tiger', sortOrder: 34 },
  { character: 'ভ', characterType: 'consonant', romanization: 'bha', exampleWord: 'ভাল্লুক', exampleTransliteration: 'bhalluk', exampleGloss: 'bear', sortOrder: 35 },
  { character: 'ম', characterType: 'consonant', romanization: 'ma', exampleWord: 'ময়ূর', exampleTransliteration: 'moyur', exampleGloss: 'peacock', sortOrder: 36 },
  { character: 'য', characterType: 'consonant', romanization: 'ja', exampleWord: 'যব', exampleTransliteration: 'jôb', exampleGloss: 'barley', sortOrder: 37, note: 'য ("antôsthô ja") is pronounced like জ (/j~dʒ/, "j") word-initially in modern Bengali, not the Sanskrit semivowel "y" — that true glide sound shifted onto the separate letter য়, which only occurs medially/finally (see sortOrder 46).' },
  { character: 'র', characterType: 'consonant', romanization: 'ra', exampleWord: 'রাজহাঁস', exampleTransliteration: 'rajhans', exampleGloss: 'swan/goose', sortOrder: 38 },
  { character: 'ল', characterType: 'consonant', romanization: 'la', exampleWord: 'লিচু', exampleTransliteration: 'lichu', exampleGloss: 'lychee', sortOrder: 39 },
  { character: 'শ', characterType: 'consonant', romanization: 'sha', exampleWord: 'শাপলা', exampleTransliteration: 'shapla', exampleGloss: "water lily (Bangladesh's national flower)", sortOrder: 40 },
  { character: 'ষ', characterType: 'consonant', romanization: 'Sha', exampleWord: 'ষাঁড়', exampleTransliteration: 'shanr', exampleGloss: 'bull', sortOrder: 41 },
  { character: 'স', characterType: 'consonant', romanization: 'sa', exampleWord: 'সিংহ', exampleTransliteration: 'shingho', exampleGloss: 'lion', sortOrder: 42 },
  { character: 'হ', characterType: 'consonant', romanization: 'ha', exampleWord: 'হাঁস', exampleTransliteration: 'hans', exampleGloss: 'duck', sortOrder: 43 },
  { character: 'ড়', characterType: 'consonant', romanization: 'Ra', exampleWord: 'গাড়ি', exampleTransliteration: 'gari', exampleGloss: 'car/vehicle', sortOrder: 44, note: 'ড় never occurs word-initially in Bengali (confirmed: it is orthographically restricted to medial/final position) — গাড়ি is the standard mnemonic.' },
  { character: 'ঢ়', characterType: 'consonant', romanization: 'Rha', exampleWord: 'আষাঢ়', exampleTransliteration: 'asharh', exampleGloss: 'Ashadh (the Bengali monsoon month)', sortOrder: 45, note: 'ঢ় never occurs word-initially in Bengali — occurs only medially/finally, e.g. আষাঢ়, গাঢ় (dark/deep).' },
  { character: 'য়', characterType: 'consonant', romanization: 'ya', exampleWord: 'গয়না', exampleTransliteration: 'gôyna', exampleGloss: 'jewelry/ornaments', sortOrder: 46, note: 'য় never occurs word-initially — it is the true /y/-glide (see sortOrder 37’s note on য), occurring only medially/finally, e.g. গয়না, ময়না.' },
  { character: 'ৎ', characterType: 'consonant', romanization: 't', exampleWord: 'সৎ', exampleTransliteration: 'shôt', exampleGloss: 'honest/virtuous', sortOrder: 47, note: 'খণ্ড-ত ("broken ta") is restricted by Bengali orthographic rule to word-FINAL position only — unlike every other consonant here, it can never begin or occur inside a word.' },
  { character: 'ং', characterType: 'consonant', romanization: 'ng', exampleWord: 'অংক', exampleTransliteration: 'ôngko', exampleGloss: 'number/arithmetic', sortOrder: 48, note: 'অনুস্বার (anusvara) always follows a vowel and cannot itself begin a word — অ begins অংক, not ং.' },
  { character: 'ঃ', characterType: 'consonant', romanization: 'h', exampleWord: 'দুঃখ', exampleTransliteration: 'dukkho', exampleGloss: 'sorrow', sortOrder: 49, note: 'বিসর্গ (visarga) essentially never begins a word — দুঃখ is the standard example (same word Devanagari uses for its own अः), medial rather than initial.' },
  { character: 'ঁ', characterType: 'consonant', romanization: 'n', exampleWord: 'বাঁশি', exampleTransliteration: 'banshi', exampleGloss: 'flute', sortOrder: 50, note: 'চন্দ্রবিন্দু (chandrabindu) is a nasalization mark over a vowel, never a word-initial sound on its own.' },

  // ---- যুক্তাক্ষর (conjuncts) — same "3 most standard, not exhaustive" precedent as Devanagari ----
  { character: 'ক্ষ', characterType: 'conjunct', romanization: 'kkha', exampleWord: 'ক্ষমা', exampleTransliteration: 'kkhôma', exampleGloss: 'forgiveness', sortOrder: 51 },
  { character: 'ত্র', characterType: 'conjunct', romanization: 'tro', exampleWord: 'ত্রিকোণ', exampleTransliteration: 'trikon', exampleGloss: 'triangle', sortOrder: 52 },
  { character: 'জ্ঞ', characterType: 'conjunct', romanization: 'gæ', exampleWord: 'জ্ঞান', exampleTransliteration: 'gæan', exampleGloss: 'knowledge', sortOrder: 53 },
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

  // ---- round numbers 25–1000, added in the follow-on pass (2026-08-03) ----
  // Words verified against standard Hindi counting (school/textbook forms),
  // same rigor as the Aksharmala data.ts sourcing comments. Object motifs
  // deliberately avoid every object already used above (mangoes, bananas,
  // apples, kites, stars, marigolds, seashells, balloons, leaves, marbles,
  // buttons, pebbles, berries, coins, candies, beads, peanuts, grapes, paper
  // boats, paper lanterns) so no round-number image looks like a re-roll of
  // an existing 1–20 card.
  { itemKey: '25', englishWord: 'Twenty-Five', text: 'पच्चीस', transliteration: 'pachchis', objectDescription: 'bright yellow sunflowers' },
  { itemKey: '30', englishWord: 'Thirty', text: 'तीस', transliteration: 'tees', objectDescription: 'red cricket balls' },
  { itemKey: '40', englishWord: 'Forty', text: 'चालीस', transliteration: 'chaalis', objectDescription: 'lit clay oil lamps (diyas)' },
  { itemKey: '50', englishWord: 'Fifty', text: 'पचास', transliteration: 'pachaas', objectDescription: 'colourful wooden toy blocks' },
  { itemKey: '60', englishWord: 'Sixty', text: 'साठ', transliteration: 'saath', objectDescription: 'spinning paper pinwheels' },
  { itemKey: '70', englishWord: 'Seventy', text: 'सत्तर', transliteration: 'sattar', objectDescription: 'orange-and-black butterflies' },
  { itemKey: '80', englishWord: 'Eighty', text: 'अस्सी', transliteration: 'assi', objectDescription: 'small open umbrellas' },
  { itemKey: '90', englishWord: 'Ninety', text: 'नब्बे', transliteration: 'nabbe', objectDescription: 'spinning wooden tops' },
  { itemKey: '100', englishWord: 'One Hundred', text: 'सौ', transliteration: 'sau', objectDescription: 'small brass bells' },
  { itemKey: '200', englishWord: 'Two Hundred', text: 'दो सौ', transliteration: 'do sau', objectDescription: 'glass bangles' },
  { itemKey: '500', englishWord: 'Five Hundred', text: 'पांच सौ', transliteration: 'paanch sau', objectDescription: 'polished gemstones' },
  { itemKey: '1000', englishWord: 'One Thousand', text: 'हज़ार', transliteration: 'hazaar', objectDescription: 'bursting firework sparks' },
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

/**
 * Three new categories added in the follow-on pass (2026-08-03), reusing
 * `FamilyItem`'s exact shape rather than inventing a new interface per
 * category — the image-prompt need (a single depicted subject description)
 * is identical across Food & Drink, Animals, and Colours. For Colours,
 * `imageSubject` holds a precise colour description (with a familiar
 * reference object) instead of a figure description — see
 * `colourImagePrompt` in `convex/fal/vocabularyImages.ts`.
 *
 * Words are everyday/common Hindi vocabulary, same bar as `FAMILY` — verified
 * against standard usage, not invented. Overlap with Aksharmala example words
 * (रोटी, फल, गाय, बकरी, हाथी, शेर, मछली, खरगोश) is intentional and harmless:
 * two separate tables, no shared dependency, and using the most natural,
 * common word for each concept matters more than avoiding incidental overlap.
 */
export const FOOD_DRINK: FamilyItem[] = [
  { itemKey: 'water', englishWord: 'Water', text: 'पानी', transliteration: 'paani', imageSubject: 'a clear glass full of water, condensation droplets on the outside' },
  { itemKey: 'milk', englishWord: 'Milk', text: 'दूध', transliteration: 'doodh', imageSubject: 'a glass full of white milk' },
  { itemKey: 'tea', englishWord: 'Tea', text: 'चाय', transliteration: 'chai', imageSubject: 'a small clay kulhad cup of steaming milky tea' },
  { itemKey: 'bread', englishWord: 'Bread (flatbread)', text: 'रोटी', transliteration: 'roti', imageSubject: 'a single round, completely FLAT, thin unleavened Indian flatbread (roti/chapati) lying flat on a small plate, lightly browned with a few small charred bubble spots on its flat surface — critically NOT a cookie, NOT a biscuit, NOT raised or domed, no chocolate chips or dots, no thickness, perfectly flat like a thin pancake' },
  { itemKey: 'rice', englishWord: 'Rice', text: 'चावल', transliteration: 'chaaval', imageSubject: 'a small bowl heaped with cooked white rice' },
  { itemKey: 'lentils', englishWord: 'Lentils', text: 'दाल', transliteration: 'daal', imageSubject: 'a small bowl of yellow lentil soup with a wisp of steam' },
  { itemKey: 'vegetable-curry', englishWord: 'Vegetable / Curry', text: 'सब्ज़ी', transliteration: 'sabzi', imageSubject: 'a small bowl of colourful mixed vegetable curry' },
  { itemKey: 'fruit', englishWord: 'Fruit', text: 'फल', transliteration: 'phal', imageSubject: 'a small woven basket of assorted fresh fruits' },
  { itemKey: 'sugar', englishWord: 'Sugar', text: 'चीनी', transliteration: 'cheeni', imageSubject: 'a small bowl of white sugar crystals with a spoon resting in it' },
  { itemKey: 'salt', englishWord: 'Salt', text: 'नमक', transliteration: 'namak', imageSubject: 'a small bowl of fine white salt with a pinch being sprinkled above it' },
  { itemKey: 'egg', englishWord: 'Egg', text: 'अंडा', transliteration: 'anda', imageSubject: 'a single whole brown egg standing upright' },
  { itemKey: 'sweet', englishWord: 'Sweet (dessert)', text: 'मिठाई', transliteration: 'mithai', imageSubject: 'a small plate holding two or three round Indian sweets, laddoo-shaped' },
  { itemKey: 'breakfast', englishWord: 'Breakfast', text: 'नाश्ता', transliteration: 'naashta', imageSubject: 'a small plate with a folded paratha beside a cup of tea' },
  { itemKey: 'banana', englishWord: 'Banana', text: 'केला', transliteration: 'kela', imageSubject: 'a single ripe yellow banana' },
  { itemKey: 'apple', englishWord: 'Apple', text: 'सेब', transliteration: 'seb', imageSubject: 'a single glossy red apple' },
];

export const ANIMALS: FamilyItem[] = [
  { itemKey: 'dog', englishWord: 'Dog', text: 'कुत्ता', transliteration: 'kutta', imageSubject: 'a single friendly brown-and-white dog sitting, tail up, side view' },
  { itemKey: 'cat', englishWord: 'Cat', text: 'बिल्ली', transliteration: 'billi', imageSubject: 'a single sitting cat with orange-and-white fur, side view' },
  { itemKey: 'cow', englishWord: 'Cow', text: 'गाय', transliteration: 'gaay', imageSubject: 'a single brown-and-white cow standing, side view' },
  { itemKey: 'goat', englishWord: 'Goat', text: 'बकरी', transliteration: 'bakri', imageSubject: 'a single white goat standing, small horns, side view' },
  { itemKey: 'buffalo', englishWord: 'Buffalo', text: 'भैंस', transliteration: 'bhains', imageSubject: 'a single dark grey water buffalo standing, curved horns, side view' },
  { itemKey: 'horse', englishWord: 'Horse', text: 'घोड़ा', transliteration: 'ghoda', imageSubject: 'a single brown horse standing, side view' },
  { itemKey: 'elephant', englishWord: 'Elephant', text: 'हाथी', transliteration: 'haathi', imageSubject: 'a single grey elephant standing, ears spread, trunk down, side view' },
  { itemKey: 'lion', englishWord: 'Lion', text: 'शेर', transliteration: 'sher', imageSubject: 'a single lion sitting upright, full golden mane, front-facing' },
  { itemKey: 'monkey', englishWord: 'Monkey', text: 'बंदर', transliteration: 'bandar', imageSubject: 'a single brown monkey sitting, holding a banana, side view' },
  { itemKey: 'bird', englishWord: 'Bird', text: 'चिड़िया', transliteration: 'chidiya', imageSubject: 'a single small colourful songbird perched on a thin branch' },
  { itemKey: 'fish', englishWord: 'Fish', text: 'मछली', transliteration: 'machli', imageSubject: 'a single blue-and-gold fish swimming, side view' },
  { itemKey: 'hen', englishWord: 'Hen', text: 'मुर्गी', transliteration: 'murgi', imageSubject: 'a single brown hen standing, red comb, side view' },
  { itemKey: 'sheep', englishWord: 'Sheep', text: 'भेड़', transliteration: 'bhed', imageSubject: 'a single fluffy white sheep standing, side view' },
  { itemKey: 'camel', englishWord: 'Camel', text: 'ऊंट', transliteration: 'oont', imageSubject: 'a single camel standing, one hump, side view' },
  { itemKey: 'rabbit', englishWord: 'Rabbit', text: 'खरगोश', transliteration: 'khargosh', imageSubject: 'a single white rabbit sitting, long upright ears, side view' },
];

/**
 * `imageSubject` here is a precise COLOUR description (hue + a familiar
 * reference object), not a figure — `colourImagePrompt` builds the actual
 * prompt from `englishWord` (the colour name) + this description. Includes
 * both सुनहरा (golden) and स्लेटी (grey) rather than picking one, to reach
 * 12 genuinely common everyday colour words without stretching to a rarer
 * shade name.
 */
export const COLOURS: FamilyItem[] = [
  { itemKey: 'red', englishWord: 'Red', text: 'लाल', transliteration: 'laal', imageSubject: 'a vivid true red, like a ripe tomato or a red rose' },
  { itemKey: 'blue', englishWord: 'Blue', text: 'नीला', transliteration: 'neela', imageSubject: 'a vivid true blue, like a clear daytime sky or a blue jay feather' },
  { itemKey: 'yellow', englishWord: 'Yellow', text: 'पीला', transliteration: 'peela', imageSubject: 'a vivid true yellow, like a ripe lemon or a sunflower petal' },
  { itemKey: 'green', englishWord: 'Green', text: 'हरा', transliteration: 'hara', imageSubject: 'a vivid true green, like a fresh leaf or a green apple' },
  { itemKey: 'black', englishWord: 'Black', text: 'काला', transliteration: 'kaala', imageSubject: "a deep true black, like a crow's feathers or a smooth black stone" },
  { itemKey: 'white', englishWord: 'White', text: 'सफ़ेद', transliteration: 'safed', imageSubject: 'a clean true white, like fresh milk or a white flower petal, softly shaded with a gentle shadow so it reads clearly against the warm background' },
  { itemKey: 'pink', englishWord: 'Pink', text: 'गुलाबी', transliteration: 'gulaabi', imageSubject: 'a vivid true pink, like a pink lotus or a pink rose' },
  { itemKey: 'orange', englishWord: 'Orange', text: 'नारंगी', transliteration: 'naarangi', imageSubject: 'a vivid true orange, like a ripe orange fruit or a marigold flower' },
  { itemKey: 'brown', englishWord: 'Brown', text: 'भूरा', transliteration: 'bhoora', imageSubject: 'a warm true brown, like roasted chestnuts or rich soil' },
  { itemKey: 'purple', englishWord: 'Purple', text: 'बैंगनी', transliteration: 'baingani', imageSubject: 'a vivid true purple, like a ripe eggplant (baingan) or a bunch of purple grapes' },
  { itemKey: 'golden', englishWord: 'Golden', text: 'सुनहरा', transliteration: 'sunahara', imageSubject: 'a shimmering metallic gold with bright specular highlights and a reflective sheen — critically different from plain matte yellow: it must look like polished metal (a gold bangle or a gold coin), with visible shine/glint, not a flat yellow blob' },
  { itemKey: 'grey', englishWord: 'Grey', text: 'स्लेटी', transliteration: 'sleti', imageSubject: "a neutral true grey, like a stone slate or an elephant's skin" },
];

/**
 * Body Parts (2026-08-03, second follow-on pass). `imageSubject` here
 * describes a single ISOLATED body part in close-up (an eye, a hand, a bent
 * knee) rather than a whole figure — see `bodyPartImagePrompt` in
 * `convex/fal/vocabularyImages.ts` for why: a whole-body illustration would
 * bury the specific part being taught and risks reading as a copy of the
 * locked four-character cast, which this content type must never do (see
 * `familyIconPrompt`'s own "generic, not a specific character" discipline).
 * Every `imageSubject` below is deliberately generic/faceless-adjacent (no
 * hairstyle/skin-tone/outfit detail that would tie it to a person) for the
 * same reason.
 *
 * Words verified against standard everyday Hindi (school-level body-part
 * vocabulary, not medical/literary terms). `leg`'s English label covers both
 * senses (पैर means leg/foot together in everyday Hindi, no separate common
 * word for just "foot") — same dual-naming convention as `FOOD_DRINK`'s
 * "Vegetable / Curry".
 */
export const BODY_PARTS: FamilyItem[] = [
  { itemKey: 'eye', englishWord: 'Eye', text: 'आंख', transliteration: 'aankh', imageSubject: 'a single human eye in close-up, with eyebrow, iris, and eyelashes clearly visible, isolated on a plain background, no other facial features' },
  { itemKey: 'ear', englishWord: 'Ear', text: 'कान', transliteration: 'kaan', imageSubject: 'a single human ear in side-profile close-up, isolated on a plain background, no other facial features' },
  { itemKey: 'nose', englishWord: 'Nose', text: 'नाक', transliteration: 'naak', imageSubject: 'a single human nose in side-profile close-up, isolated on a plain background, no other facial features' },
  { itemKey: 'mouth', englishWord: 'Mouth', text: 'मुंह', transliteration: 'munh', imageSubject: 'a single human mouth with a warm closed-lip smile, lips only in close-up, isolated on a plain background, no teeth visible, no other facial features' },
  { itemKey: 'hand', englishWord: 'Hand', text: 'हाथ', transliteration: 'haath', imageSubject: 'a single open human hand, palm facing forward, fingers spread naturally, isolated on a plain background, cropped at the wrist' },
  { itemKey: 'leg', englishWord: 'Leg / Foot', text: 'पैर', transliteration: 'pair', imageSubject: 'a single human leg from the knee down to a bare foot, isolated on a plain background, standing pose, cropped above the knee' },
  { itemKey: 'head', englishWord: 'Head', text: 'सिर', transliteration: 'sir', imageSubject: 'a simple, generic human head and face in three-quarter view, neutral warm expression, isolated on a plain background, cropped at the neck — deliberately generic and not resembling any specific named character' },
  { itemKey: 'hair', englishWord: 'Hair', text: 'बाल', transliteration: 'baal', imageSubject: 'the top and back of a generic human head, showing thick, neatly combed dark hair in close-up, isolated on a plain background, no face visible' },
  { itemKey: 'teeth', englishWord: 'Teeth', text: 'दांत', transliteration: 'daant', imageSubject: 'a single open smiling human mouth in close-up showing a clean row of white teeth clearly, isolated on a plain background, no other facial features' },
  { itemKey: 'tongue', englishWord: 'Tongue', text: 'जीभ', transliteration: 'jeebh', imageSubject: 'a single open human mouth in close-up with the tongue clearly visible and slightly extended, isolated on a plain background, no other facial features' },
  { itemKey: 'stomach', englishWord: 'Stomach', text: 'पेट', transliteration: 'pet', imageSubject: 'a simple generic human torso from chest to waist, one hand resting gently on the stomach area, isolated on a plain background, cropped above and below, no face' },
  { itemKey: 'back', englishWord: 'Back', text: 'पीठ', transliteration: 'peeth', imageSubject: 'a simple generic human figure seen entirely from behind, showing the upper back and shoulders, isolated on a plain background, no face visible' },
  { itemKey: 'finger', englishWord: 'Finger', text: 'उंगली', transliteration: 'ungli', imageSubject: 'a single human hand with only the index finger extended upward and the other fingers curled into the palm, isolated on a plain background, cropped at the wrist' },
  { itemKey: 'knee', englishWord: 'Knee', text: 'घुटना', transliteration: 'ghutna', imageSubject: 'a person kneeling on one bent leg wearing casual trousers, the fabric creasing over the knee joint which is clearly the focal point, isolated on a plain background' },
  { itemKey: 'shoulder', englishWord: 'Shoulder', text: 'कंधा', transliteration: 'kandha', imageSubject: 'a simple generic human upper torso and neck from the front, one shoulder clearly the focal point, isolated on a plain background, cropped below the chest, no face' },
];

/**
 * Household Items (2026-08-03, second follow-on pass). `imageSubject`
 * describes a single everyday household object — same "one clearly
 * recognizable item, centered, no clutter" discipline as `FOOD_DRINK`, via
 * `householdItemImagePrompt` (see `convex/fal/vocabularyImages.ts`).
 *
 * Deliberate overlap with existing Aksharmala example words (घड़ी/clock,
 * थाली/plate, चम्मच/spoon, दरवाज़ा/door) is intentional and harmless — same
 * "most natural common word matters more than avoiding incidental overlap"
 * reasoning already established for Food & Drink/Animals/Colours.
 */
export const HOUSEHOLD_ITEMS: FamilyItem[] = [
  { itemKey: 'door', englishWord: 'Door', text: 'दरवाज़ा', transliteration: 'darwaza', imageSubject: 'a single closed wooden door with a round doorknob, viewed straight-on' },
  { itemKey: 'window', englishWord: 'Window', text: 'खिड़की', transliteration: 'khidki', imageSubject: 'a single window with visible panes and simple hanging curtains on either side, viewed straight-on' },
  { itemKey: 'key', englishWord: 'Key', text: 'चाबी', transliteration: 'chaabi', imageSubject: 'a single old-fashioned metal door key, lying flat' },
  { itemKey: 'lock', englishWord: 'Lock', text: 'ताला', transliteration: 'taala', imageSubject: 'a single closed metal padlock with its shackle through a hasp' },
  { itemKey: 'broom', englishWord: 'Broom', text: 'झाड़ू', transliteration: 'jhaadu', imageSubject: 'a single traditional soft natural-fiber broom (jhadu), bristles down, leaning at a slight angle' },
  { itemKey: 'spoon', englishWord: 'Spoon', text: 'चम्मच', transliteration: 'chammach', imageSubject: 'a single metal serving spoon, lying flat, bowl of the spoon clearly visible' },
  { itemKey: 'plate', englishWord: 'Plate', text: 'थाली', transliteration: 'thali', imageSubject: 'a single round empty metal thali plate, viewed from above' },
  { itemKey: 'clock', englishWord: 'Clock', text: 'घड़ी', transliteration: 'ghadi', imageSubject: 'a single round wall clock with visible hour and minute hands, using simple tick marks around the rim instead of printed numerals' },
  { itemKey: 'fan', englishWord: 'Fan', text: 'पंखा', transliteration: 'pankha', imageSubject: 'a single ceiling fan with three blades, viewed from directly below' },
  { itemKey: 'bucket', englishWord: 'Bucket', text: 'बाल्टी', transliteration: 'baalti', imageSubject: 'a single plastic bucket with a carrying handle, viewed from the side' },
  { itemKey: 'soap', englishWord: 'Soap', text: 'साबुन', transliteration: 'saabun', imageSubject: 'a wet oval bar of soap covered in soap bubbles and lather, viewed at a three-quarter angle so no flat face is presented directly to camera, sitting in a small soap dish' },
  { itemKey: 'towel', englishWord: 'Towel', text: 'तौलिया', transliteration: 'tauliya', imageSubject: 'a single neatly folded cloth towel with a striped border' },
  { itemKey: 'pillow', englishWord: 'Pillow', text: 'तकिया', transliteration: 'takiya', imageSubject: 'a single soft rectangular bed pillow with a plain pillowcase, no fabric tag, label, or stitched brand mark anywhere on it' },
  { itemKey: 'blanket', englishWord: 'Blanket', text: 'कंबल', transliteration: 'kambal', imageSubject: 'a single neatly folded warm woolen blanket' },
  { itemKey: 'knife', englishWord: 'Knife', text: 'चाकू', transliteration: 'chaaku', imageSubject: 'a single kitchen knife with a completely plain, unmarked blade (no engraving, no logo, no brand text) and a plain handle, resting on a small wooden cutting board' },
];
