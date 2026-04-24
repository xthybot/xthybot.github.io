const FALLBACK_PRESETS = [
  {
    id: 'a3-print-300dpi',
    name: 'A3',
    physical: {
      width: { value: 297, unit: 'mm' },
      height: { value: 420, unit: 'mm' }
    },
    resolution: { value: 300, unit: 'DPI' },
    ratio: '1:1.41421356237'
  },
  {
    id: 'a4-print-300dpi',
    name: 'A4',
    physical: {
      width: { value: 210, unit: 'mm' },
      height: { value: 297, unit: 'mm' }
    },
    resolution: { value: 300, unit: 'DPI' },
    ratio: '1:1.41421356237'
  },
  {
    id: 'photo-4x6',
    name: '照片 4x6',
    physical: {
      width: { value: 4, unit: 'inch' },
      height: { value: 6, unit: 'inch' }
    },
    resolution: { value: 300, unit: 'DPI' },
    ratio: '2:3'
  },
  {
    id: 'photo-5x7',
    name: '照片 5x7',
    physical: {
      width: { value: 5, unit: 'inch' },
      height: { value: 7, unit: 'inch' }
    },
    resolution: { value: 300, unit: 'DPI' },
    ratio: '5:7'
  }
];

const state = {
  presets: [],
  lastPresetSource: 'fallback',
  outputUnits: {
    physicalWidth: null,
    physicalHeight: null,
    resolution: null
  }
};

const dom = {};

function init() {
  bindDom();
  bindEvents();
  loadPresets().then(recalculate);
}

function bindDom() {
  dom.presetSearch = document.getElementById('presetSearch');
  dom.presetOptions = document.getElementById('presetOptions');

  dom.inputPhysicalWidth = document.getElementById('inputPhysicalWidth');
  dom.inputPhysicalWidthUnit = document.getElementById('inputPhysicalWidthUnit');
  dom.inputPhysicalHeight = document.getElementById('inputPhysicalHeight');
  dom.inputPhysicalHeightUnit = document.getElementById('inputPhysicalHeightUnit');
  dom.inputPixelWidth = document.getElementById('inputPixelWidth');
  dom.inputPixelHeight = document.getElementById('inputPixelHeight');
  dom.resolutionValue = document.getElementById('resolutionValue');
  dom.resolutionUnit = document.getElementById('resolutionUnit');
  dom.ratioWidthValue = document.getElementById('ratioWidthValue');
  dom.ratioHeightValue = document.getElementById('ratioHeightValue');
  dom.ratioPreset = document.getElementById('ratioPreset');
  dom.swapRatioBtn = document.getElementById('swapRatioBtn');

  dom.outputPhysicalWidth = document.getElementById('outputPhysicalWidth');
  dom.outputPhysicalWidthUnit = document.getElementById('outputPhysicalWidthUnit');
  dom.outputPhysicalHeight = document.getElementById('outputPhysicalHeight');
  dom.outputPhysicalHeightUnit = document.getElementById('outputPhysicalHeightUnit');
  dom.outputPixelWidth = document.getElementById('outputPixelWidth');
  dom.outputPixelHeight = document.getElementById('outputPixelHeight');
  dom.outputResolutionValue = document.getElementById('outputResolutionValue');
  dom.outputResolutionUnit = document.getElementById('outputResolutionUnit');
  dom.outputRatioWidth = document.getElementById('outputRatioWidth');
  dom.outputRatioHeight = document.getElementById('outputRatioHeight');

  dom.logicSummary = document.getElementById('logicSummary');
  dom.swapBtn = document.getElementById('swapBtn');
  dom.copyResultBtn = document.getElementById('copyResultBtn');
  dom.resetBtn = document.getElementById('resetBtn');
  dom.resolutionShortcuts = document.getElementById('resolutionShortcuts');
}

function bindEvents() {
  [
    dom.inputPhysicalWidth,
    dom.inputPhysicalHeight,
    dom.inputPixelWidth,
    dom.inputPixelHeight,
    dom.resolutionValue,
    dom.inputPhysicalWidthUnit,
    dom.inputPhysicalHeightUnit,
    dom.resolutionUnit,
    dom.ratioWidthValue,
    dom.ratioHeightValue
  ].forEach((element) => {
    element.addEventListener('input', recalculate);
    element.addEventListener('change', recalculate);
  });

  dom.ratioPreset.addEventListener('change', () => {
    if (dom.ratioPreset.value) {
      const parsed = parseRatio(dom.ratioPreset.value);
      if (parsed) {
        dom.ratioWidthValue.value = formatNumber(parsed.width, 4);
        dom.ratioHeightValue.value = formatNumber(parsed.height, 4);
      }
    }
    recalculate();
  });

  dom.presetSearch.addEventListener('input', handlePresetTyping);
  dom.presetSearch.addEventListener('change', applyPresetFromInput);

  dom.resolutionShortcuts.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-resolution]');
    if (!button) return;
    dom.resolutionValue.value = button.dataset.resolution;
    recalculate();
  });

  dom.swapBtn.addEventListener('click', swapDimensions);
  dom.swapRatioBtn.addEventListener('click', swapRatioOnly);
  dom.copyResultBtn.addEventListener('click', copyResultToInput);
  dom.resetBtn.addEventListener('click', resetAll);

  dom.outputPhysicalWidthUnit.addEventListener('change', () => {
    state.outputUnits.physicalWidth = dom.outputPhysicalWidthUnit.value;
    recalculate();
  });
  dom.outputPhysicalHeightUnit.addEventListener('change', () => {
    state.outputUnits.physicalHeight = dom.outputPhysicalHeightUnit.value;
    recalculate();
  });
  dom.outputResolutionUnit.addEventListener('change', () => {
    state.outputUnits.resolution = dom.outputResolutionUnit.value;
    dom.resolutionUnit.value = dom.outputResolutionUnit.value;
    recalculate();
  });
}

async function loadPresets() {
  try {
    const response = await fetch('./presets.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.presets = Array.isArray(data) ? normalizePresets(data) : FALLBACK_PRESETS;
    state.lastPresetSource = 'json';
  } catch (error) {
    state.presets = FALLBACK_PRESETS;
    state.lastPresetSource = 'fallback';
  }

  renderPresetOptions();
}

function normalizePresets(data) {
  return data.map((preset) => {
    if (preset.physical) return preset;
    return {
      id: preset.id,
      name: preset.name,
      physical: {
        width: preset.width,
        height: preset.height
      },
      resolution: preset.resolution,
      ratio: preset.ratio
    };
  });
}

function renderPresetOptions() {
  dom.presetOptions.innerHTML = '';
  state.presets.forEach((preset) => {
    const option = document.createElement('option');
    option.value = preset.name;
    dom.presetOptions.appendChild(option);
  });
}

function handlePresetTyping() {
  const preset = findPresetByName(dom.presetSearch.value);
  if (preset) applyPreset(preset);
}

function applyPresetFromInput() {
  const preset = findPresetByName(dom.presetSearch.value);
  if (preset) applyPreset(preset);
}

function findPresetByName(name) {
  const keyword = String(name || '').trim().toLowerCase();
  if (!keyword) return null;
  return state.presets.find((preset) => preset.name.toLowerCase() === keyword) || null;
}

function applyPreset(preset) {
  dom.inputPhysicalWidth.value = preset.physical?.width?.value ?? '';
  dom.inputPhysicalWidthUnit.value = preset.physical?.width?.unit ?? 'mm';
  dom.inputPhysicalHeight.value = preset.physical?.height?.value ?? '';
  dom.inputPhysicalHeightUnit.value = preset.physical?.height?.unit ?? 'mm';
  dom.inputPixelWidth.value = preset.pixel?.width?.value ?? '';
  dom.inputPixelHeight.value = preset.pixel?.height?.value ?? '';
  dom.resolutionValue.value = preset.resolution?.value ?? '';
  dom.resolutionUnit.value = preset.resolution?.unit ?? 'DPI';
  state.outputUnits.physicalWidth = preset.physical?.width?.unit ?? dom.inputPhysicalWidthUnit.value;
  state.outputUnits.physicalHeight = preset.physical?.height?.unit ?? dom.inputPhysicalHeightUnit.value;
  state.outputUnits.resolution = preset.resolution?.unit ?? dom.resolutionUnit.value;
  if (preset.ratio) {
    const parsedRatio = parseRatio(preset.ratio);
    dom.ratioWidthValue.value = parsedRatio ? formatNumber(parsedRatio.width, 4) : '';
    dom.ratioHeightValue.value = parsedRatio ? formatNumber(parsedRatio.height, 4) : '';
  } else {
    dom.ratioWidthValue.value = '';
    dom.ratioHeightValue.value = '';
  }
  dom.ratioPreset.value = [...dom.ratioPreset.options].some((option) => option.value === preset.ratio) ? preset.ratio : '';
  recalculate();
}

function resetAll() {
  dom.presetSearch.value = '';
  dom.inputPhysicalWidth.value = '';
  dom.inputPhysicalWidthUnit.value = 'mm';
  dom.inputPhysicalHeight.value = '';
  dom.inputPhysicalHeightUnit.value = 'mm';
  dom.inputPixelWidth.value = '';
  dom.inputPixelHeight.value = '';
  dom.resolutionValue.value = '';
  dom.resolutionUnit.value = 'DPI';
  state.outputUnits.physicalWidth = null;
  state.outputUnits.physicalHeight = null;
  state.outputUnits.resolution = null;
  dom.ratioWidthValue.value = '';
  dom.ratioHeightValue.value = '';
  dom.ratioPreset.value = '';
  recalculate();
}

function swapDimensions() {
  swapFieldValues(dom.inputPhysicalWidth, dom.inputPhysicalHeight);
  swapSelectValues(dom.inputPhysicalWidthUnit, dom.inputPhysicalHeightUnit);
  swapFieldValues(dom.inputPixelWidth, dom.inputPixelHeight);
  recalculate();
}

function swapRatioOnly() {
  swapFieldValues(dom.ratioWidthValue, dom.ratioHeightValue);

  const swappedPreset = swapRatioPresetValue(dom.ratioPreset.value);
  dom.ratioPreset.value = swappedPreset;

  recalculate();
}

function swapFieldValues(a, b) {
  const temp = a.value;
  a.value = b.value;
  b.value = temp;
}

function swapSelectValues(a, b) {
  const temp = a.value;
  a.value = b.value;
  b.value = temp;
}

function copyResultToInput() {
  const result = calculateOutput(getInputState());

  const outputPrefs = getOutputUnitPrefs(result);
  const widthForInput = convertPhysicalField(result.physical.width, outputPrefs.physicalWidth);
  const heightForInput = convertPhysicalField(result.physical.height, outputPrefs.physicalHeight);

  if (widthForInput.value != null) dom.inputPhysicalWidth.value = formatNumber(widthForInput.value, 4);
  if (widthForInput.unit) dom.inputPhysicalWidthUnit.value = widthForInput.unit;
  if (heightForInput.value != null) dom.inputPhysicalHeight.value = formatNumber(heightForInput.value, 4);
  if (heightForInput.unit) dom.inputPhysicalHeightUnit.value = heightForInput.unit;
  if (result.pixel.width.value != null) dom.inputPixelWidth.value = formatNumber(result.pixel.width.value, 0);
  if (result.pixel.height.value != null) dom.inputPixelHeight.value = formatNumber(result.pixel.height.value, 0);
  if (result.resolution.value != null) dom.resolutionValue.value = formatNumber(result.resolution.value, 4);
  if (outputPrefs.resolution) dom.resolutionUnit.value = outputPrefs.resolution;
  if (result.ratio.parsed) {
    const scaledRatio = scaleRatioDisplay(result.ratio.parsed, result.ratio.inputWidth, result.ratio.inputHeight);
    dom.ratioWidthValue.value = formatNumber(scaledRatio.width, 4);
    dom.ratioHeightValue.value = formatNumber(scaledRatio.height, 4);
  }
  if ([...dom.ratioPreset.options].some((option) => option.value === (result.ratio.raw || result.ratio.display))) {
    dom.ratioPreset.value = result.ratio.raw || result.ratio.display;
  }

  recalculate();
}

function getInputState() {
  const ratioWidthInput = parsePositiveNumberAllowZeroBlank(dom.ratioWidthValue.value);
  const ratioHeightInput = parsePositiveNumberAllowZeroBlank(dom.ratioHeightValue.value);
  const ratioParsed = parseRatioParts(dom.ratioWidthValue.value, dom.ratioHeightValue.value);

  return {
    physical: {
      width: {
        value: parsePositiveNumber(dom.inputPhysicalWidth.value),
        unit: dom.inputPhysicalWidthUnit.value,
        source: hasValue(dom.inputPhysicalWidth.value) ? 'input' : null
      },
      height: {
        value: parsePositiveNumber(dom.inputPhysicalHeight.value),
        unit: dom.inputPhysicalHeightUnit.value,
        source: hasValue(dom.inputPhysicalHeight.value) ? 'input' : null
      }
    },
    pixel: {
      width: {
        value: parsePositiveNumber(dom.inputPixelWidth.value),
        unit: 'px',
        source: hasValue(dom.inputPixelWidth.value) ? 'input' : null
      },
      height: {
        value: parsePositiveNumber(dom.inputPixelHeight.value),
        unit: 'px',
        source: hasValue(dom.inputPixelHeight.value) ? 'input' : null
      }
    },
    resolution: {
      value: parsePositiveNumber(dom.resolutionValue.value),
      unit: dom.resolutionUnit.value,
      source: hasValue(dom.resolutionValue.value) ? 'input' : null
    },
    ratio: {
      raw: buildRatioRaw(dom.ratioWidthValue.value, dom.ratioHeightValue.value),
      parsed: ratioParsed,
      source: ratioParsed ? 'input' : null,
      inputWidth: ratioWidthInput,
      inputHeight: ratioHeightInput,
      hasPartialInput: ratioWidthInput != null || ratioHeightInput != null
    }
  };
}

function recalculate() {
  const input = getInputState();
  const result = calculateOutput(input);
  renderOutput(result);
  renderSummaries(input, result);
}

function calculateOutput(input) {
  const result = {
    physical: {
      width: { ...input.physical.width },
      height: { ...input.physical.height }
    },
    pixel: {
      width: { ...input.pixel.width },
      height: { ...input.pixel.height }
    },
    resolution: { ...input.resolution },
    ratio: {
      raw: input.ratio.raw,
      display: input.ratio.raw || '',
      parsed: input.ratio.parsed,
      source: input.ratio.source,
      inputWidth: input.ratio.inputWidth,
      inputHeight: input.ratio.inputHeight,
      displayWidth: null,
      displayHeight: null
    },
    meta: {
      steps: [],
      errors: []
    }
  };

  result.meta.errors = validateConsistency(result);
  if (result.meta.errors.length) {
    if (result.ratio.parsed) {
      result.ratio.display = formatRatioDisplay(result.ratio.parsed.width, result.ratio.parsed.height);
    }
    return result;
  }

  hydrateRatio(result);
  applyRatioCompletion(result);
  applyResolutionBackfill(result);
  hydrateRatio(result);
  hydrateRatioDisplayPair(result);

  return result;
}

function hydrateRatio(result) {
  if (!result.ratio.parsed) {
    const physicalRatio = deriveRatioFromPair(result.physical.width, result.physical.height);
    const pixelRatio = deriveRatioFromPair(result.pixel.width, result.pixel.height);
    const picked = physicalRatio || pixelRatio;
    if (picked) {
      result.ratio.parsed = picked;
      result.ratio.raw = `${trimTrailingZeros(picked.width)}:${trimTrailingZeros(picked.height)}`;
      result.ratio.display = simplifyRatioDisplay(picked.width, picked.height);
      result.ratio.source = 'computed';
      result.meta.steps.push('已用現有寬高反推長寬比。');
      return;
    }
  }

  if (result.ratio.parsed) {
    result.ratio.display = formatRatioDisplay(result.ratio.parsed.width, result.ratio.parsed.height);
  }
}

function deriveRatioFromPair(widthField, heightField) {
  if (widthField.value == null || heightField.value == null || !widthField.unit || !heightField.unit) return null;
  if (widthField.unit !== heightField.unit) return null;
  return { width: widthField.value, height: heightField.value };
}

function validateConsistency(result) {
  const errors = [];
  const physicalRatio = deriveRatioFromPair(result.physical.width, result.physical.height);
  const pixelRatio = deriveRatioFromPair(result.pixel.width, result.pixel.height);
  const manualRatio = result.ratio.parsed;

  if (manualRatio && physicalRatio && !ratioMatches(manualRatio, physicalRatio)) {
    errors.push('長寬比與實體尺寸不符。');
  }

  if (manualRatio && pixelRatio && !ratioMatches(manualRatio, pixelRatio)) {
    errors.push('長寬比與像素尺寸不符。');
  }

  if (physicalRatio && pixelRatio && !ratioMatches(physicalRatio, pixelRatio)) {
    errors.push('像素尺寸與實體尺寸的長寬比不符。');
  }

  if (result.resolution.value != null) {
    const inferredResolution = deriveResolution(result);
    if (inferredResolution != null && !nearlyEqual(inferredResolution, result.resolution.value, 0.01)) {
      errors.push('解析度與像素尺寸 / 實體尺寸不符。');
    }
  }

  return errors;
}

function applyRatioCompletion(result) {
  if (!result.ratio.parsed) return;
  const r = result.ratio.parsed;

  completeSideFromRatio(result.physical.width, result.physical.height, r, 'width');
  completeSideFromRatio(result.physical.width, result.physical.height, r, 'height');
  completeSideFromRatio(result.pixel.width, result.pixel.height, r, 'width');
  completeSideFromRatio(result.pixel.width, result.pixel.height, r, 'height');
}

function completeSideFromRatio(widthField, heightField, ratio, target) {
  if (target === 'width' && widthField.value == null && heightField.value != null) {
    widthField.value = heightField.value * (ratio.width / ratio.height);
    widthField.unit = heightField.unit;
    widthField.source = 'computed';
  }
  if (target === 'height' && heightField.value == null && widthField.value != null) {
    heightField.value = widthField.value * (ratio.height / ratio.width);
    heightField.unit = widthField.unit;
    heightField.source = 'computed';
  }
}

function applyResolutionBackfill(result) {
  const resolution = result.resolution.value;

  if (resolution == null) {
    const guessed = deriveResolution(result);
    if (guessed != null) {
      result.resolution.value = guessed;
      result.resolution.source = 'computed';
      result.resolution.unit = result.resolution.unit || 'DPI';
      result.meta.steps.push('已用像素尺寸 + 實體尺寸反推解析度。');
    }
  }

  if (result.resolution.value == null) return;

  const physicalReady = result.physical.width.value != null && result.physical.height.value != null;
  const pixelReady = result.pixel.width.value != null && result.pixel.height.value != null;

  if (physicalReady) {
    completePixelsFromPhysical(result, result.resolution.value);
  }

  if (pixelReady) {
    completePhysicalFromPixels(result, result.resolution.value);
  }
}

function deriveResolution(result) {
  const candidates = [];

  pushResolutionCandidate(candidates, result.pixel.width, result.physical.width);
  pushResolutionCandidate(candidates, result.pixel.height, result.physical.height);

  if (!candidates.length) return null;
  return candidates[0];
}

function pushResolutionCandidate(candidates, pixelField, physicalField) {
  if (pixelField.value == null || physicalField.value == null) return;
  const inches = toInches(physicalField.value, physicalField.unit);
  if (!Number.isFinite(inches) || inches <= 0) return;
  candidates.push(pixelField.value / inches);
}

function completePixelsFromPhysical(result, resolution) {
  if (result.pixel.width.source !== 'input' && result.physical.width.value != null) {
    result.pixel.width.value = toInches(result.physical.width.value, result.physical.width.unit) * resolution;
    result.pixel.width.unit = 'px';
    result.pixel.width.source = 'computed';
  }
  if (result.pixel.height.source !== 'input' && result.physical.height.value != null) {
    result.pixel.height.value = toInches(result.physical.height.value, result.physical.height.unit) * resolution;
    result.pixel.height.unit = 'px';
    result.pixel.height.source = 'computed';
  }
  result.meta.steps.push('已用實體尺寸 + 解析度補算像素尺寸。');
}

function completePhysicalFromPixels(result, resolution) {
  if (result.physical.width.source !== 'input' && result.pixel.width.value != null) {
    const unit = result.physical.width.unit || 'mm';
    result.physical.width.value = fromInches(result.pixel.width.value / resolution, unit);
    result.physical.width.unit = unit;
    result.physical.width.source = 'computed';
  }
  if (result.physical.height.source !== 'input' && result.pixel.height.value != null) {
    const unit = result.physical.height.unit || 'mm';
    result.physical.height.value = fromInches(result.pixel.height.value / resolution, unit);
    result.physical.height.unit = unit;
    result.physical.height.source = 'computed';
  }
  result.meta.steps.push('已用像素尺寸 + 解析度補算實體尺寸。');
}

function renderOutput(result) {
  const hideAllOutput = (result.meta.errors || []).length > 0;
  const outputPrefs = getOutputUnitPrefs(result);
  const displayPhysicalWidth = convertPhysicalField(result.physical.width, outputPrefs.physicalWidth);
  const displayPhysicalHeight = convertPhysicalField(result.physical.height, outputPrefs.physicalHeight);

  dom.outputPhysicalWidthUnit.value = outputPrefs.physicalWidth;
  dom.outputPhysicalHeightUnit.value = outputPrefs.physicalHeight;
  dom.outputResolutionUnit.value = outputPrefs.resolution;

  if (hideAllOutput) {
    syncResultSelectState(dom.outputPhysicalWidthUnit, null, false);
    syncResultSelectState(dom.outputPhysicalHeightUnit, null, false);
    syncResultSelectState(dom.outputResolutionUnit, null, false);

    setResultBox(dom.outputPhysicalWidth, null, null, 4);
    setResultBox(dom.outputPhysicalHeight, null, null, 4);
    setResultBox(dom.outputPixelWidth, null, null, 0);
    setResultBox(dom.outputPixelHeight, null, null, 0);
    setResultBox(dom.outputResolutionValue, null, null, 4);
    setResultBox(dom.outputRatioWidth, null, null, 4);
    setResultBox(dom.outputRatioHeight, null, null, 4);
    return;
  }

  syncResultSelectState(dom.outputPhysicalWidthUnit, result.physical.width.source, Boolean(displayPhysicalWidth.unit));
  syncResultSelectState(dom.outputPhysicalHeightUnit, result.physical.height.source, Boolean(displayPhysicalHeight.unit));
  syncResultSelectState(dom.outputResolutionUnit, result.resolution.source, Boolean(outputPrefs.resolution));

  setResultBox(dom.outputPhysicalWidth, displayPhysicalWidth.value, result.physical.width.source, 4);
  setResultBox(dom.outputPhysicalHeight, displayPhysicalHeight.value, result.physical.height.source, 4);
  setResultBox(dom.outputPixelWidth, result.pixel.width.value, result.pixel.width.source, 0);
  setResultBox(dom.outputPixelHeight, result.pixel.height.value, result.pixel.height.source, 0);
  setResultBox(dom.outputResolutionValue, result.resolution.value, result.resolution.source, 4);
  setResultBox(dom.outputRatioWidth, result.ratio.displayWidth, result.ratio.source, 4, true);
  setResultBox(dom.outputRatioHeight, result.ratio.displayHeight, result.ratio.source, 4, true);
}

function renderSummaries(input, result) {
  const uniqueErrors = [...new Set(result.meta.errors || [])];
  const uniqueSteps = [...new Set(result.meta.steps)];

  dom.logicSummary.classList.toggle('is-error', uniqueErrors.length > 0);

  if (uniqueErrors.length) {
    dom.logicSummary.textContent = uniqueErrors.join('\n');
    return;
  }

  if (!uniqueSteps.length) {
    if (!hasAnyInput(input)) {
      dom.logicSummary.textContent = '等待輸入條件。';
    } else {
      dom.logicSummary.textContent = '目前資料仍不足，無法安全補算更多欄位。';
    }
  } else {
    dom.logicSummary.textContent = uniqueSteps.join('\n');
  }
}

function formatPair(widthField, heightField, fallbackUnit = '') {
  const width = widthField.value != null ? formatNumber(widthField.value, fallbackUnit === 'px' ? 0 : 4) : '—';
  const height = heightField.value != null ? formatNumber(heightField.value, fallbackUnit === 'px' ? 0 : 4) : '—';
  const widthUnit = widthField.unit || fallbackUnit;
  const heightUnit = heightField.unit || fallbackUnit;
  return `${width}${widthUnit ? ' ' + widthUnit : ''} × ${height}${heightUnit ? ' ' + heightUnit : ''}`;
}

function setResultBox(element, value, source, decimals = null, rawText = false) {
  const hasContent = value !== null && value !== undefined && String(value).trim() !== '';
  element.textContent = hasContent ? (rawText ? String(value) : formatNumber(value, decimals)) : '';
  element.classList.remove('has-value', 'from-input', 'from-computed');
  if (!hasContent) return;
  element.classList.add('has-value');
  if (source === 'input') element.classList.add('from-input');
  if (source === 'computed') element.classList.add('from-computed');
}

function syncResultSelectState(element, source, hasContent) {
  element.classList.remove('has-value', 'from-input', 'from-computed');
  if (!hasContent) return;
  element.classList.add('has-value');
  if (source === 'input') element.classList.add('from-input');
  if (source === 'computed') element.classList.add('from-computed');
}

function hasAnyInput(input) {
  return [
    input.physical.width.source,
    input.physical.height.source,
    input.pixel.width.source,
    input.pixel.height.source,
    input.resolution.source,
    input.ratio.source
  ].some(Boolean);
}

function parsePositiveNumber(value) {
  if (!hasValue(value)) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return number;
}

function parsePositiveNumberAllowZeroBlank(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) return null;
  return number;
}

function hasValue(value) {
  const raw = String(value ?? '').trim();
  if (raw === '') return false;
  const number = Number(raw);
  if (Number.isFinite(number) && number === 0) return false;
  return true;
}

function ratioMatches(a, b) {
  return nearlyEqual(a.width / a.height, b.width / b.height, 0.01);
}

function nearlyEqual(a, b, tolerance = 0.01) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const baseline = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) / baseline <= tolerance;
}

function parseRatio(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) return null;

  const normalized = raw.replace(/：/g, ':').replace(/\s+/g, '').replace(/√2/g, String(Math.SQRT2));
  const parts = normalized.split(':');
  if (parts.length !== 2) return null;

  return parseRatioParts(parts[0], parts[1]);
}

function parseRatioParts(widthValue, heightValue) {
  const width = Number(String(widthValue || '').trim().replace(/√2/g, String(Math.SQRT2)));
  const height = Number(String(heightValue || '').trim().replace(/√2/g, String(Math.SQRT2)));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function buildRatioRaw(widthValue, heightValue) {
  const hasWidth = parsePositiveNumberAllowZeroBlank(widthValue) != null;
  const hasHeight = parsePositiveNumberAllowZeroBlank(heightValue) != null;
  if (!hasWidth && !hasHeight) return '';

  const widthText = hasWidth ? formatRatioPart(parsePositiveNumberAllowZeroBlank(widthValue)) : '';
  const heightText = hasHeight ? formatRatioPart(parsePositiveNumberAllowZeroBlank(heightValue)) : '';
  return `${widthText}:${heightText}`;
}

function toInches(value, unit) {
  switch (unit) {
    case 'inch': return value;
    case 'cm': return value / 2.54;
    case 'mm': return value / 25.4;
    default: return value / 25.4;
  }
}

function fromInches(value, unit) {
  switch (unit) {
    case 'inch': return value;
    case 'cm': return value * 2.54;
    case 'mm': return value * 25.4;
    default: return value * 25.4;
  }
}

function formatNumber(value, decimals = 4) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  return trimTrailingZeros(Number(value).toFixed(decimals == null ? 4 : decimals));
}

function trimTrailingZeros(value) {
  return String(value)
    .replace(/(\.\d*?[1-9])0+$/u, '$1')
    .replace(/\.0+$/u, '')
    .replace(/^-0$/u, '0');
}

function simplifyRatioDisplay(width, height) {
  const ratio = width / height;
  const commonRatios = [
    { label: '1:1', value: 1 },
    { label: '3:2', value: 3 / 2 },
    { label: '4:3', value: 4 / 3 },
    { label: '5:4', value: 5 / 4 },
    { label: '16:9', value: 16 / 9 },
    { label: '2:3', value: 2 / 3 },
    { label: '1:√2', value: 1 / Math.SQRT2 },
    { label: '√2:1', value: Math.SQRT2 }
  ];
  const matched = commonRatios.find((item) => Math.abs(item.value - ratio) < 0.01);
  return matched ? matched.label : formatRatioDisplay(width, height);
}

function formatRatioDisplay(width, height) {
  return `${formatRatioPart(width)}:${formatRatioPart(height)}`;
}

function formatRatioPart(value) {
  if (Math.abs(value - Math.SQRT2) < 0.01) return '√2';
  if (Math.abs(value - 1 / Math.SQRT2) < 0.01) return `1/√2`;
  return trimTrailingZeros(value);
}

function getOutputUnitPrefs(result) {
  return {
    physicalWidth: state.outputUnits.physicalWidth || result.physical.width.unit || dom.inputPhysicalWidthUnit.value || 'mm',
    physicalHeight: state.outputUnits.physicalHeight || result.physical.height.unit || dom.inputPhysicalHeightUnit.value || 'mm',
    resolution: state.outputUnits.resolution || result.resolution.unit || dom.resolutionUnit.value || 'DPI'
  };
}

function convertPhysicalField(field, targetUnit) {
  if (field.value == null) return { value: null, unit: targetUnit || field.unit || 'mm' };
  const inches = toInches(field.value, field.unit || 'mm');
  return {
    value: fromInches(inches, targetUnit || field.unit || 'mm'),
    unit: targetUnit || field.unit || 'mm'
  };
}

function hydrateRatioDisplayPair(result) {
  if (!result.ratio.parsed) {
    result.ratio.displayWidth = '';
    result.ratio.displayHeight = '';
    return;
  }

  const scaled = scaleRatioDisplay(result.ratio.parsed, result.ratio.inputWidth, result.ratio.inputHeight);
  result.ratio.displayWidth = formatRatioPart(scaled.width);
  result.ratio.displayHeight = formatRatioPart(scaled.height);
}

function scaleRatioDisplay(baseRatio, inputWidth, inputHeight) {
  if (inputWidth != null && inputHeight == null) {
    return {
      width: inputWidth,
      height: inputWidth * (baseRatio.height / baseRatio.width)
    };
  }

  if (inputHeight != null && inputWidth == null) {
    return {
      width: inputHeight * (baseRatio.width / baseRatio.height),
      height: inputHeight
    };
  }

  return {
    width: baseRatio.width,
    height: baseRatio.height
  };
}

function swapRatioPresetValue(value) {
  const parsed = parseRatio(value);
  if (!parsed) return value;
  const swapped = `${formatRatioPart(parsed.height)}:${formatRatioPart(parsed.width)}`;
  return [...dom.ratioPreset.options].some((option) => option.value === swapped) ? swapped : '';
}

document.addEventListener('DOMContentLoaded', init);
