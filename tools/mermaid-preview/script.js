import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

const codeInput = document.getElementById('codeInput');
const preview = document.getElementById('preview');
const errorBox = document.getElementById('errorBox');
const statusText = document.getElementById('statusText');
const charCount = document.getElementById('charCount');
const demoBtn = document.getElementById('demoBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadSvgBtn = document.getElementById('downloadSvgBtn');

const demoCode = `flowchart TD
  A[主人輸入 Mermaid] --> B{語法正確嗎？}
  B -->|是| C[即時渲染圖形]
  B -->|否| D[顯示錯誤訊息]
  C --> E[可下載 SVG]
  C --> F[可繼續修改]
`;

let renderTimer = null;
let latestSvg = '';
let renderCount = 0;

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'dark',
  fontFamily: 'Inter, system-ui, sans-serif'
});

function setStatus(text) {
  statusText.textContent = text;
}

function setError(message) {
  errorBox.hidden = false;
  errorBox.textContent = message;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function updateCount() {
  charCount.textContent = `${codeInput.value.length} 字元`;
}

async function renderDiagram() {
  const code = codeInput.value.trim();
  updateCount();

  if (!code) {
    preview.innerHTML = '<div class="empty-state">圖會顯示在這裡</div>';
    latestSvg = '';
    clearError();
    setStatus('等待輸入');
    return;
  }

  setStatus('渲染中...');
  clearError();

  try {
    const id = `mermaid-preview-${++renderCount}`;
    const { svg } = await mermaid.render(id, code);
    latestSvg = svg;
    preview.innerHTML = svg;
    setStatus('已更新預覽');
  } catch (error) {
    latestSvg = '';
    preview.innerHTML = '<div class="empty-state">目前無法渲染，請先修正左側 Mermaid 語法。</div>';
    setError(error?.message || 'Mermaid 渲染失敗');
    setStatus('語法錯誤');
  }
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderDiagram, 180);
}

async function copyCode() {
  if (!codeInput.value) return;
  await navigator.clipboard.writeText(codeInput.value);
  setStatus('已複製程式碼');
}

function downloadSvg() {
  if (!latestSvg) {
    setStatus('目前沒有可下載的圖');
    return;
  }

  const blob = new Blob([latestSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mermaid-diagram.svg';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus('已下載 SVG');
}

demoBtn.addEventListener('click', () => {
  codeInput.value = demoCode;
  scheduleRender();
});

copyBtn.addEventListener('click', () => {
  copyCode().catch(() => setStatus('複製失敗'));
});

downloadSvgBtn.addEventListener('click', downloadSvg);
codeInput.addEventListener('input', scheduleRender);

updateCount();
renderDiagram();
