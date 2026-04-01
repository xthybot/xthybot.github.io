const STORAGE_KEY = 'a4-merge-print-state-v1';
const PAGE_MM = { width: 210, height: 297 };
const PREVIEW_BASE_WIDTH = 1100;
const PREVIEW_BASE_HEIGHT = Math.round(PREVIEW_BASE_WIDTH * PAGE_MM.height / PAGE_MM.width);
const FONT_OPTIONS = [
  { name: 'Inter', css: '"Inter", "Noto Sans TC", system-ui, sans-serif' },
  { name: 'Noto Sans TC', css: '"Noto Sans TC", "Inter", system-ui, sans-serif' },
  { name: 'Arial', css: 'Arial, sans-serif' },
  { name: 'Georgia', css: 'Georgia, serif' },
  { name: 'Courier New', css: '"Courier New", monospace' }
];

const DEFAULT_BOXES = [
  { id: 'box-1', label: '文字框 1', x: 8, y: 10, w: 84, h: 14, fontSize: 20, fontWeight: '700', align: 'left', color: '#111111', lineHeight: 1.2, letterSpacing: 0, rotate: 0, vertical: false },
  { id: 'box-2', label: '文字框 2', x: 8, y: 28, w: 84, h: 12, fontSize: 13, fontWeight: '400', align: 'left', color: '#222222', lineHeight: 1.25, letterSpacing: 0, rotate: 0, vertical: false },
  { id: 'box-3', label: '文字框 3', x: 8, y: 46, w: 84, h: 12, fontSize: 13, fontWeight: '400', align: 'left', color: '#222222', lineHeight: 1.25, letterSpacing: 0, rotate: 0, vertical: false },
  { id: 'box-4', label: '文字框 4', x: 8, y: 64, w: 84, h: 20, fontSize: 12, fontWeight: '400', align: 'left', color: '#222222', lineHeight: 1.35, letterSpacing: 0, rotate: 0, vertical: false }
];

const DEFAULT_STATE = {
  cols: 2,
  rows: 4,
  marginMm: 5,
  previewScale: 45,
  showCellNumbers: true,
  showSafeZone: true,
  batchData: '',
  image: null,
  imageName: '',
  imageWidth: 0,
  imageHeight: 0,
  fontFamily: FONT_OPTIONS[0].name,
  sampleText: '欄位示意文字',
  customFonts: [],
  textBoxes: structuredClone(DEFAULT_BOXES),
  selectedBoxId: 'box-1'
};

const state = loadState();
let ui = null;
let dragState = null;

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed, textBoxes: mergeBoxes(parsed.textBoxes), customFonts: parsed.customFonts || [] };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mergeBoxes(boxes) {
  const source = Array.isArray(boxes) && boxes.length ? boxes : DEFAULT_BOXES;
  return source.slice(0, 4).map((box, index) => ({ ...DEFAULT_BOXES[index], ...box, id: `box-${index + 1}`, label: `文字框 ${index + 1}` }));
}

function parseBatchData(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean);
  const rows = [];
  let detectedColumns = 0;

  for (const line of lines) {
    const cols = [];
    let current = '';
    let escaped = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (escaped) {
        current += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '/') {
        cols.push(current);
        current = '';
        continue;
      }
      current += ch;
    }

    if (escaped) current += '\\';
    cols.push(current);

    if (!detectedColumns) detectedColumns = cols.length;
    const normalized = cols.slice(0, 3);
    if (cols.length > 3) {
      normalized.push(cols.slice(3).join('/'));
    }
    while (normalized.length < Math.min(4, detectedColumns)) normalized.push('');
    rows.push(normalized.slice(0, 4));
  }

  return {
    rows,
    detectedColumns: Math.min(4, detectedColumns || 1)
  };
}

function paginateData(rows, rowsPerPage) {
  const pages = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage));
  }
  return pages;
}

function ensureUiReferences() {
  if (document.getElementById('singleStage')) {
    ui = {
      imageInput: document.getElementById('templateImage'),
      colsInput: document.getElementById('cols'),
      rowsInput: document.getElementById('rows'),
      marginInput: document.getElementById('marginMm'),
      previewScaleInput: document.getElementById('previewScale'),
      showCellNumbersInput: document.getElementById('showCellNumbers'),
      showSafeZoneInput: document.getElementById('showSafeZone'),
      imageInfo: document.getElementById('imageInfo'),
      fontUpload: document.getElementById('fontUpload'),
      fontFamily: document.getElementById('fontFamily'),
      fontInfo: document.getElementById('fontInfo'),
      textBoxEditor: document.getElementById('textBoxEditor'),
      previewBtn: document.getElementById('previewBtn'),
      exportPdfBtn: document.getElementById('exportPdfBtn'),
      exportBlankPdfBtn: document.getElementById('exportBlankPdfBtn'),
      resetBtn: document.getElementById('resetBtn'),
      statusBox: document.getElementById('statusBox'),
      batchData: document.getElementById('batchData'),
      dataStats: document.getElementById('dataStats'),
      demoDataBtn: document.getElementById('demoDataBtn'),
      singleStage: document.getElementById('singleStage'),
      selectedBoxInfo: document.getElementById('selectedBoxInfo'),
      sampleText: document.getElementById('sampleText'),
      boxX: document.getElementById('boxX'),
      boxY: document.getElementById('boxY'),
      boxW: document.getElementById('boxW'),
      boxH: document.getElementById('boxH'),
      boxFontSize: document.getElementById('boxFontSize'),
      boxFontWeight: document.getElementById('boxFontWeight'),
      boxAlign: document.getElementById('boxAlign'),
      boxLineHeight: document.getElementById('boxLineHeight'),
      boxLetterSpacing: document.getElementById('boxLetterSpacing'),
      boxRotate: document.getElementById('boxRotate'),
      boxColor: document.getElementById('boxColor'),
      boxVertical: document.getElementById('boxVertical')
    };
  } else {
    ui = {
      previewToggleCellNumbers: document.getElementById('previewToggleCellNumbers'),
      refreshPreviewBtn: document.getElementById('refreshPreviewBtn'),
      previewSummary: document.getElementById('previewSummary'),
      previewList: document.getElementById('previewList'),
      zoomDialog: document.getElementById('zoomDialog'),
      zoomCanvas: document.getElementById('zoomCanvas'),
      dialogCloseBtn: document.getElementById('dialogCloseBtn')
    };
  }
}

function populateFontOptions() {
  if (!ui.fontFamily) return;
  ui.fontFamily.innerHTML = '';
  [...FONT_OPTIONS, ...state.customFonts.map((font) => ({ name: font.name, css: `"${font.name}", "Noto Sans TC", sans-serif` }))].forEach((font) => {
    const option = document.createElement('option');
    option.value = font.name;
    option.textContent = font.name;
    if (font.name === state.fontFamily) option.selected = true;
    ui.fontFamily.appendChild(option);
  });
}

async function restoreCustomFonts() {
  for (const font of state.customFonts) {
    try {
      const face = new FontFace(font.name, `url(${font.dataUrl})`);
      await face.load();
      document.fonts.add(face);
    } catch (error) {
      console.warn('字體載入失敗', error);
    }
  }
}

function getSelectedBox() {
  return state.textBoxes.find((box) => box.id === state.selectedBoxId) || state.textBoxes[0];
}

function bindMainPage() {
  ui.colsInput.value = state.cols;
  ui.rowsInput.value = state.rows;
  ui.marginInput.value = state.marginMm;
  ui.previewScaleInput.value = state.previewScale;
  ui.showCellNumbersInput.checked = state.showCellNumbers;
  ui.showSafeZoneInput.checked = state.showSafeZone;
  ui.batchData.value = state.batchData;
  ui.sampleText.value = state.sampleText;
  populateFontOptions();
  renderTextBoxEditor();
  bindStageInspector();
  bindEvents();
  refreshAll();
}

function bindEvents() {
  ui.imageInput.addEventListener('change', handleImageUpload);
  ui.fontUpload.addEventListener('change', handleFontUpload);
  ui.fontFamily.addEventListener('change', () => {
    state.fontFamily = ui.fontFamily.value;
    saveState();
    refreshAll();
  });

  [ui.colsInput, ui.rowsInput, ui.marginInput, ui.previewScaleInput].forEach((input) => {
    input.addEventListener('input', () => {
      state.cols = clampNumber(Number(ui.colsInput.value), 1, 12);
      state.rows = clampNumber(Number(ui.rowsInput.value), 1, 12);
      state.marginMm = clampNumber(Number(ui.marginInput.value), 0, 20);
      state.previewScale = clampNumber(Number(ui.previewScaleInput.value), 20, 100);
      saveState();
      refreshAll();
    });
  });

  ui.showCellNumbersInput.addEventListener('change', () => {
    state.showCellNumbers = ui.showCellNumbersInput.checked;
    saveState();
    refreshAll();
  });

  ui.showSafeZoneInput.addEventListener('change', () => {
    state.showSafeZone = ui.showSafeZoneInput.checked;
    saveState();
    refreshAll();
  });

  ui.batchData.addEventListener('input', () => {
    state.batchData = ui.batchData.value;
    syncBoxCountToData();
    saveState();
    refreshAll();
  });

  ui.demoDataBtn.addEventListener('click', () => {
    ui.batchData.value = [
      '王小明/0912-345-678/白金會員/台北店',
      '李小華/0987-654-321/體驗券/新竹店',
      '陳美玉/0922-111-888/一般會員/台中店/提醒帶證件',
      '林大偉/0910-000-123/VIP/高雄店'
    ].join('\n');
    state.batchData = ui.batchData.value;
    syncBoxCountToData();
    saveState();
    refreshAll();
  });

  ui.previewBtn.addEventListener('click', () => {
    saveState();
    window.open('./preview.html', '_blank', 'noopener');
    setStatus('已在新分頁開啟預覽。');
  });

  ui.exportPdfBtn.addEventListener('click', async () => {
    await exportPdf({ blank: false });
  });

  ui.exportBlankPdfBtn.addEventListener('click', async () => {
    await exportPdf({ blank: true });
  });

  ui.resetBtn.addEventListener('click', () => {
    if (!confirm('要重設目前工具設定嗎？已上傳的底圖、字體與版面都會清空。')) return;
    Object.assign(state, structuredClone(DEFAULT_STATE));
    saveState();
    location.reload();
  });
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const dataUrl = await fileToDataUrl(file);
  const image = await loadImage(dataUrl);
  state.image = dataUrl;
  state.imageName = file.name;
  state.imageWidth = image.width;
  state.imageHeight = image.height;
  saveState();
  refreshAll();
  setStatus(`已載入底圖：${file.name}`);
}

async function handleFontUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const dataUrl = await fileToDataUrl(file);
  const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^\w\u4e00-\u9fff-]+/g, '_') || 'UploadedFont';
  const fontName = `${safeName}_${Date.now().toString(36)}`;
  try {
    const face = new FontFace(fontName, `url(${dataUrl})`);
    await face.load();
    document.fonts.add(face);
    state.customFonts.push({ name: fontName, dataUrl });
    state.fontFamily = fontName;
    saveState();
    populateFontOptions();
    refreshAll();
    setStatus(`已載入字體：${file.name}`);
  } catch (error) {
    console.error(error);
    setStatus('字體載入失敗，請改試其他 TTF / OTF。');
  }
}

function syncBoxCountToData() {
  const parsed = parseBatchData(state.batchData);
  const count = Math.max(1, Math.min(4, parsed.detectedColumns));
  state.textBoxes = mergeBoxes(state.textBoxes).slice(0, count);
  while (state.textBoxes.length < count) {
    state.textBoxes.push({ ...DEFAULT_BOXES[state.textBoxes.length] });
  }
  if (!state.textBoxes.some((box) => box.id === state.selectedBoxId)) {
    state.selectedBoxId = state.textBoxes[0].id;
  }
  renderTextBoxEditor();
}

function renderTextBoxEditor() {
  ui.textBoxEditor.innerHTML = '';
  state.textBoxes.forEach((box, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `box-chip ${box.id === state.selectedBoxId ? 'active' : ''}`;
    chip.innerHTML = `<strong>${index + 1}. ${box.label}</strong><span>${Math.round(box.x)}%, ${Math.round(box.y)}%</span>`;
    chip.addEventListener('click', () => {
      state.selectedBoxId = box.id;
      saveState();
      refreshAll();
    });
    ui.textBoxEditor.appendChild(chip);
  });
}

function bindStageInspector() {
  const fieldMappings = [
    ['sampleText', 'sampleText'],
    ['boxX', 'x'], ['boxY', 'y'], ['boxW', 'w'], ['boxH', 'h'],
    ['boxFontSize', 'fontSize'], ['boxFontWeight', 'fontWeight'], ['boxAlign', 'align'],
    ['boxLineHeight', 'lineHeight'], ['boxLetterSpacing', 'letterSpacing'], ['boxRotate', 'rotate'], ['boxColor', 'color']
  ];

  fieldMappings.forEach(([uiKey, boxKey]) => {
    ui[uiKey].addEventListener('input', () => {
      const box = getSelectedBox();
      if (!box) return;
      if (boxKey === 'sampleText') {
        state.sampleText = ui.sampleText.value;
      } else if (['fontWeight', 'align', 'color'].includes(boxKey)) {
        box[boxKey] = ui[uiKey].value;
      } else {
        box[boxKey] = Number(ui[uiKey].value);
      }
      saveState();
      refreshAll();
    });
  });

  ui.boxVertical.addEventListener('change', () => {
    const box = getSelectedBox();
    if (!box) return;
    box.vertical = ui.boxVertical.checked;
    saveState();
    refreshAll();
  });
}

function refreshInspector() {
  const box = getSelectedBox();
  if (!box) return;
  ui.selectedBoxInfo.textContent = `${box.label} ｜ 可拖曳移動，也可直接輸入數值微調。`;
  ui.sampleText.value = state.sampleText;
  ui.boxX.value = round(box.x);
  ui.boxY.value = round(box.y);
  ui.boxW.value = round(box.w);
  ui.boxH.value = round(box.h);
  ui.boxFontSize.value = round(box.fontSize);
  ui.boxFontWeight.value = box.fontWeight;
  ui.boxAlign.value = box.align;
  ui.boxLineHeight.value = round(box.lineHeight, 2);
  ui.boxLetterSpacing.value = round(box.letterSpacing, 1);
  ui.boxRotate.value = round(box.rotate);
  ui.boxColor.value = box.color;
  ui.boxVertical.checked = Boolean(box.vertical);
}

function refreshStage() {
  ui.singleStage.innerHTML = '';
  ui.singleStage.style.backgroundImage = state.image ? `url(${state.image})` : 'none';

  const stageSafe = document.createElement('div');
  stageSafe.style.position = 'absolute';
  stageSafe.style.left = '5%';
  stageSafe.style.top = '5%';
  stageSafe.style.right = '5%';
  stageSafe.style.bottom = '5%';
  stageSafe.style.border = state.showSafeZone ? '1px dashed rgba(255, 170, 102, 0.75)' : 'none';
  stageSafe.style.pointerEvents = 'none';
  ui.singleStage.appendChild(stageSafe);

  state.textBoxes.forEach((box, index) => {
    const el = document.createElement('div');
    el.className = `text-box ${box.id === state.selectedBoxId ? 'active' : ''} ${box.vertical ? 'vertical' : ''}`;
    el.dataset.boxId = box.id;
    applyBoxStyle(el, box);

    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = `${index + 1}. ${state.sampleText}`;
    el.appendChild(content);

    el.addEventListener('pointerdown', (event) => startDrag(event, box.id));
    el.addEventListener('click', () => {
      state.selectedBoxId = box.id;
      saveState();
      refreshAll();
    });
    ui.singleStage.appendChild(el);
  });
}

function applyBoxStyle(el, box) {
  el.style.left = `${box.x}%`;
  el.style.top = `${box.y}%`;
  el.style.width = `${box.w}%`;
  el.style.height = `${box.h}%`;
  el.style.color = box.color;
  el.style.fontSize = `${box.fontSize}px`;
  el.style.fontWeight = box.fontWeight;
  el.style.textAlign = box.align;
  el.style.lineHeight = box.lineHeight;
  el.style.letterSpacing = `${box.letterSpacing}px`;
  el.style.fontFamily = resolveFontCss(box.fontFamily || state.fontFamily);
  el.style.transform = `rotate(${box.rotate}deg)`;
}

function startDrag(event, boxId) {
  const stageRect = ui.singleStage.getBoundingClientRect();
  const box = state.textBoxes.find((item) => item.id === boxId);
  if (!box) return;
  state.selectedBoxId = boxId;
  const pointerX = event.clientX - stageRect.left;
  const pointerY = event.clientY - stageRect.top;
  dragState = {
    box,
    stageRect,
    startX: box.x,
    startY: box.y,
    offsetX: pointerX - (stageRect.width * box.x / 100),
    offsetY: pointerY - (stageRect.height * box.y / 100)
  };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', stopDrag);
}

function onDragMove(event) {
  if (!dragState) return;
  const { box, stageRect, offsetX, offsetY } = dragState;
  const nextX = ((event.clientX - stageRect.left - offsetX) / stageRect.width) * 100;
  const nextY = ((event.clientY - stageRect.top - offsetY) / stageRect.height) * 100;
  box.x = clampNumber(nextX, 0, 100 - box.w);
  box.y = clampNumber(nextY, 0, 100 - box.h);
  saveState();
  refreshAll();
}

function stopDrag() {
  dragState = null;
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', stopDrag);
}

function refreshDataStats() {
  const parsed = parseBatchData(state.batchData);
  const cellsPerPage = state.cols * state.rows;
  const pages = paginateData(parsed.rows, cellsPerPage);
  ui.dataStats.textContent = `共 ${parsed.rows.length} 筆資料 ｜ 自動辨識 ${parsed.detectedColumns} 欄 ｜ 每頁 ${cellsPerPage} 格 ｜ 預計 ${Math.max(1, pages.length || 1)} 頁`;
}

function refreshMeta() {
  if (state.image) {
    ui.imageInfo.textContent = `底圖：${state.imageName} ｜ ${state.imageWidth} × ${state.imageHeight}px`;
  } else {
    ui.imageInfo.textContent = '尚未上傳底圖，預覽會先用空白底。';
  }
  ui.fontInfo.textContent = `目前字體：${state.fontFamily} ｜ 上傳字體僅保留在本次分頁。`;
}

function refreshAll() {
  renderTextBoxEditor();
  refreshInspector();
  refreshStage();
  refreshDataStats();
  refreshMeta();
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function round(value, digits = 1) {
  return Number(value).toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function resolveFontCss(fontName) {
  const builtIn = FONT_OPTIONS.find((font) => font.name === fontName);
  if (builtIn) return builtIn.css;
  return `"${fontName}", "Noto Sans TC", sans-serif`;
}

function getRenderContext(overrides = {}) {
  const parsed = parseBatchData(state.batchData);
  const cellsPerPage = Math.max(1, state.cols * state.rows);
  const pages = paginateData(parsed.rows, cellsPerPage);
  return {
    ...state,
    ...overrides,
    parsedRows: parsed.rows,
    detectedColumns: parsed.detectedColumns,
    pages: pages.length ? pages : [[]],
    cellsPerPage
  };
}

async function renderPageCanvas(pageIndex, options = {}) {
  const config = getRenderContext(options.stateOverrides || {});
  const scale = options.scale || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(PREVIEW_BASE_WIDTH * scale);
  canvas.height = Math.round(PREVIEW_BASE_HEIGHT * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  await drawPage(ctx, config, pageIndex, options);
  return canvas;
}

async function drawPage(ctx, config, pageIndex, options = {}) {
  const pageWidth = PREVIEW_BASE_WIDTH;
  const pageHeight = PREVIEW_BASE_HEIGHT;
  const marginPx = mmToPx(config.marginMm, pageWidth / PAGE_MM.width);
  const safeZone = { x: marginPx, y: marginPx, w: pageWidth - marginPx * 2, h: pageHeight - marginPx * 2 };
  const cellW = safeZone.w / config.cols;
  const cellH = safeZone.h / config.rows;
  const rows = config.pages[pageIndex] || [];
  const showNumbers = options.showCellNumbers ?? config.showCellNumbers;
  const blank = options.blank || false;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageWidth, pageHeight);
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, pageWidth - 2, pageHeight - 2);

  if (config.showSafeZone) {
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.85)';
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(safeZone.x, safeZone.y, safeZone.w, safeZone.h);
    ctx.setLineDash([]);
  }

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.lineWidth = 1;
  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const cellIndex = row * config.cols + col;
      const x = safeZone.x + col * cellW;
      const y = safeZone.y + row * cellH;
      ctx.strokeRect(x, y, cellW, cellH);

      if (config.image) {
        const img = await loadSharedImage(config.image);
        ctx.drawImage(img, x, y, cellW, cellH);
      }

      if (!blank) {
        drawCellText(ctx, { x, y, w: cellW, h: cellH }, rows[cellIndex] || [], config);
      }

      if (showNumbers) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`#${pageIndex * config.cellsPerPage + cellIndex + 1}`, x + 8, y + 18);
        ctx.restore();
      }
    }
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.font = '14px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Page ${pageIndex + 1} / ${config.pages.length}`, pageWidth - 20, pageHeight - 18);
}

const sharedImageCache = new Map();
async function loadSharedImage(src) {
  if (!sharedImageCache.has(src)) {
    sharedImageCache.set(src, loadImage(src));
  }
  return sharedImageCache.get(src);
}

function drawCellText(ctx, cellRect, rowData, config) {
  config.textBoxes.forEach((box, index) => {
    const text = rowData[index] ?? '';
    if (!text) return;
    const rect = {
      x: cellRect.x + (cellRect.w * box.x / 100),
      y: cellRect.y + (cellRect.h * box.y / 100),
      w: cellRect.w * box.w / 100,
      h: cellRect.h * box.h / 100
    };

    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((box.rotate || 0) * Math.PI / 180);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.clip();
    ctx.fillStyle = box.color;
    ctx.font = `${box.fontWeight || 400} ${box.fontSize || 12}px ${resolveFontCss(box.fontFamily || config.fontFamily)}`;
    ctx.textAlign = box.align || 'left';
    ctx.textBaseline = 'top';

    if (box.vertical) {
      drawVerticalText(ctx, text, rect, box);
    } else {
      drawHorizontalText(ctx, text, rect, box);
    }
    ctx.restore();
  });
}

function drawHorizontalText(ctx, text, rect, box) {
  const lines = String(text).split('\n');
  const lineHeightPx = (box.fontSize || 12) * (box.lineHeight || 1.2);
  let drawX = 0;
  if (box.align === 'center') drawX = rect.w / 2;
  if (box.align === 'right') drawX = rect.w;
  lines.forEach((line, index) => {
    if (!box.letterSpacing) {
      ctx.fillText(line, drawX, index * lineHeightPx);
      return;
    }
    drawTextWithLetterSpacing(ctx, line, drawX, index * lineHeightPx, box.align || 'left', box.letterSpacing, rect.w);
  });
}

function drawVerticalText(ctx, text, rect, box) {
  const chars = String(text).split('');
  const step = (box.fontSize || 12) * (box.lineHeight || 1.2);
  let x = rect.w - (box.fontSize || 12);
  let y = 0;
  chars.forEach((char) => {
    if (char === '\n') {
      x -= step;
      y = 0;
      return;
    }
    ctx.fillText(char, x, y);
    y += step + (box.letterSpacing || 0);
    if (y > rect.h - step) {
      x -= step;
      y = 0;
    }
  });
}

function drawTextWithLetterSpacing(ctx, text, x, y, align, spacing, width) {
  const chars = String(text).split('');
  const charWidths = chars.map((char) => ctx.measureText(char).width);
  const totalWidth = charWidths.reduce((sum, w) => sum + w, 0) + Math.max(0, chars.length - 1) * spacing;
  let cursor = x;
  if (align === 'center') cursor = (width - totalWidth) / 2;
  if (align === 'right') cursor = width - totalWidth;
  chars.forEach((char, index) => {
    ctx.fillText(char, cursor, y);
    cursor += charWidths[index] + spacing;
  });
}

function mmToPx(mm, pxPerMm) {
  return mm * pxPerMm;
}

async function exportPdf({ blank }) {
  const { jsPDF } = window.jspdf;
  const config = getRenderContext();
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  setStatus(blank ? '正在產生空白模板 PDF…' : '正在產生 PDF…');
  for (let i = 0; i < config.pages.length; i += 1) {
    const canvas = await renderPageCanvas(i, { scale: 2.48, blank, showCellNumbers: state.showCellNumbers });
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    if (i > 0) pdf.addPage();
    pdf.addImage(imageData, 'JPEG', 0, 0, PAGE_MM.width, PAGE_MM.height, undefined, 'FAST');
  }
  const filename = blank ? 'a4-blank-template.pdf' : 'a4-merge-print.pdf';
  pdf.save(filename);
  setStatus(blank ? '空白模板 PDF 已匯出。' : 'PDF 已匯出。');
}

function setStatus(message) {
  if (ui.statusBox) ui.statusBox.textContent = message;
}

async function initPreviewPage() {
  const previewState = loadState();
  Object.assign(state, previewState);
  await restoreCustomFonts();
  ui.previewToggleCellNumbers.checked = state.showCellNumbers;

  const renderAll = async () => {
    state.showCellNumbers = ui.previewToggleCellNumbers.checked;
    saveState();
    ui.previewList.innerHTML = '';
    const config = getRenderContext();
    ui.previewSummary.textContent = `共 ${config.parsedRows.length} 筆資料 ｜ ${config.cols} × ${config.rows} ｜ ${config.pages.length} 頁預覽`;
    for (let i = 0; i < config.pages.length; i += 1) {
      const card = document.createElement('article');
      card.className = 'preview-card';
      card.innerHTML = `<div class="preview-card-head"><h3>第 ${i + 1} 頁</h3><div class="preview-meta">${config.pages[i].length} 格資料</div></div>`;
      const canvas = await renderPageCanvas(i, { scale: state.previewScale / 100, showCellNumbers: state.showCellNumbers });
      card.appendChild(canvas);
      const button = document.createElement('button');
      button.className = 'mini-btn';
      button.textContent = '放大查看';
      button.addEventListener('click', async () => {
        const zoomCanvas = await renderPageCanvas(i, { scale: 1.2, showCellNumbers: state.showCellNumbers });
        ui.zoomCanvas.width = zoomCanvas.width;
        ui.zoomCanvas.height = zoomCanvas.height;
        ui.zoomCanvas.getContext('2d').drawImage(zoomCanvas, 0, 0);
        ui.zoomDialog.showModal();
      });
      card.appendChild(button);
      ui.previewList.appendChild(card);
    }
  };

  ui.previewToggleCellNumbers.addEventListener('change', renderAll);
  ui.refreshPreviewBtn.addEventListener('click', renderAll);
  ui.dialogCloseBtn.addEventListener('click', () => ui.zoomDialog.close());
  await renderAll();
}

async function init() {
  ensureUiReferences();
  await restoreCustomFonts();
  if (ui.singleStage) {
    syncBoxCountToData();
    bindMainPage();
  } else {
    await initPreviewPage();
  }
}

init();