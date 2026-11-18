import React from 'react';
import {
  CATEGORIES,
  ChemicalElement,
  GROUP_ROMAN,
  SHELL_NAMES,
} from '../data/elementsData';
import {
  calcShellDistribution,
  getElementState,
  isRadioactive,
} from '../logic/elementLogic';

interface CenterInspectorProps {
  element: ChemicalElement;
  onInspectOpenModal: (z: number) => void;
}

export const CenterInspector: React.FC<CenterInspectorProps> = ({
  element,
  onInspectOpenModal,
}) => {
  const catInfo = CATEGORIES[element.category];
  const stateInfo = getElementState(element.z);
  const shells = calcShellDistribution(element.configFull);
  const radioactive = isRadioactive(element.z);
  const groupText =
    element.group === 'f-block'
      ? 'f-block'
      : `${element.group} (${GROUP_ROMAN[element.group]})`;

  return (
    <div
      className="liquid-glass-panel rounded-2xl px-4 py-3 grid grid-cols-[124px_1fr_178px] gap-3.5 items-center"
      style={{ gridColumn: '4 / span 10', gridRow: '2 / span 3' }}
      data-testid="center-inspector"
    >
      {/* Preview Tile Button */}
      <button
        type="button"
        onClick={() => onInspectOpenModal(element.z)}
        aria-label={`Xem chi tiết ${element.nameVi} (${element.symbol})`}
        className="liquid-tile w-[124px] h-[124px] rounded-xl p-2.5 flex flex-col justify-between text-left border transition-transform duration-150 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 cursor-pointer"
        style={{
          borderColor: catInfo.color,
          background: `linear-gradient(150deg, ${catInfo.tintBg} 0%, rgba(255, 255, 255, 0.08) 45%, rgba(10, 18, 36, 0.78) 100%)`,
        }}
      >
        <div className="flex justify-between items-center text-[11px] font-bold text-slate-200 tabular-nums">
          <span>{element.z}</span>
          <span>{element.atomicMass} u</span>
        </div>
        <div className="text-[36px] font-extrabold text-center leading-none text-white">
          {element.symbol}
        </div>
        <div className="text-[11.5px] font-semibold text-center text-slate-100 truncate">
          {element.nameVi}
        </div>
      </button>

      {/* Live Metadata Details */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-extrabold text-white tracking-tight">
            {element.nameVi} ({element.nameEn})
          </span>
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

        <div className="text-xs text-slate-300 tabular-nums">
          Chu kỳ {element.period} · Nhóm {groupText} · Trạng thái: {stateInfo.label}
          {radioactive ? ' · ☢ Phóng xạ' : ''}
        </div>

        <div className="liquid-glass-well font-mono text-xs text-sky-200 rounded-lg px-2.5 py-1.5 truncate">
          Cấu hình e⁻: {element.configCondensed}
          {element.isPredicted ? ' (dự đoán)' : ''}
        </div>

        <div className="text-[11.5px] text-slate-300 flex items-center flex-wrap gap-x-2 gap-y-1 font-mono tabular-nums">
          <span className="font-sans text-slate-400">Phân bố lớp e⁻:</span>
          {shells.map((count, idx) => (
            <span key={SHELL_NAMES[idx]} className="text-slate-100 font-semibold">
              {SHELL_NAMES[idx]}:{count}
              {idx < shells.length - 1 ? <span className="text-slate-500 ml-2">·</span> : null}
            </span>
          ))}
        </div>
      </div>

      {/* State Legend Guide */}
      <div className="border-l border-white/12 pl-3 flex flex-col gap-1.5 text-[11px] text-slate-200">
        <div className="text-[10.5px] font-bold tracking-wide text-sky-300 mb-0.5">
          Trạng thái ở 25°C
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
          <span>Chất rắn</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
          <span>Chất lỏng (Br, Hg)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
          <span>Chất khí (11 nguyên tố)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-400 shrink-0" aria-hidden="true" />
          <span>Nhân tạo / Dự đoán</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold leading-none" aria-hidden="true">☢</span>
          <span>Nguyên tố phóng xạ</span>
        </div>
      </div>
    </div>
  );
};
