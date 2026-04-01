const signalRate = document.getElementById('signalRate');
const momentumRate = document.getElementById('momentumRate');
const analyzeBtn = document.getElementById('analyzeBtn');
const sampleBtn = document.getElementById('sampleBtn');
const nameInput = document.getElementById('nameInput');
const consoleBody = document.getElementById('consoleBody');
const resultPanel = document.getElementById('resultPanel');
const resultTitle = document.getElementById('resultTitle');
const resultScore = document.getElementById('resultScore');
const resultText = document.getElementById('resultText');
const chipRow = document.getElementById('chipRow');
const metaNote = document.getElementById('metaNote');

const profiles = [
  {
    max: 28,
    title: 'Low-friction operator',
    score: 'External coherence: 91 / 100',
    text: 'Observers are likely to describe this person as steady, measured, and quietly on top of things. Internally, however, there is a non-trivial chance they are simply excellent at compressing mild panic into clean sentence structure.',
    chips: ['credible pacing', 'clean updates', 'dangerously composed'],
    note: 'System note: unusually high stability often indicates either maturity or advanced concealment.'
  },
  {
    max: 54,
    title: 'Structurally convincing professional',
    score: 'External coherence: 74 / 100',
    text: 'This profile sustains a reliable surface layer even when energy is fragmented. Most people will assume they have a process. There may, in fact, be no process—only formatting, timing, and one heroic calendar habit.',
    chips: ['looks organized', 'operationally believable', 'running on language'],
    note: 'System note: confidence appears to be assembled from reusable fragments.'
  },
  {
    max: 79,
    title: 'High-output survival mode',
    score: 'External coherence: 46 / 100',
    text: 'Professional credibility is still present, but held together by obligation, caffeine, and a rapidly thinning layer of social polish. To outside viewers, this reads as intensity. To the person living it, this is mostly weather.',
    chips: ['technically functioning', 'slightly haunted', 'reply latency increasing'],
    note: 'System note: recommend fewer meetings and one emotionally neutral afternoon.'
  },
  {
    max: Infinity,
    title: 'Narratively stable, spiritually buffering',
    score: 'External coherence: 18 / 100',
    text: 'At first glance this person appears to be participating in modern professional life. On closer inspection, the entire structure is being maintained by posture, browser tabs, and the phrase “I am aligning a few moving pieces.” Honestly? It is working more than it should.',
    chips: ['held together by tone', 'extremely human', 'still weirdly impressive'],
    note: 'System note: not broken. Just operating under cinematic levels of strain.'
  }
];

function randomRange(min, max) {
  return (Math.random() * (max - min) + min).toFixed(1);
}

setInterval(() => {
  signalRate.textContent = `${randomRange(89, 98)}%`;
  momentumRate.textContent = `${randomRange(72, 91)}%`;
}, 2400);

function typeLines(lines, done) {
  consoleBody.innerHTML = '';
  let index = 0;

  function next() {
    if (index >= lines.length) {
      done?.();
      return;
    }
    const p = document.createElement('p');
    p.innerHTML = lines[index];
    consoleBody.appendChild(p);
    consoleBody.scrollTop = consoleBody.scrollHeight;
    index += 1;
    setTimeout(next, 520);
  }

  next();
}

function hashName(name) {
  return [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function runAudit(inputName) {
  const name = (inputName || 'Anonymous Profile').trim() || 'Anonymous Profile';
  const score = (hashName(name) % 93) + 7;
  const profile = profiles.find(item => score <= item.max);

  const lines = [
    '&gt; Booting presence model...',
    `&gt; Loading subject: <span class="muted">${name}</span>`,
    '&gt; Mapping behavioral residue across chat, meetings, and delayed replies...',
    '&gt; Detecting continuity signals, emotional leakage, and synthetic professionalism...',
    '&gt; <span class="warn">Minor anomaly:</span> observer confidence exceeds actual internal certainty.',
    '&gt; <span class="hot">Interpretation layer active.</span> Converting strain into something colleagues will probably call “solid energy.”'
  ];

  typeLines(lines, () => {
    resultTitle.textContent = `${name} · audit summary`;
    resultScore.textContent = profile.score;
    resultText.textContent = profile.text;
    chipRow.innerHTML = '';
    profile.chips.forEach((chip) => {
      const span = document.createElement('span');
      span.textContent = chip;
      chipRow.appendChild(span);
    });
    metaNote.textContent = profile.note;
    resultPanel.hidden = false;
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

analyzeBtn.addEventListener('click', () => runAudit(nameInput.value));
sampleBtn.addEventListener('click', () => {
  const sample = ['Alex Chen', 'Cathy', 'Product Ops', 'People who said they are fine'][Math.floor(Math.random() * 4)];
  nameInput.value = sample;
  runAudit(sample);
});
nameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runAudit(nameInput.value);
});
