import {
  ChemicalElement,
  ELEMENTS,
  SHELL_NAMES,
} from '../data/elementsData';
import {
  calcShellDistribution,
  extractNobleCore,
  parseSubshells,
  SubshellOrbitals,
} from './elementLogic';

export interface SubshellOrderEntry {
  n: number;
  type: 's' | 'p' | 'd' | 'f';
  capacity: number;
}

// Aufbau / Klechkowski filling order up to 120 electrons
export const AUFBAU_ORDER: readonly SubshellOrderEntry[] = [
  { n: 1, type: 's', capacity: 2 },
  { n: 2, type: 's', capacity: 2 },
  { n: 2, type: 'p', capacity: 6 },
  { n: 3, type: 's', capacity: 2 },
  { n: 3, type: 'p', capacity: 6 },
  { n: 4, type: 's', capacity: 2 },
  { n: 3, type: 'd', capacity: 10 },
  { n: 4, type: 'p', capacity: 6 },
  { n: 5, type: 's', capacity: 2 },
  { n: 4, type: 'd', capacity: 10 },
  { n: 5, type: 'p', capacity: 6 },
  { n: 6, type: 's', capacity: 2 },
  { n: 4, type: 'f', capacity: 14 },
  { n: 5, type: 'd', capacity: 10 },
  { n: 6, type: 'p', capacity: 6 },
  { n: 7, type: 's', capacity: 2 },
  { n: 5, type: 'f', capacity: 14 },
  { n: 6, type: 'd', capacity: 10 },
  { n: 7, type: 'p', capacity: 6 },
  { n: 8, type: 's', capacity: 2 },
];

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const;
const SUBSHELL_TYPE_ORDER: Record<'s' | 'p' | 'd' | 'f', number> = {
  s: 0,
  p: 1,
  d: 2,
  f: 3,
};

const NOBLE_CORES: { symbol: string; electrons: number }[] = [
  { symbol: 'Rn', electrons: 86 },
  { symbol: 'Xe', electrons: 54 },
  { symbol: 'Kr', electrons: 36 },
  { symbol: 'Ar', electrons: 18 },
  { symbol: 'Ne', electrons: 10 },
  { symbol: 'He', electrons: 2 },
];

// Ground-state adjustments relative to strict Klechkowski filling (Z -> adjustments)
const GROUND_STATE_EXCEPTIONS: Record<
  number,
  { reason: string; overrides: Record<string, number> }
> = {
  24: {
    reason: 'Chuyển 1e⁻ từ 4s sang 3d để đạt phân lớp 3d⁵ bán bão hòa bền vững.',
    overrides: { '3d': 5, '4s': 1 },
  },
  29: {
    reason: 'Chuyển 1e⁻ từ 4s sang 3d để đạt phân lớp 3d¹⁰ bão hòa bền vững.',
    overrides: { '3d': 10, '4s': 1 },
  },
  41: {
    reason: 'Tối ưu năng lượng ghép đôi giúp phân lớp 4d⁴ 5s¹ bền hơn 4d³ 5s².',
    overrides: { '4d': 4, '5s': 1 },
  },
  42: {
    reason: 'Chuyển 1e⁻ từ 5s sang 4d để đạt phân lớp 4d⁵ bán bão hòa bền vững.',
    overrides: { '4d': 5, '5s': 1 },
  },
  44: {
    reason: 'Chuyển 1e⁻ từ 5s sang 4d giúp giảm lực đẩy ghép đôi electron.',
    overrides: { '4d': 7, '5s': 1 },
  },
  45: {
    reason: 'Chuyển 1e⁻ từ 5s sang 4d giúp ổn định trạng thái cơ bản.',
    overrides: { '4d': 8, '5s': 1 },
  },
  46: {
    reason: 'Chuyển cả 2e⁻ từ 5s sang 4d để đạt phân lớp 4d¹⁰ bão hòa hoàn toàn.',
    overrides: { '4d': 10, '5s': 0 },
  },
  47: {
    reason: 'Chuyển 1e⁻ từ 5s sang 4d để đạt phân lớp 4d¹⁰ bão hòa bền vững.',
    overrides: { '4d': 10, '5s': 1 },
  },
  57: {
    reason: 'Mức năng lượng 5d thấp hơn 4f tại Z=57 nên e⁻ điền vào 5d¹ trước.',
    overrides: { '4f': 0, '5d': 1 },
  },
  58: {
    reason: 'Giữ lại 1e⁻ ở phân lớp 5d¹ cùng với 4f¹ giúp cấu hình ổn định hơn.',
    overrides: { '4f': 1, '5d': 1 },
  },
  64: {
    reason: 'Chuyển 1e⁻ sang 5d¹ để giữ phân lớp 4f⁷ bán bão hòa bền vững.',
    overrides: { '4f': 7, '5d': 1 },
  },
  78: {
    reason: 'Hiệu ứng tương đối tính khiến cấu hình cơ bản ổn định ở 5d⁹ 6s¹.',
    overrides: { '5d': 9, '6s': 1 },
  },
  79: {
    reason: 'Chuyển 1e⁻ từ 6s sang 5d để đạt phân lớp 5d¹⁰ bão hòa bền vững.',
    overrides: { '5d': 10, '6s': 1 },
  },
  89: {
    reason: 'Mức năng lượng 6d thuận lợi hơn 5f tại Z=89 nên e⁻ điền vào 6d¹.',
    overrides: { '5f': 0, '6d': 1 },
  },
  90: {
    reason: 'Mức năng lượng 6d thuận lợi hơn 5f tại Z=90 nên có 6d² 7s².',
    overrides: { '5f': 0, '6d': 2 },
  },
  91: {
    reason: 'Phân bố hỗn hợp 5f² 6d¹ giúp tối ưu năng lượng trạng thái cơ bản.',
    overrides: { '5f': 2, '6d': 1 },
  },
  92: {
    reason: 'Phân bố hỗn hợp 5f³ 6d¹ bền hơn cấu hình 5f⁴ thuần túy.',
    overrides: { '5f': 3, '6d': 1 },
  },
  93: {
    reason: 'Giữ 1e⁻ ở phân lớp 6d¹ cùng với 5f⁴ 7s².',
    overrides: { '5f': 4, '6d': 1 },
  },
  96: {
    reason: 'Giữ phân lớp 5f⁷ bán bão hòa bền vững và đặt 1e⁻ vào 6d¹.',
    overrides: { '5f': 7, '6d': 1 },
  },
  103: {
    reason: 'Hiệu ứng tương đối tính làm e⁻ hóa trị cuối điền vào 7p¹ thay vì 6d¹.',
    overrides: { '6d': 0, '7p': 1 },
  },
};

export function toSuperscript(num: number): string {
  return String(num)
    .split('')
    .map((digit) => SUPERSCRIPT_DIGITS[Number(digit)] ?? digit)
    .join('');
}

export interface ElectronConfigResult {
  electronCount: number;
  configCondensed: string;
  configFull: string;
  aufbauOrderConfig: string;
  theoreticalConfigFull: string;
  nobleCore: string | null;
  isException: boolean;
  exceptionReason: string | null;
  shells: number[];
  shellSummary: { name: string; count: number }[];
  outermostElectrons: number;
  unpairedElectrons: number;
  subshellsFull: SubshellOrbitals[];
  matchedElement: ChemicalElement | null;
}

function buildConfigTokens(
  electronCount: number,
  applyExceptions: boolean
): {
  aufbauTokens: { label: string; n: number; type: 's' | 'p' | 'd' | 'f'; count: number }[];
  spectroTokens: { label: string; n: number; type: 's' | 'p' | 'd' | 'f'; count: number }[];
} {
  let remaining = electronCount;
  const countMap = new Map<string, { n: number; type: 's' | 'p' | 'd' | 'f'; count: number }>();
  const aufbauOrderLabels: string[] = [];

  for (const entry of AUFBAU_ORDER) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, entry.capacity);
    const label = `${entry.n}${entry.type}`;
    countMap.set(label, { n: entry.n, type: entry.type, count: take });
    aufbauOrderLabels.push(label);
    remaining -= take;
  }

  if (applyExceptions && GROUND_STATE_EXCEPTIONS[electronCount]) {
    const { overrides } = GROUND_STATE_EXCEPTIONS[electronCount];
    for (const [label, newCount] of Object.entries(overrides)) {
      if (newCount === 0) {
        countMap.delete(label);
      } else {
        const n = Number(label[0]);
        const type = label[1] as 's' | 'p' | 'd' | 'f';
        countMap.set(label, { n, type, count: newCount });
        if (!aufbauOrderLabels.includes(label)) {
          aufbauOrderLabels.push(label);
        }
      }
    }
  }

  const aufbauTokens = aufbauOrderLabels
    .map((label) => {
      const entry = countMap.get(label);
      return entry ? { label, ...entry } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const spectroTokens = Array.from(countMap.entries())
    .map(([label, entry]) => ({ label, ...entry }))
    .sort((a, b) => {
      if (a.n !== b.n) return a.n - b.n;
      return SUBSHELL_TYPE_ORDER[a.type] - SUBSHELL_TYPE_ORDER[b.type];
    });

  return { aufbauTokens, spectroTokens };
}

function formatTokens(
  tokens: { label: string; count: number }[]
): string {
  return tokens.map((t) => `${t.label}${toSuperscript(t.count)}`).join(' ');
}

function condenseSpectroTokens(
  electronCount: number,
  spectroTokens: { label: string; n: number; type: 's' | 'p' | 'd' | 'f'; count: number }[]
): { condensed: string; nobleCore: string | null } {
  const core = NOBLE_CORES.find((c) => electronCount > c.electrons);
  if (!core) {
    return { condensed: formatTokens(spectroTokens), nobleCore: null };
  }

  // Determine which tokens belong to the noble gas core
  const coreConfig = buildConfigTokens(core.electrons, false).spectroTokens;
  const coreCounts = new Map(coreConfig.map((t) => [t.label, t.count]));

  const valenceTokens = spectroTokens.filter((t) => coreCounts.get(t.label) !== t.count);
  const valenceStr = formatTokens(valenceTokens);
  return {
    condensed: valenceStr ? `[${core.symbol}] ${valenceStr}` : `[${core.symbol}]`,
    nobleCore: core.symbol,
  };
}

export function calculateElectronConfiguration(
  electronCount: number
): ElectronConfigResult | null {
  if (!Number.isInteger(electronCount) || electronCount < 1 || electronCount > 120) {
    return null;
  }

  const theoretical = buildConfigTokens(electronCount, false);
  const theoreticalConfigFull = formatTokens(theoretical.spectroTokens);

  const actual = buildConfigTokens(electronCount, true);
  const configFull = formatTokens(actual.spectroTokens);
  const aufbauOrderConfig = formatTokens(actual.aufbauTokens);
  const { condensed: configCondensed, nobleCore } = condenseSpectroTokens(
    electronCount,
    actual.spectroTokens
  );

  const exceptionInfo = GROUND_STATE_EXCEPTIONS[electronCount] ?? null;
  const isException = Boolean(exceptionInfo && configFull !== theoreticalConfigFull);

  const shells = calcShellDistribution(configFull);
  const shellSummary = shells.map((count, idx) => ({
    name: SHELL_NAMES[idx] ?? `Lớp ${idx + 1}`,
    count,
  }));

  const subshellsFull = parseSubshells(configFull);
  const unpairedElectrons = subshellsFull.reduce(
    (sum, sub) => sum + sub.orbitals.filter((o) => o === 'up').length,
    0
  );
  const outermostElectrons = shells[shells.length - 1] ?? 0;

  return {
    electronCount,
    configCondensed,
    configFull,
    aufbauOrderConfig,
    theoreticalConfigFull,
    nobleCore: extractNobleCore(configCondensed) ?? nobleCore,
    isException,
    exceptionReason: isException && exceptionInfo ? exceptionInfo.reason : null,
    shells,
    shellSummary,
    outermostElectrons,
    unpairedElectrons,
    subshellsFull,
    matchedElement: ELEMENTS[electronCount - 1] ?? null,
  };
}
