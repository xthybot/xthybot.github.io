import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

const codeInput = document.getElementById('codeInput');
const preview = document.getElementById('preview');
const errorBox = document.getElementById('errorBox');
const statusText = document.getElementById('statusText');
const charCount = document.getElementById('charCount');
const demoBtn = document.getElementById('demoBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadSvgBtn = document.getElementById('downloadSvgBtn');
const downloadPngBtn = document.getElementById('downloadPngBtn');
const themeMode = document.getElementById('themeMode');
const primaryColor = document.getElementById('primaryColor');
const lineColor = document.getElementById('lineColor');
const textColor = document.getElementById('textColor');
const backgroundColor = document.getElementById('backgroundColor');
const applyThemeBtn = document.getElementById('applyThemeBtn');
const resetThemeBtn = document.getElementById('resetThemeBtn');

const demoCode = `flowchart TD
  A[主人輸入 Mermaid] --> B{語法正確嗎？}
  B -->|是| C[即時渲染圖形]
  B -->|否| D[顯示錯誤訊息]
  C --> E[可下載 SVG]
  C --> F[可匯出 PNG]
  C --> G[可切換主題]
`;

const defaultTheme = {
  mode: 'dark',
  primaryColor: '#7c8cff',
  lineColor: '#73e0ff',
  textColor: '#e8f0ff',
  backgroundColor: '#0b1220'
};

let renderTimer = null;
let latestSvg = '';
let renderCount = 0;

function getThemeConfig() {
  return {
    mode: themeMode.value,
    primaryColor: primaryColor.value,
    lineColor: lineColor.value,
    textColor: textColor.value,
    backgroundColor: backgroundColor.value
  };
}

function applyInputs(config) {
  themeMode.value = config.mode;
  primaryColor.value = config.primaryColor;
  lineColor.value = config.lineColor;
  textColor.value = config.textColor;
  backgroundColor.value = config.backgroundColor;
}

function buildMermaidConfig() {
  const theme = getThemeConfig();
  return {
    startOnLoad: false,
    securityLevel: 'loose',
    theme: theme.mode,
    fontFamily: 'Inter, system-ui, sans-serif',
    themeVariables: {
      primaryColor: theme.primaryColor,
      primaryBorderColor: theme.lineColor,
      lineColor: theme.lineColor,
      textColor: theme.textColor,
      primaryTextColor: theme.textColor,
      nodeTextColor: theme.textColor,
      mainBkg: theme.backgroundColor,
      secondaryColor: theme.backgroundColor,
      tertiaryColor: theme.backgroundColor,
      clusterBkg: theme.backgroundColor,
      clusterBorder: theme.lineColor,
      edgeLabelBackground: theme.backgroundColor,
      actorTextColor: theme.textColor,
      actorLineColor: theme.lineColor,
      signalColor: theme.textColor,
      labelBoxBkgColor: theme.backgroundColor,
      labelBoxBorderColor: theme.lineColor,
      labelTextColor: theme.textColor,
      cScale0: theme.primaryColor,
      cScale1: theme.backgroundColor,
      cScale2: theme.lineColor
    }
  };
}

mermaid.initialize(buildMermaidConfig());

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
  mermaid.initialize(buildMermaidConfig());

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

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadSvg() {
  if (!latestSvg) {
    setStatus('目前沒有可下載的圖');
    return;
  }

  const blob = new Blob([latestSvg], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, 'mermaid-diagram.svg');
  setStatus('已下載 SVG');
}

async function downloadPng() {
  if (!latestSvg) {
    setStatus('目前沒有可下載的圖');
    return;
  }

  try {
    const svgBlob = new Blob([latestSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const svgEl = preview.querySelector('svg');
    const width = Math.max(Math.ceil(svgEl?.viewBox?.baseVal?.width || svgEl?.getBoundingClientRect().width || img.width || 1200), 400);
    const height = Math.max(Math.ceil(svgEl?.viewBox?.baseVal?.height || svgEl?.getBoundingClientRect().height || img.height || 800), 300);

    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    URL.revokeObjectURL(url);

    if (!pngBlob) {
      setStatus('PNG 匯出失敗');
      return;
    }

    downloadBlob(pngBlob, 'mermaid-diagram.png');
    setStatus('已下載 PNG');
  } catch {
    setStatus('PNG 匯出失敗');
  }
}

demoBtn.addEventListener('click', () => {
  codeInput.value = demoCode;
  scheduleRender();
});

copyBtn.addEventListener('click', () => {
  copyCode().catch(() => setStatus('複製失敗'));
});

downloadSvgBtn.addEventListener('click', downloadSvg);
downloadPngBtn.addEventListener('click', downloadPng);
applyThemeBtn.addEventListener('click', renderDiagram);
resetThemeBtn.addEventListener('click', () => {
  applyInputs(defaultTheme);
  renderDiagram();
});
codeInput.addEventListener('input', scheduleRender);
[themeMode, primaryColor, lineColor, textColor, backgroundColor].forEach(el => {
  el.addEventListener('input', scheduleRender);
  el.addEventListener('change', scheduleRender);
});

applyInputs(defaultTheme);
updateCount();
renderDiagram();
