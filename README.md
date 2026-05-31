# AI_Vocabulary-Builder
This repository is a small vocabulary study app (WordWise AI). Below is a short summary of recent work, how to run the project, and next steps.

**What I changed**
- Replaced the broken OpenRouter/OpenAI call with the free Dictionary API (`https://api.dictionaryapi.dev`) for reliable meanings and examples.
- Added a Datamuse fallback (`https://api.datamuse.com`) to fetch synonyms and antonyms when the dictionary response lacks them.
- Implemented name handling: detect probable personal names and fetch best-effort info using `genderize.io` (gender guess) and Wikidata (label/description).
- Added a simple quiz (fill-in-the-blank) generated from example sentences when available.
- Save/Load functionality for words using `localStorage` (My Word Bank).
- Improved UI styles and added scrollable containers for long texts and long saved-word lists. A hero image and a study-dashboard layout were added; you can switch back to the simpler layout by editing `index.html` and `style.css` if desired.

**Files changed**
- `index.html` — search form, result card, quiz, saved words UI
- `script.js` — main application logic (API calls, fallbacks, UI interactions)
- `style.css` — custom styles and background

**How to run**
1. Open `index.html` directly in a modern browser (Chrome/Edge/Firefox).
2. Or run a simple local server from the project folder:

**Usage**
- Type a word in the search box and click Search (or press Enter).
- The app shows meaning, example, synonyms, antonyms (if available), and a small quiz.
- Click "⭐ Save Word" to add to `My Word Bank` (stored in browser `localStorage`).

**APIs used (no key required)**
- Dictionary: https://dictionaryapi.dev/
- Synonyms/Antonyms fallback: https://api.datamuse.com/
- Name gender guess: https://api.genderize.io/
- Name info: Wikidata API

**Known limitations & notes**
- Some words may not have antonyms available from the APIs.
- Name meanings are best-effort (Wikidata descriptions); results vary.
- This is a client-only app — all calls are from the browser to public APIs.

**Next suggestions**
- Add a small banner for "word not found" with suggestions.
- Allow switching between the simple and study-dashboard themes.
- Add export/import for the saved word bank (JSON).

If you want the README in Hindi or want me to revert the UI to the exact original version, tell me and I will update the files accordingly.
