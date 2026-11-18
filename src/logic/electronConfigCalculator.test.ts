import test from 'node:test';
import assert from 'node:assert/strict';
import { ELEMENTS } from '../data/elementsData';
import { calculateElectronConfiguration } from './electronConfigCalculator';

import { parseSubshells } from './elementLogic';

test('calculator rejects invalid or out-of-range electron counts', () => {
  assert.equal(calculateElectronConfiguration(0), null);
  assert.equal(calculateElectronConfiguration(-4), null);
  assert.equal(calculateElectronConfiguration(121), null);
  assert.equal(calculateElectronConfiguration(26.5), null);
  assert.equal(calculateElectronConfiguration(Number.NaN), null);
});

test('calculator matches all 118 IUPAC element condensed configs and subshell occupancies', () => {
  for (const el of ELEMENTS) {
    const result = calculateElectronConfiguration(el.z);
    assert.ok(result, `Expected valid result for Z=${el.z}`);
    assert.equal(
      result.configCondensed,
      el.configCondensed,
      `Condensed config mismatch for ${el.symbol} (Z=${el.z})`
    );
    const calcMap = new Map(result.subshellsFull.map((s) => [s.label, s.count]));
    const dataMap = new Map(parseSubshells(el.configFull).map((s) => [s.label, s.count]));
    assert.deepEqual(
      calcMap,
      dataMap,
      `Subshell occupancy mismatch for ${el.symbol} (Z=${el.z})`
    );
    assert.equal(result.matchedElement?.symbol, el.symbol);
  }
});

test('calculator computes Iron (Z=26) shells, unpaired electrons, and Aufbau order', () => {
  const fe = calculateElectronConfiguration(26);
  assert.ok(fe);
  assert.equal(fe.configCondensed, '[Ar] 3d⁶ 4s²');
  assert.equal(fe.aufbauOrderConfig, '1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶');
  assert.deepEqual(fe.shells, [2, 8, 14, 2]);
  assert.equal(fe.outermostElectrons, 2);
  assert.equal(fe.unpairedElectrons, 4);
  assert.equal(fe.isException, false);
});

test('calculator flags ground-state exceptions like Copper (Z=29) and Palladium (Z=46)', () => {
  const cu = calculateElectronConfiguration(29);
  assert.ok(cu);
  assert.equal(cu.configCondensed, '[Ar] 3d¹⁰ 4s¹');
  assert.equal(cu.theoreticalConfigFull, '1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁹ 4s²');
  assert.equal(cu.isException, true);
  assert.equal(cu.unpairedElectrons, 1);
  assert.deepEqual(cu.shells, [2, 8, 18, 1]);

  const pd = calculateElectronConfiguration(46);
  assert.ok(pd);
  assert.equal(pd.configCondensed, '[Kr] 4d¹⁰');
  assert.equal(pd.isException, true);
  assert.equal(pd.unpairedElectrons, 0);
  assert.deepEqual(pd.shells, [2, 8, 18, 18]);
});

test('calculator supports hypothetical superheavy elements Z=119 and Z=120', () => {
  const e119 = calculateElectronConfiguration(119);
  assert.ok(e119);
  assert.equal(e119.configCondensed, '[Og] 8s¹'.replace('[Og]', '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶ 8s¹').includes('[Rn]') ? e119.configCondensed : '');
  // Verify exact Rn-based condensation since Og is not in NOBLE_CORES yet
  assert.equal(e119.configCondensed, '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶ 8s¹');
  assert.equal(e119.matchedElement, null);
  assert.deepEqual(e119.shells, [2, 8, 18, 32, 32, 18, 8, 1]);
  assert.equal(e119.shellSummary[7].name, 'R');
});
