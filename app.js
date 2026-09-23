import { calculatePosition } from './calc.mjs';

const $ = id => document.getElementById(id);
const fields = ['capital', 'entry', 'stop', 'risk', 'leverage'];
const storageKey = 'position-calculator-inputs-v3';
const defaults = { capital: '100', entry: '', stop: '', risk: '5', leverage: '10' };
let currentResult = null;

function format(value, maximumFractionDigits = 2) {
  if (value > 0 && value < 10 ** -maximumFractionDigits) return `< ${new Intl.NumberFormat('zh-CN', { minimumFractionDigits: maximumFractionDigits }).format(10 ** -maximumFractionDigits)}`;
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits, minimumFractionDigits: 0 }).format(value);
}

function readInput() {
  const numeric = Object.fromEntries(fields.map(id => [id, Number($(id).value)]));
  return { capital: numeric.capital, entry: numeric.entry, stop: numeric.stop, riskPercent: numeric.risk, leverage: numeric.leverage };
}

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(fields.map(id => [id, $(id).value])))); } catch {}
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    for (const id of fields) if (typeof saved[id] === 'string') $(id).value = saved[id];
  } catch {}
}

function setDirectionLabel(direction) {
  const label = $('direction-label');
  label.textContent = direction === 'long' ? '↗ 做多' : direction === 'short' ? '↘ 做空' : '待判定';
  label.classList.toggle('long', direction === 'long');
  label.classList.toggle('short', direction === 'short');
}

function clearResults() {
  for (const id of ['margin', 'quantity', 'notional', 'distance', 'usage-percent']) $(id).textContent = '—';
  $('usage-fill').style.width = '0%';
  $('usage-text').textContent = '填写价格后显示资金占用。';
  $('copy').disabled = true;
  currentResult = null;
}

function render() {
  save();
  const capital = Number($('capital').value);
  const risk = Number($('risk').value);
  $('stop-amount').textContent = $('capital').value.trim() !== '' && $('risk').value.trim() !== '' && Number.isFinite(capital) && capital > 0 && Number.isFinite(risk) && risk > 0 && risk <= 100
    ? format(capital * risk / 100, 4) : '—';
  if ($('entry').value.trim() === '' || $('stop').value.trim() === '') {
    $('error').hidden = true;
    $('warning').hidden = true;
    $('status-chip').textContent = '等待价格';
    $('status-chip').classList.remove('invalid', 'ready');
    setDirectionLabel(null);
    clearResults();
    return;
  }
  const raw = readInput();
  const result = calculatePosition(raw);
  $('error').hidden = !result.error;
  $('error').textContent = result.error || '';
  $('warning').hidden = true;
  $('status-chip').textContent = result.error ? '待检查' : '已计算';
  $('status-chip').classList.toggle('invalid', Boolean(result.error));
  $('status-chip').classList.toggle('ready', !result.error);
  if (result.error) { setDirectionLabel(null); clearResults(); return; }
  setDirectionLabel(result.direction);
  currentResult = { input: raw, result };
  $('margin').textContent = format(result.margin, 4);
  $('stop-amount').textContent = format(result.stopAmount, 4);
  $('quantity').textContent = format(result.quantity, 8);
  $('notional').textContent = format(result.notional, 4);
  $('distance').textContent = `${format(result.stopDistancePercent * 100, 4)}%`;
  $('usage-percent').textContent = `${format(result.capitalUsagePercent, 2)}%`;
  $('usage-fill').style.width = `${Math.min(result.capitalUsagePercent, 100)}%`;
  $('usage-fill').classList.toggle('danger', result.overCapital);
  $('usage-text').textContent = result.overCapital
    ? '所需保证金超过全仓可用资金，此计划无法按当前资金执行。'
    : `保证金占可用资金的 ${format(result.capitalUsagePercent, 2)}%。`;
  if (result.overCapital) {
    $('warning').hidden = false;
    $('warning').textContent = '保证金超过全仓仓位。请调整风险、止损距离或杠杆。';
  }
  $('copy').disabled = false;
}

fields.forEach(id => $(id).addEventListener('input', render));
$('calculator').addEventListener('submit', event => event.preventDefault());
$('risk-help').addEventListener('click', () => {
  const hidden = $('risk-explainer').hidden;
  $('risk-explainer').hidden = !hidden;
  $('risk-help').setAttribute('aria-expanded', String(hidden));
});
$('reset').addEventListener('click', () => {
  for (const id of fields) $(id).value = defaults[id];
  render();
});
$('copy').addEventListener('click', async () => {
  if (!currentResult) return;
  const { input, result } = currentResult;
  const text = [
    '合约仓位计算器 · 仓位测算',
    `方向：${result.direction === 'long' ? '做多' : '做空'}（自动判定）`,
    `全仓仓位：${format(input.capital, 4)} USDT`,
    `开仓价 / 止损价：${format(input.entry, 8)} / ${format(input.stop, 8)} USDT`,
    `风险百分比（全仓仓位基数）：${format(input.riskPercent, 4)}%` ,
    `杠杆：${format(input.leverage, 4)}×`,
    `止损量：${format(result.stopAmount, 4)} USDT`,
    `仓量 / 保证金：${format(result.margin, 4)} USDT`,
    `名义仓位：${format(result.notional, 4)} USDT`,
    `合约数量：${format(result.quantity, 8)}`,
    `实际账户风险：${format(result.accountRiskPercent, 2)}%`,
    '未计手续费、滑点、资金费率与强平。'
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    $('toast').textContent = '摘要已复制';
  } catch {
    $('toast').textContent = '复制失败，请检查浏览器权限';
  }
  $('toast').hidden = false;
  setTimeout(() => { $('toast').hidden = true; }, 2400);
});

load();
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
