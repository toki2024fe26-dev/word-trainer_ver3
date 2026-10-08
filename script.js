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
    id: "coral-shrimp",
    name: "CORAL SHRIMP",
    type: "shrimp",
    description: "珊瑚礁を跳ね回る鋭いハサミの海老モンスター。",
    rarity: "COMMON",
    boss: false
  },
  {
    id: "tidal-fish",
    name: "TIDAL FISH",
    type: "fish",
    description: "潮の流れを操る青い魚モンスター。鋭い歯に注意。",
    rarity: "UNCOMMON",
    boss: false
  },
  {
    id: "poseidon",
    name: "POSEIDON",
    type: "poseidon",
    description: "海を統べる黄金の王。三叉槍から荒波を呼び起こす。",
    rarity: "BOSS",
    boss: true
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
  { id:"beach", name:"BEACH", jp:"砂浜", theme:"beach", description:"青い海と白い砂浜。潮騒の向こうに海の魔物が潜む。", enemies:["coral-shrimp","tidal-fish"], boss:"poseidon" },
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

const PLAYER_MAX_HP = 5;
let playerHp = PLAYER_MAX_HP;

// 1問ごとのタイムボーナス計測
let questionTimerStart = 0;
let questionTimerId = null;
let questionTimeoutId = null;
let questionTimerActive = false;

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
  playerDamageUntil: 0,
  playerDamageFlashUntil: 0,
  playerDamageX: 0,
  playerDamageY: 0,
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
    .monster-frame { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; image-rendering:pixelated; image-rendering:crisp-edges; opacity:0; animation:monsterBookIdle .72s steps(1,end) infinite; }
    .monster-frame-1 { animation-delay:0s; }
    .monster-frame-2 { animation-delay:.18s; }
    .monster-frame-3 { animation-delay:.36s; }
    .monster-frame-4 { animation-delay:.54s; }
    @keyframes monsterBookIdle {
      0%,24.99%{opacity:1}
      25%,100%{opacity:0}
    }
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
    const buttonLabel = cleared ? "RETRY" : (unlocked ? "START" : "LOCKED");

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

    const frameEls = [0, 1, 2, 3].map(frameIndex => {
      const frame = document.createElement("img");
      frame.className = `monster-frame monster-frame-${frameIndex + 1}`;
      frame.alt = monster.name;
      sprite.appendChild(frame);
      return frame;
    });

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
      createMonsterBookFrames(monster.type, monster);

    frameEls.forEach((frame, index) => {
      frame.src = frames[index] || frames[0];
    });
  });
}

/*
 * 図鑑のモンスター画像は、クエスト戦闘で使っている
 * drawSlime / drawBat / drawMandraga ... を直接使って生成する。
 * これで図鑑と実際のクエストのモンスター絵が完全に同じになる。
 */
function createMonsterBookFrames(type, monsterMeta = {}) {
  if (!canvas || !ctx) {
    return ["", "", "", ""];
  }

  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = canvas.width;
  previewCanvas.height = canvas.height;
  const previewCtx = previewCanvas.getContext("2d");
  previewCtx.imageSmoothingEnabled = false;

  const previousCtx = ctx;
  const previousActiveStages = activeStages;
  const previousCurrentStage = currentStage;
  const previousSelectedStageIndex = selectedStageIndex;
  const previousFlashUntil = battleState.flashUntil;
  const previousDefeat = battleState.defeat;
  const previousAttack = battleState.attack;

  const previewStage = {
    id: monsterMeta.id || type,
    type,
    boss: !!monsterMeta.boss,
    finalBoss: monsterMeta.id === "void-emperor",
    monsterId: monsterMeta.id || type
  };

  const frames = [];

  try {
    /*
      Encyclopedia previews must never leave the live battle renderer
      pointing at the preview canvas or at a temporary one-monster stage.
      A try/finally here makes the hand-off safe even when a future monster
      drawing routine throws an exception.
    */
    activeStages = [previewStage];
    currentStage = 0;
    battleState.flashUntil = 0;
    battleState.defeat = 0;
    battleState.attack = 0;
    ctx = previewCtx;

    const renderFrame = time => {
      previewCtx.setTransform(1, 0, 0, 1, 0, 0);
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewCtx.save();
      previewCtx.setTransform(BATTLE_RENDER_SCALE, 0, 0, BATTLE_RENDER_SCALE, 0, 0);
      drawEnemy(time);
      drawEnemyLightingPass(time);
  drawEnemyUltraFineDetails(time);
      previewCtx.restore();
      return previewCanvas.toDataURL("image/png");
    };

    /* Battle idle animation is 4 frames × 180ms. */
    [0, 180, 360, 540].forEach(time => frames.push(renderFrame(time)));
  } finally {
    ctx = previousCtx;
    activeStages = previousActiveStages;
    currentStage = previousCurrentStage;
    selectedStageIndex = previousSelectedStageIndex;
    battleState.flashUntil = previousFlashUntil;
    battleState.defeat = previousDefeat;
    battleState.attack = previousAttack;
  }

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
  playerHp = PLAYER_MAX_HP;
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
  updatePlayerHp();

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

function updatePlayerHp() {
  const ratio = Math.max(0, playerHp / PLAYER_MAX_HP);
  if ($("#playerHp")) {
    $("#playerHp").style.width = `${ratio * 100}%`;
    $("#playerHp").classList.toggle("critical", playerHp <= 2);
  }
  if ($("#playerHpText")) {
    $("#playerHpText").textContent = `${playerHp} / ${PLAYER_MAX_HP}`;
  }
}

function startPlayerDamageAnimation() {
  const now = performance.now();
  battleState.playerDamageUntil = now + 520;
  battleState.playerDamageFlashUntil = now + 180;
  battleState.playerDamageX = 58;
  battleState.playerDamageY = 62;
}

function failQuestByDamage() {
  stopQuestionTimer();
  answerLocked = true;
  if ($("#battleMessage")) {
    $("#battleMessage").textContent = "PLAYER DOWN... QUEST FAILED";
  }
  startPlayerDamageAnimation();
  setTimeout(() => finishQuiz(true), 850);
}

/* =========================================================
   TIME BONUS
   ========================================================= */

function getTimeBonus(elapsedSeconds) {
  if (elapsedSeconds <= 2) return 250;
  if (elapsedSeconds <= 5) return 150;
  if (elapsedSeconds <= 7) return 100;
  if (elapsedSeconds <= 10) return 50;
  return 0;
}

function formatQuizTime(seconds) {
  return Math.max(0, seconds).toFixed(1).padStart(4, "0");
}

function updateQuizTimer() {
  if (!questionTimerActive) return;

  const elapsed =
    (performance.now() - questionTimerStart) / 1000;

  const timer = $("#quizTimer");
  if (timer) {
    timer.textContent = formatQuizTime(elapsed);
    timer.classList.toggle("time-over", elapsed > 10);
  }

  questionTimerId = requestAnimationFrame(updateQuizTimer);
}

function startQuestionTimer() {
  stopQuestionTimer();
  questionTimerStart = performance.now();
  questionTimerActive = true;

  const timer = $("#quizTimer");
  if (timer) {
    timer.textContent = "00.0";
    timer.classList.remove("time-over");
  }

  // 20秒無回答で「MISS」と同じくプレイヤーが1ダメージを受ける。
  questionTimeoutId = window.setTimeout(() => {
    handleQuestionTimeout();
  }, 20000);

  questionTimerId = requestAnimationFrame(updateQuizTimer);
}

function stopQuestionTimer() {
  questionTimerActive = false;

  if (questionTimerId !== null) {
    cancelAnimationFrame(questionTimerId);
    questionTimerId = null;
  }

  if (questionTimeoutId !== null) {
    clearTimeout(questionTimeoutId);
    questionTimeoutId = null;
  }
}

function getQuestionElapsedSeconds() {
  if (!questionTimerStart) return 999;
  return Math.max(0, (performance.now() - questionTimerStart) / 1000);
}

function handleQuestionTimeout() {
  if (!questionTimerActive || answerLocked) return;
  if (currentIndex >= quizWords.length) return;

  stopQuestionTimer();
  answerLocked = true;

  const current = quizWords[currentIndex];
  if (!current) return;

  const buttons = document.querySelectorAll(".answer-btn");
  buttons.forEach(button => {
    button.disabled = true;
    if (button.textContent === current.jp) {
      button.classList.add("correct");
    }
  });

  recordWrongWord(current);
  playWrongSound();

  playerHp = Math.max(0, playerHp - 1);
  updatePlayerHp();
  startPlayerDamageAnimation();
  streak = 0;

  if ($("#battleMessage")) {
    $("#battleMessage").textContent = `TIME OUT!  正解：${current.jp}`;
  }

  currentIndex++;
  saveStats();
  renderStats();

  if (playerHp <= 0) {
    failQuestByDamage();
    return;
  }

  setTimeout(() => {
    if (currentIndex >= quizWords.length) {
      finishQuiz();
    } else {
      nextQuestion();
    }
  }, 850);
}

function showTimeBonus(bonus) {
  if (!bonus) return;

  const overlay = $("#timeBonusOverlay");
  if (!overlay) return;

  // 1行表示。数字と「!」だけ少し大きくして、
  // TIME BONUS と数値が一目で読めるようにする。
  overlay.innerHTML = `
    <span class="bonus-line">TIME BONUS <strong class="bonus-value">${bonus}!</strong></span>
  `;
  overlay.classList.remove("show");
  void overlay.offsetWidth;
  overlay.classList.add("show");

  setTimeout(() => {
    overlay.classList.remove("show");
  }, 1000);
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

  startQuestionTimer();

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
  playerHp = PLAYER_MAX_HP;
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

  const elapsedSeconds = getQuestionElapsedSeconds();
  stopQuestionTimer();

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

    playerHp = Math.max(0, playerHp - 1);
    updatePlayerHp();
    startPlayerDamageAnimation();

    streak = 0;

    if ($("#battleMessage")) {
      $("#battleMessage")
        .textContent =
          `MISS!  正解：${current.jp}`;
    }

    currentIndex++;

    saveStats();
    renderStats();

    if (playerHp <= 0) {
      failQuestByDamage();
      return;
    }

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

  const timeBonus = getTimeBonus(elapsedSeconds);
  quizScore += 100 + timeBonus;
  streak++;

  if (timeBonus > 0) {
    showTimeBonus(timeBonus);
  }
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

function finishQuiz(failed = false) {
  answerLocked = true;
  stopQuestionTimer();

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
      .textContent = failed
        ? "STAGE FAILED"
        : (stageCleared
          ? (stages[selectedStageIndex]?.final ? "FINAL STAGE CLEAR" : "STAGE CLEAR")
          : (correctCount === 10 ? "PERFECT CLEAR" : "QUEST COMPLETE"));
  }

  showScreen(
    "resultScreen"
  );
}

/* =========================================================
   BATTLE CANVAS
   ========================================================= */

const BATTLE_LOGICAL_WIDTH = 320;
const BATTLE_LOGICAL_HEIGHT = 180;
const BATTLE_RENDER_SCALE = 1.5;

const canvas =
  $("#battleCanvas");

let ctx =
  canvas
    ? canvas.getContext("2d")
    : null;

const mainCtx = ctx;
const backgroundCanvas = canvas
  ? document.createElement("canvas")
  : null;
const backgroundCtx = backgroundCanvas
  ? backgroundCanvas.getContext("2d")
  : null;

if (canvas) {
  if (mainCtx) mainCtx.imageSmoothingEnabled = false;
  if (backgroundCanvas) {
    backgroundCanvas.width = canvas.width;
    backgroundCanvas.height = canvas.height;
  }
  if (backgroundCtx) backgroundCtx.imageSmoothingEnabled = false;
}

function getIdleFrame(time) {
  return Math.floor(time / 180) % 4;
}

function getIdleBob(frame) {
  return [0, 1, 2, 1][frame] || 0;
}

function resetBattleAnimation() {
  battleState.attack = 0;
  battleState.flashUntil = 0;
  battleState.damageUntil = 0;
  battleState.playerDamageUntil = 0;
  battleState.playerDamageFlashUntil = 0;
  battleState.playerDamageX = 0;
  battleState.playerDamageY = 0;
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

function toneRect(
  x,
  y,
  w,
  h,
  light,
  mid,
  shadow,
  vertical = true
) {
  if (!ctx) return;

  const gradient = vertical
    ? ctx.createLinearGradient(0, y, 0, y + h)
    : ctx.createLinearGradient(x, 0, x + w, 0);

  gradient.addColorStop(0, light);
  gradient.addColorStop(.5, mid);
  gradient.addColorStop(1, shadow);

  ctx.fillStyle = gradient;
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

  // 戦闘画面は480×270のネイティブ描画へ。
  // これまでの320×180ベースのアートを1.5倍の座標系で描画し、
  // ブラウザによる画像全体の拡大を減らして、ドットの輪郭を安定させる。
  const w = BATTLE_LOGICAL_WIDTH;
  const h = BATTLE_LOGICAL_HEIGHT;
  const scale = BATTLE_RENDER_SCALE;
  const physicalW = canvas.width;
  const physicalH = canvas.height;

  const currentDefinition = stages[selectedStageIndex] || stages[0];

  /* ================= BACKGROUND ================= */
  if (backgroundCtx && mainCtx && backgroundCanvas) {
    backgroundCtx.setTransform(1, 0, 0, 1, 0, 0);
    backgroundCtx.clearRect(0, 0, physicalW, physicalH);
    backgroundCtx.setTransform(scale, 0, 0, scale, 0, 0);

    const backgroundTheme = currentDefinition.theme || currentDefinition.id;
    const saturationMap = {
      grassland: 0.78,
      forest: 0.72,
      beach: 0.70,
      volcano: 0.68,
      snowfield: 0.76,
      ruins: 0.74
    };

    backgroundCtx.filter = `saturate(${saturationMap[backgroundTheme] ?? 0.74})`;
    ctx = backgroundCtx;
    drawStageBackground(backgroundTheme, time, w, h);
    drawBackgroundSparkles(backgroundTheme, time, w, h);
    backgroundCtx.filter = "none";
    backgroundCtx.setTransform(1, 0, 0, 1, 0, 0);

    ctx = mainCtx;
    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    mainCtx.clearRect(0, 0, physicalW, physicalH);
    mainCtx.save();
    mainCtx.imageSmoothingEnabled = true;
    mainCtx.filter = "blur(2px)";
    mainCtx.drawImage(
      backgroundCanvas,
      0,
      0,
      physicalW,
      physicalH
    );
    mainCtx.restore();
  } else {
    ctx = mainCtx;
    mainCtx.setTransform(scale, 0, 0, scale, 0, 0);
    const fallbackTheme = currentDefinition.theme || currentDefinition.id;
    drawStageBackground(fallbackTheme, time, w, h);
    drawBackgroundSparkles(fallbackTheme, time, w, h);
    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ================= FOREGROUND ================= */
  ctx = mainCtx;
  mainCtx.setTransform(scale, 0, 0, scale, 0, 0);
  mainCtx.imageSmoothingEnabled = false;

  drawHero(time);
  drawEnemy(time);
  drawHeroFineDetails(time);
  drawHeroMicroDetails(time);
  drawEnemyLightingPass(time);
  drawParticles();
  drawDamage(time);
  drawPlayerDamageEffect(time);

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

  mainCtx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawBackgroundSparkles(theme, time, w, h) {
  if (!ctx) return;

  const palettes = {
    grassland: ["#fff3a6", "#ffffff", "#d8f6ff"],
    forest: ["#d9ffb4", "#c6f8ec", "#f5f2b0"],
    beach: ["#fff0a8", "#d9fff7", "#ffffff"],
    volcano: ["#ffd38a", "#ff9e6b", "#fff0b8"],
    snowfield: ["#e8fbff", "#bfeeff", "#ffffff"],
    ruins: ["#e8c9ff", "#a9d4ff", "#fff0cb"]
  };

  const colors = palettes[theme] || palettes.grassland;
  const seeds = [
    [18, 26, 1], [46, 52, 1], [77, 33, 2], [104, 68, 1],
    [132, 24, 1], [158, 51, 2], [187, 31, 1], [214, 66, 1],
    [244, 39, 2], [271, 72, 1], [298, 29, 1], [309, 102, 1]
  ];

  for (let i = 0; i < seeds.length; i++) {
    const [baseX, baseY, size] = seeds[i];
    const wave = time / (1050 + (i % 3) * 180) + i * 1.7;
    const pulse = (Math.sin(wave) + 1) / 2;
    if (pulse < 0.10) continue;

    const x = baseX + Math.sin(time / 1700 + i) * 1.2;
    const y = baseY + Math.cos(time / 1900 + i * .7) * 1.0;
    const alpha = .035 + pulse * .12;
    const c = colors[i % colors.length];

    ctx.save();
    ctx.globalAlpha = alpha;
    rect(x + size, y, size, size, c);
    rect(x, y + size, size, size, c);
    if (size > 1 && pulse > .55) {
      rect(x + size, y + size, size, size, c);
    }
    ctx.restore();
  }
}

function drawStageBackground(theme, time, w, h) {
  // セレクト画面の空気感をそのまま戦闘画面へ。
  // 「空 → 遠景 → 中景 → 地面」の4層にして、細かなピクセルを増やす。
  const sky = (top, bottom) => {
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 0, 96);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, 96);
  };
  const pixelPoly = (points, color) => {
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  const pixelSun = (x, y, size, color) => {
    rect(x + 4, y, size - 8, size, color);
    rect(x, y + 4, size, size - 8, color);
  };

  if (theme === "grassland") {
    // セレクト画面の明るい昼景をベースに、少しだけ空気遠近を追加。
    sky("#b8d6e4", "#90b4c8");
    rect(0, 82, w, 48, "#86aa67");
    pixelPoly([[0,130],[0,92],[43,66],[80,91],[120,59],[160,90],[201,55],[243,91],[282,63],[320,94],[320,130]], "#72985c");
    pixelPoly([[0,130],[0,106],[39,84],[72,108],[112,77],[151,104],[191,78],[228,106],[268,81],[320,109],[320,130]], "#8fb572");

    // 昼らしさを出す明るい太陽と薄雲。
    pixelSun(247,16,24,"#ffe8a6");
    rect(252,13,14,2,"#fff1c2");
    rect(28,27,38,3,"#dcebf0");
    rect(39,23,20,3,"#e8f2f4");
    rect(90,38,31,3,"#d5e7ed");
    rect(103,34,18,3,"#e2eef1");

    rect(0,130,w,50,"#557947");
    rect(0,128,w,4,"#416038");
    for(let x=0;x<w;x+=24){
      rect(x,112-(x%48===0?3:0),12,2,"#b6cf86");
      rect(x+8,119,7,2,"#9fbe76");
    }
    for(let x=8;x<w;x+=18){
      rect(x,141+(x%22),8,2,"#769c55");
      rect(x+3,151+(x%16),4,3,"#82a75d");
    }
    // ごく薄い黄色の花を差し色に。
    rect(22,137,3,3,"#f3e58a");
    rect(25,140,3,3,"#f3e58a");
    rect(291,146,3,3,"#f3e58a");
    rect(294,149,3,3,"#f3e58a");
    rect(41,72,3,19,"#618850");
    rect(37,68,12,3,"#73955a");
    rect(50,78,3,14,"#5f834e");

  } else if (theme === "forest") {
    sky("#617d82", "#3f625e");
    // 奥の木々
    for(let x=-8;x<w+20;x+=30){
      rect(x+10,38,8,74,"#2d5047");
      rect(x+1,47,26,12,"#355b4d");
      rect(x-4,61,36,15,"#3f6a54");
      rect(x+2,78,28,12,"#345d4d");
    }
    pixelPoly([[0,130],[0,76],[25,58],[42,81],[62,50],[84,78],[108,55],[130,85],[151,61],[178,87],[201,56],[221,82],[242,53],[268,84],[293,59],[320,84],[320,130]], "#335849");
    rect(0,130,w,50,"#294338");
    for(let x=0;x<w;x+=15){
      rect(x,145+(x%28),9,2,"#4a6d50");
      rect(x+4,155+(x%19),4,2,"#3e6248");
    }
    pixelSun(253,22,17,"#dbe5c8");
    // 黄緑～水色の小さな光をアクセントに。
    for(let i=0;i<10;i++){
      const x = 25 + i*29;
      const y = 88 + Math.sin(time/900+i)*4 + (i%3)*9;
      rect(x,y,2,2,i%2 ? "#a4c68d" : "#84c6bb");
    }

  } else if (theme === "beach") {
    sky("#94d3df", "#74bfd0");
    pixelSun(253,18,23,"#ffe6a1");
    rect(0,78,w,46,"#67afbf");
    rect(0,78,w,3,"#9bd5da");
    rect(0,118,w,4,"#90ced2");
    for(let x=-10;x<w;x+=34){
      rect(x,88+(x%3)*2,18,2,"#e9f5ef");
      rect(x+9,96+(x%4),13,2,"#d2ebeb");
    }
    pixelPoly([[0,111],[26,103],[51,108],[74,96],[100,110],[128,102],[155,111],[180,98],[206,110],[232,102],[259,110],[286,99],[320,109],[320,125],[0,125]], "#77a8ac");
    rect(0,122,w,58,"#dac486");
    rect(0,122,w,4,"#f2df9d");
    for(let x=0;x<w;x+=27){
      rect(x,136,16,2,"#c0aa6d");
      rect(x+10,151,11,2,"#e6d59a");
      rect(x+2,165,7,2,"#cbb577");
    }
    // 珊瑚系の差し色をほんの少し。
    rect(23,158,4,3,"#e5a98d");
    rect(28,155,4,3,"#e5a98d");
    rect(283,171,4,3,"#9ad8ce");
    rect(289,168,4,3,"#9ad8ce");
    // ヤシの木
    rect(53,68,4,54,"#725e45");
    rect(49,67,11,4,"#846d4c");
    rect(39,61,17,3,"#557d5c"); rect(52,58,16,3,"#608a63"); rect(62,64,15,3,"#557d5c");
    rect(45,56,4,11,"#557d5c"); rect(62,56,4,10,"#557d5c");

  } else if (theme === "volcano") {
    sky("#5b4651", "#77413c");
    pixelPoly([[0,106],[0,92],[34,76],[70,91],[109,60],[144,90],[171,70],[201,91],[241,58],[275,93],[320,74],[320,132]], "#58383d");
    pixelPoly([[36,128],[36,104],[73,71],[103,104],[119,128]], "#312931");
    pixelPoly([[54,103],[65,89],[73,71],[81,89],[95,104]], "#3d3038");
    rect(69,84,7,18,"#e17a3d"); rect(73,72,3,12,"#f0a052"); rect(59,96,20,5,"#bc5039");
    rect(0,130,w,50,"#2a2027");
    for(let x=0;x<w;x+=22){
      rect(x,141+(x%4)*4,13,3,"#5b3438");
      rect(x+8,158-(x%6),8,2,"#6e3a37");
    }
    rect(214,110,48,3,"#8d4537"); rect(226,116,33,2,"#ad5038");
    pixelSun(246,22,18,"#d9a38d");
    // マグマの赤紫をほんのり差し色に。
    rect(165,124,18,2,"#d76b58");
    rect(178,121,10,2,"#df795d");
    for(let i=0;i<7;i++){
      const x=165+i*18;
      const y=28+Math.sin(time/700+i)*6-(i%2)*3;
      rect(x,y,4,4,i%2 ? "#b65a4d" : "#d76c53");
      if(i%3===0) rect(x+1,y-5,2,3,"#d98762");
    }

  } else if (theme === "snowfield") {
    sky("#d2e2ea", "#aec8d5");
    pixelSun(250,21,18,"#fbf7e7");
    pixelPoly([[0,128],[0,91],[30,68],[54,92],[85,55],[116,94],[147,69],[181,99],[210,63],[244,96],[274,74],[320,103],[320,128]], "#90a9b8");
    pixelPoly([[0,128],[0,101],[35,82],[58,106],[86,75],[116,105],[151,82],[181,110],[210,77],[243,104],[274,88],[320,112],[320,128]], "#b5cbd5");
    rect(0,128,w,52,"#e4eef1");
    rect(0,128,w,4,"#f9fbfb");
    for(let x=8;x<w;x+=25){
      const drift = (x%3)*5;
      rect(x,145+drift,2,7,"#fff");
      rect(x+3,157+((x/25)%3)*2,2,5,"#cbdde4");
    }
    rect(20,143,48,2,"#c5d8df"); rect(24,148,34,2,"#cfdee5");
    rect(238,145,52,2,"#c9dbe2");
    // 氷の淡いシアンをアクセントに。
    rect(81,160,5,2,"#9ed8dc");
    rect(84,157,3,2,"#b9e7e4");
    rect(263,166,5,2,"#a7dfe2");

  } else {
    // ANCIENT RUINS / FINAL — セレクト画面の「妖麗な月」を強める。
    sky("#39395b", "#2b2b48");

    // 月光の薄いハロー。背景だけなので、キャラ/UIは影響を受けない。
    if (ctx) {
      const glow = ctx.createRadialGradient(256, 28, 6, 256, 28, 46);
      glow.addColorStop(0, "rgba(215,194,239,.24)");
      glow.addColorStop(.45, "rgba(174,143,208,.12)");
      glow.addColorStop(1, "rgba(120,95,157,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(202, 0, 108, 86);
    }

    // セレクト画面の月を意識した、ひと回り大きいピクセル月。
    pixelSun(243,14,28,"#c7b3d9");
    rect(249,10,16,3,"#ddd1e7");
    rect(237,24,4,10,"#b7a0cc");
    rect(265,24,5,7,"#aa94c1");
    rect(256,36,7,3,"#a58dbd");

    rect(0,84,w,46,"#2d2b46");
    // 遠景の遺跡シルエット
    pixelPoly([[0,130],[0,95],[21,95],[21,63],[29,63],[29,52],[40,52],[40,91],[55,91],[55,72],[66,72],[66,105],[82,105],[82,80],[93,80],[93,60],[104,60],[104,106],[120,106],[120,87],[138,87],[138,130]], "#4a465d");
    pixelPoly([[200,130],[200,91],[214,91],[214,66],[225,66],[225,51],[237,51],[237,93],[252,93],[252,71],[265,71],[265,44],[280,44],[280,98],[296,98],[296,81],[307,81],[307,58],[318,58],[318,130]], "#544f63");
    // 月光を受ける縁を少しだけ。
    rect(228,51,9,2,"#706883");
    rect(265,44,15,2,"#756d86");
    rect(92,60,12,2,"#6a637a");

    rect(0,130,w,50,"#1b1a2b");
    for(let x=0;x<w;x+=36){
      rect(x,141,25,3,"#363249");
      rect(x+10,156,21,2,"#2b2840");
    }
    rect(95,112,126,7,"#5e586a"); rect(112,102,91,9,"#4f4a5c");

    // 紫＋青の微かな魔法文字を差し色に。
    rect(142,27,34,2,"#8f76b6");
    rect(149,33,20,3,"#c17bcf");
    rect(155,41,8,4,"#70528e");
    rect(151,24,2,22,"#7a5b94");
    rect(166,29,2,15,"#6f5087");
    rect(195,118,5,2,"#7da6c8");
    rect(203,115,3,2,"#a09ce0");
  }

  // 背景の細密ピクセルディテール。キャラクターの背後にのみ描画し、
  // セレクト画面のような「小さい情報の積み重ね」を増やす。
  drawStageFineDetails(theme, time, w, h);
  drawStageUltraFinePixels(theme, time, w, h);

  // ステージ名は既存HUDの一部として残す。
  pixelText(theme === "ruins" ? "ANCIENT RUINS" : theme.toUpperCase(), 9, 10, 7, "#ffffff");
}
/* =========================================================
   STAGE FINE PIXEL DETAILS
   ========================================================= */

/* =========================================================
   ULTRA-FINE STAGE PIXEL DETAIL
   ========================================================= */
function drawStageUltraFinePixels(theme, time, w, h) {
  if (!ctx) return;
  ctx.save();
  ctx.globalAlpha = 0.34;
  const seed = [
    [11, 118], [22, 135], [34, 151], [48, 126], [61, 159], [74, 140],
    [89, 115], [103, 145], [117, 161], [132, 128], [145, 153], [160, 137],
    [176, 121], [190, 158], [205, 142], [219, 127], [233, 151], [248, 137],
    [263, 160], [277, 119], [291, 145], [305, 156]
  ];
  const palette = {
    grassland: ['#dfe8a5','#b9d58a','#9bc6d6'],
    forest: ['#9acb85','#75a97b','#9fc8b4'],
    beach: ['#dff4eb','#b6dfe0','#e0c98b'],
    volcano: ['#c96b52','#9a4f47','#d68b58'],
    snowfield: ['#e7f5f8','#c7dfe7','#a7d8df'],
    ruins: ['#bca8d8','#8799c2','#d0b8df']
  };
  const colors = palette[theme] || palette.grassland;
  seed.forEach(([x,y], i) => {
    const drift = Math.round(Math.sin(time / 1300 + i) * 0.5);
    rect(x + drift, y, 1, 1, colors[i % colors.length]);
    if (i % 4 === 0) rect(x + 2 + drift, y + 2, 1, 1, colors[(i + 1) % colors.length]);
  });
  ctx.restore();
}

function drawStageFineDetails(theme, time, w, h) {
  if (!ctx) return;

  const p = (x, y, ww, hh, color) => rect(x, y, ww, hh, color);
  const blink = (speed = 900, offset = 0) =>
    Math.sin((time + offset) / speed) * 0.5 + 0.5;

  ctx.save();

  if (theme === "grassland") {
    // 昼の草原：小さな花・草・石・雲の粒で明るい情報密度を追加。
    for (let i = 0; i < 18; i++) {
      const x = 7 + ((i * 37) % 306);
      const y = 120 + ((i * 17) % 49);
      p(x, y, 2, 5, i % 3 === 0 ? "#7da35a" : "#6e9652");
      if (i % 4 === 0) p(x + 2, y + 2, 3, 2, "#a6c97b");
    }
    const flowers = [
      [17, 128, "#f1dc87"], [45, 146, "#f6e7a0"], [82, 133, "#e9d87e"],
      [123, 151, "#f2df91"], [168, 127, "#f4e3a1"], [213, 146, "#ecd580"],
      [270, 132, "#f4e69d"], [302, 154, "#f1dc88"]
    ];
    for (const [x,y,c] of flowers) {
      p(x, y, 2, 2, c); p(x + 2, y + 2, 2, 2, c);
      p(x + 1, y + 4, 1, 4, "#65864a");
    }
    p(70, 92, 25, 2, "#cfe3ec"); p(77, 89, 14, 2, "#e3eef2");
    p(188, 60, 21, 2, "#d8e9ef"); p(195, 57, 10, 2, "#edf4f5");
    p(147, 115, 8, 3, "#8aa86a"); p(151, 113, 3, 2, "#aac58a");
    p(278, 101, 9, 3, "#7f9f62");

  } else if (theme === "forest") {
    // 森林：前後の枝・葉・光点を増やして、木立の奥行きを強化。
    for (let x = -3; x < w + 10; x += 22) {
      p(x + 2, 58 + (x % 5), 3, 41, "#24453d");
      p(x - 3, 72 + (x % 7), 15, 4, "#315949");
      p(x + 5, 65 + (x % 9), 18, 3, "#3d6a54");
      if ((x / 22) % 2 === 0) p(x + 8, 52 + (x % 6), 5, 3, "#4c765b");
    }
    for (let i = 0; i < 13; i++) {
      const x = 16 + i * 23;
      const y = 104 + (i % 3) * 7;
      p(x, y, 2, 6, "#6f965f");
      p(x + 2, y + 2, 4, 2, "#86aa6c");
      if (i % 3 === 0) p(x - 2, y + 1, 3, 2, "#477b63");
    }
    for (let i = 0; i < 7; i++) {
      const x = 35 + i * 38;
      const y = 45 + (i % 3) * 14;
      const a = blink(850, i * 73);
      ctx.globalAlpha = 0.45 + a * 0.45;
      p(x, y, 2, 2, i % 2 ? "#9fdbc0" : "#d0e7a0");
      ctx.globalAlpha = 1;
    }
    p(115, 136, 12, 3, "#355c48"); p(121, 133, 8, 3, "#416e52");
    p(204, 150, 15, 2, "#3c634b");

  } else if (theme === "beach") {
    // 砂浜：細かな波・貝・珊瑚色の小粒でリゾート感を追加。
    for (let i = 0; i < 10; i++) {
      const x = 6 + ((i * 31) % 305);
      const y = 90 + ((i * 11) % 29);
      p(x, y, 14, 2, i % 2 ? "#acdfe1" : "#bfe8e5");
      p(x + 5, y + 3, 7, 2, "#d7eff0");
    }
    for (let i = 0; i < 11; i++) {
      const x = 15 + ((i * 29) % 285);
      const y = 137 + ((i * 19) % 35);
      p(x, y, 3, 2, i % 3 === 0 ? "#e3ad8f" : "#d7c17e");
      p(x + 3, y + 1, 2, 2, i % 2 ? "#f0d99a" : "#b0d9c8");
    }
    p(98, 72, 16, 2, "#b4dfe0"); p(104, 69, 9, 2, "#dceff0");
    p(233, 126, 12, 3, "#c7b06f"); p(239, 122, 6, 3, "#efd995");

  } else if (theme === "volcano") {
    // 火山：黒い岩肌の亀裂、火の粉、遠景の溶岩筋。
    for (let i = 0; i < 12; i++) {
      const x = 8 + ((i * 31) % 300);
      const y = 133 + ((i * 13) % 40);
      p(x, y, 10, 2, "#493034");
      if (i % 3 === 0) p(x + 5, y + 2, 3, 2, "#63383a");
    }
    p(110, 121, 22, 3, "#7f4139"); p(118, 117, 10, 2, "#a14a3d");
    p(278, 109, 16, 2, "#8d4339"); p(286, 105, 9, 2, "#bb533d");
    for (let i = 0; i < 10; i++) {
      const x = 18 + ((i * 29) % 292);
      const y = 38 + ((i * 17) % 78);
      if (i % 2 === 0) p(x, y, 2, 3, "#d56a50");
      else p(x, y, 3, 2, "#ec8c58");
    }
    p(53, 145, 13, 3, "#2f252b"); p(58, 140, 6, 3, "#5b3337");

  } else if (theme === "snowfield") {
    // 雪原：雪の段差・氷片・風の筋を増やして白銀の密度を出す。
    for (let i = 0; i < 16; i++) {
      const x = 7 + ((i * 23) % 305);
      const y = 138 + ((i * 13) % 35);
      p(x, y, 8 + (i % 3) * 3, 2, i % 2 ? "#c8dce4" : "#f7fbfc");
    }
    for (let i = 0; i < 8; i++) {
      const x = 28 + i * 35;
      const y = 55 + (i % 4) * 11;
      p(x, y, 10, 2, "#dcebf0");
      p(x + 5, y + 3, 6, 2, "#f2f8fa");
    }
    p(115, 111, 28, 3, "#a9c3d0"); p(121, 108, 16, 3, "#c1d6df");
    p(228, 131, 13, 2, "#a7c4d1"); p(236, 127, 8, 2, "#f8fbfc");
    // 小さなシアンの氷片
    p(38, 154, 3, 3, "#9bd9de"); p(42, 157, 2, 4, "#b8e8e7");
    p(289, 148, 3, 3, "#a7e0e2");

  } else {
    // 遺跡：月光を受けた石の段差、柱、魔法の粉塵を増やす。
    // 月の周辺は暗部を潰さず、淡い紫で階調を細かくする。
    p(205, 58, 13, 2, "#66607b"); p(219, 61, 7, 2, "#77708b");
    p(286, 69, 16, 2, "#615b74"); p(300, 72, 7, 2, "#756e86");
    p(27, 101, 12, 2, "#625c74"); p(44, 96, 6, 3, "#716a82");
    p(76, 107, 19, 3, "#5b556d"); p(88, 103, 8, 2, "#77708a");
    for (let i = 0; i < 9; i++) {
      const x = 24 + i * 33;
      const y = 136 + (i % 3) * 11;
      p(x, y, 13, 2, i % 2 ? "#302e43" : "#3c384d");
      if (i % 3 === 0) p(x + 7, y - 4, 5, 2, "#4f4960");
    }
    // 月光の粒
    for (let i = 0; i < 11; i++) {
      const x = 44 + ((i * 27) % 228);
      const y = 34 + ((i * 19) % 96);
      const a = blink(1100, i * 91);
      ctx.globalAlpha = 0.28 + a * 0.45;
      p(x, y, i % 3 === 0 ? 2 : 1, i % 2 ? 2 : 1, i % 2 ? "#bdaee2" : "#8fb0d0");
      ctx.globalAlpha = 1;
    }
    p(132, 112, 46, 3, "#4a445a"); p(144, 107, 24, 2, "#625b70");
    p(150, 102, 4, 5, "#756d83"); p(166, 105, 4, 6, "#6e667d");
  }

  ctx.restore();
}

/* =========================================================
   HERO
   ========================================================= */

function drawHero(time) {
  const attack = battleState.attack;
  const idleFrame = getIdleFrame(time);

  /*
    2.5〜3頭身くらいのデフォルメ勇者。
    足元は完全固定、肩〜頭だけ4フレームで呼吸する。
  */
  const breath = [0, -1, 0, 1][idleFrame];
  const capeSwing = [0, 1, 2, 1][idleFrame];

  let swordPhase = 0;
  if (attack > 0) {
    const elapsed = 1 - attack;
    swordPhase = Math.min(1, elapsed * 1.9);
  }

  const damageActive = battleState.playerDamageUntil > time;
  const damageShake = damageActive
    ? (Math.floor((battleState.playerDamageUntil - time) / 45) % 2 === 0 ? -2 : 2)
    : 0;

  const x = 58 + damageShake;
  const y = 83 + damageShake;
  const upperY = y + breath;

  /* =========================
     GROUND SHADOW — 固定
     ========================= */
  ctx.save();
  ctx.globalAlpha = .28;
  rect(x - 21, y + 48, 10, 2, "#171725");
  rect(x - 10, y + 50, 20, 2, "#171725");
  rect(x + 11, y + 48, 12, 2, "#171725");
  ctx.restore();

  /* =========================
     CAPE — 上半身に追従
     ========================= */
  rect(x - 19 - capeSwing, upperY + 1, 25, 31, "#263a70");
  rect(x - 16 - capeSwing, upperY - 4, 19, 7, "#5570ad");
  rect(x - 20 - capeSwing, upperY + 9, 8, 17, "#1c2d58");
  rect(x - 16 - capeSwing, upperY + 17, 8, 11, "#3d5a96");
  rect(x - 12 - capeSwing, upperY + 27, 10, 4, "#6880b8");
  rect(x - 8 - capeSwing, upperY + 29, 8, 4, "#1b2a50");

  /* =========================
     GOLDEN HAIR — 大きめの頭部
     ========================= */
  // 後ろ髪
  rect(x - 18, upperY - 19, 25, 22, "#895c21");
  rect(x - 21, upperY - 13, 10, 20, "#b47b28");
  rect(x + 4, upperY - 12, 9, 19, "#744b20");
  rect(x - 24, upperY - 7, 7, 13, "#a96f24");
  rect(x + 8, upperY - 5, 6, 12, "#68421e");

  // 頭頂の金髪
  rect(x - 16, upperY - 25, 22, 10, "#c58e35");
  rect(x - 11, upperY - 29, 13, 6, "#e6ba57");
  rect(x - 7, upperY - 30, 10, 4, "#f2d074");
  rect(x - 15, upperY - 20, 8, 4, "#f0cd6e");
  rect(x - 9, upperY - 14, 8, 3, "#dca548");
  rect(x + 1, upperY - 19, 6, 3, "#9f6c26");

  /* 前髪 — 顔を囲む */
  rect(x - 14, upperY - 17, 7, 7, "#d7a242");
  rect(x - 9, upperY - 19, 6, 9, "#edc261");
  rect(x - 3, upperY - 17, 7, 6, "#c58a31");
  rect(x + 3, upperY - 16, 6, 8, "#a97027");

  /* =========================
     CROWN — 髪に密着
     ========================= */
  rect(x - 8, upperY - 30, 17, 3, "#9a6a22");
  rect(x - 7, upperY - 34, 4, 6, "#d7ad4f");
  rect(x - 1, upperY - 37, 4, 9, "#f0d06c");
  rect(x + 5, upperY - 34, 4, 6, "#d3a548");
  rect(x - 6, upperY - 29, 14, 2, "#ffe391");
  rect(x - 1, upperY - 30, 4, 2, "#7ca7ec");

  /* =========================
     FACE — 大きなアニメ目
     ========================= */
  rect(x - 10, upperY - 16, 22, 17, "#bc7354");
  rect(x - 7, upperY - 18, 19, 18, "#efb18e");
  rect(x + 8, upperY - 13, 7, 9, "#c77d61");
  rect(x - 5, upperY - 17, 14, 3, "#f4c29c");
  rect(x - 6, upperY - 14, 7, 2, "#8c564c");
  rect(x + 5, upperY - 14, 7, 2, "#8c564c");

  // 左右の大きな目。黒→紺→白ハイライトの3段階。
  rect(x - 8, upperY - 12, 7, 8, "#252343");
  rect(x + 4, upperY - 12, 7, 8, "#252343");
  rect(x - 6, upperY - 10, 4, 5, "#4f6aa9");
  rect(x + 6, upperY - 10, 4, 5, "#4f6aa9");
  rect(x - 5, upperY - 10, 2, 2, "#ffffff");
  rect(x + 7, upperY - 10, 2, 2, "#ffffff");
  rect(x - 3, upperY - 6, 2, 1, "#d78378");
  rect(x + 7, upperY - 6, 2, 1, "#d78378");

  // 小さな鼻と口
  rect(x + 1, upperY - 5, 2, 2, "#be765f");
  rect(x - 1, upperY - 1, 7, 2, "#a95f62");
  rect(x, upperY - 1, 4, 1, "#f09b91");

  /* =========================
     NECK / COLLAR
     ========================= */
  rect(x + 1, upperY, 10, 7, "#a06a51");
  rect(x + 1, upperY + 2, 12, 6, "#5d687a");
  rect(x + 4, upperY + 2, 6, 3, "#f0f2f4");
  rect(x + 6, upperY + 4, 3, 3, "#4a6dab");

  /* =========================
     SHOULDER ARMOR
     ========================= */
  rect(x - 12, upperY + 6, 9, 9, "#566273");
  rect(x - 11, upperY + 5, 8, 4, "#d8dde2");
  rect(x + 12, upperY + 6, 10, 9, "#4e5869");
  rect(x + 13, upperY + 5, 8, 4, "#e0e4e8");
  rect(x - 14, upperY + 11, 5, 5, "#7f8997");
  rect(x + 20, upperY + 11, 5, 5, "#707a8a");

  /* =========================
     CUIRASS — 女性勇者らしいシルエット
     ========================= */
  rect(x - 8, upperY + 7, 26, 25, "#333b49");
  rect(x - 5, upperY + 7, 22, 22, "#838c98");
  rect(x - 2, upperY + 8, 16, 18, "#d4d8dc");
  rect(x + 11, upperY + 9, 6, 16, "#6d7785");
  rect(x + 1, upperY + 7, 13, 3, "#f4f5f5");
  rect(x + 7, upperY + 10, 2, 14, "#939ca7");

  // 胸元の青い宝石
  rect(x + 3, upperY + 11, 9, 8, "#345fa5");
  rect(x + 5, upperY + 10, 5, 2, "#99c4f4");
  rect(x + 5, upperY + 12, 5, 4, "#5f8bc9");
  rect(x + 6, upperY + 13, 3, 2, "#d8f2ff");

  /* 腕とガントレット */
  rect(x + 16, upperY + 8, 10, 9, "#6c7685");
  rect(x + 17, upperY + 7, 8, 3, "#edf0f2");
  rect(x + 23, upperY + 11, 8, 7, "#c2c8d0");
  rect(x + 25, upperY + 10, 4, 3, "#ffffff");
  rect(x + 21, upperY + 16, 9, 4, "#525d6d");

  /* =========================
     WAIST / SHORT SKIRT ARMOR
     ========================= */
  rect(x - 7, upperY + 28, 25, 6, "#353c49");
  rect(x - 2, upperY + 33, 9, 8, "#657080");
  rect(x + 7, upperY + 33, 11, 8, "#535e6e");
  rect(x - 5, upperY + 34, 8, 5, "#bfc6ce");
  rect(x + 9, upperY + 34, 6, 5, "#8d97a3");
  rect(x + 3, upperY + 27, 8, 8, "#cda34f");
  rect(x + 5, upperY + 28, 4, 3, "#f5dc82");

  /* =========================
     LEGS / BOOTS — 完全固定
     ========================= */
  rect(x - 4, y + 40, 9, 10, "#4b5362");
  rect(x + 8, y + 40, 10, 10, "#3d4654");
  rect(x - 3, y + 40, 4, 8, "#c4cad1");
  rect(x + 9, y + 40, 4, 8, "#8993a0");
  rect(x - 7, y + 48, 13, 6, "#2b3340");
  rect(x + 7, y + 48, 15, 6, "#242b38");
  rect(x - 5, y + 48, 7, 2, "#d4dae0");
  rect(x + 9, y + 48, 7, 2, "#a0a9b4");
  rect(x - 9, y + 53, 15, 3, "#1d2430");
  rect(x + 7, y + 53, 17, 3, "#1a202b");

  /* =========================
     SHIELD — 上半身に追従
     ========================= */
  rect(x - 18, upperY + 8, 9, 13, "#4e5c7c");
  rect(x - 19, upperY + 9, 8, 4, "#93a8cd");
  rect(x - 18, upperY + 13, 6, 8, "#6480af");
  rect(x - 17, upperY + 13, 4, 4, "#edf5ff");
  rect(x - 21, upperY + 19, 11, 3, "#293652");

  /* Sword: デザインと攻撃モーションはそのまま。 */
  drawSword(x + 24, upperY + 13, swordPhase);
}
/* =========================================================
   HERO — 1.5頭身・モンスター側を向くアニメ風リビルド
   ========================================================= */
function drawHero(time) {
  const attack = battleState.attack;
  const idleFrame = getIdleFrame(time);

  // 足は固定。肩〜頭だけが4フレームでゆっくり呼吸する。
  const breath = [0, -1, 0, 1][idleFrame];
  const capeSwing = [0, 1, 1, 0][idleFrame];

  let swordPhase = 0;
  if (attack > 0) {
    const elapsed = 1 - attack;
    swordPhase = Math.min(1, elapsed * 1.9);
  }

  const damageActive = battleState.playerDamageUntil > time;
  const damageShake = damageActive
    ? (Math.floor((battleState.playerDamageUntil - time) / 45) % 2 === 0 ? -2 : 2)
    : 0;

  const x = 58 + damageShake;
  const y = 94 + damageShake;
  const upperY = y + breath;

  /* =========================
     GROUND SHADOW — 固定
     ========================= */
  ctx.save();
  ctx.globalAlpha = .30;
  rect(x - 18, y + 39, 8, 2, '#171725');
  rect(x - 10, y + 41, 20, 2, '#171725');
  rect(x + 10, y + 39, 8, 2, '#171725');
  ctx.restore();

  /*
     上半身だけをモンスター側（右）へしっかり向ける。
     顔も別レイヤーで同じ方向へ向け、正面顔感を減らす。
  */
  ctx.save();
  ctx.translate(x + 2, upperY + 16);
  ctx.rotate(-0.055);
  ctx.translate(-(x + 2), -(upperY + 16));

  /* =========================
     CAPE — 顔に絶対かからない後方レイヤー
     ========================= */
  rect(x - 19 - capeSwing, upperY + 10, 16, 25, '#233664');
  rect(x - 17 - capeSwing, upperY + 6, 13, 6, '#5672b0');
  rect(x - 20 - capeSwing, upperY + 16, 5, 13, '#182850');
  rect(x - 16 - capeSwing, upperY + 24, 7, 8, '#3b5892');
  rect(x - 13 - capeSwing, upperY + 31, 7, 4, '#6881b7');
  // マントの先端は後頭部より下に限定して、顔周りへ侵入させない。
  rect(x - 7 - capeSwing, upperY + 32, 6, 4, '#1c2b50');

  /* =========================
     LONG GOLDEN HAIR — 少し長め
     ========================= */
  // 後ろ髪の大きな楕円シルエット
  rect(x - 18, upperY - 30, 36, 4, '#70451c');
  rect(x - 23, upperY - 27, 46, 8, '#87541f');
  rect(x - 26, upperY - 20, 52, 17, '#9b6220');
  rect(x - 27, upperY - 10, 54, 18, '#8a551d');
  rect(x - 24, upperY + 2, 48, 16, '#75491a');

  // 左右の長い毛束（肩まで）
  rect(x - 25, upperY - 4, 7, 24, '#b47529');
  rect(x - 23, upperY + 8, 6, 18, '#8a551d');
  rect(x + 18, upperY - 3, 7, 25, '#8b561e');
  rect(x + 20, upperY + 9, 6, 16, '#684219');

  // 金髪3階調
  rect(x - 18, upperY - 27, 35, 7, '#d9a543');
  rect(x - 20, upperY - 21, 41, 10, '#dfad4b');
  rect(x - 20, upperY - 13, 41, 10, '#c68b34');
  rect(x - 18, upperY - 5, 39, 10, '#aa6e27');
  rect(x - 15, upperY - 25, 14, 4, '#f2d27c');
  rect(x - 10, upperY - 19, 11, 3, '#f7dc91');
  rect(x + 7, upperY - 14, 10, 3, '#b9782a');
  rect(x - 23, upperY + 2, 4, 9, '#c0812e');
  rect(x + 20, upperY + 3, 4, 10, '#73461b');

  /* =========================
     CROWN — 頭頂に密着 / 少し大きめにして勇者感を強調
     ========================= */
  rect(x - 7, upperY - 30, 21, 3, '#704719');
  rect(x - 6, upperY - 34, 4, 7, '#d6aa46');
  rect(x - 1, upperY - 37, 4, 10, '#f6d674');
  rect(x + 5, upperY - 35, 4, 8, '#e0b24f');
  rect(x + 10, upperY - 33, 4, 6, '#c7963e');
  rect(x - 5, upperY - 29, 19, 2, '#ffeaa5');
  rect(x - 1, upperY - 30, 4, 2, '#72a7ef');
  rect(x + 6, upperY - 31, 3, 2, '#fff2b8');
  rect(x - 3, upperY - 36, 2, 2, '#fff3be');

  /* =========================
     FACE — 水平を保った3/4向きの楕円顔
     ========================= */
  const fx = x + 5;

  // 顔は回転させず水平をキープ。輪郭だけ左右非対称にして3/4感を出す。
  rect(fx - 17, upperY - 9, 33, 3, '#bd9188');
  rect(fx - 19, upperY - 6, 37, 8, '#efd1c7');
  rect(fx - 18, upperY + 2, 39, 10, '#f7e3da');
  rect(fx - 13, upperY + 12, 33, 5, '#efd1c7');
  rect(fx - 8, upperY + 17, 24, 3, '#bd9188');

  // モンスター側（右）を少し広くして、正面顔を弱める。
  rect(fx - 16, upperY + 1, 5, 5, '#fff2ea');
  rect(fx + 13, upperY + 1, 7, 5, '#fff4ee');
  rect(fx - 17, upperY + 8, 3, 2, '#f2b6ad');
  rect(fx + 17, upperY + 8, 4, 3, '#e5a198');

  /* =========================
     MODERN ANIME EYES — 3/4 perspective
     ========================= */
  // 上まぶた：両目とも少し下げつつ、モンスター側（右）をわずかに大きく。
  rect(fx - 16, upperY - 1, 14, 3, '#423056');
  rect(fx + 3, upperY - 1, 15, 3, '#423056');
  rect(fx - 18, upperY + 1, 3, 4, '#4b345d');
  rect(fx + 17, upperY + 1, 3, 4, '#4b345d');

  // 外枠：向かって左の目を少し小さく、右目を少し大きくして遠近感。
  rect(fx - 16, upperY + 1, 14, 14, '#332b57');
  rect(fx + 2, upperY + 1, 17, 14, '#332b57');

  // 下側の線だけ肌色に戻して、眼鏡のフレームのように見えないようにする。
  // 上まぶたと左右の輪郭は残し、目の下は顔になじませる。
  rect(fx - 16, upperY + 13, 14, 2, '#f7e3da');
  rect(fx + 2, upperY + 13, 17, 2, '#f7e3da');

  // 白目：輪郭に沿って1〜2pxだけ残す、柔らかいアイボリー。
  rect(fx - 14, upperY + 3, 11, 10, '#fff8ef');
  rect(fx + 4, upperY + 3, 13, 10, '#fff8ef');
  rect(fx - 15, upperY + 5, 1, 6, '#fffdf7');
  rect(fx + 3, upperY + 5, 1, 6, '#fffdf7');

  // 虹彩：3階調＋少し大きめ。
  rect(fx - 13, upperY + 3, 9, 10, '#6f84df');
  rect(fx + 5, upperY + 3, 11, 10, '#6f84df');
  rect(fx - 12, upperY + 4, 7, 6, '#a8baf8');
  rect(fx + 6, upperY + 4, 8, 6, '#a8baf8');
  rect(fx - 11, upperY + 10, 7, 3, '#586bc3');
  rect(fx + 7, upperY + 10, 8, 3, '#586bc3');

  // 瞳孔：中央に存在感のある黒い1ドット核＋2pxの縦芯。
  rect(fx - 10, upperY + 7, 3, 3, '#202039');
  rect(fx + 8, upperY + 7, 3, 3, '#202039');
  rect(fx - 9, upperY + 6, 1, 1, '#171729');
  rect(fx + 9, upperY + 6, 1, 1, '#171729');

  // ハイライト：大きいハイライトを向かって左下、小さい対角ハイライトを右上。
  rect(fx - 14, upperY + 10, 3, 3, '#ffffff');
  rect(fx - 5, upperY + 4, 2, 2, '#ffffff');
  rect(fx + 4, upperY + 10, 3, 3, '#ffffff');
  rect(fx + 13, upperY + 4, 2, 2, '#ffffff');

  // まつ毛
  rect(fx - 19, upperY + 1, 4, 2, '#443057');
  rect(fx + 17, upperY + 1, 4, 2, '#443057');

  // 口・鼻は描かず、目と顔の輪郭だけで表情を作る。

  /* =========================
     NECK / COLLAR
     ========================= */
  rect(fx - 2, upperY + 17, 8, 5, '#d2a198');
  rect(fx - 5, upperY + 20, 14, 5, '#eef1f4');
  rect(fx + 0, upperY + 20, 5, 3, '#5576b8');

  /* =========================
     ARMOR
     ========================= */
  rect(fx - 13, upperY + 23, 9, 7, '#606b7b');
  rect(fx - 12, upperY + 22, 7, 3, '#e4e8eb');
  rect(fx + 7, upperY + 23, 9, 7, '#566172');
  rect(fx + 8, upperY + 22, 7, 3, '#f1f3f4');

  rect(fx - 7, upperY + 23, 17, 15, '#414a59');
  rect(fx - 5, upperY + 23, 15, 13, '#b6bdc5');
  rect(fx - 2, upperY + 24, 11, 10, '#e4e7ea');
  rect(fx + 6, upperY + 24, 4, 10, '#7b8592');
  rect(fx - 1, upperY + 23, 9, 2, '#ffffff');

  // 胸宝石
  rect(fx, upperY + 27, 7, 7, '#345ea8');
  rect(fx + 1, upperY + 26, 4, 2, '#b4dcff');
  rect(fx + 1, upperY + 29, 5, 3, '#6c9bdd');
  rect(fx + 2, upperY + 29, 2, 2, '#effaff');

  // 小さな腕・手
  rect(fx + 9, upperY + 26, 7, 7, '#7d8794');
  rect(fx + 10, upperY + 25, 5, 3, '#f6f8f9');
  rect(fx + 15, upperY + 30, 5, 5, '#f3d4ca');
  rect(fx + 17, upperY + 31, 3, 3, '#d7aaa1');

  /* =========================
     BELT / SKIRT ARMOR
     ========================= */
  rect(fx - 7, upperY + 37, 16, 4, '#343d4a');
  rect(fx - 1, upperY + 37, 6, 4, '#d4ae59');
  rect(fx, upperY + 38, 4, 2, '#f6de8b');
  rect(fx - 5, upperY + 41, 7, 5, '#c8ced4');
  rect(fx + 3, upperY + 41, 8, 5, '#6b7684');

  /* SHIELD — 3/4向きに右へ寄せて奥行きを出す */
  rect(fx - 19, upperY + 25, 8, 10, '#526283');
  rect(fx - 20, upperY + 26, 7, 3, '#a6bad9');
  rect(fx - 19, upperY + 29, 6, 6, '#6f8ab7');
  rect(fx - 18, upperY + 29, 3, 3, '#f0f7ff');

  /* 細部：髪・王冠・鎧・宝石・マント */
  rect(x - 20, upperY - 18, 2, 1, '#f6d98d');
  rect(x - 16, upperY - 14, 1, 4, '#f8df9b');
  rect(x - 11, upperY - 10, 2, 1, '#e9ba61');
  rect(x + 10, upperY - 14, 1, 4, '#d9a243');
  rect(x + 18, upperY - 4, 1, 5, '#9b6424');
  rect(x - 4, upperY - 33, 1, 3, '#fff4bd');
  rect(x + 1, upperY - 35, 1, 3, '#fff8ce');
  rect(x + 8, upperY - 32, 1, 2, '#f8df91');
  rect(fx - 11, upperY - 6, 1, 1, '#dce7ff');
  rect(fx + 14, upperY - 6, 1, 1, '#dce7ff');
  rect(fx - 15, upperY + 10, 1, 1, '#f6c1bc');
  rect(fx + 16, upperY + 10, 1, 1, '#edada8');
  rect(fx - 4, upperY + 27, 1, 7, '#f7f8fa');
  rect(fx + 8, upperY + 25, 1, 8, '#a7b0bb');
  rect(fx + 1, upperY + 28, 1, 2, '#ffffff');
  rect(fx - 18 - capeSwing, upperY + 17, 1, 9, '#6b86bd');
  rect(fx - 13 - capeSwing, upperY + 24, 1, 7, '#4d6ba7');

  // 剣は従来のデザイン・動きを維持
  drawSword(fx + 17, upperY + 29, swordPhase);

  ctx.restore();

  /* =========================
     TINY LEGS / BOOTS — 完全固定
     ========================= */
  rect(x - 4, y + 43, 6, 7, '#5f6977');
  rect(x + 4, y + 43, 7, 7, '#485260');
  rect(x - 2, y + 43, 3, 4, '#dfe3e6');
  rect(x + 5, y + 43, 3, 4, '#9aa4af');
  rect(x - 7, y + 49, 10, 4, '#2c3440');
  rect(x + 3, y + 49, 11, 4, '#252d38');
  rect(x - 5, y + 49, 5, 1, '#d7dce1');
  rect(x + 5, y + 49, 5, 1, '#abb4bf');
}

/* =========================================================
   CHARACTER FINE PIXEL DETAILS
   ========================================================= */

function drawHeroFineDetails(time) {
  // Hero details are now integrated into drawHero() for consistent shading.
}

function drawHeroMicroDetails(time) {
  // Hero details are now integrated into drawHero() for consistent shading.
}

function drawEnemyMicroDetails(time) {
  if (!ctx) return;

  const stage = activeStages[currentStage];
  if (!stage) return;

  const idleFrame = getIdleFrame(time);
  const idleBob = getIdleBob(idleFrame);
  const type = stage.type;
  let x = 235;
  let y = 82 + idleBob;
  let scale = 1;

  if (type === "bat") y = 76 + idleBob;
  if (type === "dragon") { y = 72 + idleBob; scale = stage.finalBoss ? 1.12 : 1; }
  if (type === "wolf") y = 84 + idleBob;
  if (type === "phantom") y = 78 + idleBob;
  if (type === "golem") y = 76 + idleBob;
  if (type === "shrimp") y = 82 + idleBob;
  if (type === "fish") y = 78 + idleBob;
  if (type === "poseidon") { y = 68 + idleBob; scale = 1.06; }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (type === "slime") {
    // ゲルの透過感：上面の光と下面の濃い影
    rect(-15, -9, 4, 2, "#e3c4df");
    rect(-10, -15, 3, 2, "#f2dded");
    rect(-20, 2, 3, 7, "#8f5f8f");
    rect(16, 1, 3, 8, "#61436f");
    rect(-11, 15, 5, 3, "#684672");
    rect(-2, 18, 8, 2, "#5b3f68");
    rect(8, 15, 5, 3, "#704977");
    rect(-7, -4, 2, 1, "#ffffff");
    rect(8, -4, 2, 1, "#ffffff");
  }

  if (type === "bat") {
    // 翼膜のセル状の陰影と耳・爪の反射
    rect(-31, 0, 4, 2, "#7a6f99");
    rect(-30, 7, 6, 2, "#3c3657");
    rect(24, 0, 5, 2, "#7a6f99");
    rect(24, 7, 6, 2, "#3c3657");
    rect(-6, -22, 3, 4, "#9481a5");
    rect(4, -22, 3, 4, "#9481a5");
    rect(-14, 17, 3, 3, "#d1c6d2");
    rect(11, 17, 3, 3, "#d1c6d2");
  }

  if (type === "mandraga") {
    // 葉の表裏と幹の粒状ディテール
    rect(-15, -16, 6, 2, "#a7c17c");
    rect(10, -25, 5, 2, "#b0ca82");
    rect(-11, -7, 3, 8, "#557247");
    rect(8, 1, 3, 8, "#587548");
    rect(-8, 17, 4, 3, "#4c6942");
    rect(5, 19, 4, 3, "#4a6741");
    rect(-3, 3, 2, 6, "#b3cb7c");
  }

  if (type === "wolf") {
    // 毛の塊を3段階に分け、顔周辺を少しシャープに
    rect(-18, -20, 5, 2, "#8f96a4");
    rect(-15, -17, 4, 3, "#6f7789");
    rect(6, -16, 4, 3, "#353c50");
    rect(15, -1, 4, 3, "#2e3548");
    rect(17, 5, 3, 2, "#858c9b");
    rect(-8, 3, 2, 2, "#9aa0ab");
    rect(-3, 7, 3, 2, "#4f5668");
    rect(13, 26, 5, 2, "#2a3040");
  }

  if (type === "phantom") {
    // 霊体の縁を細かなアルファ段階で
    const glow = .16;
    ctx.globalAlpha = glow;
    rect(-23, -18, 3, 6, "#b4a9d2");
    rect(20, -14, 3, 8, "#9c91c2");
    rect(-28, 9, 3, 5, "#9a90be");
    rect(24, 14, 3, 5, "#8d83b0");
    ctx.globalAlpha = .95;
    rect(-8, -18, 2, 2, "#fff2b3");
    rect(9, -18, 2, 2, "#fff2b3");
    ctx.globalAlpha = 1;
  }

  if (type === "golem") {
    // 石の面と金属光沢をタイル状に分割
    rect(-24, -21, 7, 3, "#8c919d");
    rect(16, -20, 6, 3, "#666c7b");
    rect(-27, 4, 6, 4, "#474d5d");
    rect(21, 8, 6, 3, "#8e929e");
    rect(-10, -4, 4, 3, "#6f7481");
    rect(7, -3, 4, 3, "#3e4452");
    rect(-15, 13, 3, 8, "#737885");
    rect(13, 14, 3, 8, "#3f4551");
    rect(-1, 8, 2, 2, "#d59362");
  }

  if (type === "dragon") {
    // 鱗を小さな光点と陰影で増やす
    toneRect(-18, -18, 4, 2, "#c8aeca", "#947aa0", "#715875", false);
    toneRect(-11, -14, 3, 2, "#e0bede", "#ad8cad", "#80647f", false);
    toneRect(8, -15, 3, 2, "#b996b6", "#8e718f", "#695267", false);
    toneRect(15, -18, 4, 2, "#9a759f", "#745a80", "#56425f", false);
    rect(-14, -2, 4, 2, "#9d7b98");
    rect(10, 0, 4, 2, "#8d6c8d");
    rect(-11, 9, 3, 3, "#b08aa1");
    rect(8, 10, 3, 3, "#806277");
    rect(-27, -11, 5, 2, "#7d6b9d");
    rect(23, -11, 5, 2, "#76628f");
    rect(-3, 15, 6, 2, "#b18aa0");
  }

  // 接地影：背景からキャラクターを切り出すための低密度ドット影
  ctx.globalAlpha = .28;
  rect(-18, 34, 11, 2, "#171725");
  rect(-6, 36, 13, 2, "#171725");
  rect(9, 34, 10, 2, "#171725");
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawEnemyFineDetails(time) {
  const stage = activeStages[currentStage];
  if (!stage) return;

  const idleFrame = getIdleFrame(time);
  const idleBob = getIdleBob(idleFrame);
  const type = stage.type;

  let x = 235;
  let y = 82 + idleBob;
  let scale = 1;
  if (type === "bat") y = 76 + idleBob;
  if (type === "dragon") { y = 72 + idleBob; scale = stage.finalBoss ? 1.12 : 1; }
  if (type === "wolf") y = 84 + idleBob;
  if (type === "phantom") y = 78 + idleBob;
  if (type === "golem") y = 76 + idleBob;
  if (type === "shrimp") y = 82 + idleBob;
  if (type === "fish") y = 78 + idleBob;
  if (type === "poseidon") { y = 68 + idleBob; scale = 1.06; }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (type === "slime") {
    rect(-18, -14, 4, 3, "#d4aacd");
    rect(-19, -11, 2, 8, "#b786ae");
    rect(14, -4, 5, 3, "#9d6ba1");
    rect(-17, 11, 4, 3, "#76507f");
    rect(13, 9, 5, 3, "#6f4b79");
    rect(-6, 19, 12, 2, "#ad7ab4");
    rect(17, -33, 2, 5, "#f0cc74");
    rect(10, -28, 3, 2, "#e6b96a");
  }

  if (type === "bat") {
    // 翼膜のリブ
    for (const pts of [
      [-37, -1, 10, 2, "#655a84"], [-35, 5, 13, 2, "#4a4468"], [-34, 11, 11, 2, "#6c6286"],
      [24, -1, 10, 2, "#655a84"], [23, 5, 13, 2, "#4a4468"], [24, 11, 11, 2, "#6c6286"]
    ]) rect(...pts);
    rect(-8, -18, 4, 10, "#7d6a91"); rect(4, -18, 4, 10, "#7d6a91");
    rect(-14, 2, 3, 9, "#493d60"); rect(11, 2, 3, 9, "#493d60");
    rect(-2, 20, 3, 7, "#b9aeb4"); rect(2, 20, 3, 7, "#b9aeb4");
  }

  if (type === "mandraga") {
    // 葉脈・樹皮・根
    toneRect(-9, -22, 2, 12, "#c0d88d", "#93aa6b", "#68814f");
    toneRect(7, -33, 2, 12, "#c5db92", "#93aa6b", "#66804d");
    toneRect(-16, -5, 5, 2, "#a3bd77", "#78955e", "#587046", false); toneRect(11, -1, 5, 2, "#acc77d", "#86a167", "#5d7748", false);
    toneRect(-17, 8, 4, 10, "#8ea866", "#6f8b58", "#4a603e"); toneRect(13, 8, 4, 9, "#87a05f", "#688454", "#455c3a");
    rect(-14, 20, 7, 2, "#78935b"); rect(7, 22, 9, 2, "#718c58");
    rect(-5, 14, 3, 4, "#78935b"); rect(3, -2, 3, 4, "#9eb26f");
  }

  if (type === "wolf") {
    // 毛並み・マズル・脚の陰影
    toneRect(-21, -22, 12, 3, "#b6bcc4", "#87909f", "#626b7d", false);
    toneRect(-11, -18, 3, 8, "#a6adb9", "#7d8495", "#565f72");
    toneRect(4, -18, 4, 9, "#596174", "#434a60", "#303747");
    toneRect(-24, -7, 6, 4, "#747d90", "#596174", "#3d4557", false);
    toneRect(13, -4, 5, 4, "#4e5669", "#394054", "#2a3041", false);
    rect(-6, -2, 12, 2, "#757c8d");
    rect(-2, 4, 4, 3, "#1f2331");
    rect(-25, 21, 8, 3, "#616b7e"); rect(11, 20, 8, 3, "#3d4559");
    rect(-19, 28, 7, 2, "#343a4c"); rect(5, 28, 7, 2, "#343a4c");
  }

  if (type === "phantom") {
    // 霊体の透明な段差と目の光
    toneRect(-19, -28, 5, 8, "#a59fba", "#8179a1", "#655e86");
    toneRect(15, -28, 5, 9, "#8d86aa", "#625c86", "#49456d");
    toneRect(-26, -5, 5, 14, "#a39cbb", "#8179a4", "#625a82");
    toneRect(21, 0, 5, 12, "#8f88ab", "#615a83", "#474369");
    rect(-9, -17, 3, 3, "#f2e2ad"); rect(8, -17, 3, 3, "#f2e2ad");
    rect(-4, 11, 8, 2, "#837aa2");
    rect(-16, 20, 6, 3, "#5f5980"); rect(10, 20, 7, 3, "#5b557a");
  }

  if (type === "golem") {
    // 石ブロックの継ぎ目と金属ディテール
    toneRect(-26, -25, 12, 2, "#aeb2ba", "#7b808e", "#565b69", false); toneRect(14, -24, 11, 2, "#777c89", "#5d6473", "#424854", false);
    toneRect(-31, -2, 10, 3, "#747986", "#555b6b", "#3c424f", false); toneRect(21, 2, 9, 3, "#aeb2b8", "#858997", "#5e6370", false);
    toneRect(-19, 9, 3, 15, "#7b808b", "#5c6170", "#3f444f"); toneRect(16, 10, 3, 14, "#767b87", "#5a5f6e", "#3c424d");
    rect(-5, -28, 3, 14, "#737887"); rect(4, -28, 3, 11, "#454b59");
    rect(-28, 30, 11, 3, "#545968"); rect(17, 29, 11, 3, "#4a505f");
    rect(-2, 2, 4, 3, "#c27e54"); rect(4, 18, 4, 2, "#7f6f57");
  }

  if (type === "dragon") {
    // 翼膜・鱗・胸当てを細かなピクセルで追加。
    for (const pts of [
      [-41, -23, 9, 2, "#5f5788"], [-39, -15, 13, 2, "#4b456e"], [-35, -7, 10, 2, "#6e6490"],
      [32, -23, 9, 2, "#5f5788"], [26, -15, 13, 2, "#4b456e"], [25, -7, 10, 2, "#6e6490"]
    ]) rect(...pts);
    rect(-26, -51, 5, 2, "#e6c178"); rect(21, -51, 5, 2, "#e6c178");
    rect(-8, -31, 4, 3, "#80648a"); rect(4, -31, 4, 3, "#7c6085");
    rect(-15, -24, 3, 8, "#796087"); rect(12, -24, 3, 8, "#705879");
    rect(-17, -1, 5, 3, "#856b87"); rect(12, 1, 5, 3, "#755a7f");
    rect(-18, 11, 5, 3, "#765d80"); rect(14, 12, 5, 3, "#6b5478");
    rect(-24, 22, 5, 9, "#463b5e"); rect(20, 22, 5, 9, "#44395b");
  }

  ctx.restore();
}

/* =========================================================
   MONSTER LIGHTING — consistent top-left light / bottom-right shadow
   ========================================================= */
function drawEnemyUltraFineDetails(time) {
  if (!ctx) return;
  const stage = activeStages[currentStage];
  if (!stage) return;
  const type = stage.type;
  const frame = getIdleFrame(time);
  const bob = getIdleBob(frame);
  let x = 235;
  let y = 82 + bob;
  if (type === 'bat') y = 76 + bob;
  if (type === 'dragon') y = 72 + bob;
  if (type === 'wolf') y = 84 + bob;
  if (type === 'phantom') y = 78 + bob;
  if (type === 'golem') y = 76 + bob;
  if (type === 'shrimp') y = 82 + bob;
  if (type === 'fish') y = 78 + bob;
  if (type === 'poseidon') y = 68 + bob;
  ctx.save();
  const tiny = {
    slime: ['#f9ecf7','#a16da0','#6b456f'], bat:['#a79ab6','#665b82','#40365c'],
    mandraga:['#bed58f','#76985d','#40583d'], wolf:['#b6bcc6','#6f7686','#3e4558'],
    phantom:['#c9c1df','#857ea4','#514b72'], golem:['#c7cad0','#7d838e','#4f5562'],
    shrimp:['#ffd49d','#ff8e67','#9c3b45'], fish:['#c9f4f1','#64ccd7','#236d87'],
    poseidon:['#d7fbf4','#65d2de','#1b5d7b'], dragon:['#c3afd2','#7b6895','#493b61']
  }[type];
  if (!tiny) { ctx.restore(); return; }
  ctx.translate(x, y);
  rect(-18, -14, 1, 1, tiny[0]);
  rect(-11, -19, 1, 1, tiny[0]);
  rect(10, -10, 1, 1, tiny[1]);
  rect(15, 3, 1, 1, tiny[2]);
  rect(-8, 17, 1, 1, tiny[2]);
  rect(6, 11, 1, 1, tiny[1]);
  ctx.restore();
}

function drawEnemyLightingPass(time) {
  if (!ctx) return;
  const stage = activeStages[currentStage];
  if (!stage) return;

  const type = stage.type;
  const idleBob = getIdleBob(getIdleFrame(time));
  let x = 235;
  let y = 82 + idleBob;
  let scale = 1;
  if (type === "bat") y = 76 + idleBob;
  if (type === "dragon") { y = 72 + idleBob; scale = stage.finalBoss ? 1.12 : 1; }
  if (type === "wolf") y = 84 + idleBob;
  if (type === "phantom") y = 78 + idleBob;
  if (type === "golem") y = 76 + idleBob;
  if (type === "shrimp") y = 82 + idleBob;
  if (type === "fish") y = 78 + idleBob;
  if (type === "poseidon") { y = 68 + idleBob; scale = 1.06; }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // 共通方針：光源は左上。上面・左面を明るく、下面・右面を暗くする。
  if (type === "slime") {
    toneRect(-16, -15, 12, 3, "#f4e0ef", "#d9b7da", "#b88bb8");
    toneRect(-20, -10, 3, 13, "#cfa4c7", "#b888b8", "#80537f", false);
    toneRect(8, -18, 9, 3, "#8b6b96", "#71527f", "#594064");
    toneRect(12, 10, 7, 8, "#80527d", "#62426f", "#493254");
    toneRect(-14, 17, 28, 3, "#76507f", "#5b3d69", "#3f2d4d");
    rect(-7, -6, 3, 2, "#fff4f8");
    rect(-2, -4, 2, 2, "#f4d8ec");
  }

  if (type === "bat") {
    const flap = Math.sin(time / 100) * 4;
    toneRect(-39, -4 + flap, 5, 22, "#74698a", "#594f72", "#37314f");
    toneRect(-34, -8 + flap, 7, 3, "#988ca8", "#75698e", "#504666");
    toneRect(-29, 18 + flap, 7, 3, "#493f59", "#2f2b45", "#211d31");
    toneRect(34, -4 - flap, 5, 22, "#74698a", "#594f72", "#37314f");
    toneRect(27, -8 - flap, 7, 3, "#988ca8", "#75698e", "#504666");
    toneRect(22, 18 - flap, 7, 3, "#493f59", "#2f2b45", "#211d31");
    rect(-11, -20, 7, 3, "#826d94");
    rect(4, -20, 7, 3, "#705f87");
    rect(-8, 14, 3, 8, "#a89cae");
    rect(5, 14, 3, 8, "#938992");
  }

  if (type === "mandraga") {
    rect(-10, -34, 5, 11, "#a8bf79");
    rect(2, -37, 5, 12, "#9fb974");
    rect(-22, -10, 7, 3, "#73905a");
    rect(14, -8, 7, 3, "#5b794b");
    rect(-18, 8, 6, 10, "#537045");
    rect(12, 9, 6, 9, "#48613e");
    rect(-12, 17, 20, 3, "#435a39");
    rect(-4, -4, 3, 9, "#91ad68");
    rect(7, 1, 3, 7, "#839e5f");
  }

  if (type === "wolf") {
    rect(-19, -24, 10, 3, "#9da3ad");
    rect(-22, -20, 5, 7, "#7f8795");
    rect(5, -20, 5, 7, "#596173");
    rect(-26, -6, 8, 3, "#697182");
    rect(13, -2, 7, 3, "#3b4356");
    rect(-10, -2, 15, 3, "#8b929d");
    rect(-6, 4, 11, 4, "#343a4b");
    rect(-22, 18, 8, 4, "#515a6c");
    rect(11, 19, 8, 4, "#313849");
    rect(-15, 27, 7, 2, "#303646");
    rect(5, 27, 7, 2, "#2a3040");
  }

  if (type === "phantom") {
    rect(-15, -29, 12, 3, "#9890b4");
    rect(-22, -22, 5, 12, "#7b739d");
    rect(15, -25, 5, 12, "#665e87");
    rect(-24, 1, 5, 12, "#746d95");
    rect(19, 4, 5, 11, "#575178");
    rect(-16, 20, 12, 3, "#5a547c");
    rect(7, 21, 10, 3, "#4e496e");
    rect(-9, -18, 4, 3, "#fff1b0");
    rect(7, -18, 4, 3, "#fff1b0");
  }

  if (type === "golem") {
    rect(-25, -26, 16, 3, "#a2a6ae");
    rect(-28, -18, 8, 10, "#7e838e");
    rect(14, -22, 10, 3, "#5c626e");
    rect(-25, 1, 9, 4, "#666c77");
    rect(18, 3, 10, 4, "#505663");
    rect(-17, 10, 6, 16, "#696f7a");
    rect(17, 11, 6, 15, "#4b515e");
    rect(-27, 30, 10, 3, "#4e5562");
    rect(17, 29, 10, 3, "#454b57");
    rect(-2, -8, 3, 6, "#d7d9dc");
    rect(5, 18, 4, 2, "#8a6b54");
  }

  if (type === "shrimp") {
    toneRect(-25, -15, 11, 4, "#ffad73", "#f27d54", "#b84b45", false);
    toneRect(-19, -7, 15, 5, "#ff9a66", "#e95f4f", "#a83e45", false);
    toneRect(-13, 1, 18, 5, "#ff8d61", "#d9514b", "#963947", false);
    toneRect(2, 9, 15, 5, "#f47a58", "#c84b49", "#7d3040", false);
    rect(-29, -22, 2, 17, "#f7a96d");
    rect(-31, -24, 2, 12, "#d55249");
    rect(19, -3, 7, 3, "#ffb878");
    rect(22, -8, 2, 7, "#ffcf83");
  }

  if (type === "fish") {
    toneRect(-23, -16, 16, 4, "#8be5ee", "#3db3c7", "#257b95", false);
    toneRect(-26, -8, 26, 14, "#62cbdc", "#2699b6", "#17657f");
    toneRect(-17, 5, 22, 9, "#d9f0e8", "#72c5ce", "#2b7d92", false);
    toneRect(5, -5, 16, 10, "#6ed7e1", "#2b98b4", "#1a5d78", false);
    rect(-5, -18, 11, 3, "#93e8ec");
    rect(-30, -2, 5, 6, "#f3f3de");
    rect(-12, 16, 15, 2, "#1e6178");
    rect(15, -16, 6, 4, "#3c8ea3");
  }

  if (type === "poseidon") {
    toneRect(-28, -19, 17, 5, "#8fe7ef", "#45b3c8", "#236f8d", false);
    toneRect(10, -19, 17, 5, "#8fe7ef", "#45b3c8", "#236f8d", false);
    toneRect(-16, -10, 32, 18, "#6fd2df", "#2f8fa9", "#195a79", false);
    toneRect(-21, 8, 17, 19, "#72d8e2", "#2e93ae", "#1b5a79", false);
    toneRect(4, 8, 17, 19, "#72d8e2", "#2e93ae", "#1b5a79", false);
    toneRect(-12, -36, 24, 14, "#83dce4", "#3899b2", "#1f607e", false);
    rect(-18, -7, 6, 5, "#f1cf67");
    rect(12, -7, 6, 5, "#d8a94f");
    rect(-8, 3, 16, 3, "#f2d16c");
    rect(-7, -43, 5, 8, "#f3d472");
    rect(2, -45, 6, 10, "#ffe18a");
    rect(9, -42, 5, 7, "#e7bf5f");
  }

  if (type === "dragon") {
    // 翼：上端にハイライト、内側と下端を暗く。
    for (const pts of [
      [-42, -22, 12, 2, "#756b9b"],
      [-39, -14, 14, 2, "#554d7c"],
      [-34, -5, 12, 2, "#463e68"],
      [30, -22, 12, 2, "#756b9b"],
      [25, -14, 14, 2, "#554d7c"],
      [23, -5, 12, 2, "#463e68"]
    ]) rect(...pts);
    rect(-14, -43, 7, 3, "#8e7290");
    rect(7, -43, 7, 3, "#755a80");
    rect(-11, -26, 22, 4, "#755c7c");
    rect(-17, -5, 5, 3, "#8b6a86");
    rect(12, -4, 5, 3, "#715474");
    rect(-17, 10, 6, 3, "#604866");
    rect(12, 11, 6, 3, "#4e3b59");
    rect(-22, 23, 8, 8, "#40334f");
    rect(16, 23, 8, 8, "#382d49");
    rect(-4, 8, 8, 3, "#d8a3b3");
    rect(-2, 13, 4, 5, "#bf7f98");
  }

  ctx.restore();
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

  // モンスターも4フレームの待機モーション。
  // 0.18秒ごとに上下へ2px移動して、
  // START QUEST中も常にアニメーションする。
  const idleFrame = getIdleFrame(time);

  const idleBob = getIdleBob(idleFrame);

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

  if (stage.type === "shrimp") {
    drawShrimp(235, 82 + idleBob, scale);
  }

  if (stage.type === "fish") {
    drawFish(235, 78 + idleBob, scale);
  }

  if (stage.type === "poseidon") {
    drawPoseidon(235, 68 + idleBob, scale, time);
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
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  /* contact shadow */
  rect(-28, 37, 56, 5, "#202337");
  rect(-22, 36, 44, 3, "#2b2a40");

  /*
    Pudding-like gel body.
    The silhouette stays pixel-stepped, while the inside uses a smooth
    multi-stop gradient so the volume reads as soft, glossy jelly rather
    than a stack of hard color blocks.
  */
  ctx.save();
  const bodyPath = new Path2D();
  bodyPath.moveTo(-24, -22);
  bodyPath.lineTo(-11, -22);
  bodyPath.lineTo(-11, -26);
  bodyPath.lineTo(10, -26);
  bodyPath.lineTo(10, -22);
  bodyPath.lineTo(21, -22);
  bodyPath.lineTo(21, -15);
  bodyPath.lineTo(26, -15);
  bodyPath.lineTo(26, 15);
  bodyPath.lineTo(22, 15);
  bodyPath.lineTo(22, 22);
  bodyPath.lineTo(14, 22);
  bodyPath.lineTo(14, 27);
  bodyPath.lineTo(-13, 27);
  bodyPath.lineTo(-13, 24);
  bodyPath.lineTo(-21, 24);
  bodyPath.lineTo(-21, 19);
  bodyPath.lineTo(-26, 19);
  bodyPath.lineTo(-26, -14);
  bodyPath.lineTo(-24, -14);
  bodyPath.closePath();

  /* Pixel-stepped contour: dark plum outline keeps the original cute silhouette. */
  ctx.save();
  ctx.strokeStyle = "#4a2d59";
  ctx.lineWidth = 3;
  ctx.lineJoin = "miter";
  ctx.lineCap = "square";
  ctx.stroke(bodyPath);
  ctx.restore();

  ctx.clip(bodyPath);

  const vertical = ctx.createLinearGradient(0, -26, 0, 28);
  // v6の紫系ベースカラーへ戻しつつ、段差のない滑らかなゲル表現。
  vertical.addColorStop(0, "#efd9ec");
  vertical.addColorStop(.10, "#e6c7e2");
  vertical.addColorStop(.22, "#cda7cf");
  vertical.addColorStop(.38, "#b98dbb");
  vertical.addColorStop(.54, "#a271a4");
  vertical.addColorStop(.70, "#80538d");
  vertical.addColorStop(.86, "#65406f");
  vertical.addColorStop(1, "#492f57");
  ctx.fillStyle = vertical;
  ctx.fillRect(-31, -30, 62, 60);

  /* Slight left-to-right falloff for a round, glossy side */
  const horizontal = ctx.createLinearGradient(-27, 0, 27, 0);
  horizontal.addColorStop(0, "rgba(255,241,250,.34)");
  horizontal.addColorStop(.22, "rgba(246,222,241,.08)");
  horizontal.addColorStop(.55, "rgba(104,64,119,0)");
  horizontal.addColorStop(1, "rgba(57,33,69,.22)");
  ctx.fillStyle = horizontal;
  ctx.fillRect(-31, -30, 62, 60);
  ctx.restore();

  /* Rounded specular highlight — stepped pixels over the smooth volume */
  rect(-17, -18, 10, 3, "#fff8fc");
  rect(-20, -14, 6, 4, "#f9edf6");
  rect(-21, -9, 3, 6, "#f2dcef");
  rect(-11, -5, 3, 2, "#ffffff");
  rect(-7, -20, 4, 2, "#ffeaf7");

  /* gentle lower translucency */
  ctx.save();
  ctx.globalAlpha = .42;
  rect(-13, 17, 26, 3, "#7a4b85");
  ctx.globalAlpha = .24;
  rect(-8, 22, 16, 2, "#4b2d5b");
  ctx.restore();

  /* eyes */
  rect(-12, -2, 7, 10, "#262438");
  rect(6, -2, 7, 10, "#262438");
  rect(-10, 0, 2, 2, "#f7eaf0");
  rect(8, 0, 2, 2, "#f7eaf0");
  rect(-10, 0, 1, 1, "#ffffff");
  rect(8, 0, 1, 1, "#ffffff");

  /* mouth */
  rect(-4, 12, 9, 3, "#3b2d45");
  rect(-2, 12, 5, 1, "#b987ad");

  /* crown */
  rect(12, -30, 6, 10, "#c6903f");
  rect(9, -25, 12, 4, "#c6903f");
  rect(13, -30, 3, 3, "#f4cf78");
  rect(17, -27, 2, 2, "#8e642d");

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
   BEACH MONSTERS
   ========================================================= */

function drawShrimp(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  rect(-30, 30, 58, 5, "#202337");

  /* antennae */
  rect(-27, -29, 2, 15, "#552d3d");
  rect(-29, -34, 2, 7, "#6a3442");
  rect(19, -22, 2, 12, "#63313e");
  rect(21, -26, 2, 8, "#7c3c43");

  /* segmented body: outline -> base -> shade */
  rect(-25, -18, 23, 8, "#7d3041");
  rect(-22, -20, 24, 8, "#d9544c");
  rect(-18, -17, 21, 8, "#ef6a51");

  rect(-17, -10, 27, 10, "#7b2d40");
  rect(-15, -13, 28, 11, "#e65d4d");
  rect(-10, -11, 23, 8, "#f97b58");

  rect(-10, -1, 28, 11, "#70283d");
  rect(-8, -4, 29, 12, "#d94e49");
  rect(-3, -2, 23, 9, "#f36d53");

  rect(0, 8, 22, 10, "#67253b");
  rect(2, 6, 21, 11, "#c64048");
  rect(7, 8, 15, 8, "#ed6252");

  /* tail fan */
  rect(18, 13, 10, 5, "#6e263c");
  rect(21, 10, 10, 12, "#b73845");
  rect(24, 8, 6, 4, "#ef6952");
  rect(24, 20, 6, 4, "#802a3c");

  /* claws */
  rect(-23, 3, 8, 4, "#9a3040");
  rect(-29, 2, 9, 4, "#d74d4b");
  rect(-31, -1, 7, 4, "#ef6a52");
  rect(7, 18, 4, 8, "#832b3d");
  rect(11, 22, 9, 4, "#d74d49");
  rect(14, 25, 7, 3, "#9a3140");

  /* eyes / face */
  rect(-15, -17, 6, 6, "#421f34");
  rect(-14, -16, 2, 2, "#fff6d5");
  rect(-2, -17, 6, 6, "#421f34");
  rect(-1, -16, 2, 2, "#fff6d5");
  rect(-6, -8, 8, 3, "#8d3040");

  /* highlight rhythm */
  rect(-19, -16, 7, 2, "#ffb27b");
  rect(-12, -9, 9, 2, "#ffae78");
  rect(-2, -1, 10, 2, "#ffad76");
  rect(7, 7, 7, 2, "#ff9b6b");

  ctx.restore();
}

function drawFish(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  rect(-31, 28, 62, 5, "#202337");

  /* tail */
  rect(20, -7, 12, 18, "#164f68");
  rect(27, -3, 7, 10, "#247f99");
  rect(22, -10, 8, 5, "#4caec0");
  rect(22, 11, 8, 5, "#1d607a");

  /* main body */
  rect(-24, -16, 45, 33, "#16566f");
  rect(-28, -10, 52, 22, "#207f98");
  rect(-22, -13, 39, 20, "#3ab0c2");
  rect(-17, -10, 31, 16, "#61cad6");

  /* belly */
  rect(-17, 7, 31, 7, "#a9dedc");
  rect(-11, 12, 21, 4, "#d6e9df");

  /* fins */
  rect(-2, -21, 13, 6, "#2c8fa6");
  rect(0, -25, 9, 5, "#49b8c5");
  rect(-7, 15, 17, 5, "#155b73");
  rect(2, 19, 11, 4, "#277f96");
  rect(-30, -1, 8, 11, "#17627a");
  rect(-35, 2, 9, 7, "#349bae");

  /* face */
  rect(-26, -8, 8, 16, "#1b6179");
  rect(-25, -7, 5, 10, "#3ba6b8");
  rect(-14, -7, 6, 6, "#122c43");
  rect(-13, -6, 2, 2, "#fff8d4");

  /* mouth + teeth */
  rect(-31, 3, 10, 6, "#152638");
  rect(-30, 4, 8, 2, "#e9f0df");
  rect(-27, 8, 2, 3, "#ffffff");
  rect(-23, 8, 2, 3, "#ffffff");

  /* scales / highlights */
  rect(-3, -8, 5, 2, "#b5edf0");
  rect(6, -4, 5, 2, "#8be0e4");
  rect(-1, 1, 6, 2, "#86dbe0");
  rect(8, 5, 5, 2, "#5dbdc9");

  ctx.restore();
}

function drawPoseidon(x, y, scale, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  rect(-37, 46, 74, 6, "#202337");

  /* water aura */
  const ripple = Math.sin(time / 520) * 2;
  rect(-36, 38 + ripple, 20, 2, "#6cd4df");
  rect(14, 36 - ripple, 24, 2, "#8ce3e7");
  rect(-28, 43, 9, 2, "#4bb3c7");

  /* cape / water mantle */
  rect(-31, -7, 17, 45, "#164f72");
  rect(14, -7, 17, 45, "#154b6d");
  rect(-28, -11, 13, 33, "#287c98");
  rect(15, -11, 13, 33, "#27758f");
  rect(-24, -13, 8, 23, "#52b7c8");
  rect(17, -13, 7, 23, "#48acbf");

  /* legs */
  rect(-17, 20, 13, 24, "#184d70");
  rect(5, 20, 13, 24, "#163f64");
  rect(-15, 21, 9, 18, "#397f9a");
  rect(7, 21, 8, 18, "#2d718c");
  rect(-19, 42, 16, 5, "#d1ab5a");
  rect(5, 42, 16, 5, "#c1954a");

  /* torso armor */
  rect(-19, -10, 38, 34, "#164f71");
  rect(-15, -8, 31, 30, "#2e8da6");
  rect(-9, -5, 18, 23, "#56bfd0");
  rect(-4, -7, 8, 24, "#d4ac55");
  rect(-12, 5, 24, 3, "#f1d06d");
  rect(-10, 14, 20, 3, "#8bdfe5");

  /* arms */
  rect(-30, -4, 12, 25, "#154966");
  rect(-34, 8, 11, 7, "#2d809a");
  rect(18, -5, 12, 28, "#143e61");
  rect(23, 6, 10, 7, "#2b7892");

  /* head / beard */
  rect(-14, -34, 28, 20, "#2c7e95");
  rect(-10, -36, 20, 6, "#4db5c3");
  rect(-12, -18, 24, 12, "#b7d8d2");
  rect(-8, -15, 16, 12, "#d8e7da");
  rect(-17, -10, 6, 5, "#d0a24f");
  rect(11, -10, 6, 5, "#bb8f45");

  /* face */
  rect(-10, -28, 7, 4, "#173148");
  rect(3, -28, 7, 4, "#173148");
  rect(-8, -27, 2, 2, "#fff4d3");
  rect(5, -27, 2, 2, "#fff4d3");

  /* crown */
  rect(-14, -41, 28, 6, "#b67e33");
  rect(-11, -47, 5, 8, "#e1b85f");
  rect(-2, -51, 5, 12, "#f0cc70");
  rect(6, -47, 5, 8, "#d9a84d");
  rect(-7, -39, 14, 4, "#8a5a2c");

  /* trident */
  rect(29, -49, 3, 87, "#b7863f");
  rect(25, -56, 3, 15, "#d8b95e");
  rect(34, -56, 3, 15, "#d2ad55");
  rect(30, -63, 3, 16, "#f1cf72");
  rect(24, -58, 13, 3, "#e4c262");
  rect(22, -53, 4, 4, "#c39a48");
  rect(34, -53, 4, 4, "#bd9140");

  /* water highlights */
  rect(-24, -1, 6, 2, "#a6eff0");
  rect(13, -2, 6, 2, "#8ee5ea");
  rect(-6, -3, 12, 2, "#d6f7f1");
  rect(-28, 23, 7, 2, "#5fc3d1");
  rect(18, 24, 8, 2, "#4fadc2");

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

function drawPlayerDamageEffect(time) {
  const remain = battleState.playerDamageUntil - time;
  if (remain <= 0) return;

  ctx.save();

  if (battleState.playerDamageFlashUntil > time) {
    ctx.globalAlpha = Math.min(0.30, (battleState.playerDamageFlashUntil - time) / 180);
    ctx.fillStyle = "#e35d72";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.globalAlpha = Math.min(1, remain / 260);
  pixelText(
    "-1",
    battleState.playerDamageX + 14,
    battleState.playerDamageY - (520 - remain) / 28,
    13,
    "#ffb1a6",
    "center"
  );

  ctx.restore();
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
