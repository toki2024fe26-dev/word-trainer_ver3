"use strict";

/* =========================================================
   PIXEL ENGLISH QUEST
   ========================================================= */

/* ================= STORAGE ================= */

const STORAGE = {
  words: "pixelEnglishWords",
  best: "pixelEnglishBest",
  streak: "pixelEnglishStreak",
  calendar: "pixelEnglishCalendar",
  monsterBook: "pixelEnglishMonsterBook",
  items: "pixelEnglishItems",
  totalCorrect: "pixelEnglishTotalCorrect"
};

/* =========================================================
   SOUND SYSTEM
   ========================================================= */

let audioCtx = null;
let masterGain = null;
let bgmTimer = null;
let bgmMode = "none";
let soundEnabled = true;

function initAudio() {
  try {
    if (!audioCtx) {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        console.warn("Web Audio API is not supported.");
        return false;
      }

      audioCtx = new AudioContext();

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.18;
      masterGain.connect(audioCtx.destination);
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    return true;
  } catch (error) {
    console.warn("Audio initialization failed:", error);
    return false;
  }
}

function unlockAudio() {
  const started = initAudio();

  if (
    started &&
    audioCtx &&
    audioCtx.state === "suspended"
  ) {
    audioCtx.resume().catch(error => {
      console.warn("Audio resume failed:", error);
    });
  }
}

function playSound(callback) {
  if (!soundEnabled) return;
  if (!initAudio()) return;

  try {
    callback();
  } catch (error) {
    console.warn("Sound error:", error);
  }
}

function createTone(
  type,
  frequency,
  duration,
  volume = 0.1,
  delay = 0
) {
  if (!audioCtx || !masterGain) return;

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const start = audioCtx.currentTime + delay;
  const end = start + duration;

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(
    frequency,
    start
  );

  gain.gain.setValueAtTime(
    0.0001,
    start
  );

  gain.gain.exponentialRampToValueAtTime(
    Math.max(volume, 0.001),
    start + 0.008
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    end
  );

  oscillator.connect(gain);
  gain.connect(masterGain);

  oscillator.start(start);
  oscillator.stop(end + 0.03);
}

function createSweep(
  type,
  startFrequency,
  endFrequency,
  duration,
  volume = 0.1,
  delay = 0
) {
  if (!audioCtx || !masterGain) return;

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const start = audioCtx.currentTime + delay;
  const end = start + duration;

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(
    startFrequency,
    start
  );

  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(endFrequency, 1),
    end
  );

  gain.gain.setValueAtTime(
    0.0001,
    start
  );

  gain.gain.exponentialRampToValueAtTime(
    Math.max(volume, 0.001),
    start + 0.008
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    end
  );

  oscillator.connect(gain);
  gain.connect(masterGain);

  oscillator.start(start);
  oscillator.stop(end + 0.03);
}

function createNoise(
  duration = 0.1,
  volume = 0.1,
  frequency = 1800
) {
  if (!audioCtx || !masterGain) return;

  const length = Math.floor(
    audioCtx.sampleRate * duration
  );

  const buffer = audioCtx.createBuffer(
    1,
    length,
    audioCtx.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  source.buffer = buffer;

  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 0.8;

  const start = audioCtx.currentTime;
  const end = start + duration;

  gain.gain.setValueAtTime(
    0.0001,
    start
  );

  gain.gain.exponentialRampToValueAtTime(
    Math.max(volume, 0.001),
    start + 0.005
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    end
  );

  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  source.start(start);
  source.stop(end + 0.02);
}

/* ================= SOUND EFFECTS ================= */

function playButtonSound() {
  playSound(() => {
    createTone(
      "square",
      660,
      0.045,
      0.06
    );

    createTone(
      "square",
      880,
      0.045,
      0.04,
      0.035
    );
  });
}

function playStartSound() {
  playSound(() => {
    createTone(
      "square",
      261.63,
      0.10,
      0.07
    );

    createTone(
      "square",
      329.63,
      0.10,
      0.07,
      0.10
    );

    createTone(
      "square",
      392.00,
      0.12,
      0.08,
      0.20
    );

    createTone(
      "triangle",
      523.25,
      0.32,
      0.09,
      0.32
    );
  });
}

function playCorrectSound() {
  playSound(() => {
    createTone(
      "square",
      523.25,
      0.09,
      0.08
    );

    createTone(
      "square",
      659.25,
      0.09,
      0.08,
      0.08
    );

    createTone(
      "square",
      783.99,
      0.18,
      0.09,
      0.16
    );
  });
}

function playWrongSound() {
  playSound(() => {
    createSweep(
      "sawtooth",
      240,
      110,
      0.20,
      0.08
    );

    createTone(
      "square",
      80,
      0.12,
      0.05,
      0.08
    );
  });
}

function playSwordSound() {
  playSound(() => {
    createNoise(
      0.12,
      0.07,
      2300
    );

    createSweep(
      "sawtooth",
      850,
      260,
      0.12,
      0.045
    );
  });
}

function playHitSound() {
  playSound(() => {
    createNoise(
      0.08,
      0.13,
      1400
    );

    createSweep(
      "square",
      220,
      80,
      0.16,
      0.10
    );
  });
}

function playDefeatSound() {
  playSound(() => {
    createTone(
      "square",
      392.00,
      0.11,
      0.07
    );

    createTone(
      "square",
      523.25,
      0.11,
      0.07,
      0.10
    );

    createTone(
      "square",
      659.25,
      0.12,
      0.08,
      0.20
    );

    createTone(
      "triangle",
      783.99,
      0.28,
      0.09,
      0.32
    );

    createNoise(
      0.20,
      0.07,
      1100
    );
  });
}

function playResultSound() {
  playSound(() => {
    createTone(
      "triangle",
      523.25,
      0.13,
      0.07
    );

    createTone(
      "triangle",
      659.25,
      0.13,
      0.07,
      0.14
    );

    createTone(
      "triangle",
      783.99,
      0.15,
      0.08,
      0.28
    );

    createTone(
      "triangle",
      1046.50,
      0.35,
      0.10,
      0.44
    );
  });
}

/* =========================================================
   BGM
   ========================================================= */

/*
  通常戦闘BGM
  軽快なSFC後期〜PS1初期RPG風
*/

function startNormalBGM() {
  stopBGM();

  if (!soundEnabled) return;
  if (!initAudio()) return;

  bgmMode = "normal";

  const notes = [
    261.63,
    329.63,
    392.00,
    329.63,
    293.66,
    349.23,
    440.00,
    349.23
  ];

  let index = 0;

  function note() {
    if (
      !audioCtx ||
      !soundEnabled ||
      bgmMode !== "normal"
    ) {
      return;
    }

    createTone(
      "triangle",
      notes[index],
      0.22,
      0.025
    );

    if (index % 2 === 0) {
      createTone(
        "sine",
        notes[index] / 2,
        0.20,
        0.018
      );
    }

    index++;

    if (index >= notes.length) {
      index = 0;
    }
  }

  note();

  bgmTimer = setInterval(
    note,
    300
  );
}

/*
  ボスBGM
  低いベース＋不安定な音程＋速いパルス
  通常BGMより緊張感を強くする
*/

function startBossBGM() {
  stopBGM();

  if (!soundEnabled) return;
  if (!initAudio()) return;

  bgmMode = "boss";

  const bassNotes = [
    110,
    110,
    130.81,
    98,
    110,
    92.50,
    103.83,
    98
  ];

  const melodyNotes = [
    220,
    233.08,
    196,
    207.65,
    220,
    185,
    196,
    207.65
  ];

  let index = 0;

  function note() {
    if (
      !audioCtx ||
      !soundEnabled ||
      bgmMode !== "boss"
    ) {
      return;
    }

    const bass =
      bassNotes[index];

    const melody =
      melodyNotes[index];

    createTone(
      "sawtooth",
      bass,
      0.20,
      0.030
    );

    createTone(
      "square",
      melody,
      0.10,
      0.016,
      0.06
    );

    if (
      index === 0 ||
      index === 4
    ) {
      createNoise(
        0.055,
        0.025,
        800
      );
    }

    index++;

    if (
      index >=
      bassNotes.length
    ) {
      index = 0;
    }
  }

  note();

  bgmTimer = setInterval(
    note,
    220
  );
}

function startBGMForCurrentStage() {
  const stage =
    stages[currentStage];

  if (stage && stage.boss) {
    startBossBGM();
  } else {
    startNormalBGM();
  }
}

function stopBGM() {
  if (bgmTimer !== null) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }

  bgmMode = "none";
}

/* =========================================================
   DEFAULT WORDS
   ========================================================= */

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

/* =========================================================
   MONSTER DATA
   ========================================================= */

const MONSTERS = [
  {
    id: "moon-slime",
    name: "MOON SLIME",
    type: "slime",
    description: "月明かりの谷に現れる紫色のスライム。",
    rarity: "COMMON",
    boss: false
  },
  {
    id: "shadow-bat",
    name: "SHADOW BAT",
    type: "bat",
    description: "暗闇を飛び回る夜のコウモリ。",
    rarity: "COMMON",
    boss: false
  },
  {
    id: "forest-mandraga",
    name: "FOREST MANDRAGA",
    type: "mandraga",
    description: "古代森林に眠る植物型モンスター。",
    rarity: "UNCOMMON",
    boss: false
  },
  {
    id: "night-wolf",
    name: "NIGHT WOLF",
    type: "wolf",
    description: "夜の森を駆ける俊敏な魔獣。",
    rarity: "UNCOMMON",
    boss: false
  },
  {
    id: "phantom",
    name: "PHANTOM",
    type: "phantom",
    description: "廃墟に現れる正体不明の亡霊。",
    rarity: "RARE",
    boss: false
  },
  {
    id: "iron-golem",
    name: "IRON GOLEM",
    type: "golem",
    description: "古代文明の遺跡を守る鉄の巨人。",
    rarity: "RARE",
    boss: false
  },
  {
    id: "astral-dragon",
    name: "ASTRAL DRAGON",
    type: "dragon",
    description: "星の力を宿した最上級モンスター。",
    rarity: "BOSS",
    boss: true
  }
];

/* =========================================================
   STAGES
   ========================================================= */

const stages = [
  {
    name: "MOON SLIME",
    type: "slime",
    monsterId: "moon-slime",
    maxHits: 3,
    boss: false
  },
  {
    name: "SHADOW BAT",
    type: "bat",
    monsterId: "shadow-bat",
    maxHits: 3,
    boss: false
  },
  {
    name: "ASTRAL DRAGON",
    type: "dragon",
    monsterId: "astral-dragon",
    maxHits: 4,
    boss: true
  }
];

/* =========================================================
   STATE
   ========================================================= */

let words = [];

let bestScore = 0;
let streak = 0;

let calendarData = {};
let monsterBook = {};
let items = {
  recovery: 0
};

let totalCorrect = 0;

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

/* =========================================================
   DOM
   ========================================================= */

const $ =
  selector =>
    document.querySelector(selector);

const screens =
  document.querySelectorAll(
    ".screen"
  );

/* =========================================================
   STORAGE
   ========================================================= */

function loadData() {
  try {
    const savedWords =
      localStorage.getItem(
        STORAGE.words
      );

    if (savedWords) {
      const parsed =
        JSON.parse(savedWords);

      if (Array.isArray(parsed)) {
        words =
          normalizeWords(parsed);
      }
    }

    if (!words.length) {
      words =
        DEFAULT_WORDS.map(
          ([en, jp]) => ({
            en,
            jp
          })
        );

      saveWords();
    }

    bestScore =
      Number(
        localStorage.getItem(
          STORAGE.best
        )
      ) || 0;

    streak =
      Number(
        localStorage.getItem(
          STORAGE.streak
        )
      ) || 0;

    calendarData =
      JSON.parse(
        localStorage.getItem(
          STORAGE.calendar
        ) || "{}"
      );

    monsterBook =
      JSON.parse(
        localStorage.getItem(
          STORAGE.monsterBook
        ) || "{}"
      );

    items =
      JSON.parse(
        localStorage.getItem(
          STORAGE.items
        ) ||
        '{"recovery":0}'
      );

    totalCorrect =
      Number(
        localStorage.getItem(
          STORAGE.totalCorrect
        )
      ) || 0;

    if (
      !items ||
      typeof items !== "object"
    ) {
      items = {
        recovery: 0
      };
    }

    if (
      typeof items.recovery !==
      "number"
    ) {
      items.recovery = 0;
    }

  } catch (error) {
    console.error(error);

    words =
      DEFAULT_WORDS.map(
        ([en, jp]) => ({
          en,
          jp
        })
      );

    bestScore = 0;
    streak = 0;
    calendarData = {};
    monsterBook = {};
    items = {
      recovery: 0
    };
    totalCorrect = 0;
  }
}

function normalizeWords(list) {
  const result = [];
  const seen = new Set();

  list.forEach(item => {
    let en = "";
    let jp = "";

    if (Array.isArray(item)) {
      en =
        String(
          item[0] || ""
        ).trim();

      jp =
        String(
          item[1] || ""
        ).trim();

    } else {
      en =
        String(
          item.en || ""
        ).trim();

      jp =
        String(
          item.jp || ""
        ).trim();
    }

    const key =
      en.toLowerCase();

    if (
      !en ||
      !jp ||
      seen.has(key)
    ) {
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

  localStorage.setItem(
    STORAGE.totalCorrect,
    String(totalCorrect)
  );
}

function saveGameData() {
  localStorage.setItem(
    STORAGE.calendar,
    JSON.stringify(calendarData)
  );

  localStorage.setItem(
    STORAGE.monsterBook,
    JSON.stringify(monsterBook)
  );

  localStorage.setItem(
    STORAGE.items,
    JSON.stringify(items)
  );
}

/* =========================================================
   DAILY LEARNING
   ========================================================= */

function getDateKey(date = new Date()) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function markTodayPlayed() {
  const today =
    getDateKey();

  if (!calendarData[today]) {
    calendarData[today] = {
      played: true
    };
  }

  updateStreak();

  saveGameData();
  saveStats();
}

function updateStreak() {
  let count = 0;

  const date =
    new Date();

  while (true) {
    const key =
      getDateKey(date);

    if (!calendarData[key]) {
      break;
    }

    count++;

    date.setDate(
      date.getDate() - 1
    );
  }

  streak = count;

  /*
    7日連続達成ごとに
    リカバリーアイテムを1個。
  */

  const rewardCount =
    Math.floor(
      streak / 7
    );

  const rewardKey =
    `reward-${streak -
      (streak % 7)}`;

  const claimed =
    localStorage.getItem(
      "pixelEnglishRewardClaim"
    ) || "";

  if (
    rewardCount > 0 &&
    claimed !== rewardKey
  ) {
    items.recovery += 1;

    localStorage.setItem(
      "pixelEnglishRewardClaim",
      rewardKey
    );

    showToast(
      "7日連続学習達成！\nリカバリーエリクサーを獲得！"
    );

    playRewardSound();
  }
}

function playRewardSound() {
  playSound(() => {
    createTone(
      "triangle",
      523.25,
      0.12,
      0.07
    );

    createTone(
      "triangle",
      659.25,
      0.12,
      0.07,
      0.12
    );

    createTone(
      "triangle",
      783.99,
      0.15,
      0.08,
      0.24
    );

    createTone(
      "triangle",
      1046.50,
      0.30,
      0.09,
      0.39
    );
  });
}

/* =========================================================
   MONSTER BOOK
   ========================================================= */

function registerMonster(monsterId) {
  if (!monsterId) return;

  if (!monsterBook[monsterId]) {
    monsterBook[monsterId] = {
      defeated: 0,
      discoveredAt: getDateKey()
    };
  }

  monsterBook[monsterId].defeated += 1;

  saveGameData();
}

function getDiscoveredCount() {
  return Object.keys(
    monsterBook
  ).length;
}

/* =========================================================
   UI
   ========================================================= */

function renderStats() {
  if ($("#wordCount")) {
    $("#wordCount").textContent =
      words.length;
  }

  if ($("#bestScore")) {
    $("#bestScore").textContent =
      bestScore;
  }

  if ($("#streakCount")) {
    $("#streakCount").textContent =
      streak;
  }
}

function showScreen(id) {
  // 追加生成される図鑑・カレンダーも含めて毎回取得する。
  // 初期化時のNodeListだけを使うと、後から追加した画面を閉じられない。
  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove(
        "active"
      );
    });

  const target =
    document.getElementById(id);

  if (!target) {
    return;
  }

  target.classList.add(
    "active"
  );

  currentScreen = id;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (
    id === "wordbookScreen"
  ) {
    renderWordBook();
  }

  if (
    id === "flashcardScreen"
  ) {
    renderFlashcard();
  }

  if (id !== "quizScreen") {
    stopBGM();
  }
}

/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function showToast(message) {
  const toast =
    $("#toast");

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {
      toast.classList.remove(
        "show"
      );
    }, 2200);
}

/* =========================================================
   EXTRA MENU
   JavaScriptだけで追加画面を作る
   ========================================================= */

function createExtraScreens() {
  if (
    document.getElementById(
      "monsterBookScreen"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.textContent = `
    .extra-screen {
      min-height: 100vh;
      padding: 24px 16px 60px;
    }

    .extra-inner {
      width: min(900px, 100%);
      margin: 0 auto;
    }

    .extra-title {
      font-size: 22px;
      letter-spacing: .12em;
      margin-bottom: 18px;
    }

    .extra-panel {
      padding: 18px;
      margin-bottom: 14px;
      border-radius: 8px;
    }

    .monster-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .monster-card {
      min-height: 130px;
      padding: 12px;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 8px;
    }

    .monster-card.locked {
      opacity: .48;
    }

    .monster-sprite {
      position: relative;
      width: 100%;
      height: 108px;
      margin-bottom: 8px;
      overflow: hidden;
      background: transparent;
      border: 0;
    }

    .monster-frame {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      opacity: 0;
      animation: monsterBookIdle 1.1s steps(1, end) infinite;
    }

    .monster-frame-a {
      animation-delay: 0s;
    }

    .monster-frame-b {
      animation-delay: .55s;
    }

    @keyframes monsterBookIdle {
      0%, 49.99% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }

    .monster-name {
      font-weight: bold;
      letter-spacing: .08em;
      margin-bottom: 6px;
    }

    .monster-meta {
      font-size: 11px;
      opacity: .75;
      margin-bottom: 8px;
    }

    .monster-description {
      font-size: 12px;
      line-height: 1.6;
    }

    .calendar-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns:
        repeat(7, 1fr);
      gap: 5px;
    }

    .calendar-weekday,
    .calendar-day {
      text-align: center;
      font-size: 11px;
      padding: 7px 2px;
    }

    .calendar-day {
      min-height: 34px;
      border-radius: 5px;
      background: rgba(255,255,255,.05);
    }

    .calendar-day.played {
      background: rgba(126, 184, 146, .34);
      box-shadow:
        inset 0 0 0 1px
        rgba(170,230,180,.35);
    }

    .calendar-day.today {
      outline: 2px solid rgba(240,210,130,.8);
    }

    .calendar-day.empty {
      background: transparent;
    }

    .reward-box {
      border: 1px solid rgba(240,210,130,.35);
    }

    .reward-icon {
      font-size: 28px;
      margin-bottom: 6px;
    }

    .back-extra-btn {
      margin-top: 10px;
    }

    @media (max-width: 560px) {
      .monster-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);

  const monsterScreen =
    document.createElement(
      "section"
    );

  monsterScreen.id =
    "monsterBookScreen";

  monsterScreen.className =
    "screen extra-screen";

  monsterScreen.innerHTML = `
    <div class="extra-inner">
      <div class="extra-title">
        MONSTER BOOK
      </div>

      <div class="extra-panel">
        <strong id="monsterBookCount">
          0 / ${MONSTERS.length}
        </strong>
        <div>
          発見したモンスター
        </div>
      </div>

      <div
        id="monsterBookList"
        class="monster-grid">
      </div>

      <button
        class="back-extra-btn"
        data-extra-back>
        BACK
      </button>
    </div>
  `;

  const calendarScreen =
    document.createElement(
      "section"
    );

  calendarScreen.id =
    "calendarScreen";

  calendarScreen.className =
    "screen extra-screen";

  calendarScreen.innerHTML = `
    <div class="extra-inner">
      <div class="extra-title">
        LEARNING CALENDAR
      </div>

      <div class="extra-panel reward-box">
        <div class="reward-icon">
          🧪
        </div>

        <strong id="recoveryCount">
          RECOVERY ELIXIR ×0
        </strong>

        <div id="rewardMessage">
          7日連続学習でアイテムを獲得！
        </div>
      </div>

      <div class="extra-panel">
        <div class="calendar-head">
          <button
            id="calendarPrev">
            ◀
          </button>

          <strong id="calendarTitle">
          </strong>

          <button
            id="calendarNext">
            ▶
          </button>
        </div>

        <div
          id="calendarGrid"
          class="calendar-grid">
        </div>
      </div>

      <button
        class="back-extra-btn"
        data-extra-back>
        BACK
      </button>
    </div>
  `;

  document.body.appendChild(
    monsterScreen
  );

  document.body.appendChild(
    calendarScreen
  );

  monsterScreen
    .querySelector(
      "[data-extra-back]"
    )
    .addEventListener(
      "click",
      () => {
        playButtonSound();
        showScreen(
          "homeScreen"
        );
      }
    );

  calendarScreen
    .querySelector(
      "[data-extra-back]"
    )
    .addEventListener(
      "click",
      () => {
        playButtonSound();
        showScreen(
          "homeScreen"
        );
      }
    );

  $("#calendarPrev")
    .addEventListener(
      "click",
      () => {
        playButtonSound();

        calendarViewMonth--;

        if (
          calendarViewMonth <
          0
        ) {
          calendarViewMonth = 11;
          calendarViewYear--;
        }

        renderCalendar();
      }
    );

  $("#calendarNext")
    .addEventListener(
      "click",
      () => {
        playButtonSound();

        calendarViewMonth++;

        if (
          calendarViewMonth >
          11
        ) {
          calendarViewMonth = 0;
          calendarViewYear++;
        }

        renderCalendar();
      }
    );
}

/* =========================================================
   EXTRA NAV BUTTONS
   ========================================================= */

function createExtraNavigation() {
  if (
    document.getElementById(
      "extraNavigation"
    )
  ) {
    return;
  }

  const home =
    $("#homeScreen");

  if (!home) {
    return;
  }

  const box =
    document.createElement(
      "div"
    );

  box.id =
    "extraNavigation";

  box.style.cssText = `
    display:grid;
    grid-template-columns:
      repeat(2,minmax(0,1fr));
    gap:10px;
    margin-top:16px;
  `;

  box.innerHTML = `
    <button
      id="openMonsterBookBtn">
      MONSTER BOOK
    </button>

    <button
      id="openCalendarBtn">
      LEARNING CALENDAR
    </button>
  `;

  home.appendChild(box);

  $("#openMonsterBookBtn")
    .addEventListener(
      "click",
      () => {
        playButtonSound();

        showScreen(
          "monsterBookScreen"
        );

        renderMonsterBook();
      }
    );

  $("#openCalendarBtn")
    .addEventListener(
      "click",
      () => {
        playButtonSound();

        showScreen(
          "calendarScreen"
        );

        renderCalendar();
      }
    );
}

/* =========================================================
   MONSTER BOOK UI
   ========================================================= */

function renderMonsterBook() {
  const list =
    $("#monsterBookList");

  if (!list) {
    return;
  }

  const discovered =
    getDiscoveredCount();

  $("#monsterBookCount")
    .textContent =
      `${discovered} / ${MONSTERS.length}`;

  list.innerHTML = "";

  MONSTERS.forEach(monster => {
    const data =
      monsterBook[monster.id];

    const card =
      document.createElement("div");

    card.className = "monster-card";

    if (!data) {
      card.classList.add("locked");
    }

    const sprite =
      document.createElement("div");

    sprite.className = "monster-sprite";

    const frameA =
      document.createElement("img");
    const frameB =
      document.createElement("img");

    frameA.className =
      "monster-frame monster-frame-a";
    frameB.className =
      "monster-frame monster-frame-b";

    frameA.alt = monster.name;
    frameB.alt = monster.name;

    sprite.appendChild(frameA);
    sprite.appendChild(frameB);

    card.appendChild(sprite);

    const name =
      document.createElement("div");
    name.className = "monster-name";
    name.textContent =
      data ? monster.name : "??? ????";
    card.appendChild(name);

    const meta =
      document.createElement("div");
    meta.className = "monster-meta";
    meta.textContent = data
      ? `${monster.rarity}・DEFEATED ×${data.defeated}`
      : "UNKNOWN";
    card.appendChild(meta);

    const description =
      document.createElement("div");
    description.className = "monster-description";
    description.textContent = data
      ? monster.description
      : "まだ遭遇していない。";
    card.appendChild(description);

    list.appendChild(card);

    const frames =
      createMonsterBookFrames(monster.type);

    frameA.src = frames[0];
    frameB.src = frames[1];
  });
}

/*
 * 図鑑のモンスター画像は、クエスト戦闘で使っている
 * drawSlime / drawBat / drawMandraga ... を直接使って生成する。
 * これで図鑑と実際のクエストのモンスター絵が完全に同じになる。
 */
function createMonsterBookFrames(type) {
  if (!canvas || !ctx) {
    return ["", ""];
  }

  const frames = [];
  const originalImage =
    ctx.getImageData(0, 0, canvas.width, canvas.height);

  const drawPreview = time => {
    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // 背景は描かず、モンスターだけを透明PNGとして書き出す。
    // 2枚目は少し上下に動かして、図鑑でも確実に2フレームの
    // アイドルアニメーションになるようにする。
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (time > 0) {
      ctx.translate(0, 3);
    }

    if (type === "slime") {
      drawSlime(235, 83, 1);
    } else if (type === "bat") {
      drawBat(235, 76, 1, time);
    } else if (type === "mandraga") {
      drawMandraga(235, 82, 1);
    } else if (type === "wolf") {
      drawWolf(235, 84, 1);
    } else if (type === "phantom") {
      drawPhantom(235, 78, 1);
    } else if (type === "golem") {
      drawGolem(235, 76, 1);
    } else if (type === "dragon") {
      drawDragon(235, 72, 1);
    }

    ctx.restore();

    return canvas.toDataURL("image/png");
  };

  frames.push(drawPreview(0));
  frames.push(drawPreview(120));

  ctx.putImageData(
    originalImage,
    0,
    0
  );

  return frames;
}

/* =========================================================
   CALENDAR
   ========================================================= */

let calendarViewDate =
  new Date();

let calendarViewYear =
  calendarViewDate.getFullYear();

let calendarViewMonth =
  calendarViewDate.getMonth();

function renderCalendar() {
  const grid =
    $("#calendarGrid");

  if (!grid) {
    return;
  }

  const title =
    $("#calendarTitle");

  title.textContent =
    `${calendarViewYear} / ` +
    String(
      calendarViewMonth + 1
    ).padStart(2, "0");

  grid.innerHTML = "";

  const weekdays = [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT"
  ];

  weekdays.forEach(day => {
    const cell =
      document.createElement(
        "div"
      );

    cell.className =
      "calendar-weekday";

    cell.textContent =
      day;

    grid.appendChild(cell);
  });

  const firstDay =
    new Date(
      calendarViewYear,
      calendarViewMonth,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      calendarViewYear,
      calendarViewMonth + 1,
      0
    ).getDate();

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "calendar-day empty";

    grid.appendChild(empty);
  }

  const today =
    getDateKey();

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    const date =
      new Date(
        calendarViewYear,
        calendarViewMonth,
        day
      );

    const key =
      getDateKey(date);

    const cell =
      document.createElement(
        "div"
      );

    cell.className =
      "calendar-day";

    if (
      calendarData[key]
    ) {
      cell.classList.add(
        "played"
      );
    }

    if (key === today) {
      cell.classList.add(
        "today"
      );
    }

    cell.textContent =
      calendarData[key]
        ? `✓ ${day}`
        : day;

    grid.appendChild(cell);
  }

  if ($("#recoveryCount")) {
    $("#recoveryCount")
      .textContent =
        `RECOVERY ELIXIR ×${items.recovery}`;
  }

  if ($("#rewardMessage")) {
    const remain =
      7 -
      (streak % 7);

    $("#rewardMessage")
      .textContent =
        streak > 0 &&
        streak % 7 === 0
          ? "7日連続達成！報酬獲得済み！"
          : `現在 ${streak}日連続。あと ${remain}日で報酬！`;
  }
}

/* =========================================================
   WORD REGISTER
   ========================================================= */

function addWord() {
  playButtonSound();

  const enInput =
    $("#englishInput");

  const jpInput =
    $("#japaneseInput");

  const en =
    enInput.value.trim();

  const jp =
    jpInput.value.trim();

  if (!en || !jp) {
    showToast(
      "英単語と日本語の意味を入力してください。"
    );

    return;
  }

  const exists =
    words.some(
      word =>
        word.en.toLowerCase() ===
        en.toLowerCase()
    );

  if (exists) {
    showToast(
      "その単語はすでに登録されています。"
    );

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

  showToast(
    "単語を登録しました。"
  );
}

/* =========================================================
   WORD BOOK
   ========================================================= */

function renderWordBook() {
  const list =
    $("#wordList");

  if (!list) return;

  list.innerHTML = "";

  if (!words.length) {
    list.innerHTML = `
      <div class="panel">
        単語が登録されていません。
      </div>
    `;

    return;
  }

  words.forEach(
    (word, index) => {
      const item =
        document.createElement(
          "div"
        );

      item.className =
        "word-item";

      item.innerHTML = `
        <div>
          <strong>
            ${escapeHtml(
              word.en
            )}
          </strong>

          <span>
            ${escapeHtml(
              word.jp
            )}
          </span>
        </div>

        <button
          class="delete-word"
          data-index="${index}">
          DELETE
        </button>
      `;

      list.appendChild(item);
    }
  );

  list
    .querySelectorAll(
      ".delete-word"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          playButtonSound();

          const index =
            Number(
              button.dataset.index
            );

          if (
            !Number.isInteger(
              index
            )
          ) {
            return;
          }

          words.splice(
            index,
            1
          );

          saveWords();

          renderWordBook();
          renderStats();
        }
      );
    });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

/* =========================================================
   CSV
   ========================================================= */

function exportCSV() {
  playButtonSound();

  if (!words.length) {
    showToast(
      "登録単語がありません。"
    );

    return;
  }

  const rows = [
    [
      "English",
      "Japanese"
    ],
    ...words.map(
      word => [
        word.en,
        word.jp
      ]
    )
  ];

  const csv =
    rows
      .map(
        row =>
          row
            .map(
              value =>
                `"${String(value)
                  .replaceAll(
                    '"',
                    '""'
                  )}"`
            )
            .join(",")
      )
      .join("\r\n");

  const blob =
    new Blob(
      [
        "\uFEFF" +
        csv
      ],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    "pixel-english-words.csv";

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );

  showToast(
    "CSVを書き出しました。"
  );
}

function importCSV(file) {
  if (!file) return;

  const reader =
    new FileReader();

  reader.onload =
    event => {
      const text =
        String(
          event.target.result ||
          ""
        )
          .replace(
            /^\uFEFF/,
            ""
          );

      const lines =
        text
          .split(/\r?\n/)
          .filter(
            line =>
              line.trim()
          );

      if (lines.length < 2) {
        showToast(
          "CSVの内容を読み込めませんでした。"
        );

        return;
      }

      const imported = [];

      for (
        let i = 1;
        i < lines.length;
        i++
      ) {
        const parts =
          parseCSVLine(
            lines[i]
          );

        if (
          parts.length < 2
        ) {
          continue;
        }

        imported.push({
          en:
            parts[0].trim(),

          jp:
            parts[1].trim()
        });
      }

      const before =
        words.length;

      words =
        normalizeWords([
          ...words,
          ...imported
        ]);

      saveWords();
      renderStats();

      showToast(
        `${words.length - before}語を追加しました。`
      );
    };

  reader.readAsText(
    file,
    "UTF-8"
  );
}

function parseCSVLine(line) {
  const result = [];

  let current = "";
  let quoted = false;

  for (
    let i = 0;
    i < line.length;
    i++
  ) {
    const char =
      line[i];

    if (char === '"') {
      if (
        quoted &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }

    } else if (
      char === "," &&
      !quoted
    ) {
      result.push(
        current
      );

      current = "";

    } else {
      current += char;
    }
  }

  result.push(current);

  return result;
}

/* =========================================================
   FLASHCARD
   ========================================================= */

function renderFlashcard() {
  if (!words.length) return;

  if (
    flashIndex >=
    words.length
  ) {
    flashIndex = 0;
  }

  const word =
    words[flashIndex];

  if ($("#flashEnglish")) {
    $("#flashEnglish")
      .textContent =
        word.en;
  }

  if ($("#flashJapanese")) {
    $("#flashJapanese")
      .textContent =
        flashFlipped
          ? word.jp
          : "？？？";
  }

  if ($("#flashIndex")) {
    $("#flashIndex")
      .textContent =
        `${flashIndex + 1} / ${words.length}`;
  }
}

function flipFlashcard() {
  playButtonSound();

  flashFlipped =
    !flashFlipped;

  renderFlashcard();
}

function nextCard() {
  playButtonSound();

  flashIndex++;

  if (
    flashIndex >=
    words.length
  ) {
    flashIndex = 0;
  }

  flashFlipped = false;

  renderFlashcard();
}

function previousCard() {
  playButtonSound();

  flashIndex--;

  if (flashIndex < 0) {
    flashIndex =
      words.length - 1;
  }

  flashFlipped = false;

  renderFlashcard();
}

/* =========================================================
   QUEST
   ========================================================= */

function shuffle(array) {
  const result =
    [...array];

  for (
    let i =
      result.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];
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

  unlockAudio();

  playStartSound();

  /*
    学習日として記録。
    クエスト開始時点でその日の学習を記録する。
  */
  markTodayPlayed();

  quizWords =
    shuffle(words)
      .slice(0, 10);

  currentIndex = 0;
  currentStage = 0;
  stageHit = 0;

  quizScore = 0;
  correctCount = 0;

  answerLocked = false;

  resetBattleAnimation();

  showScreen(
    "quizScreen"
  );

  setupStage();

  nextQuestion();

  setTimeout(() => {
    if (
      currentScreen ===
      "quizScreen"
    ) {
      startBGMForCurrentStage();
    }
  }, 180);
}

/* =========================================================
   STAGE
   ========================================================= */

function setupStage() {
  const stage =
    stages[currentStage];

  stageHit = 0;

  if ($("#stageBadge")) {
    $("#stageBadge")
      .textContent =
        `STAGE ${currentStage + 1}`;
  }

  if ($("#enemyName")) {
    $("#enemyName")
      .textContent =
        stage.name;
  }

  updateEnemyHp();

  if ($("#battleMessage")) {
    $("#battleMessage")
      .textContent =
        stage.boss
          ? "WARNING... BOSS BATTLE"
          : "SELECT THE CORRECT ANSWER";
  }

  resetBattleAnimation();

  /*
    ステージ移行時にBGMを変更。
    ASTRAL DRAGONではボスBGM。
  */

  setTimeout(() => {
    if (
      currentScreen ===
      "quizScreen"
    ) {
      startBGMForCurrentStage();
    }
  }, 50);
}

function updateEnemyHp() {
  const stage =
    stages[currentStage];

  const ratio =
    Math.max(
      0,
      1 -
        stageHit /
          stage.maxHits
    );

  if ($("#enemyHp")) {
    $("#enemyHp")
      .style.width =
        `${ratio * 100}%`;
  }
}

/* =========================================================
   QUESTION
   ========================================================= */

function nextQuestion() {
  if (
    currentIndex >=
    quizWords.length
  ) {
    finishQuiz();

    return;
  }

  answerLocked = false;

  const current =
    quizWords[
      currentIndex
    ];

  if ($("#questionNumber")) {
    $("#questionNumber")
      .textContent =
        String(
          currentIndex + 1
        ).padStart(
          2,
          "0"
        );
  }

  if ($("#questionProgress")) {
    $("#questionProgress")
      .style.width =
        `${
          (
            currentIndex /
            quizWords.length
          ) * 100
        }%`;
  }

  if ($("#questionWord")) {
    $("#questionWord")
      .textContent =
        current.en;
  }

  if ($("#quizScore")) {
    $("#quizScore")
      .textContent =
        quizScore;
  }

  if ($("#hitCount")) {
    $("#hitCount")
      .textContent =
        stageHit;
  }

  const choices =
    makeChoices(
      current
    );

  renderAnswers(
    choices
  );

  if ($("#battleMessage")) {
    $("#battleMessage")
      .textContent =
        "SELECT THE CORRECT ANSWER";
  }

  updateEnemyHp();
}

function makeChoices(
  correctWord
) {
  const candidates =
    words.filter(
      word =>
        word.en.toLowerCase() !==
        correctWord.en.toLowerCase()
    );

  const wrongChoices =
    shuffle(
      candidates
    )
      .slice(0, 3)
      .map(
        word =>
          word.jp
      );

  const all = [
    correctWord.jp,
    ...wrongChoices
  ];

  return shuffle(all);
}

function renderAnswers(
  choices
) {
  const container =
    $("#answers");

  if (!container) return;

  container.innerHTML = "";

  choices.forEach(
    choice => {
      const button =
        document.createElement(
          "button"
        );

      button.className =
        "answer-btn";

      button.textContent =
        choice;

      button.addEventListener(
        "click",
        () =>
          handleAnswer(
            choice,
            button
          )
      );

      container.appendChild(
        button
      );
    }
  );
}

/* =========================================================
   RECOVERY ITEM
   ========================================================= */

function tryRecoveryItem() {
  if (
    items.recovery <= 0
  ) {
    return false;
  }

  const confirmed =
    window.confirm(
      "リカバリーエリクサーを使いますか？\n\n" +
      "今回のMISSを無効にして、連勝を維持します。"
    );

  if (!confirmed) {
    return false;
  }

  items.recovery--;

  saveGameData();

  playRewardSound();

  showToast(
    "リカバリーエリクサーを使用した！"
  );

  return true;
}

/* =========================================================
   ANSWER
   ========================================================= */

function handleAnswer(
  selected,
  clickedButton
) {
  if (answerLocked) {
    return;
  }

  if (
    currentIndex >=
    quizWords.length
  ) {
    return;
  }

  playButtonSound();

  answerLocked = true;

  const current =
    quizWords[
      currentIndex
    ];

  const isCorrect =
    selected ===
    current.jp;

  const buttons =
    document.querySelectorAll(
      ".answer-btn"
    );

  buttons.forEach(
    button => {
      button.disabled =
        true;

      if (
        button.textContent ===
        current.jp
      ) {
        button.classList.add(
          "correct"
        );
      }
    }
  );

  /* =======================================================
     WRONG
     ======================================================= */

  if (!isCorrect) {
    /*
      まずリカバリーアイテムを確認。
      アイテムを使った場合はMISS扱いにしない。
    */

    if (
      tryRecoveryItem()
    ) {
      clickedButton.classList.add(
        "correct"
      );

      $("#battleMessage")
        .textContent =
          "RECOVERED!";

      currentIndex++;

      saveStats();
      renderStats();

      setTimeout(() => {
        if (
          currentIndex >=
          quizWords.length
        ) {
          finishQuiz();
        } else {
          nextQuestion();
        }
      }, 850);

      return;
    }

    playWrongSound();

    clickedButton.classList.add(
      "wrong"
    );

    streak = 0;

    if ($("#battleMessage")) {
      $("#battleMessage")
        .textContent =
          `MISS!  正解：${current.jp}`;
    }

    currentIndex++;

    saveStats();
    renderStats();

    setTimeout(() => {
      if (
        currentIndex >=
        quizWords.length
      ) {
        finishQuiz();
      } else {
        nextQuestion();
      }
    }, 850);

    return;
  }

  /* =======================================================
     CORRECT
     ======================================================= */

  playCorrectSound();

  correctCount++;
  totalCorrect++;

  quizScore += 100;
  streak++;
  stageHit++;

  if ($("#quizScore")) {
    $("#quizScore")
      .textContent =
        quizScore;
  }

  if ($("#hitCount")) {
    $("#hitCount")
      .textContent =
        stageHit;
  }

  if ($("#battleMessage")) {
    $("#battleMessage")
      .textContent =
        "HIT!";
  }

  setTimeout(() => {
    playSwordSound();
  }, 80);

  setTimeout(() => {
    playHitSound();
  }, 230);

  startAttackAnimation();

  currentIndex++;

  updateEnemyHp();

  saveStats();
  saveGameData();

  setTimeout(() => {
    if (
      stageHit >=
      stages[currentStage]
        .maxHits
    ) {
      defeatCurrentEnemy();

      return;
    }

    if (
      currentIndex >=
      quizWords.length
    ) {
      finishQuiz();

      return;
    }

    nextQuestion();
  }, 850);
}

/* =========================================================
   ENEMY DEFEAT
   ========================================================= */

function defeatCurrentEnemy() {
  const defeatedStage =
    currentStage;

  const stage =
    stages[
      defeatedStage
    ];

  playDefeatSound();

  /*
    図鑑登録
  */

  registerMonster(
    stage.monsterId
  );

  if ($("#battleMessage")) {
    $("#battleMessage")
      .textContent =
        stage.boss
          ? "ASTRAL DRAGON DEFEATED!"
          : `${stage.name} DEFEATED!`;
  }

  startDefeatAnimation();

  setTimeout(() => {
    if (
      currentIndex >=
      quizWords.length
    ) {
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

/* =========================================================
   RESULT
   ========================================================= */

function finishQuiz() {
  answerLocked = true;

  stopBGM();

  playResultSound();

  if (
    $("#questionProgress")
  ) {
    $("#questionProgress")
      .style.width =
        "100%";
  }

  if (
    quizScore >
    bestScore
  ) {
    bestScore =
      quizScore;
  }

  saveStats();
  saveGameData();

  renderStats();

  if ($("#resultScore")) {
    $("#resultScore")
      .textContent =
        quizScore;
  }

  if ($("#resultCorrect")) {
    $("#resultCorrect")
      .textContent =
        `${correctCount} / 10`;
  }

  if ($("#resultBest")) {
    $("#resultBest")
      .textContent =
        bestScore;
  }

  if ($("#resultTitle")) {
    $("#resultTitle")
      .textContent =
        correctCount === 10
          ? "PERFECT CLEAR"
          : "QUEST COMPLETE";
  }

  showScreen(
    "resultScreen"
  );
}

/* =========================================================
   BATTLE CANVAS
   ========================================================= */

const canvas =
  $("#battleCanvas");

const ctx =
  canvas
    ? canvas.getContext("2d")
    : null;

if (ctx) {
  ctx.imageSmoothingEnabled =
    false;
}

function resetBattleAnimation() {
  battleState.attack = 0;
  battleState.flashUntil = 0;
  battleState.damageUntil = 0;
  battleState.defeat = 0;
  battleState.particles = [];

  if (
    !animationId
  ) {
    animationLoop();
  }
}

function startAttackAnimation() {
  battleState.attack = 1;

  battleState.flashUntil =
    performance.now() +
    180;

  battleState.damageUntil =
    performance.now() +
    650;

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

function spawnParticles(
  x,
  y,
  count
) {
  const colors = [
    "#f0b76a",
    "#d66c93",
    "#78a6c6",
    "#e7d28a",
    "#a18ac2"
  ];

  for (
    let i = 0;
    i < count;
    i++
  ) {
    battleState.particles.push({
      x,
      y,

      vx:
        (Math.random() - .5) *
        2.8,

      vy:
        -Math.random() *
          3 -
        .5,

      size:
        Math.random() > .7
          ? 3
          : 2,

      life:
        35 +
        Math.random() * 35,

      color:
        colors[
          Math.floor(
            Math.random() *
            colors.length
          )
        ]
    });
  }
}

function animationLoop(
  time =
    performance.now()
) {
  // 攻撃中は毎フレーム進行させる。
  // これがないと attack が 1 のまま固定され、
  // drawHero() の swordPhase が常に 0 になって
  // 剣が振り下ろされない。
  if (battleState.attack > 0) {
    battleState.attack =
      Math.max(
        0,
        battleState.attack - 0.055
      );
  }

  if (ctx) {
    drawBattle(time);
  }

  animationId =
    requestAnimationFrame(
      animationLoop
    );
}

/* =========================================================
   PIXEL HELPERS
   ========================================================= */

function rect(
  x,
  y,
  w,
  h,
  color
) {
  if (!ctx) return;

  ctx.fillStyle =
    color;

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
  if (!ctx) return;

  ctx.save();

  ctx.font =
    `bold ${size}px monospace`;

  ctx.textAlign =
    align;

  ctx.textBaseline =
    "middle";

  ctx.fillStyle =
    "#161627";

  ctx.fillText(
    text,
    x + 1,
    y + 1
  );

  ctx.fillStyle =
    color;

  ctx.fillText(
    text,
    x,
    y
  );

  ctx.restore();
}

/* =========================================================
   BATTLE DRAW
   ========================================================= */

function drawBattle(time) {
  if (!ctx || !canvas) {
    return;
  }

  const w =
    canvas.width;

  const h =
    canvas.height;

  /* SKY */

  rect(
    0,
    0,
    w,
    h,
    "#667da2"
  );

  rect(
    0,
    0,
    w,
    50,
    "#9baac1"
  );

  rect(
    0,
    50,
    w,
    40,
    "#738baa"
  );

  rect(
    0,
    90,
    w,
    40,
    "#526b83"
  );

  /* distant */

  rect(
    0,
    28,
    110,
    2,
    "#c5ced8"
  );

  rect(
    40,
    35,
    80,
    2,
    "#b6c3d2"
  );

  rect(
    205,
    42,
    70,
    2,
    "#b8c5d3"
  );

  /* DITHER */

  for (
    let x = 0;
    x < w;
    x += 8
  ) {
    for (
      let y = 95;
      y < 132;
      y += 8
    ) {
      if (
        (x + y) % 16 ===
        0
      ) {
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

  rect(
    250,
    18,
    22,
    22,
    "#e5dfc9"
  );

  rect(
    254,
    14,
    14,
    4,
    "#e5dfc9"
  );

  rect(
    246,
    22,
    4,
    14,
    "#e5dfc9"
  );

  rect(
    264,
    21,
    4,
    5,
    "#d2cdbb"
  );

  /* GROUND */

  rect(
    0,
    130,
    w,
    50,
    "#343950"
  );

  rect(
    0,
    130,
    w,
    4,
    "#222638"
  );

  for (
    let x = 0;
    x < w;
    x += 16
  ) {
    rect(
      x,
      140 +
        ((x / 16) % 2) *
          3,
      8,
      2,
      "#4a4e66"
    );
  }

  drawHero(time);

  drawEnemy(time);

  drawParticles();

  drawDamage(time);

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

  /*
    ボス時のWARNING表示
  */

  if (
    stages[currentStage] &&
    stages[currentStage].boss
  ) {
    pixelText(
      "BOSS",
      160,
      24,
      8,
      "#f2c36f",
      "center"
    );
  }
}

/* =========================================================
   HERO
   ========================================================= */

function drawHero(time) {
  const attack =
    battleState.attack;

  // 戦闘中の待機アニメーションは2フレーム。
  // 約0.28秒ごとに上下へ2px動かして、
  // プレイヤー自身も常時「2枚絵」で動いて見えるようにする。
  const idleFrame =
    Math.floor(time / 280) % 2;

  const idleBob =
    idleFrame === 0 ? 0 : 2;

  let swordPhase = 0;

  if (attack > 0) {
    const elapsed =
      1 - attack;

    swordPhase =
      Math.min(
        1,
        elapsed * 1.9
      );
  }

  const x = 58;
  const y = 83 + idleBob;

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

  /* ARM */

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

  drawSword(
    x + 24,
    y + 13,
    swordPhase
  );
}

/* =========================================================
   SWORD
   ========================================================= */

function drawSword(
  handX,
  handY,
  phase
) {
  let tipX;
  let tipY;

  if (phase <= 0) {
    tipX =
      handX + 29;

    tipY =
      handY - 27;

  } else if (phase < .45) {
    const t =
      phase / .45;

    tipX =
      handX +
      29 +
      t * 18;

    tipY =
      handY -
      27 -
      t * 11;

  } else {
    const t =
      (phase - .45) /
      .55;

    tipX =
      handX +
      47 -
      t * 5;

    tipY =
      handY -
      38 +
      t * 47;
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

  /* BLADE */

  const dx =
    tipX - handX;

  const dy =
    tipY - handY;

  const length =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  const nx =
    -dy / length;

  const ny =
    dx / length;

  const width = 4;

  ctx.beginPath();

  ctx.moveTo(
    handX +
      nx * width,
    handY +
      ny * width
  );

  ctx.lineTo(
    tipX + nx,
    tipY + ny
  );

  ctx.lineTo(
    tipX - nx,
    tipY - ny
  );

  ctx.lineTo(
    handX -
      nx * width,
    handY -
      ny * width
  );

  ctx.closePath();

  ctx.fillStyle =
    "#e8e5dc";

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
    tipX - nx,
    tipY - ny
  );

  ctx.lineTo(
    handX,
    handY
  );

  ctx.closePath();

  ctx.fillStyle =
    "#aaa9b1";

  ctx.fill();

  /* ATTACK ARC */

  if (phase > .1) {
    const alpha =
      Math.max(
        0,
        1 -
          Math.abs(
            phase - .7
          ) * 2
      );

    ctx.save();

    ctx.globalAlpha =
      alpha * .7;

    ctx.strokeStyle =
      "#f1d3dc";

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

/* =========================================================
   ENEMY
   ========================================================= */

function drawEnemy(time) {
  const stage =
    stages[currentStage];

  // モンスターも2フレームの待機モーション。
  // 0.28秒ごとに上下へ2px移動して、
  // START QUEST中も常にアニメーションする。
  const idleFrame =
    Math.floor(time / 280) % 2;

  const idleBob =
    idleFrame === 0 ? 0 : 2;

  if (!stage) return;

  let alpha = 1;
  let scale = 1;

  if (
    battleState.defeat > 0
  ) {
    const elapsed =
      1 -
      battleState.defeat;

    alpha =
      Math.max(
        0,
        elapsed
      );

    scale =
      .55 +
      elapsed * .45;
  }

  ctx.save();

  ctx.globalAlpha =
    alpha;

  if (
    stage.type ===
    "slime"
  ) {
    drawSlime(
      235,
      83 + idleBob,
      scale
    );
  }

  if (
    stage.type ===
    "bat"
  ) {
    drawBat(
      235,
      76 + idleBob,
      scale,
      time
    );
  }

  if (
    stage.type ===
    "dragon"
  ) {
    drawDragon(
      235,
      72 + idleBob,
      scale
    );
  }

  /*
    追加モンスター
    今後のステージ追加用
  */

  if (
    stage.type ===
    "mandraga"
  ) {
    drawMandraga(
      235,
      82 + idleBob,
      scale
    );
  }

  if (
    stage.type ===
    "wolf"
  ) {
    drawWolf(
      235,
      84 + idleBob,
      scale
    );
  }

  if (
    stage.type ===
    "phantom"
  ) {
    drawPhantom(
      235,
      78 + idleBob,
      scale
    );
  }

  if (
    stage.type ===
    "golem"
  ) {
    drawGolem(
      235,
      76 + idleBob,
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

    ctx.globalAlpha =
      .72;

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

/* =========================================================
   SLIME
   ========================================================= */

function drawSlime(
  x,
  y,
  scale
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.scale(
    scale,
    scale
  );

  rect(
    -27,
    37,
    54,
    5,
    "#202337"
  );

  rect(
    -24,
    -25,
    48,
    55,
    "#30294b"
  );

  rect(
    -29,
    -10,
    58,
    35,
    "#30294b"
  );

  rect(
    -20,
    -20,
    40,
    44,
    "#8a6095"
  );

  rect(
    -24,
    -6,
    48,
    26,
    "#8a6095"
  );

  rect(
    -15,
    -16,
    12,
    5,
    "#b893b0"
  );

  rect(
    -20,
    -10,
    5,
    14,
    "#b893b0"
  );

  rect(
    -12,
    -2,
    7,
    10,
    "#262438"
  );

  rect(
    6,
    -2,
    7,
    10,
    "#262438"
  );

  rect(
    -10,
    0,
    3,
    3,
    "#e8d8dc"
  );

  rect(
    8,
    0,
    3,
    3,
    "#e8d8dc"
  );

  rect(
    -4,
    12,
    9,
    3,
    "#3a2d45"
  );

  rect(
    12,
    -30,
    6,
    10,
    "#d6a95e"
  );

  rect(
    9,
    -25,
    12,
    4,
    "#d6a95e"
  );

  ctx.restore();
}

/* =========================================================
   BAT
   ========================================================= */

function drawBat(
  x,
  y,
  scale,
  time
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.scale(
    scale,
    scale
  );

  const flap =
    Math.sin(
      time / 100
    ) * 4;

  rect(
    -25,
    31,
    50,
    4,
    "#202337"
  );

  rect(
    -40,
    -4 + flap,
    16,
    28,
    "#37334f"
  );

  rect(
    -35,
    -12 + flap,
    10,
    12,
    "#4f4a6d"
  );

  rect(
    24,
    -4 - flap,
    16,
    28,
    "#37334f"
  );

  rect(
    25,
    -12 - flap,
    10,
    12,
    "#4f4a6d"
  );

  rect(
    -15,
    -18,
    30,
    44,
    "#5a4a71"
  );

  rect(
    -11,
    -22,
    22,
    8,
    "#6e5c82"
  );

  rect(
    -13,
    -29,
    8,
    11,
    "#493b61"
  );

  rect(
    5,
    -29,
    8,
    11,
    "#493b61"
  );

  rect(
    -9,
    -8,
    5,
    7,
    "#d78392"
  );

  rect(
    4,
    -8,
    5,
    7,
    "#d78392"
  );

  rect(
    -8,
    -7,
    2,
    2,
    "#f4d4c8"
  );

  rect(
    5,
    -7,
    2,
    2,
    "#f4d4c8"
  );

  rect(
    -7,
    12,
    4,
    8,
    "#d9d1cf"
  );

  rect(
    3,
    12,
    4,
    8,
    "#d9d1cf"
  );

  ctx.restore();
}

/* =========================================================
   EXTRA MONSTERS
   ========================================================= */

function drawMandraga(
  x,
  y,
  scale
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.scale(
    scale,
    scale
  );

  rect(
    -25,
    35,
    50,
    5,
    "#202337"
  );

  rect(
    -18,
    -25,
    36,
    58,
    "#4d674d"
  );

  rect(
    -28,
    -10,
    56,
    28,
    "#5d7c56"
  );

  rect(
    -10,
    -35,
    8,
    18,
    "#78925d"
  );

  rect(
    2,
    -38,
    8,
    20,
    "#78925d"
  );

  rect(
    -13,
    -3,
    7,
    9,
    "#252738"
  );

  rect(
    6,
    -3,
    7,
    9,
    "#252738"
  );

  rect(
    -8,
    11,
    18,
    4,
    "#312c35"
  );

  ctx.restore();
}

function drawWolf(
  x,
  y,
  scale
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.scale(
    scale,
    scale
  );

  rect(
    -35,
    32,
    70,
    5,
    "#202337"
  );

  rect(
    -28,
    -10,
    48,
    38,
    "#4c5369"
  );

  rect(
    -20,
    -27,
    32,
    25,
    "#5d647b"
  );

  rect(
    -24,
    -36,
    10,
    18,
    "#383e54"
  );

  rect(
    4,
    -36,
    10,
    18,
    "#383e54"
  );

  rect(
    -14,
    -15,
    6,
    7,
    "#e0b66e"
  );

  rect(
    5,
    -15,
    6,
    7,
    "#e0b66e"
  );

  rect(
    -5,
    2,
    10,
    5,
    "#282938"
  );

  ctx.restore();
}

function drawPhantom(
  x,
  y,
  scale
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.scale(
    scale,
    scale
  );

  rect(
    -27,
    35,
    54,
    5,
    "#202337"
  );

  rect(
    -23,
    -30,
    46,
    60,
    "#69628d"
  );

  rect(
    -29,
    -12,
    58,
    30,
    "#756b9a"
  );

  rect(
    -15,
    -20,
    8,
    10,
    "#e7d79e"
  );

  rect(
    7,
    -20,
    8,
    10,
    "#e7d79e"
  );

  rect(
    -11,
    5,
    22,
    4,
    "#312b40"
  );

  ctx.restore();
}

function drawGolem(
  x,
  y,
  scale
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.scale(
    scale,
    scale
  );

  rect(
    -35,
    42,
    70,
    6,
    "#202337"
  );

  rect(
    -28,
    -30,
    56,
    72,
    "#626777"
  );

  rect(
    -35,
    -10,
    70,
    40,
    "#727787"
  );

  rect(
    -20,
    -45,
    40,
    20,
    "#515563"
  );

  rect(
    -15,
    -10,
    8,
    8,
    "#d69a61"
  );

  rect(
    7,
    -10,
    8,
    8,
    "#d69a61"
  );

  rect(
    -10,
    10,
    20,
    5,
    "#363947"
  );

  ctx.restore();
}

/* =========================================================
   DRAGON
   ========================================================= */

function drawDragon(
  x,
  y,
  scale
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.scale(
    scale,
    scale
  );

  rect(
    -43,
    50,
    86,
    6,
    "#1d2030"
  );

  rect(
    -45,
    -34,
    16,
    45,
    "#403b67"
  );

  rect(
    -40,
    -45,
    10,
    20,
    "#514b7b"
  );

  rect(
    -30,
    -30,
    10,
    34,
    "#514b7b"
  );

  rect(
    29,
    -34,
    16,
    45,
    "#403b67"
  );

  rect(
    30,
    -45,
    10,
    20,
    "#514b7b"
  );

  rect(
    20,
    -30,
    10,
    34,
    "#514b7b"
  );

  rect(
    -17,
    -37,
    34,
    57,
    "#57486d"
  );

  rect(
    -12,
    -45,
    24,
    14,
    "#705978"
  );

  rect(
    -28,
    -55,
    56,
    30,
    "#453b61"
  );

  rect(
    -34,
    -46,
    68,
    22,
    "#453b61"
  );

  rect(
    -25,
    -67,
    9,
    16,
    "#d0a765"
  );

  rect(
    16,
    -67,
    9,
    16,
    "#d0a765"
  );

  rect(
    -28,
    -63,
    7,
    7,
    "#b98b50"
  );

  rect(
    21,
    -63,
    7,
    7,
    "#b98b50"
  );

  rect(
    -17,
    -29,
    34,
    18,
    "#645073"
  );

  rect(
    -18,
    -43,
    9,
    7,
    "#d58b82"
  );

  rect(
    9,
    -43,
    9,
    7,
    "#d58b82"
  );

  rect(
    -16,
    -42,
    4,
    3,
    "#f3d8bd"
  );

  rect(
    11,
    -42,
    4,
    3,
    "#f3d8bd"
  );

  rect(
    -12,
    -17,
    24,
    5,
    "#252335"
  );

  rect(
    -9,
    -12,
    4,
    6,
    "#ded5c8"
  );

  rect(
    5,
    -12,
    4,
    6,
    "#ded5c8"
  );

  rect(
    -25,
    3,
    50,
    37,
    "#514365"
  );

  rect(
    -19,
    8,
    38,
    26,
    "#6b5575"
  );

  rect(
    -5,
    9,
    10,
    10,
    "#c17b91"
  );

  rect(
    -3,
    7,
    6,
    14,
    "#d29aad"
  );

  rect(
    -29,
    32,
    11,
    13,
    "#302c42"
  );

  rect(
    18,
    32,
    11,
    13,
    "#302c42"
  );

  ctx.restore();
}

/* =========================================================
   PARTICLES
   ========================================================= */

function drawParticles() {
  const particles =
    battleState.particles;

  for (
    let i =
      particles.length - 1;
    i >= 0;
    i--
  ) {
    const p =
      particles[i];

    p.x += p.vx;
    p.y += p.vy;

    p.vy += .08;

    ctx.globalAlpha =
      Math.max(
        0,
        p.life / 50
      );

    rect(
      p.x,
      p.y,
      p.size,
      p.size,
      p.color
    );

    p.life--;

    if (
      p.life <= 0
    ) {
      particles.splice(
        i,
        1
      );
    }
  }

  ctx.globalAlpha = 1;
}

/* =========================================================
   DAMAGE
   ========================================================= */

function drawDamage(time) {
  if (
    battleState.damageUntil <
    time
  ) {
    return;
  }

  const remain =
    battleState.damageUntil -
    time;

  const progress =
    1 -
    remain / 650;

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
  playButtonSound();

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

/* =========================================================
   EVENTS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadData();

    renderStats();

    /*
      追加画面を生成
    */

    createExtraScreens();
    createExtraNavigation();

    /* navigation */

    document
      .querySelectorAll(
        "[data-screen]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            playButtonSound();

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

    if ($("#addWordBtn")) {
      $("#addWordBtn")
        .addEventListener(
          "click",
          addWord
        );
    }

    if ($("#englishInput")) {
      $("#englishInput")
        .addEventListener(
          "keydown",
          event => {
            if (
              event.key ===
              "Enter"
            ) {
              addWord();
            }
          }
        );
    }

    if ($("#japaneseInput")) {
      $("#japaneseInput")
        .addEventListener(
          "keydown",
          event => {
            if (
              event.key ===
              "Enter"
            ) {
              addWord();
            }
          }
        );
    }

    /* quest */

    if ($("#startQuestBtn")) {
      $("#startQuestBtn")
        .addEventListener(
          "click",
          startQuest
        );
    }

    /* score */

    if ($("#resetScoreBtn")) {
      $("#resetScoreBtn")
        .addEventListener(
          "click",
          resetScore
        );
    }

    /* flashcard */

    if ($("#flashcard")) {
      $("#flashcard")
        .addEventListener(
          "click",
          flipFlashcard
        );
    }

    if ($("#nextCardBtn")) {
      $("#nextCardBtn")
        .addEventListener(
          "click",
          nextCard
        );
    }

    if ($("#prevCardBtn")) {
      $("#prevCardBtn")
        .addEventListener(
          "click",
          previousCard
        );
    }

    /* CSV */

    if ($("#exportCsvBtn")) {
      $("#exportCsvBtn")
        .addEventListener(
          "click",
          exportCSV
        );
    }

    if ($("#importCsvBtn")) {
      $("#importCsvBtn")
        .addEventListener(
          "click",
          () => {
            playButtonSound();

            $("#csvFileInput")
              .click();
          }
        );
    }

    if ($("#csvFileInput")) {
      $("#csvFileInput")
        .addEventListener(
          "change",
          event => {
            const file =
              event.target
                .files[0];

            importCSV(file);

            event.target.value =
              "";
          }
        );
    }

    /* result */

    if ($("#resultHomeBtn")) {
      $("#resultHomeBtn")
        .addEventListener(
          "click",
          () => {
            playButtonSound();

            answerLocked = true;

            showScreen(
              "homeScreen"
            );
          }
        );
    }

    /* start canvas */

    resetBattleAnimation();
  }
);
