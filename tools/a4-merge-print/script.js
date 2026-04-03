const STORAGE_KEY = 'a4-merge-print-state-v2';
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
  { id: 'box-1', label: '文字框 1', x: 8, y: 10, w: 84, h: 14, fontSize: 20, fontWeight: '700', align: 'left', vAlign: 'top', color: '#111111', lineHeight: 1.2, letterSpacing: 0, rotate: 0, vertical: false },
  { id: 'box-2', label: '文字框 2', x: 8, y: 28, w: 84, h: 12, fontSize: 13, fontWeight: '400', align: 'left', vAlign: 'top', color: '#222222', lineHeight: 1.25, letterSpacing: 0, rotate: 0, vertical: false },
  { id: 'box-3', label: '文字框 3', x: 8, y: 46, w: 84, h: 12, fontSize: 13, fontWeight: '400', align: 'left', vAlign: 'top', color: '#222222', lineHeight: 1.25, letterSpacing: 0, rotate: 0, vertical: false },
  { id: 'box-4', label: '文字框 4', x: 8, y: 64, w: 84, h: 20, fontSize: 12, fontWeight: '400', align: 'left', vAlign: 'top', color: '#222222', lineHeight: 1.35, letterSpacing: 0, rotate: 0, vertical: false }
];

const DEFAULT_STATE = {
  cols: 2,
  rows: 4,
  marginMm: 5,
  previewScale: 45,
  imageScale: 100,
  imageOffsetX: 0,
  imageOffsetY: 0,
  cellGapMm: 0,
  previewMode: 'single',
  showCellNumbers: true,
  showSafeZone: true,
  showGuideLines: true,
  cellNumberCorner: 'top-left',
  cellNumberFormat: 'hash',
  cellNumberOffsetX: 2,
  cellNumberOffsetY: 2,
  cellNumberFontSize: 12,
  cellNumberColor: '#0f172a',
  batchData: '',
  image: null,
  imageName: '',
  imageWidth: 0,
  imageHeight: 0,
  fontFamily: FONT_OPTIONS[0].name,
  sampleText: '',
  customFonts: [],
  lastUploadedFontName: '',
  textBoxes: structuredClone(DEFAULT_BOXES),
  selectedBoxId: 'box-1'
};

const sharedImageCache = new Map();
const state = loadState();
let ui = null;
let dragState = null;

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      textBoxes: mergeBoxes(parsed.textBoxes),
      customFonts: parsed.customFonts || []
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  const serializable = {
    ...state,
    customFonts: (state.customFonts || []).map(({ name, originalName }) => ({ name, originalName })),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    try {
      const fallback = { ...serializable, customFonts: [], lastUploadedFontName: '' };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

function mergeBoxes(boxes) {
  const source = Array.isArray(boxes) && boxes.length ? boxes : DEFAULT_BOXES;
  return source.slice(0, 4).map((box, index) => ({
    ...DEFAULT_BOXES[index],
    ...box,
    id: `box-${index + 1}`,
    label: `文字框 ${index + 1}`
  }));
}

function parseBatchData(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean);
  const rows = [];
  let detectedColumns = 0;

  for (const line of lines) {
    const cols = [];
    let current = '';
    let escaped = false;
    for (const ch of line) {
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
    if (cols.length > 3) normalized.push(cols.slice(3).join('/'));
    while (normalized.length < Math.min(4, detectedColumns || 1)) normalized.push('');
    rows.push(normalized.slice(0, 4));
  }

  return { rows, detectedColumns: Math.min(4, detectedColumns || 1) };
}

function getFirstSampleRow() {
  const parsed = parseBatchData(state.batchData);
  return parsed.rows[0] || [];
}

function getSampleTextForBox(index) {
  return getFirstSampleRow()[index] || `欄位 ${index + 1}`;
}

function paginateData(rows, rowsPerPage) {
  const pages = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) pages.push(rows.slice(i, i + rowsPerPage));
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
      previewScaleRange: document.getElementById('previewScaleRange'),
      imageScaleInput: document.getElementById('imageScale'),
      imageScaleRange: document.getElementById('imageScaleRange'),
      imageOffsetXInput: document.getElementById('imageOffsetX'),
      imageOffsetXRange: document.getElementById('imageOffsetXRange'),
      imageOffsetYInput: document.getElementById('imageOffsetY'),
      imageOffsetYRange: document.getElementById('imageOffsetYRange'),
      imageFitModeInput: document.getElementById('imageFitMode'),
      cellGapMmInput: document.getElementById('cellGapMm'),
      cellGapMmRange: document.getElementById('cellGapMmRange'),
      showCellNumbersInput: document.getElementById('showCellNumbers'),
      showSafeZoneInput: document.getElementById('showSafeZone'),
      cellNumberCorner: document.getElementById('cellNumberCorner'),
      cellNumberFormat: document.getElementById('cellNumberFormat'),
      cellNumberOffsetX: document.getElementById('cellNumberOffsetX'),
      cellNumberOffsetXRange: document.getElementById('cellNumberOffsetXRange'),
      cellNumberOffsetY: document.getElementById('cellNumberOffsetY'),
      cellNumberOffsetYRange: document.getElementById('cellNumberOffsetYRange'),
      cellNumberFontSize: document.getElementById('cellNumberFontSize'),
      cellNumberFontSizeRange: document.getElementById('cellNumberFontSizeRange'),
      cellNumberColorInput: document.getElementById('cellNumberColor'),
      showGuideLinesInput: document.getElementById('showGuideLines'),
      showPageNumbersInput: document.getElementById('showPageNumbers'),
      imageInfo: document.getElementById('imageInfo'),
      fontUpload: document.getElementById('fontUpload'),
      applyUploadedFontBtn: document.getElementById('applyUploadedFontBtn'),
      clearUploadedFontsBtn: document.getElementById('clearUploadedFontsBtn'),
      fontFamily: document.getElementById('fontFamily'),
      fontInfo: document.getElementById('fontInfo'),
      previewModeA4Btn: document.getElementById('previewModeA4Btn'),
      previewModeSingleBtn: document.getElementById('previewModeSingleBtn'),
      a4PreviewEmbed: document.getElementById('a4PreviewEmbed'),
      a4PreviewCanvas: document.getElementById('a4PreviewCanvas'),
      exportPdfBtn: document.getElementById('exportPdfBtn'),
      exportBlankPdfBtn: document.getElementById('exportBlankPdfBtn'),
      resetBtn: document.getElementById('resetBtn'),
      statusBox: document.getElementById('statusBox'),
      batchData: document.getElementById('batchData'),
      dataStats: document.getElementById('dataStats'),
      demoDataBtn: document.getElementById('demoDataBtn'),
      pageStage: document.getElementById('pageStage'),
      pageStageSafe: document.getElementById('pageStageSafe'),
      singleStagePreviewWrap: document.getElementById('singleStagePreviewWrap'),
      singleStagePreviewCanvas: document.getElementById('singleStagePreviewCanvas'),
      singleStage: document.getElementById('singleStage'),
      selectedBoxInfo: document.getElementById('selectedBoxInfo'),
      sampleText: document.getElementById('sampleText'),
      boxX: document.getElementById('boxX'),
      boxXRange: document.getElementById('boxXRange'),
      boxY: document.getElementById('boxY'),
      boxYRange: document.getElementById('boxYRange'),
      boxW: document.getElementById('boxW'),
      boxWRange: document.getElementById('boxWRange'),
      boxH: document.getElementById('boxH'),
      boxHRange: document.getElementById('boxHRange'),
      boxFontSize: document.getElementById('boxFontSize'),
      boxFontSizeRange: document.getElementById('boxFontSizeRange'),
      boxFontWeight: document.getElementById('boxFontWeight'),
      boxAlign: document.getElementById('boxAlign'),
      boxVAlign: document.getElementById('boxVAlign'),
      boxLineHeight: document.getElementById('boxLineHeight'),
      boxLineHeightRange: document.getElementById('boxLineHeightRange'),
      boxLetterSpacing: document.getElementById('boxLetterSpacing'),
      boxLetterSpacingRange: document.getElementById('boxLetterSpacingRange'),
      boxRotate: document.getElementById('boxRotate'),
      boxRotateRange: document.getElementById('boxRotateRange'),
      boxColor: document.getElementById('boxColor'),
      boxVertical: document.getElementById('boxVertical')
    };
  } else {
    ui = {
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
  const fonts = [...FONT_OPTIONS, ...state.customFonts.map((font) => ({ name: font.name, css: `"${font.name}", "Noto Sans TC", sans-serif` }))];
  fonts.forEach((font) => {
    const option = document.createElement('option');
    option.value = font.name;
    option.textContent = font.name;
    option.selected = font.name === state.fontFamily;
    ui.fontFamily.appendChild(option);
  });
}

async function registerFont(fontName, dataUrl) {
  const face = new FontFace(fontName, `url(${dataUrl}) format('truetype')`);
  await face.load();
  document.fonts.add(face);
  try {
    await document.fonts.load(`16px "${fontName}"`);
  } catch {}
}

async function ensureActiveFontReady(fontName = state.fontFamily) {
  if (!fontName) return;
  try {
    await document.fonts.load(`16px ${resolveFontCss(fontName)}`);
    await document.fonts.ready;
  } catch {}
}

async function restoreCustomFonts() {
  for (const font of state.customFonts) {
    try { await registerFont(font.name, font.dataUrl); } catch (error) { console.warn('font restore failed', error); }
  }
}

function syncNumberRangePair(numberInput, rangeInput, value) {
  if (numberInput) numberInput.value = value;
  if (rangeInput) rangeInput.value = value;
}

function bindSliderPairs() {
  const pairs = [
    ['previewScaleInput', 'previewScaleRange'],
    ['imageScaleInput', 'imageScaleRange'],
    ['cellGapMmInput', 'cellGapMmRange'],
    ['imageOffsetXInput', 'imageOffsetXRange'],
    ['imageOffsetYInput', 'imageOffsetYRange'],
    ['cellNumberOffsetX', 'cellNumberOffsetXRange'],
    ['cellNumberOffsetY', 'cellNumberOffsetYRange'],
    ['cellNumberFontSize', 'cellNumberFontSizeRange'],
    ['boxX', 'boxXRange'],
    ['boxY', 'boxYRange'],
    ['boxW', 'boxWRange'],
    ['boxH', 'boxHRange'],
    ['boxFontSize', 'boxFontSizeRange'],
    ['boxLineHeight', 'boxLineHeightRange'],
    ['boxLetterSpacing', 'boxLetterSpacingRange'],
    ['boxRotate', 'boxRotateRange']
  ];

  pairs.forEach(([numberKey, rangeKey]) => {
    const numberInput = ui[numberKey];
    const rangeInput = ui[rangeKey];
    if (!numberInput || !rangeInput) return;
    rangeInput.addEventListener('input', () => {
      numberInput.value = rangeInput.value;
      numberInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    numberInput.addEventListener('input', () => {
      if (numberInput.value === '') return;
      rangeInput.value = numberInput.value;
    });
  });
}

function bindMainPage() {
  ui.colsInput.value = state.cols;
  ui.rowsInput.value = state.rows;
  ui.marginInput.value = state.marginMm;
  syncNumberRangePair(ui.previewScaleInput, ui.previewScaleRange, state.previewScale);
  ui.showCellNumbersInput.checked = state.showCellNumbers;
  ui.showSafeZoneInput.checked = state.showSafeZone;
  syncNumberRangePair(ui.imageScaleInput, ui.imageScaleRange, state.imageScale);
  syncNumberRangePair(ui.imageOffsetXInput, ui.imageOffsetXRange, state.imageOffsetX);
  syncNumberRangePair(ui.imageOffsetYInput, ui.imageOffsetYRange, state.imageOffsetY);
  syncNumberRangePair(ui.cellGapMmInput, ui.cellGapMmRange, state.cellGapMm);
  ui.cellNumberCorner.value = state.cellNumberCorner;
  ui.cellNumberFormat.value = state.cellNumberFormat;
  syncNumberRangePair(ui.cellNumberOffsetX, ui.cellNumberOffsetXRange, state.cellNumberOffsetX);
  syncNumberRangePair(ui.cellNumberOffsetY, ui.cellNumberOffsetYRange, state.cellNumberOffsetY);
  syncNumberRangePair(ui.cellNumberFontSize, ui.cellNumberFontSizeRange, state.cellNumberFontSize);
  ui.cellNumberColorInput.value = state.cellNumberColor;
  ui.showGuideLinesInput.checked = state.showGuideLines;
  ui.showPageNumbersInput.checked = state.showPageNumbers;
  ui.batchData.value = state.batchData;
  populateFontOptions();
  bindSliderPairs();
  bindStageInspector();
  bindEvents();
  syncBoxCountToData();
  refreshAll();
}

function bindEvents() {
  ui.imageInput.addEventListener('change', handleImageUpload);
  ui.fontUpload.addEventListener('change', handleFontUpload);
  ui.applyUploadedFontBtn.addEventListener('click', applyLatestUploadedFont);
  ui.clearUploadedFontsBtn.addEventListener('click', clearUploadedFonts);
  ui.fontFamily.addEventListener('change', async () => { state.fontFamily = ui.fontFamily.value; saveState(); await ensureActiveFontReady(state.fontFamily); await refreshAll(); });

  [ui.colsInput, ui.rowsInput, ui.marginInput, ui.previewScaleInput, ui.imageScaleInput, ui.imageOffsetXInput, ui.imageOffsetYInput, ui.cellGapMmInput, ui.cellNumberOffsetX, ui.cellNumberOffsetY, ui.cellNumberFontSize, ui.imageFitModeInput, ui.cellNumberColorInput].forEach((input) => {
    input.addEventListener('input', syncGeneralSettingsFromUi);
  });
  [ui.showCellNumbersInput, ui.showSafeZoneInput, ui.showGuideLinesInput, ui.showPageNumbersInput, ui.cellNumberCorner, ui.cellNumberFormat].forEach((input) => {
    input.addEventListener('change', syncGeneralSettingsFromUi);
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

  ui.previewModeA4Btn.addEventListener('click', () => { state.previewMode = 'a4'; saveState(); refreshAll(); });
  ui.previewModeSingleBtn.addEventListener('click', () => { state.previewMode = 'single'; saveState(); refreshAll(); });
  ui.exportPdfBtn.addEventListener('click', () => exportPdf({ blank: false }));
  ui.exportBlankPdfBtn.addEventListener('click', () => exportPdf({ blank: true }));
  ui.resetBtn.addEventListener('click', () => {
    if (!confirm('要重設目前設定嗎？')) return;
    Object.assign(state, structuredClone(DEFAULT_STATE));
    saveState();
    location.reload();
  });
}

function syncGeneralSettingsFromUi() {
  state.cols = clampNumber(Number(ui.colsInput.value), 1, 12);
  state.rows = clampNumber(Number(ui.rowsInput.value), 1, 12);
  state.marginMm = clampNumber(Number(ui.marginInput.value), 0, 20);
  state.previewScale = clampNumber(Number(ui.previewScaleInput.value), 20, 100);
  state.imageScale = clampNumber(Number(ui.imageScaleInput.value), 10, 300);
  state.imageOffsetX = clampNumber(Number(ui.imageOffsetXInput.value), -100, 100);
  state.imageOffsetY = clampNumber(Number(ui.imageOffsetYInput.value), -100, 100);
  state.imageFitMode = ui.imageFitModeInput.value;
  state.cellGapMm = clampNumber(Number(ui.cellGapMmInput.value), 0, 20);
  state.showCellNumbers = ui.showCellNumbersInput.checked;
  state.showSafeZone = ui.showSafeZoneInput.checked;
  state.showGuideLines = ui.showGuideLinesInput.checked;
  state.showPageNumbers = ui.showPageNumbersInput.checked;
  state.cellNumberCorner = ui.cellNumberCorner.value;
  state.cellNumberFormat = ui.cellNumberFormat.value;
  state.cellNumberOffsetX = clampNumber(Number(ui.cellNumberOffsetX.value), 0, 30);
  state.cellNumberOffsetY = clampNumber(Number(ui.cellNumberOffsetY.value), 0, 30);
  state.cellNumberFontSize = clampNumber(Number(ui.cellNumberFontSize.value), 6, 72);
  state.cellNumberColor = ui.cellNumberColorInput.value;
  saveState();
  refreshAll();
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
    runtimeFontData.set(fontName, dataUrl);
    await registerFont(fontName, dataUrl);
    state.customFonts.push({ name: fontName, originalName: file.name });
    state.lastUploadedFontName = fontName;
    state.fontFamily = fontName;
    saveState();
    populateFontOptions();
    refreshAll();
    setStatus(`已上傳並套用字體：${file.name}`);
  } catch (error) {
    console.error(error);
    setStatus(`字體載入失敗：${file.name}`);
  } finally {
    ui.fontUpload.value = '';
  }
}

function applyLatestUploadedFont() {
  if (!state.lastUploadedFontName) {
    setStatus('目前沒有可套用的上傳字體。');
    return;
  }
  state.fontFamily = state.lastUploadedFontName;
  populateFontOptions();
  saveState();
  refreshAll();
  setStatus(`已套用字體：${state.lastUploadedFontName}`);
}

function clearUploadedFonts() {
  state.customFonts = [];
  runtimeFontData.clear();
  state.lastUploadedFontName = '';
  if (!FONT_OPTIONS.some((font) => font.name === state.fontFamily)) state.fontFamily = FONT_OPTIONS[0].name;
  populateFontOptions();
  saveState();
  refreshAll();
  setStatus('已清空本次頁面上傳字體。');
}

function syncBoxCountToData() {
  const parsed = parseBatchData(state.batchData);
  const count = Math.max(1, Math.min(4, parsed.detectedColumns));
  state.textBoxes = mergeBoxes(state.textBoxes).slice(0, count);
  while (state.textBoxes.length < count) state.textBoxes.push({ ...DEFAULT_BOXES[state.textBoxes.length] });
  if (!state.textBoxes.some((box) => box.id === state.selectedBoxId)) state.selectedBoxId = state.textBoxes[0].id;
}

function getSelectedBox() {
  return state.textBoxes.find((box) => box.id === state.selectedBoxId) || state.textBoxes[0];
}

function bindStageInspector() {
  const numericMap = [
    ['boxX', 'x'], ['boxY', 'y'], ['boxW', 'w'], ['boxH', 'h'], ['boxFontSize', 'fontSize'],
    ['boxLineHeight', 'lineHeight'], ['boxLetterSpacing', 'letterSpacing'], ['boxRotate', 'rotate']
  ];
  numericMap.forEach(([uiKey, boxKey]) => {
    ui[uiKey].addEventListener('input', () => { const box = getSelectedBox(); box[boxKey] = Number(ui[uiKey].value); saveState(); refreshAll(); });
  });
  [['boxFontWeight', 'fontWeight'], ['boxAlign', 'align'], ['boxVAlign', 'vAlign'], ['boxColor', 'color']].forEach(([uiKey, boxKey]) => {
    ui[uiKey].addEventListener('change', () => { const box = getSelectedBox(); box[boxKey] = ui[uiKey].value; saveState(); refreshAll(); });
  });
  ui.boxVertical.addEventListener('change', () => { const box = getSelectedBox(); box.vertical = ui.boxVertical.checked; saveState(); refreshAll(); });
}

function refreshInspector() {
  const box = getSelectedBox();
  const index = state.textBoxes.findIndex((item) => item.id === box.id);
  ui.selectedBoxInfo.textContent = `${box.label} ｜ 預覽文字取自第一個非空白資料列第 ${index + 1} 欄。`;
  ui.sampleText.value = getSampleTextForBox(index);
  syncNumberRangePair(ui.boxX, ui.boxXRange, round(box.x));
  syncNumberRangePair(ui.boxY, ui.boxYRange, round(box.y));
  syncNumberRangePair(ui.boxW, ui.boxWRange, round(box.w));
  syncNumberRangePair(ui.boxH, ui.boxHRange, round(box.h));
  syncNumberRangePair(ui.boxFontSize, ui.boxFontSizeRange, round(box.fontSize));
  ui.boxFontWeight.value = box.fontWeight;
  ui.boxAlign.value = box.align;
  ui.boxVAlign.value = box.vAlign;
  syncNumberRangePair(ui.boxLineHeight, ui.boxLineHeightRange, round(box.lineHeight, 2));
  syncNumberRangePair(ui.boxLetterSpacing, ui.boxLetterSpacingRange, round(box.letterSpacing, 1));
  syncNumberRangePair(ui.boxRotate, ui.boxRotateRange, round(box.rotate));
  ui.boxColor.value = box.color;
  ui.boxVertical.checked = Boolean(box.vertical);
}

function getPageLayout() {
  const marginXPercent = (state.marginMm / PAGE_MM.width) * 100;
  const marginYPercent = (state.marginMm / PAGE_MM.height) * 100;
  const gapXPercent = (state.cellGapMm / PAGE_MM.width) * 100;
  const gapYPercent = (state.cellGapMm / PAGE_MM.height) * 100;
  const safeWidth = 100 - marginXPercent * 2;
  const safeHeight = 100 - marginYPercent * 2;
  const totalGapX = gapXPercent * Math.max(0, state.cols - 1);
  const totalGapY = gapYPercent * Math.max(0, state.rows - 1);
  return {
    safeLeft: marginXPercent,
    safeTop: marginYPercent,
    safeWidth,
    safeHeight,
    gapX: gapXPercent,
    gapY: gapYPercent,
    cellWidth: (safeWidth - totalGapX) / state.cols,
    cellHeight: (safeHeight - totalGapY) / state.rows,
  };
}

function getSingleStageMetrics() {
  const layout = getPageLayout();
  return {
    widthPercent: layout.cellWidth,
    heightPercent: layout.cellHeight,
    aspectRatio: layout.cellWidth / layout.cellHeight,
  };
}

function placeStageNumberMarker(marker) {
  const stageRect = ui.singleStage.getBoundingClientRect();
  const pos = getCellNumberPosition({ x: 0, y: 0, w: stageRect.width || 250, h: stageRect.height || 180 }, 1, true, state);
  marker.style.left = `${pos.left}px`;
  marker.style.top = `${pos.top}px`;
}

async function refreshStage() {
  ui.previewModeA4Btn.classList.toggle('active', state.previewMode === 'a4');
  ui.previewModeSingleBtn.classList.toggle('active', state.previewMode === 'single');
  ui.a4PreviewEmbed.hidden = state.previewMode !== 'a4';
  ui.pageStage.hidden = state.previewMode !== 'single';

  if (state.previewMode === 'a4') {
    ui.pageStage.classList.remove('safe-hidden');
    ui.pageStage.style.width = 'min(100%, 720px)';
    ui.pageStage.style.aspectRatio = '210 / 297';
    ui.singleStagePreviewWrap.hidden = true;
    const canvas = await renderPageCanvas(0, {
      scale: Math.max(0.45, state.previewScale / 100),
      showGuideLines: state.showGuideLines,
      stateOverrides: {
        imageFitMode: state.imageFitMode,
        cellNumberColor: state.cellNumberColor,
        showPageNumbers: state.showPageNumbers,
        cellNumberFontSize: state.cellNumberFontSize,
      }
    });
    const ctx = ui.a4PreviewCanvas.getContext('2d');
    ui.a4PreviewCanvas.width = canvas.width;
    ui.a4PreviewCanvas.height = canvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);
    ui.singleStage.innerHTML = '';
    return;
  }

  const metrics = getSingleStageMetrics();
  ui.pageStage.classList.add('safe-hidden');
  ui.pageStage.style.width = 'min(100%, 640px)';
  ui.pageStage.style.aspectRatio = `${metrics.aspectRatio}`;
  ui.pageStageSafe.style.display = 'none';
  ui.singleStagePreviewWrap.hidden = false;
  const singleCanvas = await renderSingleCellCanvas(Math.max(0.8, state.previewScale / 100));
  ui.singleStagePreviewCanvas.width = singleCanvas.width;
  ui.singleStagePreviewCanvas.height = singleCanvas.height;
  const singleCtx = ui.singleStagePreviewCanvas.getContext('2d');
  singleCtx.clearRect(0, 0, singleCanvas.width, singleCanvas.height);
  singleCtx.drawImage(singleCanvas, 0, 0);
  ui.singleStage.classList.add('single-focus');
  ui.singleStage.style.left = '0';
  ui.singleStage.style.top = '0';
  ui.singleStage.style.width = '100%';
  ui.singleStage.style.height = '100%';
  ui.singleStage.style.aspectRatio = `${metrics.aspectRatio}`;
  ui.singleStage.style.backgroundImage = 'none';
  ui.singleStage.innerHTML = '';

  state.textBoxes.forEach((box, index) => {
    const el = document.createElement('div');
    el.className = `text-box ${box.id === state.selectedBoxId ? 'active' : ''} ${box.vertical ? 'vertical' : ''}`;
    applyBoxStyle(el, box);
    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = getSampleTextForBox(index);
    content.style.textAlign = box.align;
    content.style.alignItems = resolveAlignItems(box.vAlign, box.vertical);
    content.style.justifyContent = box.vertical ? resolveVerticalJustify(box.vAlign) : resolveHorizontalJustify(box.align);
    el.appendChild(content);
    el.addEventListener('pointerdown', (event) => startDrag(event, box.id));
    el.addEventListener('click', () => { state.selectedBoxId = box.id; saveState(); refreshAll(); });
    ui.singleStage.appendChild(el);
  });

  const oldMarker = ui.singleStage.querySelector('.stage-cell-number');
  if (oldMarker) oldMarker.remove();
  if (state.showCellNumbers) renderStageCellNumber();
}

function renderStageCellNumber() {
  const marker = document.createElement('div');
  marker.className = 'text-box stage-cell-number';
  marker.style.pointerEvents = 'none';
  marker.style.cursor = 'default';
  marker.style.borderStyle = 'solid';
  marker.style.borderColor = 'rgba(255, 128, 0, 0.55)';
  marker.style.background = 'rgba(255, 255, 255, 0.55)';
  marker.style.color = state.cellNumberColor;
  marker.style.fontSize = `${state.cellNumberFontSize}px`;
  marker.style.fontWeight = '700';
  marker.style.padding = '2px 6px';
  marker.style.width = 'auto';
  marker.style.height = 'auto';
  marker.textContent = formatCellNumber(1, state.cellNumberFormat);
  ui.singleStage.appendChild(marker);
  placeStageNumberMarker(marker);
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
  el.style.fontFamily = resolveFontCss(state.fontFamily);
  el.style.transform = `rotate(${box.rotate}deg)`;
}

function resolveAlignItems(vAlign, vertical) {
  if (vertical) return 'flex-start';
  if (vAlign === 'middle') return 'center';
  if (vAlign === 'bottom') return 'flex-end';
  return 'flex-start';
}
function resolveVerticalJustify(vAlign) {
  if (vAlign === 'middle') return 'center';
  if (vAlign === 'bottom') return 'flex-end';
  return 'flex-start';
}
function resolveHorizontalJustify(align) {
  if (align === 'center') return 'center';
  if (align === 'right') return 'flex-end';
  return 'flex-start';
}

function startDrag(event, boxId) {
  const stageRect = ui.singleStage.getBoundingClientRect();
  const box = state.textBoxes.find((item) => item.id === boxId);
  if (!box) return;
  state.selectedBoxId = boxId;
  dragState = {
    box,
    stageRect,
    offsetX: event.clientX - stageRect.left - (stageRect.width * box.x / 100),
    offsetY: event.clientY - stageRect.top - (stageRect.height * box.y / 100)
  };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', stopDrag);
}
function onDragMove(event) {
  if (!dragState) return;
  const { box, stageRect, offsetX, offsetY } = dragState;
  box.x = clampNumber(((event.clientX - stageRect.left - offsetX) / stageRect.width) * 100, 0, 100 - box.w);
  box.y = clampNumber(((event.clientY - stageRect.top - offsetY) / stageRect.height) * 100, 0, 100 - box.h);
  saveState(); refreshAll();
}
function stopDrag() { dragState = null; window.removeEventListener('pointermove', onDragMove); window.removeEventListener('pointerup', stopDrag); }

function refreshDataStats() {
  const parsed = parseBatchData(state.batchData);
  const cellsPerPage = Math.max(1, state.cols * state.rows);
  const pages = paginateData(parsed.rows, cellsPerPage);
  ui.dataStats.textContent = `共 ${parsed.rows.length} 筆資料 ｜ 自動辨識 ${parsed.detectedColumns} 欄 ｜ 每頁 ${cellsPerPage} 格 ｜ 預計 ${Math.max(1, pages.length || 1)} 頁`;
}

function refreshMeta() {
  ui.imageInfo.textContent = state.image ? `底圖：${state.imageName} ｜ ${state.imageWidth} × ${state.imageHeight}px` : '尚未上傳底圖，預覽會先用空白底。';
  const fontLabel = state.customFonts.find((f) => f.name === state.fontFamily)?.originalName || state.fontFamily;
  ui.fontInfo.textContent = `目前字體：${fontLabel} ｜ 上傳字體只保留在本次頁面。`;
}

async function refreshAll() {
  await ensureActiveFontReady(state.fontFamily);
  refreshInspector();
  await refreshStage();
  refreshDataStats();
  refreshMeta();
}

function clampNumber(value, min, max) { return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min)); }
function round(value, digits = 1) { return Number(value).toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1'); }
function fileToDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
function loadImage(src) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; }); }
function resolveFontCss(fontName) { return FONT_OPTIONS.find((font) => font.name === fontName)?.css || `"${fontName}", "Noto Sans TC", sans-serif`; }
function mmToPx(mm, pxPerMm) { return mm * pxPerMm; }

function getRenderContext(overrides = {}) {
  const parsed = parseBatchData(state.batchData);
  const cellsPerPage = Math.max(1, state.cols * state.rows);
  const pages = paginateData(parsed.rows, cellsPerPage);
  return { ...state, ...overrides, parsedRows: parsed.rows, pages: pages.length ? pages : [[]], cellsPerPage };
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

async function renderSingleCellCanvas(scale = 1) {
  const config = getRenderContext();
  const marginX = mmToPx(config.marginMm, PREVIEW_BASE_WIDTH / PAGE_MM.width);
  const marginY = mmToPx(config.marginMm, PREVIEW_BASE_HEIGHT / PAGE_MM.height);
  const gapX = mmToPx(config.cellGapMm || 0, PREVIEW_BASE_WIDTH / PAGE_MM.width);
  const gapY = mmToPx(config.cellGapMm || 0, PREVIEW_BASE_HEIGHT / PAGE_MM.height);
  const safeW = PREVIEW_BASE_WIDTH - marginX * 2;
  const safeH = PREVIEW_BASE_HEIGHT - marginY * 2;
  const cellW = (safeW - gapX * Math.max(0, config.cols - 1)) / config.cols;
  const cellH = (safeH - gapY * Math.max(0, config.rows - 1)) / config.rows;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cellW * scale);
  canvas.height = Math.round(cellH * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, cellW, cellH);
  if (config.image) {
    const img = await loadSharedImage(config.image);
    drawFittedImage(ctx, img, 0, 0, cellW, cellH, config);
  }
  return canvas;
}

async function drawPage(ctx, config, pageIndex, options = {}) {
  const pageWidth = PREVIEW_BASE_WIDTH;
  const pageHeight = PREVIEW_BASE_HEIGHT;
  const marginX = mmToPx(config.marginMm, pageWidth / PAGE_MM.width);
  const marginY = mmToPx(config.marginMm, pageHeight / PAGE_MM.height);
  const gapX = mmToPx(config.cellGapMm || 0, pageWidth / PAGE_MM.width);
  const gapY = mmToPx(config.cellGapMm || 0, pageHeight / PAGE_MM.height);
  const safeZone = { x: marginX, y: marginY, w: pageWidth - marginX * 2, h: pageHeight - marginY * 2 };
  const cellW = (safeZone.w - gapX * Math.max(0, config.cols - 1)) / config.cols;
  const cellH = (safeZone.h - gapY * Math.max(0, config.rows - 1)) / config.rows;
  const rows = config.pages[pageIndex] || [];

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, pageWidth, pageHeight);
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, pageWidth - 2, pageHeight - 2);
  if (config.showSafeZone && (options.showGuideLines ?? config.showGuideLines)) {
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
      const x = safeZone.x + col * (cellW + gapX);
      const y = safeZone.y + row * (cellH + gapY);
      const cellRect = { x, y, w: cellW, h: cellH };
      ctx.strokeRect(x, y, cellW, cellH);
      if (config.image) {
        const img = await loadSharedImage(config.image);
        drawFittedImage(ctx, img, x, y, cellW, cellH, config);
      }
      if (!options.blank) drawCellText(ctx, cellRect, rows[cellIndex] || [], config);
      if (config.showCellNumbers) drawCellNumber(ctx, cellRect, pageIndex * config.cellsPerPage + cellIndex + 1, config);
    }
  }

  if (config.showPageNumbers) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Page ${pageIndex + 1} / ${config.pages.length}`, pageWidth - 20, pageHeight - 18);
  }
}

async function loadSharedImage(src) {
  if (!sharedImageCache.has(src)) sharedImageCache.set(src, loadImage(src));
  return sharedImageCache.get(src);
}

function drawFittedImage(ctx, img, x, y, w, h, config) {
  const scale = (config.imageScale || 100) / 100;
  const offsetX = ((config.imageOffsetX || 0) / 100) * w;
  const offsetY = ((config.imageOffsetY || 0) / 100) * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (config.imageFitMode === 'stretch') {
    const drawW = w * scale;
    const drawH = h * scale;
    const drawX = x + (w - drawW) / 2 + offsetX;
    const drawY = y + (h - drawH) / 2 + offsetY;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } else {
    const baseScale = Math.max(w / img.width, h / img.height);
    const drawW = img.width * baseScale * scale;
    const drawH = img.height * baseScale * scale;
    const drawX = x + (w - drawW) / 2 + offsetX;
    const drawY = y + (h - drawH) / 2 + offsetY;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawCellText(ctx, cellRect, rowData, config) {
  config.textBoxes.forEach((box, index) => {
    const text = rowData[index] ?? '';
    if (!text) return;
    const rect = { x: cellRect.x + (cellRect.w * box.x / 100), y: cellRect.y + (cellRect.h * box.y / 100), w: cellRect.w * box.w / 100, h: cellRect.h * box.h / 100 };
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((box.rotate || 0) * Math.PI / 180);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.beginPath(); ctx.rect(0, 0, rect.w, rect.h); ctx.clip();
    ctx.fillStyle = box.color;
    ctx.font = `${box.fontWeight || 400} ${box.fontSize || 12}px ${resolveFontCss(config.fontFamily)}`;
    ctx.textAlign = box.align || 'left';
    ctx.textBaseline = 'top';
    box.vertical ? drawVerticalText(ctx, text, rect, box) : drawHorizontalText(ctx, text, rect, box);
    ctx.restore();
  });
}

function drawHorizontalText(ctx, text, rect, box) {
  const lines = String(text).split('\n');
  const lineHeightPx = (box.fontSize || 12) * (box.lineHeight || 1.2);
  const totalHeight = lines.length * lineHeightPx;
  let startY = 0;
  if (box.vAlign === 'middle') startY = Math.max(0, (rect.h - totalHeight) / 2);
  if (box.vAlign === 'bottom') startY = Math.max(0, rect.h - totalHeight);
  let drawX = 0; if (box.align === 'center') drawX = rect.w / 2; if (box.align === 'right') drawX = rect.w;
  lines.forEach((line, idx) => {
    const y = startY + idx * lineHeightPx;
    if (!box.letterSpacing) ctx.fillText(line, drawX, y);
    else drawTextWithLetterSpacing(ctx, line, drawX, y, box.align || 'left', box.letterSpacing, rect.w);
  });
}

function drawVerticalText(ctx, text, rect, box) {
  const chars = String(text).split('');
  const step = (box.fontSize || 12) * (box.lineHeight || 1.2);
  const lines = [[]];
  let currentLine = 0;
  let currentHeight = 0;
  chars.forEach((char) => {
    if (char === '\n' || currentHeight + step > rect.h) { currentLine += 1; lines[currentLine] = []; currentHeight = 0; if (char === '\n') return; }
    lines[currentLine].push(char); currentHeight += step + (box.letterSpacing || 0);
  });
  const totalWidth = lines.length * step;
  let startX = rect.w - (box.fontSize || 12);
  if (box.align === 'center') startX = Math.max(0, (rect.w + totalWidth) / 2 - step);
  if (box.align === 'left') startX = Math.min(rect.w - step, totalWidth - step);
  lines.forEach((lineChars, lineIndex) => {
    const usedHeight = lineChars.length * step;
    let y = 0;
    if (box.vAlign === 'middle') y = Math.max(0, (rect.h - usedHeight) / 2);
    if (box.vAlign === 'bottom') y = Math.max(0, rect.h - usedHeight);
    const x = startX - lineIndex * step;
    lineChars.forEach((char) => { ctx.fillText(char, x, y); y += step + (box.letterSpacing || 0); });
  });
}

function drawTextWithLetterSpacing(ctx, text, x, y, align, spacing, width) {
  const chars = String(text).split('');
  const widths = chars.map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + Math.max(0, chars.length - 1) * spacing;
  let cursor = x; if (align === 'center') cursor = (width - total) / 2; if (align === 'right') cursor = width - total;
  chars.forEach((char, index) => { ctx.fillText(char, cursor, y); cursor += widths[index] + spacing; });
}

function formatCellNumber(number, format) {
  if (format === 'hash') return `#${number}`;
  if (format === '001') return String(number).padStart(3, '0');
  if (format === '01') return String(number).padStart(2, '0');
  return String(number);
}

function getCellNumberPosition(cellRect, number, forStage = false, config = state) {
  const pxPerMmX = forStage ? (ui.singleStage.clientWidth / (PAGE_MM.width - config.marginMm * 2) / config.cols) : (PREVIEW_BASE_WIDTH / PAGE_MM.width);
  const pxPerMmY = forStage ? (ui.singleStage.clientHeight / (PAGE_MM.height - config.marginMm * 2) / config.rows) : (PREVIEW_BASE_HEIGHT / PAGE_MM.height);
  const offX = mmToPx(config.cellNumberOffsetX, pxPerMmX);
  const offY = mmToPx(config.cellNumberOffsetY, pxPerMmY);
  const text = formatCellNumber(number, config.cellNumberFormat);
  const approxWidth = text.length * (forStage ? Math.max(7, config.cellNumberFontSize * 0.7) : Math.max(6, config.cellNumberFontSize * 0.62));
  const approxHeight = forStage ? Math.max(18, config.cellNumberFontSize * 1.4) : Math.max(14, config.cellNumberFontSize * 1.2);
  let left = cellRect.x + offX;
  let top = cellRect.y + offY;
  if (config.cellNumberCorner.includes('right')) left = cellRect.x + cellRect.w - offX - approxWidth;
  if (config.cellNumberCorner.includes('bottom')) top = cellRect.y + cellRect.h - offY - approxHeight;
  return { left, top };
}

function drawCellNumber(ctx, cellRect, number, config = state) {
  const label = formatCellNumber(number, config.cellNumberFormat);
  const pos = getCellNumberPosition(cellRect, number, false, config);
  ctx.save();
  ctx.fillStyle = config.cellNumberColor || state.cellNumberColor;
  ctx.font = `${config.cellNumberFontSize || state.cellNumberFontSize}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, pos.left, pos.top);
  ctx.restore();
}

async function exportPdf({ blank }) {
  const { jsPDF } = window.jspdf;
  const config = getRenderContext();
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  setStatus(blank ? '正在產生空白模板 PDF…' : '正在產生 PDF…');
  for (let i = 0; i < config.pages.length; i += 1) {
    const canvas = await renderPageCanvas(i, { scale: 2.48, blank, showGuideLines: state.showGuideLines });
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    if (i > 0) pdf.addPage();
    pdf.addImage(imageData, 'JPEG', 0, 0, PAGE_MM.width, PAGE_MM.height, undefined, 'FAST');
  }
  pdf.save(blank ? 'a4-blank-template.pdf' : 'a4-merge-print.pdf');
  setStatus(blank ? '空白模板 PDF 已匯出。' : 'PDF 已匯出。');
}

function setStatus(message) { if (ui.statusBox) ui.statusBox.textContent = message; }

async function initPreviewPage() {
  Object.assign(state, loadState());
  await restoreCustomFonts();
  const renderAll = async () => {
    ui.previewList.innerHTML = '';
    const config = getRenderContext();
    ui.previewSummary.textContent = `共 ${config.parsedRows.length} 筆資料 ｜ ${config.cols} × ${config.rows} ｜ ${config.pages.length} 頁預覽`;
    for (let i = 0; i < config.pages.length; i += 1) {
      const card = document.createElement('article');
      card.className = 'preview-card';
      card.innerHTML = `<div class="preview-card-head"><h3>第 ${i + 1} 頁</h3><div class="preview-meta">${config.pages[i].length} 格資料</div></div>`;
      const canvas = await renderPageCanvas(i, { scale: state.previewScale / 100 });
      card.appendChild(canvas);
      const button = document.createElement('button');
      button.className = 'mini-btn';
      button.textContent = '放大查看';
      button.addEventListener('click', async () => {
        const zoom = await renderPageCanvas(i, { scale: 1.2 });
        ui.zoomCanvas.width = zoom.width;
        ui.zoomCanvas.height = zoom.height;
        ui.zoomCanvas.getContext('2d').drawImage(zoom, 0, 0);
        ui.zoomDialog.showModal();
      });
      card.appendChild(button);
      ui.previewList.appendChild(card);
    }
  };
  ui.refreshPreviewBtn.addEventListener('click', renderAll);
  ui.dialogCloseBtn.addEventListener('click', () => ui.zoomDialog.close());
  await renderAll();
}

async function init() {
  ensureUiReferences();
  await restoreCustomFonts();
  if (ui.singleStage) bindMainPage();
  else await initPreviewPage();
}

init();
