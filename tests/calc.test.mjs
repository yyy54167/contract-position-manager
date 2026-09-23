import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePosition } from '../calc.mjs';

const base = { capital: 1000, entry: 100, stop: 95, riskPercent: 2, leverage: 10 };

test('uses capital for risk and derives margin, notional and quantity', () => {
  const result = calculatePosition(base);
  assert.equal(result.stopAmount, 20);
  assert.equal(result.direction, 'long');
  assert.equal(result.stopDistancePercent, .05);
  assert.equal(result.margin, 40);
  assert.equal(result.notional, 400);
  assert.equal(result.quantity, 4);
  assert.equal(result.accountRiskPercent, 2);
});

test('direction is derived from stop and entry prices', () => {
  const result = calculatePosition({ ...base, stop: 105 });
  assert.equal(result.direction, 'short');
  assert.equal(result.margin, 40);
});

test('marks insufficient capital and rejects zero distance', () => {
  assert.equal(calculatePosition({ ...base, stop: 99.9, riskPercent: 20, leverage: 1 }).overCapital, true);
  assert.match(calculatePosition({ ...base, stop: 100 }).error, /不能相同/);
});
