import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePosition } from '../calc.mjs';

const base = { capital: 1000, entry: 100, stop: 95, riskPercent: 2, leverage: 10, direction: 'long' };

test('follows the exact requested formulas and derives notional and quantity', () => {
  const result = calculatePosition(base);
  assert.equal(result.stopAmount, 2);
  assert.equal(result.stopDistancePercent, .05);
  assert.equal(result.margin, 4);
  assert.equal(result.notional, 40);
  assert.equal(result.quantity, .4);
  assert.equal(result.accountRiskPercent, .2);
});

test('short stop distance is positive and respects direction', () => {
  const result = calculatePosition({ ...base, stop: 105, direction: 'short' });
  assert.equal(result.margin, 4);
  assert.match(calculatePosition({ ...base, stop: 105 }).error, /做多/);
});

test('marks insufficient capital and rejects zero distance', () => {
  assert.equal(calculatePosition({ ...base, capital: 2 }).overCapital, true);
  assert.match(calculatePosition({ ...base, stop: 100 }).error, /止损价/);
});
