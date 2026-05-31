const searchBtn = document.getElementById("searchBtn");
const wordInput = document.getElementById("wordInput");
const resultBox = document.getElementById("resultBox");
const wordTitle = document.getElementById("wordTitle");
const wordMeaning = document.getElementById("wordMeaning");
const wordExample = document.getElementById("wordExample");
const wordSynonyms = document.getElementById("wordSynonyms");
const wordAntonyms = document.getElementById("wordAntonyms");
const nameGender = document.getElementById("nameGender");
const nameMeaning = document.getElementById("nameMeaning");
const saveBtn = document.getElementById("saveBtn");
const wordList = document.getElementById("wordList");
const loading = document.getElementById("loading");
const quizBox = document.getElementById("quizBox");
const quizQuestion = document.getElementById("quizQuestion");
const quizAnswer = document.getElementById("quizAnswer");
const checkQuiz = document.getElementById("checkQuiz");
const quizResult = document.getElementById("quizResult");

let savedWords = JSON.parse(localStorage.getItem("wordBank")) || [];
displaySavedWords();

async function fetchWordRelations(word, relation) {
  try {
    const res = await fetch(
      `https://api.datamuse.com/words?${relation}=${encodeURIComponent(word)}&max=5`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item) => item.word);
  } catch (err) {
    console.error("Datamuse error:", err);
    return [];
  }
}

function looksLikeName(input) {
  const trimmed = (input ?? "").toString().trim();
  if (!trimmed) return false;
  if (trimmed.length < 2) return false;

  if (/([\s\-'])/g.test(trimmed)) return true;
  return /^[A-Z][a-z]+$/.test(trimmed);
}

async function fetchNameMeaning(name) {
  let gender = "unknown";
  let meaning = "Meaning not available.";

  try {
    const gRes = await fetch(
      `https://api.genderize.io/?name=${encodeURIComponent(name)}&country_id=US`
    );
    if (gRes.ok) {
      const gData = await gRes.json();
      if (gData.gender) gender = gData.gender;
    }
  } catch (e) {
  }

  try {
    const sRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=1`
    );
    if (sRes.ok) {
      const sData = await sRes.json();
      const first = sData?.search?.[0];
      if (first?.id) {
        const itemRes = await fetch(
          `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(first.id)}.json`
        );
        if (itemRes.ok) {
          const itemJson = await itemRes.json();
          const entity = itemJson?.entities?.[first.id];
          const desc = entity?.descriptions?.en?.value;
          const label = entity?.labels?.en?.value;
          if (desc) meaning = desc;
          else if (label) meaning = `Related meaning/info for: ${label}`;
        }
      }
    }
  } catch (e) {
  }

  let genderLabel = "Unknown";
  const g = (gender ?? "").toString().trim().toLowerCase();
  if (g === "female") genderLabel = "Female";
  if (g === "male") genderLabel = "Male";

  return { gender: genderLabel, meaning };
}

async function getWordDetails(word) {
  loading.classList.remove("hidden");
  resultBox.classList.add("hidden");
  quizBox.classList.add("hidden");

  const trimmed = (word ?? "").toString().trim();

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(trimmed)}`
    );

    if (res.status === 404) {
      if (looksLikeName(trimmed)) {
        const nameData = await fetchNameMeaning(trimmed);
        return {
          wordType: "name",
          meaning: "",
          example: "",
          synonyms: [],
          antonyms: [],
          nameGender: nameData.gender,
          nameMeaning: nameData.meaning,
          quiz: {
            question: `Meaning/description for "${trimmed}"?`,
            answer: "",
          },
        };
      }

      return {
        wordType: "unknown",
        meaning: "This looks like a word not found in the dictionary.",
        example: "Try another word.",
        synonyms: [],
        antonyms: [],
        nameGender: "Unknown",
        nameMeaning: "Meaning not available.",
        quiz: {
          question: "No quiz available for unavailable words.",
          answer: "",
        },
      };
    }

    if (!res.ok) throw new Error("Word not found");

    const data = await res.json();
    const entry = data[0];

    const definitions = entry.meanings
      .flatMap((meaning) =>
        meaning.definitions.map((def) => ({
          partOfSpeech: meaning.partOfSpeech,
          definition: def.definition,
          example: def.example,
        }))
      )
      .filter((item) => item.definition);

    const meaningText =
      definitions.length > 0
        ? definitions
            .map((item, index) =>
              `${item.partOfSpeech ? item.partOfSpeech + " " : ""}${index + 1}. ${item.definition}`
            )
            .join(" \n")
        : "Meaning not available.";

    const example =
      definitions.find((item) => item.example)?.example ||
      "No example available.";

    const synonyms = Array.from(
      new Set(
        entry.meanings
          .flatMap((meaning) => meaning.definitions.flatMap((def) => def.synonyms || []))
          .filter(Boolean)
      )
    ).slice(0, 5);

    const antonyms = Array.from(
      new Set(
        entry.meanings
          .flatMap((meaning) => meaning.definitions.flatMap((def) => def.antonyms || []))
          .filter(Boolean)
      )
    ).slice(0, 5);

    const fallbackSynonyms =
      synonyms.length === 0 ? await fetchWordRelations(trimmed, "rel_syn") : [];
    const fallbackAntonyms =
      antonyms.length === 0 ? await fetchWordRelations(trimmed, "rel_ant") : [];

    const allSynonyms = Array.from(new Set([...synonyms, ...fallbackSynonyms])).slice(0, 5);
    const allAntonyms = Array.from(new Set([...antonyms, ...fallbackAntonyms])).slice(0, 5);

    const quizQuestion = example.includes(trimmed)
      ? example.replace(new RegExp(`\\b${trimmed}\\b`, "gi"), "_____")
      : `Complete the word that means: ${meaningText.split(".")[0]}`;

    return {
      wordType: "word",
      meaning: meaningText,
      example,
      synonyms: allSynonyms,
      antonyms: allAntonyms,
      nameGender: "",
      nameMeaning: "",
      quiz: {
        question: quizQuestion,
        answer: trimmed.toLowerCase(),
      },
    };
  } catch (err) {
    console.error(err);
    alert("Word not found. Please try another word.");
    return null;
  } finally {
    loading.classList.add("hidden");
  }
}

function safeLower(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function setQuizVisibility(show) {
  if (show) quizBox.classList.remove("hidden");
  else quizBox.classList.add("hidden");
}

searchBtn.addEventListener("click", async () => {
  const word = wordInput.value.trim();
  if (!word) return alert("Please enter a word!");

  nameGender.textContent = "";
  nameMeaning.textContent = "";

  searchBtn.disabled = true;
  searchBtn.classList.add("opacity-70");

  try {
    const details = await getWordDetails(word);
    if (!details) return;

    wordTitle.textContent = word.charAt(0).toUpperCase() + word.slice(1);

    if (details.wordType === "name") {
      wordMeaning.textContent = "";
      nameGender.textContent = `Gender: ${details.nameGender || "Unknown"}`;
      nameMeaning.textContent = `Name meaning: ${details.nameMeaning || "Meaning not available."}`;

      wordExample.textContent = "";
      wordSynonyms.textContent = "Synonyms: Not applicable";
      wordAntonyms.textContent = "Antonyms: Not applicable";
    } else {
      wordMeaning.textContent = `Meaning: ${details.meaning}`;
      nameGender.textContent = "";
      nameMeaning.textContent = "";

      wordExample.textContent = details.example
        ? `Example: "${details.example}"`
        : "Example: Not available.";

      wordSynonyms.textContent =
        details.synonyms.length > 0
          ? `Synonyms: ${details.synonyms.join(", ")}`
          : "Synonyms: Not available.";

      wordAntonyms.textContent =
        details.antonyms.length > 0
          ? `Antonyms: ${details.antonyms.join(", ")}`
          : "Antonyms: Not available.";
    }

    quizQuestion.textContent = details.quiz.question;
    quizAnswer.value = "";
    quizResult.textContent = "";

    resultBox.classList.remove("hidden");

    const correct = details.quiz?.answer ? safeLower(details.quiz.answer) : "";
    quizBox.dataset.answer = correct;
    setQuizVisibility(Boolean(correct));
  } catch (err) {
    console.error(err);
    alert("Failed to generate results. Please try again.");
  } finally {
    searchBtn.disabled = false;
    searchBtn.classList.remove("opacity-70");
  }
});

saveBtn.addEventListener("click", () => {
  const word = wordTitle.textContent;
  if (!word) return alert("Search a word first!");

  if (!savedWords.includes(word)) {
    savedWords.push(word);
    localStorage.setItem("wordBank", JSON.stringify(savedWords));
    displaySavedWords();
    alert("Word saved!");
  } else {
    alert("Already saved!");
  }
});

function displaySavedWords() {
  wordList.innerHTML = "";

  if (savedWords.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No saved words yet.";
    li.className = "text-gray-500";
    wordList.appendChild(li);
    return;
  }

  savedWords.forEach((word) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center gap-3";

    const label = document.createElement("span");
    label.textContent = word;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "text-red-500 hover:text-red-700";
    btn.textContent = "❌";
    btn.dataset.word = word;

    li.appendChild(label);
    li.appendChild(btn);
    wordList.appendChild(li);
  });
}

wordList.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.dataset.word) return;

  const word = target.dataset.word;
  if (!confirm(`Delete "${word}" from saved words?`)) return;

  savedWords = savedWords.filter((w) => w !== word);
  localStorage.setItem("wordBank", JSON.stringify(savedWords));
  displaySavedWords();
});

wordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

checkQuiz.addEventListener("click", () => {
  const userAns = quizAnswer.value.trim().toLowerCase();
  const correctAns = quizBox.dataset.answer;

  if (!userAns) {
    quizResult.textContent = "Please type your answer.";
    quizResult.className = "text-yellow-600";
    return;
  }

  if (userAns === correctAns) {
    quizResult.textContent = "✅ Correct Answer";
    quizResult.className = "text-green-600";
  } else {
    quizResult.textContent = `❌ Wrong! Correct: ${correctAns}`;
    quizResult.className = "text-red-600";
  }
});

