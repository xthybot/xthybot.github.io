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
  friend: '抱歉我剛剛真的在忙，現在才看到。你剛剛那個是怎樣？',
  crush: '抱歉我晚點才回，不是故意晾你，剛剛有點卡住。你剛剛說的那個後來怎麼樣？',
  coworker: '抱歉剛剛在處理別的事情，現在補回。你這邊目前還需要我協助哪一段？',
  boss: '抱歉剛才在處理手上項目，現在看到。這件事我接下來會先這樣處理：',
  family: '剛剛沒注意到訊息，現在看到啦。你那邊還好嗎？'
};

function updateDelayLabel() {
  const h = Number(delayInput.value);
  delayLabel.textContent = h === 1 ? '1 hour' : `${h} hours`;
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
    title = 'Low signal distortion';
    text = 'This delay still reads as normal human timing. Most people will interpret it as life happening, not emotional theater.';
    chips = ['recoverable', 'still believable', 'socially normal'];
  } else if (score < 55) {
    title = 'Noticeable but manageable';
    text = 'The delay has started to acquire meaning. You are no longer just replying late; you are lightly curating a vibe whether you intended to or not.';
    chips = ['slightly weird', 'needs warmth', 'don\'t over-explain'];
  } else if (score < 80) {
    title = 'Interpretation risk increasing';
    text = 'At this point, the silence is beginning to look shaped. Depending on the person, this may read as avoidance, calculation, or mysterious emotional weather.';
    chips = ['awkward energy', 'human but suspicious', 'send clean sentence now'];
  } else {
    title = 'Severe narrative formation';
    text = 'The delay is no longer a delay. It is now a story. The other person has almost certainly assigned meaning to it, and unfortunately some of that meaning may be correct.';
    chips = ['you made lore', 'reply immediately', 'maybe be honest for once'];
  }

  resultTitle.textContent = title;
  resultText.textContent = text;
  chipRow.innerHTML = '';
  chips.forEach((chip) => {
    const span = document.createElement('span');
    span.textContent = chip;
    chipRow.appendChild(span);
  });
  replyBox.textContent = `Suggested recovery line: ${replySuggestions[relation]}`;
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
