import {
  ChemicalElement,
  ElementCategoryKey,
  GAS_Z,
  LIQUID_Z,
} from '../data/elementsData';

export type ElementStateKey = 'gas' | 'liquid' | 'synthetic' | 'solid';
export type StateFilterKey = 'all' | 'solid' | 'liquid' | 'gas' | 'radioactive';
export type OrbitalOccupancy = 'pair' | 'up' | 'empty';

export interface SubshellOrbitals {
  n: number;
  label: string;
  type: 's' | 'p' | 'd' | 'f';
  count: number;
  orbitals: OrbitalOccupancy[];
}

export interface ElementStateInfo {
  key: ElementStateKey;
  label: string;
  dotColor: string;
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
};

const NOBLE_CORE_ELECTRONS: Record<string, number> = {
  He: 2,
  Ne: 10,
  Ar: 18,
  Kr: 36,
  Xe: 54,
  Rn: 86,
};

export function normalizeText(str: string): string {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

export function parseSuperscript(str: string): number {
  let numStr = '';
  for (const ch of str) {
    if (SUPERSCRIPT_MAP[ch] !== undefined) {
      numStr += SUPERSCRIPT_MAP[ch];
    } else if (/\d/.test(ch)) {
      numStr += ch;
    }
  }
  return parseInt(numStr, 10) || 0;
}

export function parseSubshells(configStr: string): SubshellOrbitals[] {
  const clean = configStr.replace(/\[(He|Ne|Ar|Kr|Xe|Rn)\]\s*/g, '').trim();
  if (!clean) return [];
  const tokens = clean.split(/\s+/).filter(Boolean);
  const subshells: SubshellOrbitals[] = [];

  for (const token of tokens) {
    const m = token.match(/^(\d)([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹\d]+)$/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    const type = m[2] as 's' | 'p' | 'd' | 'f';
    const count = parseSuperscript(m[3]);
    const capacity = type === 's' ? 1 : type === 'p' ? 3 : type === 'd' ? 5 : 7;
    const orbitals: OrbitalOccupancy[] = [];

    for (let i = 0; i < capacity; i++) {
      if (count > capacity + i) {
        orbitals.push('pair');
      } else if (count > i) {
        orbitals.push('up');
      } else {
        orbitals.push('empty');
      }
    }

    subshells.push({ n, label: `${n}${type}`, type, count, orbitals });
  }
  return subshells;
}

export function extractNobleCore(configCondensed: string): string | null {
  const match = configCondensed.match(/^\[(He|Ne|Ar|Kr|Xe|Rn)\]/);
  return match ? match[1] : null;
}

export function calcShellDistribution(configFull: string): number[] {
  const subs = parseSubshells(configFull);
  const map: Record<number, number> = {};
  let maxN = 1;
  for (const s of subs) {
    map[s.n] = (map[s.n] || 0) + s.count;
    if (s.n > maxN) maxN = s.n;
  }
  const shells: number[] = [];
  for (let n = 1; n <= maxN; n++) {
    if (map[n]) shells.push(map[n]);
  }
  return shells;
}

export function calcElectrons(configCondensed: string): number {
  const core = extractNobleCore(configCondensed);
  const coreCount = core ? NOBLE_CORE_ELECTRONS[core] ?? 0 : 0;
  const subs = parseSubshells(configCondensed);
  return coreCount + subs.reduce((sum, s) => sum + s.count, 0);
}

export function getElementState(z: number): ElementStateInfo {
  if (GAS_Z.has(z)) return { key: 'gas', label: 'Khí', dotColor: '#34d399' };
  if (LIQUID_Z.has(z)) return { key: 'liquid', label: 'Lỏng', dotColor: '#38bdf8' };
  if (z >= 104) return { key: 'synthetic', label: 'Nhân tạo (dự đoán)', dotColor: '#a78bfa' };
  return { key: 'solid', label: 'Rắn', dotColor: '#94a3b8' };
}

export function isRadioactive(z: number): boolean {
  return z === 43 || z === 61 || z >= 84;
}

export function getGridPosition(el: Pick<ChemicalElement, 'z'>): { row: number; col: number } {
  const z = el.z;
  if (z === 1) return { row: 2, col: 2 };
  if (z === 2) return { row: 2, col: 19 };
  if (z >= 3 && z <= 4) return { row: 3, col: z - 2 + 1 };
  if (z >= 5 && z <= 10) return { row: 3, col: z + 8 + 1 };
  if (z >= 11 && z <= 12) return { row: 4, col: z - 10 + 1 };
  if (z >= 13 && z <= 18) return { row: 4, col: z + 1 };
  if (z >= 19 && z <= 36) return { row: 5, col: z - 18 + 1 };
  if (z >= 37 && z <= 54) return { row: 6, col: z - 36 + 1 };

  if (z >= 55 && z <= 56) return { row: 7, col: z - 54 + 1 };
  if (z >= 57 && z <= 71) return { row: 10, col: z - 57 + 4 };
  if (z >= 72 && z <= 86) return { row: 7, col: z - 72 + 5 };

  if (z >= 87 && z <= 88) return { row: 8, col: z - 86 + 1 };
  if (z >= 89 && z <= 103) return { row: 11, col: z - 89 + 4 };
  if (z >= 104 && z <= 118) return { row: 8, col: z - 104 + 5 };

  return { row: 2, col: 2 };
}

export interface ElementFilterCriteria {
  query: string;
  category: ElementCategoryKey | null;
  stateFilter: StateFilterKey;
}

export function matchesElementFilter(
  el: ChemicalElement,
  criteria: ElementFilterCriteria
): boolean {
  const qRaw = criteria.query.trim().toLowerCase();
  const qNorm = normalizeText(criteria.query);

  let matchSearch = true;
  if (qRaw) {
    const zMatch = String(el.z) === qRaw;
    const symbolMatch = el.symbol.toLowerCase().startsWith(qRaw);
    const nameViMatch =
      normalizeText(el.nameVi).includes(qNorm) ||
      el.nameVi.toLowerCase().includes(qRaw);
    const nameEnMatch = el.nameEn.toLowerCase().includes(qRaw);
    const massMatch = qRaw.includes('.') && el.atomicMass.includes(qRaw);
    matchSearch = zMatch || symbolMatch || nameViMatch || nameEnMatch || massMatch;
  }

  const matchCat = !criteria.category || el.category === criteria.category;

  let matchState = true;
  if (criteria.stateFilter !== 'all') {
    if (criteria.stateFilter === 'radioactive') {
      matchState = isRadioactive(el.z);
    } else {
      matchState = getElementState(el.z).key === criteria.stateFilter;
    }
  }

  return matchSearch && matchCat && matchState;
}

export interface ElementTileMotionTarget {
  y: number;
  scale: number;
  opacity: number;
  zIndex: number;
  backdropBlur: number;
  borderGlowOpacity: number;
}

export function getElementTileMotionTarget(params: {
  isPressed: boolean;
  isHovered: boolean;
  isSelected: boolean;
  isMatched: boolean;
  hasActiveHighlightFilter: boolean;
}): ElementTileMotionTarget {
  const {
    isPressed,
    isHovered,
    isSelected,
    isMatched,
    hasActiveHighlightFilter,
  } = params;

  if (isPressed) {
    return {
      y: -8,
      scale: 1.18,
      opacity: 1,
      zIndex: 30,
      backdropBlur: 18,
      borderGlowOpacity: 1,
    };
  }

  if (isSelected) {
    return {
      y: -3,
      scale: 1.07,
      opacity: 1,
      zIndex: 20,
      backdropBlur: 12,
      borderGlowOpacity: 0.72,
    };
  }

  if (isHovered) {
    if (isMatched) {
      return {
        y: -4,
        scale: 1.08,
        opacity: 1,
        zIndex: 20,
        backdropBlur: 14,
        borderGlowOpacity: 0.88,
      };
    }
    return {
      y: -2,
      scale: 1.04,
      opacity: 0.45,
      zIndex: 15,
      backdropBlur: 10,
      borderGlowOpacity: 0.35,
    };
  }

  if (!isMatched) {
    return {
      y: 0,
      scale: 1,
      opacity: 0.16,
      zIndex: 0,
      backdropBlur: 0,
      borderGlowOpacity: 0,
    };
  }

  return {
    y: 0,
    scale: 1,
    opacity: 1,
    zIndex: hasActiveHighlightFilter ? 10 : 1,
    backdropBlur: 0,
    borderGlowOpacity: hasActiveHighlightFilter ? 0.55 : 0,
  };
}

