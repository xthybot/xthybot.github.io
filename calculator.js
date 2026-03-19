const display = document.getElementById('display');
const history = document.getElementById('history');
let current = '0';
let expression = '';
let justEvaluated = false;

function render() {
  display.textContent = current === '' ? '0' : current;
  history.textContent = expression;
}

function appendValue(value) {
  if (justEvaluated && /[0-9.]/.test(value)) {
    current = '0';
    expression = '';
    justEvaluated = false;
  }
  if (value === '.' && current.includes('.')) return;
  current = current === '0' && value !== '.' ? value : current + value;
  render();
}

function setOperator(op) {
  if (current === '' && expression === '') return;
  if (justEvaluated) justEvaluated = false;
  if (current !== '') {
    expression += current + ' ' + op + ' ';
    current = '';
  } else {
    expression = expression.replace(/[+\-*/]\s$/, op + ' ');
  }
  render();
}

function clearAll() {
  current = '0';
  expression = '';
  justEvaluated = false;
  render();
}

function deleteOne() {
  if (justEvaluated) return clearAll();
  current = current.length <= 1 ? '0' : current.slice(0, -1);
  render();
}

function toggleSign() {
  if (current === '0' || current === '') return;
  current = current.startsWith('-') ? current.slice(1) : '-' + current;
  render();
}

function percent() {
  const n = parseFloat(current || '0');
  current = String(n / 100);
  render();
}

function evaluateExpr() {
  const full = (expression + current).trim();
  if (!full) return;
  try {
    const safe = full.replace(/[^0-9+\-*/.() ]/g, '');
    const result = Function('return (' + safe + ')')();
    history.textContent = full + ' =';
    current = String(Number.isFinite(result) ? result : 'Error');
    expression = '';
    justEvaluated = true;
    render();
  } catch {
    current = 'Error';
    expression = '';
    justEvaluated = true;
    render();
  }
}

document.querySelectorAll('.key').forEach(btn => {
  btn.addEventListener('click', () => {
    const value = btn.dataset.value;
    const action = btn.dataset.action;
    if (value !== undefined) {
      if ('+-*/'.includes(value)) setOperator(value);
      else appendValue(value);
    }
    if (action === 'clear') clearAll();
    if (action === 'delete') deleteOne();
    if (action === 'toggle-sign') toggleSign();
    if (action === 'percent') percent();
    if (action === 'equals') evaluateExpr();
  });
});

window.addEventListener('keydown', (e) => {
  if (/^[0-9.]$/.test(e.key)) appendValue(e.key);
  if ('+-*/'.includes(e.key)) setOperator(e.key);
  if (e.key === 'Enter' || e.key === '=') evaluateExpr();
  if (e.key === 'Backspace') deleteOne();
  if (e.key === 'Escape') clearAll();
});

render();
