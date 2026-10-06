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
  totalCorrect: "pixelEnglishTotalCorrect",
  weakWords: "pixelEnglishWeakWords",
  questRuns: "pixelEnglishQuestRuns",
  clearedStages: "pixelEnglishClearedStages"
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
    activeStages[currentStage];

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
  },
  {
    id: "void-emperor",
    name: "VOID EMPEROR",
    type: "dragon",
    description: "世界の終焉を呼び寄せる、虚無を統べる最後の魔王。",
    rarity: "FINAL BOSS",
    boss: true
  }
];

function renderStageRoute() {
  // ステージ内の「1 / 2 / 3」ルート表示は廃止。
  const route = $("#stageRoute");
  if (route) route.remove();
}

function registerMonsterEncounter(monsterId) {
  if (!monsterId) return;
  if (!monsterBook[monsterId]) {
    monsterBook[monsterId] = { defeated: 0, encountered: 0, discoveredAt: getDateKey() };
  }
  monsterBook[monsterId].encountered = (monsterBook[monsterId].encountered || 0) + 1;
  saveGameData();
}

/* =========================================================
   STAGES
   ========================================================= */

const stages = [
  { id:"grassland", name:"GRASSLAND", jp:"草原", theme:"grassland", description:"風に揺れる草原。旅の始まりとなる最初のエリア。", enemies:["moon-slime","night-wolf"], boss:"astral-dragon" },
  { id:"forest", name:"FOREST", jp:"森林", theme:"forest", description:"深い森の奥へ。木々の間から古代の魔物が姿を現す。", enemies:["forest-mandraga","shadow-bat"], boss:"astral-dragon" },
  { id:"beach", name:"BEACH", jp:"砂浜", theme:"beach", description:"青い海と白い砂浜。潮騒の向こうに魔物が潜む。", enemies:["shadow-bat","moon-slime"], boss:"astral-dragon" },
  { id:"volcano", name:"VOLCANO", jp:"火山", theme:"volcano", description:"灼熱の大地。溶岩が流れる火口へ進め。", enemies:["night-wolf","iron-golem"], boss:"astral-dragon" },
  { id:"snowfield", name:"SNOWFIELD", jp:"雪原", theme:"snowfield", description:"吹雪に閉ざされた白銀の世界。亡霊の気配が漂う。", enemies:["phantom","night-wolf"], boss:"astral-dragon" },
  { id:"ruins", name:"ANCIENT RUINS", jp:"遺跡", theme:"ruins", description:"世界の秘密が眠る古代遺跡。最後の魔王との決戦の地。", enemies:["iron-golem","phantom"], boss:"void-emperor", final:true }
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
let studyStreak = 0;
let weakWords = {};
let questRuns = 0;
let activeStages = [];
let selectedStageIndex = 0;
let clearedStages = {};

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

    weakWords =
      JSON.parse(
        localStorage.getItem(
          STORAGE.weakWords
        ) || "{}"
      );

    if (!weakWords || typeof weakWords !== "object") {
      weakWords = {};
    }

    questRuns =
      Number(
        localStorage.getItem(
          STORAGE.questRuns
        )
      ) || 0;

    clearedStages = JSON.parse(
      localStorage.getItem(STORAGE.clearedStages) || "{}"
    );
    if (!clearedStages || typeof clearedStages !== "object") {
      clearedStages = {};
    }

    studyStreak = getStudyStreak();

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
    weakWords = {};
    questRuns = 0;
    studyStreak = 0;
    clearedStages = {};
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

  localStorage.setItem(
    STORAGE.weakWords,
    JSON.stringify(weakWords)
  );

  localStorage.setItem(
    STORAGE.questRuns,
    String(questRuns)
  );

  localStorage.setItem(
    STORAGE.clearedStages,
    JSON.stringify(clearedStages)
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
  const today = getDateKey();

  if (!calendarData[today]) {
    calendarData[today] = { played: true };
  }

  updateStudyStreak();

  saveGameData();
  saveStats();
}

function getStudyStreak() {
  let count = 0;
  const date = new Date();

  while (true) {
    const key = getDateKey(date);

    if (!calendarData[key]) break;

    count++;
    date.setDate(date.getDate() - 1);
  }

  return count;
}

function updateStudyStreak() {
  studyStreak = getStudyStreak();

  // 7日、14日、21日…の連続学習で1個ずつ獲得。
  const rewardCount = Math.floor(studyStreak / 7);
  const rewardKey = `reward-${studyStreak - (studyStreak % 7)}`;
  const claimed = localStorage.getItem("pixelEnglishRewardClaim") || "";

  if (rewardCount > 0 && claimed !== rewardKey) {
    items.recovery += 1;
    localStorage.setItem("pixelEnglishRewardClaim", rewardKey);
    showToast("7日連続学習達成！\nリカバリーエリクサーを獲得！");
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
      encountered: 1,
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
  if (id !== "monsterBookScreen" && id !== "calendarScreen") {
    closeExtraModal();
  }
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
  if (document.getElementById("monsterBookScreen")) return;

  const style = document.createElement("style");
  style.textContent = `
    .extra-modal {
      position: fixed !important;
      inset: 0;
      z-index: 200;
      display: none;
      align-items: center;
      justify-content: center;
      padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
      background: rgba(24, 22, 38, .72);
      backdrop-filter: blur(4px);
    }
    .extra-modal.active { display: flex !important; }
    .extra-modal-panel {
      width: min(920px, 100%);
      max-height: min(88vh, 820px);
      overflow: auto;
      padding: 22px;
      background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(239,235,244,.98));
      border: 1px solid #cfc5db;
      box-shadow: 0 24px 60px rgba(20,18,35,.35), inset 0 1px 0 #fff;
      border-radius: 8px;
      position: relative;
    }
    .extra-modal-head { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:16px; }
    .extra-modal-title { margin:0; font-size:22px; letter-spacing:.08em; color:#393452; }
    .extra-modal-sub { color:#8a8492; font-size:10px; letter-spacing:.12em; }
    .extra-close { padding:8px 10px; color:#5c5470; background:transparent; border:1px solid #d4cedb; font-size:10px; font-weight:800; letter-spacing:.08em; }
    .extra-close:hover { color:#d85c91; border-color:#c99ab0; }
    .monster-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .monster-card { padding:12px; background:rgba(255,255,255,.76); border:1px solid #ddd7e3; box-shadow:0 6px 14px rgba(52,42,75,.06); }
    .monster-card.locked { filter:saturate(.15); opacity:.62; }
    .monster-sprite { position:relative; height:145px; margin-bottom:8px; overflow:hidden; background:radial-gradient(circle at center, rgba(111,94,153,.12), transparent 65%); border:1px solid #e1dce6; }
    .monster-frame { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; image-rendering:pixelated; image-rendering:crisp-edges; opacity:0; animation:monsterBookIdle 1.1s steps(1,end) infinite; }
    .monster-frame-a { animation-delay:0s; }
    .monster-frame-b { animation-delay:.55s; }
    @keyframes monsterBookIdle { 0%,49.99%{opacity:1} 50%,100%{opacity:0} }
    .monster-name { font-weight:800; letter-spacing:.07em; color:#393452; margin-bottom:5px; }
    .monster-meta { color:#8a8492; font-size:10px; letter-spacing:.05em; margin-bottom:7px; }
    .monster-description { color:#706a79; font-size:11px; line-height:1.6; min-height:35px; }
    .calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:5px; }
    .calendar-weekday,.calendar-day { text-align:center; font-size:10px; padding:7px 2px; }
    .calendar-weekday { color:#8b8494; font-weight:800; }
    .calendar-day { min-height:42px; background:rgba(255,255,255,.76); border:1px solid #e1dce6; border-radius:4px; }
    .calendar-day.played { background:#e6f0ea; border-color:#9bbda9; color:#45634f; font-weight:800; }
    .calendar-day.today { outline:2px solid #d3a05d; outline-offset:-2px; }
    .calendar-day.empty { background:transparent; border-color:transparent; }
    .calendar-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .calendar-head button { width:34px; height:30px; color:#4d4760; background:#f5f2f7; border:1px solid #d7d1df; }
    .reward-box { display:flex; align-items:center; gap:14px; padding:13px; margin-bottom:14px; background:#fffaf1; border:1px solid #e1c991; }
    .reward-icon { font-size:27px; }
    .reward-copy strong { display:block; color:#4c4268; letter-spacing:.05em; }
    .reward-copy small { display:block; margin-top:4px; color:#8a8492; }
    .stage-route { display:flex; gap:5px; margin:0 0 10px; }
    .stage-node { flex:1; padding:5px 4px; text-align:center; border:1px solid #d7d1df; background:#f6f3f7; color:#817a8b; font:800 8px/1.2 monospace; letter-spacing:.04em; }
    .stage-node.current { color:#fff; background:#60537f; border-color:#4c4268; }
    .stage-node.cleared { color:#52665a; background:#e5efe9; border-color:#9db7a7; }
    .question-weak-action { display:block; margin:8px auto 0; padding:6px 10px; color:#777184; background:transparent; border:1px solid #d8d2df; font-size:10px; font-weight:800; letter-spacing:.06em; }
    .question-weak-action.is-weak { color:#a24d70; border-color:#d89ab1; background:#fff2f6; }
    .word-item-actions { display:flex; align-items:center; gap:8px; }
    .weak-word { color:#8a7180; background:transparent; font-size:9px; font-weight:800; }
    .weak-word.active { color:#a24d70; }
    #extraNavigation .action-btn { min-height:70px; }
    @media(max-width:760px){ .monster-grid{grid-template-columns:repeat(2,minmax(0,1fr));} .extra-modal{padding:10px;} .extra-modal-panel{max-height:92vh;padding:16px;} }
    @media(max-width:480px){ .monster-grid{grid-template-columns:1fr 1fr;} .monster-sprite{height:115px;} .extra-modal-head{align-items:flex-start;} .extra-modal-title{font-size:18px;} }
  `;
  document.head.appendChild(style);

  const monsterScreen = document.createElement("section");
  monsterScreen.id = "monsterBookScreen";
  monsterScreen.className = "screen extra-modal";
  monsterScreen.innerHTML = `
    <div class="extra-modal-panel">
      <div class="extra-modal-head">
        <div><div class="extra-modal-sub">DATABASE / ENCOUNTERED MONSTERS</div><h2 class="extra-modal-title">MONSTER CODEX</h2></div>
        <button class="extra-close" data-extra-close>CLOSE ×</button>
      </div>
      <div class="extra-panel" style="margin-bottom:12px"><strong id="monsterBookCount">0 / ${MONSTERS.length}</strong><span style="margin-left:8px;color:#8a8492;font-size:11px">DISCOVERED</span></div>
      <div id="monsterBookList" class="monster-grid"></div>
    </div>`;

  const calendarScreen = document.createElement("section");
  calendarScreen.id = "calendarScreen";
  calendarScreen.className = "screen extra-modal";
  calendarScreen.innerHTML = `
    <div class="extra-modal-panel">
      <div class="extra-modal-head">
        <div><div class="extra-modal-sub">DAILY TRAINING RECORD</div><h2 class="extra-modal-title">STUDY CALENDAR</h2></div>
        <button class="extra-close" data-extra-close>CLOSE ×</button>
      </div>
      <div class="reward-box"><div class="reward-icon">✦</div><div class="reward-copy"><strong id="recoveryCount">RECOVERY ELIXIR ×0</strong><small id="rewardMessage">7日連続学習でアイテムを獲得！</small></div></div>
      <div class="extra-panel">
        <div class="calendar-head"><button id="calendarPrev">◀</button><strong id="calendarTitle"></strong><button id="calendarNext">▶</button></div>
        <div id="calendarGrid" class="calendar-grid"></div>
      </div>
    </div>`;

  document.body.appendChild(monsterScreen);
  document.body.appendChild(calendarScreen);

  document.querySelectorAll("[data-extra-close]").forEach(button => {
    button.addEventListener("click", () => { playButtonSound(); closeExtraModal(); });
  });

  [monsterScreen, calendarScreen].forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeExtraModal();
    });
  });

  $("#calendarPrev").addEventListener("click", () => {
    playButtonSound();
    calendarViewMonth--;
    if (calendarViewMonth < 0) { calendarViewMonth = 11; calendarViewYear--; }
    renderCalendar();
  });

  $("#calendarNext").addEventListener("click", () => {
    playButtonSound();
    calendarViewMonth++;
    if (calendarViewMonth > 11) { calendarViewMonth = 0; calendarViewYear++; }
    renderCalendar();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeExtraModal();
  });
}

function openExtraModal(id) {
  document.body.classList.add("modal-active");
  const modal = $("#" + id);
  if (!modal) return;
  modal.classList.add("active");
  currentScreen = id;
  if (id === "monsterBookScreen") renderMonsterBook();
  if (id === "calendarScreen") renderCalendar();
}

function closeExtraModal() {
  document.querySelectorAll(".extra-modal").forEach(modal => modal.classList.remove("active"));
  document.body.classList.remove("modal-active");
  currentScreen = "homeScreen";
}

/* =========================================================
   STAGE SELECT
   ========================================================= */

function renderStageSelect() {
  const list = $("#stageSelectList");
  if (!list) return;

  list.innerHTML = stages.map((stage, index) => {
    const cleared = !!clearedStages[index];
    const unlocked = index === 0 || !!clearedStages[index - 1];
    const first = MONSTERS.find(m => m.id === stage.enemies[0]);
    const second = MONSTERS.find(m => m.id === stage.enemies[1]);
    const boss = MONSTERS.find(m => m.id === stage.boss);
    const stateClass = cleared ? "cleared" : (unlocked ? "unlocked" : "locked");
    const buttonLabel = cleared ? "REPLAY" : (unlocked ? "START" : "LOCKED");

    return `<article class="stage-select-card ${stateClass}${stage.final ? " final-stage" : ""}">
      <div class="stage-art stage-art-${stage.theme}" aria-hidden="true">
        <span class="stage-art-sun"></span>
        <span class="stage-art-mountain"></span>
        <span class="stage-art-ground"></span>
        <span class="stage-art-detail"></span>
      </div>
      <div class="stage-select-number">${String(index + 1).padStart(2, "0")}</div>
      <div class="stage-select-main">
        <div class="stage-select-kicker">${stage.final ? "FINAL STAGE" : `STAGE ${index + 1}`}${cleared ? " · CLEAR" : ""}</div>
        <h3>${escapeHtml(stage.jp)} <span>${escapeHtml(stage.name)}</span></h3>
        <p>${escapeHtml(stage.description)}</p>
        <div class="stage-enemy-line"><span>${escapeHtml(first?.name || "?")}</span><b>→</b><span>${escapeHtml(second?.name || "?")}</span><b>→</b><span class="boss-label">★ ${escapeHtml(boss?.name || "BOSS")}</span></div>
      </div>
      <button class="stage-start-btn" data-stage-index="${index}" ${unlocked ? "" : "disabled"}>${buttonLabel}</button>
    </article>`;
  }).join("");

  list.querySelectorAll("[data-stage-index]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.stageIndex);
      const unlocked = index === 0 || !!clearedStages[index - 1];
      if (!unlocked) return;
      selectedStageIndex = index;
      playButtonSound();
      startQuest(selectedStageIndex);
    });
  });
}

function openStageSelect() {
  playButtonSound();
  renderStageSelect();
  showScreen("stageSelectScreen");
}

function updateResultActions() {
  const nextBtn = $("#resultNextStageBtn");
  if (!nextBtn) return;
  const nextIndex = selectedStageIndex + 1;
  const hasNext = nextIndex < stages.length;
  const currentIsFinal = !!stages[selectedStageIndex]?.final;
  nextBtn.hidden = !hasNext || currentIsFinal;
  nextBtn.textContent = hasNext && !currentIsFinal ? `NEXT: ${stages[nextIndex].jp}` : "STAGE SELECT";
}

/* =========================================================
   EXTRA NAV BUTTONS
   ========================================================= */

function createExtraNavigation() {
  if (document.getElementById("extraNavigation")) return;
  const home = $("#homeScreen");
  if (!home) return;

  const box = document.createElement("div");
  box.id = "extraNavigation";
  box.className = "dashboard-grid";
  box.style.marginTop = "18px";
  box.innerHTML = `
    <section class="panel">
      <div class="panel-heading"><span class="panel-number">03</span><h3>ADVENTURE DATABASE</h3></div>
      <div class="action-grid">
        <button id="openMonsterBookBtn" class="action-btn"><strong>MONSTER CODEX</strong><small>モンスター図鑑</small></button>
        <button id="openCalendarBtn" class="action-btn"><strong>STUDY CALENDAR</strong><small>学習記録・報酬</small></button>
      </div>
    </section>
    <section class="panel">
      <div class="panel-heading"><span class="panel-number">04</span><h3>TRAINING QUEST</h3></div>
      <button id="weakQuestBtn" class="action-btn quest-btn" style="width:100%"><strong>WEAK QUEST</strong><small>苦手単語を集中攻略</small></button>
    </section>`;
  home.appendChild(box);

  $("#openMonsterBookBtn").addEventListener("click", () => { playButtonSound(); openExtraModal("monsterBookScreen"); });
  $("#openCalendarBtn").addEventListener("click", () => { playButtonSound(); openExtraModal("calendarScreen"); });
  $("#weakQuestBtn").addEventListener("click", () => { playButtonSound(); startWeakQuest(); });
  updateWeakQuizButton();
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
      ? `${monster.rarity}・ENCOUNTERED ×${data.encountered || 1} / DEFEATED ×${data.defeated}`
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
    const remain = Math.max(0, 7 - (studyStreak % 7));
    $("#rewardMessage").textContent =
      studyStreak > 0 && studyStreak % 7 === 0
        ? "7日連続達成！報酬獲得済み！"
        : `現在 ${studyStreak}日連続。あと ${remain}日で報酬！`;
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
            ${getWeakData(word).wrongs ? `・MISS ${getWeakData(word).wrongs}` : ""}
          </span>
        </div>

        <div class="word-item-actions">
          <button
            class="weak-word ${isWeakWord(word) ? "active" : ""}"
            data-weak-index="${index}">
            ${isWeakWord(word) ? "★ WEAK" : "☆ WEAK"}
          </button>
          <button
            class="delete-word"
            data-index="${index}">
            DELETE
          </button>
        </div>
      `;

      list.appendChild(item);
    }
  );

  list
    .querySelectorAll(".weak-word")
    .forEach(button => {
      button.addEventListener("click", () => {
        playButtonSound();
        const index = Number(button.dataset.weakIndex);
        if (!Number.isInteger(index) || !words[index]) return;
        toggleWeakWord(words[index]);
      });
    });

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

function buildStageBattle(stageIndex) {
  const definition = stages[stageIndex];
  if (!definition) return [];

  const normalStages = definition.enemies
    .map(id => MONSTERS.find(monster => monster.id === id))
    .filter(Boolean)
    .map(monster => ({ ...monster, monsterId: monster.id, stageId: definition.id, theme: definition.theme, area: definition.name, areaJp: definition.jp, maxHits: 3 }));

  const boss = MONSTERS.find(monster => monster.id === definition.boss);
  if (boss) {
    normalStages.push({ ...boss, monsterId: boss.id, stageId: definition.id, theme: definition.theme, area: definition.name, areaJp: definition.jp, maxHits: 4, finalBoss: !!definition.final });
  }
  return normalStages;
}

function buildRandomStages() {
  const normalPool = MONSTERS.filter(monster => !monster.boss);
  const shuffled = shuffle(normalPool);
  const first = shuffled[0];
  const second = shuffled[1] || shuffled[0];
  const boss = MONSTERS.find(monster => monster.id === "astral-dragon");
  return [
    { ...first, maxHits: 3 },
    { ...second, maxHits: 3 },
    { ...boss, maxHits: 4 }
  ];
}

function startQuest(stageIndex = selectedStageIndex) {
  const requestedStage = Number.isInteger(stageIndex) ? stageIndex : 0;
  if (requestedStage > 0 && !clearedStages[requestedStage - 1]) {
    showToast("前のステージをクリアすると挑戦できます。");
    return;
  }

  if (words.length < 10) {
    showToast(`クエストには10語以上必要です。現在 ${words.length}語です。`);
    return;
  }

  unlockAudio();
  playStartSound();
  markTodayPlayed();

  quizWords = shuffle(words).slice(0, 10);

  currentIndex = 0;
  currentStage = 0;
  stageHit = 0;
  quizScore = 0;
  correctCount = 0;
  answerLocked = false;

  selectedStageIndex = requestedStage;
  activeStages = buildStageBattle(selectedStageIndex);
  if (activeStages.length !== 3) {
    showToast("ステージデータを読み込めませんでした。");
    return;
  }
  questRuns++;
  saveGameData();

  resetBattleAnimation();
  showScreen("quizScreen");
  setupStage();
  nextQuestion();
}

/* =========================================================
   STAGE
   ========================================================= */

function setupStage() {
  const stage =
    activeStages[currentStage];

  if (!stage) return;

  stageHit = 0;
  registerMonsterEncounter(stage.id);

  if ($("#stageBadge")) {
    const area = stage.areaJp ? `${stage.areaJp} / ${stage.area}` : (stage.area || "QUEST");
    $("#stageBadge").textContent = area;
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
    activeStages[currentStage];

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

  let weakAction = $("#questionWeakAction");
  if (!weakAction) {
    weakAction = document.createElement("button");
    weakAction.id = "questionWeakAction";
    weakAction.className = "question-weak-action";
    const questionBox = document.querySelector(".question-box");
    if (questionBox) questionBox.appendChild(weakAction);
  }
  ensureQuestionWeakButton();

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
   WEAK WORDS
   ========================================================= */

function getWordKey(word) {
  return word.en.trim().toLowerCase();
}

function getWeakData(word) {
  const key = getWordKey(word);
  return weakWords[key] || { marked: false, wrongs: 0 };
}

function isWeakWord(word) {
  const data = getWeakData(word);
  return !!data.marked || data.wrongs > 0;
}

function toggleWeakWord(word) {
  const key = getWordKey(word);
  const data = getWeakData(word);
  weakWords[key] = {
    marked: !data.marked,
    wrongs: data.wrongs || 0
  };
  saveGameData();
  renderWordBook();
  updateWeakQuizButton();
  showToast(weakWords[key].marked ? "苦手単語に登録しました。" : "苦手登録を外しました。");
}

function recordWrongWord(word) {
  const key = getWordKey(word);
  const data = getWeakData(word);
  weakWords[key] = {
    marked: !!data.marked,
    wrongs: (data.wrongs || 0) + 1
  };
  saveGameData();
}

function getWeakCandidates() {
  return words.filter(word => isWeakWord(word));
}

function buildWeakQuizWords() {
  const candidates = shuffle(getWeakCandidates());

  if (!candidates.length) return [];

  const selected = [];
  let index = 0;

  while (selected.length < 10) {
    selected.push(candidates[index % candidates.length]);
    index++;
  }

  return shuffle(selected);
}

function startWeakQuest() {
  const candidates = getWeakCandidates();

  if (!candidates.length) {
    showToast("まだ苦手単語がありません。通常クエストで間違えるか、単語帳から登録してください。");
    return;
  }

  unlockAudio();
  playStartSound();
  markTodayPlayed();

  quizWords = buildWeakQuizWords();
  currentIndex = 0;
  currentStage = 0;
  stageHit = 0;
  quizScore = 0;
  correctCount = 0;
  answerLocked = false;
  activeStages = buildRandomStages();

  resetBattleAnimation();
  showScreen("quizScreen");
  setupStage();
  if ($("#battleMessage")) {
    $("#battleMessage").textContent = "WEAK QUEST — 苦手単語を集中攻略";
  }
  nextQuestion();
}

function updateWeakQuizButton() {
  const button = $("#weakQuestBtn");
  if (!button) return;
  const count = getWeakCandidates().length;
  button.querySelector("small").textContent = `苦手 ${count}語を集中攻略`;
}

function ensureQuestionWeakButton() {
  const box = $("#questionWeakAction");
  const current = quizWords[currentIndex];
  if (!box || !current) return;

  const weak = isWeakWord(current);
  box.textContent = weak ? "★ 苦手登録中" : "☆ 苦手に登録";
  box.classList.toggle("is-weak", weak);
  box.onclick = () => {
    playButtonSound();
    toggleWeakWord(current);
    ensureQuestionWeakButton();
  };
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
    recordWrongWord(current);

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
      activeStages[currentStage]
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
    activeStages[
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
        stage.finalBoss
          ? "VOID EMPEROR DEFEATED!"
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
      activeStages.length - 1
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
    const stageCleared = activeStages.length === 3 && currentStage === 2;
    if (stageCleared) {
      clearedStages[selectedStageIndex] = true;
      saveGameData();
      renderStageSelect();
      updateResultActions();
    }
    $("#resultTitle")
      .textContent = stageCleared
        ? (stages[selectedStageIndex]?.final ? "FINAL STAGE CLEAR" : "STAGE CLEAR")
        : (correctCount === 10 ? "PERFECT CLEAR" : "QUEST COMPLETE");
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

  const currentDefinition = stages[selectedStageIndex] || stages[0];
  drawStageBackground(currentDefinition.theme || currentDefinition.id, time, w, h);

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
    activeStages[currentStage] &&
    activeStages[currentStage].boss
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

function drawStageBackground(theme, time, w, h) {
  // ステージごとにSFC～PS1風の色面・ドット景観を描く。
  if (theme === "grassland") {
    rect(0,0,w,h,"#82a8c4"); rect(0,0,w,72,"#a9c6d7");
    rect(0,70,w,60,"#79a05f"); rect(0,128,w,52,"#4f7045");
    rect(0,128,w,4,"#385437");
    for(let x=0;x<w;x+=18){ rect(x,120-(x%36===0?5:0),10,2,"#b4cf78"); rect(x+5,143+(x%24),4,2,"#6f914f"); }
    rect(246,20,20,20,"#f0dfad"); rect(250,16,12,4,"#f0dfad");
    rect(45,62,60,3,"#6d8f55"); rect(35,68,80,3,"#6d8f55");
  } else if (theme === "forest") {
    rect(0,0,w,h,"#496a70"); rect(0,0,w,70,"#35555d"); rect(0,70,w,62,"#315047"); rect(0,130,w,50,"#243a32");
    for(let x=5;x<w;x+=38){ rect(x,35,12,98,"#263e35"); rect(x-8,42,28,10,"#1f473d"); rect(x-14,55,40,12,"#285548"); rect(x-10,72,32,10,"#32634d"); }
    for(let x=0;x<w;x+=14) rect(x,145+(x%28),8,3,"#3f5e43");
    rect(252,23,16,16,"#d4dfbd");
  } else if (theme === "beach") {
    rect(0,0,w,h,"#67b5d2"); rect(0,0,w,74,"#8bd0df");
    rect(0,74,w,46,"#5aa6bd"); rect(0,120,w,60,"#d7c47e"); rect(0,120,w,5,"#f0df9a");
    for(let x=0;x<w;x+=34){ rect(x,133,18,2,"#c1aa68"); rect(x+12,154,11,2,"#e5d38e"); }
    // 海面の波
    for(let x=-10;x<w;x+=28){ rect(x,88+(x%3)*3,18,2,"#d4eef0"); rect(x+8,94+(x%4),12,2,"#d4eef0"); }
    rect(255,18,22,22,"#f4e4a5");
  } else if (theme === "volcano") {
    rect(0,0,w,h,"#3a3045"); rect(0,0,w,74,"#4b3546"); rect(0,74,w,58,"#6a3b35"); rect(0,130,w,50,"#241e28");
    // 火山と溶岩
    rect(38,72,84,8,"#332832"); rect(52,62,56,12,"#332832"); rect(65,50,30,14,"#332832");
    rect(77,48,6,12,"#e07b3d"); rect(69,58,24,5,"#b64d38");
    for(let x=0;x<w;x+=22) rect(x,142+(x%4)*4,13,3,"#4e3031");
    rect(244,24,18,18,"#d8b3a1");
    for(let i=0;i<5;i++){ const x=170+i*16; const y=28+Math.sin(time/700+i)*6; rect(x,y,5,5,"#9a4b43"); }
  } else if (theme === "snowfield") {
    rect(0,0,w,h,"#9eb8ce"); rect(0,0,w,82,"#c9d9e5"); rect(0,82,w,48,"#a9c5d5"); rect(0,130,w,50,"#e2edf1");
    // 雪山
    rect(28,72,70,4,"#7f9daf"); rect(42,62,40,12,"#7f9daf"); rect(53,52,18,12,"#7f9daf");
    rect(186,72,72,4,"#879fb0"); rect(204,60,40,14,"#879fb0"); rect(218,50,14,12,"#879fb0");
    for(let x=8;x<w;x+=25) rect(x,145+(x%17),2,7,"#ffffff");
    rect(250,22,18,18,"#f6f5e9");
  } else {
    // ANCIENT RUINS / FINAL
    rect(0,0,w,h,"#24233a"); rect(0,0,w,82,"#35334f"); rect(0,82,w,48,"#2a2942"); rect(0,130,w,50,"#181827");
    // 石柱と遺跡
    rect(28,48,20,82,"#5a5365"); rect(23,43,30,8,"#706878"); rect(38,62,7,4,"#3d394b");
    rect(255,42,24,88,"#4d485b"); rect(250,37,34,8,"#6a6272");
    rect(90,102,110,7,"#565064"); rect(104,92,82,10,"#4b4659");
    // 虚無の裂け目
    rect(145,25,30,2,"#8e6aa8"); rect(151,31,18,3,"#b17bc1"); rect(156,39,8,4,"#6e4b8e");
    rect(244,18,16,16,"#9d82b5");
  }

  pixelText(theme === "ruins" ? "ANCIENT RUINS" : theme.toUpperCase(), 9, 10, 7, "#ffffff");
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
    activeStages[currentStage];

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
    if (stage.finalBoss) drawVoidEmperorAura(time);
    drawDragon(
      235,
      72 + idleBob,
      stage.finalBoss ? scale * 1.12 : scale
    );
    if (stage.finalBoss) drawVoidEmperorCrown();
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

function drawVoidEmperorAura(time) {
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 6; i++) {
    const a = time / 700 + i * 1.047;
    const x = 235 + Math.cos(a) * (42 + (i % 2) * 12);
    const y = 72 + Math.sin(a * 1.4) * 34;
    rect(x, y, 5 + (i % 2) * 3, 5 + (i % 3) * 2, i % 2 ? "#8f55aa" : "#5b3d78");
  }
  ctx.globalAlpha = 0.35;
  rect(184, 32, 102, 86, "#2b173e");
  ctx.restore();
}

function drawVoidEmperorCrown() {
  ctx.save();
  ctx.globalAlpha = 0.95;
  rect(218, 18, 7, 14, "#b58bd0");
  rect(225, 24, 7, 8, "#b58bd0");
  rect(232, 16, 7, 16, "#d1a6e6");
  rect(239, 24, 7, 8, "#b58bd0");
  rect(246, 18, 7, 14, "#b58bd0");
  rect(230, 29, 16, 4, "#6d477f");
  ctx.restore();
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

    activeStages = stages.map(stage => ({ ...stage }));
    renderStats();
    updateResultActions();

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
          openStageSelect
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

    if ($("#resultStageSelectBtn")) {
      $("#resultStageSelectBtn").addEventListener("click", () => {
        playButtonSound();
        answerLocked = true;
        openStageSelect();
      });
    }

    if ($("#resultNextStageBtn")) {
      $("#resultNextStageBtn").addEventListener("click", () => {
        playButtonSound();
        answerLocked = true;
        const nextIndex = selectedStageIndex + 1;
        if (nextIndex < stages.length && !stages[selectedStageIndex]?.final) {
          selectedStageIndex = nextIndex;
          startQuest(selectedStageIndex);
        } else {
          openStageSelect();
        }
      });
    }

    /* start canvas */

    resetBattleAnimation();
  }
);
