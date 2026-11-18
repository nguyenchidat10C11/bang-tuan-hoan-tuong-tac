import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import {
  CATEGORIES,
  ChemicalElement,
  GROUP_ROMAN,
} from '../data/elementsData';
import { getElementState, isRadioactive } from '../logic/elementLogic';
import { BohrModelSvg } from './BohrModelSvg';
import { OrbitalDiagram } from './OrbitalDiagram';

interface ElementDetailModalProps {
  element: ChemicalElement | null;
  orbitalViewMode: 'condensed' | 'full';
  onToggleOrbitalViewMode: () => void;
  onClose: () => void;
  onNavigate: (targetZ: number) => void;
}

export const ElementDetailModal: React.FC<ElementDetailModalProps> = ({
  element,
  orbitalViewMode,
  onToggleOrbitalViewMode,
  onClose,
  onNavigate,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!element) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate(element.z > 1 ? element.z - 1 : 118);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate(element.z < 118 ? element.z + 1 : 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [element, onClose, onNavigate]);

  if (!element) return null;

  const catInfo = CATEGORIES[element.category];
  const stateInfo = getElementState(element.z);
  const radioactive = isRadioactive(element.z);
  const groupLabel =
    element.group === 'f-block'
      ? 'f-block'
      : `Nhóm ${element.group} (${GROUP_ROMAN[element.group]})`;
  const predTag = element.isPredicted ? ' (dự đoán)' : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/65 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-element-title"
      data-testid="element-detail-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="liquid-glass-modal w-full max-w-[1000px] max-h-[92vh] rounded-3xl grid grid-cols-1 md:grid-cols-[290px_1fr] overflow-y-auto md:overflow-hidden custom-scrollbar">
        {/* Left Column: Preview Card, Bohr Model, Prev/Next */}
        <div className="bg-white/[0.03] border-b md:border-b-0 md:border-r border-white/12 p-5 flex flex-col items-center justify-between gap-4">
          <div
            className="liquid-tile w-full max-w-[220px] rounded-2xl p-3.5 flex flex-col justify-between border"
            style={{
              borderColor: catInfo.color,
              background: `linear-gradient(150deg, ${catInfo.tintBg} 0%, rgba(255, 255, 255, 0.08) 45%, rgba(10, 18, 36, 0.78) 100%)`,
            }}
          >
            <div className="flex justify-between items-center text-xs font-bold text-slate-200 tabular-nums">
              <span>Z = {element.z}</span>
              <span>{element.atomicMass} u</span>
            </div>
            <div className="text-5xl font-black text-center text-white my-2 leading-none">
              {element.symbol}
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-white">{element.nameVi}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">{groupLabel}</div>
            </div>
          </div>

          <BohrModelSvg
            atomicNumber={element.z}
            configFull={element.configFull}
            accentColor={catInfo.color}
          />

          <div className="w-full flex flex-col gap-1.5">
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => onNavigate(element.z > 1 ? element.z - 1 : 118)}
                aria-label="Nguyên tố trước (Phím mũi tên trái)"
                className="liquid-glass-btn flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Trước</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate(element.z < 118 ? element.z + 1 : 1)}
                aria-label="Nguyên tố sau (Phím mũi tên phải)"
                className="liquid-glass-btn flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300"
              >
                <span>Sau</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-[10.5px] text-slate-400 text-center">
              Phím ← / → để chuyển · Esc để đóng
            </p>
          </div>
        </div>

        {/* Right Column: Info Grid, Electron Config, Orbital Diagram, History */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 md:overflow-y-auto md:max-h-[90vh] custom-scrollbar">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <h2
                  id="modal-element-title"
                  className="text-2xl font-extrabold text-white tracking-tight"
                >
                  {element.nameVi}
                </h2>
                <span className="text-slate-500" aria-hidden="true">
                  ·
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: catInfo.color }}
                >
                  {catInfo.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 tabular-nums">
                {element.nameEn} · Số hiệu {element.z} · Nguyên tử khối {element.atomicMass} u
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng chi tiết (Phím Esc)"
              className="liquid-glass-btn rounded-xl p-2 text-slate-200 hover:bg-rose-500/35 hover:border-rose-300/60 hover:text-white transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300 shrink-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* 4-column Attributes */}
          <div className="liquid-glass-well grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl p-3.5">
            <div>
              <div className="text-[10.5px] font-semibold text-slate-400">
                Số hiệu (Z)
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5 tabular-nums">
                {element.z}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-semibold text-slate-400">
                Nguyên tử khối
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5 tabular-nums">
                {element.atomicMass} u
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-semibold text-slate-400">
                Trạng thái (25°C)
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {stateInfo.label}
                {radioactive ? ' · ☢ Phóng xạ' : ''}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-semibold text-slate-400">
                Nhóm &amp; Chu kỳ
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5 tabular-nums">
                {groupLabel} · CK {element.period}
              </div>
            </div>
          </div>

          {/* Electron Configurations */}
          <section className="liquid-glass-well rounded-2xl p-3.5 flex flex-col gap-2">
            <h3 className="text-xs font-bold tracking-wide text-sky-300">
              Cấu hình Electron
            </h3>
            <div className="rounded-xl border border-white/8 bg-[#040916]/65 px-3 py-2.5 font-mono text-xs sm:text-sm flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2.5">
                <span className="font-sans text-[11px] text-slate-400 w-16 shrink-0">
                  Rút gọn:
                </span>
                <span className="text-sky-200 font-semibold break-words">
                  {element.configCondensed}
                  {predTag}
                </span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-sans text-[11px] text-slate-400 w-16 shrink-0">
                  Đầy đủ:
                </span>
                <span className="text-cyan-200 font-medium break-words">
                  {element.configFull}
                  {predTag}
                </span>
              </div>
            </div>
          </section>

          {/* Hund's Rule Orbital Diagram */}
          <OrbitalDiagram
            element={element}
            viewMode={orbitalViewMode}
            onToggleViewMode={onToggleOrbitalViewMode}
          />

          {/* Discovery & History */}
          <section className="liquid-glass-well rounded-2xl p-3.5 flex flex-col gap-1.5">
            <h3 className="text-xs font-bold tracking-wide text-sky-300">
              Lịch sử &amp; Phát hiện
            </h3>
            <div className="text-xs sm:text-sm text-slate-200">
              <span className="font-bold text-white">{element.discoverer}</span>
              <span className="text-slate-400 mx-1.5">·</span>
              <span className="text-sky-300 font-semibold">
                Năm: {element.year}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
              {element.notes}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
