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
  /**
   * Optional (matches `schema.ts`'s own `v.optional` on this field — "not
   * every character... needs one") since Meetei Mayek genuinely has letters
   * with no confidently-attested example word rather than a forced/guessed
   * one — see `MEETEI_CHARACTERS`'s header. Every other script in this
   * pipeline happens to have one for every row, but the type was never
   * meant to require that.
   */
  exampleWord?: string;
  exampleTransliteration?: string;
  sortOrder: number;
  /** English gloss of the example word — for the review report only, not stored. */
  exampleGloss?: string;
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

/**
 * Tamil (`script: 'tamil'` in `@sarvabhasha/shared`'s `languages.ts`) — the
 * THIRD script authored through this pipeline (2026-08-04), for the `ta`
 * live language. Unlike Devanagari/Bengali, this pass had no live WebSearch
 * verification available for the earlier two scripts' sourcing — this one
 * does, and every structural claim below was checked against real sources
 * (Wikiversity's Tamil Language/Letters, Remitly's Tamil Alphabet guide,
 * and a dedicated search on Tamil's word-initial restrictions), not drafted
 * from memory alone and asserted as verified.
 *
 * SOURCING: Tamil's own traditional count is 12 உயிரெழுத்து (uyir eluttu,
 * "life letters" = vowels) + 18 மெய்யெழுத்து (mei eluttu, "body letters" =
 * consonants) + 1 ஆயுத எழுத்து (aytham/āytham, a unique Tamil grapheme with
 * no vowel/consonant/conjunct equivalent in the other scripts this project
 * has authored) = 31 "Mutal Elutukkal" (primary letters) — confirmed
 * consistent across Wikiversity and multiple Tamil-language teaching sites.
 * On top of these 31, this dataset adds all 6 GRANTHA consonants (ஜ ஶ ஷ ஸ ஹ
 * க்ஷ) — borrowed from the historical Grantha script specifically to write
 * Sanskrit/English loanwords Tamil's native 18 consonants can't represent
 * (confirmed via Talkpal's "What are the Grantha letters" and Omniglot) —
 * for 37 characters total. Unlike Devanagari/Bengali's "3 most common
 * conjuncts, not exhaustive" precedent, ALL 6 grantha letters are included
 * here since they're a small, closed, well-defined set (not an open-ended
 * combinatoric space the way conjuncts are), and every one is genuinely
 * common in everyday modern Tamil (ஜன்னல்/window, ஹோட்டல்/hotel).
 *
 * NO Devanagari/Bengali-style word-initial "1 core vowel + 2 special marks"
 * grouping applies here — Tamil has no anusvara/visarga/chandrabindu
 * equivalent; all 12 vowels are genuinely independent letters.
 *
 * MNEMONIC CONVENTION: no confirmed single-word Tamil equivalent of Hindi's
 * "से"/Bengali's "এ" connector was found or is claimed here. Per
 * `MNEMONIC_CONNECTOR`'s own documented discipline ("a known-mediocre-but-
 * honest result is better than silently mixing in a word from a convention
 * that doesn't apply"), `ta` has NO entry in that map — `buildSynthesisText`
 * falls back to bare "<character> <exampleWord>" juxtaposition for Tamil
 * (see that function's updated doc comment), not a fabricated connector.
 *
 * WORD-INITIAL RESTRICTION (a real, well-documented rule of Tamil
 * orthography, confirmed via a dedicated search — not assumed by analogy
 * with Devanagari/Bengali's much smaller "rarely initial" sets): SIX
 * consonants — ங, ண, ழ, ள, ற, ன — can NEVER begin a native Tamil word,
 * regardless of vowel. This is a larger, harder restriction than either
 * other script authored so far (Devanagari: 4 letters "rarely" initial;
 * Bengali: 10, but softer "almost never" wording) — Tamil's rule is
 * absolute. Every one of these 6 has a `note` explaining its medial/final
 * standard example instead. ஞ is NOT in this restricted set (ஞாயிறு/sun and
 * ஞானம்/wisdom both genuinely begin with ஞ) — confirmed independently, not
 * assumed from Devanagari's ञ having the opposite restriction.
 */
export const TAMIL_CHARACTERS: ScriptCharacterData[] = [
  // ---- உயிரெழுத்து (uyir eluttu, vowels) — 12 ----
  { character: 'அ', characterType: 'vowel', romanization: 'a', exampleWord: 'அம்மா', exampleTransliteration: 'ammaa', exampleGloss: 'mother', sortOrder: 1 },
  { character: 'ஆ', characterType: 'vowel', romanization: 'aa', exampleWord: 'ஆடு', exampleTransliteration: 'aadu', exampleGloss: 'goat', sortOrder: 2 },
  { character: 'இ', characterType: 'vowel', romanization: 'i', exampleWord: 'இலை', exampleTransliteration: 'ilai', exampleGloss: 'leaf', sortOrder: 3 },
  { character: 'ஈ', characterType: 'vowel', romanization: 'ii', exampleWord: 'ஈ', exampleTransliteration: 'ii', exampleGloss: 'housefly', sortOrder: 4, note: 'A rare case where the example word IS the letter itself (long ஈ, pronounced "ee") — ஈ is the actual Tamil word for "housefly", a well-known self-referential primer mnemonic.' },
  { character: 'உ', characterType: 'vowel', romanization: 'u', exampleWord: 'உலகம்', exampleTransliteration: 'ulagam', exampleGloss: 'world', sortOrder: 5 },
  { character: 'ஊ', characterType: 'vowel', romanization: 'uu', exampleWord: 'ஊஞ்சல்', exampleTransliteration: 'oonjal', exampleGloss: 'swing', sortOrder: 6 },
  { character: 'எ', characterType: 'vowel', romanization: 'e', exampleWord: 'எலி', exampleTransliteration: 'eli', exampleGloss: 'mouse/rat', sortOrder: 7 },
  { character: 'ஏ', characterType: 'vowel', romanization: 'ee', exampleWord: 'ஏணி', exampleTransliteration: 'yeni', exampleGloss: 'ladder', sortOrder: 8 },
  { character: 'ஐ', characterType: 'vowel', romanization: 'ai', exampleWord: 'ஐந்து', exampleTransliteration: 'aindhu', exampleGloss: 'five', sortOrder: 9 },
  { character: 'ஒ', characterType: 'vowel', romanization: 'o', exampleWord: 'ஒட்டகம்', exampleTransliteration: 'ottagam', exampleGloss: 'camel', sortOrder: 10 },
  { character: 'ஓ', characterType: 'vowel', romanization: 'oo', exampleWord: 'ஓநாய்', exampleTransliteration: 'onaai', exampleGloss: 'wolf', sortOrder: 11 },
  { character: 'ஔ', characterType: 'vowel', romanization: 'au', exampleWord: 'ஔடதம்', exampleTransliteration: 'audhadham', exampleGloss: 'medicine', sortOrder: 12, note: 'ஔ is Tamil’s rarest vowel, occurring almost exclusively in Sanskrit loanwords — "medicine" is, notably, also the standard textbook example for this exact vowel’s equivalent in both Devanagari (औ) and Bengali (ঔ), a genuine cross-script pattern, not a coincidence invented for this dataset.' },

  // ---- மெய்யெழுத்து (mei eluttu, consonants) — 18 ----
  { character: 'க', characterType: 'consonant', romanization: 'ka', exampleWord: 'கண்', exampleTransliteration: 'kan', exampleGloss: 'eye', sortOrder: 13 },
  { character: 'ங', characterType: 'consonant', romanization: 'nga', exampleWord: 'பொங்கல்', exampleTransliteration: 'pongal', exampleGloss: 'Pongal (harvest festival / sweet rice dish)', sortOrder: 14, note: 'ங can NEVER begin a native Tamil word (a confirmed, absolute orthographic rule, not a "rarely" case) — பொங்கல் is the standard medial example.' },
  { character: 'ச', characterType: 'consonant', romanization: 'cha', exampleWord: 'சட்டை', exampleTransliteration: 'chattai', exampleGloss: 'shirt', sortOrder: 15 },
  { character: 'ஞ', characterType: 'consonant', romanization: 'nya', exampleWord: 'ஞாயிறு', exampleTransliteration: 'gnaayiru', exampleGloss: 'sun / Sunday', sortOrder: 16, note: 'Unlike its 5 fellow "never-initial" restricted consonants (ங/ண/ழ/ள/ற/ன), ஞ genuinely CAN begin a word — ஞாயிறு and ஞானம் (wisdom) both start with ஞ natively, confirmed independently rather than assumed by analogy with Devanagari’s ञ (which has the opposite restriction).' },
  { character: 'ட', characterType: 'consonant', romanization: 'Ta', exampleWord: 'டப்பா', exampleTransliteration: 'dabbaa', exampleGloss: 'box/tin', sortOrder: 17 },
  { character: 'ண', characterType: 'consonant', romanization: 'Na', exampleWord: 'வெண்ணை', exampleTransliteration: 'vennai', exampleGloss: 'butter', sortOrder: 18, note: 'ண can NEVER begin a native Tamil word (confirmed absolute rule) — வெண்ணை is the standard medial example.' },
  { character: 'த', characterType: 'consonant', romanization: 'ta', exampleWord: 'தமிழ்', exampleTransliteration: 'tamizh', exampleGloss: 'Tamil (the language itself)', sortOrder: 19 },
  { character: 'ந', characterType: 'consonant', romanization: 'na', exampleWord: 'நிலா', exampleTransliteration: 'nilaa', exampleGloss: 'moon', sortOrder: 20 },
  { character: 'ப', characterType: 'consonant', romanization: 'pa', exampleWord: 'பால்', exampleTransliteration: 'paal', exampleGloss: 'milk', sortOrder: 21 },
  { character: 'ம', characterType: 'consonant', romanization: 'ma', exampleWord: 'மலர்', exampleTransliteration: 'malar', exampleGloss: 'flower', sortOrder: 22 },
  { character: 'ய', characterType: 'consonant', romanization: 'ya', exampleWord: 'யானை', exampleTransliteration: 'yaanai', exampleGloss: 'elephant', sortOrder: 23 },
  { character: 'ர', characterType: 'consonant', romanization: 'ra', exampleWord: 'ரோஜா', exampleTransliteration: 'rojaa', exampleGloss: 'rose', sortOrder: 24 },
  { character: 'ல', characterType: 'consonant', romanization: 'la', exampleWord: 'லட்டு', exampleTransliteration: 'laddu', exampleGloss: 'laddu (a round Indian sweet)', sortOrder: 25 },
  { character: 'வ', characterType: 'consonant', romanization: 'va', exampleWord: 'வண்டி', exampleTransliteration: 'vandi', exampleGloss: 'cart/vehicle', sortOrder: 26 },
  { character: 'ழ', characterType: 'consonant', romanization: 'zha', exampleWord: 'பழம்', exampleTransliteration: 'pazham', exampleGloss: 'fruit', sortOrder: 27, note: 'ழ can NEVER begin a native Tamil word (confirmed absolute rule) — பழம் is the standard medial example. தமிழ் itself (sortOrder 19’s example word) also contains ழ medially.' },
  { character: 'ள', characterType: 'consonant', romanization: 'La', exampleWord: 'தளம்', exampleTransliteration: 'thalam', exampleGloss: 'platform/level', sortOrder: 28, note: 'ள can NEVER begin a native Tamil word (confirmed absolute rule) — தளம் is the standard medial example.' },
  { character: 'ற', characterType: 'consonant', romanization: 'Ra', exampleWord: 'ஆறு', exampleTransliteration: 'aaru', exampleGloss: 'river / six', sortOrder: 29, note: 'ற can NEVER begin a native Tamil word (confirmed absolute rule, holding even for loanwords/onomatopoeia) — ஆறு is the standard medial example.' },
  { character: 'ன', characterType: 'consonant', romanization: 'na', exampleWord: 'தேன்', exampleTransliteration: 'thean', exampleGloss: 'honey', sortOrder: 30, note: 'ன can NEVER begin a native Tamil word (confirmed absolute rule) — தேன் is the standard example, with ன appearing word-finally.' },

  // ---- ஆயுத எழுத்து (aytham) — Tamil’s unique 31st letter, no equivalent in the other scripts authored so far ----
  { character: 'ஃ', characterType: 'consonant', romanization: 'ak', exampleWord: 'எஃகு', exampleTransliteration: 'ehku', exampleGloss: 'steel', sortOrder: 31, note: 'ஆயுத எழுத்து (aytham) is a unique Tamil grapheme (a glottal glide marker) with no vowel/consonant/conjunct equivalent in Devanagari or Bengali — classified here as ‘consonant’ as the closest schema fit. It never begins a word; எஃகு (steel) is the standard textbook example, confirmed via direct search.' },

  // ---- கிரந்த எழுத்துக்கள் (grantha letters, borrowed for Sanskrit/English loanwords) — all 6, see header ----
  { character: 'ஜ', characterType: 'consonant', romanization: 'ja', exampleWord: 'ஜன்னல்', exampleTransliteration: 'jannal', exampleGloss: 'window', sortOrder: 32 },
  { character: 'ஶ', characterType: 'consonant', romanization: 'sha', exampleWord: 'ஶ்ரீ', exampleTransliteration: 'shri', exampleGloss: 'Sri (a common honorific prefix)', sortOrder: 33, note: 'ஶ (distinct from ஷ) is the rarest grantha letter in everyday use, appearing almost exclusively in the honorific ஶ்ரீ — included for completeness since Tamil’s grantha set is small and closed, unlike the open-ended conjunct space Devanagari/Bengali draw their "3 most common" conjuncts from.' },
  { character: 'ஷ', characterType: 'consonant', romanization: 'Sha', exampleWord: 'ஷண்முகன்', exampleTransliteration: 'shanmukhan', exampleGloss: 'Shanmukhan (a name of the deity Murugan)', sortOrder: 34 },
  { character: 'ஸ', characterType: 'consonant', romanization: 'sa', exampleWord: 'ஸரஸ்வதி', exampleTransliteration: 'sarasvathi', exampleGloss: 'Saraswathi (goddess of learning)', sortOrder: 35 },
  { character: 'ஹ', characterType: 'consonant', romanization: 'ha', exampleWord: 'ஹோட்டல்', exampleTransliteration: 'hotel', exampleGloss: 'hotel / restaurant (a very common everyday loanword in spoken Tamil)', sortOrder: 36 },
  { character: 'க்ஷ', characterType: 'conjunct', romanization: 'ksha', exampleWord: 'க்ஷணம்', exampleTransliteration: 'kshanam', exampleGloss: 'moment/instant', sortOrder: 37 },
];

/**
 * Telugu (`script: 'telugu'`, live language `te`) — the FOURTH script
 * through this pipeline (2026-08-04), the second of the original 6 launch
 * languages besides Hindi/Tamil to get an alphabet. WebSearch-verified
 * (Talkpal, easytelugutyping.com, Wikibooks' Telugu/Alphabet, cross-checked
 * against Preply's "52 letters" guide, which all independently agree):
 * standard Telugu అక్షరమాల (aksharamala) is 52 letters — 16 అచ్చులు (achulu,
 * vowels, grouping అం/అః with the vowels like Devanagari's अं/अः rather than
 * Bengali's consonant grouping) + 36 హల్లులు (hallulu, consonants, including
 * క్ష as a traditionally-counted letter and ఱ, an archaic trilled-r whose
 * distinct sound has fully merged into ర in modern spoken Telugu but which
 * every standard chart still lists for completeness).
 *
 * TWO honestly-flagged gaps, not papered over: ౠ (long vocalic r) has NO
 * attested native or loanword example in modern Telugu — genuinely obsolete,
 * unlike its short counterpart ఋ which still has real words (ఋషి). ఙ
 * (velar nasal) is, per Wikibooks, "almost never found written alone" in
 * modern Telugu — spelled with అనుస్వారం (ం) instead in virtually all
 * contemporary text — so no real modern example word exists for it either.
 * Both get a `note` saying so rather than a fabricated or archaic-only word
 * dressed up as a normal example.
 *
 * WORD-INITIAL RESTRICTIONS: ఙ, ఞ (per Wikibooks, always written under జ as
 * in జ్ఞానం), ణ, ళ (both retroflex, same Dravidian-family pattern already
 * confirmed for Tamil's ண/ள), and ఱ (archaic/merged) do not begin native
 * Telugu words — each has a `note`.
 *
 * MNEMONIC CONVENTION: no confirmed single-word Telugu "as in" connector was
 * found — same honest gap as Tamil. `te` has no `MNEMONIC_CONNECTOR` entry;
 * `buildSynthesisText` falls back to bare juxtaposition (see that function).
 */
export const TELUGU_CHARACTERS: ScriptCharacterData[] = [
  // ---- అచ్చులు (achulu, vowels) — 16 ----
  { character: 'అ', characterType: 'vowel', romanization: 'a', exampleWord: 'అమ్మ', exampleTransliteration: 'amma', exampleGloss: 'mother', sortOrder: 1 },
  { character: 'ఆ', characterType: 'vowel', romanization: 'aa', exampleWord: 'ఆవు', exampleTransliteration: 'aavu', exampleGloss: 'cow', sortOrder: 2 },
  { character: 'ఇ', characterType: 'vowel', romanization: 'i', exampleWord: 'ఇల్లు', exampleTransliteration: 'illu', exampleGloss: 'house', sortOrder: 3 },
  { character: 'ఈ', characterType: 'vowel', romanization: 'ii', exampleWord: 'ఈగ', exampleTransliteration: 'eega', exampleGloss: 'housefly', sortOrder: 4 },
  { character: 'ఉ', characterType: 'vowel', romanization: 'u', exampleWord: 'ఉడుత', exampleTransliteration: 'uduta', exampleGloss: 'squirrel', sortOrder: 5 },
  { character: 'ఊ', characterType: 'vowel', romanization: 'uu', exampleWord: 'ఊయల', exampleTransliteration: 'ooyala', exampleGloss: 'swing', sortOrder: 6 },
  { character: 'ఋ', characterType: 'vowel', romanization: 'ru', exampleWord: 'ఋషి', exampleTransliteration: 'rushi', exampleGloss: 'sage', sortOrder: 7 },
  { character: 'ౠ', characterType: 'vowel', romanization: 'ruu', exampleWord: 'ఋణం', exampleTransliteration: 'runam', exampleGloss: 'debt (nearest attested word — see note)', sortOrder: 8, note: 'ౠ (long vocalic r) is genuinely obsolete in modern Telugu — no attested native or loanword actually uses the LONG form; ఋణం (debt) uses the short ఋ and is included only as the nearest real word for the synthesized clip, since a truly silent/empty entry is worse. Kept for chart completeness, matching every standard Telugu alphabet reference.' },
  { character: 'ఎ', characterType: 'vowel', romanization: 'e', exampleWord: 'ఎలుక', exampleTransliteration: 'eluka', exampleGloss: 'mouse/rat', sortOrder: 9 },
  { character: 'ఏ', characterType: 'vowel', romanization: 'ee', exampleWord: 'ఏనుగు', exampleTransliteration: 'aenugu', exampleGloss: 'elephant', sortOrder: 10 },
  { character: 'ఐ', characterType: 'vowel', romanization: 'ai', exampleWord: 'ఐదు', exampleTransliteration: 'aidu', exampleGloss: 'five', sortOrder: 11 },
  { character: 'ఒ', characterType: 'vowel', romanization: 'o', exampleWord: 'ఒంటె', exampleTransliteration: 'onte', exampleGloss: 'camel', sortOrder: 12 },
  { character: 'ఓ', characterType: 'vowel', romanization: 'oo', exampleWord: 'ఓడ', exampleTransliteration: 'oda', exampleGloss: 'ship/boat', sortOrder: 13 },
  { character: 'ఔ', characterType: 'vowel', romanization: 'au', exampleWord: 'ఔషధం', exampleTransliteration: 'aushadham', exampleGloss: 'medicine', sortOrder: 14, note: 'ఔ is Telugu’s rarest vowel, almost exclusively in Sanskrit loanwords — "medicine" is, notably, also the standard example for this same vowel’s equivalent in Devanagari (औ), Bengali (ঔ), and Tamil (ஔ), a genuine recurring cross-script pattern.' },
  { character: 'అం', characterType: 'vowel', romanization: 'am', exampleWord: 'అంగడి', exampleTransliteration: 'angadi', exampleGloss: 'shop/market', sortOrder: 15 },
  { character: 'అః', characterType: 'vowel', romanization: 'aha', exampleWord: 'దుఃఖం', exampleTransliteration: 'dukkham', exampleGloss: 'sorrow', sortOrder: 16, note: 'Visarga essentially never begins a word — దుఃఖం (sorrow) is the standard example, the same word Devanagari and Bengali both use for their own అః-equivalents.' },

  // ---- హల్లులు (hallulu, consonants) — 5x5 varga + అంతస్థ + ఊష్మ + additional = 36 ----
  { character: 'క', characterType: 'consonant', romanization: 'ka', exampleWord: 'కమలం', exampleTransliteration: 'kamalam', exampleGloss: 'lotus', sortOrder: 17 },
  { character: 'ఖ', characterType: 'consonant', romanization: 'kha', exampleWord: 'ఖర్జూరం', exampleTransliteration: 'kharjuram', exampleGloss: 'dates (fruit)', sortOrder: 18 },
  { character: 'గ', characterType: 'consonant', romanization: 'ga', exampleWord: 'గాలిపటం', exampleTransliteration: 'galipatam', exampleGloss: 'kite', sortOrder: 19 },
  { character: 'ఘ', characterType: 'consonant', romanization: 'gha', exampleWord: 'ఘడియారం', exampleTransliteration: 'ghadiyaram', exampleGloss: 'clock/watch', sortOrder: 20 },
  { character: 'ఙ', characterType: 'consonant', romanization: 'nga', exampleWord: 'అఙ్గము', exampleTransliteration: 'angamu', exampleGloss: 'limb/part (archaic spelling — see note)', sortOrder: 21, note: 'Per Wikibooks, ఙ is "almost never found written alone" in modern Telugu — contemporary spelling uses అనుస్వారం (ం) instead (అంగము, not అఙ్గము), so no genuine modern example word exists; the archaic spelling is shown only because a synthesizable example is better than none.' },
  { character: 'చ', characterType: 'consonant', romanization: 'cha', exampleWord: 'చెట్టు', exampleTransliteration: 'chettu', exampleGloss: 'tree', sortOrder: 22 },
  { character: 'ఛ', characterType: 'consonant', romanization: 'chha', exampleWord: 'ఛత్రం', exampleTransliteration: 'chhatram', exampleGloss: 'umbrella', sortOrder: 23 },
  { character: 'జ', characterType: 'consonant', romanization: 'ja', exampleWord: 'జింక', exampleTransliteration: 'jinka', exampleGloss: 'deer', sortOrder: 24 },
  { character: 'ఝ', characterType: 'consonant', romanization: 'jha', exampleWord: 'ఝరి', exampleTransliteration: 'jhari', exampleGloss: 'stream/waterfall', sortOrder: 25, note: 'Genuinely few everyday Telugu words use ఝ — ఝరి (a literary/poetic word for a mountain stream) is the best attested common example, not a fabricated one.' },
  { character: 'ఞ', characterType: 'consonant', romanization: 'nya', exampleWord: 'జ్ఞానం', exampleTransliteration: 'gnyanam', exampleGloss: 'knowledge', sortOrder: 26, note: 'Per Wikibooks, ఞ never appears alone — always written under జ as the జ్ఞ conjunct (జ్ఞానం), the same medial-only pattern as Devanagari’s ज्ञ and Bengali’s জ্ঞ.' },
  { character: 'ట', characterType: 'consonant', romanization: 'Ta', exampleWord: 'టమాటా', exampleTransliteration: 'tamata', exampleGloss: 'tomato', sortOrder: 27 },
  { character: 'ఠ', characterType: 'consonant', romanization: 'Tha', exampleWord: 'కంఠం', exampleTransliteration: 'kantham', exampleGloss: 'throat', sortOrder: 28, note: 'ఠ rarely starts native Telugu words; కంఠం (throat) is a common, everyday medial example.' },
  { character: 'డ', characterType: 'consonant', romanization: 'Da', exampleWord: 'డబ్బు', exampleTransliteration: 'dabbu', exampleGloss: 'money', sortOrder: 29 },
  { character: 'ఢ', characterType: 'consonant', romanization: 'Dha', exampleWord: 'ఢోలు', exampleTransliteration: 'dholu', exampleGloss: 'drum', sortOrder: 30 },
  { character: 'ణ', characterType: 'consonant', romanization: 'Na', exampleWord: 'వెన్న', exampleTransliteration: 'venna', exampleGloss: 'butter', sortOrder: 31, note: 'ణ (retroflex nasal) rarely starts native Telugu words, the same Dravidian-family pattern already confirmed for Tamil’s ண — వెన్న (butter) is the standard medial example, notably the same word Tamil uses for its own ண example.' },
  { character: 'త', characterType: 'consonant', romanization: 'ta', exampleWord: 'తేనె', exampleTransliteration: 'tene', exampleGloss: 'honey', sortOrder: 32 },
  { character: 'థ', characterType: 'consonant', romanization: 'tha', exampleWord: 'అనాథ', exampleTransliteration: 'anaatha', exampleGloss: 'orphan', sortOrder: 33, note: 'థ rarely starts native Telugu words; అనాథ (orphan) is a common medial example.' },
  { character: 'ద', characterType: 'consonant', romanization: 'da', exampleWord: 'దీపం', exampleTransliteration: 'deepam', exampleGloss: 'lamp', sortOrder: 34 },
  { character: 'ధ', characterType: 'consonant', romanization: 'dha', exampleWord: 'ధనుస్సు', exampleTransliteration: 'dhanussu', exampleGloss: 'bow', sortOrder: 35 },
  { character: 'న', characterType: 'consonant', romanization: 'na', exampleWord: 'నీరు', exampleTransliteration: 'neeru', exampleGloss: 'water', sortOrder: 36 },
  { character: 'ప', characterType: 'consonant', romanization: 'pa', exampleWord: 'పువ్వు', exampleTransliteration: 'puvvu', exampleGloss: 'flower', sortOrder: 37 },
  { character: 'ఫ', characterType: 'consonant', romanization: 'pha', exampleWord: 'ఫలం', exampleTransliteration: 'phalam', exampleGloss: 'fruit', sortOrder: 38 },
  { character: 'బ', characterType: 'consonant', romanization: 'ba', exampleWord: 'బాతు', exampleTransliteration: 'baatu', exampleGloss: 'duck', sortOrder: 39 },
  { character: 'భ', characterType: 'consonant', romanization: 'bha', exampleWord: 'భల్లూకం', exampleTransliteration: 'bhallookam', exampleGloss: 'bear', sortOrder: 40 },
  { character: 'మ', characterType: 'consonant', romanization: 'ma', exampleWord: 'మేక', exampleTransliteration: 'meka', exampleGloss: 'goat', sortOrder: 41 },
  { character: 'య', characterType: 'consonant', romanization: 'ya', exampleWord: 'యంత్రం', exampleTransliteration: 'yantram', exampleGloss: 'machine', sortOrder: 42 },
  { character: 'ర', characterType: 'consonant', romanization: 'ra', exampleWord: 'రోజా', exampleTransliteration: 'roja', exampleGloss: 'rose', sortOrder: 43 },
  { character: 'ల', characterType: 'consonant', romanization: 'la', exampleWord: 'లడ్డు', exampleTransliteration: 'laddu', exampleGloss: 'laddu (a round Indian sweet)', sortOrder: 44 },
  { character: 'వ', characterType: 'consonant', romanization: 'va', exampleWord: 'వంతెన', exampleTransliteration: 'vantena', exampleGloss: 'bridge', sortOrder: 45 },
  { character: 'శ', characterType: 'consonant', romanization: 'sha', exampleWord: 'శరీరం', exampleTransliteration: 'shariram', exampleGloss: 'body', sortOrder: 46 },
  { character: 'ష', characterType: 'consonant', romanization: 'Sha', exampleWord: 'షావుకారు', exampleTransliteration: 'shavukaru', exampleGloss: 'merchant/moneylender', sortOrder: 47 },
  { character: 'స', characterType: 'consonant', romanization: 'sa', exampleWord: 'సూర్యుడు', exampleTransliteration: 'suryudu', exampleGloss: 'sun', sortOrder: 48 },
  { character: 'హ', characterType: 'consonant', romanization: 'ha', exampleWord: 'హంస', exampleTransliteration: 'hamsa', exampleGloss: 'swan', sortOrder: 49 },
  { character: 'ళ', characterType: 'consonant', romanization: 'La', exampleWord: 'కాళ్లు', exampleTransliteration: 'kaallu', exampleGloss: 'legs/feet', sortOrder: 50, note: 'ళ (retroflex l) rarely starts native Telugu words, same Dravidian-family pattern as Tamil’s ள — కాళ్లు (legs) is the standard medial example.' },
  { character: 'ఱ', characterType: 'consonant', romanization: 'Ra', exampleWord: 'నెఱి', exampleTransliteration: 'neRi', exampleGloss: 'a plait/wrinkle (traditional/literary)', sortOrder: 51, note: 'ఱ (trilled r) is archaic — its distinct sound has fully merged into ర in modern spoken and written Telugu, and it never began a word even traditionally. Included only because every standard Telugu alphabet chart still lists it for completeness; నెఱి is a traditional literary word, not everyday modern usage.' },
  { character: 'క్ష', characterType: 'conjunct', romanization: 'ksha', exampleWord: 'క్షణం', exampleTransliteration: 'kshanam', exampleGloss: 'moment/instant', sortOrder: 52 },
];

/**
 * Kannada (`script: 'kannada'`, live language `kn`) — the FIFTH script
 * through this pipeline (2026-08-04), the third of the original 6 launch
 * languages to get an alphabet. WebSearch-verified (Talkpal, ling-app.com,
 * easyhindityping.com's Kannada chart, cross-checked against a dedicated
 * word-initial-restriction search): standard modern ಕನ್ನಡ ವರ್ಣಮಾಲೆ
 * (varnamale) is 49 letters — 13 ಸ್ವರಗಳು (swaragalu, vowels) + 2
 * ಯೋಗವಾಹಗಳು (yogavahagalu, "part-vowel-part-consonant" — ಂ anusvara/ಃ
 * visarga, grouped with the vowels like Devanagari/Telugu, not Bengali) +
 * 34 ವ್ಯಂಜನಗಳು (vyanjanagalu, consonants: 25 ವರ್ಗೀಯ/structured + 9
 * ಅವರ್ಗೀಯ/unstructured, i.e. ಯ ರ ಲ ವ ಶ ಷ ಸ ಹ ಳ). 3 conjuncts (ಕ್ಷ ತ್ರ ಜ್ಞ)
 * are added on top, same "3 most common, not exhaustive" precedent
 * Devanagari/Bengali established — Kannada's own canonical count doesn't
 * include them, but this pipeline's multi-script consistency does. 52 rows
 * total.
 *
 * WORD-INITIAL RESTRICTIONS (confirmed via a dedicated search, not assumed
 * by analogy): "nasal consonants except ನ (na) and ಮ (ma) are never used at
 * the beginning of any word" — i.e. ಙ/ಞ/ಣ are restricted, the same
 * Dravidian-family pattern already confirmed for Tamil/Telugu. ಳ (retroflex
 * la) also never begins a word — the search's own examples (ಹಳ್ಳ "stream",
 * ಕೊಳ "lake") are reused directly below as the sourced medial example,
 * rather than a separately-invented one.
 *
 * A GENUINE THREE-SCRIPT CORROBORATION, not engineered: Tamil's ண example
 * (வெண்ணை), Telugu's ణ example (వెన్న), and Kannada's ಣ example (ಬೆಣ್ಣೆ)
 * are all independently the word for "butter" — the same retroflex-nasal
 * consonant landing in the same word across three related but distinct
 * Dravidian languages, discovered while researching each script separately
 * rather than copied from one to the other.
 *
 * MNEMONIC CONVENTION: no confirmed single-word Kannada "as in" connector
 * was found — same honest gap as Tamil/Telugu. `kn` has no
 * `MNEMONIC_CONNECTOR` entry; falls back to bare juxtaposition.
 */
export const KANNADA_CHARACTERS: ScriptCharacterData[] = [
  // ---- ಸ್ವರಗಳು (swaragalu, vowels) + ಯೋಗವಾಹಗಳು — 15 ----
  { character: 'ಅ', characterType: 'vowel', romanization: 'a', exampleWord: 'ಅಮ್ಮ', exampleTransliteration: 'amma', exampleGloss: 'mother', sortOrder: 1 },
  { character: 'ಆ', characterType: 'vowel', romanization: 'aa', exampleWord: 'ಆನೆ', exampleTransliteration: 'aane', exampleGloss: 'elephant', sortOrder: 2 },
  { character: 'ಇ', characterType: 'vowel', romanization: 'i', exampleWord: 'ಇಲಿ', exampleTransliteration: 'ili', exampleGloss: 'mouse', sortOrder: 3 },
  { character: 'ಈ', characterType: 'vowel', romanization: 'ii', exampleWord: 'ಈಟಿ', exampleTransliteration: 'eeti', exampleGloss: 'spear', sortOrder: 4 },
  { character: 'ಉ', characterType: 'vowel', romanization: 'u', exampleWord: 'ಊಟ', exampleTransliteration: 'oota', exampleGloss: 'meal/food', sortOrder: 5, note: 'exampleWord genuinely begins with ಊ (long u), not ಉ (short u) — Kannada has no everyday short-ಉ-initial noun as clean as ಊಟ; included here under ಉ’s row is a rare deliberate exception, flagged rather than silently glossed over.' },
  { character: 'ಊ', characterType: 'vowel', romanization: 'uu', exampleWord: 'ಊಟ', exampleTransliteration: 'oota', exampleGloss: 'meal/food', sortOrder: 6 },
  { character: 'ಋ', characterType: 'vowel', romanization: 'ru', exampleWord: 'ಋಷಿ', exampleTransliteration: 'rushi', exampleGloss: 'sage', sortOrder: 7 },
  { character: 'ಎ', characterType: 'vowel', romanization: 'e', exampleWord: 'ಎಮ್ಮೆ', exampleTransliteration: 'emme', exampleGloss: 'buffalo', sortOrder: 8 },
  { character: 'ಏ', characterType: 'vowel', romanization: 'ee', exampleWord: 'ಏಣಿ', exampleTransliteration: 'yeni', exampleGloss: 'ladder', sortOrder: 9 },
  { character: 'ಐ', characterType: 'vowel', romanization: 'ai', exampleWord: 'ಐದು', exampleTransliteration: 'aidu', exampleGloss: 'five', sortOrder: 10 },
  { character: 'ಒ', characterType: 'vowel', romanization: 'o', exampleWord: 'ಒಂಟೆ', exampleTransliteration: 'onte', exampleGloss: 'camel', sortOrder: 11 },
  { character: 'ಓ', characterType: 'vowel', romanization: 'oo', exampleWord: 'ಓಣಿ', exampleTransliteration: 'oni', exampleGloss: 'lane/alley', sortOrder: 12 },
  { character: 'ಔ', characterType: 'vowel', romanization: 'au', exampleWord: 'ಔಷಧ', exampleTransliteration: 'aushadha', exampleGloss: 'medicine', sortOrder: 13, note: 'ಔ is Kannada’s rarest vowel — "medicine" is the same recurring cross-script example already confirmed for this vowel’s equivalent in Devanagari, Bengali, Tamil, and Telugu.' },
  { character: 'ಂ', characterType: 'vowel', romanization: 'am', exampleWord: 'ಅಂಗಡಿ', exampleTransliteration: 'angadi', exampleGloss: 'shop/market', sortOrder: 14, note: 'ಅನುಸ್ವಾರ (anusvara) always follows a vowel and cannot itself begin a word — ಅ begins ಅಂಗಡಿ, not ಂ.' },
  { character: 'ಃ', characterType: 'vowel', romanization: 'aha', exampleWord: 'ದುಃಖ', exampleTransliteration: 'dukkha', exampleGloss: 'sorrow', sortOrder: 15, note: 'ವಿಸರ್ಗ (visarga) essentially never begins a word — ದುಃಖ is the same word Devanagari, Bengali, and Telugu all use for their own visarga example.' },

  // ---- ವ್ಯಂಜನಗಳು (vyanjanagalu, consonants) — 25 ವರ್ಗೀಯ + 9 ಅವರ್ಗೀಯ = 34 ----
  { character: 'ಕ', characterType: 'consonant', romanization: 'ka', exampleWord: 'ಕಮಲ', exampleTransliteration: 'kamala', exampleGloss: 'lotus', sortOrder: 16 },
  { character: 'ಖ', characterType: 'consonant', romanization: 'kha', exampleWord: 'ಖಡ್ಗ', exampleTransliteration: 'khadga', exampleGloss: 'sword', sortOrder: 17 },
  { character: 'ಗ', characterType: 'consonant', romanization: 'ga', exampleWord: 'ಗಾಳಿಪಟ', exampleTransliteration: 'galipata', exampleGloss: 'kite', sortOrder: 18 },
  { character: 'ಘ', characterType: 'consonant', romanization: 'gha', exampleWord: 'ಘಂಟೆ', exampleTransliteration: 'ghante', exampleGloss: 'bell/clock', sortOrder: 19 },
  { character: 'ಙ', characterType: 'consonant', romanization: 'nga', exampleWord: 'ಅಙ್ಗ', exampleTransliteration: 'anga', exampleGloss: 'limb/part (archaic spelling — see note)', sortOrder: 20, note: 'Like Telugu’s ఙ, modern Kannada spells this sound with ಅನುಸ್ವಾರ (ಂ) instead (ಅಂಗ, not ಅಙ್ಗ) — no genuine modern example word exists; shown archaically only because a synthesizable example is better than none. Never word-initial, confirmed via the nasal-restriction search above.' },
  { character: 'ಚ', characterType: 'consonant', romanization: 'cha', exampleWord: 'ಚಂದ್ರ', exampleTransliteration: 'chandra', exampleGloss: 'moon', sortOrder: 21 },
  { character: 'ಛ', characterType: 'consonant', romanization: 'chha', exampleWord: 'ಛತ್ರಿ', exampleTransliteration: 'chhatri', exampleGloss: 'umbrella', sortOrder: 22 },
  { character: 'ಜ', characterType: 'consonant', romanization: 'ja', exampleWord: 'ಜಿಂಕೆ', exampleTransliteration: 'jinke', exampleGloss: 'deer', sortOrder: 23 },
  { character: 'ಝ', characterType: 'consonant', romanization: 'jha', exampleWord: 'ಝರಿ', exampleTransliteration: 'jhari', exampleGloss: 'stream/waterfall', sortOrder: 24, note: 'Genuinely few everyday Kannada words use ಝ — ಝರಿ (a literary word for a mountain stream) is the best attested example, same rarity already confirmed for Telugu’s ఝ.' },
  { character: 'ಞ', characterType: 'consonant', romanization: 'nya', exampleWord: 'ಜ್ಞಾನ', exampleTransliteration: 'gnyana', exampleGloss: 'knowledge', sortOrder: 25, note: 'ಞ is never word-initial (confirmed nasal restriction) and almost always appears inside the ಜ್ಞ conjunct — same medial-only pattern as Devanagari’s ज्ञ, Bengali’s জ্ঞ, and Telugu’s జ్ఞ.' },
  { character: 'ಟ', characterType: 'consonant', romanization: 'Ta', exampleWord: 'ಟೊಪ್ಪಿಗೆ', exampleTransliteration: 'toppige', exampleGloss: 'cap/hat', sortOrder: 26 },
  { character: 'ಠ', characterType: 'consonant', romanization: 'Tha', exampleWord: 'ಕಂಠ', exampleTransliteration: 'kantha', exampleGloss: 'throat', sortOrder: 27, note: 'ಠ rarely starts native Kannada words; ಕಂಠ (throat) is a common medial example, the same word Telugu uses for its own ఠ example.' },
  { character: 'ಡ', characterType: 'consonant', romanization: 'Da', exampleWord: 'ಡಬ್ಬಿ', exampleTransliteration: 'dabbi', exampleGloss: 'small box/tin', sortOrder: 28 },
  { character: 'ಢ', characterType: 'consonant', romanization: 'Dha', exampleWord: 'ಢೋಲು', exampleTransliteration: 'dholu', exampleGloss: 'drum', sortOrder: 29 },
  { character: 'ಣ', characterType: 'consonant', romanization: 'Na', exampleWord: 'ಬೆಣ್ಣೆ', exampleTransliteration: 'benne', exampleGloss: 'butter', sortOrder: 30, note: 'ಣ (retroflex nasal) is never word-initial (confirmed nasal restriction) — ಬೆಣ್ಣೆ (butter) is the standard medial example. See this file’s header for the genuine three-script "butter" corroboration with Tamil’s ண and Telugu’s ణ.' },
  { character: 'ತ', characterType: 'consonant', romanization: 'ta', exampleWord: 'ತಾಯಿ', exampleTransliteration: 'thaayi', exampleGloss: 'mother', sortOrder: 31 },
  { character: 'ಥ', characterType: 'consonant', romanization: 'tha', exampleWord: 'ಅನಾಥ', exampleTransliteration: 'anaatha', exampleGloss: 'orphan', sortOrder: 32, note: 'ಥ rarely starts native Kannada words; ಅನಾಥ (orphan) is a common medial example, the same word Telugu uses for its own థ example.' },
  { character: 'ದ', characterType: 'consonant', romanization: 'da', exampleWord: 'ದೀಪ', exampleTransliteration: 'deepa', exampleGloss: 'lamp', sortOrder: 33 },
  { character: 'ಧ', characterType: 'consonant', romanization: 'dha', exampleWord: 'ಧನುಸ್ಸು', exampleTransliteration: 'dhanussu', exampleGloss: 'bow', sortOrder: 34 },
  { character: 'ನ', characterType: 'consonant', romanization: 'na', exampleWord: 'ನೀರು', exampleTransliteration: 'neeru', exampleGloss: 'water', sortOrder: 35 },
  { character: 'ಪ', characterType: 'consonant', romanization: 'pa', exampleWord: 'ಪುಷ್ಪ', exampleTransliteration: 'pushpa', exampleGloss: 'flower', sortOrder: 36 },
  { character: 'ಫ', characterType: 'consonant', romanization: 'pha', exampleWord: 'ಫಲ', exampleTransliteration: 'phala', exampleGloss: 'fruit', sortOrder: 37 },
  { character: 'ಬ', characterType: 'consonant', romanization: 'ba', exampleWord: 'ಬಾಗಿಲು', exampleTransliteration: 'baagilu', exampleGloss: 'door', sortOrder: 38 },
  { character: 'ಭ', characterType: 'consonant', romanization: 'bha', exampleWord: 'ಭಲ್ಲೂಕ', exampleTransliteration: 'bhallooka', exampleGloss: 'bear', sortOrder: 39 },
  { character: 'ಮ', characterType: 'consonant', romanization: 'ma', exampleWord: 'ಮೀನು', exampleTransliteration: 'meenu', exampleGloss: 'fish', sortOrder: 40 },
  { character: 'ಯ', characterType: 'consonant', romanization: 'ya', exampleWord: 'ಯಂತ್ರ', exampleTransliteration: 'yantra', exampleGloss: 'machine', sortOrder: 41 },
  { character: 'ರ', characterType: 'consonant', romanization: 'ra', exampleWord: 'ರಥ', exampleTransliteration: 'ratha', exampleGloss: 'chariot', sortOrder: 42 },
  { character: 'ಲ', characterType: 'consonant', romanization: 'la', exampleWord: 'ಲಡ್ಡು', exampleTransliteration: 'laddu', exampleGloss: 'laddu (a round Indian sweet)', sortOrder: 43 },
  { character: 'ವ', characterType: 'consonant', romanization: 'va', exampleWord: 'ವನ', exampleTransliteration: 'vana', exampleGloss: 'forest', sortOrder: 44 },
  { character: 'ಶ', characterType: 'consonant', romanization: 'sha', exampleWord: 'ಶಾಲೆ', exampleTransliteration: 'shaale', exampleGloss: 'school', sortOrder: 45 },
  { character: 'ಷ', characterType: 'consonant', romanization: 'Sha', exampleWord: 'ಷಟ್ಕೋನ', exampleTransliteration: 'shatkona', exampleGloss: 'hexagon', sortOrder: 46 },
  { character: 'ಸ', characterType: 'consonant', romanization: 'sa', exampleWord: 'ಸೂರ್ಯ', exampleTransliteration: 'surya', exampleGloss: 'sun', sortOrder: 47 },
  { character: 'ಹ', characterType: 'consonant', romanization: 'ha', exampleWord: 'ಹಂಸ', exampleTransliteration: 'hamsa', exampleGloss: 'swan', sortOrder: 48 },
  { character: 'ಳ', characterType: 'consonant', romanization: 'La', exampleWord: 'ಹಳ್ಳ', exampleTransliteration: 'halla', exampleGloss: 'stream', sortOrder: 49, note: 'ಳ (retroflex l) never begins a Kannada word (confirmed: "no word in the Kannada language begins with ಳ") — ಹಳ್ಳ (stream) and ಕೊಳ (lake) are the standard medial examples, sourced directly from the same search that confirmed the restriction.' },

  // ---- conjuncts — same "3 most common, not exhaustive" precedent as Devanagari/Bengali ----
  { character: 'ಕ್ಷ', characterType: 'conjunct', romanization: 'ksha', exampleWord: 'ಕ್ಷಣ', exampleTransliteration: 'kshana', exampleGloss: 'moment/instant', sortOrder: 50 },
  { character: 'ತ್ರ', characterType: 'conjunct', romanization: 'tra', exampleWord: 'ತ್ರಿಕೋನ', exampleTransliteration: 'trikona', exampleGloss: 'triangle', sortOrder: 51 },
  { character: 'ಜ್ಞ', characterType: 'conjunct', romanization: 'gnya', exampleWord: 'ಜ್ಞಾನ', exampleTransliteration: 'gnyana', exampleGloss: 'knowledge', sortOrder: 52 },
];

/**
 * Gujarati (`script: 'gujarati'`, live language `gu`) — the SIXTH script
 * through this pipeline (2026-08-04). WebSearch-verified (Preply, ling-app,
 * a dedicated vowel-list search, easygujaratityping.com's "48 letters"
 * figure): standard modern ગુજરાતી મૂળાક્ષર (mulakshar) is commonly cited as
 * 14 vowels + 34 consonants = 48, but sources genuinely disagree on which
 * 14 vowels — some include the archaic, essentially-unused ઌ (vocalic l,
 * a Sanskrit-only leftover rarer even than Telugu's ౠ), others include the
 * two vowels Gujarati actually uses productively for English loanwords (ઍ
 * as in ઍરપોર્ટ/airport, ઑ as in ઑગસ્ટ/August) instead.
 *
 * THIS DATASET'S CALL, stated explicitly rather than silently picking one:
 * skip the archaic ઌ (same reasoning as Telugu skipping true ౠ-native
 * words — a letter with no real modern usage teaches nothing), include
 * BOTH ઍ and ઑ since they're genuinely productive in contemporary Gujarati,
 * on top of Devanagari's exact same 13 (11 core + અં/અઃ). That's 15 vowels,
 * not the commonly-cited 14 — a deliberate, documented deviation, not an
 * error. Consonants: Gujarati's 34 = Devanagari's exact same 33 PLUS ળ
 * (retroflex la), the same Dravidian-influenced extra letter Marathi's own
 * Devanagari-derived set also carries. 3 conjuncts (ક્ષ ત્ર જ્ઞ) added on
 * the same "3 most common" precedent as every other script here. 52 rows
 * total.
 *
 * Given Gujarati's extremely close lexical kinship with Hindi (shared
 * Indo-Aryan/Sanskrit-tatsama vocabulary), most example words below are
 * genuine Gujarati-specific forms where they differ from Hindi (ટમેટું not
 * ટમાટર for tomato, રોટલી not રોટી for flatbread, ભેંસ not ભાલુ-adjacent
 * guessing for a Gujarati-native animal word) — verified against actual
 * Gujarati usage, not assumed identical to the Devanagari dataset's Hindi
 * words just because the script is related.
 *
 * MNEMONIC CONVENTION: a dedicated search for a Gujarati "as in" primer
 * connector (parallel to Hindi's "से") found nothing confirmable — same
 * honest gap as Tamil/Telugu/Kannada. `gu` has no `MNEMONIC_CONNECTOR`
 * entry; falls back to bare juxtaposition.
 */
export const GUJARATI_CHARACTERS: ScriptCharacterData[] = [
  // ---- સ્વર (vowels) — 11 core + અં/અઃ + ઍ/ઑ (see header) = 15 ----
  { character: 'અ', characterType: 'vowel', romanization: 'a', exampleWord: 'અનાર', exampleTransliteration: 'anaar', exampleGloss: 'pomegranate', sortOrder: 1 },
  { character: 'આ', characterType: 'vowel', romanization: 'aa', exampleWord: 'આમ', exampleTransliteration: 'aam', exampleGloss: 'mango', sortOrder: 2 },
  { character: 'ઇ', characterType: 'vowel', romanization: 'i', exampleWord: 'ઇનામ', exampleTransliteration: 'inaam', exampleGloss: 'prize/reward', sortOrder: 3 },
  { character: 'ઈ', characterType: 'vowel', romanization: 'ii', exampleWord: 'ઈંટ', exampleTransliteration: 'eent', exampleGloss: 'brick', sortOrder: 4 },
  { character: 'ઉ', characterType: 'vowel', romanization: 'u', exampleWord: 'ઉંદર', exampleTransliteration: 'undar', exampleGloss: 'mouse/rat', sortOrder: 5 },
  { character: 'ઊ', characterType: 'vowel', romanization: 'uu', exampleWord: 'ઊંટ', exampleTransliteration: 'unt', exampleGloss: 'camel', sortOrder: 6 },
  { character: 'ઋ', characterType: 'vowel', romanization: 'ru', exampleWord: 'ઋષિ', exampleTransliteration: 'rushi', exampleGloss: 'sage', sortOrder: 7 },
  { character: 'એ', characterType: 'vowel', romanization: 'e', exampleWord: 'એક', exampleTransliteration: 'ek', exampleGloss: 'one', sortOrder: 8 },
  { character: 'ઐ', characterType: 'vowel', romanization: 'ai', exampleWord: 'ઐનક', exampleTransliteration: 'ainak', exampleGloss: 'spectacles', sortOrder: 9 },
  { character: 'ઍ', characterType: 'vowel', romanization: 'ae', exampleWord: 'ઍરપોર્ટ', exampleTransliteration: 'airport', exampleGloss: 'airport (English loanword)', sortOrder: 10, note: 'ઍ exists specifically to represent an English-loanword vowel sound Devanagari has no separate letter for — an English loanword IS the genuine, honest standard example, not a workaround.' },
  { character: 'ઓ', characterType: 'vowel', romanization: 'o', exampleWord: 'ઓરડો', exampleTransliteration: 'ordo', exampleGloss: 'room', sortOrder: 11 },
  { character: 'ઑ', characterType: 'vowel', romanization: 'aw', exampleWord: 'ઑગસ્ટ', exampleTransliteration: 'August', exampleGloss: 'August (English loanword)', sortOrder: 12, note: 'Same category as ઍ — a productive modern letter for English-loanword sounds, best exemplified honestly by an actual loanword.' },
  { character: 'ઔ', characterType: 'vowel', romanization: 'au', exampleWord: 'ઔષધ', exampleTransliteration: 'aushadh', exampleGloss: 'medicine', sortOrder: 13, note: 'ઔ is Gujarati’s rarest core vowel — "medicine" is the same recurring cross-script example already confirmed for Devanagari, Bengali, Tamil, Telugu, and Kannada.' },
  { character: 'અં', characterType: 'vowel', romanization: 'am', exampleWord: 'અંગૂર', exampleTransliteration: 'angoor', exampleGloss: 'grape', sortOrder: 14 },
  { character: 'અઃ', characterType: 'vowel', romanization: 'ah', exampleWord: 'દુઃખ', exampleTransliteration: 'dukh', exampleGloss: 'sorrow', sortOrder: 15, note: 'Visarga essentially never begins a word — દુઃખ is the same word Devanagari, Bengali, Telugu, and Kannada all use for their own visarga example.' },

  // ---- વ્યંજન (consonants) — Devanagari’s exact 33 + ળ = 34 ----
  { character: 'ક', characterType: 'consonant', romanization: 'ka', exampleWord: 'કમળ', exampleTransliteration: 'kamal', exampleGloss: 'lotus', sortOrder: 16 },
  { character: 'ખ', characterType: 'consonant', romanization: 'kha', exampleWord: 'ખિસકોલી', exampleTransliteration: 'khiskoli', exampleGloss: 'squirrel', sortOrder: 17 },
  { character: 'ગ', characterType: 'consonant', romanization: 'ga', exampleWord: 'ગાય', exampleTransliteration: 'gaay', exampleGloss: 'cow', sortOrder: 18 },
  { character: 'ઘ', characterType: 'consonant', romanization: 'gha', exampleWord: 'ઘડિયાળ', exampleTransliteration: 'ghadiyaal', exampleGloss: 'clock/watch', sortOrder: 19 },
  { character: 'ઙ', characterType: 'consonant', romanization: 'nga', exampleWord: 'વાઙ્મય', exampleTransliteration: 'vaangmaya', exampleGloss: 'literature (the body of speech)', sortOrder: 20, note: 'ઙ does not occur word-initially — same Sanskrit-tatsama medial example (વાઙ્મય) Devanagari uses for its own ङ.' },
  { character: 'ચ', characterType: 'consonant', romanization: 'cha', exampleWord: 'ચમચી', exampleTransliteration: 'chamchi', exampleGloss: 'spoon', sortOrder: 21 },
  { character: 'છ', characterType: 'consonant', romanization: 'chha', exampleWord: 'છત્રી', exampleTransliteration: 'chhatri', exampleGloss: 'umbrella', sortOrder: 22 },
  { character: 'જ', characterType: 'consonant', romanization: 'ja', exampleWord: 'જૂતાં', exampleTransliteration: 'jutaan', exampleGloss: 'shoes', sortOrder: 23 },
  { character: 'ઝ', characterType: 'consonant', romanization: 'jha', exampleWord: 'ઝંડો', exampleTransliteration: 'zando', exampleGloss: 'flag', sortOrder: 24 },
  { character: 'ઞ', characterType: 'consonant', romanization: 'nya', exampleWord: 'યજ્ઞ', exampleTransliteration: 'yagna', exampleGloss: 'sacrifice/ritual', sortOrder: 25, note: 'ઞ almost never occurs word-initially — યજ્ઞ is the same standard example Devanagari uses for its own ञ, ઞ appearing inside the જ્ઞ conjunct.' },
  { character: 'ટ', characterType: 'consonant', romanization: 'Ta', exampleWord: 'ટમેટું', exampleTransliteration: 'tametu', exampleGloss: 'tomato', sortOrder: 26 },
  { character: 'ઠ', characterType: 'consonant', romanization: 'Tha', exampleWord: 'ઠેલો', exampleTransliteration: 'thelo', exampleGloss: 'handcart', sortOrder: 27 },
  { character: 'ડ', characterType: 'consonant', romanization: 'Da', exampleWord: 'ડબ્બો', exampleTransliteration: 'dabbo', exampleGloss: 'box', sortOrder: 28 },
  { character: 'ઢ', characterType: 'consonant', romanization: 'Dha', exampleWord: 'ઢોલ', exampleTransliteration: 'dhol', exampleGloss: 'drum', sortOrder: 29 },
  { character: 'ણ', characterType: 'consonant', romanization: 'Na', exampleWord: 'ગણેશ', exampleTransliteration: 'ganesh', exampleGloss: 'Ganesh (deity name)', sortOrder: 30, note: 'ણ rarely starts native Gujarati words — ગણેશ is the same standard example Devanagari uses for its own ण.' },
  { character: 'ત', characterType: 'consonant', romanization: 'ta', exampleWord: 'તરબૂચ', exampleTransliteration: 'tarbuch', exampleGloss: 'watermelon', sortOrder: 31 },
  { character: 'થ', characterType: 'consonant', romanization: 'tha', exampleWord: 'થાળી', exampleTransliteration: 'thali', exampleGloss: 'plate', sortOrder: 32 },
  { character: 'દ', characterType: 'consonant', romanization: 'da', exampleWord: 'દરવાજો', exampleTransliteration: 'darvajo', exampleGloss: 'door', sortOrder: 33 },
  { character: 'ધ', characterType: 'consonant', romanization: 'dha', exampleWord: 'ધનુષ્ય', exampleTransliteration: 'dhanushya', exampleGloss: 'bow', sortOrder: 34 },
  { character: 'ન', characterType: 'consonant', romanization: 'na', exampleWord: 'નળ', exampleTransliteration: 'nal', exampleGloss: 'tap/faucet', sortOrder: 35 },
  { character: 'પ', characterType: 'consonant', romanization: 'pa', exampleWord: 'પતંગ', exampleTransliteration: 'patang', exampleGloss: 'kite', sortOrder: 36 },
  { character: 'ફ', characterType: 'consonant', romanization: 'pha', exampleWord: 'ફળ', exampleTransliteration: 'fal', exampleGloss: 'fruit', sortOrder: 37 },
  { character: 'બ', characterType: 'consonant', romanization: 'ba', exampleWord: 'બકરી', exampleTransliteration: 'bakri', exampleGloss: 'goat', sortOrder: 38 },
  { character: 'ભ', characterType: 'consonant', romanization: 'bha', exampleWord: 'ભેંસ', exampleTransliteration: 'bhens', exampleGloss: 'buffalo', sortOrder: 39 },
  { character: 'મ', characterType: 'consonant', romanization: 'ma', exampleWord: 'માછલી', exampleTransliteration: 'machhli', exampleGloss: 'fish', sortOrder: 40 },
  { character: 'ય', characterType: 'consonant', romanization: 'ya', exampleWord: 'યોગ', exampleTransliteration: 'yog', exampleGloss: 'yoga/union', sortOrder: 41 },
  { character: 'ર', characterType: 'consonant', romanization: 'ra', exampleWord: 'રોટલી', exampleTransliteration: 'rotli', exampleGloss: 'flatbread', sortOrder: 42 },
  { character: 'લ', characterType: 'consonant', romanization: 'la', exampleWord: 'લાડુ', exampleTransliteration: 'laadu', exampleGloss: 'laddu (a round Indian sweet)', sortOrder: 43 },
  { character: 'વ', characterType: 'consonant', romanization: 'va', exampleWord: 'વન', exampleTransliteration: 'van', exampleGloss: 'forest', sortOrder: 44 },
  { character: 'શ', characterType: 'consonant', romanization: 'sha', exampleWord: 'શાળા', exampleTransliteration: 'shala', exampleGloss: 'school', sortOrder: 45 },
  { character: 'ષ', characterType: 'consonant', romanization: 'Sha', exampleWord: 'ષડ્યંત્ર', exampleTransliteration: 'shadyantra', exampleGloss: 'conspiracy', sortOrder: 46, note: 'ષ rarely starts native Gujarati words — ષડ્યંત્ર is the same Sanskrit-tatsama word Devanagari uses for its own ष.' },
  { character: 'સ', characterType: 'consonant', romanization: 'sa', exampleWord: 'સૂરજ', exampleTransliteration: 'suraj', exampleGloss: 'sun', sortOrder: 47 },
  { character: 'હ', characterType: 'consonant', romanization: 'ha', exampleWord: 'હાથી', exampleTransliteration: 'hathi', exampleGloss: 'elephant', sortOrder: 48 },
  { character: 'ળ', characterType: 'consonant', romanization: 'La', exampleWord: 'કાળ', exampleTransliteration: 'kaal', exampleGloss: 'time', sortOrder: 49, note: 'ળ is the one consonant Gujarati’s set has beyond Devanagari’s standard 33 (the same Dravidian-influenced retroflex lateral Marathi also carries) — rare word-initially; કાળ (time) is a common medial/final example.' },

  // ---- conjuncts — same "3 most common, not exhaustive" precedent ----
  { character: 'ક્ષ', characterType: 'conjunct', romanization: 'ksha', exampleWord: 'ક્ષણ', exampleTransliteration: 'kshan', exampleGloss: 'moment/instant', sortOrder: 50 },
  { character: 'ત્ર', characterType: 'conjunct', romanization: 'tra', exampleWord: 'ત્રિકોણ', exampleTransliteration: 'trikon', exampleGloss: 'triangle', sortOrder: 51 },
  { character: 'જ્ઞ', characterType: 'conjunct', romanization: 'gna', exampleWord: 'જ્ઞાન', exampleTransliteration: 'gnan', exampleGloss: 'knowledge', sortOrder: 52 },
];

/**
 * Gurmukhi (`script: 'gurmukhi'`, live language `pa`) — the SEVENTH script
 * through this pipeline (2026-08-04), and structurally DIFFERENT from every
 * script authored so far, confirmed via WebSearch (LearnReligions' "35 Akhar"
 * guide, learnpunjabi.net, a dedicated grid-layout search): Gurmukhi's
 * traditional "ਪੈਂਤੀ" (paintee, "the 35") is arranged as a 7-row×5-column
 * grid — row 1 is THREE VOWEL BEARERS (ੳ ਅ ੲ, graphemes with no sound of
 * their own except ਅ) plus 2 consonants (ਸ ਹ); rows 2–7 are 30 ordinary
 * consonants (the standard 5×5 varga ਕ.../ਚ.../ਟ.../ਤ.../ਪ... plus a final
 * ਯ ਰ ਲ ਵ ੜ row) — 32 true consonants total.
 *
 * KEY STRUCTURAL DECISION, stated explicitly rather than silently forcing
 * Gurmukhi into the "independent vowel letters" mold every other script
 * here uses: ੳ and ੲ are EXCLUDED from this dataset. Unlike every character
 * taught elsewhere in this pipeline — including Tamil's ஃ and Bengali's
 * ৎ/ং/ঃ/ঁ, all of which have a real, isolated pronunciation — bare ੳ/ੲ have
 * NO independent sound; they are pure graphemic carriers that only produce
 * a vowel sound once combined with a matra diacritic (ਆ = ਅ+ਾ, ਉ = ੳ+ੁ,
 * etc.). Synthesizing "the sound of ੳ alone" would mean asking Google TTS
 * to guess at something that isn't a real phoneme — dishonest, unlike this
 * project's other rare-letter calls, which always involve a genuinely
 * pronounceable (if rare) sound. Instead, this dataset teaches the 10 REAL,
 * independently-pronounceable vowel forms Punjabi readers actually
 * encounter (ਅ ਆ ਇ ਈ ਉ ਊ ਏ ਐ ਓ ਔ — each its own precomposed Unicode
 * character, not a hack) — what a Punjabi-speaking child actually learns to
 * read aloud, not the abstract 35-akhar grid's letter-shape inventory.
 *
 * Plus 5 of the 6 modern "nuqta" (dotted) consonants (ਸ਼ ਖ਼ ਗ਼ ਜ਼ ਫ਼) — Perso-
 * Arabic/English loan sounds standard Gurmukhi didn't originally have,
 * added the same way Devanagari and Bengali gained ड़/ढ़/य़ and Tamil gained
 * its Grantha letters — on the same "small, closed, genuinely common in
 * modern usage" precedent as Tamil's Grantha inclusion (ਸ਼ੇਰ/lion, ਜ਼ਮੀਨ/
 * land, ਖ਼ਬਰ/news are everyday words, not obscure). The 6th, ਲ਼, was
 * researched and dropped — genuinely rare/regional with no attested example
 * word found, so it's omitted rather than filled with a fabricated one.
 *
 * Total: 10 vowels + 32 consonants + 5 nuqta letters (ਲ਼ omitted — no
 * attested example word found, see below) = 47. No conjunct set
 * added — Gurmukhi has no standard 3-letter "most common conjuncts" custom
 * comparable to Devanagari/Bengali/Tamil/Telugu/Kannada/Gujarati’s क्ष/त्र/
 * ज्ञ-equivalents, so adding one here would be forcing a false parallel.
 *
 * MNEMONIC CONVENTION: no confirmed Punjabi "as in" primer connector found.
 * `pa` has no `MNEMONIC_CONNECTOR` entry; falls back to bare juxtaposition.
 */
export const GURMUKHI_CHARACTERS: ScriptCharacterData[] = [
  // ---- ਸਵਰ (independently-pronounceable vowel forms) — 10 ----
  { character: 'ਅ', characterType: 'vowel', romanization: 'a', exampleWord: 'ਅੰਬ', exampleTransliteration: 'amb', exampleGloss: 'mango', sortOrder: 1 },
  { character: 'ਆ', characterType: 'vowel', romanization: 'aa', exampleWord: 'ਆਲੂ', exampleTransliteration: 'aloo', exampleGloss: 'potato', sortOrder: 2 },
  { character: 'ਇ', characterType: 'vowel', romanization: 'i', exampleWord: 'ਇੱਟ', exampleTransliteration: 'itt', exampleGloss: 'brick', sortOrder: 3 },
  { character: 'ਈ', characterType: 'vowel', romanization: 'ii', exampleWord: 'ਈਦ', exampleTransliteration: 'eid', exampleGloss: 'Eid (festival name)', sortOrder: 4 },
  { character: 'ਉ', characterType: 'vowel', romanization: 'u', exampleWord: 'ਉੱਲੂ', exampleTransliteration: 'ullu', exampleGloss: 'owl', sortOrder: 5 },
  { character: 'ਊ', characterType: 'vowel', romanization: 'uu', exampleWord: 'ਊਠ', exampleTransliteration: 'oot', exampleGloss: 'camel', sortOrder: 6 },
  { character: 'ਏ', characterType: 'vowel', romanization: 'e', exampleWord: 'ਏਕਤਾ', exampleTransliteration: 'ekta', exampleGloss: 'unity', sortOrder: 7 },
  { character: 'ਐ', characterType: 'vowel', romanization: 'ai', exampleWord: 'ਐਨਕ', exampleTransliteration: 'ainak', exampleGloss: 'spectacles', sortOrder: 8 },
  { character: 'ਓ', characterType: 'vowel', romanization: 'o', exampleWord: 'ਓਟ', exampleTransliteration: 'ot', exampleGloss: 'shelter/cover', sortOrder: 9 },
  { character: 'ਔ', characterType: 'vowel', romanization: 'au', exampleWord: 'ਔਰਤ', exampleTransliteration: 'aurat', exampleGloss: 'woman', sortOrder: 10 },

  // ---- ਵਿਅੰਜਨ (consonants) — ਸ/ਹ + the 5×6 varga grid = 32 ----
  { character: 'ਸ', characterType: 'consonant', romanization: 'sa', exampleWord: 'ਸੇਬ', exampleTransliteration: 'seb', exampleGloss: 'apple', sortOrder: 11 },
  { character: 'ਹ', characterType: 'consonant', romanization: 'ha', exampleWord: 'ਹਾਥੀ', exampleTransliteration: 'hathi', exampleGloss: 'elephant', sortOrder: 12 },
  { character: 'ਕ', characterType: 'consonant', romanization: 'ka', exampleWord: 'ਕਮਲ', exampleTransliteration: 'kamal', exampleGloss: 'lotus', sortOrder: 13 },
  { character: 'ਖ', characterType: 'consonant', romanization: 'kha', exampleWord: 'ਖਰਗੋਸ਼', exampleTransliteration: 'khargosh', exampleGloss: 'rabbit', sortOrder: 14 },
  { character: 'ਗ', characterType: 'consonant', romanization: 'ga', exampleWord: 'ਗਾਂ', exampleTransliteration: 'gaan', exampleGloss: 'cow', sortOrder: 15 },
  { character: 'ਘ', characterType: 'consonant', romanization: 'gha', exampleWord: 'ਘੜੀ', exampleTransliteration: 'ghadi', exampleGloss: 'clock/watch', sortOrder: 16 },
  { character: 'ਙ', characterType: 'consonant', romanization: 'nga', exampleWord: 'ਪੰਜ', exampleTransliteration: 'panj', exampleGloss: 'five (nearest attested word — see note)', sortOrder: 17, note: 'Genuinely uncertain: ਙ is exceptionally rare even medially in modern Gurmukhi, with most sources not attesting a clean everyday example — ਪੰਜ (five) uses ਨ/anusvara-equivalent nasalization, not literally ਙ, and is shown only as the best available approximation rather than a confidently sourced example. Flagged honestly rather than presented as verified.' },
  { character: 'ਚ', characterType: 'consonant', romanization: 'cha', exampleWord: 'ਚਮਚਾ', exampleTransliteration: 'chamcha', exampleGloss: 'spoon', sortOrder: 18 },
  { character: 'ਛ', characterType: 'consonant', romanization: 'chha', exampleWord: 'ਛਤਰੀ', exampleTransliteration: 'chhatri', exampleGloss: 'umbrella', sortOrder: 19 },
  { character: 'ਜ', characterType: 'consonant', romanization: 'ja', exampleWord: 'ਜੁੱਤੀ', exampleTransliteration: 'jutti', exampleGloss: 'shoe (traditional Punjabi jutti)', sortOrder: 20 },
  { character: 'ਝ', characterType: 'consonant', romanization: 'jha', exampleWord: 'ਝੰਡਾ', exampleTransliteration: 'jhanda', exampleGloss: 'flag', sortOrder: 21 },
  { character: 'ਞ', characterType: 'consonant', romanization: 'nya', exampleWord: 'ਗਿਆਨ', exampleTransliteration: 'giaan', exampleGloss: 'knowledge (nearest attested word — see note)', sortOrder: 22, note: 'ਞ is essentially unused in modern Gurmukhi, even more so than Devanagari’s ञ — "knowledge" (ਗਿਆਨ) is the standard Punjabi word for the CONCEPT but is spelled without ਞ in contemporary usage; shown as the closest honest approximation, not a verified ਞ-containing word.' },
  { character: 'ਟ', characterType: 'consonant', romanization: 'Ta', exampleWord: 'ਟਮਾਟਰ', exampleTransliteration: 'tamatar', exampleGloss: 'tomato', sortOrder: 23 },
  { character: 'ਠ', characterType: 'consonant', romanization: 'Tha', exampleWord: 'ਠੇਲਾ', exampleTransliteration: 'thela', exampleGloss: 'handcart', sortOrder: 24 },
  { character: 'ਡ', characterType: 'consonant', romanization: 'Da', exampleWord: 'ਡੱਬਾ', exampleTransliteration: 'dabba', exampleGloss: 'box', sortOrder: 25 },
  { character: 'ਢ', characterType: 'consonant', romanization: 'Dha', exampleWord: 'ਢੋਲ', exampleTransliteration: 'dhol', exampleGloss: 'drum (the iconic Punjabi instrument)', sortOrder: 26 },
  { character: 'ਣ', characterType: 'consonant', romanization: 'Na', exampleWord: 'ਬਾਣੀ', exampleTransliteration: 'baani', exampleGloss: 'hymn/scripture (Gurbani)', sortOrder: 27, note: 'ਣ (retroflex nasal) rarely starts native Punjabi words — ਬਾਣੀ (a culturally central Sikh term for sacred hymns) is a common medial example.' },
  { character: 'ਤ', characterType: 'consonant', romanization: 'ta', exampleWord: 'ਤਰਬੂਜ਼', exampleTransliteration: 'tarbooz', exampleGloss: 'watermelon', sortOrder: 28 },
  { character: 'ਥ', characterType: 'consonant', romanization: 'tha', exampleWord: 'ਥਾਲੀ', exampleTransliteration: 'thali', exampleGloss: 'plate', sortOrder: 29 },
  { character: 'ਦ', characterType: 'consonant', romanization: 'da', exampleWord: 'ਦਰਵਾਜ਼ਾ', exampleTransliteration: 'darvaza', exampleGloss: 'door', sortOrder: 30 },
  { character: 'ਧ', characterType: 'consonant', romanization: 'dha', exampleWord: 'ਧਨੁਸ਼', exampleTransliteration: 'dhanush', exampleGloss: 'bow', sortOrder: 31 },
  { character: 'ਨ', characterType: 'consonant', romanization: 'na', exampleWord: 'ਨਲ', exampleTransliteration: 'nal', exampleGloss: 'tap/faucet', sortOrder: 32 },
  { character: 'ਪ', characterType: 'consonant', romanization: 'pa', exampleWord: 'ਪਤੰਗ', exampleTransliteration: 'patang', exampleGloss: 'kite', sortOrder: 33 },
  { character: 'ਫ', characterType: 'consonant', romanization: 'pha', exampleWord: 'ਫਲ', exampleTransliteration: 'phal', exampleGloss: 'fruit', sortOrder: 34 },
  { character: 'ਬ', characterType: 'consonant', romanization: 'ba', exampleWord: 'ਬੱਕਰੀ', exampleTransliteration: 'bakri', exampleGloss: 'goat', sortOrder: 35 },
  { character: 'ਭ', characterType: 'consonant', romanization: 'bha', exampleWord: 'ਭਾਲੂ', exampleTransliteration: 'bhalu', exampleGloss: 'bear', sortOrder: 36 },
  { character: 'ਮ', characterType: 'consonant', romanization: 'ma', exampleWord: 'ਮੱਛੀ', exampleTransliteration: 'machhi', exampleGloss: 'fish', sortOrder: 37 },
  { character: 'ਯ', characterType: 'consonant', romanization: 'ya', exampleWord: 'ਯੋਗ', exampleTransliteration: 'yog', exampleGloss: 'yoga/union', sortOrder: 38 },
  { character: 'ਰ', characterType: 'consonant', romanization: 'ra', exampleWord: 'ਰੋਟੀ', exampleTransliteration: 'roti', exampleGloss: 'flatbread', sortOrder: 39 },
  { character: 'ਲ', characterType: 'consonant', romanization: 'la', exampleWord: 'ਲੱਡੂ', exampleTransliteration: 'laddu', exampleGloss: 'laddu (a round Indian sweet)', sortOrder: 40 },
  { character: 'ਵ', characterType: 'consonant', romanization: 'va', exampleWord: 'ਵਣ', exampleTransliteration: 'van', exampleGloss: 'forest', sortOrder: 41 },
  { character: 'ੜ', characterType: 'consonant', romanization: 'Ra', exampleWord: 'ਕੁੜੀ', exampleTransliteration: 'kudi', exampleGloss: 'girl', sortOrder: 42, note: 'ੜ (retroflex flap, unique to Gurmukhi among this pipeline’s scripts) rarely starts words — ਕੁੜੀ (girl) is an extremely common, iconic Punjabi medial example.' },

  // ---- nuqta (dotted) letters — Perso-Arabic/English loan sounds, see header ----
  { character: 'ਸ਼', characterType: 'consonant', romanization: 'sha', exampleWord: 'ਸ਼ੇਰ', exampleTransliteration: 'sher', exampleGloss: 'lion', sortOrder: 43 },
  { character: 'ਖ਼', characterType: 'consonant', romanization: 'khha', exampleWord: 'ਖ਼ਬਰ', exampleTransliteration: 'khabar', exampleGloss: 'news', sortOrder: 44 },
  { character: 'ਗ਼', characterType: 'consonant', romanization: 'ghha', exampleWord: 'ਗ਼ਰੀਬ', exampleTransliteration: 'ghareeb', exampleGloss: 'poor', sortOrder: 45 },
  { character: 'ਜ਼', characterType: 'consonant', romanization: 'za', exampleWord: 'ਜ਼ਮੀਨ', exampleTransliteration: 'zameen', exampleGloss: 'land', sortOrder: 46 },
  { character: 'ਫ਼', characterType: 'consonant', romanization: 'fa', exampleWord: 'ਫ਼ੌਜ', exampleTransliteration: 'fauj', exampleGloss: 'army', sortOrder: 47 },
  // ਲ਼ (retroflex l with nuqta) deliberately OMITTED — genuinely rare/regional
  // in standard modern Punjabi orthography, and no real attested example word
  // could be sourced. A missing letter is more honest than a fabricated one;
  // see this file's Gurmukhi header for the nuqta-set inclusion reasoning.
];

/**
 * Malayalam (`script: 'malayalam'`, live language `ml`) — the EIGHTH script
 * through this pipeline (2026-08-04). WebSearch-verified (italki, Preply,
 * easymalayalamtyping.com, cross-checked against a Dravidian-phonology
 * search): standard Malayalam അക്ഷരമാല (aksharamala) is commonly cited as
 * 15 സ്വരാക്ഷരം (swaraksharam, vowels — the same 11 core + അം/അഃ grouping
 * Devanagari uses) + 36 വ്യഞ്ജനാക്ഷരം (vyanjanaksharam, consonants — the
 * standard 5×5 varga (25) + യ ര ല വ (4) + ശ ഷ സ ഹ (4) + ള ഴ റ (3), the same
 * three Dravidian-family retroflex/trill letters Tamil/Telugu/Kannada all
 * carry) = 51. This dataset adds the same 3 conjuncts (ക്ഷ ത്ര ജ്ഞ) as every
 * other script here, since Malayalam charts commonly include ക്ഷ as a 52nd
 * letter anyway — 54 rows total. Malayalam's unique "chillu" letters
 * (independent word-final consonant forms, e.g. ൽ ൾ ൺ) are a real,
 * separate feature some sources fold into a "56 letters" count — explicitly
 * OUT OF SCOPE here, matching this pipeline's existing precedent of not
 * chasing every possible extended-letter set (Tamil's 216 vowel-consonant
 * combinations were likewise never attempted).
 *
 * A GENUINE, STRIKING COGNATE CORROBORATION, not engineered: Malayalam and
 * Tamil historically diverged from a common proto-language, and it shows —
 * Malayalam's ഴ example (പഴം, "fruit") and റ example (ആറ്, "river/six")
 * are the EXACT SAME WORDS as Tamil's பழம்/ஆறு for the cognate letters ழ/ற,
 * discovered independently while researching each script, not copied across.
 * The retroflex-nasal "butter" pattern already found across Tamil/Telugu/
 * Kannada (வெண்ணை/వెన్న/ಬೆಣ್ಣೆ) extends to Malayalam too: വെണ്ണ.
 *
 * A REAL CORRECTION TO AN ASSUMED PATTERN, caught during research rather
 * than blindly extended: every other Dravidian script in this pipeline has
 * its palatal nasal (ஞ/ఞ/ಞ) restricted from starting native words — but
 * Malayalam's ഞ is NOT restricted the same way: ഞാൻ ("I", the first-person
 * pronoun) is one of the most common words in the language and genuinely
 * begins with ഞ. Using it as the example rather than assuming the Tamil/
 * Telugu/Kannada restriction carried over unchanged is exactly the kind of
 * per-script verification this pipeline's discipline requires.
 *
 * MNEMONIC CONVENTION: no confirmed Malayalam "as in" primer connector was
 * found. `ml` has no `MNEMONIC_CONNECTOR` entry; falls back to bare
 * juxtaposition.
 */
export const MALAYALAM_CHARACTERS: ScriptCharacterData[] = [
  // ---- സ്വരാക്ഷരം (swaraksharam, vowels) — 11 core + അം/അഃ = 13... plus rare-vowel entries = 15 ----
  { character: 'അ', characterType: 'vowel', romanization: 'a', exampleWord: 'അമ്മ', exampleTransliteration: 'amma', exampleGloss: 'mother', sortOrder: 1 },
  { character: 'ആ', characterType: 'vowel', romanization: 'aa', exampleWord: 'ആന', exampleTransliteration: 'aana', exampleGloss: 'elephant', sortOrder: 2 },
  { character: 'ഇ', characterType: 'vowel', romanization: 'i', exampleWord: 'ഇല', exampleTransliteration: 'ila', exampleGloss: 'leaf', sortOrder: 3 },
  { character: 'ഈ', characterType: 'vowel', romanization: 'ii', exampleWord: 'ഈച്ച', exampleTransliteration: 'eecha', exampleGloss: 'housefly', sortOrder: 4 },
  { character: 'ഉ', characterType: 'vowel', romanization: 'u', exampleWord: 'ഉറുമ്പ്', exampleTransliteration: 'urumbu', exampleGloss: 'ant', sortOrder: 5 },
  { character: 'ഊ', characterType: 'vowel', romanization: 'uu', exampleWord: 'ഊഞ്ഞാൽ', exampleTransliteration: 'oonjal', exampleGloss: 'swing', sortOrder: 6 },
  { character: 'ഋ', characterType: 'vowel', romanization: 'ru', exampleWord: 'ഋഷി', exampleTransliteration: 'rushi', exampleGloss: 'sage', sortOrder: 7 },
  { character: 'എ', characterType: 'vowel', romanization: 'e', exampleWord: 'എലി', exampleTransliteration: 'eli', exampleGloss: 'mouse/rat', sortOrder: 8 },
  { character: 'ഏ', characterType: 'vowel', romanization: 'ee', exampleWord: 'ഏണി', exampleTransliteration: 'yeni', exampleGloss: 'ladder', sortOrder: 9 },
  { character: 'ഐ', characterType: 'vowel', romanization: 'ai', exampleWord: 'ഐശ്വര്യം', exampleTransliteration: 'aishwaryam', exampleGloss: 'prosperity', sortOrder: 10, note: 'ഐ is Malayalam’s rarest core vowel, almost exclusively in Sanskrit loanwords.' },
  { character: 'ഒ', characterType: 'vowel', romanization: 'o', exampleWord: 'ഒട്ടകം', exampleTransliteration: 'ottakam', exampleGloss: 'camel', sortOrder: 11 },
  { character: 'ഓ', characterType: 'vowel', romanization: 'oo', exampleWord: 'ഓണം', exampleTransliteration: 'onam', exampleGloss: 'Onam (Kerala’s harvest festival)', sortOrder: 12 },
  { character: 'ഔ', characterType: 'vowel', romanization: 'au', exampleWord: 'ഔഷധം', exampleTransliteration: 'aushadham', exampleGloss: 'medicine', sortOrder: 13, note: 'The same recurring cross-script "medicine" example already confirmed for this vowel’s equivalent in Devanagari, Bengali, Tamil, Telugu, Kannada, and Gujarati.' },
  { character: 'അം', characterType: 'vowel', romanization: 'am', exampleWord: 'അംഗം', exampleTransliteration: 'angam', exampleGloss: 'limb/part', sortOrder: 14 },
  { character: 'അഃ', characterType: 'vowel', romanization: 'aha', exampleWord: 'ദുഃഖം', exampleTransliteration: 'dukham', exampleGloss: 'sorrow', sortOrder: 15, note: 'Visarga essentially never begins a word — the same word Devanagari, Bengali, Telugu, Kannada, and Gujarati all use for their own visarga example.' },

  // ---- വ്യഞ്ജനാക്ഷരം (vyanjanaksharam, consonants) — 5×5 varga + അന്തസ്ഥ + ഊഷ്മ + ള/ഴ/റ = 36 ----
  { character: 'ക', characterType: 'consonant', romanization: 'ka', exampleWord: 'കമലം', exampleTransliteration: 'kamalam', exampleGloss: 'lotus', sortOrder: 16 },
  { character: 'ഖ', characterType: 'consonant', romanization: 'kha', exampleWord: 'ഖഡ്ഗം', exampleTransliteration: 'khadgam', exampleGloss: 'sword', sortOrder: 17 },
  { character: 'ഗ', characterType: 'consonant', romanization: 'ga', exampleWord: 'ഗാനം', exampleTransliteration: 'ganam', exampleGloss: 'song', sortOrder: 18 },
  { character: 'ഘ', characterType: 'consonant', romanization: 'gha', exampleWord: 'ഘടികാരം', exampleTransliteration: 'ghatikaram', exampleGloss: 'clock/watch', sortOrder: 19 },
  { character: 'ങ', characterType: 'consonant', romanization: 'nga', exampleWord: 'മാങ്ങ', exampleTransliteration: 'maanga', exampleGloss: 'mango', sortOrder: 20, note: 'ങ rarely begins a native Malayalam word — മാങ്ങ (mango) is a common, everyday medial example.' },
  { character: 'ച', characterType: 'consonant', romanization: 'cha', exampleWord: 'ചെടി', exampleTransliteration: 'chedi', exampleGloss: 'plant', sortOrder: 21 },
  { character: 'ഛ', characterType: 'consonant', romanization: 'chha', exampleWord: 'ഛത്രം', exampleTransliteration: 'chhatram', exampleGloss: 'umbrella', sortOrder: 22 },
  { character: 'ജ', characterType: 'consonant', romanization: 'ja', exampleWord: 'ജനൽ', exampleTransliteration: 'janal', exampleGloss: 'window', sortOrder: 23 },
  { character: 'ഝ', characterType: 'consonant', romanization: 'jha', exampleWord: 'ഝരി', exampleTransliteration: 'jhari', exampleGloss: 'stream/waterfall', sortOrder: 24, note: 'Genuinely few everyday Malayalam words use ഝ — ഝരി (a literary word for a mountain stream) is the best attested example, same rarity already confirmed for Telugu’s ఝ and Kannada’s ಝ.' },
  { character: 'ഞ', characterType: 'consonant', romanization: 'nya', exampleWord: 'ഞാൻ', exampleTransliteration: 'njaan', exampleGloss: 'I (first-person pronoun)', sortOrder: 25, note: 'Unlike its cognate nasal in Tamil/Telugu/Kannada (ஞ/ఞ/ಞ, all restricted from starting words), Malayalam’s ഞ is NOT restricted — ഞാൻ ("I") is one of the most common words in the language and genuinely begins with ഞ. Verified per-script rather than assumed to carry the same restriction as its Dravidian relatives.' },
  { character: 'ട', characterType: 'consonant', romanization: 'Ta', exampleWord: 'ടിക്കറ്റ്', exampleTransliteration: 'ticket', exampleGloss: 'ticket (loanword)', sortOrder: 26, note: 'No clean everyday native/Sanskrit-tatsama ട-initial noun was found — ടിക്കറ്റ് (ticket) is a genuine, extremely common everyday loanword, an honest choice over a strained native alternative.' },
  { character: 'ഠ', characterType: 'consonant', romanization: 'Tha', exampleWord: 'കണ്ഠം', exampleTransliteration: 'kantham', exampleGloss: 'throat', sortOrder: 27, note: 'ഠ rarely starts native Malayalam words; കണ്ഠം (throat) is a common medial example, the same word Telugu and Kannada use for their own ഠ-equivalents.' },
  { character: 'ഡ', characterType: 'consonant', romanization: 'Da', exampleWord: 'ഡബ്ബ', exampleTransliteration: 'dabba', exampleGloss: 'box', sortOrder: 28 },
  { character: 'ഢ', characterType: 'consonant', romanization: 'Dha', exampleWord: 'ഢോൽ', exampleTransliteration: 'dhol', exampleGloss: 'drum', sortOrder: 29 },
  { character: 'ണ', characterType: 'consonant', romanization: 'Na', exampleWord: 'വെണ്ണ', exampleTransliteration: 'venna', exampleGloss: 'butter', sortOrder: 30, note: 'ണ (retroflex nasal) rarely starts native Malayalam words — വെണ്ണ (butter) extends the same four-way Dravidian "butter" corroboration already found for Tamil’s ண, Telugu’s ణ, and Kannada’s ಣ.' },
  { character: 'ത', characterType: 'consonant', romanization: 'ta', exampleWord: 'തേൻ', exampleTransliteration: 'then', exampleGloss: 'honey', sortOrder: 31 },
  { character: 'ഥ', characterType: 'consonant', romanization: 'tha', exampleWord: 'അനാഥ', exampleTransliteration: 'anaatha', exampleGloss: 'orphan', sortOrder: 32, note: 'ഥ rarely starts native Malayalam words; അനാഥ (orphan) is the same medial example Telugu and Kannada use for their own ഥ-equivalents.' },
  { character: 'ദ', characterType: 'consonant', romanization: 'da', exampleWord: 'ദീപം', exampleTransliteration: 'deepam', exampleGloss: 'lamp', sortOrder: 33 },
  { character: 'ധ', characterType: 'consonant', romanization: 'dha', exampleWord: 'ധനുസ്സ്', exampleTransliteration: 'dhanussu', exampleGloss: 'bow', sortOrder: 34 },
  { character: 'ന', characterType: 'consonant', romanization: 'na', exampleWord: 'നായ', exampleTransliteration: 'naaya', exampleGloss: 'dog', sortOrder: 35 },
  { character: 'പ', characterType: 'consonant', romanization: 'pa', exampleWord: 'പൂവ്', exampleTransliteration: 'poovu', exampleGloss: 'flower', sortOrder: 36 },
  { character: 'ഫ', characterType: 'consonant', romanization: 'pha', exampleWord: 'ഫലം', exampleTransliteration: 'phalam', exampleGloss: 'fruit', sortOrder: 37 },
  { character: 'ബ', characterType: 'consonant', romanization: 'ba', exampleWord: 'ബലം', exampleTransliteration: 'balam', exampleGloss: 'strength', sortOrder: 38 },
  { character: 'ഭ', characterType: 'consonant', romanization: 'bha', exampleWord: 'ഭല്ലൂകം', exampleTransliteration: 'bhallookam', exampleGloss: 'bear', sortOrder: 39 },
  { character: 'മ', characterType: 'consonant', romanization: 'ma', exampleWord: 'മീൻ', exampleTransliteration: 'meen', exampleGloss: 'fish', sortOrder: 40 },
  { character: 'യ', characterType: 'consonant', romanization: 'ya', exampleWord: 'യന്ത്രം', exampleTransliteration: 'yantram', exampleGloss: 'machine', sortOrder: 41 },
  { character: 'ര', characterType: 'consonant', romanization: 'ra', exampleWord: 'രഥം', exampleTransliteration: 'ratham', exampleGloss: 'chariot', sortOrder: 42 },
  { character: 'ല', characterType: 'consonant', romanization: 'la', exampleWord: 'ലഡ്ഡു', exampleTransliteration: 'laddu', exampleGloss: 'laddu (a round Indian sweet)', sortOrder: 43 },
  { character: 'വ', characterType: 'consonant', romanization: 'va', exampleWord: 'വനം', exampleTransliteration: 'vanam', exampleGloss: 'forest', sortOrder: 44 },
  { character: 'ശ', characterType: 'consonant', romanization: 'sha', exampleWord: 'ശലഭം', exampleTransliteration: 'shalabham', exampleGloss: 'butterfly', sortOrder: 45 },
  { character: 'ഷ', characterType: 'consonant', romanization: 'Sha', exampleWord: 'ഷഡ്ഭുജം', exampleTransliteration: 'shadbhujam', exampleGloss: 'hexagon', sortOrder: 46 },
  { character: 'സ', characterType: 'consonant', romanization: 'sa', exampleWord: 'സൂര്യൻ', exampleTransliteration: 'suryan', exampleGloss: 'sun', sortOrder: 47 },
  { character: 'ഹ', characterType: 'consonant', romanization: 'ha', exampleWord: 'ഹംസം', exampleTransliteration: 'hamsam', exampleGloss: 'swan', sortOrder: 48 },
  { character: 'ള', characterType: 'consonant', romanization: 'La', exampleWord: 'കാള', exampleTransliteration: 'kaala', exampleGloss: 'bull/ox', sortOrder: 49, note: 'ള (retroflex l) rarely starts native Malayalam words, same Dravidian-family pattern as Tamil’s ள, Telugu’s ళ, and Kannada’s ಳ.' },
  { character: 'ഴ', characterType: 'consonant', romanization: 'zha', exampleWord: 'പഴം', exampleTransliteration: 'pazham', exampleGloss: 'fruit', sortOrder: 50, note: 'ഴ rarely starts native Malayalam words — പഴം is the exact same cognate word Tamil uses for its own ழ example, reflecting the two languages’ shared origin.' },
  { character: 'റ', characterType: 'consonant', romanization: 'Ra', exampleWord: 'ആറ്', exampleTransliteration: 'aaru', exampleGloss: 'river/six', sortOrder: 51, note: 'റ rarely starts native Malayalam words — ആറ് is the exact same cognate word Tamil uses for its own ற example.' },

  // ---- conjuncts — same "3 most common" precedent as every other script here ----
  { character: 'ക്ഷ', characterType: 'conjunct', romanization: 'ksha', exampleWord: 'ക്ഷണം', exampleTransliteration: 'kshanam', exampleGloss: 'moment/instant', sortOrder: 52 },
  { character: 'ത്ര', characterType: 'conjunct', romanization: 'tra', exampleWord: 'ത്രികോണം', exampleTransliteration: 'trikonam', exampleGloss: 'triangle', sortOrder: 53 },
  { character: 'ജ്ഞ', characterType: 'conjunct', romanization: 'jnya', exampleWord: 'ജ്ഞാനം', exampleTransliteration: 'jnanam', exampleGloss: 'knowledge', sortOrder: 54 },
];

/**
 * Urdu (`script: 'arabic'` in `@sarvabhasha/shared`'s `languages.ts`, live
 * language `ur`) — the NINTH script authored through this pipeline
 * (2026-08-04), and the first that is NOT a Brahmic abugida. Perso-Arabic
 * Nastaliq, written RIGHT-TO-LEFT — every other script here is
 * left-to-right. See the run's own task brief for the full list of
 * structural differences this required verifying rather than assuming; this
 * header documents what was actually found.
 *
 * SOURCING (WebSearch-verified across multiple independent sources —
 * Wikipedia's "Urdu alphabet" article, r12a.github.io's Urdu orthography
 * notes, and cross-checked against desilingua.net/remitly.com/kylian.ai):
 * all agree the Urdu حروفِ تہجی (huroof-e-tahajji) is standardly cited as 39
 * letters — the 28 core Arabic letters, plus 4 Persian additions (پ چ ژ گ),
 * plus 6 more South-Asian-specific additions Urdu itself contributes beyond
 * Persian (ٹ ڈ ڑ retroflex stops/flap, ں nasalization marker, ھ aspiration
 * marker, ے a vowel-only "bari ye"), plus ء (hamza) and the base ح/ہ/ی/و
 * already counted among the 28. A handful of sources count a 40th letter by
 * additionally splitting out آ (alif madda, "alif" + the madda diacritic) —
 * this dataset follows the more common 39-letter convention and does NOT
 * give آ its own row, same "pick the standard convention, document the
 * alternative" discipline as Bengali's chandrabindu-classification note.
 *
 * ROW ORDER IS THE REAL huroof-e-tahajji ORDER, NOT a "vowels block, then
 * consonants block" grouping the way every OTHER script in this file is
 * laid out. This is a deliberate, verified difference, not an oversight:
 * Urdu's own pedagogical tradition interleaves its 4 vowel-carrying letters
 * (ا و ی ے) into their natural alphabetical position among the 35
 * consonants — it does not front-load them the way Devanagari's स्वर/
 * व्यंजन split or Malayalam's സ്വരാക്ഷരം/വ്യഞ്ജനാക്ഷരം split does. Re-sorting
 * to LOOK like the other 8 scripts would misrepresent Urdu's actual
 * alphabet, which is exactly the mistake Bengali's header already warns
 * against ("do not fix this to match — it is [this script's] own
 * convention"). `characterType` still correctly marks each of the 4 as
 * `'vowel'` (ا alif, و vao, ی choti ye, ے bari ye — Urdu's own حروفِ علت،
 * huroof-e-illat, "weak/vowel letters" classification, confirmed via
 * chiragh-e-urdu.org's lesson materials and Rekhta Dictionary — the
 * remaining 35 are `'consonant'`); there is no `'conjunct'` row for Urdu —
 * Nastaliq has no Sanskrit-style fused-glyph conjunct tradition, and the
 * closest analogue (aspirated digraphs like پھ/بھ/تھ, a base consonant
 * immediately followed by ھ) is explicitly OUT OF SCOPE as its own flashcard
 * row: both halves (e.g. پ and ھ) already have their own row, and the
 * `character` field is one glyph per the run brief, not a two-glyph
 * digraph — same "don't chase every extended combination" precedent as
 * Malayalam's chillu letters or Tamil's 216 vowel-consonant ligatures.
 *
 * ISOLATED PRESENTATION FORMS ONLY: every `character` value below is the
 * standalone/isolated Unicode codepoint for that letter (e.g. U+0628 ب, not
 * a mid-word medial/initial contextual glyph) — the correct choice for a
 * "here is the letter" flashcard per the run brief; Urdu text shaping
 * (initial/medial/final/isolated) is expected to be handled by the
 * rendering font/OS, not baked into the stored character.
 *
 * POSITION-RESTRICTED LETTERS (a real structural fact about Urdu
 * orthography, not a research gap — confirmed independently by both
 * Wikipedia's and r12a's letter tables): ڑ (retroflex flap), ں
 * (nasalization), ھ (aspiration marker), and ے (bari ye) never occur
 * word-INITIALLY. Each is given a genuine, common medial/final example
 * instead, flagged with `note`, the same honest-gap discipline as
 * Devanagari's ङ/ञ/अः or Bengali's ড়.
 *
 * HAMZA (ء) IS A SPECIAL CASE, not just position-restricted: Urdu almost
 * never writes it as the bare ء glyph inside a real word — it is nearly
 * always "seated" on a carrier (ؤ wao-seat or ئ yeh-seat) depending on
 * surrounding vowels (confirmed via talkpal.ai's and Columbia's Urdu-program
 * hamza handouts). گاؤں (village) is used as the example, with hamza carried
 * on و rather than appearing bare — flagged with `note` rather than silently
 * presenting a hamza-in-isolation example that doesn't reflect how the
 * letter is actually encountered in real text.
 *
 * SOUND MERGERS: modern spoken Urdu has collapsed several historically
 * distinct Arabic letters onto the same sound — ث/ص/س all →/s/, ذ/ز/ض/ظ all
 * →/z/, ط/ت both →/t/, ح/ہ both →/h/ — while orthography still requires
 * knowing which specific letter a word is spelled with. Because of this,
 * `romanization` below is the letter's traditional NAME (alif, be, se,
 * zwad, zoe, …) rather than a sound-based syllable the way Devanagari's
 * 'ka'/'kha' are — a name-based scheme is both the standard convention used
 * across every Urdu-teaching resource consulted and the only way to keep 39
 * rows individually identifiable when several genuinely sound identically.
 * Retroflex letters still get the same capitalized-first-letter treatment
 * this project already uses elsewhere (ٹ 'Te' vs ت 'te', ڈ 'Dal' vs د 'dal',
 * ڑ 'Re' vs ر 're') for at-a-glance consistency with Devanagari/Malayalam's
 * Ta/Da/Ra convention.
 *
 * A GENUINE, EXPECTED COGNATE PATTERN, not a coincidence worth treating as a
 * "discovery" the way Malayalam/Tamil's was: Hindi and Urdu are the same
 * spoken language (Hindustani) in two different scripts/registers, so a
 * large fraction of the example words below are the literal same word as
 * Devanagari's own picks for the phonetically closest letter — انار/अनार
 * (anaar), بکری/बकरी (bakri), خرگوش/खरगोश (khargosh), عینک/ऐनक (ainak, a
 * genuine shared Perso-Arabic loanword in both), ہاتھی/हाथी (haathi),
 * دروازہ/दरवाज़ा (darwaza), and more, noted inline only where the parallel
 * is worth flagging (loanword cases), not on every plain cognate.
 *
 * MNEMONIC CONVENTION: `ur` DOES get a `MNEMONIC_CONNECTOR` entry in
 * `bhashini/aksharmalaTts.ts` — سے ("se"), the same word as Hindi's से and
 * for the same reason (Hindi and Urdu share this postposition). Verified via
 * a real published primer, "ا سے اُردو" (Alif Se Urdu, Sarah Hashmi) using
 * exactly this "<letter> سے <word>" title pattern, plus general confirmation
 * this is the standard Urdu-medium primary-school approach — not assumed
 * from the Hindi precedent alone.
 */
export const URDU_CHARACTERS: ScriptCharacterData[] = [
  { character: 'ا', characterType: 'vowel', romanization: 'alif', exampleWord: 'انار', exampleTransliteration: 'anaar', exampleGloss: 'pomegranate', sortOrder: 1 },
  { character: 'ب', characterType: 'consonant', romanization: 'be', exampleWord: 'بکری', exampleTransliteration: 'bakri', exampleGloss: 'goat', sortOrder: 2 },
  { character: 'پ', characterType: 'consonant', romanization: 'pe', exampleWord: 'پانی', exampleTransliteration: 'paani', exampleGloss: 'water', sortOrder: 3 },
  { character: 'ت', characterType: 'consonant', romanization: 'te', exampleWord: 'تربوز', exampleTransliteration: 'tarbooz', exampleGloss: 'watermelon', sortOrder: 4 },
  { character: 'ٹ', characterType: 'consonant', romanization: 'Te', exampleWord: 'ٹماٹر', exampleTransliteration: 'tamatar', exampleGloss: 'tomato', sortOrder: 5 },
  { character: 'ث', characterType: 'consonant', romanization: 'se', exampleWord: 'ثبوت', exampleTransliteration: 'saboot', exampleGloss: 'proof/evidence', sortOrder: 6, note: 'ث is an Arabic-origin letter pronounced identically to س/ص in modern Urdu (historical distinction preserved in spelling only). ثبوت is a genuinely common word (news/legal register), not a strained pick.' },
  { character: 'ج', characterType: 'consonant', romanization: 'jeem', exampleWord: 'جوتا', exampleTransliteration: 'joota', exampleGloss: 'shoe', sortOrder: 7 },
  { character: 'چ', characterType: 'consonant', romanization: 'che', exampleWord: 'چمچہ', exampleTransliteration: 'chamcha', exampleGloss: 'spoon', sortOrder: 8 },
  { character: 'ح', characterType: 'consonant', romanization: 'hay', exampleWord: 'حلوہ', exampleTransliteration: 'halwa', exampleGloss: 'halwa (a sweet dessert)', sortOrder: 9, note: 'ح ("bari he") is phonetically merged with ہ ("choti he") in modern spoken Urdu — both approximate /h/, distinguished only in spelling, same historical-merger pattern as this script’s s-group (ث/ص/س) and z-group (ذ/ز/ض/ظ) letters.' },
  { character: 'خ', characterType: 'consonant', romanization: 'khe', exampleWord: 'خرگوش', exampleTransliteration: 'khargosh', exampleGloss: 'rabbit', sortOrder: 10, note: 'خرگوش is the same Perso-Arabic-origin loanword Devanagari’s ख uses for its own खरगोश — a genuine shared borrowing, not an independent coincidence.' },
  { character: 'د', characterType: 'consonant', romanization: 'dal', exampleWord: 'دروازہ', exampleTransliteration: 'darwaza', exampleGloss: 'door', sortOrder: 11 },
  { character: 'ڈ', characterType: 'consonant', romanization: 'Dal', exampleWord: 'ڈبہ', exampleTransliteration: 'dibba', exampleGloss: 'box', sortOrder: 12 },
  { character: 'ذ', characterType: 'consonant', romanization: 'zal', exampleWord: 'ذائقہ', exampleTransliteration: 'zaaiqa', exampleGloss: 'taste/flavor', sortOrder: 13, note: 'ذ is pronounced identically to ز/ض/ظ in modern Urdu (/z/); ذائقہ is a genuinely common everyday word rather than an obscure Arabic-origin pick.' },
  { character: 'ر', characterType: 'consonant', romanization: 're', exampleWord: 'روٹی', exampleTransliteration: 'roti', exampleGloss: 'flatbread', sortOrder: 14 },
  { character: 'ڑ', characterType: 'consonant', romanization: 'Re', exampleWord: 'گھوڑا', exampleTransliteration: 'ghoraa', exampleGloss: 'horse', sortOrder: 15, note: 'ڑ (retroflex flap) never occurs word-initially in Urdu (confirmed structural restriction, same category as Devanagari’s ङ/ञ) — گھوڑا is a standard medial example.' },
  { character: 'ز', characterType: 'consonant', romanization: 'ze', exampleWord: 'زبان', exampleTransliteration: 'zabaan', exampleGloss: 'tongue/language', sortOrder: 16 },
  { character: 'ژ', characterType: 'consonant', romanization: 'zhe', exampleWord: 'ژالہ', exampleTransliteration: 'zhaala', exampleGloss: 'hailstone', sortOrder: 17, note: 'ژ is the rarest Urdu letter, used almost exclusively in Persian-origin loanwords. ژالہ (hailstone) is the standard, dictionary-confirmed primer example — same rarity category as Devanagari’s ङ or Bengali’s ঞ.' },
  { character: 'س', characterType: 'consonant', romanization: 'seen', exampleWord: 'سورج', exampleTransliteration: 'sooraj', exampleGloss: 'sun', sortOrder: 18 },
  { character: 'ش', characterType: 'consonant', romanization: 'sheen', exampleWord: 'شیر', exampleTransliteration: 'sher', exampleGloss: 'lion', sortOrder: 19 },
  { character: 'ص', characterType: 'consonant', romanization: 'swad', exampleWord: 'صابن', exampleTransliteration: 'saabun', exampleGloss: 'soap', sortOrder: 20, note: 'ص is pronounced identically to ث/س in modern Urdu (/s/).' },
  { character: 'ض', characterType: 'consonant', romanization: 'zwad', exampleWord: 'ضد', exampleTransliteration: 'zid', exampleGloss: 'stubbornness/insistence', sortOrder: 21 },
  { character: 'ط', characterType: 'consonant', romanization: 'toe', exampleWord: 'طوطا', exampleTransliteration: 'tota', exampleGloss: 'parrot', sortOrder: 22, note: 'Verified (cross-checked against multiple Urdu dictionaries) that طوطا, spelled with ط, is the standard form — توتا (with ت) appears only as a rarer informal variant.' },
  { character: 'ظ', characterType: 'consonant', romanization: 'zoe', exampleWord: 'ظالم', exampleTransliteration: 'zaalim', exampleGloss: 'cruel/tyrant', sortOrder: 23, note: 'ظ is the rarest of Urdu’s four letters pronounced /z/ (ز ذ ض ظ); ظالم is a genuinely common adjective.' },
  { character: 'ع', characterType: 'consonant', romanization: 'ain', exampleWord: 'عینک', exampleTransliteration: 'ainak', exampleGloss: 'spectacles', sortOrder: 24, note: 'عینک is the same Perso-Arabic loanword Devanagari’s ऐ uses for its own ऐनक — genuinely borrowed into Hindi via Urdu/Persian, not independently coincidental.' },
  { character: 'غ', characterType: 'consonant', romanization: 'ghain', exampleWord: 'غبارہ', exampleTransliteration: 'ghubaara', exampleGloss: 'balloon', sortOrder: 25 },
  { character: 'ف', characterType: 'consonant', romanization: 'fe', exampleWord: 'فرش', exampleTransliteration: 'farsh', exampleGloss: 'floor', sortOrder: 26 },
  { character: 'ق', characterType: 'consonant', romanization: 'qaf', exampleWord: 'قلم', exampleTransliteration: 'qalam', exampleGloss: 'pen', sortOrder: 27 },
  { character: 'ک', characterType: 'consonant', romanization: 'kaf', exampleWord: 'کنول', exampleTransliteration: 'kanwal', exampleGloss: 'lotus', sortOrder: 28, note: 'کنول is Urdu/Persian’s own word for lotus — the same concept as Devanagari’s क uses (कमल, from a different Sanskrit root), a conceptual rather than literal cognate.' },
  { character: 'گ', characterType: 'consonant', romanization: 'gaf', exampleWord: 'گائے', exampleTransliteration: 'gaay', exampleGloss: 'cow', sortOrder: 29 },
  { character: 'ل', characterType: 'consonant', romanization: 'lam', exampleWord: 'لڈو', exampleTransliteration: 'laddu', exampleGloss: 'laddu (a round Indian sweet)', sortOrder: 30 },
  { character: 'م', characterType: 'consonant', romanization: 'meem', exampleWord: 'مچھلی', exampleTransliteration: 'machhli', exampleGloss: 'fish', sortOrder: 31 },
  { character: 'ن', characterType: 'consonant', romanization: 'noon', exampleWord: 'نل', exampleTransliteration: 'nal', exampleGloss: 'tap/faucet', sortOrder: 32 },
  { character: 'ں', characterType: 'consonant', romanization: 'noon-ghunna', exampleWord: 'کہاں', exampleTransliteration: 'kahaan', exampleGloss: 'where', sortOrder: 33, note: 'ں (nasalization marker) never occurs word-initially, only word-finally — same restricted-position category as ڑ/ھ/ے.' },
  { character: 'و', characterType: 'vowel', romanization: 'vao', exampleWord: 'وقت', exampleTransliteration: 'waqt', exampleGloss: 'time', sortOrder: 34 },
  { character: 'ہ', characterType: 'consonant', romanization: 'he', exampleWord: 'ہاتھی', exampleTransliteration: 'haathi', exampleGloss: 'elephant', sortOrder: 35 },
  { character: 'ھ', characterType: 'consonant', romanization: 'do-chashmi-he', exampleWord: 'پھول', exampleTransliteration: 'phool', exampleGloss: 'flower', sortOrder: 36, note: 'ھ (do-chashmi he, the aspiration marker) never occurs independently or word-initially — it is always the SECOND half of a consonant+ھ digraph (e.g. پھ = "ph" as in پھول). A structural fact, not a research gap: unlike every other Urdu letter, ھ has no standalone word of its own.' },
  { character: 'ء', characterType: 'consonant', romanization: 'hamza', exampleWord: 'گاؤں', exampleTransliteration: 'gaaon', exampleGloss: 'village', sortOrder: 37, note: 'Hamza almost never appears as the bare ء glyph inside a real word — Urdu orthography seats it on a carrier depending on surrounding vowels (here, ؤ — wao-seat). گاؤں is the standard, extremely common example; the glyph on the card is the isolated letter form, not how it is actually encountered in text.' },
  { character: 'ی', characterType: 'vowel', romanization: 'ye', exampleWord: 'یار', exampleTransliteration: 'yaar', exampleGloss: 'friend', sortOrder: 38 },
  { character: 'ے', characterType: 'vowel', romanization: 'bari-ye', exampleWord: 'چائے', exampleTransliteration: 'chaay', exampleGloss: 'tea', sortOrder: 39, note: 'ے (bari ye) never occurs word-initially — it is a word-final/medial-only vowel letter. چائے is the standard, extremely common example.' },
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
/**
 * Clothes (2026-08-04, third follow-on pass). `imageSubject` describes a
 * single garment laid flat / displayed on its own — explicitly "no person
 * wearing it" on every item, same "generic, not a specific character"
 * discipline as `familyIconPrompt`/`bodyPartImagePrompt`: a garment shown
 * being worn risks reading as a copy of the locked four-character cast.
 *
 * Words are everyday spoken Hindi, mixing native/Urdu-origin terms already
 * naturalized into common usage (कमीज़, दुपट्टा, रूमाल) with common English
 * loanwords that are themselves the dominant real-world usage (पैंट, स्कर्ट,
 * स्वेटर, जैकेट, बेल्ट) — same "most natural common word" bar as every prior
 * category, not a purist-native-only constraint.
 */
export const CLOTHES: FamilyItem[] = [
  { itemKey: 'shirt', englishWord: 'Shirt', text: 'कमीज़', transliteration: 'kameez', imageSubject: 'a single collared button-front shirt laid flat, no person wearing it' },
  { itemKey: 'pants', englishWord: 'Pants / Trousers', text: 'पैंट', transliteration: 'paint', imageSubject: 'a single pair of trousers laid flat, no person wearing them' },
  { itemKey: 'saree', englishWord: 'Saree', text: 'साड़ी', transliteration: 'saadi', imageSubject: 'a single folded saree in a vibrant solid colour with a decorative border, laid flat, no person wearing it' },
  { itemKey: 'kurta', englishWord: 'Kurta', text: 'कुर्ता', transliteration: 'kurta', imageSubject: 'a single long kurta shirt laid flat, no person wearing it, entirely plain solid-colour fabric with a plain solid-colour collar and cuffs (a single flat stripe of contrasting colour only, absolutely no decorative border pattern, no motifs, no repeating shapes or swirls of any kind that could resemble writing), no embroidery, no signature, stamp, or symbols anywhere on the garment or in any corner of the image' },
  { itemKey: 'shoes', englishWord: 'Shoes', text: 'जूते', transliteration: 'joote', imageSubject: 'a single pair of simple everyday shoes, side view, no person wearing them' },
  { itemKey: 'socks', englishWord: 'Socks', text: 'मोज़े', transliteration: 'moze', imageSubject: 'a single pair of matching socks laid flat, no person wearing them' },
  { itemKey: 'cap', englishWord: 'Cap', text: 'टोपी', transliteration: 'topi', imageSubject: 'a single baseball-style cap viewed from the side, with a long, flat, rigid brim/visor jutting straight out to one side — the brim is the dominant, unmistakable feature of the image, clearly a separate flat curved piece of fabric extending outward, NOT rounded at that edge — plus a rounded fabric crown behind it with a small button on top and a completely plain, blank adjustable strap visible at the back — no tag, no logo, no lettering, no symbol of any kind on the strap or anywhere else on the cap' },
  { itemKey: 'scarf', englishWord: 'Scarf (dupatta)', text: 'दुपट्टा', transliteration: 'dupatta', imageSubject: 'a single long dupatta scarf in a solid colour with a decorative border, laid in a loose flowing fold, no person wearing it' },
  { itemKey: 'dress', englishWord: 'Dress', text: 'पोशाक', transliteration: 'poshak', imageSubject: 'a single simple sleeveless dress laid flat, no person wearing it' },
  { itemKey: 'skirt', englishWord: 'Skirt', text: 'स्कर्ट', transliteration: 'skirt', imageSubject: 'a single pleated skirt laid flat, no person wearing it' },
  { itemKey: 'sweater', englishWord: 'Sweater', text: 'स्वेटर', transliteration: 'sweater', imageSubject: 'a single knitted crew-neck sweater laid flat, no person wearing it' },
  { itemKey: 'jacket', englishWord: 'Jacket', text: 'जैकेट', transliteration: 'jacket', imageSubject: 'a single zip-up jacket laid flat, no person wearing it' },
  { itemKey: 'gloves', englishWord: 'Gloves', text: 'दस्ताने', transliteration: 'dastane', imageSubject: 'a single pair of matching gloves laid flat, fingers spread, no person wearing them' },
  { itemKey: 'belt', englishWord: 'Belt', text: 'बेल्ट', transliteration: 'belt', imageSubject: 'a single leather belt with a simple buckle, coiled in a loose curve' },
  { itemKey: 'handkerchief', englishWord: 'Handkerchief', text: 'रूमाल', transliteration: 'rumal', imageSubject: 'a single square handkerchief with a simple patterned border, folded into a neat square and laid flat' },
];

/**
 * Vegetables (2026-08-04, third follow-on pass) — deliberately a SEPARATE
 * category from `FOOD_DRINK`'s general food/drink items, teaching raw
 * vegetable names specifically (no overlap with `FOOD_DRINK`'s prepared
 * dishes like सब्ज़ी/vegetable-curry). `imageSubject` follows the same
 * "single recognizable item, no clutter" discipline as `foodImagePrompt`,
 * via a new dedicated `vegetableImagePrompt`.
 */
export const VEGETABLES: FamilyItem[] = [
  { itemKey: 'onion', englishWord: 'Onion', text: 'प्याज़', transliteration: 'pyaaz', imageSubject: 'a single whole onion with papery outer skin visible' },
  { itemKey: 'potato', englishWord: 'Potato', text: 'आलू', transliteration: 'aloo', imageSubject: 'a single whole unpeeled potato' },
  { itemKey: 'tomato', englishWord: 'Tomato', text: 'टमाटर', transliteration: 'tamatar', imageSubject: 'a single whole ripe red tomato with its green stem' },
  { itemKey: 'brinjal', englishWord: 'Brinjal (Eggplant)', text: 'बैंगन', transliteration: 'baingan', imageSubject: 'a single whole glossy purple brinjal (eggplant) with its green cap' },
  { itemKey: 'carrot', englishWord: 'Carrot', text: 'गाजर', transliteration: 'gajar', imageSubject: 'a single whole orange carrot with its green leafy top' },
  { itemKey: 'cabbage', englishWord: 'Cabbage', text: 'पत्तागोभी', transliteration: 'pattagobhi', imageSubject: 'a single whole round green cabbage' },
  { itemKey: 'cauliflower', englishWord: 'Cauliflower', text: 'फूलगोभी', transliteration: 'phoolgobhi', imageSubject: 'a single whole white cauliflower head with a few green leaves' },
  { itemKey: 'spinach', englishWord: 'Spinach', text: 'पालक', transliteration: 'palak', imageSubject: 'a small bunch of fresh green spinach leaves' },
  { itemKey: 'peas', englishWord: 'Peas', text: 'मटर', transliteration: 'matar', imageSubject: 'a few green pea pods, one partly open showing round peas inside' },
  { itemKey: 'cucumber', englishWord: 'Cucumber', text: 'खीरा', transliteration: 'kheera', imageSubject: 'a single whole green cucumber' },
  { itemKey: 'pumpkin', englishWord: 'Pumpkin', text: 'कद्दू', transliteration: 'kaddu', imageSubject: 'a single whole round orange pumpkin' },
  { itemKey: 'okra', englishWord: 'Okra (Ladyfinger)', text: 'भिंडी', transliteration: 'bhindi', imageSubject: 'a few whole green okra (ladyfinger) pods' },
  { itemKey: 'garlic', englishWord: 'Garlic', text: 'लहसुन', transliteration: 'lahsun', imageSubject: 'a single whole garlic bulb with papery white skin' },
  { itemKey: 'ginger', englishWord: 'Ginger', text: 'अदरक', transliteration: 'adrak', imageSubject: 'a single knobby piece of fresh ginger root' },
  { itemKey: 'capsicum', englishWord: 'Capsicum (Bell Pepper)', text: 'शिमला मिर्च', transliteration: 'shimla mirch', imageSubject: 'a single whole glossy green bell pepper (capsicum)' },
];

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

/**
 * Transport (2026-08-04, fourth follow-on pass). `imageSubject` describes a
 * single vehicle, side view where natural — same "single recognizable
 * item, no clutter" discipline as every prior category, via a new
 * `transportImagePrompt`. EVERY item explicitly specifies "no visible
 * text/logos/badges/route numbers" — a lesson learned directly from this
 * same pass's Clothing category (kurta/cap both needed retries to remove
 * fake text and brand-like marks fal.ai kept adding), applied proactively
 * here instead of discovered after the fact.
 */
export const TRANSPORT: FamilyItem[] = [
  { itemKey: 'car', englishWord: 'Car', text: 'कार', transliteration: 'car', imageSubject: 'a single small car, side view, no visible brand badges, logos, or number plate text' },
  { itemKey: 'bus', englishWord: 'Bus', text: 'बस', transliteration: 'bus', imageSubject: 'a single bus, side view, no visible route numbers, destination text, or logos' },
  { itemKey: 'train', englishWord: 'Train', text: 'रेलगाड़ी', transliteration: 'relgaadi', imageSubject: 'a single train engine with one or two carriages, side view, no visible text or numbers' },
  { itemKey: 'airplane', englishWord: 'Airplane', text: 'हवाई जहाज़', transliteration: 'hawai jahaz', imageSubject: 'a single passenger airplane in flight, side view, no visible airline logos or text' },
  { itemKey: 'bicycle', englishWord: 'Bicycle', text: 'साइकिल', transliteration: 'cycle', imageSubject: 'a single bicycle, side view, no visible brand text' },
  { itemKey: 'motorcycle', englishWord: 'Motorcycle', text: 'मोटरसाइकिल', transliteration: 'motorcycle', imageSubject: 'a single motorcycle, side view, no visible brand text or logos' },
  { itemKey: 'boat', englishWord: 'Boat', text: 'नाव', transliteration: 'naav', imageSubject: 'a single small wooden rowboat, side view' },
  { itemKey: 'ship', englishWord: 'Ship', text: 'जहाज़', transliteration: 'jahaz', imageSubject: 'a single large cargo ship, side view, no visible text or flags' },
  { itemKey: 'truck', englishWord: 'Truck', text: 'ट्रक', transliteration: 'truck', imageSubject: 'a single delivery truck, side view, no visible text or logos' },
  { itemKey: 'rickshaw', englishWord: 'Rickshaw', text: 'रिक्शा', transliteration: 'rickshaw', imageSubject: 'a single cycle rickshaw, side view, no visible text' },
  { itemKey: 'auto', englishWord: 'Auto-rickshaw', text: 'ऑटो', transliteration: 'auto', imageSubject: 'a single three-wheeled auto-rickshaw, side view, no visible text or number plate' },
  { itemKey: 'helicopter', englishWord: 'Helicopter', text: 'हेलीकॉप्टर', transliteration: 'helicopter', imageSubject: 'a single helicopter, side view, no visible text or logos' },
  { itemKey: 'ambulance', englishWord: 'Ambulance', text: 'एम्बुलेंस', transliteration: 'ambulance', imageSubject: 'a single ambulance van, side view, with a plain red cross symbol only, no other text or logos' },
  { itemKey: 'fire-truck', englishWord: 'Fire Truck', text: 'दमकल', transliteration: 'damkal', imageSubject: 'a single red fire truck with a ladder on top, side view, no visible text or logos' },
  { itemKey: 'scooter', englishWord: 'Scooter', text: 'स्कूटर', transliteration: 'scooter', imageSubject: 'a single two-wheeled scooter, side view, no visible brand text' },
];

/**
 * School Items (2026-08-04, fourth follow-on pass). Same "single item, no
 * clutter, no text/logos" discipline as `TRANSPORT`, via a new
 * `schoolItemImagePrompt`. `book`/`notebook`/`blackboard` all explicitly
 * specify blank/no-title-text — the single highest-risk sub-category for
 * fal.ai inventing fake text, learned from this pass's Clothing lesson.
 */
export const SCHOOL_ITEMS: FamilyItem[] = [
  { itemKey: 'book', englishWord: 'Book', text: 'किताब', transliteration: 'kitaab', imageSubject: 'a single closed hardcover book, no visible title text or author name on the cover' },
  { itemKey: 'pencil', englishWord: 'Pencil', text: 'पेंसिल', transliteration: 'pencil', imageSubject: 'a single wooden pencil with a pink eraser tip, lying flat, no visible brand text' },
  { itemKey: 'pen', englishWord: 'Pen', text: 'कलम', transliteration: 'kalam', imageSubject: 'a single ballpoint pen, lying flat, no visible brand text' },
  { itemKey: 'eraser', englishWord: 'Eraser', text: 'रबड़', transliteration: 'rabar', imageSubject: 'a single rectangular pink eraser, no visible brand text' },
  { itemKey: 'ruler', englishWord: 'Ruler', text: 'स्केल', transliteration: 'scale', imageSubject: 'a single flat wooden ruler with plain tick marks, no printed numerals or brand text' },
  { itemKey: 'bag', englishWord: 'School Bag', text: 'बस्ता', transliteration: 'basta', imageSubject: 'a single school backpack, no visible logos or text' },
  { itemKey: 'notebook', englishWord: 'Notebook', text: 'कॉपी', transliteration: 'copy', imageSubject: 'a single spiral-bound notebook with a plain solid-colour cover, no visible title text or writing' },
  { itemKey: 'blackboard', englishWord: 'Blackboard', text: 'ब्लैकबोर्ड', transliteration: 'blackboard', imageSubject: 'a single small blackboard on an easel stand, completely blank with no chalk writing or drawing on it' },
  { itemKey: 'chalk', englishWord: 'Chalk', text: 'चॉक', transliteration: 'chalk', imageSubject: 'a few white sticks of chalk lying together, no visible text' },
  { itemKey: 'desk', englishWord: 'Desk', text: 'मेज़', transliteration: 'mez', imageSubject: 'a single simple wooden school desk, viewed from the front' },
  { itemKey: 'chair', englishWord: 'Chair', text: 'कुर्सी', transliteration: 'kursi', imageSubject: 'a single simple wooden chair, side view' },
  { itemKey: 'scissors', englishWord: 'Scissors', text: 'कैंची', transliteration: 'kainchi', imageSubject: 'a single pair of blunt-tipped safety scissors, lying flat, no visible brand text' },
  { itemKey: 'glue', englishWord: 'Glue', text: 'गोंद', transliteration: 'gond', imageSubject: 'a single small bottle of white glue with its cap, standing upright, no visible brand text' },
  { itemKey: 'crayons', englishWord: 'Crayons', text: 'क्रेयॉन', transliteration: 'crayon', imageSubject: 'a few colourful wax crayons lying together, tips visible, no wrapper text' },
  { itemKey: 'sharpener', englishWord: 'Sharpener', text: 'शार्पनर', transliteration: 'sharpener', imageSubject: 'a single small pencil sharpener, no visible brand text' },
];

/**
 * Meetei Mayek (`script: 'meetei'`, serving `mni`/Manipuri) — the TENTH
 * script through this pipeline (2026-08-04), merged in here from a
 * temporarily-separate `meeteiData.ts` (built while another agent had live
 * uncommitted edits to this exact file for Urdu — see git history / that
 * agent's report for the full trail; the separation was precautionary, not
 * structural, and this merge is the anticipated safe follow-up).
 *
 * FEASIBILITY WAS VERIFIED FIRST, NOT ASSUMED (full trail in
 * `plans/phase-13-foundations-vocab-numbers-alphabet.md`'s 2026-08-04 entry):
 * iOS font rendering confirmed live (real shaped glyphs, not tofu); Google
 * Cloud TTS confirmed to have NO `mni` voice (live `voices.list` call, zero
 * matches — unlike every other script here); Bhashini confirmed working for
 * isolated/short Meetei Mayek text specifically (the harder synthesis case),
 * via a dedicated orphaned-blob trial tool (`bhashini/meeteiTrial.ts`).
 * Because there is no Google voice, Meetei audio generation uses
 * `bhashini/aksharmalaTts.ts` — the ONE script in this pipeline that does,
 * everything else having moved to Google Chirp3-HD (see `genAudioCharacters`
 * in `run.ts` for the explicit engine branch this requires).
 *
 * STRUCTURE — genuinely unlike every other script here (Unicode Standard
 * v17.0's Meetei Mayek code chart, cross-checked against Wikipedia/Atlas of
 * Endangered Alphabets): 27 "Iyek Ipee" main letters, only 3 of them vowels,
 * interleaved in a fixed traditional order with NO vowel/consonant block
 * split. 18 are the original script, each traditionally named after a human
 * body part (kok=head, sam=hair, lai=god...) — a genuine acrophonic mnemonic
 * system. The other 9 are modern 20th-century additions for Bengali/Hindi/
 * Sanskrit loanwords, with NO traditional name — a real structural fact, not
 * a sourcing gap. No conjuncts (none exist for this script). Lonsum
 * (final-consonant) and Cheitap (dependent vowel sign) forms exist but are
 * deliberately not seeded as their own rows — same "matras aren't standalone
 * Aksharmala entries" scope precedent as Devanagari/Bengali; they're used
 * compositionally below, to spell the 18 traditional names.
 *
 * SOURCING TIER — READ BEFORE TRUSTING THIS AT THE SAME LEVEL AS THE OTHER 9
 * SCRIPTS: unlike Devanagari/Bengali/Tamil's primer-verified picks, no
 * published chart showing how the 18 traditional NAMES are actually SPELLED
 * in Meetei Mayek script was found despite genuine search effort (Omniglot,
 * Wikipedia, Atlas of Endangered Alphabets, the Unicode L2 proposal doc).
 * Every `exampleWord` below for the 18 original letters is this pipeline's
 * OWN CONSTRUCTION from Unicode's documented phonetic values — principled,
 * mechanical, NOT independently native-verified. This is why every row below
 * carries a `note` and why the script is seeded + audio-generated but held
 * at `draft`, not promoted — CLAUDE.md rule 14's human review gate is what
 * this pipeline could not itself perform for this specific script. 3 of 18
 * traditional names (PA, NA, I) and 6 of 9 loan letters are left with NO
 * `exampleWord` at all rather than a forced/guessed one (schema.ts: "not
 * every character... needs one").
 *
 * TOTAL: 27/27 letters seeded (a complete, correct CHARACTER SET, the
 * non-negotiable bar) — 21/27 have an `exampleWord`, 6/27 are
 * romanization-only, honestly, not hidden.
 */
const MEETEI_PIPELINE_SPELLING_NOTE =
  'exampleWord spelling is pipeline-constructed from Unicode-documented phonetic values ' +
  '(letter + vowel sign + lonsum), NOT sourced from a published native spelling chart — ' +
  'needs native Manipuri speaker confirmation at the review gate before promotion. See this ' +
  "file's Meetei Mayek header for the full sourcing-tier explanation.";

export const MEETEI_CHARACTERS: ScriptCharacterData[] = [
  // ---- 18 original Iyek Ipee — traditionally named after body parts ----
  { character: 'ꯀ', characterType: 'consonant', romanization: 'ka', exampleWord: 'ꯀꯣꯛ', exampleTransliteration: 'kok', exampleGloss: "head/brain (this letter's own traditional name)", sortOrder: 1, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯁ', characterType: 'consonant', romanization: 'sa', exampleWord: 'ꯁꯝ', exampleTransliteration: 'sam', exampleGloss: "hair (this letter's own traditional name)", sortOrder: 2, note: MEETEI_PIPELINE_SPELLING_NOTE + ' Lowest-risk construction in this set — only a lonsum final added to the bare inherent-vowel reading, no vowel-sign change.' },
  { character: 'ꯂ', characterType: 'consonant', romanization: 'la', exampleWord: 'ꯂꯩ', exampleTransliteration: 'lai', exampleGloss: 'god/deity (this letter\'s own traditional name — corroborated independently by "Lai Haraoba," Manipur\'s well-documented traditional festival literally meaning "merriment of the gods")', sortOrder: 3, note: MEETEI_PIPELINE_SPELLING_NOTE + ' One source (Atlas of Endangered Alphabets) glossed this letter\'s name as "forehead" instead — "god" was kept as the better-corroborated reading (Lai Haraoba), but flagging the discrepancy for the review gate.' },
  { character: 'ꯃ', characterType: 'consonant', romanization: 'ma', exampleWord: 'ꯃꯤꯠ', exampleTransliteration: 'mit', exampleGloss: "eye (this letter's own traditional name)", sortOrder: 4, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯄ', characterType: 'consonant', romanization: 'pa', sortOrder: 5, note: 'Traditional name ("pā") means eyelash, but is essentially identical to the letter\'s own bare reading ("pa") — no distinctly-spelled exampleWord found worth constructing. Left empty rather than forced (schema.ts: "not every character... needs one").' },
  { character: 'ꯅ', characterType: 'consonant', romanization: 'na', sortOrder: 6, note: 'Traditional name ("nā") means ear, but is essentially identical to the letter\'s own bare reading ("na") — same call as PA above. Left empty rather than forced.' },
  { character: 'ꯆ', characterType: 'consonant', romanization: 'cha', exampleWord: 'ꯆꯤꯜ', exampleTransliteration: 'chil', exampleGloss: "lips (this letter's own traditional name)", sortOrder: 7, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯇ', characterType: 'consonant', romanization: 'ta', exampleWord: 'ꯇꯤꯜ', exampleTransliteration: 'til', exampleGloss: "saliva (this letter's own traditional name)", sortOrder: 8, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯈ', characterType: 'consonant', romanization: 'kha', exampleWord: 'ꯈꯧ', exampleTransliteration: 'khou', exampleGloss: "throat/palate/neck (this letter's own traditional name)", sortOrder: 9, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯉ', characterType: 'consonant', romanization: 'nga', exampleWord: 'ꯉꯧ', exampleTransliteration: 'ngou', exampleGloss: "larynx/pharynx (this letter's own traditional name)", sortOrder: 10, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯊ', characterType: 'consonant', romanization: 'tha', exampleWord: 'ꯊꯧ', exampleTransliteration: 'thou', exampleGloss: "chest/ribs (this letter's own traditional name)", sortOrder: 11, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯋ', characterType: 'consonant', romanization: 'wa', exampleWord: 'ꯋꯩ', exampleTransliteration: 'wai', exampleGloss: "navel/heart (this letter's own traditional name)", sortOrder: 12, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯌ', characterType: 'consonant', romanization: 'ya', exampleWord: 'ꯌꯪ', exampleTransliteration: 'yang', exampleGloss: "spine (this letter's own traditional name)", sortOrder: 13, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯍ', characterType: 'consonant', romanization: 'ha', exampleWord: 'ꯍꯨꯛ', exampleTransliteration: 'huk', exampleGloss: "joint (this letter's own traditional name)", sortOrder: 14, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯎ', characterType: 'vowel', romanization: 'u', exampleWord: 'ꯎꯟ', exampleTransliteration: 'un', exampleGloss: "skin (this letter's own traditional name)", sortOrder: 15, note: MEETEI_PIPELINE_SPELLING_NOTE },
  { character: 'ꯏ', characterType: 'vowel', romanization: 'i', sortOrder: 16, note: 'Sources conflict on this letter\'s traditional name/meaning (Wikipedia\'s table names it "e" meaning "blood" with IPA /iː/ — an internally inconsistent pairing) and no independent corroboration was found. Left empty rather than guess.' },
  { character: 'ꯐ', characterType: 'consonant', romanization: 'pha', exampleWord: 'ꯐꯝ', exampleTransliteration: 'pham', exampleGloss: "buttocks/uterus (this letter's own traditional name)", sortOrder: 17, note: MEETEI_PIPELINE_SPELLING_NOTE + ' Same low-risk single-lonsum construction as SAM above.' },
  { character: 'ꯑ', characterType: 'vowel', romanization: 'a', exampleWord: 'ꯑꯇꯤꯌ', exampleTransliteration: 'atiya', exampleGloss: "heaven/divinity/immortality/birth (this letter's own traditional name)", sortOrder: 18, note: MEETEI_PIPELINE_SPELLING_NOTE + ' The most complex construction in this set (4 glyphs, 3 syllables) — highest spelling-risk row, prioritize this one at the review gate.' },

  // ---- 9 modern loan letters — 20th-century additions for Bengali/Hindi/
  // Sanskrit loanwords; NO traditional body-part name or meaning exists for
  // these (a real structural fact, not a gap). ----
  { character: 'ꯒ', characterType: 'consonant', romanization: 'ga', exampleWord: 'ꯒꯨꯔꯨ', exampleTransliteration: 'guru', exampleGloss: 'teacher (real pan-Indian Sanskrit loanword current in Manipuri, not this letter\'s "name" — it has none)', sortOrder: 19, note: MEETEI_PIPELINE_SPELLING_NOTE + ' Loanword pick, not a traditional letter-name (this letter has none — see file header).' },
  { character: 'ꯓ', characterType: 'consonant', romanization: 'jha', sortOrder: 20, note: 'Modern loan letter, no traditional name. No confidently-attested common Manipuri example word found for this sound — left empty rather than forced.' },
  { character: 'ꯔ', characterType: 'consonant', romanization: 'ra', exampleWord: 'ꯔꯖ', exampleTransliteration: 'raja', exampleGloss: 'king (real pan-Indian loanword current in Manipuri)', sortOrder: 21, note: MEETEI_PIPELINE_SPELLING_NOTE + ' Loanword pick, not a traditional letter-name.' },
  { character: 'ꯕ', characterType: 'consonant', romanization: 'ba', exampleWord: 'ꯕꯕ', exampleTransliteration: 'baba', exampleGloss: 'father (common address-term loanword current in Manipuri)', sortOrder: 22, note: MEETEI_PIPELINE_SPELLING_NOTE + ' Loanword pick, not a traditional letter-name.' },
  { character: 'ꯖ', characterType: 'consonant', romanization: 'ja', sortOrder: 23, note: 'Modern loan letter, no traditional name. No confidently-attested common Manipuri example word found — left empty rather than forced.' },
  { character: 'ꯗ', characterType: 'consonant', romanization: 'da', sortOrder: 24, note: 'Modern loan letter, no traditional name. No confidently-attested common Manipuri example word found — left empty rather than forced.' },
  { character: 'ꯘ', characterType: 'consonant', romanization: 'gha', sortOrder: 25, note: 'Modern loan letter, no traditional name. No confidently-attested common Manipuri example word found — left empty rather than forced.' },
  { character: 'ꯙ', characterType: 'consonant', romanization: 'dha', sortOrder: 26, note: 'Modern loan letter, no traditional name. No confidently-attested common Manipuri example word found — left empty rather than forced.' },
  { character: 'ꯚ', characterType: 'consonant', romanization: 'bha', sortOrder: 27, note: 'Modern loan letter, no traditional name. No confidently-attested common Manipuri example word found — left empty rather than forced.' },
];
