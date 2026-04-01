const questions = [
  {
    title: "朋友突然傳訊息說：『我剛接到外星人電話。』你第一反應是？",
    hint: "請誠實作答，我們需要正確評估你的社交防禦系統。",
    answers: [
      ["先問是哪一顆星球打來的", 25],
      ["懷疑今天是不是 4/1", 5],
      ["叫他開擴音，我想加入", 30],
      ["回：你先把錄音檔傳來", 10]
    ]
  },
  {
    title: "看到『免費送 iPhone，只要填身分證與銀行帳號』，你會？",
    hint: "這題理論上不難，但我們尊重每一種冒險精神。",
    answers: [
      ["先截圖傳朋友說這也太假", 3],
      ["差點想填，最後又關掉", 15],
      ["我會認真研究是不是官方活動", 18],
      ["免費？先衝再說", 35]
    ]
  },
  {
    title: "如果網站跳出『AI 已分析你今天適合翹班』，你會？",
    hint: "本題不構成任何法律、職涯或道德建議。",
    answers: [
      ["信一半，開始找理由", 22],
      ["不信，但想收藏這網站", 12],
      ["反問 AI 它憑什麼", 8],
      ["立刻傳給同事一起墮落", 28]
    ]
  },
  {
    title: "你覺得最可疑、卻又最容易讓人中招的是哪種句子？",
    hint: "選出最符合你人生經驗的一項。",
    answers: [
      ["這個只要三分鐘", 24],
      ["完全免費，不會推銷", 21],
      ["我現在人在附近，出來一下", 19],
      ["這次真的不會有 bug", 26]
    ]
  },
  {
    title: "如果最後結果說你是『高風險被騙體質』，你會？",
    hint: "恭喜，這題其實已經接近終局。",
    answers: [
      ["不可能，這測驗一定有問題", 8],
      ["有點不爽，但想再測一次", 17],
      ["接受命運，今天先少相信人", 12],
      ["立刻分享給朋友看他多慘", 20]
    ]
  }
];

const resultProfiles = [
  {
    max: 35,
    title: "A 級：反詐兼反套路型",
    scoreText: "你今天的愚人節存活率高達 91%",
    text: "你不是不會被騙，你只是連快樂都會先驗證來源。你適合去拆朋友的玩笑，也適合當群組裡那個第一個說『先等等，這不對勁』的人。",
    badges: ["懷疑論大師", "朋友眼中的氣氛終結者", "很難整到你"]
  },
  {
    max: 70,
    title: "B 級：理性與好奇心拉扯型",
    scoreText: "你今天的愚人節存活率約 67%",
    text: "你的理智在線，但好奇心偶爾會偷偷下線。你知道很多東西不太對，卻還是會想點開看看。這很人性，也很容易成為朋友的目標。",
    badges: ["差一點就信了", "容易被標題吸引", "仍有自救空間"]
  },
  {
    max: 95,
    title: "C 級：高互動高風險型",
    scoreText: "你今天的愚人節存活率約 41%",
    text: "你不是笨，你只是太願意參與這個世界。任何看起來有趣的東西都可能讓你靠近一步，而那一步，往往就是愚人節最愛的位置。",
    badges: ["社交型中招者", "看到新奇就想按", "今天建議保守"]
  },
  {
    max: Infinity,
    title: "S 級：宇宙級可愛受害者",
    scoreText: "你今天的愚人節存活率僅剩 12%",
    text: "如果今天有人說電冰箱會自己回訊息，你可能不會全信，但你一定會想知道怎麼設定。你值得被保護，也值得遠離所有『限時免費』和『內部消息』。",
    badges: ["極易被套路", "請暫停衝動點擊", "建議交由監護人陪同上網"]
  }
];

const startBtn = document.getElementById('startBtn');
const chaosBtn = document.getElementById('chaosBtn');
const retryBtn = document.getElementById('retryBtn');
const revealBtn = document.getElementById('revealBtn');
const quizCard = document.getElementById('quizCard');
const resultCard = document.getElementById('resultCard');
const revealPanel = document.getElementById('revealPanel');
const questionTitle = document.getElementById('questionTitle');
const questionHint = document.getElementById('questionHint');
const answersWrap = document.getElementById('answers');
const progressPill = document.getElementById('progressPill');
const trustMeter = document.getElementById('trustMeter');
const resultTitle = document.getElementById('resultTitle');
const resultScore = document.getElementById('resultScore');
const resultText = document.getElementById('resultText');
const badgeRow = document.getElementById('badgeRow');

let currentIndex = 0;
let totalScore = 0;

function resetQuiz() {
  currentIndex = 0;
  totalScore = 0;
  revealPanel.hidden = true;
  resultCard.hidden = true;
  quizCard.hidden = false;
  renderQuestion();
}

function renderQuestion() {
  const q = questions[currentIndex];
  progressPill.textContent = `第 ${currentIndex + 1} / ${questions.length} 題`;
  trustMeter.textContent = `受騙傾向：${Math.min(totalScore, 99)} / 100`;
  questionTitle.textContent = q.title;
  questionHint.textContent = q.hint;
  answersWrap.innerHTML = '';

  q.answers.forEach(([label, score], idx) => {
    const button = document.createElement('button');
    button.className = 'answer btn';
    button.type = 'button';
    button.innerHTML = `${label}<small>選項 ${String.fromCharCode(65 + idx)} · 風險值 +${score}</small>`;
    button.addEventListener('click', () => selectAnswer(score));
    answersWrap.appendChild(button);
  });
}

function selectAnswer(score) {
  totalScore += score;
  currentIndex += 1;

  if (currentIndex >= questions.length) {
    showResult(totalScore);
    return;
  }

  renderQuestion();
}

function showResult(score) {
  quizCard.hidden = true;
  resultCard.hidden = false;
  const profile = resultProfiles.find(item => score <= item.max);
  resultTitle.textContent = profile.title;
  resultScore.textContent = `${profile.scoreText} · 累積風險值 ${score}`;
  resultText.textContent = profile.text;
  badgeRow.innerHTML = '';
  profile.badges.forEach((badge) => {
    const el = document.createElement('span');
    el.className = 'badge';
    el.textContent = badge;
    badgeRow.appendChild(el);
  });
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

startBtn.addEventListener('click', resetQuiz);
retryBtn.addEventListener('click', resetQuiz);
revealBtn.addEventListener('click', () => {
  revealPanel.hidden = !revealPanel.hidden;
  if (!revealPanel.hidden) revealPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
chaosBtn.addEventListener('click', () => {
  const randomScore = 30 + Math.floor(Math.random() * 90);
  showResult(randomScore);
});
