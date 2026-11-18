import test from 'node:test';
import assert from 'node:assert/strict';
import { ELEMENTS } from '../data/elementsData';
import {
  calcElectrons,
  calcShellDistribution,
  getElementState,
  getElementTileMotionTarget,
  getGridPosition,
  isRadioactive,
  matchesElementFilter,
  normalizeText,
  parseSubshells,
} from './elementLogic';

test('dataset contains exactly 118 unique sequential elements', () => {
  assert.equal(ELEMENTS.length, 118);
  ELEMENTS.forEach((el, idx) => {
    assert.equal(el.z, idx + 1, `Expected z=${idx + 1}, got ${el.z}`);
  });
});

test('all 118 elements have consistent condensed and full electron counts', () => {
  for (const el of ELEMENTS) {
    assert.equal(
      calcElectrons(el.configCondensed),
      el.z,
      `Condensed electron count mismatch for ${el.symbol} (Z=${el.z})`
    );
    const shells = calcShellDistribution(el.configFull);
    const total = shells.reduce((sum, count) => sum + count, 0);
    assert.equal(
      total,
      el.z,
      `Full Bohr shell sum mismatch for ${el.symbol} (Z=${el.z})`
    );
  }
});

test('parseSubshells applies Hund rule accurately for s, p, d, f subshells', () => {
  const nitrogen = parseSubshells('[He] 2s² 2p³');
  assert.equal(nitrogen.length, 2);
  assert.deepEqual(nitrogen[0].orbitals, ['pair']);
  assert.deepEqual(nitrogen[1].orbitals, ['up', 'up', 'up']);

  const oxygen = parseSubshells('[He] 2s² 2p⁴');
  assert.deepEqual(oxygen[1].orbitals, ['pair', 'up', 'up']);

  const copper = parseSubshells('[Ar] 3d¹⁰ 4s¹');
  assert.deepEqual(copper[0].orbitals, ['pair', 'pair', 'pair', 'pair', 'pair']);
  assert.deepEqual(copper[1].orbitals, ['up']);

  const palladium = parseSubshells('[Kr] 4d¹⁰');
  assert.equal(palladium.length, 1);
  assert.deepEqual(calcShellDistribution(ELEMENTS[45].configFull), [2, 8, 18, 18]);
});

test('grid coordinates produce 118 unique positions without collisions', () => {
  const seen = new Set<string>();
  for (const el of ELEMENTS) {
    const pos = getGridPosition(el);
    const key = `${pos.row}:${pos.col}`;
    assert.equal(seen.has(key), false, `Grid collision at ${key} for ${el.symbol}`);
    seen.add(key);
  }
  assert.equal(seen.size, 118);
});

test('normalizeText strips Vietnamese diacritics and handles đ/Đ', () => {
  assert.equal(normalizeText('Sắt'), 'sat');
  assert.equal(normalizeText('Hiđro'), 'hidro');
  assert.equal(normalizeText('Lưu huỳnh'), 'luu huynh');
  assert.equal(normalizeText('Đarmstati'), 'darmstati');
});

test('search and state filtering match accurately without false numeric mass noise', () => {
  const matchesForOne = ELEMENTS.filter((el) =>
    matchesElementFilter(el, { query: '1', category: null, stateFilter: 'all' })
  );
  assert.deepEqual(
    matchesForOne.map((el) => el.symbol),
    ['H']
  );

  const matchesForSat = ELEMENTS.filter((el) =>
    matchesElementFilter(el, { query: 'sat', category: null, stateFilter: 'all' })
  );
  assert.deepEqual(
    matchesForSat.map((el) => el.symbol),
    ['Fe']
  );

  const matchesForDecimalMass = ELEMENTS.filter((el) =>
    matchesElementFilter(el, { query: '15.99', category: null, stateFilter: 'all' })
  );
  assert.deepEqual(
    matchesForDecimalMass.map((el) => el.symbol),
    ['O']
  );

  const liquidElements = ELEMENTS.filter((el) =>
    matchesElementFilter(el, { query: '', category: null, stateFilter: 'liquid' })
  );
  assert.deepEqual(
    liquidElements.map((el) => el.symbol),
    ['Br', 'Hg']
  );

  const gasElements = ELEMENTS.filter((el) => getElementState(el.z).key === 'gas');
  assert.equal(gasElements.length, 11);

  assert.equal(isRadioactive(43), true);
  assert.equal(isRadioactive(61), true);
  assert.equal(isRadioactive(83), false);
  assert.equal(isRadioactive(84), true);
});

test('getElementTileMotionTarget computes spring pop-up targets by priority', () => {
  // Pressed overrides hovered, selected, and unmatched states
  assert.deepEqual(
    getElementTileMotionTarget({
      isPressed: true,
      isHovered: true,
      isSelected: true,
      isMatched: false,
      hasActiveHighlightFilter: true,
    }),
    {
      y: -8,
      scale: 1.18,
      opacity: 1,
      zIndex: 30,
      backdropBlur: 18,
      borderGlowOpacity: 1,
    }
  );

  // Selected pops up above rest
  assert.deepEqual(
    getElementTileMotionTarget({
      isPressed: false,
      isHovered: false,
      isSelected: true,
      isMatched: true,
      hasActiveHighlightFilter: false,
    }),
    {
      y: -3,
      scale: 1.07,
      opacity: 1,
      zIndex: 20,
      backdropBlur: 12,
      borderGlowOpacity: 0.72,
    }
  );

  // Hovered matched pops up crisply with intensified blur and border glow
  assert.deepEqual(
    getElementTileMotionTarget({
      isPressed: false,
      isHovered: true,
      isSelected: false,
      isMatched: true,
      hasActiveHighlightFilter: false,
    }),
    {
      y: -4,
      scale: 1.08,
      opacity: 1,
      zIndex: 20,
      backdropBlur: 14,
      borderGlowOpacity: 0.88,
    }
  );

  // Unmatched at rest stays dimmed
  assert.deepEqual(
    getElementTileMotionTarget({
      isPressed: false,
      isHovered: false,
      isSelected: false,
      isMatched: false,
      hasActiveHighlightFilter: true,
    }),
    {
      y: 0,
      scale: 1,
      opacity: 0.16,
      zIndex: 0,
      backdropBlur: 0,
      borderGlowOpacity: 0,
    }
  );
});

