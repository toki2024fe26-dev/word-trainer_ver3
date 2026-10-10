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
    id: "skeleton-knight",
    name: "SKELETON KNIGHT",
    type: "skeleton-knight",
    description: "草原の古戦場をさまよう骸骨騎士。朽ちた盾と剣で侵入者を迎え撃つ。",
    rarity: "UNCOMMON",
    boss: false
  },
  {
    id: "magma-snail",
    name: "MAGMA SNAIL",
    type: "magma-snail",
    description: "溶岩をまとった黒曜石の殻を背負う火山の魔物。殻の割れ目から灼熱の光が漏れる。",
    rarity: "UNCOMMON",
    boss: false
  },
  {
    id: "firebird",
    name: "FIREBIRD",
    type: "firebird",
    description: "燃えさかる翼と炎の尾羽を持つ火の鳥。羽ばたくたび火の粉が舞う。",
    rarity: "RARE",
    boss: false
  },
  {
    id: "snowman-devil",
    name: "SNOWMAN DEVIL",
    type: "snowman-devil",
    description: "角と小さな悪魔の翼を持つ雪だるま。人をからかうような笑みで吹雪を呼ぶ。",
    rarity: "UNCOMMON",
    boss: false
  },
  {
    id: "chimera",
    name: "CHIMERA",
    type: "chimera",
    description: "獅子の頭と山羊の角、蛇の尾を持つ草原の幻獣。三つの獣の力を宿す。",
    rarity: "BOSS",
    boss: true
  },
  {
    id: "world-tree-tortoise",
    name: "WORLD TREE TORTOISE",
    type: "tree-turtle",
    description: "甲羅に古代の大樹を背負う森の守護者。大地と森の生命力を操る。",
    rarity: "BOSS",
    boss: true
  },
  {
    id: "snow-goddess",
    name: "SNOW GODDESS",
    type: "snow-goddess",
    description: "雪原に君臨する氷雪の女神。白銀の衣から吹雪と結晶を生み出す。",
    rarity: "BOSS",
    boss: true
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
  { id:"grassland", name:"GRASSLAND", jp:"草原", theme:"grassland", description:"風に揺れる草原。旅の始まりとなる最初のエリア。", enemies:["moon-slime","skeleton-knight"], boss:"chimera" },
  { id:"forest", name:"FOREST", jp:"森林", theme:"forest", description:"深い森の奥へ。木々の間から古代の魔物が姿を現す。", enemies:["forest-mandraga","shadow-bat"], boss:"world-tree-tortoise" },
  { id:"beach", name:"BEACH", jp:"砂浜", theme:"beach", description:"青い海と白い砂浜。潮騒の向こうに海の魔物が潜む。", enemies:["coral-shrimp","tidal-fish"], boss:"poseidon" },
  { id:"volcano", name:"VOLCANO", jp:"火山", theme:"volcano", description:"灼熱の大地。溶岩が流れる火口へ進め。", enemies:["magma-snail","firebird"], boss:"astral-dragon" },
  { id:"snowfield", name:"SNOWFIELD", jp:"雪原", theme:"snowfield", description:"吹雪に閉ざされた白銀の世界。亡霊の気配が漂う。", enemies:["phantom","snowman-devil"], boss:"snow-goddess" },
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
  defeatStartedAt: 0,
  defeatType: "",
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

  // 2日連続ログインごとにリカバリーエリクサーを1個獲得。
  const rewardMilestone = studyStreak - (studyStreak % 2);
  const rewardKey = `login-bonus-${rewardMilestone}`;
  const savedClaim = localStorage.getItem("pixelEnglishLoginBonusClaimV2") || "";
  const legacyClaim = localStorage.getItem("pixelEnglishRewardClaim") || "";
  // 旧バージョンですでに同じ日数の報酬を受け取っていた場合は重複配布しない。
  const claimed = savedClaim || (legacyClaim === `reward-${rewardMilestone}` ? rewardKey : "");

  if (studyStreak >= 2 && claimed !== rewardKey) {
    items.recovery += 1;
    localStorage.setItem("pixelEnglishLoginBonusClaimV2", rewardKey);
    showToast("2日連続ログインボーナス！\nリカバリーエリクサーを獲得！");
    playRewardSound();
  }
  updateRecoveryButton();
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
  updateRecoveryButton();

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
      <div class="reward-box"><div class="reward-icon">✦</div><div class="reward-copy"><strong id="recoveryCount">RECOVERY ELIXIR ×0</strong><small id="rewardMessage">2日連続ログインでエリクサーを獲得！</small></div></div>
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
  const previousDefeatStartedAt = battleState.defeatStartedAt;
  const previousDefeatType = battleState.defeatType;
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
    battleState.defeatStartedAt = 0;
    battleState.defeatType = "";
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
    battleState.defeatStartedAt = previousDefeatStartedAt;
    battleState.defeatType = previousDefeatType;
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
    const remain = Math.max(0, 2 - (studyStreak % 2));
    $("#rewardMessage").textContent =
      studyStreak > 0 && studyStreak % 2 === 0
        ? "2日連続ログイン達成！報酬獲得済み！"
        : `現在 ${studyStreak}日連続ログイン。あと ${remain}日で報酬！`;
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
  updateRecoveryButton();
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
    $("#battleMessage").textContent = "PLAYER DOWN... USE AN ELIXIR TO RECOVER";
  }
  startPlayerDamageAnimation();
  updateRecoveryButton();
  setTimeout(() => {
    // HPが0になった直後でも、所持エリクサーで回復できていれば戦闘を継続する。
    if (playerHp <= 0) {
      finishQuiz(true);
      return;
    }
    answerLocked = false;
    if (currentIndex >= quizWords.length) {
      finishQuiz();
    } else {
      nextQuestion();
    }
  }, 1200);
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
  updateRecoveryButton();

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

function updateRecoveryButton() {
  const button = $("#useRecoveryElixirBtn");
  if (!button) return;

  const label = $("#recoveryButtonLabel");
  if (label) {
    label.textContent = `✦ RECOVERY ELIXIR ×${Math.max(0, items.recovery || 0)}`;
  }

  const isBattle = currentScreen === "quizScreen";
  const canUse = isBattle && items.recovery > 0 && playerHp < PLAYER_MAX_HP;
  button.disabled = !canUse;
  button.classList.toggle("can-use", canUse);
  button.title = playerHp >= PLAYER_MAX_HP
    ? "ミスでHPが減っている時に使用できます。"
    : (items.recovery <= 0 ? "エリクサーを所持していません。" : "HPを1回復し、追加の問題を1問受け取ります。");
}

function useRecoveryElixir() {
  // 戦闘中かつ、ミスでHPが減っている場合のみ使用可能。
  if (currentScreen !== "quizScreen" || items.recovery <= 0 || playerHp >= PLAYER_MAX_HP) {
    updateRecoveryButton();
    return;
  }

  const confirmed = window.confirm(
    "リカバリーエリクサーを使いますか？\n\n" +
    "HPを1回復し、ミスで失ったチャンスを補う追加問題を1問受け取ります。"
  );
  if (!confirmed) return;

  // HPを1回復し、消費した問題枠を補うための追加問題を1問、末尾に加える。
  // まだ出題していない単語を優先し、すべて使用済みなら登録語から選ぶ。
  const allWords = normalizeWords(words);
  const usedKeys = new Set(quizWords.map(word => `${word.en.toLowerCase()}::${word.jp}`));
  const unusedWords = allWords.filter(word => !usedKeys.has(`${word.en.toLowerCase()}::${word.jp}`));
  const bonusPool = unusedWords.length ? unusedWords : allWords;
  const bonusQuestion = shuffle(bonusPool)[0];
  if (bonusQuestion) quizWords.push({ ...bonusQuestion });

  items.recovery--;
  playerHp = Math.min(PLAYER_MAX_HP, playerHp + 1);
  saveGameData();
  updatePlayerHp();
  // 問題数の分母が増えるため、進捗表示をその場で更新。
  if ($("#questionProgress")) {
    $("#questionProgress").style.width = `${(currentIndex / quizWords.length) * 100}%`;
  }
  playRewardSound();
  showToast("エリクサー使用！ HPを1回復＋追加問題を1問獲得！");

  if (playerHp > 0 && $("#battleMessage")?.textContent === "PLAYER DOWN... USE AN ELIXIR TO RECOVER") {
    $("#battleMessage").textContent = "RECOVERED! 戦闘続行！";
  }
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

    // ミスは通常どおりHPに反映。エリクサーは戦闘中の専用ボタンで手動使用する。
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
        `${correctCount} / ${quizWords.length}`;
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
          : (correctCount === quizWords.length ? "PERFECT CLEAR" : "QUEST COMPLETE"));
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
  battleState.defeatStartedAt = 0;
  battleState.defeatType = "";
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
  const stage = activeStages[currentStage];
  battleState.defeat = 1;
  battleState.defeatStartedAt = performance.now();
  battleState.defeatType = stage?.type || "";

  const defeatPalettes = {
    slime: ["#e8b8ec", "#b77ac8", "#fff0fb", "#7b4a88"],
    bat: ["#c6b8e6", "#7666a8", "#f2e5ff", "#39304f"],
    mandraga: ["#b7d875", "#6e9b49", "#f3e7ad", "#385b3f"],
    wolf: ["#bbc6d6", "#66758b", "#ffffff", "#384154"],
    phantom: ["#ddd2f6", "#9e91c7", "#fff5ff", "#615582"],
    golem: ["#cbd0d8", "#858c9a", "#ffd07a", "#4b5261"],
    shrimp: ["#ffb58c", "#e35c56", "#fff0c8", "#873149"],
    fish: ["#abf3ed", "#40bacb", "#e4fff4", "#195e7a"],
    poseidon: ["#9cebf0", "#e3c16d", "#ffffff", "#287a9a"],
    dragon: ["#ff8a78", "#d82c3d", "#ffd8b3", "#6d1023"],
    chimera: ["#f2c76b", "#bd7b35", "#fff0c1", "#527e43"],
    "tree-turtle": ["#b7dd83", "#729d52", "#f2d69a", "#42633b"],
    "snow-goddess": ["#f8ffff", "#9be8ff", "#d7b7bf", "#4b79a8"]
  };
  const type = stage?.monsterId === "void-emperor" || stage?.finalBoss ? "void-emperor" : (stage?.type || "");
  const palette = type === "void-emperor"
    ? ["#d78bf2", "#7850a1", "#6cece8", "#f6d27b", "#f18bd6"]
    : (defeatPalettes[type] || ["#f0b76a", "#d66c93", "#78a6c6", "#e7d28a", "#a18ac2"]);

  // First impact pop, then a second lighter burst gives the defeat a little depth.
  spawnParticles(235, 78, 48, palette);
  spawnParticles(235, 91, 18, ["#ffffff", palette[0], palette[1], palette[2] || "#e7d28a"]);
}

function spawnParticles(
  x,
  y,
  count,
  palette = null
) {
  const colors = palette || [
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
      grassland: 0.94,
      forest: 0.93,
      beach: 0.95,
      volcano: 0.96,
      snowfield: 0.94,
      ruins: 0.98
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

  drawStageAccentSparkles(currentDefinition.theme || currentDefinition.id, time, w, h);
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

  // Soft, distant glints remain in the atmospheric background layer.
  const palettes = {
    grassland: ["#fff3a6", "#ffffff", "#d8f6ff", "#ffc9d9", "#b6f08f"],
    forest: ["#d9ffb4", "#c6f8ec", "#f5f2b0", "#ffd5e8", "#8ce5d0"],
    beach: ["#fff0a8", "#d9fff7", "#ffffff", "#ffb9a7", "#f5aee9"],
    volcano: ["#ffd38a", "#ff9e6b", "#fff0b8", "#ff6d91", "#73e5e5"],
    snowfield: ["#e8fbff", "#bfeeff", "#ffffff", "#e4c8ff", "#ffcce8"],
    ruins: ["#e8c9ff", "#a9d4ff", "#fff0cb", "#ff9de5", "#70e8e7"]
  };

  const colors = palettes[theme] || palettes.grassland;
  const seeds = [
    [18, 26, 1], [46, 52, 1], [77, 33, 2], [104, 68, 1],
    [132, 24, 1], [158, 51, 2], [187, 31, 1], [214, 66, 1],
    [244, 39, 2], [271, 72, 1], [298, 29, 1], [309, 102, 1],
    [33, 87, 1], [69, 21, 1], [119, 45, 1], [173, 80, 1],
    [204, 18, 1], [260, 91, 1], [287, 49, 1], [142, 102, 1]
  ];

  for (let i = 0; i < seeds.length; i++) {
    const [baseX, baseY, size] = seeds[i];
    const wave = time / (760 + (i % 4) * 190) + i * 1.37;
    const pulse = (Math.sin(wave) + 1) / 2;
    if (pulse < 0.16) continue;

    const x = Math.round(baseX + Math.sin(time / 1700 + i) * 1.2);
    const y = Math.round(baseY + Math.cos(time / 1900 + i * .7) * 1.0);
    const alpha = .035 + pulse * .12;
    const c = colors[i % colors.length];

    ctx.save();
    ctx.globalAlpha = alpha;
    rect(x + size, y, size, size, c);
    rect(x, y + size, size, size, c);
    if (size > 1 && pulse > .55) rect(x + size, y + size, size, size, c);
    ctx.restore();
  }
}

// Crisp foreground pixel glints are composited after the background haze,
// so each stage keeps its pixel-art sparkle instead of blurring into a wash.
function drawStageAccentSparkles(theme, time, w, h) {
  if (!ctx) return;
  const palettes = {
    grassland: ["#fff5a6", "#ffb7d0", "#8af0db", "#d8ff8f", "#ffffff"],
    forest: ["#c7ff8f", "#72f0c4", "#fff09a", "#ffb7d5", "#f4fff7"],
    beach: ["#fff29a", "#7ff5eb", "#ff9fbd", "#ffffff", "#b8f5ff"],
    volcano: ["#ffdf79", "#ff7d66", "#ffb5df", "#7ef0e9", "#fff4c3"],
    snowfield: ["#f4ffff", "#8deaff", "#d5baff", "#ffbfe5", "#ffffff"],
    ruins: ["#e0b4ff", "#77ebf2", "#ffb9ed", "#ffe69a", "#ffffff"]
  };
  const colors = palettes[theme] || palettes.grassland;
  const points = [
    [24, 37], [51, 67], [80, 25], [98, 47], [125, 82], [146, 30],
    [170, 61], [193, 22], [222, 46], [246, 73], [275, 33], [298, 58],
    [39, 102], [88, 93], [184, 104], [285, 109], [63, 42], [115, 18],
    [158, 92], [208, 80], [260, 18], [307, 88], [18, 73], [232, 104]
  ];

  ctx.save();
  for (let i = 0; i < points.length; i++) {
    const [bx, by] = points[i];
    const pulse = (Math.sin(time / (185 + (i % 5) * 47) + i * 1.83) + 1) / 2;
    if (pulse < 0.12) continue;
    const driftX = Math.round(Math.sin(time / 640 + i * 0.6) * 1.2);
    const driftY = Math.round(Math.cos(time / 810 + i * 0.9) * 1.0);
    const x = bx + driftX;
    const y = by + driftY;
    const color = colors[i % colors.length];
    ctx.globalAlpha = 0.22 + pulse * 0.62;

    if (i % 3 === 0) {
      // Four-point pixel star: broad enough to sparkle, still fully blocky.
      rect(x - 1, y, 3, 1, color);
      rect(x, y - 1, 1, 3, color);
      if (pulse > 0.64) {
        rect(x, y, 1, 1, "#ffffff");
        rect(x + 2, y - 2, 1, 1, colors[(i + 2) % colors.length]);
      }
    } else if (i % 3 === 1) {
      rect(x, y, pulse > 0.72 ? 2 : 1, pulse > 0.72 ? 2 : 1, color);
      if (pulse > 0.76) rect(x + 2, y - 1, 1, 1, "#ffffff");
    } else {
      rect(x, y, 2, 1, color);
      rect(x + 1, y - 1, 1, 3, color);
      if (pulse > 0.7) rect(x + 1, y, 1, 1, "#ffffff");
    }
  }
  ctx.restore();
}

function drawStageColorWash(theme, w, h) {
  if (!ctx) return;
  const palettes = {
    grassland: {
      vertical: [[0, "rgba(255,218,132,.23)"], [.42, "rgba(155,213,180,.08)"], [1, "rgba(39,104,55,.24)"]],
      horizontal: [[0, "rgba(255,224,143,.11)"], [.52, "rgba(114,198,181,.04)"], [1, "rgba(85,151,211,.12)"]],
      glow: [246, 32, "rgba(255,224,135,.20)"]
    },
    forest: {
      vertical: [[0, "rgba(92,177,145,.22)"], [.48, "rgba(45,126,91,.12)"], [1, "rgba(16,62,47,.28)"]],
      horizontal: [[0, "rgba(139,190,101,.14)"], [.55, "rgba(41,118,88,.04)"], [1, "rgba(47,135,113,.17)"]],
      glow: [115, 66, "rgba(151,214,111,.15)"]
    },
    beach: {
      vertical: [[0, "rgba(130,226,245,.25)"], [.48, "rgba(57,174,196,.12)"], [.70, "rgba(255,220,145,.10)"], [1, "rgba(233,184,102,.27)"]],
      horizontal: [[0, "rgba(93,190,215,.12)"], [.50, "rgba(255,255,231,.04)"], [1, "rgba(255,209,123,.16)"]],
      glow: [252, 25, "rgba(255,237,166,.23)"]
    },
    volcano: {
      vertical: [[0, "rgba(82,42,82,.26)"], [.45, "rgba(171,63,58,.12)"], [.78, "rgba(229,86,47,.17)"], [1, "rgba(87,25,34,.29)"]],
      horizontal: [[0, "rgba(95,47,99,.14)"], [.56, "rgba(220,77,48,.07)"], [1, "rgba(255,150,71,.15)"]],
      glow: [76, 87, "rgba(255,112,54,.21)"]
    },
    snowfield: {
      vertical: [[0, "rgba(193,230,255,.24)"], [.45, "rgba(116,192,230,.12)"], [.78, "rgba(226,244,250,.16)"], [1, "rgba(250,255,255,.28)"]],
      horizontal: [[0, "rgba(153,208,245,.13)"], [.52, "rgba(245,252,255,.07)"], [1, "rgba(171,229,239,.15)"]],
      glow: [166, 48, "rgba(229,252,255,.23)"]
    },
    ruins: {
      vertical: [[0, "rgba(112,79,174,.27)"], [.42, "rgba(63,81,151,.14)"], [.74, "rgba(76,49,123,.16)"], [1, "rgba(28,19,53,.30)"]],
      horizontal: [[0, "rgba(77,68,150,.12)"], [.52, "rgba(71,98,183,.06)"], [1, "rgba(167,82,180,.15)"]],
      glow: [256, 28, "rgba(173,116,226,.17)"]
    }
  };
  const palette = palettes[theme] || palettes.grassland;
  ctx.save();
  // source-atop tints only the already-painted background, never drawing beyond its silhouette.
  ctx.globalCompositeOperation = "source-atop";
  let gradient = ctx.createLinearGradient(0, 0, 0, h);
  for (const [stop, color] of palette.vertical) gradient.addColorStop(stop, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  gradient = ctx.createLinearGradient(0, 0, w, 0);
  for (const [stop, color] of palette.horizontal) gradient.addColorStop(stop, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const [gx, gy, glowColor] = palette.glow;
  const glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, 66);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
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

  // ステージごとの色相グラデーションを背景全体に重ね、空・遠景・地面に色の深みを出す。
  // 輪郭をぼかさず、色だけを穏やかに混ぜてピクセルのシルエットを保つ。
  drawStageColorWash(theme, w, h);

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

/* =========================================================
   HERO — 参考イラストをベースにしたピクセル版リビルド
   大きな金髪の頭・青い瞳・笑顔・王冠・銀鎧・青マントと盾
   ========================================================= */
function drawHero(time) {
  const attack = battleState.attack;
  // 待機時は足元・頭を固定し、肩〜胸だけをゆっくり上下させる。
  // 8フレームで吸って吐く呼吸にし、全身が上下に跳ねる動きは避ける。
  const breathingFrame = Math.floor(time / 240) % 8;
  const shoulderBreath = attack > 0 ? 0 : [0, -1, -1, 0, 0, 1, 1, 0][breathingFrame];
  // マントは上部と裾で位相をずらし、風を受けてひらひら動かす。
  const capeSwing = Math.round(Math.sin(time / 185) * 2);
  const capeTailSwing = Math.round(Math.sin(time / 132 + 1.15) * 3);
  const capeFoldSwing = Math.round(Math.sin(time / 160 + 2.25) * 2);

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
  // 立ち位置は固定。被ダメージ時だけ y / x に揺れを足す。
  const y = 94 + damageShake;
  const upperY = y;
  const fx = x + 2;

  // 足元の影。脚を短くした体型に合わせ、影もブーツの直下へ。
  ctx.save();
  ctx.globalAlpha = 0.30;
  rect(x - 16, y + 48, 7, 2, '#171725');
  rect(x - 9, y + 49, 18, 2, '#171725');
  rect(x + 9, y + 48, 7, 2, '#171725');
  ctx.restore();

  // マントは肩から裾までつながった一枚の布。
  // 各段の上下に縁取りを描かず、外周だけをピクセル状に縁取る。
  // 一続きのグラデーションを各段へ共通適用し、横線で分断された印象をなくす。
  const capeRows = [
    { y: 12, h: 4, left: 8,  right: 7 },
    { y: 15, h: 4, left: 12, right: 8 },
    { y: 18, h: 4, left: 17, right: 9 },
    { y: 21, h: 4, left: 21, right: 10 },
    { y: 24, h: 4, left: 25, right: 11 },
    { y: 27, h: 4, left: 28, right: 12 },
    { y: 30, h: 4, left: 29, right: 13 },
    { y: 33, h: 4, left: 27, right: 14 },
    { y: 36, h: 3, left: 23, right: 15 }
  ];
  const capeWaveAt = i => Math.round(
    capeSwing * 0.15 + (i / (capeRows.length - 1)) * capeTailSwing * 0.7
  );
  const capeGradient = ctx.createLinearGradient(
    x - 31, upperY + 36,
    x - 7, upperY + 13
  );
  capeGradient.addColorStop(0, '#26365f');
  capeGradient.addColorStop(0.27, '#31538b');
  capeGradient.addColorStop(0.52, '#497bc0');
  capeGradient.addColorStop(0.73, '#689ed8');
  capeGradient.addColorStop(1, '#3b5d98');

  ctx.save();
  // まず布の面を塗る。各段は1pxだけ重ね、色境界も縁取りも横断させない。
  capeRows.forEach((row, i) => {
    const wave = capeWaveAt(i);
    const rowX = x - row.left - wave;
    const rowRight = x - row.right + 2 - wave;
    rect(rowX, upperY + row.y, rowRight - rowX, row.h, capeGradient);
  });

  // 外側の輪郭だけを階段状に縁取る。段ごとの上下線は描かない。
  let previousLeft = null;
  capeRows.forEach((row, i) => {
    const wave = capeWaveAt(i);
    const rowY = upperY + row.y;
    const leftEdge = x - row.left - wave;
    rect(leftEdge, rowY, 1, row.h, '#19264c');

    if (previousLeft !== null && leftEdge !== previousLeft) {
      const stepX = Math.min(previousLeft, leftEdge);
      const stepW = Math.abs(leftEdge - previousLeft) + 1;
      rect(stepX, rowY, stepW, 1, '#19264c');
    }
    previousLeft = leftEdge;
  });
  // 裾は最後の一辺だけを濃紺で締め、布の外周に見えるようにする。
  const lastCapeRow = capeRows[capeRows.length - 1];
  const lastCapeWave = capeWaveAt(capeRows.length - 1);
  const hemX = x - lastCapeRow.left - lastCapeWave;
  const hemRight = x - lastCapeRow.right + 2 - lastCapeWave;
  rect(hemX, upperY + lastCapeRow.y + lastCapeRow.h - 1,
       hemRight - hemX, 1, '#19264c');

  // 布面の折り目は、線ではなく小さな明暗ピクセルのかたまりで表現。
  // 全段を横切らないので、一枚の布の連続したグラデーションを保つ。
  const foldWave = capeWaveAt(4);
  rect(x - 25 - foldWave, upperY + 25, 4, 2, '#73a5dc');
  rect(x - 21 - foldWave, upperY + 22, 4, 2, '#82b2e3');
  rect(x - 17 - foldWave, upperY + 20, 3, 2, '#78a9dc');
  rect(x - 21 - foldWave, upperY + 28, 3, 2, '#31558f');
  rect(x - 18 - foldWave, upperY + 26, 3, 2, '#3a67a7');
  ctx.restore();

  // 画像で丸く示された後ろ髪の束だけを約半分の長さに短縮。
  // 顔沿いの横髪は後段で別に描画するため、そちらの長さには触れない。
  rect(x - 28, upperY + 1, 8, 8, '#849746');
  rect(x - 30, upperY + 4, 7, 7, '#cbdc7b');
  rect(x - 33, upperY + 9, 9, 6, '#b8cf6c');
  rect(x - 36, upperY + 14, 7, 3, '#c9dd7b');
  rect(x - 33, upperY + 16, 5, 2, '#b2ca65');
  rect(x - 30, upperY + 17, 3, 1, '#dce88f');
  rect(x - 28, upperY + 3, 6, 3, '#f0e99b');

  // 大きく丸い後ろ髪のシルエット。
  rect(x - 18, upperY - 29, 36, 6, '#6b7f3b');
  rect(x - 23, upperY - 25, 46, 10, '#809346');
  rect(x - 26, upperY - 19, 52, 18, '#819548');
  rect(x - 25, upperY - 5, 50, 11, '#74883d');
  // 後ろ髪だけを短いボブ状に。横髪（サイドの束）は触らず、襟・顎より上で止める。
  rect(x - 21, upperY + 4, 42, 3, '#6a7f37');
  rect(x - 17, upperY + 7, 34, 1, '#637834');

  // 黄緑がかった淡い金髪。ハイライトは大きなピクセルの塊で表現。
  rect(x - 20, upperY - 25, 40, 7, '#d6e68a');
  rect(x - 23, upperY - 20, 45, 10, '#cbdc7b');
  rect(x - 23, upperY - 12, 46, 10, '#c1d471');
  rect(x - 21, upperY - 4, 42, 11, '#b1c965');
  rect(x - 17, upperY + 5, 34, 4, '#a3bc5b');
  rect(x - 17, upperY - 26, 13, 3, '#f2f4ad');
  rect(x - 10, upperY - 23, 13, 3, '#eaf09e');
  rect(x + 4, upperY - 20, 10, 3, '#e7ed98');
  rect(x - 24, upperY - 14, 4, 8, '#dfe991');
  rect(x + 19, upperY - 10, 4, 7, '#e6ee9a');

  // 三つ山の王冠。中央の突起を一番高くして金の縁取りを入れる。
  rect(x - 10, upperY - 33, 22, 4, '#92661f');
  rect(x - 9, upperY - 32, 20, 3, '#e0ae3d');
  rect(x - 8, upperY - 38, 5, 7, '#b78322');
  rect(x - 10, upperY - 40, 6, 4, '#f3cc56');
  rect(x - 7, upperY - 38, 3, 6, '#ffe68c');
  rect(x - 2, upperY - 43, 6, 12, '#c89226');
  rect(x - 4, upperY - 45, 8, 5, '#f5d56e');
  rect(x - 2, upperY - 43, 4, 9, '#ffe99b');
  rect(x + 6, upperY - 39, 5, 8, '#b57e20');
  rect(x + 5, upperY - 41, 7, 4, '#f0c653');
  rect(x + 7, upperY - 38, 2, 5, '#ffe58a');
  rect(x - 8, upperY - 32, 18, 2, '#fff0a0');
  rect(x + 0, upperY - 32, 4, 2, '#5a91dc');
  rect(x - 5, upperY - 39, 2, 2, '#fff4be');
  rect(x + 0, upperY - 43, 2, 2, '#fff8cf');
  rect(x + 8, upperY - 39, 2, 2, '#fff1ad');

  // 顔の外周と肌。横幅を広げ、高さを抑えた楕円形の輪郭にする。
  // 上下を段階的に細くし、ピクセルアートらしい丸みを作る。
  rect(fx - 13, upperY - 13, 28, 3, '#8e7950');
  rect(fx - 19, upperY - 10, 40, 4, '#8e7950');
  rect(fx - 22, upperY - 6, 44, 12, '#8e7950');
  rect(fx - 20, upperY + 6, 40, 5, '#8e7950');
  rect(fx - 14, upperY + 11, 28, 3, '#8e7950');
  rect(fx - 12, upperY - 12, 28, 3, '#f0e4c4');
  rect(fx - 18, upperY - 9, 38, 4, '#f0e4c4');
  rect(fx - 20, upperY - 5, 40, 11, '#fff1d7');
  rect(fx - 18, upperY + 6, 36, 4, '#fff1d7');
  rect(fx - 12, upperY + 10, 24, 3, '#f0dfbd');
  // 顎下の緑色の髪が髭に見えないよう、肌色で幅広く塗り直して輪郭を整える。
  rect(fx - 14, upperY + 11, 28, 2, '#fff1d7');
  rect(fx - 12, upperY + 13, 24, 2, '#f0dfbd');
  rect(fx - 10, upperY + 15, 20, 1, '#8e7950');
  rect(fx - 18, upperY - 3, 2, 9, '#f8eacb');
  rect(fx + 17, upperY - 2, 2, 9, '#eddbb7');

  // 前髪。頭の丸みを残しつつ、短い束が額にかかる。
  rect(fx - 16, upperY - 13, 31, 4, '#b6cc69');
  rect(fx - 15, upperY - 11, 9, 5, '#deeb91');
  rect(fx - 7, upperY - 12, 7, 7, '#d1e17e');
  rect(fx - 1, upperY - 11, 7, 6, '#e5ee9a');
  rect(fx + 5, upperY - 10, 8, 5, '#bfd572');
  rect(fx - 12, upperY - 10, 3, 3, '#f0f5a8');
  rect(fx - 3, upperY - 9, 2, 2, '#f6f6b0');

  // 大きな青い瞳。濃いまつ毛、青い虹彩、黒い瞳孔、白いハイライトの順。
  rect(fx - 16, upperY - 5, 14, 3, '#302943');
  rect(fx + 2, upperY - 5, 16, 3, '#302943');
  rect(fx - 17, upperY - 3, 3, 8, '#302943');
  rect(fx + 17, upperY - 3, 3, 8, '#302943');
  rect(fx - 15, upperY - 3, 12, 12, '#342b49');
  rect(fx + 2, upperY - 3, 16, 12, '#342b49');
  rect(fx - 13, upperY - 1, 9, 9, '#fffdf4');
  rect(fx + 4, upperY - 1, 12, 9, '#fffdf4');
  rect(fx - 11, upperY - 2, 7, 10, '#137edb');
  rect(fx + 6, upperY - 2, 8, 10, '#1685e7');
  rect(fx - 10, upperY, 6, 6, '#4bc1ff');
  rect(fx + 7, upperY, 6, 6, '#55c5ff');
  rect(fx - 9, upperY + 3, 5, 5, '#174bb3');
  rect(fx + 8, upperY + 3, 5, 5, '#174bb3');
  rect(fx - 7, upperY + 1, 3, 6, '#17192c');
  rect(fx + 9, upperY + 1, 4, 6, '#17192c');
  rect(fx - 12, upperY - 1, 3, 3, '#ffffff');
  rect(fx - 5, upperY + 1, 2, 2, '#ffffff');
  rect(fx + 5, upperY - 1, 3, 3, '#ffffff');
  rect(fx + 13, upperY + 1, 2, 2, '#ffffff');
  rect(fx - 14, upperY + 7, 2, 2, '#d6efff');
  rect(fx + 15, upperY + 7, 2, 2, '#d6efff');

  // 眉と頬の赤み。
  rect(fx - 13, upperY - 8, 8, 2, '#8c794b');
  rect(fx + 5, upperY - 8, 9, 2, '#8c794b');
  rect(fx - 17, upperY + 8, 4, 2, '#f6a28c');
  rect(fx - 15, upperY + 10, 3, 2, '#ffb49b');
  rect(fx + 15, upperY + 8, 4, 2, '#f6a28c');
  rect(fx + 16, upperY + 10, 3, 2, '#ffb49b');

  // 小さなW字型の口。控えめな赤茶色で、口角のある可愛い表情にする。
  rect(fx - 5, upperY + 12, 2, 1, '#a64b4c');
  rect(fx - 4, upperY + 13, 2, 1, '#a64b4c');
  rect(fx - 2, upperY + 12, 2, 1, '#a64b4c');
  rect(fx,     upperY + 13, 2, 1, '#a64b4c');
  rect(fx + 2, upperY + 12, 2, 1, '#a64b4c');
  rect(fx - 5, upperY + 11, 1, 1, '#d66b61');
  rect(fx + 4, upperY + 11, 1, 1, '#d66b61');

  // 耳元から肩へ落ちる横髪は、希望に合わせてv30の長さに戻す。
  rect(x - 22, upperY + 5, 5, 12, '#c3d875');
  rect(x - 21, upperY + 12, 4, 8, '#dce990');
  rect(x - 18, upperY + 16, 3, 3, '#a6bf5e');
  rect(x + 20, upperY + 4, 5, 12, '#b4ca67');
  rect(x + 20, upperY + 12, 4, 8, '#d5e584');
  rect(x + 21, upperY + 17, 3, 3, '#94ad4f');

  // 首は描かず、顔のすぐ下に鎧の襟を置いて頭と胴体を自然につなぐ。
  rect(fx - 6, upperY + 15, 13, 3, '#343b4c');
  rect(fx - 4, upperY + 15, 9, 2, '#e6e9ed');
  rect(fx - 1, upperY + 15, 3, 2, '#aab4c0');

  // 脚は前回よりさらに短く、頭の大きいデフォルメ体型に合わせる。
  // すねを約半分の長さにし、ブーツは少し大きめにして接地感を残す。
  rect(x - 5, upperY + 31, 5, 8, '#424a58');
  rect(x + 2, upperY + 31, 6, 8, '#394250');
  rect(x - 4, upperY + 32, 3, 5, '#d9dfe4');
  rect(x + 3, upperY + 32, 3, 5, '#b7c0cb');
  rect(x - 9, upperY + 38, 13, 9, '#2b3341');
  rect(x + 0, upperY + 38, 15, 9, '#252d39');
  rect(x - 7, upperY + 38, 9, 5, '#e1e4e6');
  rect(x + 2, upperY + 38, 10, 5, '#c5ccd5');
  rect(x - 7, upperY + 44, 10, 2, '#9ca8b8');
  rect(x + 2, upperY + 44, 11, 2, '#909cac');
  rect(x - 6, upperY + 46, 8, 1, '#f5f6f2');
  rect(x + 4, upperY + 46, 8, 1, '#edf0ef');

  // 肩・胸鎧・腕・腰アーマーを約2/3に縮小。大きな頭はそのままにする。
  ctx.save();
  // 顎のすぐ下に肩当てが来るよう、鎧全体を上へ寄せる。
  ctx.translate(fx, upperY + 16);
  ctx.scale(0.67, 0.67);
  ctx.translate(-fx, -(upperY + 21));

  // 呼吸アニメは肩〜胸〜腕だけに適用。頭・脚・足元の影は動かさない。
  // 0.67倍の縮小後に画面上で約1px動くよう補正する。
  ctx.save();
  if (shoulderBreath !== 0) ctx.translate(0, shoulderBreath / 0.67);

  // 肩当てと銀色の胸鎧。大きな白銀の面と濃い縁で立体感を作る。
  rect(fx - 16, upperY + 21, 11, 9, '#4b5260');
  rect(fx - 15, upperY + 21, 9, 6, '#d5dbe2');
  rect(fx - 14, upperY + 22, 7, 3, '#f7f8f7');
  rect(fx + 8, upperY + 21, 11, 9, '#4b5260');
  rect(fx + 9, upperY + 21, 9, 6, '#c4ccd6');
  rect(fx + 10, upperY + 22, 7, 3, '#f7f8f7');
  rect(fx - 11, upperY + 22, 29, 16, '#424a59');
  rect(fx - 9, upperY + 22, 25, 13, '#aeb7c2');
  rect(fx - 7, upperY + 23, 21, 10, '#e4e7eb');
  rect(fx - 5, upperY + 23, 17, 3, '#fbfcfa');
  rect(fx - 2, upperY + 26, 3, 7, '#c0c8d2');
  rect(fx + 6, upperY + 26, 3, 7, '#9ca7b4');
  rect(fx + 11, upperY + 25, 4, 8, '#737f8e');
  rect(fx - 7, upperY + 33, 20, 3, '#737e8c');

  // 腕と金色のガントレット。右手は剣の柄の位置につなげる。
  rect(fx + 11, upperY + 23, 7, 7, '#626c7a');
  rect(fx + 12, upperY + 23, 5, 3, '#f0f2f2');
  rect(fx + 14, upperY + 27, 7, 6, '#916e32');
  rect(fx + 15, upperY + 27, 5, 3, '#d9b260');
  rect(fx + 16, upperY + 30, 4, 3, '#6e542a');
  rect(fx + 17, upperY + 28, 3, 2, '#f0d27c');

  // 腰の位置は固定するため、呼吸の変形はここで終了。
  ctx.restore();

  // 腰のプレートと、参考絵の短いプリーツスカート型アーマー。
  rect(fx - 10, upperY + 35, 26, 5, '#343c4a');
  rect(fx - 8, upperY + 36, 22, 4, '#b6bec8');
  rect(fx - 7, upperY + 36, 6, 8, '#e3e6e9');
  rect(fx - 1, upperY + 36, 6, 9, '#f2f2ee');
  rect(fx + 5, upperY + 36, 6, 8, '#bdc5cf');
  rect(fx + 11, upperY + 35, 4, 7, '#8994a2');
  rect(fx - 5, upperY + 38, 2, 5, '#9da7b3');
  rect(fx + 1, upperY + 39, 2, 5, '#9da7b3');
  rect(fx + 7, upperY + 38, 2, 5, '#7e8997');
  rect(fx - 1, upperY + 34, 7, 4, '#d3a34a');
  rect(fx + 1, upperY + 34, 3, 2, '#ffdf82');

  ctx.restore();

  // 盾と剣も肩の呼吸に同期してわずかに上下する。
  // 胴体だけが動いて見えないよう、両腕の先までひと続きの動きにする。
  ctx.save();
  if (shoulderBreath !== 0) ctx.translate(0, shoulderBreath);

  // 盾は手前に配置。銀の縁、青い面、白い「e」の紋章。
  rect(fx - 23, upperY + 23, 16, 20, '#343b4c');
  rect(fx - 22, upperY + 24, 14, 17, '#8a929f');
  rect(fx - 20, upperY + 25, 11, 15, '#243781');
  rect(fx - 19, upperY + 26, 2, 11, '#5f7fdb');
  rect(fx - 17, upperY + 27, 7, 2, '#ffffff');
  rect(fx - 19, upperY + 29, 2, 4, '#ffffff');
  rect(fx - 17, upperY + 31, 7, 2, '#ffffff');
  rect(fx - 16, upperY + 33, 2, 4, '#ffffff');
  rect(fx - 15, upperY + 36, 6, 2, '#ffffff');
  rect(fx - 20, upperY + 40, 10, 2, '#1b285b');
  rect(fx - 18, upperY + 42, 7, 2, '#8a929f');
  rect(fx - 16, upperY + 44, 3, 1, '#343b4c');

  // 大剣は小さくなった右手に柄を合わせつつ、剣身は大きく保つ。
  drawSword(fx + 12, upperY + 24, swordPhase);
  ctx.restore();
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
  if (type === "fish" || type === "poseidon" || type === "wolf" || type === "golem" || type === "dragon" || type === "chimera" || type === "tree-turtle" || type === "snow-goddess" || type === "skeleton-knight" || type === "magma-snail" || type === "firebird" || type === "snowman-devil") return;
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
  if (type === "fish" || type === "poseidon" || type === "wolf" || type === "golem" || type === "dragon" || type === "chimera" || type === "tree-turtle" || type === "snow-goddess" || type === "skeleton-knight" || type === "magma-snail" || type === "firebird" || type === "snowman-devil") return;

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
  if (!ctx || battleState.defeat > 0) return;
  const stage = activeStages[currentStage];
  if (!stage) return;
  const type = stage.type;
  if (type === "fish" || type === "poseidon" || type === "wolf" || type === "golem" || type === "dragon" || type === "chimera" || type === "tree-turtle" || type === "snow-goddess" || type === "skeleton-knight" || type === "magma-snail" || type === "firebird" || type === "snowman-devil") return;
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
  if (!ctx || battleState.defeat > 0) return;
  const stage = activeStages[currentStage];
  if (!stage) return;

  const type = stage.type;
  if (type === "fish" || type === "poseidon" || type === "wolf" || type === "golem" || type === "dragon" || type === "chimera" || type === "tree-turtle" || type === "snow-goddess" || type === "skeleton-knight" || type === "magma-snail" || type === "firebird" || type === "snowman-devil") return;
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
    // Keep the updated goofy eyes and dangling tongue unobstructed.
    rect(-22, -12, 3, 2, "#f4d8ec");
    rect(-5, -17, 3, 2, "#fff4f8");
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
  const stage = activeStages[currentStage];
  if (!stage) return;

  const idleFrame = getIdleFrame(time);
  const idleBob = getIdleBob(idleFrame);
  const type = stage.type;
  const isEmperor = stage.monsterId === "void-emperor" || !!stage.finalBoss;
  const renderType = isEmperor ? "void-emperor" : type;

  // Each sprite has its own drawing origin and ground pivot. Defeat motion is
  // applied around the feet/base so the monster recoils and topples naturally.
  const roots = {
    slime: { y: 83 + idleBob, ground: 42 },
    bat: { y: 76 + idleBob, ground: 35 },
    "skeleton-knight": { y: 78 + idleBob, ground: 47 },
    "magma-snail": { y: 86 + idleBob, ground: 37 },
    firebird: { y: 67 + Math.round(Math.sin(time / 145) * 2), ground: 52 },
    "snowman-devil": { y: 81 + idleBob, ground: 43 },
    dragon: { y: 72 + idleBob, ground: isEmperor ? 53 : 52 },
    chimera: { y: 78 + idleBob, ground: 49 },
    "tree-turtle": { y: 80 + idleBob, ground: 49 },
    "snow-goddess": { y: 85 + Math.round(idleBob * 0.25), ground: 42 },
    mandraga: { y: 82 + idleBob, ground: 40 },
    wolf: { y: 84 + idleBob, ground: 42 },
    phantom: { y: 78 + idleBob, ground: 40 },
    golem: { y: 76 + idleBob, ground: 51 },
    shrimp: { y: 82 + idleBob, ground: 35 },
    fish: { y: 78 + idleBob, ground: 33 },
    poseidon: { y: 68 + idleBob, ground: 60 }
  };
  const root = roots[type] || { y: 82 + idleBob, ground: 42 };
  const originY = root.y;
  const groundY = originY + root.ground;

  let progress = 0;
  const isDefeating = battleState.defeat > 0 && battleState.defeatStartedAt > 0;
  if (isDefeating) {
    progress = Math.max(0, Math.min(1, (time - battleState.defeatStartedAt) / 1180));
  }

  // Three beats: a sharp recoil, a helpless wobble with a defeated face, then
  // a pixel burst as the enemy shrinks and dissolves out of the arena.
  let shiftX = 0, shiftY = 0, rotation = 0, squashX = 1, squashY = 1, alpha = 1;
  if (isDefeating) {
    if (progress < 0.16) {
      const p = progress / 0.16;
      const recoil = Math.sin(p * Math.PI);
      shiftX = -Math.round(4 * p);
      shiftY = -Math.round(2 * recoil);
      rotation = -0.055 * recoil;
      squashX = 1 + 0.075 * recoil;
      squashY = 1 - 0.09 * recoil;
    } else if (progress < 0.52) {
      const p = (progress - 0.16) / 0.36;
      shiftX = -Math.round(4 + 7 * p);
      shiftY = Math.round(1 + 4 * p);
      rotation = -0.02 + 0.20 * p;
      squashX = 1.075 - 0.12 * p;
      squashY = 0.91 + 0.10 * p;
    } else {
      const p = (progress - 0.52) / 0.48;
      shiftX = -Math.round(11 + 5 * p);
      shiftY = Math.round(5 - 19 * p);
      rotation = 0.18 + 0.23 * p;
      squashX = 0.955 - 0.48 * p;
      squashY = 1.01 - 0.55 * p;
      alpha = Math.max(0, 1 - p);
    }
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  if (isDefeating) {
    ctx.translate(235 + shiftX, groundY + shiftY);
    ctx.rotate(rotation);
    ctx.scale(squashX, squashY);
    ctx.translate(-235, -groundY);
  }

  if (type === "slime") drawSlime(235, originY, 1, time);
  if (type === "bat") drawBat(235, originY, 1, time);
  if (type === "skeleton-knight") drawSkeletonKnight(235, originY, 1, time);
  if (type === "magma-snail") drawMagmaSnail(235, originY, 1, time);
  if (type === "firebird") drawFirebird(235, originY, 1, time);
  if (type === "snowman-devil") drawSnowmanDevil(235, originY, 1, time);
  if (type === "dragon") {
    if (isEmperor) {
      drawVoidEmperorAura(time);
      drawVoidEmperor(235, originY, 1.03, time);
    } else {
      drawDragon(235, originY, 1, time);
    }
  }
  if (type === "chimera") drawChimera(235, originY, 1.02, time);
  if (type === "tree-turtle") drawWorldTreeTortoise(235, originY, 1.02, time);
  if (type === "snow-goddess") drawSnowGoddess(235, originY, 1, time);
  if (type === "mandraga") drawMandraga(235, originY, 1, time);
  if (type === "wolf") drawWolf(235, originY, 1, time);
  if (type === "phantom") drawPhantom(235, originY, 1, time);
  if (type === "golem") drawGolem(235, originY, 1, time);
  if (type === "shrimp") drawShrimp(235, originY, 1, time);
  if (type === "fish") drawFish(235, originY, 1, time);
  if (type === "poseidon") drawPoseidon(235, originY, 1, time);

  if (isDefeating && progress >= 0.17 && progress < 0.60) {
    drawMonsterDefeatFace(renderType, 235, originY, progress, time);
  }

  // A few timed impact stars, in addition to the flying square particles.
  if (isDefeating && progress < 0.28) {
    const sparkAlpha = Math.max(0, 1 - progress / 0.28);
    ctx.save();
    ctx.globalAlpha = sparkAlpha;
    const j = Math.round(Math.sin(time / 25) * 2);
    rect(198 + j, originY - 10, 3, 3, "#ffffff");
    rect(268 - j, originY - 23, 2, 2, "#ffe8a6");
    rect(258 + j, originY + 8, 3, 2, "#f5fbff");
    ctx.restore();
  }

  ctx.restore();

  /* FLASH */
  if (battleState.flashUntil > performance.now()) {
    ctx.save();
    ctx.globalAlpha = .72;
    rect(160, 35, 120, 100, "#ffffff");
    ctx.restore();
  }
}

function drawMonsterDefeatFace(type, x, y, progress, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.min(1, (progress - 0.15) * 10) * Math.min(1, (0.62 - progress) * 9);

  const eyeJitter = Math.round(Math.sin(time / 22) * 1);
  const drawXEye = (cx, cy, ink = "#291b31", light = "#fff1e9") => {
    rect(cx - 3, cy - 3, 7, 7, ink);
    rect(cx - 2 + eyeJitter, cy - 2, 2, 2, light);
    rect(cx + 1 + eyeJitter, cy - 2, 2, 2, light);
    rect(cx - 1 + eyeJitter, cy - 1, 2, 2, light);
    rect(cx - 2 + eyeJitter, cy + 1, 2, 2, light);
    rect(cx + 1 + eyeJitter, cy + 1, 2, 2, light);
  };
  const drawMouth = (mx, my, lip = "#d7778d") => {
    rect(mx - 4, my - 3, 8, 7, "#241a2b");
    rect(mx - 2, my - 1, 4, 4, "#120f1e");
    rect(mx - 1, my + 2, 3, 2, lip);
    rect(mx - 3, my - 3, 2, 1, "#fff4e8");
  };
  const tinySplat = (sx, sy, color = "#fff4e8") => {
    rect(sx, sy, 2, 2, color);
    rect(sx + 3, sy - 2, 2, 2, color);
    rect(sx + 4, sy + 2, 2, 2, color);
  };

  switch (type) {
    case "slime":
      drawXEye(-9, 1, "#4a2d59", "#fff8fc");
      drawXEye(9, 1, "#4a2d59", "#fff8fc");
      drawMouth(1, 12, "#f28bab");
      rect(6, 16, 3, 5, "#f28bab");
      break;
    case "bat":
      drawXEye(-6, -4, "#322844", "#f8e9fa");
      drawXEye(6, -4, "#322844", "#f8e9fa");
      drawMouth(0, 4, "#ce8197");
      break;
    case "mandraga":
      drawXEye(-10, 1, "#263528", "#e5f5bf");
      drawXEye(9, 1, "#263528", "#e5f5bf");
      drawMouth(1, 12, "#9ebd6e");
      break;
    case "wolf":
      drawXEye(-28, -25, "#242638", "#f5f0e6");
      drawXEye(-18, -25, "#242638", "#f5f0e6");
      drawMouth(-38, -16, "#c2c5c7");
      break;
    case "phantom":
      drawXEye(-11, -15, "#4c456a", "#fff5ff");
      drawXEye(11, -15, "#4c456a", "#fff5ff");
      drawMouth(0, 6, "#c5bce8");
      break;
    case "golem":
      // Short-circuiting eyes, with a jagged gold spark across the brow.
      rect(-12, -40, 9, 4, "#252a37"); rect(3, -40, 9, 4, "#252a37");
      rect(-10, -39, 2, 2, "#ffe3a0"); rect(5, -38, 2, 2, "#ffe3a0");
      rect(-3, -34, 3, 2, "#252a37"); rect(1, -34, 3, 2, "#252a37");
      break;
    case "shrimp":
      drawXEye(-12, -14, "#421f34", "#fff6d5");
      drawXEye(1, -14, "#421f34", "#fff6d5");
      drawMouth(-3, -6, "#ef8a8c");
      break;
    case "fish":
      drawXEye(-21, -12, "#10283f", "#fff7dd");
      drawMouth(-28, 1, "#d95c80");
      break;
    case "poseidon":
      rect(-11, -44, 8, 3, "#573a37"); rect(3, -44, 8, 3, "#513633");
      rect(-10, -42, 7, 2, "#fff5ed"); rect(3, -42, 7, 2, "#fff5ed");
      drawMouth(0, -38, "#b87560");
      break;
    case "dragon":
      drawXEye(-32, -41, "#310711", "#fff0df");
      drawMouth(-39, -31, "#ff8b83");
      break;
    case "void-emperor":
      drawXEye(-31, -42, "#160b20", "#f4dce9");
      drawXEye(33, -42, "#160b20", "#f4dce9");
      drawMouth(-39, -34, "#f06dc8"); drawMouth(37, -34, "#f06dc8");
      break;
    case "skeleton-knight":
      // Empty sockets and a crooked jaw beneath the helmet.
      drawXEye(-10, -25, "#171b27", "#e8f0ef");
      drawXEye(7, -25, "#171b27", "#e8f0ef");
      rect(-4, -16, 8, 3, "#242a37");
      rect(-3, -15, 2, 2, "#fff1c9"); rect(2, -16, 2, 2, "#fff1c9");
      break;
    case "magma-snail":
      drawXEye(-13, -5, "#53211e", "#fff0a2");
      drawXEye(-2, -4, "#53211e", "#fff0a2");
      drawMouth(-7, 14, "#ff8b4b");
      break;
    case "firebird":
      drawXEye(-7, -17, "#6e1724", "#fff0ac");
      drawMouth(-13, -9, "#ffbc55");
      rect(-18, -12, 5, 3, "#351b2a");
      break;
    case "snowman-devil":
      drawXEye(-9, -22, "#47315d", "#f8f2ff");
      drawXEye(7, -22, "#47315d", "#f8f2ff");
      drawMouth(0, -11, "#b54452");
      rect(-5, -14, 3, 2, "#fffafa"); rect(3, -14, 3, 2, "#fffafa");
      break;
    case "chimera":
      drawXEye(-43, -27, "#291814", "#fff0cc");
      drawXEye(17, -34, "#34231b", "#fff0bd");
      drawXEye(63, -29, "#26331d", "#f7d15f");
      drawMouth(-47, -16, "#c0833b");
      break;
    case "tree-turtle":
      drawXEye(-63, -1, "#1b3527", "#e5f1a8");
      drawMouth(-68, 4, "#789c61");
      break;
    case "snow-goddess":
      drawXEye(-3, -64, "#203e6a", "#ffffff");
      drawXEye(3, -64, "#203e6a", "#ffffff");
      drawMouth(0, -57, "#b96782");
      break;
  }

  tinySplat(19, -14, "#fff6db");
  rect(-22, -22, 2, 2, "#ffffff");
  ctx.restore();
}

function drawVoidEmperorAura(time) {
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 6; i++) {
    const a = time / 700 + i * 1.047;
    const x = 235 + Math.cos(a) * (42 + (i % 2) * 12);
    const y = 72 + Math.sin(a * 1.4) * 34;
    rect(x, y, 5 + (i % 2) * 3, 5 + (i % 3) * 2, i % 2 ? "#754092" : "#291337");
  }
  // Avoid a flat rectangular aura: only a few stepped violet wisps frame the body.
  ctx.globalAlpha = 0.28;
  rect(191, 47, 5, 18, "#321747");
  rect(198, 36, 6, 10, "#47235f");
  rect(270, 49, 5, 19, "#321747");
  rect(264, 34, 6, 11, "#47235f");
  rect(207, 23, 13, 3, "#49235e");
  rect(246, 20, 12, 3, "#49235e");
  rect(210, 111, 12, 3, "#2e1741");
  rect(247, 109, 14, 3, "#2e1741");
  const glint = (Math.sin(time / 190) + 1) / 2;
  ctx.globalAlpha = 0.35 + glint * 0.55;
  rect(188, 58, 3, 2, "#66e9e6"); rect(275, 39, 3, 2, "#fa74d1");
  rect(226, 13, 2, 2, "#f6d27b"); rect(260, 82, 2, 3, "#7dece7");
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

/* =========================================================
   NEW STAGE ENEMIES — four custom pixel sprites
   ========================================================= */

function drawSkeletonKnight(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const sway = Math.round(Math.sin(time / 170) * 1);
  const swordLift = Math.round(Math.sin(time / 210) * 1);
  const capeWave = Math.round(Math.sin(time / 145) * 2);

  // Ground shadow and a ragged, single-piece midnight cape.
  rect(-29, 45, 58, 4, "#202536");
  rect(-21, 8, 12, 26 + capeWave, "#34364b");
  rect(-18, 12, 12, 23 + capeWave, "#292c40");
  rect(-21, 31 + capeWave, 6, 4, "#202438");
  rect(-14, 33 + capeWave, 6, 3, "#202438");
  rect(-7, 34 + capeWave, 5, 2, "#202438");

  // Feet and greaves.
  rect(-13, 31, 9, 11, "#323947"); rect(4, 31, 10, 11, "#303746");
  rect(-12, 33, 5, 6, "#8995a5"); rect(6, 33, 5, 6, "#768395");
  rect(-16, 40, 14, 6, "#252b38"); rect(2, 40, 15, 6, "#222936");
  rect(-14, 41, 8, 2, "#b8c3cf"); rect(4, 41, 9, 2, "#9ba9bb");

  // Sword: stepped silver blade and cross guard bob slightly as if readied for battle.
  ctx.save();
  ctx.translate(11, swordLift);
  rect(12, -21, 4, 21, "#394152");
  rect(13, -29, 3, 10, "#7c8b9f");
  rect(14, -36, 2, 9, "#c5d2dc");
  rect(14, -41, 2, 6, "#eef6f7");
  rect(9, -21, 10, 3, "#d3b56b");
  rect(13, -18, 3, 8, "#6c4c38");
  rect(11, -11, 7, 3, "#d3b56b");
  ctx.restore();

  // Shield on the left arm, marked with a worn gold cross.
  rect(-31, -7, 12, 20, "#242b3b");
  rect(-29, -9, 10, 19, "#a7b6c7");
  rect(-27, -7, 7, 14, "#586982");
  rect(-25, -6, 3, 12, "#d4dce1");
  rect(-29, -1, 10, 3, "#d4b36d");
  rect(-29, 8, 3, 4, "#323c50"); rect(-22, 8, 3, 4, "#323c50");

  // Shoulder armor, ribbed cuirass, jointed arms and skeletal hands.
  rect(-15, -7, 11, 10, "#485365"); rect(5, -8, 12, 10, "#404a5c");
  rect(-14, -8, 8, 3, "#c0cad3"); rect(7, -9, 8, 3, "#bbc8d3");
  rect(-9, -4, 20, 21, "#3a4354");
  rect(-7, -5, 16, 18, "#8a97a7");
  rect(-5, -4, 12, 4, "#d6dfe4");
  rect(-6, 1, 14, 3, "#5b687a"); rect(-6, 7, 14, 3, "#5b687a");
  rect(-4, 13, 10, 3, "#c2ccd2");
  rect(-17, 0, 5, 12, "#b8c4cc"); rect(-17, 10, 7, 3, "#eef2e8");
  rect(14, 0, 5, 12, "#acbac6"); rect(12, 10, 7, 3, "#eef2e8");
  rect(-12, 16, 23, 6, "#30394a"); rect(-10, 17, 19, 3, "#b6c1cc");
  rect(-7, 21, 6, 4, "#747f91"); rect(2, 21, 6, 4, "#69768a");

  // Skull head and open iron helm, with bone highlights and deep empty sockets.
  rect(-12 + sway, -30, 24, 17, "#c7c8bb");
  rect(-10 + sway, -33, 19, 5, "#e4dfc9");
  rect(-14 + sway, -27, 4, 12, "#a5a99e"); rect(10 + sway, -27, 4, 12, "#9ca195");
  rect(-11 + sway, -28, 7, 6, "#202333"); rect(3 + sway, -28, 7, 6, "#202333");
  rect(-9 + sway, -27, 3, 3, "#f0d8a1"); rect(5 + sway, -27, 3, 3, "#f0d8a1");
  rect(-2 + sway, -22, 4, 3, "#777e80");
  rect(-8 + sway, -18, 16, 4, "#777d7e");
  for (let i = 0; i < 5; i++) rect(-7 + i * 3 + sway, -17, 2, 3, "#f3e8cd");
  // Crowned helmet rim and dark steel cap.
  rect(-15 + sway, -34, 30, 5, "#252c3a");
  rect(-12 + sway, -39, 24, 7, "#424e63");
  rect(-9 + sway, -41, 18, 4, "#6e7d90");
  rect(-6 + sway, -43, 12, 3, "#a8b6c4");
  rect(-2 + sway, -43, 4, 5, "#bd4d54");
  rect(-16 + sway, -32, 3, 8, "#657488"); rect(13 + sway, -32, 3, 8, "#657488");
  // Animated eye glint and a few armor pixels.
  if (Math.floor(time / 180) % 3 !== 0) {
    rect(-8 + sway, -26, 2, 2, "#ffe7a3"); rect(6 + sway, -26, 2, 2, "#ffe7a3");
  }
  rect(-2, 4, 3, 3, "#e1bf72"); rect(0, 6, 2, 2, "#fff0b5");
  ctx.restore();
}

function drawMagmaSnail(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const bodyBob = Math.round(Math.sin(time / 185) * 1);
  const feeler = Math.round(Math.sin(time / 135) * 2);
  const glow = Math.floor((Math.sin(time / 115) + 1) * 2);

  rect(-30, 34, 58, 4, "#24202b");
  // Slug body and flattened foot.
  rect(-25, 17 + bodyBob, 48, 13, "#7d302b");
  rect(-21, 12 + bodyBob, 36, 12, "#b5432e");
  rect(-16, 10 + bodyBob, 26, 8, "#e45d32");
  rect(-20, 27 + bodyBob, 44, 5, "#4c292e");
  rect(-16, 29 + bodyBob, 31, 2, "#e7853a");
  rect(-14, 16 + bodyBob, 5, 7, "#f68b3c");
  rect(0, 18 + bodyBob, 4, 6, "#f58a3a");
  rect(12, 20 + bodyBob, 6, 6, "#8e352a");

  // Obsidian shell: one broad stepped dome with a visible molten spiral.
  rect(-5, -24, 10, 4, "#252633");
  rect(-13, -21, 27, 5, "#343342");
  rect(-19, -16, 38, 7, "#242633");
  rect(-22, -9, 43, 13, "#1b202b");
  rect(-19, -7, 37, 9, "#3b3440");
  rect(-14, -4, 27, 8, "#171d27");
  // Pixelated lava seams flicker without blurring the silhouette.
  rect(-17, -15, 4, 3, "#e24b2c"); rect(-14, -12, 3, 4, "#ff9b43");
  rect(-8, -18, 3, 3, "#ff6236"); rect(-5, -15, 5, 3, "#f9b348");
  rect(4, -16, 5, 3, "#c83b30"); rect(8, -13, 3, 5, "#ff8b3d");
  rect(12, -8, 4, 4, "#ffb34f"); rect(7, -5, 5, 3, "#e84b2e");
  rect(-4, -7, 3, 4, "#ffad42"); rect(-10, -5, 4, 3, "#d9432f");
  rect(-1, -2, 4 + glow, 2, "#ffd15f");
  rect(-18, -7, 3, 5, "#62606a"); rect(16, -7, 3, 5, "#525361");
  rect(-12, -18, 4, 2, "#93909b"); rect(4, -17, 5, 2, "#787987");

  // Two eye stalks bounce independently; bright amber eyes read clearly at sprite scale.
  rect(-18, -2 - feeler + bodyBob, 3, 9 + feeler, "#d85a31");
  rect(-17, -5 - feeler, 7, 6, "#542930"); rect(-17, -5 - feeler, 6, 4, "#ffd36b");
  rect(-15, -4 - feeler, 3, 3, "#fff5b0"); rect(-14, -3 - feeler, 2, 3, "#2b222d");
  rect(-6, -1 + feeler + bodyBob, 3, 8 - feeler, "#d85a31");
  rect(-7, -4 + feeler, 7, 6, "#542930"); rect(-7, -4 + feeler, 6, 4, "#ffd36b");
  rect(-5, -3 + feeler, 3, 3, "#fff5b0"); rect(-4, -2 + feeler, 2, 3, "#2b222d");
  rect(-20, 13 + bodyBob, 8, 2, "#552833");
  rect(-17, 14 + bodyBob, 4, 2, "#f7a34b");

  // A few square embers rise from the shell.
  for (let i = 0; i < 4; i++) {
    const lift = Math.floor((time / (95 + i * 13) + i * 7) % 13);
    const ex = -13 + i * 9 + (i % 2 ? 2 : -1);
    ctx.save(); ctx.globalAlpha = Math.max(.12, .72 - lift / 18);
    rect(ex, -20 - lift, i % 2 ? 2 : 1, i % 2 ? 2 : 1, i % 2 ? "#ffcf63" : "#ff6339");
    ctx.restore();
  }
  ctx.restore();
}

function drawFirebird(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const flap = Math.round(Math.sin(time / 115) * 5);
  const tail = Math.round(Math.sin(time / 165) * 2);
  const ember = Math.floor((time / 100) % 4);

  rect(-29, 51, 58, 3, "#2a202f");
  // Tail feathers trail back in a layered fan.
  rect(13, 14 + tail, 8, 9, "#9e2536");
  rect(18, 12 + tail, 7, 10, "#d83c32");
  rect(22, 7 + tail, 6, 12, "#ff6b32");
  rect(25, 2 + tail, 5, 13, "#ffb13f");
  rect(18, 18 + tail, 5, 10, "#f34b31");
  rect(12, 25 + tail, 5, 6, "#ffd061");

  // Far wing first; the scalloped feather rows move in chunky pixel steps.
  rect(-9, -7 - flap, 12, 8, "#8b2338");
  rect(-19, -12 - flap, 13, 7, "#b72c37");
  rect(-27, -19 - flap, 11, 7, "#db3a34");
  rect(-33, -27 - flap, 9, 7, "#ff6334");
  rect(-26, -11 - flap, 9, 6, "#e84b31");
  rect(-20, -4 - flap, 9, 6, "#ff8a35");
  rect(-12, 1 - flap, 10, 6, "#ffc14b");
  rect(-30, -25 - flap, 6, 3, "#ffd05a");
  rect(-22, -14 - flap, 7, 3, "#ff9b3d");
  rect(-15, -6 - flap, 6, 3, "#ffd05a");

  // Near wing with a stronger ember edge. It folds and opens as one stepped silhouette.
  rect(1, -10 + flap, 12, 9, "#802034");
  rect(8, -17 + flap, 12, 7, "#b52b36");
  rect(16, -22 + flap, 11, 7, "#db3b35");
  rect(23, -27 + flap, 9, 7, "#ff6637");
  rect(12, -10 + flap, 10, 6, "#e64a31");
  rect(5, -4 + flap, 10, 6, "#ff8435");
  rect(0, 1 + flap, 10, 6, "#ffc14b");
  rect(23, -25 + flap, 6, 3, "#ffe078");
  rect(16, -19 + flap, 7, 3, "#ff9e3d");
  rect(8, -10 + flap, 6, 3, "#ffd05a");

  // Curved torso, belly feathers and shoulders.
  rect(-9, -8, 20, 21, "#9d2637");
  rect(-7, -8, 16, 18, "#e34232");
  rect(-5, -4, 12, 15, "#ff8b38");
  rect(-3, 0, 8, 10, "#ffc451");
  rect(-8, 9, 15, 6, "#b52d36");
  rect(-2, -9, 8, 4, "#ffd05a");
  rect(-11, -11, 7, 6, "#b52d36"); rect(5, -10, 7, 6, "#c93435");

  // Head, hooked beak, crest and bright eye.
  rect(-13, -24, 15, 14, "#d33a32");
  rect(-11, -27, 11, 6, "#ff6b36");
  rect(-9, -30, 6, 5, "#ffb540");
  rect(-5, -28, 4, 4, "#ffd45e");
  rect(-17, -20, 6, 4, "#a92335");
  rect(-21, -18, 7, 5, "#ffd05a"); rect(-25, -17, 5, 3, "#ff8b3d");
  rect(-9, -20, 6, 5, "#411f2a"); rect(-8, -19, 3, 2, "#fff4bb");
  rect(-14, -14, 8, 3, "#842237");
  rect(-4, -11, 4, 4, "#ffbd45");

  // Feet and hooked talons.
  rect(-7, 13, 6, 12, "#842537"); rect(3, 13, 6, 12, "#842537");
  rect(-10, 23, 10, 4, "#ffc248"); rect(2, 23, 10, 4, "#ffc248");
  rect(-10, 25, 4, 5, "#fff0a1"); rect(-2, 25, 3, 4, "#fff0a1");
  rect(3, 25, 4, 5, "#fff0a1"); rect(9, 25, 3, 4, "#fff0a1");

  // Flickering pixel sparks around the wings.
  for (let i = 0; i < 5; i++) {
    const px = -28 + i * 14 + (i % 2 ? 2 : -2);
    const py = -30 + ((i * 5 + ember) % 13);
    ctx.save(); ctx.globalAlpha = .45 + ((i + ember) % 3) * .16;
    rect(px, py, i % 2 ? 2 : 1, i % 2 ? 2 : 1, i % 2 ? "#ffe37b" : "#ff7540");
    ctx.restore();
  }
  ctx.restore();
}

function drawSnowmanDevil(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const wobble = Math.round(Math.sin(time / 145) * 1);
  const wing = Math.round(Math.sin(time / 115) * 3);
  const eyeGlow = Math.floor((time / 170) % 2);

  rect(-29, 42, 58, 4, "#273044");

  // Tiny bat wings, animated as chunky stepped silhouettes behind the snowballs.
  rect(-23, 1 + wing, 9, 6, "#473b68");
  rect(-29, -3 + wing, 9, 5, "#62527c");
  rect(-32, -9 + wing, 7, 7, "#3d355b");
  rect(-27, 5 + wing, 7, 5, "#342b4d");
  rect(14, 1 - wing, 9, 6, "#473b68");
  rect(20, -3 - wing, 9, 5, "#62527c");
  rect(25, -9 - wing, 7, 7, "#3d355b");
  rect(19, 5 - wing, 7, 5, "#342b4d");

  // Bottom snowball and stubby feet.
  rect(-20, 15, 40, 20, "#a8d9ed");
  rect(-24, 20, 48, 13, "#d7f1f8");
  rect(-17, 17, 32, 17, "#f3fdff");
  rect(-20, 29, 37, 5, "#97c8e0");
  rect(-17, 33, 12, 5, "#4c5974"); rect(5, 33, 13, 5, "#46536f");
  rect(-19, 36, 15, 4, "#252b42"); rect(4, 36, 16, 4, "#252b42");
  rect(-15, 35, 8, 2, "#92a9bb"); rect(8, 35, 8, 2, "#92a9bb");

  // Middle snowball, icy highlights and coal buttons.
  rect(-18, -1 + wobble, 36, 22, "#9bc9df");
  rect(-21, 4 + wobble, 42, 14, "#d9f2f8");
  rect(-15, 1 + wobble, 30, 19, "#f4fcff");
  rect(-12, 16 + wobble, 25, 3, "#a7d1e4");
  rect(-3, 6 + wobble, 5, 5, "#30374c"); rect(-2, 7 + wobble, 2, 2, "#ecf4fc");
  rect(-3, 14 + wobble, 5, 4, "#41455d");

  // Twig arms with dark, pointed pixel fingers.
  rect(-22, 5 + wobble, 10, 3, "#654338"); rect(-27, 0 + wobble, 3, 7, "#79513b");
  rect(-29, -4 + wobble, 3, 5, "#79513b"); rect(-25, -1 + wobble, 4, 3, "#79513b");
  rect(12, 6 + wobble, 10, 3, "#654338"); rect(24, 1 + wobble, 3, 7, "#79513b");
  rect(24, -3 + wobble, 3, 5, "#79513b"); rect(20, 0 + wobble, 4, 3, "#79513b");

  // Red scarf loops around the neck, trailing to one side like a fluttering ribbon.
  rect(-17, -3 + wobble, 34, 5, "#9e273f");
  rect(-14, -4 + wobble, 27, 3, "#ef5261");
  rect(9, -1 + wobble, 7, 10, "#bd3049");
  rect(13, 3 + wobble, 6, 8 + wing, "#ef5261");
  rect(15, 9 + wing, 4, 3, "#ff8590");

  // Head, horns and the little devil's face.
  rect(-16, -28 + wobble, 32, 28, "#9ccde2");
  rect(-20, -23 + wobble, 40, 18, "#dff5fb");
  rect(-14, -28 + wobble, 27, 24, "#f5fdff");
  rect(-18, -32 + wobble, 8, 8, "#453251");
  rect(-21, -38 + wobble, 6, 9, "#6a3e69");
  rect(-17, -42 + wobble, 4, 6, "#c44950");
  rect(10, -32 + wobble, 8, 8, "#453251");
  rect(15, -38 + wobble, 6, 9, "#6a3e69");
  rect(16, -42 + wobble, 4, 6, "#c44950");
  rect(-12, -23 + wobble, 9, 7, "#382c48");
  rect(4, -23 + wobble, 9, 7, "#382c48");
  rect(-10, -21 + wobble, 4, 3, eyeGlow ? "#ff6266" : "#ffbd66");
  rect(6, -21 + wobble, 4, 3, eyeGlow ? "#ff6266" : "#ffbd66");
  // Carrot nose points right, with a warm orange tip.
  rect(-1, -18 + wobble, 8, 4, "#ef873b");
  rect(5, -17 + wobble, 5, 3, "#ffb957");
  rect(9, -16 + wobble, 3, 2, "#ff713b");
  // Crooked grin with tiny blocky fangs.
  rect(-9, -11 + wobble, 20, 6, "#3c2b47");
  rect(-7, -10 + wobble, 16, 3, "#a62e45");
  rect(-6, -11 + wobble, 3, 3, "#f9fdff"); rect(4, -11 + wobble, 3, 3, "#f9fdff");
  rect(-1, -7 + wobble, 6, 2, "#ed6680");
  // Pixel-ice highlights and a few dark snow speckles.
  rect(-12, -25 + wobble, 5, 2, "#ffffff"); rect(6, -27 + wobble, 5, 2, "#ffffff");
  rect(-11, 10 + wobble, 2, 2, "#77adc9"); rect(10, 12 + wobble, 2, 2, "#9bcbe0");
  ctx.restore();
}

function drawSlime(
  x,
  y,
  scale,
  time = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  /* contact shadow */
  rect(-28, 37, 56, 5, "#202337");
  rect(-22, 36, 44, 3, "#2b2a40");

  // The gel body bobs independently of its shadow, like a soft creature breathing.
  const gelBob = Math.round(Math.sin((time || 0) / 165) * 2);
  ctx.save();
  ctx.translate(0, gelBob);

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

  /* Dizzy spiral eyes: deliberately mismatched pixel coils for a goofy, dazed expression. */
  const eyeRoll = Math.round(Math.sin((time || 0) / 118) * 1);
  const swirlTick = Math.floor((time || 0) / 280) % 2;
  rect(-15, -5, 11, 13, "#4a2d59");
  rect(-14, -4, 9, 11, "#fff8fc");
  rect(4, -5, 11, 13, "#4a2d59");
  rect(5, -4, 9, 11, "#fff8fc");
  // Larger, chunky spiral pupils fill most of each eye while preserving a white rim.
  // Left eye: broad clockwise square coil.
  rect(-13 + eyeRoll, -3, 7, 2, "#35233f");
  rect(-7 + eyeRoll, -2, 2, 6, "#35233f");
  rect(-12 + eyeRoll, 2, 6, 2, "#35233f");
  rect(-13 + eyeRoll, 0, 2, 3, "#35233f");
  rect(-10 + eyeRoll, -1, 4, 2, "#35233f");
  rect(-10 + eyeRoll, -1, 3, 1, "#8a55a0");
  rect(-8 + eyeRoll, swirlTick ? 0 : 1, 2, 2, "#b77ac8");
  rect(-12 + eyeRoll, -2, 2, 1, "#f7e8fb");
  // Right eye coils the opposite way, with a tiny jitter that suggests dizziness.
  rect(6 - eyeRoll, -3, 7, 2, "#35233f");
  rect(6 - eyeRoll, -2, 2, 6, "#35233f");
  rect(6 - eyeRoll, 2, 6, 2, "#35233f");
  rect(12 - eyeRoll, 0, 2, 3, "#35233f");
  rect(8 - eyeRoll, -1, 4, 2, "#35233f");
  rect(8 - eyeRoll, -1, 3, 1, "#8a55a0");
  rect(7 - eyeRoll, swirlTick ? 1 : 0, 2, 2, "#b77ac8");
  rect(12 - eyeRoll, -2, 1, 1, "#f7e8fb");
  /* lopsided open mouth and dangling tongue */
  const tongueWiggle = Math.round(Math.sin((time || 0) / 146) * 1);
  rect(-5, 8, 12, 8, "#39223f");
  rect(-4, 9, 10, 5, "#211a31");
  // One tiny crooked tooth peeks over the lip.
  rect(3, 8, 2, 2, "#fff5fa");
  rect(-2, 10, 7, 4, "#b94f82");
  rect(-1, 13, 6, 4, "#e56e9d");
  rect(tongueWiggle, 16, 4, 4, "#f28bab");
  rect(1 + tongueWiggle, 17, 2, 3, "#ffc0d0");
  rect(2, 13, 1, 4, "#ffadc6");

  /* crown */
  rect(12, -30, 6, 10, "#c6903f");
  rect(9, -25, 12, 4, "#c6903f");
  rect(13, -30, 3, 3, "#f4cf78");
  rect(17, -27, 2, 2, "#8e642d");

  ctx.restore(); // animated gel layer
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

  const flap = Math.round(Math.sin((time || 0) / 100) * 5);
  const batBob = Math.round(Math.sin((time || 0) / 245));

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
    -18 + batBob,
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
  scale,
  time = 0
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

  const leafSway = Math.round(Math.sin((time || 0) / 220) * 2);
  rect(
    -10 - leafSway,
    -35,
    8,
    18,
    "#78925d"
  );
  rect(-9 - leafSway, -34, 4, 12, "#a7c17c");

  rect(
    2 + leafSway,
    -38,
    8,
    20,
    "#78925d"
  );
  rect(4 + leafSway, -36, 4, 13, "#b0ca82");

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

function drawWolf(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Low, long contact shadow keeps the wolf grounded on four paws.
  rect(-43, 37, 82, 5, "#202337");
  rect(-34, 36, 61, 3, "#2c3041");

  // Tail behind the rump: a stepped up/down wag keeps the silhouette animated.
  const tailWag = Math.round(Math.sin((time || 0) / 155) * 3);
  ctx.save();
  ctx.translate(0, tailWag);
  rect(22, -11, 11, 9, "#252b3d");
  rect(28, -17, 10, 9, "#353c50");
  rect(34, -24, 9, 9, "#454d61");
  rect(37, -30, 8, 8, "#292f43");
  rect(31, -22, 5, 4, "#7e8796");
  rect(35, -29, 5, 4, "#9ba2ac");
  rect(41, -33, 4, 6, "#242a3b");
  ctx.restore();

  // Far-side legs first, with clear joints and broad paws.
  rect(-4, 3, 7, 18, "#292f42");
  rect(-5, 18, 8, 12, "#343b4e");
  rect(-10, 28, 14, 5, "#252b3b");
  rect(17, 1, 8, 20, "#292f42");
  rect(18, 18, 8, 12, "#343a4d");
  rect(14, 28, 15, 5, "#252b3b");

  // Body silhouette: longer back, deep chest and a slightly tucked waist.
  rect(-24, -13, 47, 29, "#252a3c");
  rect(-21, -16, 39, 28, "#454d61");
  rect(-18, -18, 30, 7, "#5d6578");
  rect(-6, -14, 24, 8, "#596174");
  rect(-24, -7, 13, 18, "#3b4356");
  rect(-20, 7, 14, 8, "#596174");
  // Back fur and the raised shoulder ruff are stepped, not rounded.
  rect(-16, -21, 7, 5, "#626b7d");
  rect(-9, -19, 7, 4, "#70798a");
  rect(-2, -17, 7, 4, "#535c70");
  rect(6, -15, 7, 4, "#687183");
  rect(13, -13, 6, 4, "#4d566a");
  rect(-25, -11, 6, 7, "#6e7788");
  rect(-27, -4, 6, 7, "#515b6f");
  rect(-24, 3, 6, 6, "#394256");
  // Back and belly shading gives the torso volume.
  rect(-16, -12, 25, 4, "#7e8796");
  rect(-14, -8, 18, 3, "#6c7586");
  rect(-16, 0, 18, 6, "#41495c");
  rect(-14, 6, 15, 5, "#30374a");

  // Near-side legs, separated at the chest and haunches.
  rect(-18, 4, 8, 17, "#333a4e");
  rect(-18, 18, 7, 13, "#454d60");
  rect(-23, 29, 14, 5, "#242a3b");
  rect(7, 5, 8, 16, "#333a4e");
  rect(7, 18, 8, 13, "#41495d");
  rect(3, 29, 15, 5, "#242a3b");
  rect(-16, 7, 3, 10, "#747d8b");
  rect(9, 8, 3, 9, "#626b7e");
  rect(-20, 32, 5, 2, "#9ea6b1");
  rect(5, 32, 5, 2, "#8d96a5");

  // Neck mane and head make a small alert nod, separate from the grounded paws.
  const headNod = Math.round(Math.sin((time || 0) / 265) * 1);
  ctx.save();
  ctx.translate(0, headNod);
  rect(-30, -27, 17, 17, "#272d40");
  rect(-28, -30, 17, 17, "#51596d");
  rect(-25, -32, 13, 5, "#697284");
  rect(-29, -22, 8, 14, "#626b7e");
  rect(-24, -15, 11, 8, "#d1d2d1");
  rect(-19, -12, 10, 7, "#e0ded8");

  // Upright pointed ears with dark borders and muted inner fur.
  rect(-30, -43, 8, 15, "#242a3c");
  rect(-28, -41, 4, 10, "#535b70");
  rect(-26, -38, 2, 5, "#b7838a");
  rect(-17, -41, 7, 13, "#242a3c");
  rect(-15, -39, 3, 8, "#555d71");
  rect(-14, -36, 2, 4, "#b7838a");

  // Long muzzle facing left, with nose, jaw, fangs and a bright amber eye.
  rect(-39, -29, 18, 18, "#24293b");
  rect(-36, -28, 14, 13, "#727b8b");
  rect(-43, -24, 15, 8, "#858d99");
  rect(-45, -23, 5, 5, "#242637");
  rect(-42, -22, 2, 2, "#c2c5c7");
  rect(-39, -15, 13, 5, "#252738");
  rect(-37, -14, 10, 3, "#d8d6d1");
  rect(-36, -15, 2, 4, "#f8ecd8");
  rect(-30, -15, 2, 4, "#f8ecd8");
  rect(-31, -26, 8, 4, "#282638");
  rect(-29, -25, 4, 2, "#f2c76c");
  rect(-28, -25, 2, 2, "#fff0ba");
  rect(-33, -29, 12, 3, "#262b3d");
  rect(-23, -27, 4, 3, "#32384a");

  // Distinctive silver-grey cheek and layered night fur highlights.
  rect(-31, -18, 7, 3, "#a2a8b0");
  rect(-27, -14, 5, 2, "#858d9b");
  rect(-21, -7, 4, 3, "#9aa2ad");
  rect(-9, -10, 6, 3, "#8e97a5");
  rect(2, -8, 5, 3, "#87909e");
  rect(15, -8, 4, 3, "#343b4e");
  rect(21, -2, 3, 4, "#303648");

  ctx.restore();
  ctx.restore();
}

function drawPhantom(
  x,
  y,
  scale,
  time = 0
) {
  ctx.save();
  const drift = Math.round(Math.sin((time || 0) / 235) * 2);
  const floatY = Math.round(Math.sin((time || 0) / 180) * 2);
  ctx.translate(x + drift, y + floatY);

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
  const wisp = Math.round(Math.sin((time || 0) / 140) * 2);
  ctx.globalAlpha = 0.55;
  rect(-34 - wisp, -3, 5, 3, "#a49bc5");
  rect(29 + wisp, 6, 5, 3, "#b7add3");
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawGolem(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Heavy contact shadow and feet planted apart for a humanoid stance.
  rect(-40, 45, 80, 6, "#202337");
  rect(-31, 44, 62, 3, "#343947");

  // Legs are visibly separate, jointed and weight-bearing.
  rect(-21, 16, 17, 22, "#353b49");
  rect(4, 16, 17, 22, "#292f3d");
  rect(-19, 19, 13, 14, "#747b87");
  rect(6, 19, 13, 14, "#626a77");
  rect(-18, 31, 13, 8, "#505765");
  rect(7, 31, 13, 8, "#454c5b");
  rect(-23, 37, 21, 7, "#292f3d");
  rect(3, 37, 22, 7, "#252b39");
  rect(-20, 38, 12, 2, "#a4a8ad");
  rect(7, 38, 13, 2, "#8a9099");
  rect(-14, 17, 4, 5, "#a0a5ac");
  rect(11, 17, 4, 5, "#858c98");

  // Keep the heavy feet planted while the upper frame shifts its weight by whole pixels.
  const lean = Math.round(Math.sin((time || 0) / 390));
  ctx.save();
  ctx.translate(lean, 0);

  // Arms hang from broad shoulder plates, with elbow and fist blocks.
  rect(-38, -21, 17, 22, "#303644");
  rect(21, -21, 17, 22, "#292f3d");
  rect(-36, -18, 13, 14, "#737a86");
  rect(23, -18, 13, 14, "#5b6370");
  rect(-34, -5, 12, 12, "#454c5a");
  rect(22, -5, 12, 12, "#3e4553");
  rect(-35, 5, 14, 12, "#5c6370");
  rect(21, 5, 14, 12, "#4b5260");
  rect(-37, 14, 17, 9, "#303643");
  rect(20, 14, 17, 9, "#292f3d");
  rect(-34, 15, 11, 5, "#858b94");
  rect(23, 15, 11, 5, "#6a727f");
  rect(-36, 21, 14, 6, "#414856");
  rect(21, 21, 14, 6, "#383f4d");
  // Knuckles: heavy, square hands rather than floating shoulder blocks.
  rect(-35, 24, 12, 5, "#292f3b");
  rect(22, 24, 12, 5, "#252b38");
  rect(-32, 24, 3, 2, "#9298a0");
  rect(25, 24, 3, 2, "#7e8691");

  // Shoulder silhouette forms a broad, angular humanoid frame.
  rect(-31, -29, 62, 19, "#252b38");
  rect(-35, -25, 15, 14, "#3b424f");
  rect(20, -25, 15, 14, "#303745");
  rect(-29, -29, 15, 7, "#8b919b");
  rect(15, -29, 15, 7, "#777f8c");
  rect(-24, -25, 48, 18, "#666e7c");
  rect(-20, -22, 40, 10, "#7f8791");
  rect(-18, -17, 36, 7, "#59616f");

  // Narrow waist and central torso separate chest from hips.
  rect(-18, -13, 36, 31, "#252b39");
  rect(-15, -11, 30, 27, "#737a86");
  rect(-12, -8, 24, 20, "#858c96");
  rect(-10, -5, 20, 14, "#6b7380");
  rect(-17, 8, 34, 8, "#464d5b");
  rect(-10, 13, 20, 5, "#363d4a");
  // Glowing furnace core in a recessed chest plate.
  rect(-8, -8, 16, 15, "#242735");
  rect(-5, -6, 10, 11, "#9b563f");
  rect(-3, -5, 6, 9, "#f2a45b");
  rect(-2, -3, 4, 5, "#ffe1a0");
  rect(-5, -8, 10, 2, "#a8adb4");
  rect(-5, 5, 10, 2, "#4d5562");
  const corePulse = Math.sin((time || 0) / 175) > 0;
  ctx.globalAlpha = corePulse ? 0.42 : 0.22;
  rect(-4, -5, 8, 9, corePulse ? "#ffcf75" : "#f47f45");
  ctx.globalAlpha = 1;
  rect(-2, -3, 4, 5, corePulse ? "#fff0b0" : "#f6a75c");

  // Neck joint and compact helmeted head: clearly humanoid proportions.
  rect(-7, -34, 14, 8, "#323845");
  rect(-5, -32, 10, 5, "#777e89");
  rect(-17, -48, 34, 21, "#252b39");
  rect(-14, -46, 28, 17, "#69717e");
  rect(-11, -43, 22, 11, "#8b929b");
  rect(-16, -39, 32, 5, "#525a68");
  rect(-18, -36, 36, 6, "#303644");
  // Flat brow and glowing slit eyes.
  rect(-12, -40, 24, 3, "#252a37");
  rect(-10, -38, 7, 3, "#e19b56");
  rect(3, -38, 7, 3, "#e19b56");
  rect(-9, -38, 4, 1, "#fff0bd");
  rect(4, -38, 4, 1, "#fff0bd");
  rect(-8, -32, 16, 3, "#414856");
  rect(-5, -31, 10, 2, "#252a37");

  // Plate seams, bolts and top-left steel reflections.
  rect(-25, -24, 5, 3, "#c2c6cb");
  rect(20, -24, 5, 3, "#9ca3ad");
  rect(-14, -19, 3, 3, "#c6cbd0");
  rect(11, -19, 3, 3, "#a6adb5");
  rect(-15, -2, 3, 3, "#bdc1c7");
  rect(12, -2, 3, 3, "#555c69");
  rect(-17, 11, 3, 3, "#afb5bd");
  rect(14, 11, 3, 3, "#555c69");
  rect(-3, 15, 6, 2, "#aeb4bc");
  rect(-29, -13, 3, 5, "#aeb5bd");
  rect(26, -13, 3, 5, "#4e5664");

  ctx.restore(); // upper-body weight shift
  ctx.restore();
}

/* =========================================================
   BEACH MONSTERS
   ========================================================= */

function drawShrimp(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  rect(-30, 30, 58, 5, "#202337");
  const hop = Math.max(0, Math.round(Math.sin((time || 0) / 220) * 3));
  ctx.save();
  ctx.translate(0, -hop);

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

  ctx.restore(); // springing shrimp body
  ctx.restore();
}

function drawFish(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Grounding shadow
  ctx.globalAlpha = .48;
  rect(-35, 28, 58, 3, "#162635");
  rect(-26, 31, 43, 2, "#253b47");
  ctx.globalAlpha = 1;

  // Tail fin wags by whole pixels; the body remains comparatively steady.
  const tailWag = Math.round(Math.sin((time || 0) / 130) * 3);
  ctx.save();
  ctx.translate(0, tailWag);
  rect(17, -8, 9, 21, "#103e58");
  rect(24, -14, 8, 10, "#103e58");
  rect(27, -18, 9, 9, "#103e58");
  rect(24, 8, 8, 10, "#103e58");
  rect(27, 12, 9, 9, "#103e58");
  rect(21, -10, 7, 7, "#247b95");
  rect(25, -14, 6, 6, "#56c6d0");
  rect(22, 4, 7, 7, "#226e8a");
  rect(25, 12, 6, 6, "#3ba8bb");
  rect(20, -1, 6, 3, "#7fe0df");
  ctx.restore();

  // Dorsal and lower fins, stepped silhouette
  rect(-7, -25, 16, 7, "#103e58");
  rect(-3, -31, 9, 8, "#103e58");
  rect(3, -28, 8, 6, "#103e58");
  rect(-3, -25, 9, 5, "#3ca9bd");
  rect(1, -29, 5, 6, "#7fe0df");
  rect(-4, 15, 19, 7, "#103e58");
  rect(2, 18, 13, 6, "#103e58");
  rect(-1, 16, 13, 4, "#257c96");
  rect(4, 19, 7, 3, "#4ab8c8");
  // Side fin
  rect(-2, -1, 18, 7, "#103e58");
  rect(4, 2, 17, 7, "#23748d");
  rect(8, 3, 10, 3, "#69d6da");
  rect(11, 6, 6, 2, "#b3ece6");

  // Body outline with a tapered snout facing the hero
  rect(-24, -21, 42, 32, "#102f49");
  rect(-30, -15, 50, 23, "#102f49");
  rect(-35, -8, 14, 14, "#102f49");
  rect(-26, -18, 39, 28, "#207e98");
  rect(-31, -12, 13, 16, "#2b91a9");
  rect(-21, -23, 26, 5, "#102f49");
  rect(-17, -26, 15, 4, "#143f58");
  rect(-21, -20, 32, 4, "#42b9c7");

  // Three-band shading: wet top light, saturated body, deep underside
  toneRect(-25, -17, 39, 12, "#b8f6e9", "#55d3d6", "#278da7");
  toneRect(-30, -10, 45, 14, "#66e1e0", "#2eafc3", "#176582");
  toneRect(-24, 2, 36, 8, "#d7f0df", "#8cd7d5", "#236f8a");
  rect(-26, -15, 32, 2, "#d7fff1");
  rect(-29, -9, 6, 2, "#8df1e6");
  rect(-19, -3, 28, 2, "#4bc5d2");
  rect(-16, 5, 25, 2, "#e8f5e2");
  rect(0, 9, 12, 3, "#1c6b86");

  // Gills and staggered scale marks make the body read as a fish
  rect(-7, -10, 2, 10, "#19738c");
  rect(-3, -9, 2, 8, "#68d8d9");
  rect(1, -8, 2, 7, "#18718a");
  rect(5, -8, 2, 6, "#55c9d2");
  rect(-4, -2, 4, 2, "#9be9df");
  rect(4, -3, 4, 2, "#c1f5e8");
  rect(10, -5, 3, 2, "#278fa8");
  rect(7, 1, 3, 2, "#278fa8");
  rect(14, -1, 3, 2, "#1b6c86");
  rect(11, 4, 3, 2, "#c2eee3");

  // Angry eye with a slanted brow
  rect(-25, -15, 9, 8, "#10283f");
  rect(-23, -14, 6, 5, "#fff3d4");
  rect(-21, -13, 4, 5, "#15293e");
  rect(-20, -13, 2, 2, "#ffffff");
  rect(-27, -18, 10, 3, "#10334b");
  rect(-26, -19, 7, 2, "#6ce0df");

  // Open mouth and exposed jagged teeth
  rect(-35, -3, 14, 11, "#10283e");
  rect(-33, -2, 10, 8, "#8e344d");
  rect(-34, -4, 12, 3, "#163750");
  rect(-33, -3, 3, 4, "#fff9df");
  rect(-28, -3, 3, 5, "#fff9df");
  rect(-23, -2, 2, 4, "#f9f0db");
  rect(-31, 3, 3, 4, "#fffdf0");
  rect(-26, 4, 3, 4, "#fffdf0");
  rect(-22, 3, 2, 3, "#e8f1df");
  rect(-35, 6, 4, 3, "#10334b");

  // Glossy edge and a few bright fin rays
  rect(-24, -20, 19, 2, "#e5fff2");
  rect(18, -10, 4, 2, "#83e4df");
  rect(28, -12, 3, 5, "#a4ede7");
  rect(28, 10, 3, 5, "#7ad7d8");
  rect(6, -23, 3, 3, "#c9fff0");

  ctx.restore();
}

function drawPoseidon(x, y, scale, time) {
  ctx.save();
  ctx.translate(x, y);
  // A larger, imposing sea god. The broad bare chest and fish tail replace the old armor/legs.
  ctx.scale(scale * 1.08, scale * 1.08);

  // Broad shadow and ripples
  ctx.globalAlpha = .45;
  rect(-43, 54, 84, 4, "#142c3d");
  rect(-32, 58, 64, 2, "#254755");
  ctx.globalAlpha = 1;
  const ripple = Math.round(Math.sin(time / 640) * 1);
  rect(-42, 49 + ripple, 18, 2, "#6bd9e0");
  rect(21, 48 - ripple, 22, 2, "#8ee9e8");
  rect(-34, 53, 9, 2, "#3baec2");
  rect(29, 53, 8, 2, "#46bdce");

  // Trident sways by whole pixels, distinct from the body motion.
  const tridentSway = Math.round(Math.sin((time || 0) / 285) * 1);
  ctx.save();
  ctx.translate(tridentSway, 0);
  rect(34, -50, 4, 91, "#7c5029");
  rect(35, -49, 2, 88, "#d4a54b");
  rect(31, -61, 3, 16, "#9d6c34");
  rect(32, -62, 2, 14, "#ffe18b");
  rect(39, -61, 3, 16, "#9d6c34");
  rect(40, -62, 2, 14, "#f4cb68");
  rect(35, -68, 4, 18, "#81552c");
  rect(36, -68, 2, 17, "#fff0a1");
  rect(29, -49, 15, 4, "#8b5d30");
  rect(30, -48, 13, 2, "#f1c865");
  rect(33, -42, 6, 3, "#f6dc87");
  ctx.restore();

  // Large mermaid tail: dark outline, teal scales, wide split fin
  rect(-17, 6, 34, 13, "#103d57");
  rect(-19, 16, 38, 12, "#103d57");
  rect(-16, 25, 32, 12, "#103d57");
  rect(-12, 34, 24, 10, "#103d57");
  rect(-7, 42, 14, 8, "#103d57");
  toneRect(-15, 8, 29, 13, "#8be4df", "#2b9eb0", "#155470");
  toneRect(-16, 18, 32, 11, "#62cdd1", "#21879f", "#104460");
  toneRect(-13, 27, 26, 10, "#4dc0c9", "#1a7794", "#103b57");
  toneRect(-9, 35, 18, 9, "#45b3c0", "#1d6d8c", "#0e344e");
  rect(-9, 12, 7, 3, "#c1f2e7");
  rect(1, 14, 8, 3, "#79d9d7");
  rect(-5, 21, 8, 3, "#6cd1d3");
  rect(5, 25, 7, 3, "#2c9caf");
  rect(-8, 31, 7, 3, "#5bc8ce");
  rect(1, 35, 7, 3, "#2c8ba4");
  // Tail fin spreads to both sides in stepped fan shapes
  rect(-12, 43, 24, 5, "#103d57");
  rect(-25, 39, 17, 7, "#103d57");
  rect(-31, 33, 12, 8, "#103d57");
  rect(-28, 29, 10, 6, "#103d57");
  rect(8, 39, 17, 7, "#103d57");
  rect(19, 33, 12, 8, "#103d57");
  rect(18, 29, 10, 6, "#103d57");
  rect(-23, 39, 13, 4, "#2a8da5");
  rect(-29, 34, 8, 5, "#5dc8ce");
  rect(-26, 30, 6, 3, "#91e2dc");
  rect(10, 39, 13, 4, "#1b7896");
  rect(21, 34, 8, 5, "#2e9bb0");
  rect(21, 30, 6, 3, "#58c5cb");
  rect(-12, 45, 10, 2, "#86e1dc");
  rect(3, 45, 9, 2, "#2e8da5");
  // Fine, staggered scale rows; the small blocks keep the tail unmistakably pixel-art.
  rect(-12, 10, 3, 2, "#c6f5e8"); rect(-5, 11, 3, 2, "#348fa4"); rect(3, 10, 3, 2, "#b7eee3"); rect(10, 11, 3, 2, "#176a88");
  rect(-8, 15, 3, 2, "#238aa1"); rect(0, 16, 3, 2, "#b5f0e4"); rect(7, 15, 3, 2, "#277f98");
  rect(-11, 21, 3, 2, "#9ae8df"); rect(-3, 22, 3, 2, "#14617f"); rect(5, 21, 3, 2, "#8bdfd9");
  rect(-8, 27, 3, 2, "#23849b"); rect(0, 28, 3, 2, "#a2e7de"); rect(6, 27, 3, 2, "#176783");
  rect(-5, 34, 3, 2, "#7ad9d5"); rect(2, 35, 3, 2, "#165e7c");
  // Long stepped fin rays flow outward from the tail fan's base.
  rect(-16, 39, 3, 2, "#67cbd1"); rect(-20, 36, 3, 2, "#3da5b7"); rect(-24, 33, 3, 2, "#88e3dc");
  rect(13, 39, 3, 2, "#51bac8"); rect(18, 36, 3, 2, "#287f9a"); rect(22, 33, 3, 2, "#75d5d6");

  // Head, arms and shoulders breathe together; the tail stays anchored in the water.
  const upperBreath = Math.round(Math.sin((time || 0) / 320));
  ctx.save();
  ctx.translate(0, upperBreath);

  // Longer, broader arms behind the torso: exposed outer silhouettes now reach farther down.
  toneRect(-39, -25, 17, 17, "#f2d0ad", "#c98b6c", "#8b554a", false);
  rect(-42, -22, 8, 12, "#a76b59");
  rect(-40, -20, 5, 6, "#f6daba");
  toneRect(-41, -11, 16, 19, "#e9bd95", "#b87862", "#70464a", false);
  rect(-39, -7, 6, 6, "#f5d8b5");
  rect(-40, 0, 5, 4, "#9f6255");
  toneRect(22, -25, 17, 17, "#f4d4b2", "#c88a69", "#85504a", false);
  rect(31, -22, 9, 12, "#a96857");
  rect(30, -20, 5, 6, "#f7d9b6");
  toneRect(25, -11, 16, 19, "#e8b98e", "#ae715c", "#70434a", false);
  rect(28, -7, 7, 6, "#f6d9b4");
  rect(32, 0, 5, 4, "#95594f");
  // Small contour planes on the forearms make the extended limbs read as sculpted muscle.
  rect(-37, -2, 3, 2, "#f5d7b3");
  rect(-34, 1, 3, 2, "#9f6255");
  rect(34, -2, 3, 2, "#f1c9a4");
  rect(31, 1, 3, 2, "#95594f");
  // Gold bracers
  rect(-37, -10, 13, 4, "#80522c");
  rect(-36, -10, 11, 2, "#edc65c");
  rect(23, -8, 13, 4, "#80522c");
  rect(24, -8, 11, 2, "#f1cb67");
  rect(-34, -8, 2, 2, "#fff0a1");
  rect(-30, -8, 2, 2, "#bd8138");
  rect(27, -6, 2, 2, "#fff0a1");
  rect(32, -6, 2, 2, "#bd8138");

  // Broad torso silhouette and pectoral muscles — intentionally bare, no armor
  rect(-25, -28, 50, 40, "#102f49");
  rect(-22, -27, 44, 37, "#8e5149");
  rect(-21, -26, 42, 33, "#c88768");
  toneRect(-21, -26, 21, 17, "#f4d5b0", "#d39a76", "#a76858", false);
  toneRect(0, -26, 21, 17, "#eac29a", "#bf8063", "#80504b", false);
  // Shoulder caps
  toneRect(-27, -27, 15, 10, "#f5d9b7", "#d49a77", "#92594f", false);
  toneRect(12, -27, 15, 10, "#eac29a", "#bd8065", "#79494a", false);
  // Pecs with upper-left highlights and lower-right shadows
  rect(-19, -21, 18, 12, "#9e6254");
  rect(1, -21, 18, 12, "#87504b");
  toneRect(-18, -21, 16, 9, "#ffe0bc", "#e0a17a", "#b36f5e", false);
  toneRect(2, -21, 15, 9, "#f3cda7", "#d18d6d", "#985b51", false);
  rect(-17, -12, 14, 3, "#b87561");
  rect(3, -12, 13, 3, "#965b52");
  rect(-1, -19, 2, 10, "#8b514d");
  rect(-2, -18, 1, 7, "#f7d7b1");
  // Sculpted abs, still chunky pixel art
  toneRect(-12, -8, 10, 7, "#f0c69f", "#cd8e6b", "#95584e", false);
  toneRect(2, -8, 10, 7, "#e3b38c", "#ba7a61", "#7e4b49", false);
  toneRect(-11, 0, 9, 6, "#e8bd95", "#bd7f62", "#8b514b", false);
  toneRect(2, 0, 9, 6, "#dba981", "#aa6b59", "#764447", false);
  rect(-1, -7, 2, 14, "#87504c");
  rect(-20, 4, 40, 5, "#7f4a47");
  rect(-17, 4, 34, 3, "#bd7d61");
  // Collar bone highlights / sea-god pendant
  rect(-14, -25, 8, 2, "#ffe5c6");
  rect(6, -25, 8, 2, "#f5d5ad");
  rect(-4, -23, 8, 5, "#d8ac50");
  rect(-2, -22, 4, 3, "#51d0d9");
  // Extra sculpted planes: shoulders, chest separations, obliques and a defined navel.
  rect(-29, -23, 5, 3, "#ffe2bf");
  rect(-31, -19, 4, 5, "#d89572");
  rect(23, -23, 5, 3, "#f9d2aa");
  rect(27, -19, 4, 5, "#b97760");
  rect(-18, -19, 10, 2, "#ffe7c7");
  rect(8, -19, 9, 2, "#f8d7b5");
  rect(-19, -14, 14, 2, "#a96357");
  rect(5, -14, 13, 2, "#8b4f4b");
  rect(-15, -10, 5, 2, "#f4cba4");
  rect(10, -10, 5, 2, "#e2b18a");
  // Serratus and oblique muscle blocks create a more athletic V-shaped torso.
  rect(-19, -7, 5, 3, "#b97860");
  rect(-17, -3, 4, 3, "#a86656");
  rect(14, -7, 5, 3, "#8f504c");
  rect(13, -3, 4, 3, "#81494a");
  rect(-12, -1, 8, 1, "#a56858");
  rect(4, -1, 8, 1, "#92564e");
  rect(-11, 2, 8, 1, "#a46658");
  rect(4, 2, 8, 1, "#8a4f4a");
  rect(-1, -8, 2, 11, "#81504b");
  rect(-1, 1, 2, 2, "#f2c19a");
  rect(-2, 2, 4, 2, "#734546");
  rect(-1, 2, 2, 1, "#e4b28d");
  // Small pixel highlights make the skin read as sculpted rather than flat.
  rect(-25, -20, 3, 2, "#f7d9b8");
  rect(22, -20, 3, 2, "#f4cba7");
  rect(-21, -9, 2, 4, "#f5d0aa");
  rect(19, -9, 2, 4, "#d9a17d");
  rect(-8, 1, 3, 2, "#f4c79f");
  rect(6, 1, 3, 2, "#d5a079");
  // Pixel-level muscle contour: rib edges, lower-ab highlights and subtle skin creases.
  rect(-17, -8, 2, 3, "#f7d8b5");
  rect(15, -8, 2, 3, "#e3b18c");
  rect(-13, -4, 2, 2, "#f3c99f");
  rect(11, -4, 2, 2, "#dbab83");
  rect(-11, 5, 3, 1, "#f3caa3");
  rect(8, 5, 3, 1, "#d9a47e");
  rect(-23, -16, 2, 4, "#e5af89");
  rect(21, -16, 2, 4, "#c38367");

  // Head is slightly enlarged against the torso/tail, aiming for an imposing ~6-head silhouette.
  // This keeps the body muscular and broad without making the head look tiny.
  ctx.save();
  ctx.translate(0, -42);
  ctx.scale(0.92, 0.92);
  ctx.translate(0, 42);

  // Neck and head, with long white hair and a flowing white beard
  rect(-9, -37, 18, 12, "#874e49");
  rect(-8, -37, 15, 10, "#d49a77");
  rect(-15, -55, 30, 23, "#10324a");
  rect(-13, -53, 26, 20, "#c7896d");
  rect(-12, -52, 24, 16, "#e8b994");
  // Side hair / swept white locks
  rect(-17, -53, 6, 17, "#e7e4d8");
  rect(-15, -50, 5, 13, "#ffffff");
  rect(11, -53, 6, 17, "#b7c7d1");
  rect(12, -50, 4, 13, "#e5eee9");
  rect(-14, -36, 6, 6, "#fffef0");
  rect(8, -37, 7, 7, "#d9e4e1");
  // Strong angular brows, deep-set sea-blue eyes, forehead creases and cheek planes.
  rect(-11, -49, 6, 2, "#573a37");
  rect(-7, -47, 5, 2, "#573a37");
  rect(4, -47, 5, 2, "#513633");
  rect(7, -49, 5, 2, "#513633");
  rect(-10, -45, 7, 5, "#12344a");
  rect(3, -45, 7, 5, "#12344a");
  rect(-9, -44, 4, 3, "#e9f8f2");
  rect(4, -44, 4, 3, "#e9f8f2");
  rect(-8, -43, 2, 3, "#236b83");
  rect(5, -43, 2, 3, "#236b83");
  rect(-9, -43, 1, 1, "#ffffff");
  rect(4, -43, 1, 1, "#ffffff");
  rect(-12, -42, 2, 2, "#c2836a");
  rect(10, -42, 2, 2, "#aa6c5b");
  // Nose bridge, nostrils and a firm, frowning mouth under the moustache.
  rect(-2, -43, 4, 4, "#f2c79f");
  rect(-3, -40, 2, 2, "#b87560");
  rect(2, -40, 2, 2, "#a86758");
  rect(-2, -39, 4, 1, "#804a45");
  rect(-4, -49, 3, 1, "#b97765");
  rect(1, -49, 3, 1, "#a96959");
  rect(-11, -36, 3, 2, "#f0c49d");
  rect(8, -36, 3, 2, "#d7a07e");
  // Mustache and long, forked beard silhouette
  rect(-13, -39, 26, 8, "#b7c5cc");
  rect(-12, -39, 24, 5, "#ffffff");
  rect(-15, -37, 10, 5, "#e7eee8");
  rect(5, -37, 10, 5, "#cbd9da");
  rect(-11, -34, 22, 8, "#f6f5e9");
  rect(-9, -28, 18, 6, "#dce5e0");
  rect(-7, -24, 14, 5, "#c6d3d2");
  rect(-5, -21, 10, 4, "#f8f6e9");
  rect(-4, -18, 8, 3, "#dce7e2");
  // Beard strands and highlights
  rect(-12, -35, 2, 4, "#ffffff");
  rect(-9, -32, 2, 7, "#ffffff");
  rect(-6, -33, 2, 6, "#cbdad9");
  rect(-3, -29, 2, 8, "#ffffff");
  rect(1, -31, 2, 7, "#eef4ed");
  rect(4, -32, 2, 7, "#eef4ed");
  rect(8, -33, 2, 5, "#c5d6d6");
  rect(10, -35, 2, 4, "#ffffff");
  rect(-1, -24, 2, 5, "#ffffff");
  rect(-4, -21, 2, 3, "#aabec2");
  rect(3, -21, 2, 3, "#dce7e2");

  // Large gold crown sitting naturally on his hair
  rect(-17, -58, 34, 6, "#8e5e28");
  rect(-15, -61, 30, 5, "#c78e36");
  rect(-14, -63, 6, 7, "#e6ba52");
  rect(-6, -66, 7, 10, "#f8d875");
  rect(3, -66, 7, 10, "#ffe795");
  rect(10, -63, 6, 7, "#d6a244");
  rect(-12, -59, 24, 2, "#fff0a0");
  rect(-4, -57, 8, 3, "#377f9c");
  rect(-2, -56, 4, 2, "#7de0e2");
  // Crown engraving, jewel glints, layered side locks and tiny white-hair strands.
  rect(-13, -62, 3, 2, "#fff0a1");
  rect(5, -63, 3, 2, "#fff0a1");
  rect(-1, -64, 3, 3, "#a4f1f0");
  rect(-14, -48, 2, 5, "#f7fff7");
  rect(-12, -44, 2, 4, "#c9d8d8");
  rect(13, -48, 2, 5, "#ffffff");
  rect(11, -44, 2, 4, "#b7c8cf");
  rect(-8, -50, 3, 1, "#866056");
  rect(5, -50, 3, 1, "#7c5149");
  // Extra beard strands create a layered, wind-combed silhouette.
  rect(-13, -32, 2, 5, "#c2d2d5");
  rect(-10, -29, 2, 6, "#ffffff");
  rect(-7, -26, 2, 5, "#eef5ef");
  rect(6, -29, 2, 6, "#ffffff");
  rect(9, -32, 2, 5, "#c6d7da");
  rect(12, -35, 2, 4, "#eef7f0");

  ctx.restore(); // enlarged head / crown / beard pass

  // Hand gripping the trident, drawn over the shaft
  rect(29, -17, 8, 7, "#8e554b");
  rect(29, -17, 6, 4, "#f3c99f");
  rect(33, -19, 5, 7, "#e8bc90");
  rect(34, -17, 3, 3, "#fff0ce");
  ctx.restore();

  // Controlled, small water reflections (not flashing)
  rect(-20, 14, 7, 2, "#b8f0e6");
  rect(8, 19, 6, 2, "#5cc8d0");
  rect(-6, 30, 5, 2, "#90e0db");
  rect(3, 39, 5, 2, "#3b91a7");

  ctx.restore();
}

/* =========================================================
   DRAGON
   ========================================================= */

function drawDragon(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const t = time || 0;
  const nearWingFlap = Math.round(Math.sin(t / 165) * 4);
  const farWingFlap = Math.round(Math.sin(t / 165 + Math.PI) * 3);
  const tailWag = Math.round(Math.sin(t / 205) * 2);
  const breath = Math.round(Math.sin(t / 310));

  // Ground shadow and trailing tail remain crisp, stepped blocks.
  rect(-55, 46, 108, 6, "#250812");
  rect(-42, 44, 82, 3, "#3c101b");
  ctx.save();
  ctx.translate(0, tailWag);
  rect(15, 4, 20, 12, "#330711");
  rect(29, 2, 14, 11, "#330711");
  rect(39, -2, 13, 10, "#330711");
  rect(48, -8, 10, 12, "#330711");
  rect(50, -12, 10, 7, "#330711");
  rect(17, 6, 18, 7, "#94182a");
  rect(31, 4, 12, 6, "#b62132");
  rect(41, 0, 11, 5, "#d0323f");
  rect(49, -7, 7, 7, "#ed4a4e");
  rect(52, -11, 6, 4, "#ff7767");
  rect(51, -5, 6, 4, "#4a0b18");
  rect(28, -2, 4, 5, "#5a0e1e"); rect(29, -5, 4, 5, "#f05a5b");
  rect(37, -5, 4, 5, "#5a0e1e"); rect(38, -8, 4, 5, "#d94149");
  rect(46, -8, 4, 4, "#5a0e1e"); rect(47, -11, 4, 4, "#ff7767");
  ctx.restore();

  // Far wing: a continuous crimson membrane with only the outer pixel contour darkened.
  ctx.save(); ctx.translate(0, farWingFlap);
  rect(-18, -25, 18, 13, "#310711");
  rect(-25, -34, 14, 12, "#310711");
  rect(-33, -43, 13, 12, "#310711");
  rect(-42, -52, 14, 12, "#310711");
  rect(-44, -56, 9, 8, "#310711");
  rect(-16, -24, 14, 9, "#7c1424");
  rect(-24, -33, 12, 9, "#9e1b2b");
  rect(-32, -42, 11, 9, "#ba2635");
  rect(-40, -50, 11, 8, "#d93640");
  rect(-43, -54, 6, 5, "#f45c5b");
  // Pixel ribs run inward as connected bands, not as borders around every step.
  rect(-15, -23, 3, 8, "#e34a50"); rect(-21, -31, 3, 8, "#e34a50");
  rect(-28, -39, 3, 8, "#ed5758"); rect(-35, -47, 3, 7, "#f46b66");
  rect(-17, -20, 8, 2, "#f46b66"); rect(-26, -29, 7, 2, "#f46b66");
  ctx.restore();

  // Near wing. Its whole-pixel travel creates a clear flap without blurred rotation.
  ctx.save(); ctx.translate(0, nearWingFlap);
  rect(2, -24, 17, 13, "#310711");
  rect(10, -34, 15, 12, "#310711");
  rect(19, -44, 14, 12, "#310711");
  rect(29, -53, 13, 12, "#310711");
  rect(39, -61, 11, 12, "#310711");
  rect(5, -22, 12, 9, "#781322");
  rect(13, -32, 12, 9, "#9e1b2c");
  rect(22, -42, 11, 9, "#bd2635");
  rect(32, -51, 10, 9, "#d93841");
  rect(41, -59, 7, 9, "#f05255");
  rect(8, -22, 3, 9, "#eb5559"); rect(15, -31, 3, 9, "#f35e5e");
  rect(24, -41, 3, 9, "#f35e5e"); rect(34, -50, 3, 8, "#ff7670");
  rect(43, -57, 3, 6, "#ff9080");
  rect(10, -19, 8, 2, "#ff7a6c"); rect(19, -29, 8, 2, "#ff7a6c");
  rect(29, -39, 8, 2, "#ff8d7a");
  ctx.restore();

  // Far legs first; feet stay grounded while the chest breathes by a single pixel.
  rect(-13, 7, 9, 19, "#360a16"); rect(-14, 22, 10, 12, "#7b1424");
  rect(-19, 32, 17, 6, "#2d0813"); rect(-16, 31, 7, 3, "#db3b45");
  rect(14, 7, 10, 20, "#340914"); rect(15, 23, 10, 11, "#711221");
  rect(11, 32, 17, 6, "#2d0813"); rect(14, 31, 7, 3, "#d63843");

  ctx.save(); ctx.translate(0, breath);
  // Long neck and throat taper into the head.
  rect(-28, -36, 18, 21, "#310711");
  rect(-25, -34, 14, 17, "#9a1a2b");
  rect(-22, -29, 13, 12, "#c12c3a");
  rect(-21, -25, 13, 8, "#e3484c");
  rect(-20, -20, 14, 7, "#751322");
  rect(-24, -17, 10, 8, "#390a16");
  rect(-19, -36, 5, 6, "#550d1d"); rect(-19, -40, 4, 6, "#e3474d");
  rect(-15, -31, 5, 6, "#600f20"); rect(-15, -35, 4, 6, "#bf2938");

  // Full four-legged body, with a warm segmented belly and crimson scale plates.
  rect(-18, -17, 40, 35, "#300711");
  rect(-15, -15, 34, 29, "#94192a");
  rect(-12, -17, 25, 7, "#bb2434");
  rect(-8, -12, 23, 13, "#d33943");
  rect(-12, -1, 30, 12, "#b52636");
  rect(-10, 7, 24, 8, "#811525");
  rect(-8, 1, 20, 4, "#f4c18d");
  rect(-7, 5, 19, 4, "#e9a16f");
  rect(-5, 9, 17, 4, "#c87550");
  rect(-3, 13, 13, 3, "#8d3d32");
  rect(-5, 2, 3, 3, "#ffe0aa"); rect(1, 6, 3, 3, "#ffd196"); rect(6, 10, 3, 3, "#e59a69");

  // Shoulder/forelegs have distinct elbows and ivory hooked claws.
  rect(-19, -7, 11, 12, "#390a16"); rect(-18, -4, 8, 12, "#a01c2d");
  rect(-17, 5, 8, 12, "#801525"); rect(-19, 15, 10, 6, "#350811");
  rect(-19, 19, 4, 4, "#f5dfd0"); rect(-13, 19, 4, 4, "#fff0df");
  rect(9, -5, 10, 12, "#350811"); rect(10, -2, 8, 12, "#a31e2e");
  rect(11, 7, 8, 11, "#7c1424"); rect(9, 15, 11, 6, "#320710");
  rect(10, 19, 4, 4, "#fff0df"); rect(16, 19, 4, 4, "#f1d6c7");

  // Near hind legs add weight and separate paws for a readable quadruped stance.
  rect(14, 10, 11, 15, "#310711"); rect(15, 20, 10, 13, "#821526");
  rect(11, 31, 17, 7, "#2c0813"); rect(16, 22, 4, 8, "#d33a43");
  rect(13, 35, 4, 3, "#fff0df"); rect(20, 35, 4, 3, "#f4ded0");
  rect(-8, 12, 9, 14, "#310711"); rect(-7, 22, 9, 11, "#771424");
  rect(-11, 31, 16, 7, "#2c0813"); rect(-6, 24, 3, 6, "#d43a43");
  rect(-8, 35, 4, 3, "#f8e3d6"); rect(-2, 35, 4, 3, "#e6cfc5");
  ctx.restore();

  // Fierce head with long snout, fangs, horns and orange slit eye.
  rect(-40, -49, 25, 21, "#300711");
  rect(-37, -47, 20, 17, "#9a1b2c");
  rect(-35, -43, 17, 10, "#d63842");
  rect(-47, -39, 17, 10, "#310711");
  rect(-45, -38, 14, 7, "#b62635");
  rect(-45, -32, 14, 4, "#67101f");
  rect(-44, -31, 3, 4, "#fff0df"); rect(-37, -31, 3, 4, "#fff0df");
  rect(-48, -39, 4, 4, "#21060e"); rect(-47, -38, 2, 2, "#ffb069");
  rect(-37, -43, 12, 4, "#430a17");
  rect(-34, -42, 7, 4, "#ffc25f"); rect(-32, -42, 3, 3, "#fff0b4");
  rect(-36, -37, 8, 3, "#f35b58"); rect(-32, -34, 7, 3, "#ab1f30");
  rect(-24, -40, 4, 3, "#f58b71");
  // Back-swept ivory horns stand out against the red scales.
  rect(-35, -55, 5, 11, "#350812"); rect(-34, -59, 4, 7, "#ffcf9d");
  rect(-31, -57, 4, 7, "#d8a277"); rect(-22, -54, 5, 10, "#350812");
  rect(-21, -59, 4, 7, "#f3c18f"); rect(-18, -55, 4, 6, "#be805e");

  // Dorsal ridges and scale highlights in warm red/orange blocks.
  rect(-8, -22, 5, 7, "#390a16"); rect(-7, -26, 4, 6, "#ef4d51");
  rect(0, -21, 5, 6, "#390a16"); rect(1, -24, 4, 5, "#d73943");
  rect(7, -18, 5, 5, "#390a16"); rect(8, -21, 4, 4, "#c42d3b");
  rect(15, -14, 5, 4, "#390a16"); rect(16, -17, 4, 4, "#e7474c");
  rect(-13, -12, 8, 3, "#f05a5d"); rect(-2, -13, 7, 3, "#e94a51");
  rect(8, -10, 5, 3, "#d83a45"); rect(17, -6, 4, 3, "#b92b3a");
  rect(-18, -30, 5, 3, "#ff7069"); rect(-25, -40, 5, 2, "#ff9080");
  rect(-6, 15, 3, 2, "#f4c18d"); rect(3, 17, 3, 2, "#f1b37b");

  ctx.restore();
}

function drawVoidEmperor(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const t = time || 0;
  const upperFlap = Math.round(Math.sin(t / 150) * 4);
  const lowerFlap = Math.round(Math.sin(t / 150 + 1.15) * 3);
  const tailWag = Math.round(Math.sin(t / 210) * 2);
  const headMotion = Math.round(Math.sin(t / 195) * 1);

  rect(-60, 47, 120, 6, "#100b1a");
  rect(-46, 45, 92, 3, "#21132d");

  // A long, segmented void-tail sits behind the four legs.
  ctx.save(); ctx.translate(0, tailWag);
  rect(18, 5, 18, 12, "#160c20"); rect(31, 3, 14, 11, "#160c20");
  rect(41, -2, 13, 10, "#160c20"); rect(50, -8, 11, 10, "#160c20");
  rect(56, -13, 9, 9, "#160c20");
  rect(20, 7, 15, 7, "#3a2050"); rect(33, 5, 11, 6, "#4b2864");
  rect(43, 0, 10, 5, "#5b3476"); rect(52, -6, 8, 6, "#71438c");
  rect(58, -11, 5, 6, "#9a60b5");
  rect(31, 0, 4, 5, "#8d54a9"); rect(41, -4, 4, 5, "#a16abd");
  ctx.restore();

  // Wing painter: each membrane is a single connected stepped mass, with pixel ribs.
  const drawWing = (side, upper, flap) => {
    ctx.save();
    ctx.scale(side, 1);
    ctx.translate(0, flap);
    if (upper) {
      // dark contiguous outside silhouette
      rect(8, -30, 15, 16, "#160b20"); rect(16, -40, 15, 14, "#160b20");
      rect(25, -50, 14, 14, "#160b20"); rect(34, -59, 12, 13, "#160b20");
      rect(42, -63, 10, 12, "#160b20"); rect(40, -50, 12, 13, "#160b20");
      rect(34, -39, 12, 12, "#160b20"); rect(26, -30, 12, 11, "#160b20");
      rect(16, -24, 15, 9, "#160b20");
      // unified violet membrane; color bands touch rather than outlining each stair
      rect(11, -29, 10, 12, "#3c2054"); rect(19, -39, 10, 12, "#51276b");
      rect(28, -49, 10, 12, "#63327e"); rect(37, -58, 8, 11, "#794393");
      rect(43, -60, 6, 8, "#8e52a8"); rect(40, -48, 8, 10, "#5a2b74");
      rect(34, -37, 8, 10, "#4b2463"); rect(26, -29, 8, 9, "#3f2058");
      // bright, chunky veins follow the wing frame
      rect(14, -27, 3, 7, "#9863b2"); rect(18, -35, 3, 7, "#b17ac7");
      rect(23, -43, 3, 7, "#b17ac7"); rect(32, -52, 3, 7, "#c28bd4");
      rect(40, -59, 3, 6, "#d09be0"); rect(25, -30, 8, 2, "#8954a5");
      // Jewel-toned accents break up the dark violet membrane without replacing its base.
      rect(16, -31, 3, 2, "#63e7e4"); rect(27, -43, 3, 2, "#f36bcc");
      rect(36, -54, 3, 2, "#f3d17c"); rect(43, -58, 2, 3, "#8af3ee");
    } else {
      rect(8, -20, 15, 13, "#160b20"); rect(17, -28, 14, 12, "#160b20");
      rect(27, -36, 14, 12, "#160b20"); rect(37, -43, 12, 11, "#160b20");
      rect(44, -42, 10, 11, "#160b20"); rect(40, -31, 12, 12, "#160b20");
      rect(31, -23, 12, 10, "#160b20"); rect(20, -17, 14, 9, "#160b20");
      rect(11, -16, 11, 8, "#160b20");
      rect(11, -19, 10, 9, "#351a4a"); rect(19, -27, 10, 9, "#48225f");
      rect(29, -35, 10, 9, "#5a2b72"); rect(39, -41, 8, 9, "#71408b");
      rect(45, -39, 6, 8, "#81509b"); rect(40, -29, 8, 9, "#512467");
      rect(31, -22, 8, 8, "#44205a"); rect(21, -16, 9, 7, "#381a4d");
      rect(14, -18, 3, 7, "#8953a4"); rect(21, -25, 3, 7, "#a16ab7");
      rect(30, -33, 3, 7, "#ae78c4"); rect(39, -39, 3, 6, "#c08bd2");
      rect(16, -19, 3, 2, "#62e3e8"); rect(25, -27, 3, 2, "#ef65c5");
      rect(35, -35, 3, 2, "#eed17b"); rect(45, -39, 2, 3, "#9af0eb");
    }
    ctx.restore();
  };
  // Two pairs of wings (four total), with different flap phases for a heavy, layered motion.
  drawWing(-1, true, upperFlap);
  drawWing(1, true, upperFlap);
  drawWing(-1, false, lowerFlap);
  drawWing(1, false, lowerFlap);

  // Four limbs and hooked feet: a broad, grounded dragon body, not a humanoid torso.
  rect(-21, 8, 12, 19, "#170b20"); rect(-21, 22, 12, 12, "#321945");
  rect(-26, 32, 19, 6, "#130a1b"); rect(-22, 31, 8, 4, "#72428c");
  rect(-3, 8, 11, 18, "#160b20"); rect(-2, 22, 11, 12, "#3c2053");
  rect(-6, 32, 19, 6, "#130a1b"); rect(-1, 31, 8, 4, "#794a95");
  rect(13, 7, 12, 20, "#160b20"); rect(14, 22, 12, 12, "#321945");
  rect(10, 32, 19, 6, "#130a1b"); rect(15, 31, 8, 4, "#72428c");
  rect(-12, 6, 11, 19, "#170b20"); rect(-11, 21, 11, 13, "#2e183f");
  rect(-16, 32, 18, 6, "#130a1b"); rect(-12, 31, 7, 4, "#684080");

  // The two necks emerge from one broad chest; they do not resemble two copies pasted on top.
  rect(-29, -32, 17, 22, "#160b20"); rect(-27, -29, 13, 19, "#38204c");
  rect(-24, -26, 9, 14, "#512b67"); rect(-23, -20, 8, 8, "#6b3c80");
  rect(8, -32, 17, 22, "#160b20"); rect(10, -29, 13, 19, "#38204c");
  rect(13, -26, 9, 14, "#512b67"); rect(14, -20, 8, 8, "#6b3c80");

  // One body breathes by a pixel; segmented belly plates and violet scales catch the light.
  ctx.save(); ctx.translate(0, headMotion);
  rect(-23, -20, 47, 38, "#160b20");
  rect(-20, -18, 41, 34, "#321944");
  rect(-16, -18, 33, 11, "#4a2860");
  rect(-14, -10, 28, 15, "#5b3272");
  rect(-17, 3, 33, 11, "#432258");
  rect(-13, 0, 26, 4, "#b68ac6"); rect(-12, 4, 25, 4, "#9b6bb0");
  rect(-10, 8, 22, 4, "#805493"); rect(-7, 12, 16, 3, "#573269");
  rect(-11, -15, 7, 3, "#82529a"); rect(1, -14, 7, 3, "#76458c");
  rect(-4, -6, 7, 3, "#c79ad5"); rect(7, -3, 6, 3, "#8d55a6");
  // Small magical inlays: teal, hot pink and antique gold contrast with the void-purple armor.
  rect(-17, -12, 3, 2, "#5ee7df"); rect(13, -11, 3, 2, "#ed62c5");
  rect(-14, -3, 4, 2, "#e8c879"); rect(9, 5, 3, 2, "#5ee7df");
  rect(-5, 11, 3, 2, "#ef6bc8"); rect(3, 13, 4, 2, "#a5f0e8");

  // Left head, turned outwards with two horns, a magenta eye and visible fangs.
  rect(-39, -48, 24, 19, "#160b20"); rect(-36, -46, 19, 15, "#321944");
  rect(-43, -41, 17, 10, "#241033"); rect(-44, -39, 13, 6, "#49235d");
  rect(-44, -34, 13, 3, "#100a19"); rect(-42, -34, 3, 4, "#f1d9e5"); rect(-36, -34, 3, 4, "#f1d9e5");
  rect(-33, -44, 11, 4, "#170b20"); rect(-31, -43, 7, 3, "#ef59c9"); rect(-29, -43, 3, 2, "#fff0ff");
  rect(-34, -53, 5, 10, "#160b20"); rect(-33, -58, 4, 7, "#a76ac1");
  rect(-24, -54, 5, 11, "#160b20"); rect(-23, -59, 4, 7, "#80509b");
  rect(-26, -38, 6, 3, "#8e5aad");
  rect(-41, -45, 3, 2, "#61e8e5"); rect(-37, -31, 2, 2, "#f4cc7a");
  rect(-30, -52, 2, 3, "#e95fc0");

  // Right head mirrors the anatomy and faces away, giving the emperor a true two-headed silhouette.
  rect(15, -47, 24, 19, "#160b20"); rect(17, -45, 19, 15, "#321944");
  rect(26, -41, 17, 10, "#241033"); rect(30, -39, 13, 6, "#49235d");
  rect(30, -34, 13, 3, "#100a19"); rect(32, -34, 3, 4, "#f1d9e5"); rect(38, -34, 3, 4, "#f1d9e5");
  rect(24, -43, 11, 4, "#170b20"); rect(26, -42, 7, 3, "#ef59c9"); rect(28, -42, 3, 2, "#fff0ff");
  rect(19, -53, 5, 10, "#160b20"); rect(20, -58, 4, 7, "#a76ac1");
  rect(29, -54, 5, 11, "#160b20"); rect(30, -59, 4, 7, "#80509b");
  rect(25, -38, 6, 3, "#8e5aad");
  rect(37, -45, 3, 2, "#61e8e5"); rect(40, -31, 2, 2, "#f4cc7a");
  rect(24, -52, 2, 3, "#e95fc0");

  // Dark emperor's crown rests between both skulls, rather than floating over one head.
  rect(-8, -58, 16, 5, "#130a1b"); rect(-6, -61, 12, 4, "#6b4582");
  rect(-6, -66, 3, 7, "#9c70b4"); rect(-1, -69, 3, 10, "#c294d4"); rect(4, -64, 3, 6, "#81519a");
  rect(-3, -59, 6, 2, "#f1c56d"); rect(-1, -58, 3, 2, "#e95fc0");
  ctx.restore();

  // Controlled, shifting void glints along the limbs and tail.
  rect(-24, 13, 5, 2, "#a26cba"); rect(13, 15, 5, 2, "#8a56a2");
  rect(39, -4, 4, 2, "#b985ce");
  rect(-23, 25, 3, 2, "#66e7df"); rect(-3, 28, 3, 2, "#f0c974");
  rect(16, 25, 3, 2, "#e96bc7"); rect(33, 4, 3, 2, "#73e7e8");
  rect(48, -5, 3, 2, "#e9c16f");
  // Four motes orbit the emperor in a slow, asymmetrical rhythm.
  const motePulse = (Math.sin(t / 175) + 1) / 2;
  ctx.globalAlpha = 0.48 + motePulse * 0.42;
  rect(-48, -19, 3, 3, "#62e8e8"); rect(48, -26, 3, 3, "#f06dc8");
  rect(-40, 10, 2, 2, "#f0ce78"); rect(42, 18, 2, 2, "#aaeff0");
  ctx.restore();
}


/* =========================================================
   NEW STAGE BOSSES: CHIMERA / WORLD TREE TORTOISE / SNOW GODDESS
   Bespoke pixel sprites with independent idle motions.
   ========================================================= */

function drawChimera(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const t = time || 0;
  const breath = Math.round(Math.sin(t / 250) * 1);
  const tailWag = Math.round(Math.sin(t / 155) * 3);
  const lionNod = Math.round(Math.sin(t / 205) * 1);
  const goatNod = Math.round(Math.sin(t / 230 + .7) * 1);
  const wingFlap = Math.round(Math.sin(t / 170) * 3);
  const stepA = Math.round(Math.sin(t / 125) * 1);
  const stepB = -stepA;

  // Heavy contact shadow keeps the chimera grounded.
  rect(-52, 44, 112, 5, "#28301d");
  rect(-40, 42, 86, 3, "#42482a");

  // Two broad, feathered wings sit behind the hybrid body. Their stepped
  // feather rows rise and fall together, avoiding smooth vector-like edges.
  // Far wing: dark silhouette, then separate blocky rows of ochre feathers.
  rect(-30, -43 - wingFlap, 13, 9, "#261812");
  rect(-38, -51 - wingFlap, 12, 11, "#261812");
  rect(-33, -48 - wingFlap, 17, 20, "#4a291c");
  rect(-27, -43 - wingFlap, 14, 16, "#754126");
  rect(-36, -46 - wingFlap, 8, 13, "#9b5c2b");
  rect(-30, -40 - wingFlap, 9, 13, "#bf7b35");
  rect(-23, -34 - wingFlap, 9, 11, "#d59a42");
  rect(-35, -34 - wingFlap, 7, 8, "#d59a42");
  rect(-30, -30 - wingFlap, 7, 7, "#e6b65a");
  rect(-26, -27 - wingFlap, 7, 6, "#b87432");
  // Near wing opens over the rear flank with chunky feather tips.
  rect(7, -42 + wingFlap, 12, 10, "#261812");
  rect(15, -51 + wingFlap, 13, 12, "#261812");
  rect(25, -49 + wingFlap, 12, 12, "#261812");
  rect(33, -42 + wingFlap, 10, 10, "#261812");
  rect(8, -39 + wingFlap, 31, 18, "#5a3020");
  rect(14, -45 + wingFlap, 11, 12, "#a35f2b");
  rect(24, -43 + wingFlap, 12, 12, "#bf7832");
  rect(32, -37 + wingFlap, 8, 10, "#d2923b");
  rect(12, -32 + wingFlap, 10, 10, "#d0923b");
  rect(21, -30 + wingFlap, 10, 8, "#e1aa4c");
  rect(29, -28 + wingFlap, 9, 7, "#a9632b");
  // Dark pixel struts make each wing read as one membrane with feathered edges.
  rect(-30, -40 - wingFlap, 3, 18, "#382018");
  rect(-28, -33 - wingFlap, 15, 2, "#382018");
  rect(12, -39 + wingFlap, 3, 16, "#382018");
  rect(14, -32 + wingFlap, 22, 2, "#382018");

  // Serpent tail is behind the body: one continuous, jointed S-curve.
  ctx.save();
  ctx.translate(0, tailWag);
  rect(15, -3, 15, 11, "#241a15"); rect(25, -7, 14, 10, "#241a15");
  rect(35, -13, 13, 10, "#241a15"); rect(43, -20, 13, 10, "#241a15");
  rect(50, -26, 13, 10, "#241a15");
  rect(17, -1, 12, 6, "#9a702e"); rect(27, -5, 11, 6, "#b68a3a");
  rect(37, -11, 10, 6, "#5d8e3d"); rect(45, -18, 10, 6, "#6fa248");
  rect(52, -24, 9, 6, "#7eaf50");
  // Snake head, open mouth and eye.
  rect(55, -31, 13, 8, "#26331d"); rect(59, -34, 8, 6, "#344b25");
  rect(63, -29, 9, 5, "#4e702f"); rect(66, -26, 7, 3, "#1c2117");
  rect(61, -29, 2, 2, "#f7d15f"); rect(62, -29, 1, 2, "#1b1711");
  rect(67, -25, 2, 3, "#f2e6c7");
  rect(55, -32, 4, 3, "#26331d");
  ctx.restore();

  // Far-side legs first, with muscular joints and small ivory claws.
  rect(12, 8, 10, 17, "#382319"); rect(13, 20, 10, 13, "#7b4d27");
  rect(12 + stepB, 31, 13, 7, "#352015"); rect(15 + stepB, 34, 3, 3, "#e5c87d");
  rect(-10, 7, 10, 17, "#382319"); rect(-9, 20, 9, 13, "#85572c");
  rect(-11 + stepA, 31, 13, 7, "#352015"); rect(-8 + stepA, 34, 3, 3, "#e5c87d");

  // Lion's broad body, with a stepped outline and layered tawny fur.
  rect(-28, -11 + breath, 52, 29, "#241710");
  rect(-24, -15 + breath, 44, 30, "#704221");
  rect(-20, -13 + breath, 37, 24, "#a7652b");
  rect(-14, -11 + breath, 27, 19, "#c18438");
  rect(-8, -8 + breath, 18, 13, "#d59a46");
  rect(-18, 4 + breath, 30, 5, "#8d5229");
  rect(-22, -4 + breath, 7, 5, "#d49a45"); rect(3, -2 + breath, 8, 5, "#e0ad54");
  rect(12, 2 + breath, 6, 5, "#8c5429"); rect(-5, 8 + breath, 9, 3, "#e8b85f");
  // Back ridge and shoulder fur break the rectangular body silhouette.
  rect(-17, -19 + breath, 12, 6, "#53301d"); rect(-8, -20 + breath, 13, 6, "#7d4a23");
  rect(3, -16 + breath, 12, 5, "#a9672b"); rect(12, -12 + breath, 8, 5, "#c48538");

  // Near-side legs, thicker at the shoulders and ending in paw-shaped feet.
  rect(17, 7, 12, 18, "#2b1b14"); rect(18, 19, 12, 14, "#925b2b");
  rect(14 + stepA, 30, 18, 9, "#2a1a13"); rect(19 + stepA, 33, 4, 3, "#f0d18a");
  rect(-28, 5, 12, 19, "#2b1b14"); rect(-28, 18, 12, 15, "#a56a31");
  rect(-33 + stepB, 30, 18, 9, "#2a1a13"); rect(-28 + stepB, 33, 4, 3, "#f0d18a");
  rect(-24, 23, 6, 5, "#c9893b"); rect(20, 24, 6, 4, "#c9893b");

  // Lion mane: a single dark, jagged silhouette with gold pixel locks.
  ctx.save(); ctx.translate(0, lionNod);
  rect(-48, -34, 27, 30, "#241610"); rect(-45, -39, 22, 31, "#5a3019");
  rect(-41, -37, 22, 29, "#81461f"); rect(-36, -34, 20, 25, "#a96128");
  rect(-47, -28, 8, 16, "#9a5725"); rect(-43, -21, 8, 12, "#bc7832");
  rect(-38, -42, 8, 8, "#9b5727"); rect(-31, -39, 9, 8, "#c07b30");
  rect(-27, -34, 8, 9, "#d0923b"); rect(-44, -12, 10, 7, "#6b3a1d");
  rect(-36, -11, 9, 7, "#bf792e"); rect(-31, -18, 7, 8, "#d08b36");
  rect(-39, -31, 9, 8, "#d29645"); rect(-32, -27, 6, 7, "#e2aa55");
  // Ears and lion face, angled to the left.
  rect(-43, -35, 9, 8, "#2b1913"); rect(-42, -33, 5, 5, "#b97a36");
  rect(-30, -34, 8, 7, "#2b1913"); rect(-29, -32, 4, 4, "#c3863b");
  rect(-49, -30, 21, 19, "#291814"); rect(-47, -28, 17, 16, "#c0833b");
  rect(-52, -24, 11, 9, "#d5a35a"); rect(-51, -22, 9, 5, "#ead09a");
  rect(-49, -30, 9, 5, "#4d2a19"); rect(-43, -27, 4, 3, "#f6ca4e");
  rect(-42, -27, 2, 3, "#20150e"); rect(-53, -17, 15, 4, "#2a1215");
  rect(-49, -15, 3, 4, "#fff0cc"); rect(-43, -15, 3, 4, "#fff0cc");
  rect(-53, -24, 4, 3, "#211511");

  // The goat neck rises distinctly from the back; curved horns use stair-step pixels.
  rect(0, -23, 13, 12, "#34231b"); rect(2, -31, 11, 13, "#827354");
  rect(4, -38, 13, 12, "#a99870"); rect(8, -35, 12, 10, "#d4c49b");
  rect(16, -32, 10, 7, "#d9c99f"); rect(21, -30, 6, 4, "#f0e1b9");
  rect(12, -36, 5, 4, "#d6c59a"); // ear
  rect(3, -42, 6, 7, "#5e503a"); rect(5, -46, 4, 6, "#dfcca0");
  // left curling horn
  rect(3, -46, 4, 5, "#f0dcb0"); rect(0, -50, 5, 5, "#d6c39b");
  rect(-2, -55, 5, 6, "#c5b187"); rect(-1, -58, 4, 5, "#f0e2bd");
  rect(13, -43, 5, 7, "#5e503a"); rect(15, -48, 5, 7, "#d9c9a1");
  rect(18, -53, 5, 6, "#c5b187"); rect(20, -56, 4, 5, "#f0e2bd");
  rect(15, -34, 3, 3, "#d8b94b"); rect(16, -34, 1, 3, "#211a13");
  rect(21, -28, 5, 3, "#39231b"); rect(23, -27, 3, 3, "#f7e8bd");
  ctx.restore();

  // Warm sparks and a few grass motes orbit the hybrid beast.
  for (let i = 0; i < 5; i++) {
    const phase = t / 230 + i * 1.31;
    const px = Math.round(Math.sin(phase) * (34 + (i % 2) * 7));
    const py = Math.round(-13 + Math.cos(phase * 1.3) * 21);
    rect(px, py, 2 + (i % 2), 2, i % 2 ? "#efc35a" : "#89aa4c");
  }
  ctx.restore();
}

function drawWorldTreeTortoise(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const t = time || 0;
  const footA = Math.round(Math.sin(t / 205) * 1);
  const footB = -footA;
  const sway = Math.round(Math.sin(t / 355) * 2);
  const breathe = Math.round(Math.sin(t / 275) * 1);
  const neckNod = Math.round(Math.sin(t / 225) * 1);
  const vineSway = Math.round(Math.sin(t / 185) * 2);

  rect(-47, 44, 96, 5, "#203c2b"); rect(-35, 42, 73, 3, "#35583c");

  // Ancient tree grows from the shell; the trunk visibly roots into the carapace.
  ctx.save(); ctx.translate(sway, breathe);
  // Main trunk and heavy forked branches.
  rect(-12, -43, 24, 31, "#273b2a"); rect(-9, -49, 18, 39, "#60452d");
  rect(-6, -47, 6, 35, "#93683e"); rect(2, -42, 5, 27, "#4a6a3d");
  rect(-9, -35, 16, 5, "#b08452"); rect(-6, -28, 13, 4, "#b08452");
  rect(-7, -48, 7, 7, "#6f5033");
  // Branches form a clear crown silhouette instead of a flat row of leaves.
  rect(-22, -53, 12, 7, "#60452d"); rect(-28, -60, 13, 8, "#60452d");
  rect(9, -53, 13, 7, "#60452d"); rect(18, -59, 12, 8, "#60452d");
  // Extra forked boughs give the old tree a sprawling, many-branched crown.
  rect(-34, -57, 14, 5, "#60452d"); rect(-41, -64, 12, 7, "#60452d");
  rect(-39, -56, 10, 4, "#93683e"); rect(-44, -61, 7, 4, "#93683e");
  rect(23, -56, 13, 5, "#60452d"); rect(31, -63, 11, 7, "#60452d");
  rect(32, -56, 10, 4, "#93683e"); rect(38, -60, 7, 4, "#93683e");
  // Outer canopy, built in broad joined pixel clusters.
  rect(-22, -69, 19, 13, "#173b2a"); rect(-31, -62, 20, 13, "#173b2a");
  rect(-28, -72, 20, 12, "#173b2a"); rect(-14, -77, 24, 13, "#173b2a");
  rect(5, -74, 22, 13, "#173b2a"); rect(17, -66, 19, 13, "#173b2a");
  rect(25, -58, 11, 10, "#173b2a"); rect(-23, -53, 18, 9, "#173b2a");
  rect(-39, -60, 13, 10, "#173b2a"); rect(-36, -69, 13, 10, "#173b2a");
  rect(29, -67, 14, 11, "#173b2a"); rect(37, -60, 10, 9, "#173b2a");
  // Middle greens give the canopy volume without outlining every stair step.
  rect(-25, -66, 16, 9, "#2f6940"); rect(-18, -72, 17, 8, "#367a44");
  rect(-7, -74, 16, 8, "#438d4b"); rect(7, -70, 17, 9, "#317541");
  rect(19, -63, 13, 9, "#2b613a"); rect(-29, -58, 12, 7, "#3c7f45");
  rect(-11, -62, 16, 7, "#63a653"); rect(3, -64, 15, 8, "#59a04b");
  rect(15, -57, 11, 6, "#438b42"); rect(-3, -55, 11, 5, "#2f6a3b");
  // Sunlit leaf pixels and a tiny hanging vine.
  rect(-14, -70, 5, 3, "#91c862"); rect(1, -68, 4, 3, "#b0d86c");
  rect(21, -61, 4, 3, "#8cc75a"); rect(-28, -59, 4, 3, "#85bd55");
  rect(-35, -63, 4, 3, "#91c862"); rect(34, -63, 4, 3, "#91c862");
  rect(10, -52, 3, 6, "#6a9c45"); rect(12, -48, 3, 5, "#4f843c");
  // Several continuous vines hang from separate boughs. Only the tips sway;
  // their stepped leaf clusters stay attached to the hanging strands.
  rect(-30 + vineSway, -55, 3, 10, "#214b31");
  rect(-29 + vineSway, -46, 2, 12, "#376d37");
  rect(-32 + vineSway, -42, 4, 3, "#548f40");
  rect(-28 + vineSway, -36, 4, 3, "#79b84d");
  rect(-27 + vineSway, -33, 2, 7, "#376d37");
  rect(28 - vineSway, -54, 3, 11, "#214b31");
  rect(29 - vineSway, -44, 2, 12, "#376d37");
  rect(27 - vineSway, -40, 4, 3, "#548f40");
  rect(29 - vineSway, -34, 4, 3, "#79b84d");
  rect(30 - vineSway, -31, 2, 8, "#376d37");
  rect(-7 + Math.round(vineSway / 2), -51, 2, 12, "#376d37");
  rect(-9 + Math.round(vineSway / 2), -43, 4, 3, "#79b84d");
  rect(-7 + Math.round(vineSway / 2), -39, 2, 7, "#376d37");
  ctx.restore();

  // Short tail behind the shell.
  rect(29, 10, 9, 5, "#233d2b"); rect(35, 11, 8, 4, "#557e4a");

  // Far legs sit behind the domed shell; toes have small ivory claws.
  rect(13, 10, 14, 16, "#1c3929"); rect(15 + footA, 23, 14, 13, "#426a48");
  rect(11 + footA, 33, 20, 8, "#203c2a"); rect(16 + footA, 34, 3, 3, "#b7c98c"); rect(22 + footA, 34, 3, 3, "#b7c98c");
  rect(-24, 10, 14, 16, "#1c3929"); rect(-23 + footB, 23, 14, 13, "#426a48");
  rect(-28 + footB, 33, 20, 8, "#203c2a"); rect(-23 + footB, 34, 3, 3, "#b7c98c"); rect(-17 + footB, 34, 3, 3, "#b7c98c");

  // Large domed shell: one clear outer contour and inner scutes, not striped segments.
  rect(-32, -8, 64, 27, "#172c22");
  rect(-30, -17, 60, 25, "#172c22"); rect(-26, -24, 52, 12, "#172c22");
  rect(-20, -29, 40, 9, "#172c22"); rect(-13, -32, 26, 6, "#172c22");
  rect(-29, -9, 58, 24, "#315a3b"); rect(-25, -17, 50, 14, "#3e7448");
  rect(-20, -23, 40, 10, "#4d8550"); rect(-13, -28, 26, 7, "#5b9254");
  // Scutes are warm mossy markings inset into the shell's surface.
  rect(-20, -15, 12, 8, "#75a65a"); rect(-5, -21, 13, 9, "#83b568");
  rect(10, -14, 12, 8, "#6b9e50"); rect(-13, -4, 12, 8, "#5a8b49");
  rect(2, -3, 13, 8, "#6a9a4c"); rect(-27, 4, 13, 7, "#4c7d40");
  rect(17, 2, 10, 7, "#4a783d");
  // Old gold rim follows the dome as one continuous edge.
  rect(-29, 11, 58, 4, "#937044"); rect(-25, 14, 50, 3, "#b28a4e");
  rect(-22, 16, 44, 2, "#243c29");

  // Long, expressive tortoise neck extends well beyond the shell, with
  // segmented mossy scales and a broad, ancient beak-like head.
  rect(-40, -7 + neckNod, 13, 13, "#1b3527");
  rect(-48, -6 + neckNod, 12, 12, "#254c33");
  rect(-56, -5 + neckNod, 13, 12, "#325f3b");
  rect(-63, -3 + neckNod, 12, 10, "#4c8049");
  rect(-69, -4 + neckNod, 12, 10, "#1b3527");
  rect(-68, -3 + neckNod, 9, 7, "#6d9e5b");
  rect(-65, -2 + neckNod, 5, 3, "#d9e79a"); rect(-64, -2 + neckNod, 2, 3, "#263522");
  rect(-72, 2 + neckNod, 8, 4, "#243d2b"); // hooked beak
  rect(-55, -5 + neckNod, 6, 4, "#75a65a");
  rect(-48, -4 + neckNod, 5, 4, "#5b8b4d");
  rect(-42, -3 + neckNod, 5, 4, "#6fa05a");

  // Near front feet overlap the shell rim and show thick toes.
  rect(-25, 9, 13, 11, "#1c3929"); rect(-27 + footA, 18, 15, 16, "#4d794c");
  rect(-31 + footA, 31, 22, 9, "#1a3525");
  rect(-26 + footA, 33, 3, 4, "#c3d69a"); rect(-20 + footA, 33, 3, 4, "#c3d69a"); rect(-14 + footA, 33, 3, 4, "#c3d69a");
  rect(4, 9, 13, 11, "#1c3929"); rect(4 + footB, 18, 15, 16, "#4d794c");
  rect(1 + footB, 31, 22, 9, "#1a3525");
  rect(5 + footB, 33, 3, 4, "#c3d69a"); rect(11 + footB, 33, 3, 4, "#c3d69a"); rect(17 + footB, 33, 3, 4, "#c3d69a");

  // A few leaves drift past the canopy; motion stays separate from the grounded body.
  for (let i = 0; i < 5; i++) {
    const phase = t / 270 + i * 1.22;
    const px = Math.round(Math.sin(phase) * (25 + (i % 3) * 8));
    const py = Math.round(-39 + Math.cos(phase * 1.13) * 25);
    rect(px, py, 2 + (i % 2), 2, i % 2 ? "#c8df82" : "#81bc69");
  }
  ctx.restore();
}

function drawSnowGoddess(x, y, scale, time = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const t = time || 0;
  const breath = Math.round(Math.sin(t / 270) * 1);
  const armSway = Math.round(Math.sin(t / 205) * 1);
  const hairSway = Math.round(Math.sin(t / 245) * 2);
  const skirtSway = Math.round(Math.sin(t / 315) * 1);
  const hairTip = Math.round(Math.sin(t / 185 + .7) * 2);
  const crystalPulse = Math.round((Math.sin(t / 160) + 1) * 1);

  // Full-height, slender silhouette: crown to heels is about eight head units.
  // The exposed upper shoulders, fitted bodice and high slit keep the design
  // elegant and mature while remaining fully clothed and readable in pixels.
  rect(-32, 44, 64, 4, "#537f9e"); rect(-21, 42, 42, 2, "#a8ddeb");

  // Tall stepped ice spires behind the goddess, not attached to her silhouette.
  rect(-35, -38, 5, 27, "#24456d"); rect(-33, -46, 4, 11, "#5ba9d2");
  rect(-31, -41, 3, 23, "#a1e5f5"); rect(-28, -31, 4, 17, "#defbff");
  rect(30, -36, 5, 25, "#24456d"); rect(32, -48, 4, 15, "#5ba9d2");
  rect(28, -42, 3, 23, "#a1e5f5"); rect(24, -30, 4, 17, "#defbff");

  // Long silver hair, shaped into a crisp pixel silhouette around the torso.
  ctx.save(); ctx.translate(hairSway, 0);
  rect(-10, -73, 20, 19, "#203e6a"); rect(-9, -75, 18, 18, "#86bddc");
  rect(-7, -73, 14, 16, "#d7f4fa"); rect(-5, -71, 10, 13, "#f8ffff");
  // Short face-framing locks.
  rect(-11, -65, 4, 16, "#6ca6ce"); rect(-10, -57, 4, 12, "#cceef8");
  rect(7, -65, 4, 16, "#6ca6ce"); rect(6, -57, 4, 12, "#cceef8");
  // Back locks trail to the hips with two independent pixel tips.
  rect(-9, -54, 4, 17, "#a9d9ed"); rect(-8, -39, 4, 10, "#5e9bc4");
  rect(6, -54, 4, 18, "#a9d9ed"); rect(5, -38, 4, 10, "#5e9bc4");
  rect(-8 + hairTip, -31, 4, 7, "#c9edf6"); rect(6 - hairTip, -30, 4, 7, "#c9edf6");
  ctx.restore();

  // Ice crown sits close to the head; a tall central crystal forms its peak.
  rect(-9, -76, 18, 4, "#25496f"); rect(-8, -78, 16, 3, "#8acde9");
  rect(-7, -81, 3, 5, "#9fe7f8"); rect(-2, -84, 4, 8, "#f7ffff");
  rect(4, -80, 3, 5, "#8bd3ed"); rect(7, -77, 3, 3, "#d6f7ff");
  rect(-2, -77, 4, 3, "#357eb1"); rect(-1, -77, 2, 2, "#ffffff");

  // Small refined face with a visibly tapered, sharp pixel-art chin.
  rect(-7, -72, 14, 11, "#203e6a");
  rect(-6, -70, 12, 8, "#f0d9d1");
  rect(-5, -63, 10, 4, "#f0d9d1");
  rect(-4, -59, 8, 3, "#ffe9df");
  rect(-3, -56, 6, 2, "#f0d9d1");
  rect(-6, -66, 2, 5, "#d7b7bf"); rect(4, -66, 2, 5, "#d7b7bf");
  // Snow-blue eyes, fine lashes and a tiny rose lip on the tapered lower face.
  rect(-5, -64, 4, 2, "#284e84"); rect(1, -64, 4, 2, "#284e84");
  rect(-4, -64, 1, 2, "#f4ffff"); rect(2, -64, 1, 2, "#f4ffff");
  rect(-5, -66, 4, 1, "#5d9ab7"); rect(1, -66, 4, 1, "#5d9ab7");
  rect(-1, -59, 3, 1, "#d7a6ae"); rect(-1, -57, 3, 1, "#b96782");
  // Narrow neck transitions directly to an elegant off-shoulder collar.
  rect(-3, -55, 6, 5, "#f0d9d1"); rect(-7, -52, 14, 3, "#d8b9bf");

  // Rear mantle and arms: long, slim lines, no chunky floating sleeves.
  rect(-14, -49 + breath, 28, 8, "#203e6a");
  rect(-17, -46 + breath, 34, 7, "#6faed1");
  rect(-13, -45 + breath, 26, 5, "#d5f3fa");
  // Arms reach down from their shoulders, with subtle ice-blue bracers.
  rect(-15, -47 + armSway, 4, 13, "#294e7a");
  rect(-17, -37 + armSway, 4, 11, "#f0d9d1");
  rect(-17, -29 + armSway, 4, 7, "#cceef8"); rect(-16, -29 + armSway, 2, 4, "#fffaff");
  rect(11, -47 - armSway, 4, 13, "#294e7a");
  rect(13, -37 - armSway, 4, 11, "#f0d9d1");
  rect(13, -29 - armSway, 4, 7, "#cceef8"); rect(14, -29 - armSway, 2, 4, "#fffaff");

  // Fitted, hourglass-shaped bodice with a jeweled waist.
  rect(-10, -50 + breath, 20, 20, "#203e6a");
  rect(-8, -49 + breath, 16, 7, "#e6f8fb"); // bare neckline/ice trim
  rect(-8, -42 + breath, 16, 8, "#79b9d9");
  rect(-5, -41 + breath, 10, 8, "#dff8ff");
  rect(-7, -34 + breath, 14, 7, "#244b79");
  rect(-5, -33 + breath, 10, 5, "#6fb1d5");
  rect(-2, -32 + breath, 4, 4, "#eaffff"); // waist jewel
  rect(-9, -29 + breath, 18, 5, "#1b365f");

  // Long legs are drawn first so the high slit can reveal one clean leg shape.
  // Tall blue-white boots reach almost to the knees, keeping the look regal.
  rect(-7, -25, 6, 62, "#1b365f"); rect(-6, -23, 4, 58, "#d8b8bb");
  rect(-5, -20, 2, 32, "#ffe8dc");
  rect(2, -25, 6, 62, "#1b365f"); rect(3, -23, 4, 58, "#e8c9c8");
  rect(4, -20, 2, 33, "#fff0e7");
  rect(-7, 13, 6, 27, "#213f6a"); rect(-6, 15, 4, 23, "#6ba9d1");
  rect(2, 13, 6, 27, "#213f6a"); rect(3, 15, 4, 23, "#6ba9d1");
  rect(-9, 36, 9, 5, "#162e50"); rect(1, 36, 9, 5, "#162e50");
  rect(-8, 36, 6, 2, "#d7f2fa"); rect(2, 36, 6, 2, "#d7f2fa");

  // Floor-length gown in one connected silhouette, split by a deliberate
  // high slit on the right. Step-shaped panels preserve the pixel-art look.
  rect(-12 + skirtSway, -28, 24, 9, "#1b365f");
  rect(-14 + skirtSway, -21, 28, 10, "#244b79");
  rect(-16 + skirtSway, -12, 18, 13, "#254c7d");
  rect(4 + skirtSway, -12, 13, 13, "#254c7d");
  rect(-19 + skirtSway, 0, 19, 16, "#1e416e");
  rect(5 + skirtSway, 0, 15, 16, "#1e416e");
  rect(-21 + skirtSway, 15, 21, 17, "#203e6a");
  rect(5 + skirtSway, 15, 17, 17, "#203e6a");
  rect(-23 + skirtSway, 31, 23, 10, "#18345a");
  rect(5 + skirtSway, 31, 19, 10, "#18345a");
  // Pixel folds follow the taper and flare instead of forming straight bars.
  rect(-10 + skirtSway, -19, 4, 13, "#8acde9");
  rect(-7 + skirtSway, -9, 3, 14, "#dff8ff");
  rect(-15 + skirtSway, 2, 4, 12, "#5b9cc4");
  rect(-12 + skirtSway, 12, 4, 14, "#91d2e8");
  rect(-17 + skirtSway, 25, 5, 12, "#4d88b8");
  rect(-7 + skirtSway, 28, 3, 10, "#a8e4f2");
  rect(8 + skirtSway, -8, 3, 12, "#71b6d7");
  rect(10 + skirtSway, 2, 3, 14, "#dff8ff");
  rect(13 + skirtSway, 18, 3, 14, "#77b4d5");
  rect(7 + skirtSway, 31, 4, 7, "#a7deed");
  // Crystal hip chain and side drape add refined detail to the silhouette.
  rect(-12 + skirtSway, -24, 7, 2, "#8bd9ef"); rect(5 + skirtSway, -24, 7, 2, "#8bd9ef");
  rect(-1 + skirtSway, -25, 3, 4, "#f6ffff");

  // Floating ice shards orbit in a slow independent loop.
  for (let i = 0; i < 8; i++) {
    const phase = t / 310 + i * (Math.PI / 4);
    const px = Math.round(Math.cos(phase) * (36 + (i % 2) * 5));
    const py = Math.round(-18 + Math.sin(phase * 1.45) * 31);
    const c = i % 3 === 0 ? "#ffffff" : (i % 3 === 1 ? "#9be8ff" : "#5ea6d2");
    rect(px, py, i % 2 ? 3 : 2, 2, c);
    if (i % 3 === 0) { rect(px - 2, py + 1, 6, 1, c); rect(px, py - 2, 2, 6, c); }
  }
  rect(-20, -34 + armSway, 3 + crystalPulse, 3, "#f5ffff");
  rect(18, -34 - armSway, 3 + crystalPulse, 3, "#8fe8ff");
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

    // ゲームを開いた日をログイン日として記録。日をまたいでの起動で連続ボーナスを判定する。
    markTodayPlayed();
    updateRecoveryButton();

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

    if ($("#useRecoveryElixirBtn")) {
      $("#useRecoveryElixirBtn").addEventListener("click", useRecoveryElixir);
    }

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
