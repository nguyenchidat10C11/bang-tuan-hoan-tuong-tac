import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Atom, ExternalLink, Minus, Plus, X } from 'lucide-react';
import { CATEGORIES, GROUP_ROMAN } from '../data/elementsData';
import { calculateElectronConfiguration } from '../logic/electronConfigCalculator';
import { BohrModelSvg } from './BohrModelSvg';
import { OrbitalDiagram } from './OrbitalDiagram';

interface ElectronConverterModalProps {
  isOpen: boolean;
  orbitalViewMode: 'condensed' | 'full';
  onToggleOrbitalViewMode: () => void;
  onClose: () => void;
  onOpenElementDetail: (z: number) => void;
}

const PRESET_ELECTRONS: { z: number; symbol: string; label: string }[] = [
  { z: 1, symbol: 'H', label: 'H (1)' },
  { z: 6, symbol: 'C', label: 'C (6)' },
  { z: 26, symbol: 'Fe', label: 'Fe (26)' },
  { z: 29, symbol: 'Cu', label: 'Cu (29)' },
  { z: 47, symbol: 'Ag', label: 'Ag (47)' },
  { z: 79, symbol: 'Au', label: 'Au (79)' },
];

export const ElectronConverterModal: React.FC<ElectronConverterModalProps> = ({
  isOpen,
  orbitalViewMode,
  onToggleOrbitalViewMode,
  onClose,
  onOpenElementDetail,
}) => {
  const [rawInput, setRawInput] = useState('26');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const rafId = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const parsedState = useMemo(() => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return {
        error: 'Vui lòng nhập số electron từ 1 đến 120.',
        result: null,
      };
    }
    if (!/^\d+$/.test(trimmed)) {
      return {
        error: 'Số electron phải là số nguyên dương từ 1 đến 120.',
        result: null,
      };
    }
    const num = Number(trimmed);
    if (!Number.isInteger(num) || num < 1 || num > 120) {
      return {
        error: 'Giá trị hợp lệ nằm trong khoảng từ 1 đến 120 electron.',
        result: null,
      };
    }
    const result = calculateElectronConfiguration(num);
    if (!result) {
      return {
        error: 'Không thể tính cấu hình cho giá trị đã nhập.',
        result: null,
      };
    }
    return { error: null, result };
  }, [rawInput]);

  if (!isOpen) return null;

  const { error, result } = parsedState;
  const matchedElement = result?.matchedElement ?? null;
  const catInfo = matchedElement ? CATEGORIES[matchedElement.category] : null;
  const accentColor = catInfo?.color ?? '#22d3ee';

  const currentNumeric = result ? result.electronCount : Number(rawInput.trim());
  const canDecrement = Number.isInteger(currentNumeric) && currentNumeric > 1 && currentNumeric <= 120;
  const canIncrement = Number.isInteger(currentNumeric) && currentNumeric >= 1 && currentNumeric < 120;

  const handleStep = (delta: number) => {
    const base = result
      ? result.electronCount
      : Number.isInteger(currentNumeric)
      ? Math.min(120, Math.max(1, currentNumeric))
      : 26;
    const next = Math.min(120, Math.max(1, base + delta));
    setRawInput(String(next));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/65 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="converter-modal-title"
      data-testid="electron-converter-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="liquid-glass-modal w-full max-w-[1000px] max-h-[92vh] rounded-3xl flex flex-col overflow-hidden">
        {/* Top Modal Bar */}
        <div className="flex items-start justify-between gap-3 border-b border-white/12 bg-white/[0.04] px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="liquid-glass-btn-active flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sky-200">
              <Atom className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="converter-modal-title"
                className="text-lg sm:text-xl font-extrabold text-white tracking-tight"
              >
                Bộ chuyển đổi cấu hình Electron
              </h2>
              <p className="text-xs text-slate-300/85 mt-0.5">
                Nhập số electron (1 – 120) để tính cấu hình rút gọn, sơ đồ Orbital &amp; mô hình Bohr
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bộ chuyển đổi cấu hình electron (Phím Esc)"
            className="liquid-glass-btn rounded-xl p-2 text-slate-200 hover:bg-rose-500/35 hover:border-rose-300/60 hover:text-white transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300 shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto custom-scrollbar p-5 sm:p-6 flex flex-col gap-5">
          {/* Input & Quick Presets Row */}
          <section className="liquid-glass-well rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="electron-count-input"
                  className="text-xs font-bold tracking-wide text-sky-300"
                >
                  Số electron (1 – 120)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStep(-1)}
                    disabled={!canDecrement}
                    aria-label="Giảm 1 electron"
                    className="liquid-glass-btn h-10 w-10 inline-flex items-center justify-center rounded-xl text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300 shrink-0"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <input
                    ref={inputRef}
                    id="electron-count-input"
                    type="text"
                    inputMode="numeric"
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder="Ví dụ: 26"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'electron-input-error' : undefined}
                    className="w-32 sm:w-36 h-10 rounded-xl border border-white/18 bg-[#040916]/75 px-3 text-center font-mono text-base font-bold tabular-nums text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] focus:border-sky-300/80 focus:outline-none focus:ring-2 focus:ring-sky-400/25"
                  />
                  <button
                    type="button"
                    onClick={() => handleStep(1)}
                    disabled={!canIncrement}
                    aria-label="Tăng 1 electron"
                    className="liquid-glass-btn h-10 w-10 inline-flex items-center justify-center rounded-xl text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300 shrink-0"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-300/80">
                  Mẫu nhanh:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESET_ELECTRONS.map((preset) => {
                    const active = result?.electronCount === preset.z;
                    return (
                      <button
                        key={preset.z}
                        type="button"
                        onClick={() => setRawInput(String(preset.z))}
                        aria-pressed={active}
                        className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300 ${
                          active
                            ? 'liquid-glass-btn-active text-white'
                            : 'liquid-glass-btn text-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && (
              <div
                id="electron-input-error"
                role="alert"
                data-testid="converter-error"
                className="flex items-center gap-2 rounded-xl border border-rose-300/45 bg-rose-500/15 px-3 py-2 text-xs sm:text-sm font-medium text-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
              >
                <AlertTriangle className="h-4 w-4 text-rose-300 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
          </section>

          {/* Computed Result Area */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-[270px_1fr] gap-5 items-start">
              {/* Left Column: Element Match Summary + Bohr Model */}
              <div className="flex flex-col gap-4">
                {matchedElement && catInfo ? (
                  <div
                    className="liquid-tile rounded-2xl border p-4 flex flex-col gap-3"
                    style={{
                      borderColor: `${catInfo.color}88`,
                      background: `linear-gradient(155deg, ${catInfo.tintBg} 0%, rgba(255, 255, 255, 0.08) 45%, rgba(9, 15, 32, 0.78) 100%)`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-mono font-bold text-slate-200 tabular-nums">
                          Z = {matchedElement.z} · Chu kỳ {matchedElement.period} ·{' '}
                          {matchedElement.group === 'f-block'
                            ? 'f-block'
                            : `Nhóm ${matchedElement.group} (${GROUP_ROMAN[matchedElement.group]})`}
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-3xl font-black text-white leading-none">
                            {matchedElement.symbol}
                          </span>
                          <span className="text-base font-bold text-slate-100">
                            {matchedElement.nameVi}
                          </span>
                        </div>
                        <div className="text-xs text-slate-200/90 mt-0.5">
                          {matchedElement.nameEn} ·{' '}
                          <span style={{ color: catInfo.color }} className="font-semibold">
                            {catInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenElementDetail(matchedElement.z)}
                      className="liquid-glass-btn inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-sky-200 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300 whitespace-nowrap shrink-0"
                    >
                      <span>Xem chi tiết</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="liquid-glass-well rounded-2xl p-4 flex flex-col gap-1.5">
                    <div className="text-xs font-mono font-bold text-sky-300 tabular-nums">
                      Z = {result.electronCount} · Chu kỳ 8 (Mở rộng)
                    </div>
                    <div className="text-base font-bold text-white">
                      Nguyên tố giả định (ngoài 118)
                    </div>
                    <p className="text-xs text-slate-300/85 leading-relaxed">
                      Cấu hình được suy diễn thuần theo quy tắc Klechkowski (phân lớp 8s).
                    </p>
                  </div>
                )}

                <BohrModelSvg
                  atomicNumber={result.electronCount}
                  configFull={result.configFull}
                  accentColor={accentColor}
                />
              </div>

              {/* Right Column: Metrics, Configurations, Exception Notice, Orbital Diagram */}
              <div className="flex flex-col gap-4 min-w-0">
                {/* 4 Key Metrics */}
                <div className="liquid-glass-well grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl p-3.5">
                  <div>
                    <div className="text-[10.5px] font-semibold text-slate-400">
                      Tổng e⁻
                    </div>
                    <div
                      className="text-base font-bold text-slate-100 mt-0.5 font-mono tabular-nums"
                      data-testid="metric-total-electrons"
                    >
                      {result.electronCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold text-slate-400">
                      Số lớp e⁻
                    </div>
                    <div
                      className="text-base font-bold text-slate-100 mt-0.5 font-mono tabular-nums"
                      data-testid="metric-shell-count"
                    >
                      {result.shells.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold text-slate-400">
                      e⁻ độc thân
                    </div>
                    <div
                      className="text-base font-bold text-sky-300 mt-0.5 font-mono tabular-nums"
                      data-testid="metric-unpaired-electrons"
                    >
                      {result.unpairedElectrons}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold text-slate-400">
                      e⁻ lớp ngoài cùng
                    </div>
                    <div
                      className="text-base font-bold text-slate-100 mt-0.5 font-mono tabular-nums"
                      data-testid="metric-outermost-electrons"
                    >
                      {result.outermostElectrons}
                    </div>
                  </div>
                </div>

                {/* Electron Configuration Block */}
                <section className="liquid-glass-well rounded-2xl p-4 flex flex-col gap-2.5">
                  <h3 className="text-xs font-bold tracking-wide text-sky-300">
                    Cấu hình Electron
                  </h3>
                  <div className="rounded-xl border border-white/8 bg-[#040916]/65 px-3.5 py-3 font-mono text-xs sm:text-sm flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-sans text-[11px] font-semibold text-slate-400 sm:w-28 shrink-0">
                        Rút gọn:
                      </span>
                      <span
                        className="text-sky-200 font-bold break-words"
                        data-testid="converter-config-condensed"
                      >
                        {result.configCondensed}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-sans text-[11px] font-semibold text-slate-400 sm:w-28 shrink-0">
                        Đầy đủ:
                      </span>
                      <span
                        className="text-cyan-200 font-medium break-words"
                        data-testid="converter-config-full"
                      >
                        {result.configFull}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-t border-white/10 pt-2">
                      <span className="font-sans text-[11px] font-semibold text-slate-400 sm:w-28 shrink-0">
                        Thứ tự mức NL:
                      </span>
                      <span className="text-slate-300 text-xs break-words">
                        {result.aufbauOrderConfig}
                      </span>
                    </div>
                  </div>

                  {result.isException && result.exceptionReason && (
                    <div
                      data-testid="converter-exception-note"
                      className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] flex flex-col gap-1"
                    >
                      <div className="font-bold text-amber-200">
                        Ngoại lệ cấu hình trạng thái cơ bản
                      </div>
                      <p className="leading-relaxed">{result.exceptionReason}</p>
                      <p className="text-[11px] text-amber-200/80 font-mono">
                        Lý thuyết Klechkowski: {result.theoreticalConfigFull}
                      </p>
                    </div>
                  )}
                </section>

                {/* Orbital Box Diagram */}
                <OrbitalDiagram
                  element={{
                    z: result.electronCount,
                    configCondensed: result.configCondensed,
                    configFull: result.configFull,
                  }}
                  viewMode={orbitalViewMode}
                  onToggleViewMode={onToggleOrbitalViewMode}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
