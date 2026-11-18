import React from 'react';
import { Atom, Search, X } from 'lucide-react';
import { CATEGORIES, ElementCategoryKey } from '../data/elementsData';
import { StateFilterKey } from '../logic/elementLogic';

interface HeaderControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategory: ElementCategoryKey | null;
  onToggleCategory: (category: ElementCategoryKey) => void;
  activeStateFilter: StateFilterKey;
  onStateFilterChange: (state: StateFilterKey) => void;
  matchedCount: number;
  onOpenConverter: () => void;
}

const STATE_OPTIONS: { key: StateFilterKey; label: string; dotColor?: string; prefix?: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'solid', label: 'Rắn', dotColor: '#94a3b8' },
  { key: 'liquid', label: 'Lỏng', dotColor: '#38bdf8' },
  { key: 'gas', label: 'Khí', dotColor: '#34d399' },
  { key: 'radioactive', label: 'Phóng xạ', prefix: '☢' },
];

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onToggleCategory,
  activeStateFilter,
  onStateFilterChange,
  matchedCount,
  onOpenConverter,
}) => {
  return (
    <header className="liquid-glass-panel flex flex-col gap-3 rounded-2xl px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <svg
            className="h-9 w-9 shrink-0"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <circle cx="24" cy="24" r="4.5" fill="#22d3ee" />
            <g className="bohr-shell-spin" style={{ transformOrigin: '24px 24px', '--spin-dur': '14s' } as React.CSSProperties}>
              <ellipse
                cx="24"
                cy="24"
                rx="20"
                ry="7.5"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.6"
                transform="rotate(30 24 24)"
                opacity="0.85"
              />
              <circle cx="41" cy="34" r="2.2" fill="#f8fafc" />
            </g>
            <g className="bohr-shell-spin-reverse" style={{ transformOrigin: '24px 24px', '--spin-dur': '18s' } as React.CSSProperties}>
              <ellipse
                cx="24"
                cy="24"
                rx="20"
                ry="7.5"
                fill="none"
                stroke="#34d399"
                strokeWidth="1.6"
                transform="rotate(-30 24 24)"
                opacity="0.85"
              />
              <circle cx="7" cy="34" r="2.2" fill="#34d399" />
            </g>
            <ellipse
              cx="24"
              cy="24"
              rx="20"
              ry="7.5"
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.4"
              transform="rotate(90 24 24)"
              opacity="0.6"
            />
          </svg>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-50 leading-tight">
              Bảng Tuần Hoàn Hóa Học
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              118 nguyên tố IUPAC · Cấu hình electron, mô hình Bohr &amp; sơ đồ Orbital ·{' '}
              <span className="font-mono tabular-nums text-cyan-300">{matchedCount}/118</span> hiển thị
            </p>
          </div>
        </div>

        {/* Interactive State Filters & Search */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-start lg:justify-end min-w-0">
          <div
            className="liquid-glass-well flex items-center gap-1 rounded-xl p-1 overflow-x-auto max-w-full custom-scrollbar"
            role="toolbar"
            aria-label="Lọc theo trạng thái ở 25°C"
          >
            {STATE_OPTIONS.map((opt) => {
              const isActive = activeStateFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onStateFilterChange(opt.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 cursor-pointer ${
                    isActive
                      ? 'liquid-glass-btn-active text-white'
                      : 'text-slate-300 hover:bg-white/[0.08] hover:text-white border border-transparent'
                  }`}
                >
                  {opt.dotColor && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: opt.dotColor }}
                      aria-hidden="true"
                    />
                  )}
                  {opt.prefix && (
                    <span className="text-amber-300" aria-hidden="true">
                      {opt.prefix}
                    </span>
                  )}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 min-w-[220px] max-w-full sm:max-w-[330px]">
            <label htmlFor="element-search-input" className="sr-only">
              Tìm kiếm nguyên tố hóa học
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300/80"
              aria-hidden="true"
            />
            <input
              id="element-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm tên, ký hiệu (Fe), Z (26)..."
              autoComplete="off"
              className="liquid-glass-well w-full rounded-xl py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-300 hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenConverter}
            className="liquid-glass-btn-active inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 whitespace-nowrap shrink-0"
          >
            <Atom className="h-4 w-4 text-sky-200 shrink-0" aria-hidden="true" />
            <span>Chuyển đổi e⁻</span>
          </button>
        </div>
      </div>

      {/* Category Filter Toolbar */}
      <div
        className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 pt-2.5 border-t border-white/10 overflow-x-auto custom-scrollbar"
        role="toolbar"
        aria-label="Bộ lọc phân loại nguyên tố"
      >
        {Object.values(CATEGORIES).map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onToggleCategory(cat.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 cursor-pointer ${
                isActive
                  ? 'border-white/55 bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]'
                  : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:bg-white/[0.10] hover:text-white'
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: cat.color }}
                aria-hidden="true"
              />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
