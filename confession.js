const text = '有一句話，我想認真地對你說。';
const target = document.getElementById('typing');
const musicBtn = document.getElementById('musicBtn');
const petals = document.querySelector('.petals');
let i = 0;

function type() {
  if (i <= text.length) {
    target.textContent = text.slice(0, i);
    i += 1;
    setTimeout(type, 90);
  }
}

type();

function createPetal() {
  const petal = document.createElement('div');
  petal.className = 'petal';
  petal.style.left = Math.random() * 100 + 'vw';
  petal.style.animationDuration = 6 + Math.random() * 8 + 's';
  petal.style.opacity = 0.35 + Math.random() * 0.45;
  petal.style.transform = `translateY(0) rotate(${Math.random() * 120}deg)`;
  petals.appendChild(petal);
  setTimeout(() => petal.remove(), 14000);
}
setInterval(createPetal, 380);
for (let j = 0; j < 16; j++) setTimeout(createPetal, j * 220);

let playing = false;
let audioCtx;
let currentNodes = [];

function stopMusic() {
  currentNodes.forEach(n => {
    try { n.stop && n.stop(); } catch {}
  });
  currentNodes = [];
  playing = false;
  musicBtn.textContent = '播放浪漫音樂';
}

function playTone(freq, start, duration, gainValue) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
  currentNodes.push(osc);
}

function startMusic() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const now = audioCtx.currentTime + 0.05;
  const melody = [523.25, 659.25, 783.99, 659.25, 698.46, 587.33, 659.25, 523.25];
  melody.forEach((freq, idx) => playTone(freq, now + idx * 0.42, 0.38, 0.05));
  const bass = [261.63, 293.66, 329.63, 261.63];
  bass.forEach((freq, idx) => playTone(freq, now + idx * 0.84, 0.75, 0.025));
  playing = true;
  musicBtn.textContent = '停止音樂';
  setTimeout(() => {
    if (playing) {
      playing = false;
      musicBtn.textContent = '播放浪漫音樂';
    }
  }, 3600);
}

musicBtn.addEventListener('click', async () => {
  if (playing) return stopMusic();
  startMusic();
});
