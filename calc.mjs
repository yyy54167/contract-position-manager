/** Pure calculations. All money values are in USDT. */
export function calculatePosition(input) {
  const { capital, entry, stop, riskPercent, leverage, direction } = input;
  const values = [capital, entry, stop, riskPercent, leverage];
  if (values.some(value => !Number.isFinite(value))) return { error: '请填写所有参数。' };
  if (capital <= 0 || entry <= 0 || stop <= 0 || leverage <= 0) return { error: '资金、价格与杠杆必须大于 0。' };
  if (riskPercent <= 0 || riskPercent > 100) return { error: '风险百分比需大于 0 且不超过 100%。' };
  if (direction !== 'long' && direction !== 'short') return { error: '请选择做多或做空。' };
  if (direction === 'long' && stop >= entry) return { error: '做多时，止损价须低于开仓价。' };
  if (direction === 'short' && stop <= entry) return { error: '做空时，止损价须高于开仓价。' };

  // The requested formula uses entry price, rather than account capital, as its base.
  const stopAmount = entry * riskPercent / 100;
  const stopDistancePercent = Math.abs(entry - stop) / entry;
  const margin = stopAmount / (stopDistancePercent * leverage);
  const notional = margin * leverage;
  const quantity = notional / entry;
  const capitalUsagePercent = margin / capital * 100;
  const accountRiskPercent = stopAmount / capital * 100;
  if (![stopAmount, margin, notional, quantity, capitalUsagePercent, accountRiskPercent].every(Number.isFinite)) {
    return { error: '结果超出可计算范围，请检查输入。' };
  }
  return { stopAmount, stopDistancePercent, margin, notional, quantity, capitalUsagePercent, accountRiskPercent, overCapital: margin > capital };
}
