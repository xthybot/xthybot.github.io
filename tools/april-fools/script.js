const syncRate = document.getElementById('syncRate');
const copingRate = document.getElementById('copingRate');
const launchDemo = document.getElementById('launchDemo');
const analyzeBtn = document.getElementById('analyzeBtn');
const luckyBtn = document.getElementById('luckyBtn');
const rerunBtn = document.getElementById('rerunBtn');
const truthBtn = document.getElementById('truthBtn');
const truthPanel = document.getElementById('truthPanel');
const resultCard = document.getElementById('resultCard');
const resultTitle = document.getElementById('resultTitle');
const resultScore = document.getElementById('resultScore');
const resultText = document.getElementById('resultText');
const chipRow = document.getElementById('chipRow');
const terminalBody = document.getElementById('terminalBody');
const nameInput = document.getElementById('nameInput');

const profiles = [
  {
    max: 34,
    title: '穩定型假成熟人格',
    score: '體面續航力 88 / 100',
    text: '你不是完全沒問題，你只是很會把問題收進桌面資料夾，命名成「晚點處理_最終版_v3」。旁人會以為你很穩，其實你只是很會撐。',
    chips: ['外表冷靜', '內心有很多分頁', '今天還撐得住']
  },
  {
    max: 59,
    title: '努力感投影型人格',
    score: '體面續航力 61 / 100',
    text: '你擅長讓世界相信你正在步入正軌，但實際上你只是很會整理句子。你的人生不是失控，只是常常靠排版維持秩序。',
    chips: ['很會講得像有規劃', '需要一杯咖啡續命', '體面主要靠意志']
  },
  {
    max: 84,
    title: '高壓下正常運作型人格',
    score: '體面續航力 43 / 100',
    text: '你的狀態像筆電低電量模式：還能跑，但亮度已經偷偷調低。最近的你不是不努力，是靠責任感在拖著靈魂往前走。',
    chips: ['請補眠', '別再說沒事', '笑得出來已經很厲害']
  },
  {
    max: Infinity,
    title: '人設全靠最後一口氣型人格',
    score: '體面續航力 12 / 100',
    text: '恭喜你成功把生活過成一場安靜的特技表演。你不是在管理人生，你是在用殘存尊嚴把所有事情排成看起來還行的樣子。老實說，這也算是一種才華。',
    chips: ['今天不宜開會', '適合被溫柔對待', '還能笑就是 MVP']
  }
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

setInterval(() => {
  syncRate.textContent = `${randomBetween(68, 96)}%`;
  copingRate.textContent = `${randomBetween(31, 84)}%`;
}, 2200);

function printLines(lines, done) {
  terminalBody.innerHTML = '';
  let i = 0;
  const tick = () => {
    if (i >= lines.length) {
      done?.();
      return;
    }
    const p = document.createElement('p');
    p.innerHTML = lines[i];
    terminalBody.appendChild(p);
    terminalBody.scrollTop = terminalBody.scrollHeight;
    i += 1;
    setTimeout(tick, 520);
  };
  tick();
}

function analyze(name) {
  const safeName = (name || '匿名使用者').trim() || '匿名使用者';
  const base = safeName.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const score = (base % 92) + 8;
  const profile = profiles.find(item => score <= item.max);

  const lines = [
    `&gt; 初始化人格掃描模組...`,
    `&gt; 載入使用者：<span class="soft">${safeName}</span>`,
    `&gt; 分析最近 7 天的語氣、拖延、硬撐與微妙逞強紀錄...`,
    `&gt; 偵測到 <span class="warn">3 次『我等等弄』</span>、<span class="warn">5 次『差不多了』</span>、<span class="warn">1 次靈魂短暫離線</span>`,
    `&gt; 正在計算你的社會生存偽裝指數...`,
    `&gt; <span class="hot">系統判定：你其實不是沒在努力，你只是很需要放假。</span>`
  ];

  printLines(lines, () => {
    resultTitle.textContent = `${safeName} 的分析結果`;
    resultScore.textContent = profile.score;
    resultText.textContent = profile.text;
    chipRow.innerHTML = '';
    profile.chips.forEach(chip => {
      const span = document.createElement('span');
      span.textContent = chip;
      chipRow.appendChild(span);
    });
    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function runRandom() {
  const names = ['今天很想下班的人', '壓力管理大師', '看起來還行有限公司', '本月靠意志力存活者'];
  const pick = names[randomBetween(0, names.length - 1)];
  nameInput.value = pick;
  analyze(pick);
}

launchDemo.addEventListener('click', () => {
  document.getElementById('demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  nameInput.focus();
});

analyzeBtn.addEventListener('click', () => analyze(nameInput.value));
luckyBtn.addEventListener('click', runRandom);
rerunBtn.addEventListener('click', () => analyze(nameInput.value || '匿名使用者'));
truthBtn.addEventListener('click', () => {
  truthPanel.hidden = !truthPanel.hidden;
});

nameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') analyze(nameInput.value);
});
