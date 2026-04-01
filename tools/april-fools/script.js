const relationSelect = document.getElementById('relationSelect');
const delayInput = document.getElementById('delayInput');
const delayLabel = document.getElementById('delayLabel');
const reasonSelect = document.getElementById('reasonSelect');
const analyzeBtn = document.getElementById('analyzeBtn');
const randomBtn = document.getElementById('randomBtn');
const meterFill = document.getElementById('meterFill');
const scoreLabel = document.getElementById('scoreLabel');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const chipRow = document.getElementById('chipRow');
const replyBox = document.getElementById('replyBox');

const relationWeight = { friend: 8, crush: 28, coworker: 14, boss: 22, family: 10 };
const reasonWeight = { busy: 4, forgot: 16, anxious: 12, avoiding: 26, dramatic: 21 };

const replySuggestions = {
  friend: '抱歉我剛剛真的在忙，現在才看到。你剛剛那個後來怎麼了？',
  crush: '抱歉我晚點才回，不是故意晾你，剛剛有點卡住。你剛剛說的那件事後來怎麼樣？',
  coworker: '抱歉剛剛在處理別的事情，現在補回。你這邊目前還需要我協助哪一段？',
  boss: '抱歉剛才在處理手上項目，現在看到。這件事我接下來會先這樣處理：',
  family: '剛剛沒注意到訊息，現在看到啦。你那邊還好嗎？'
};

function updateDelayLabel() {
  const h = Number(delayInput.value);
  delayLabel.textContent = `${h} 小時`;
}

function analyze() {
  const relation = relationSelect.value;
  const delay = Number(delayInput.value);
  const reason = reasonSelect.value;

  let score = Math.min(100, relationWeight[relation] + reasonWeight[reason] + delay * 0.9);
  score = Math.round(score);

  meterFill.style.width = `${score}%`;
  scoreLabel.textContent = `${score} / 100`;

  let title = '';
  let text = '';
  let chips = [];

  if (score < 30) {
    title = '正常偏安全，基本不太怪';
    text = '這個延遲大致還在一般人可接受的範圍內，多數情況會被理解成單純在忙，而不是刻意冷處理。';
    chips = ['還算自然', '可正常收尾', '不用演太多'];
  } else if (score < 55) {
    title = '開始有點微妙，但還能救';
    text = '這時候晚回已經不只是晚回，多少開始帶出一點態度。你如果再補一段太用力的解釋，反而會更可疑。';
    chips = ['略顯尷尬', '補一句就好', '別解釋過頭'];
  } else if (score < 80) {
    title = '風險偏高，對方可能已經在想了';
    text = '這個程度的沉默很容易被解讀成逃避、刻意、或情緒不穩。對方未必生氣，但多半已經開始替你腦補理由。';
    chips = ['氣氛變怪', '快用人話收拾', '再拖會更糟'];
  } else {
    title = '已經不是晚回，是開始形成劇情';
    text = '這個延遲本身已經變成事件。對方大概率已替你建立了一整套解讀版本，而其中有些版本可能比真相還有說服力。';
    chips = ['你製造了 lore', '請立刻回覆', '也許該誠實一點'];
  }

  resultTitle.textContent = title;
  resultText.textContent = text;
  chipRow.innerHTML = '';
  chips.forEach((chip) => {
    const span = document.createElement('span');
    span.textContent = chip;
    chipRow.appendChild(span);
  });
  replyBox.textContent = `建議補救句：${replySuggestions[relation]}`;
}

function loadRandomSample() {
  const samples = [
    ['crush', 19, 'anxious'],
    ['boss', 11, 'busy'],
    ['friend', 27, 'forgot'],
    ['coworker', 8, 'avoiding']
  ];
  const [relation, delay, reason] = samples[Math.floor(Math.random() * samples.length)];
  relationSelect.value = relation;
  delayInput.value = delay;
  reasonSelect.value = reason;
  updateDelayLabel();
  analyze();
}

delayInput.addEventListener('input', updateDelayLabel);
analyzeBtn.addEventListener('click', analyze);
randomBtn.addEventListener('click', loadRandomSample);

updateDelayLabel();
analyze();
