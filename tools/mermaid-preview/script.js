import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
import html2canvas from 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm';
import { Canvg } from 'https://cdn.jsdelivr.net/npm/canvg@4.0.2/+esm';

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

const themePresets = {
  dark: {
    mode: 'dark',
    primaryColor: '#7c8cff',
    lineColor: '#73e0ff',
    textColor: '#e8f0ff',
    backgroundColor: '#0b1220'
  },
  default: {
    mode: 'default',
    primaryColor: '#dbe8ff',
    lineColor: '#5b6f8a',
    textColor: '#18212f',
    backgroundColor: '#f7fafc'
  }
};

const pageTheme = {
  dark: {
    '--bg': '#07111f',
    '--panel': 'rgba(12, 22, 39, 0.82)',
    '--text': '#ebf3ff',
    '--muted': '#92a4bf',
    '--line': 'rgba(146, 164, 191, 0.16)',
    '--accent': '#73e0ff',
    '--accent-2': '#7c8cff',
    '--surface': 'rgba(4, 10, 20, 0.72)',
    '--surface-soft': 'rgba(255,255,255,0.03)',
    '--surface-softer': 'rgba(255,255,255,0.02)',
    '--placeholder': '#7890b1'
  },
  default: {
    '--bg': '#eef4ff',
    '--panel': 'rgba(255, 255, 255, 0.9)',
    '--text': '#18212f',
    '--muted': '#5c6b80',
    '--line': 'rgba(66, 84, 102, 0.16)',
    '--accent': '#4f7cff',
    '--accent-2': '#6d5efc',
    '--surface': '#ffffff',
    '--surface-soft': '#f6f8fc',
    '--surface-softer': '#f8faff',
    '--placeholder': '#8191a6'
  }
};

const defaultTheme = themePresets.dark;

let renderTimer = null;
let latestSvg = '';
let latestCode = '';
let renderCount = 0;

function getExportDimensions() {
  const svgEl = preview.querySelector('svg');
  const previewRect = preview.getBoundingClientRect();
  const svgRect = svgEl?.getBoundingClientRect();
  const padding = 32;

  const width = Math.max(Math.ceil(svgRect?.width || previewRect.width || 1200), 400);
  const height = Math.max(Math.ceil(svgRect?.height || previewRect.height || 800), 300);

  return {
    width,
    height,
    padding,
    canvasWidth: width + padding * 2,
    canvasHeight: height + padding * 2
  };
}

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

function buildMermaidConfig({ forExport = false } = {}) {
  const theme = getThemeConfig();
  return {
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    flowchart: {
      htmlLabels: false,
      useMaxWidth: true,
      wrappingWidth: 220
    },
    sequence: {
      useMaxWidth: true
    },
    // 匯出 PNG 時，若 SVG 內引用外部字型，canvas 可能被瀏覽器判定為不可安全讀取。
    // 這裡改用系統字型，避免下載 Google Fonts 後造成匯出失敗。
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
    themeVariables: {
      background: theme.backgroundColor,
      primaryColor: theme.primaryColor,
      primaryBorderColor: theme.lineColor,
      primaryTextColor: theme.textColor,
      secondaryColor: theme.mode === 'default' ? '#edf3ff' : '#111a2a',
      secondaryBorderColor: theme.lineColor,
      secondaryTextColor: theme.textColor,
      tertiaryColor: theme.mode === 'default' ? '#ffffff' : '#162235',
      tertiaryBorderColor: theme.lineColor,
      tertiaryTextColor: theme.textColor,
      lineColor: theme.lineColor,
      textColor: theme.textColor,
      nodeTextColor: theme.textColor,
      mainBkg: theme.backgroundColor,
      nodeBkg: theme.primaryColor,
      clusterBkg: theme.mode === 'default' ? '#edf3ff' : '#10192a',
      clusterBorder: theme.lineColor,
      defaultLinkColor: theme.lineColor,
      titleColor: theme.textColor,
      edgeLabelBackground: theme.mode === 'default' ? '#eef4ff' : '#0f1726',
      labelBoxBkgColor: theme.mode === 'default' ? '#eef4ff' : '#0f1726',
      labelBoxBorderColor: theme.lineColor,
      labelTextColor: theme.textColor,
      actorBkg: theme.primaryColor,
      actorBorder: theme.lineColor,
      actorTextColor: theme.textColor,
      actorLineColor: theme.lineColor,
      signalColor: theme.textColor,
      cScale0: theme.primaryColor,
      cScale1: theme.mode === 'default' ? '#eef3ff' : '#0f1726',
      cScale2: theme.lineColor
    },
    ...(forExport ? { deterministicIds: true } : {})
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

function syncPreviewSurface() {
  preview.style.background = backgroundColor.value;
}

function paintRenderedDiagram() {
  const svg = preview.querySelector('svg');
  if (!svg) return;

  const labelBg = themeMode.value === 'default' ? '#ffffff' : '#0f1726';
  const clusterBg = themeMode.value === 'default' ? '#edf3ff' : '#10192a';

  svg.querySelectorAll('.node rect, .node circle, .node ellipse, .node polygon, .node path').forEach(el => {
    if (!el.closest('.arrowMarkerPath')) {
      el.style.fill = primaryColor.value;
      el.style.stroke = lineColor.value;
    }
  });

  svg.querySelectorAll('.cluster rect').forEach(el => {
    el.style.fill = clusterBg;
    el.style.stroke = lineColor.value;
  });

  svg.querySelectorAll('.edgeLabel rect, .labelBkg').forEach(el => {
    el.style.fill = labelBg;
    el.style.stroke = lineColor.value;
  });

  svg.querySelectorAll('text, tspan, foreignObject, foreignObject div, foreignObject span, .nodeLabel, .edgeLabel').forEach(el => {
    el.style.fill = textColor.value;
    el.style.color = textColor.value;
  });
}

function syncPageTheme(mode) {
  const palette = pageTheme[mode] || pageTheme.dark;
  const root = document.documentElement;
  const allKeys = new Set([
    ...Object.keys(pageTheme.dark),
    ...Object.keys(pageTheme.default)
  ]);

  allKeys.forEach(key => {
    root.style.setProperty(key, palette[key] ?? pageTheme.dark[key] ?? '');
  });
}

function applyPreset(mode) {
  const preset = themePresets[mode];
  if (!preset) return;
  applyInputs(preset);
  syncPreviewSurface();
  syncPageTheme(mode);
}

function updateCount() {
  charCount.textContent = `${codeInput.value.length} 字元`;
}

async function renderDiagram() {
  const code = codeInput.value.trim();
  latestCode = code;
  updateCount();

  if (!code) {
    preview.innerHTML = '<div class="empty-state">圖會顯示在這裡</div>';
    latestSvg = '';
    syncPreviewSurface();
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
    syncPreviewSurface();
    paintRenderedDiagram();
    setStatus('已更新預覽');
  } catch (error) {
    latestSvg = '';
    preview.innerHTML = '<div class="empty-state">目前無法渲染，請先修正左側 Mermaid 語法。</div>';
    syncPreviewSurface();
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

function buildInlineExportSvg() {
  const svgEl = preview.querySelector('svg');
  if (!svgEl) return '';

  paintRenderedDiagram();

  const clone = svgEl.cloneNode(true);
  const dims = getExportDimensions();

  if (!(clone instanceof SVGElement)) return '';

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(dims.width));
  clone.setAttribute('height', String(dims.height));
  clone.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);
  clone.style.background = backgroundColor.value;

  clone.querySelectorAll('*').forEach(node => {
    if (!(node instanceof Element)) return;

    const computed = window.getComputedStyle(node);
    const inlineRules = [
      ['fill', computed.fill],
      ['stroke', computed.stroke],
      ['color', computed.color],
      ['stroke-width', computed.strokeWidth],
      ['font-family', computed.fontFamily],
      ['font-size', computed.fontSize],
      ['font-weight', computed.fontWeight],
      ['font-style', computed.fontStyle],
      ['opacity', computed.opacity]
    ];

    inlineRules.forEach(([key, value]) => {
      if (value && value !== 'none' && value !== 'normal' && value !== 'rgba(0, 0, 0, 0)') {
        node.setAttribute(key, value);
      }
    });
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(clone);
  return wrapper.innerHTML;
}

async function downloadSvg() {
  try {
    const inlineSvg = buildInlineExportSvg();
    if (!inlineSvg) {
      setStatus('目前沒有可下載的圖');
      return;
    }

    const blob = new Blob([inlineSvg], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'mermaid-diagram.svg');
    setStatus('已下載 SVG');
  } catch (error) {
    console.error('SVG export failed:', error);
    setStatus('SVG 匯出失敗');
  }
}

async function renderExportSvg(code) {
  mermaid.initialize(buildMermaidConfig({ forExport: true }));
  const id = `mermaid-export-${++renderCount}`;
  const { svg } = await mermaid.render(id, code);
  return svg;
}

function sanitizeSvgForExport(svg, width, height) {
  let safeSvg = svg
    .replace(/font-family:[^;"}]+/g, 'font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/g, '')
    .replace(/<style>[\s\S]*?<\/style>/g, styleBlock => styleBlock.replace(/@import[^;]+;/g, ''));

  safeSvg = safeSvg.replace(/<svg\b([^>]*)>/, (match, attrs) => {
    const hasXmlns = /\sxmlns=/.test(attrs);
    const cleanedAttrs = attrs
      .replace(/\swidth="[^"]*"/g, '')
      .replace(/\sheight="[^"]*"/g, '');
    return `<svg${hasXmlns ? '' : ' xmlns="http://www.w3.org/2000/svg"'} width="${width}" height="${height}"${cleanedAttrs}>`;
  });

  return safeSvg;
}

async function renderSvgToImage(url) {
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  return img;
}

async function downloadPng() {
  if (!latestSvg) {
    setStatus('目前沒有可下載的圖');
    return;
  }

  try {
    paintRenderedDiagram();

    const dims = getExportDimensions();
    const exportWrap = document.createElement('div');
    exportWrap.style.position = 'fixed';
    exportWrap.style.left = '-99999px';
    exportWrap.style.top = '0';
    exportWrap.style.width = `${dims.canvasWidth}px`;
    exportWrap.style.height = `${dims.canvasHeight}px`;
    exportWrap.style.padding = `${dims.padding}px`;
    exportWrap.style.background = backgroundColor.value;
    exportWrap.style.display = 'flex';
    exportWrap.style.alignItems = 'flex-start';
    exportWrap.style.justifyContent = 'flex-start';
    exportWrap.style.overflow = 'visible';
    exportWrap.style.boxSizing = 'border-box';

    const clonedPreview = preview.cloneNode(true);
    if (clonedPreview instanceof HTMLElement) {
      clonedPreview.style.width = `${dims.width}px`;
      clonedPreview.style.minHeight = `${dims.height}px`;
      clonedPreview.style.margin = '0';
      clonedPreview.style.padding = '0';
      clonedPreview.style.border = '0';
      clonedPreview.style.overflow = 'visible';
      clonedPreview.style.background = backgroundColor.value;
    }

    exportWrap.appendChild(clonedPreview);
    document.body.appendChild(exportWrap);

    try {
      const canvas = await html2canvas(exportWrap, {
        backgroundColor: backgroundColor.value,
        scale: 2,
        useCORS: true,
        logging: false,
        width: dims.canvasWidth,
        height: dims.canvasHeight,
        x: 0,
        y: 0,
        windowWidth: dims.canvasWidth,
        windowHeight: dims.canvasHeight
      });

      const pngBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas 無法輸出 PNG'));
        }, 'image/png');
      });

      downloadBlob(pngBlob, 'mermaid-diagram.png');
      setStatus('已下載 PNG');
      return;
    } finally {
      exportWrap.remove();
    }
  } catch (domError) {
    console.warn('DOM PNG export failed, fallback to SVG export:', domError);

    try {
      const exportCode = latestCode || codeInput.value.trim();
      if (!exportCode) {
        setStatus('目前沒有可下載的圖');
        return;
      }

      const dims = getExportDimensions();
      const exportSvg = await renderExportSvg(exportCode);
      const safeSvg = sanitizeSvgForExport(exportSvg, dims.canvasWidth, dims.canvasHeight);

      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = dims.canvasWidth * scale;
      canvas.height = dims.canvasHeight * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 初始化失敗');
      }

      ctx.scale(scale, scale);
      ctx.fillStyle = backgroundColor.value;
      ctx.fillRect(0, 0, dims.canvasWidth, dims.canvasHeight);
      ctx.translate(dims.padding, dims.padding);

      const renderer = Canvg.fromString(ctx, safeSvg, {
        ignoreMouse: true,
        ignoreAnimation: true,
        ignoreDimensions: true
      });
      await renderer.render();

      const fallbackBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas 無法輸出 PNG'));
        }, 'image/png');
      });

      downloadBlob(fallbackBlob, 'mermaid-diagram.png');
      setStatus('已下載 PNG');
    } catch (error) {
      console.error('PNG export failed:', error);
      setStatus('PNG 匯出失敗');
    }
  }
}

demoBtn.addEventListener('click', () => {
  codeInput.value = demoCode;
  scheduleRender();
});

copyBtn.addEventListener('click', () => {
  copyCode().catch(() => setStatus('複製失敗'));
});

downloadSvgBtn.addEventListener('click', () => {
  downloadSvg();
});
downloadPngBtn.addEventListener('click', downloadPng);
applyThemeBtn.addEventListener('click', renderDiagram);
resetThemeBtn.addEventListener('click', () => {
  applyPreset(defaultTheme.mode);
  renderDiagram();
});
codeInput.addEventListener('input', scheduleRender);
themeMode.addEventListener('change', () => {
  applyPreset(themeMode.value);
  renderDiagram();
});
[primaryColor, lineColor, textColor, backgroundColor].forEach(el => {
  el.addEventListener('input', () => {
    syncPreviewSurface();
    scheduleRender();
  });
  el.addEventListener('change', () => {
    syncPreviewSurface();
    scheduleRender();
  });
});

applyPreset(defaultTheme.mode);
updateCount();
renderDiagram();
