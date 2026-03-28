const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const stats = document.getElementById('stats');

const options = {
  trimLines: document.getElementById('trimLines'),
  removeEmptyLines: document.getElementById('removeEmptyLines'),
  collapseSpaces: document.getElementById('collapseSpaces'),
  normalizePunctuation: document.getElementById('normalizePunctuation'),
  normalizeQuotes: document.getElementById('normalizeQuotes'),
  removeTrailingSpaces: document.getElementById('removeTrailingSpaces')
};

function cleanText(text) {
  let result = text.replace(/\r\n/g, '\n');

  if (options.normalizeQuotes.checked) {
    result = result
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
  }

  if (options.normalizePunctuation.checked) {
    result = result
      .replace(/，/g, ', ')
      .replace(/。/g, '. ')
      .replace(/！/g, '! ')
      .replace(/？/g, '? ')
      .replace(/：/g, ': ')
      .replace(/；/g, '; ')
      .replace(/、/g, ', ');
  }

  let lines = result.split('\n');

  if (options.trimLines.checked) {
    lines = lines.map(line => line.trim());
  }

  if (options.removeTrailingSpaces.checked) {
    lines = lines.map(line => line.replace(/[ \t]+$/g, ''));
  }

  result = lines.join('\n');

  if (options.collapseSpaces.checked) {
    result = result
      .replace(/[\t ]{2,}/g, ' ')
      .replace(/ ?([,.;:!?])/g, '$1 ')
      .replace(/\s+\n/g, '\n');
  }

  if (options.removeEmptyLines.checked) {
    result = result.replace(/\n{3,}/g, '\n\n');
  }

  result = result
    .replace(/ ([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(\S)/g, '$1 $2')
    .replace(/ +\n/g, '\n')
    .trim();

  return result;
}

function updateStats(before, after) {
  const beforeChars = before.length;
  const afterChars = after.length;
  const beforeLines = before ? before.split('\n').length : 0;
  const afterLines = after ? after.split('\n').length : 0;
  const delta = beforeChars - afterChars;

  stats.textContent = `原文 ${beforeChars} 字 / ${beforeLines} 行 ｜ 結果 ${afterChars} 字 / ${afterLines} 行 ｜ 減少 ${delta >= 0 ? delta : 0} 個字元`;
}

function runClean() {
  const before = inputText.value;
  const after = cleanText(before);
  outputText.value = after;
  updateStats(before, after);
}

document.getElementById('cleanBtn').addEventListener('click', runClean);

document.getElementById('copyBtn').addEventListener('click', async () => {
  if (!outputText.value) runClean();
  if (!outputText.value) return;
  await navigator.clipboard.writeText(outputText.value);
  stats.textContent += ' ｜ 已複製';
});

document.getElementById('swapBtn').addEventListener('click', () => {
  if (!outputText.value) runClean();
  inputText.value = outputText.value;
  runClean();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  inputText.value = '';
  outputText.value = '';
  stats.textContent = '已清空';
});

document.getElementById('pasteDemoBtn').addEventListener('click', () => {
  inputText.value = `這是一段   很亂的文字。\n\n\n  它可能來自逐字稿、AI 回覆，或直接從網頁複製。\n\n標點，。！？  也可能混在一起。\n\n   你的目標，是把它整理成比較乾淨、能繼續貼去 Notion、貼文草稿或文件裡的版本。`;
  runClean();
});

Object.values(options).forEach(option => {
  option.addEventListener('change', runClean);
});

inputText.addEventListener('input', runClean);