
"use strict";

/* =========================================================
   PIXEL ENGLISH QUEST
   ========================================================= */

const STORAGE = {
  words: "pixelEnglishWords",
  best: "pixelEnglishBest",
  streak: "pixelEnglishStreak"
};

/* ================= DEFAULT WORDS ================= */

const DEFAULT_WORDS = [
  ["refer", "言及する"],
  ["opening", "開会・冒頭"],
  ["construction", "建設"],
  ["indicate", "示す"],
  ["include", "含む"],
  ["currently", "現在"],
  ["charge", "料金・請求する"],
  ["application", "申請・応募"],
  ["management", "管理"],
  ["pleased", "喜んで"],
  ["grant", "許可する・助成金"],
  ["relatively", "比較的"],
  ["promising", "有望な"],
  ["commission", "委員会・手数料"],
  ["committed", "献身的な"],
  ["exciting", "わくわくする"],
  ["appoint", "任命する"],
  ["ease", "容易さ・和らげる"],
  ["agreement", "合意"],
  ["refund", "払い戻し"],
  ["responsible", "責任がある"],
  ["admission", "入場・入学"],
  ["expense", "費用"],
  ["regulation", "規則"],
  ["expand", "拡大する"],
  ["estimate", "見積もり・見積もる"],
  ["concerning", "〜に関して"],
  ["reputation", "評判"],
  ["confident", "自信がある"],
  ["properly", "適切に"],
  ["willing", "意欲がある"]
];

/* ================= STATE ================= */

let words = [];
let bestScore = 0;
let streak = 0;

let currentScreen = "homeScreen";

let quizWords = [];
let currentIndex = 0;
let currentStage = 0;
let stageHit = 0;

let quizScore = 0;
let correctCount = 0;

let answerLocked = false;

let flashIndex = 0;
let flashFlipped = false;

let animationId = null;

let battleState = {
  attack: 0,
  flashUntil: 0,
  damageUntil: 0,
  damageX: 0,
  damageY: 0,
  defeat: 0,
  particles: []
};

const stages = [
  {
    name: "MOON SLIME",
    type: "slime",
    maxHits: 3
  },
  {
    name: "SHADOW BAT",
    type: "bat",
    maxHits: 3
  },
  {
    name: "ASTRAL DRAGON",
    type: "dragon",
    maxHits: 4
  }
];

/* ================= DOM ================= */

const $ = (selector) => document.querySelector(selector);

const screens = document.querySelectorAll(".screen");

/* ================= STORAGE ================= */

function loadData() {

  try {
    const savedWords = localStorage.getItem(STORAGE.words);

    if (savedWords) {
      const parsed = JSON.parse(savedWords);

      if (Array.isArray(parsed)) {
        words = normalizeWords(parsed);
      }
    }

    if (!words.length) {
      words = DEFAULT_WORDS.map(([en, jp]) => ({
        en,
        jp
      }));
      saveWords();
    }

    bestScore = Number(localStorage.getItem(STORAGE.best)) || 0;
    streak = Number(localStorage.getItem(STORAGE.streak)) || 0;

  } catch (error) {

    console.error(error);

    words = DEFAULT_WORDS.map(([en, jp]) => ({
      en,
      jp
    }));

    bestScore = 0;
    streak = 0;
  }
}

function normalizeWords(list) {

  const result = [];
  const seen = new Set();

  list.forEach(item => {

    let en = "";
    let jp = "";

    if (Array.isArray(item)) {
      en = String(item[0] || "").trim();
      jp = String(item[1] || "").trim();
    } else {
      en = String(item.en || "").trim();
      jp = String(item.jp || "").trim();
    }

    const key = en.toLowerCase();

    if (!en || !jp || seen.has(key)) {
      return;
    }

    seen.add(key);

    result.push({
      en,
      jp
    });
  });

  return result;
}

function saveWords() {
  localStorage.setItem(
    STORAGE.words,
    JSON.stringify(words)
  );
}

function saveStats() {

  localStorage.setItem(
    STORAGE.best,
    String(bestScore)
  );

  localStorage.setItem(
    STORAGE.streak,
    String(streak)
  );
}

/* ================= UI ================= */

function renderStats() {

  $("#wordCount").textContent = words.length;
  $("#bestScore").textContent = bestScore;
  $("#streakCount").textContent = streak;
}

function showScreen(id) {

  screens.forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(id);

  if (!target) {
    return;
  }

  target.classList.add("active");
  currentScreen = id;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (id === "wordbookScreen") {
    renderWordBook();
  }

  if (id === "flashcardScreen") {
    renderFlashcard();
  }
}

/* ================= TOAST ================= */

let toastTimer = null;

function showToast(message) {

  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

/* ================= WORD REGISTER ================= */

function addWord() {

  const enInput = $("#englishInput");
  const jpInput = $("#japaneseInput");

  const en = enInput.value.trim();
  const jp = jpInput.value.trim();

  if (!en || !jp) {
    showToast("英単語と日本語の意味を入力してください。");
    return;
  }

  const exists = words.some(
    word => word.en.toLowerCase() === en.toLowerCase()
  );

  if (exists) {
    showToast("その単語はすでに登録されています。");
    return;
  }

  words.push({
    en,
    jp
  });

  saveWords();
  renderStats();

  enInput.value = "";
  jpInput.value = "";

  showToast("単語を登録しました。");
}

/* ================= WORD BOOK ================= */

function renderWordBook() {

  const list = $("#wordList");

  list.innerHTML = "";

  if (!words.length) {

    list.innerHTML = `
      <div class="panel">
        単語が登録されていません。
      </div>
    `;

    return;
  }

  words.forEach((word, index) => {

    const item = document.createElement("div");

    item.className = "word-item";

    item.innerHTML = `
      <div>
        <strong>${escapeHtml(word.en)}</strong>
        <span>${escapeHtml(word.jp)}</span>
      </div>

      <button
        class="delete-word"
        data-index="${index}">
        DELETE
      </button>
    `;

    list.appendChild(item);
  });

  list.querySelectorAll(".delete-word").forEach(button => {

    button.addEventListener("click", () => {

      const index = Number(button.dataset.index);

      if (!Number.isInteger(index)) {
        return;
      }

      words.splice(index, 1);

      saveWords();
      renderWordBook();
      renderStats();
    });
  });
}

function escapeHtml(value) {

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ================= CSV ================= */

function exportCSV() {

  if (!words.length) {
    showToast("登録単語がありません。");
    return;
  }

  const rows = [
    ["English", "Japanese"],
    ...words.map(word => [
      word.en,
      word.jp
    ])
  ];

  const csv = rows
    .map(row =>
      row
        .map(value =>
          `"${String(value).replaceAll('"', '""')}"`
        )
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    {
      type: "text/csv;charset=utf-8"
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "pixel-english-words.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast("CSVを書き出しました。");
}

function importCSV(file) {

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {

    const text = String(event.target.result || "")
      .replace(/^\uFEFF/, "");

    const lines = text
      .split(/\r?\n/)
      .filter(line => line.trim());

    if (lines.length < 2) {
      showToast("CSVの内容を読み込めませんでした。");
      return;
    }

    const imported = [];

    for (let i = 1; i < lines.length; i++) {

      const parts = parseCSVLine(lines[i]);

      if (parts.length < 2) {
        continue;
      }

      imported.push({
        en: parts[0].trim(),
        jp: parts[1].trim()
      });
    }

    const before = words.length;

    words = normalizeWords([
      ...words,
      ...imported
    ]);

    saveWords();
    renderStats();

    showToast(
      `${words.length - before}語を追加しました。`
    );
  };

  reader.readAsText(file, "UTF-8");
}

function parseCSVLine(line) {

  const result = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {

    const char = line[i];

    if (char === '"') {

      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }

    } else if (char === "," && !quoted) {

      result.push(current);
      current = "";

    } else {

      current += char;
    }
  }

  result.push(current);

  return result;
}

/* ================= FLASHCARD ================= */

function renderFlashcard() {

  if (!words.length) {
    return;
  }

  if (flashIndex >= words.length) {
    flashIndex = 0;
  }

  const word = words[flashIndex];

  $("#flashEnglish").textContent = word.en;

  $("#flashJapanese").textContent =
    flashFlipped ? word.jp : "？？？";

  $("#flashIndex").textContent =
    `${flashIndex + 1} / ${words.length}`;
}

function flipFlashcard() {

  flashFlipped = !flashFlipped;

  renderFlashcard();
}

function nextCard() {

  flashIndex++;

  if (flashIndex >= words.length) {
    flashIndex = 0;
  }

  flashFlipped = false;

  renderFlashcard();
}

function previousCard() {

  flashIndex--;

  if (flashIndex < 0) {
    flashIndex = words.length - 1;
  }

  flashFlipped = false;

  renderFlashcard();
}

/* =========================================================
   QUEST
   ========================================================= */

function shuffle(array) {

  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {

    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [result[i], result[j]] =
      [result[j], result[i]];
  }

  return result;
}

function startQuest() {

  if (words.length < 10) {

    showToast(
      `クエストには10語以上必要です。現在 ${words.length}語です。`
    );

    return;
  }

  quizWords = shuffle(words).slice(0, 10);

  currentIndex = 0;
  currentStage = 0;
  stageHit = 0;

  quizScore = 0;
  correctCount = 0;

  answerLocked = false;

  resetBattleAnimation();

  showScreen("quizScreen");

  setupStage();
  nextQuestion();
}

/* ================= STAGE ================= */

function setupStage() {

  const stage = stages[currentStage];

  stageHit = 0;

  $("#stageBadge").textContent =
    `STAGE ${currentStage + 1}`;

  $("#enemyName").textContent =
    stage.name;

  updateEnemyHp();

  $("#battleMessage").textContent =
    "SELECT THE CORRECT ANSWER";

  resetBattleAnimation();
}

function updateEnemyHp() {

  const stage = stages[currentStage];

  const ratio =
    Math.max(
      0,
      1 - stageHit / stage.maxHits
    );

  $("#enemyHp").style.width =
    `${ratio * 100}%`;
}

/* ================= QUESTION ================= */

function nextQuestion() {

  if (currentIndex >= quizWords.length) {
    finishQuiz();
    return;
  }

  answerLocked = false;

  const current = quizWords[currentIndex];

  $("#questionNumber").textContent =
    String(currentIndex + 1).padStart(2, "0");

  $("#questionProgress").style.width =
    `${(currentIndex / quizWords.length) * 100}%`;

  $("#questionWord").textContent =
    current.en;

  $("#quizScore").textContent =
    quizScore;

  $("#hitCount").textContent =
    stageHit;

  const choices = makeChoices(current);

  renderAnswers(choices);

  $("#battleMessage").textContent =
    "SELECT THE CORRECT ANSWER";

  updateEnemyHp();
}

function makeChoices(correctWord) {

  const candidates = words.filter(
    word =>
      word.en.toLowerCase() !==
      correctWord.en.toLowerCase()
  );

  const wrongChoices =
    shuffle(candidates)
      .slice(0, 3)
      .map(word => word.jp);

  const all = [
    correctWord.jp,
    ...wrongChoices
  ];

  return shuffle(all);
}

function renderAnswers(choices) {

  const container = $("#answers");

  container.innerHTML = "";

  choices.forEach(choice => {

    const button =
      document.createElement("button");

    button.className = "answer-btn";

    button.textContent = choice;

    button.addEventListener(
      "click",
      () => handleAnswer(choice, button)
    );

    container.appendChild(button);
  });
}

/* ================= ANSWER ================= */

function handleAnswer(selected, clickedButton) {

  if (answerLocked) {
    return;
  }

  if (currentIndex >= quizWords.length) {
    return;
  }

  answerLocked = true;

  const current =
    quizWords[currentIndex];

  const isCorrect =
    selected === current.jp;

  const buttons =
    document.querySelectorAll(".answer-btn");

  buttons.forEach(button => {
    button.disabled = true;

    if (button.textContent === current.jp) {
      button.classList.add("correct");
    }
  });

  if (!isCorrect) {

    clickedButton.classList.add("wrong");

    streak = 0;

    $("#battleMessage").textContent =
      `MISS!  正解：${current.jp}`;

    currentIndex++;

    saveStats();
    renderStats();

    setTimeout(() => {

      if (currentIndex >= quizWords.length) {
        finishQuiz();
      } else {
        nextQuestion();
      }

    }, 850);

    return;
  }

  /* ===== CORRECT ===== */

  correctCount++;

  quizScore += 100;
  streak++;

  stageHit++;

  $("#quizScore").textContent =
    quizScore;

  $("#hitCount").textContent =
    stageHit;

  $("#battleMessage").textContent =
    "HIT!";

  startAttackAnimation();

  currentIndex++;

  updateEnemyHp();

  setTimeout(() => {

    if (
      stageHit >=
      stages[currentStage].maxHits
    ) {

      defeatCurrentEnemy();

      return;
    }

    if (currentIndex >= quizWords.length) {

      finishQuiz();

      return;
    }

    nextQuestion();

  }, 850);
}

/* ================= ENEMY DEFEAT ================= */

function defeatCurrentEnemy() {

  const defeatedStage = currentStage;

  $("#battleMessage").textContent =
    defeatedStage === stages.length - 1
      ? "ASTRAL DRAGON DEFEATED!"
      : `${stages[defeatedStage].name} DEFEATED!`;

  startDefeatAnimation();

  setTimeout(() => {

    /*
      ここがステージ遷移の重要部分。

      「敵を倒したけど次の問題が出ない」
      という停止を防ぐため、

      1. ステージを進める
      2. 新しい敵をセット
      3. 次の問題を表示

      を必ずセットで実行する。
    */

    if (currentIndex >= quizWords.length) {
      finishQuiz();
      return;
    }

    if (
      defeatedStage >=
      stages.length - 1
    ) {
      finishQuiz();
      return;
    }

    currentStage++;

    setupStage();
    nextQuestion();

  }, 1200);
}

/* ================= RESULT ================= */

function finishQuiz() {

  answerLocked = true;

  $("#questionProgress").style.width =
    "100%";

  if (quizScore > bestScore) {
    bestScore = quizScore;
  }

  saveStats();
  renderStats();

  $("#resultScore").textContent =
    quizScore;

  $("#resultCorrect").textContent =
    `${correctCount} / 10`;

  $("#resultBest").textContent =
    bestScore;

  $("#resultTitle").textContent =
    correctCount === 10
      ? "PERFECT CLEAR"
      : "QUEST COMPLETE";

  showScreen("resultScreen");
}

/* =========================================================
   BATTLE CANVAS
   ========================================================= */

const canvas = $("#battleCanvas");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

function resetBattleAnimation() {

  battleState.attack = 0;
  battleState.flashUntil = 0;
  battleState.damageUntil = 0;
  battleState.defeat = 0;
  battleState.particles = [];

  if (!animationId) {
    animationLoop();
  }
}

function startAttackAnimation() {

  battleState.attack = 1;

  battleState.flashUntil =
    performance.now() + 180;

  battleState.damageUntil =
    performance.now() + 650;

  battleState.damageX = 235;
  battleState.damageY = 64;
}

function startDefeatAnimation() {

  battleState.defeat = 1;

  spawnParticles(
    235,
    82,
    38
  );
}

function spawnParticles(x, y, count) {

  const colors = [
    "#f0b76a",
    "#d66c93",
    "#78a6c6",
    "#e7d28a",
    "#a18ac2"
  ];

  for (let i = 0; i < count; i++) {

    battleState.particles.push({
      x,
      y,
      vx: (Math.random() - .5) * 2.8,
      vy: -Math.random() * 3 - .5,
      size: Math.random() > .7 ? 3 : 2,
      life: 35 + Math.random() * 35,
      color:
        colors[
          Math.floor(
            Math.random() * colors.length
          )
        ]
    });
  }
}

function animationLoop(time = performance.now()) {

  drawBattle(time);

  animationId =
    requestAnimationFrame(animationLoop);
}

/* ================= PIXEL HELPERS ================= */

function rect(x, y, w, h, color) {

  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(x),
    Math.round(y),
    Math.round(w),
    Math.round(h)
  );
}

function pixelText(
  text,
  x,
  y,
  size = 8,
  color = "#ffffff",
  align = "left"
) {

  ctx.save();

  ctx.font =
    `bold ${size}px monospace`;

  ctx.textAlign = align;
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#161627";

  ctx.fillText(
    text,
    x + 1,
    y + 1
  );

  ctx.fillStyle = color;

  ctx.fillText(
    text,
    x,
    y
  );

  ctx.restore();
}

/* ================= BATTLE DRAW ================= */

function drawBattle(time) {

  const w = canvas.width;
  const h = canvas.height;

  /* SKY */

  rect(0, 0, w, h, "#667da2");

  rect(0, 0, w, 50, "#9baac1");
  rect(0, 50, w, 40, "#738baa");
  rect(0, 90, w, 40, "#526b83");

  /* distant gradient-like pixel bands */

  rect(0, 28, 110, 2, "#c5ced8");
  rect(40, 35, 80, 2, "#b6c3d2");
  rect(205, 42, 70, 2, "#b8c5d3");

  /* DITHER */

  for (let x = 0; x < w; x += 8) {

    for (let y = 95; y < 132; y += 8) {

      if ((x + y) % 16 === 0) {
        rect(
          x,
          y,
          2,
          2,
          "#61788d"
        );
      }
    }
  }

  /* MOON */

  rect(250, 18, 22, 22, "#e5dfc9");
  rect(254, 14, 14, 4, "#e5dfc9");
  rect(246, 22, 4, 14, "#e5dfc9");

  rect(264, 21, 4, 5, "#d2cdbb");

  /* GROUND */

  rect(0, 130, w, 50, "#343950");
  rect(0, 130, w, 4, "#222638");

  for (let x = 0; x < w; x += 16) {

    rect(
      x,
      140 + ((x / 16) % 2) * 3,
      8,
      2,
      "#4a4e66"
    );

  }

  /* HERO */

  drawHero(time);

  /* ENEMY */

  drawEnemy(time);

  /* EFFECTS */

  drawParticles();

  drawDamage(time);

  /* HUD */

  pixelText(
    "QUEST BATTLE",
    9,
    10,
    7,
    "#ffffff"
  );

  pixelText(
    `HIT ${stageHit}`,
    311,
    10,
    7,
    "#ffffff",
    "right"
  );
}

/* ================= HERO ================= */

function drawHero(time) {

  const attack = battleState.attack;

  let swordPhase = 0;

  if (attack > 0) {

    const elapsed =
      1 - attack;

    swordPhase =
      Math.min(1, elapsed * 1.9);
  }

  const x = 58;
  const y = 83;

  /* SHADOW */

  rect(
    x - 18,
    y + 38,
    39,
    4,
    "#1c1d2b"
  );

  rect(
    x - 12,
    y + 42,
    27,
    2,
    "#252638"
  );

  /* CAPE */

  rect(
    x - 15,
    y - 8,
    23,
    32,
    "#403c70"
  );

  rect(
    x - 12,
    y - 11,
    17,
    5,
    "#5e568f"
  );

  rect(
    x - 18,
    y + 18,
    7,
    11,
    "#332f5b"
  );

  /* HAIR */

  rect(
    x - 5,
    y - 25,
    21,
    20,
    "#5b3854"
  );

  rect(
    x - 10,
    y - 20,
    8,
    15,
    "#6d4561"
  );

  rect(
    x + 12,
    y - 17,
    8,
    18,
    "#482e4b"
  );

  /* FACE */

  rect(
    x - 1,
    y - 14,
    17,
    16,
    "#e8b89b"
  );

  rect(
    x + 13,
    y - 8,
    5,
    3,
    "#2b2734"
  );

  rect(
    x + 5,
    y - 7,
    3,
    2,
    "#362b38"
  );

  /* NECK */

  rect(
    x + 4,
    y + 1,
    8,
    8,
    "#d89d83"
  );

  /* ARM - NEVER MOVES PLAYER */

  rect(
    x + 8,
    y + 6,
    17,
    7,
    "#b76b80"
  );

  rect(
    x + 20,
    y + 10,
    8,
    7,
    "#e1aa8e"
  );

  /* BODY */

  rect(
    x - 7,
    y + 5,
    25,
    26,
    "#7562a2"
  );

  rect(
    x - 3,
    y + 8,
    17,
    20,
    "#8c78b4"
  );

  /* BELT */

  rect(
    x - 6,
    y + 26,
    25,
    5,
    "#302d42"
  );

  rect(
    x + 3,
    y + 26,
    7,
    5,
    "#d4a75c"
  );

  /* LEGS */

  rect(
    x - 5,
    y + 31,
    9,
    16,
    "#373548"
  );

  rect(
    x + 8,
    y + 31,
    9,
    16,
    "#403b4d"
  );

  /* BOOTS */

  rect(
    x - 8,
    y + 45,
    13,
    5,
    "#262530"
  );

  rect(
    x + 7,
    y + 45,
    13,
    5,
    "#262530"
  );

  /* SWORD */

  drawSword(
    x + 24,
    y + 13,
    swordPhase
  );
}

/* ================= SWORD ================= */

function drawSword(handX, handY, phase) {

  /*
    剣はキャラクターの内側へ入れず、
    常に右側＝敵方向へ振る。

    phase 0:
      構え

    phase 0〜0.45:
      上方向へ振り上げ

    phase 0.45〜1:
      右外側へ斜め下に振り抜く

    「低すぎる」「内側すぎる」問題を
    ここで明確に修正。
  */

  let tipX;
  let tipY;

  if (phase <= 0) {

    tipX = handX + 29;
    tipY = handY - 27;

  } else if (phase < .45) {

    const t = phase / .45;

    tipX =
      handX + 29 + t * 18;

    tipY =
      handY - 27 - t * 11;

  } else {

    const t =
      (phase - .45) / .55;

    tipX =
      handX + 47 - t * 5;

    tipY =
      handY - 38 + t * 47;
  }

  /* HANDLE */

  rect(
    handX - 2,
    handY - 2,
    8,
    5,
    "#302b38"
  );

  rect(
    handX + 2,
    handY - 4,
    4,
    8,
    "#b8864d"
  );

  /* PIXEL BLADE */

  const dx = tipX - handX;
  const dy = tipY - handY;

  const length =
    Math.sqrt(dx * dx + dy * dy);

  const nx =
    -dy / length;

  const ny =
    dx / length;

  const width = 4;

  ctx.beginPath();

  ctx.moveTo(
    handX + nx * width,
    handY + ny * width
  );

  ctx.lineTo(
    tipX + nx * 1,
    tipY + ny * 1
  );

  ctx.lineTo(
    tipX - nx * 1,
    tipY - ny * 1
  );

  ctx.lineTo(
    handX - nx * width,
    handY - ny * width
  );

  ctx.closePath();

  ctx.fillStyle = "#e8e5dc";
  ctx.fill();

  /* blade shadow */

  ctx.beginPath();

  ctx.moveTo(
    handX,
    handY + 3
  );

  ctx.lineTo(
    tipX,
    tipY + 2
  );

  ctx.lineTo(
    tipX - nx * 1,
    tipY - ny * 1
  );

  ctx.lineTo(
    handX,
    handY
  );

  ctx.closePath();

  ctx.fillStyle = "#aaa9b1";
  ctx.fill();

  /* ATTACK ARC */

  if (phase > .1) {

    const alpha =
      Math.max(
        0,
        1 - Math.abs(phase - .7) * 2
      );

    ctx.save();

    ctx.globalAlpha =
      alpha * .7;

    ctx.strokeStyle = "#f1d3dc";
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
      handX + 25,
      handY + 3,
      42,
      -.9,
      .75
    );

    ctx.stroke();

    ctx.restore();
  }
}

/* ================= ENEMY ================= */

function drawEnemy(time) {

  const stage =
    stages[currentStage];

  let alpha = 1;
  let scale = 1;

  if (battleState.defeat > 0) {

    const elapsed =
      1 - battleState.defeat;

    alpha =
      Math.max(0, elapsed);

    scale =
      .55 + elapsed * .45;
  }

  ctx.save();

  ctx.globalAlpha = alpha;

  if (stage.type === "slime") {
    drawSlime(
      235,
      83,
      scale
    );
  }

  if (stage.type === "bat") {
    drawBat(
      235,
      76,
      scale,
      time
    );
  }

  if (stage.type === "dragon") {
    drawDragon(
      235,
      72,
      scale
    );
  }

  ctx.restore();

  /* FLASH */

  if (
    battleState.flashUntil >
    performance.now()
  ) {

    ctx.save();

    ctx.globalAlpha = .72;

    rect(
      160,
      35,
      120,
      100,
      "#ffffff"
    );

    ctx.restore();
  }
}

/* ================= SLIME ================= */

function drawSlime(x, y, scale) {

  ctx.save();

  ctx.translate(x, y);
  ctx.scale(scale, scale);

  /* shadow */

  rect(-27, 37, 54, 5, "#202337");

  /* body outline */

  rect(-24, -25, 48, 55, "#30294b");
  rect(-29, -10, 58, 35, "#30294b");

  /* body */

  rect(-20, -20, 40, 44, "#8a6095");
  rect(-24, -6, 48, 26, "#8a6095");

  /* highlight */

  rect(-15, -16, 12, 5, "#b893b0");
  rect(-20, -10, 5, 14, "#b893b0");

  /* eyes */

  rect(-12, -2, 7, 10, "#262438");
  rect(6, -2, 7, 10, "#262438");

  rect(-10, 0, 3, 3, "#e8d8dc");
  rect(8, 0, 3, 3, "#e8d8dc");

  /* mouth */

  rect(-4, 12, 9, 3, "#3a2d45");

  /* crystal */

  rect(12, -30, 6, 10, "#d6a95e");
  rect(9, -25, 12, 4, "#d6a95e");

  ctx.restore();
}

/* ================= BAT ================= */

function drawBat(x, y, scale, time) {

  ctx.save();

  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const flap =
    Math.sin(time / 100) * 4;

  /* shadow */

  rect(-25, 31, 50, 4, "#202337");

  /* wings */

  rect(-40, -4 + flap, 16, 28, "#37334f");
  rect(-35, -12 + flap, 10, 12, "#4f4a6d");

  rect(24, -4 - flap, 16, 28, "#37334f");
  rect(25, -12 - flap, 10, 12, "#4f4a6d");

  /* body */

  rect(-15, -18, 30, 44, "#5a4a71");
  rect(-11, -22, 22, 8, "#6e5c82");

  /* ears */

  rect(-13, -29, 8, 11, "#493b61");
  rect(5, -29, 8, 11, "#493b61");

  /* eyes */

  rect(-9, -8, 5, 7, "#d78392");
  rect(4, -8, 5, 7, "#d78392");

  rect(-8, -7, 2, 2, "#f4d4c8");
  rect(5, -7, 2, 2, "#f4d4c8");

  /* fangs */

  rect(-7, 12, 4, 8, "#d9d1cf");
  rect(3, 12, 4, 8, "#d9d1cf");

  ctx.restore();
}

/* ================= DRAGON ================= */

function drawDragon(x, y, scale) {

  ctx.save();

  ctx.translate(x, y);
  ctx.scale(scale, scale);

  /* shadow */

  rect(-43, 50, 86, 6, "#1d2030");

  /* wings */

  rect(-45, -34, 16, 45, "#403b67");
  rect(-40, -45, 10, 20, "#514b7b");
  rect(-30, -30, 10, 34, "#514b7b");

  rect(29, -34, 16, 45, "#403b67");
  rect(30, -45, 10, 20, "#514b7b");
  rect(20, -30, 10, 34, "#514b7b");

  /* neck */

  rect(-17, -37, 34, 57, "#57486d");
  rect(-12, -45, 24, 14, "#705978");

  /* head */

  rect(-28, -55, 56, 30, "#453b61");
  rect(-34, -46, 68, 22, "#453b61");

  /* horns */

  rect(-25, -67, 9, 16, "#d0a765");
  rect(16, -67, 9, 16, "#d0a765");

  rect(-28, -63, 7, 7, "#b98b50");
  rect(21, -63, 7, 7, "#b98b50");

  /* snout */

  rect(-17, -29, 34, 18, "#645073");

  /* eyes */

  rect(-18, -43, 9, 7, "#d58b82");
  rect(9, -43, 9, 7, "#d58b82");

  rect(-16, -42, 4, 3, "#f3d8bd");
  rect(11, -42, 4, 3, "#f3d8bd");

  /* mouth */

  rect(-12, -17, 24, 5, "#252335");

  /* teeth */

  rect(-9, -12, 4, 6, "#ded5c8");
  rect(5, -12, 4, 6, "#ded5c8");

  /* body */

  rect(-25, 3, 50, 37, "#514365");
  rect(-19, 8, 38, 26, "#6b5575");

  /* gem */

  rect(-5, 9, 10, 10, "#c17b91");
  rect(-3, 7, 6, 14, "#d29aad");

  /* claws */

  rect(-29, 32, 11, 13, "#302c42");
  rect(18, 32, 11, 13, "#302c42");

  ctx.restore();
}

/* ================= PARTICLES ================= */

function drawParticles() {

  const particles =
    battleState.particles;

  for (let i = particles.length - 1; i >= 0; i--) {

    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;

    p.vy += .08;
    p.life--;

    ctx.globalAlpha =
      Math.max(0, p.life / 50);

    rect(
      p.x,
      p.y,
      p.size,
      p.size,
      p.color
    );

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  ctx.globalAlpha = 1;
}

/* ================= DAMAGE ================= */

function drawDamage(time) {

  if (
    battleState.damageUntil <
    time
  ) {
    return;
  }

  const remain =
    battleState.damageUntil - time;

  const progress =
    1 - remain / 650;

  const y =
    battleState.damageY -
    progress * 18;

  ctx.save();

  ctx.globalAlpha =
    Math.min(
      1,
      remain / 180
    );

  pixelText(
    "-1",
    battleState.damageX,
    y,
    13,
    "#f3d49e",
    "center"
  );

  ctx.restore();
}

/* =========================================================
   SCORE RESET
   ========================================================= */

function resetScore() {

  const confirmed =
    window.confirm(
      "本当にリセットしますか？\n\n" +
      "ベストスコアと連勝記録をリセットします。\n" +
      "単語データは消えません。"
    );

  if (!confirmed) {
    return;
  }

  bestScore = 0;
  streak = 0;

  saveStats();
  renderStats();

  showToast(
    "スコア記録をリセットしました。"
  );
}

/* ================= EVENTS ================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadData();
    renderStats();

    /* navigation */

    document
      .querySelectorAll("[data-screen]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            if (
              button.dataset.screen ===
              "homeScreen"
            ) {
              answerLocked = true;
            }

            showScreen(
              button.dataset.screen
            );
          }
        );
      });

    /* word */

    $("#addWordBtn")
      .addEventListener(
        "click",
        addWord
      );

    $("#englishInput")
      .addEventListener(
        "keydown",
        event => {

          if (event.key === "Enter") {
            addWord();
          }
        }
      );

    $("#japaneseInput")
      .addEventListener(
        "keydown",
        event => {

          if (event.key === "Enter") {
            addWord();
          }
        }
      );

    /* quest */

    $("#startQuestBtn")
      .addEventListener(
        "click",
        startQuest
      );

    /* score */

    $("#resetScoreBtn")
      .addEventListener(
        "click",
        resetScore
      );

    /* flashcard */

    $("#flashcard")
      .addEventListener(
        "click",
        flipFlashcard
      );

    $("#nextCardBtn")
      .addEventListener(
        "click",
        nextCard
      );

    $("#prevCardBtn")
      .addEventListener(
        "click",
        previousCard
      );

    /* CSV */

    $("#exportCsvBtn")
      .addEventListener(
        "click",
        exportCSV
      );

    $("#importCsvBtn")
      .addEventListener(
        "click",
        () => {
          $("#csvFileInput").click();
        }
      );

    $("#csvFileInput")
      .addEventListener(
        "change",
        event => {

          const file =
            event.target.files[0];

          importCSV(file);

          event.target.value = "";
        }
      );

    /* result */

    $("#resultHomeBtn")
      .addEventListener(
        "click",
        () => {

          answerLocked = true;

          showScreen(
            "homeScreen"
          );
        }
      );

    /* start canvas */

    resetBattleAnimation();
  }
);