import React, { useEffect, useRef } from 'react';
import { ChemicalElement } from '../data/elementsData';
import { extractNobleCore, parseSubshells } from '../logic/elementLogic';

interface OrbitalDiagramProps {
  element: Pick<ChemicalElement, 'z' | 'configCondensed' | 'configFull'>;
  viewMode: 'condensed' | 'full';
  onToggleViewMode: () => void;
}

export const OrbitalDiagram: React.FC<OrbitalDiagramProps> = ({
  element,
  viewMode,
  onToggleViewMode,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [element.z, viewMode]);

  const isCondensed = viewMode === 'condensed';
  const configToUse = isCondensed ? element.configCondensed : element.configFull;
  const nobleCore = isCondensed ? extractNobleCore(configToUse) : null;
  const subshells = parseSubshells(configToUse);

  return (
    <section className="liquid-glass-well rounded-2xl p-3.5 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold tracking-wide text-sky-300">
          Sơ đồ ô Orbital (Quy tắc Hund)
        </h3>
        <button
          type="button"
          onClick={onToggleViewMode}
          className="liquid-glass-btn rounded-lg px-2.5 py-1 text-xs font-semibold text-sky-200 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300 whitespace-nowrap shrink-0"
        >
          {isCondensed ? 'Hiện đầy đủ' : 'Thu gọn lõi'}
        </button>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto py-1.5 custom-scrollbar"
        data-testid="orbital-scroll-container"
      >
        <div className="flex items-end gap-3 min-w-max">
          {nobleCore && (
            <div
              className="flex items-center justify-center rounded-lg border border-violet-300/35 bg-violet-400/12 px-2.5 h-7 font-mono text-xs font-bold text-violet-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] mb-[18px]"
              title={`Lõi khí hiếm ${nobleCore}`}
            >
              [{nobleCore}]
            </div>
          )}

          {subshells.map((sub) => (
            <div
              key={sub.label}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex gap-1">
                {sub.orbitals.map((state, idx) => {
                  const hasElectron = state !== 'empty';
                  return (
                    <div
                      key={`${sub.label}-${idx}`}
                      className={`w-7 h-7 rounded-md border flex items-center justify-center text-sm font-bold ${
                        hasElectron
                          ? 'border-sky-300/65 bg-sky-400/18 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]'
                          : 'border-white/12 bg-white/[0.04] text-slate-500'
                      }`}
                      aria-label={`${sub.label} orbital ${idx + 1}: ${
                        state === 'pair'
                          ? '2 electron ghép đôi'
                          : state === 'up'
                          ? '1 electron độc thân'
                          : 'trống'
                      }`}
                    >
                      {state === 'pair' ? '↑↓' : state === 'up' ? '↑' : '\u00A0'}
                    </div>
                  );
                })}
              </div>
              <span className="font-mono text-[11px] font-semibold text-slate-200">
                {sub.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
