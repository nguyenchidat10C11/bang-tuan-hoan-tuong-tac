/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChemicalElement,
  ELEMENTS,
  ElementCategoryKey,
} from './data/elementsData';
import { matchesElementFilter, StateFilterKey } from './logic/elementLogic';
import { HeaderControls } from './components/HeaderControls';
import { PeriodicGrid } from './components/PeriodicGrid';
import { ElementDetailModal } from './components/ElementDetailModal';
import { ElectronConverterModal } from './components/ElectronConverterModal';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ElementCategoryKey | null>(null);
  const [activeStateFilter, setActiveStateFilter] = useState<StateFilterKey>('all');
  const [hoveredElement, setHoveredElement] = useState<ChemicalElement>(ELEMENTS[0]);
  const [modalZ, setModalZ] = useState<number | null>(null);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [orbitalViewMode, setOrbitalViewMode] = useState<'condensed' | 'full'>('condensed');

  const lastFocusedCellRef = useRef<HTMLButtonElement | null>(null);
  const lastConverterTriggerRef = useRef<HTMLElement | null>(null);

  const matchedElements = useMemo(() => {
    return ELEMENTS.filter((el) =>
      matchesElementFilter(el, {
        query: searchQuery,
        category: activeCategory,
        stateFilter: activeStateFilter,
      })
    );
  }, [searchQuery, activeCategory, activeStateFilter]);

  const matchedZSet = useMemo(
    () => new Set(matchedElements.map((el) => el.z)),
    [matchedElements]
  );

  const hasActiveHighlightFilter = Boolean(
    searchQuery.trim() || activeStateFilter !== 'all'
  );

  const hasAnyFilter = Boolean(
    searchQuery.trim() || activeCategory !== null || activeStateFilter !== 'all'
  );

  // Sync inspector to first match whenever active filters change and produce matches
  const inspectedElement = useMemo(() => {
    if (hasAnyFilter && matchedElements.length > 0 && !matchedZSet.has(hoveredElement.z)) {
      return matchedElements[0];
    }
    return hoveredElement;
  }, [hasAnyFilter, matchedElements, matchedZSet, hoveredElement]);

  const modalElement = useMemo(
    () => (modalZ !== null ? ELEMENTS[modalZ - 1] ?? null : null),
    [modalZ]
  );

  const handleToggleCategory = useCallback((cat: ElementCategoryKey) => {
    setActiveCategory((prev) => (prev === cat ? null : cat));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setActiveCategory(null);
    setActiveStateFilter('all');
    setHoveredElement(ELEMENTS[0]);
  }, []);

  const handleSelectElement = useCallback(
    (z: number, triggerEl: HTMLButtonElement | null) => {
      if (triggerEl) {
        lastFocusedCellRef.current = triggerEl;
      }
      setModalZ(z);
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setModalZ(null);
    requestAnimationFrame(() => {
      lastFocusedCellRef.current?.focus();
    });
  }, []);

  const handleNavigateModal = useCallback((targetZ: number) => {
    setModalZ(targetZ);
    const targetEl = ELEMENTS[targetZ - 1];
    if (targetEl) setHoveredElement(targetEl);
  }, []);

  const handleOpenConverter = useCallback(() => {
    lastConverterTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsConverterOpen(true);
  }, []);

  const handleCloseConverter = useCallback(() => {
    setIsConverterOpen(false);
    requestAnimationFrame(() => {
      lastConverterTriggerRef.current?.focus();
    });
  }, []);

  const handleOpenDetailFromConverter = useCallback((z: number) => {
    setIsConverterOpen(false);
    const targetEl = ELEMENTS[z - 1];
    if (targetEl) {
      setHoveredElement(targetEl);
    }
    setModalZ(z);
  }, []);

  // Global Escape resets active filters when both modals are closed
  useEffect(() => {
    const onWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalZ === null && !isConverterOpen && hasAnyFilter) {
        handleResetFilters();
      }
    };
    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [modalZ, isConverterOpen, hasAnyFilter, handleResetFilters]);

  return (
    <div className="relative min-h-screen liquid-canvas text-slate-50 overflow-x-clip">
      {/* Subtle refraction depth orbs behind glass surfaces */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-28 left-[12%] h-[420px] w-[420px] rounded-full bg-sky-400/12 blur-[90px]" />
        <div className="absolute top-[28%] right-[8%] h-[380px] w-[380px] rounded-full bg-indigo-400/12 blur-[95px]" />
        <div className="absolute -bottom-24 left-[42%] h-[360px] w-[460px] rounded-full bg-teal-400/10 blur-[95px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-[1440px] px-3 py-4 sm:px-5 sm:py-5 flex flex-col gap-3.5">
        <HeaderControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeCategory}
          onToggleCategory={handleToggleCategory}
          activeStateFilter={activeStateFilter}
          onStateFilterChange={setActiveStateFilter}
          matchedCount={matchedElements.length}
          onOpenConverter={handleOpenConverter}
        />

        {matchedElements.length === 0 && (
          <div
            role="status"
            data-testid="empty-filter-banner"
            className="liquid-glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl border-amber-300/35 px-4 py-2.5 text-sm text-amber-100"
          >
            <span>
              Không tìm thấy nguyên tố nào phù hợp với bộ lọc hiện tại.
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="liquid-glass-btn rounded-lg border-amber-300/40 px-3 py-1.5 text-xs font-bold text-amber-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300 whitespace-nowrap shrink-0"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}

        <PeriodicGrid
          elements={ELEMENTS}
          matchedZSet={matchedZSet}
          hasActiveHighlightFilter={hasActiveHighlightFilter}
          inspectedElement={inspectedElement}
          selectedZ={modalZ}
          activeCategory={activeCategory}
          onHoverElement={setHoveredElement}
          onSelectElement={handleSelectElement}
          onToggleCategory={handleToggleCategory}
        />
      </main>

      <ElementDetailModal
        element={modalElement}
        orbitalViewMode={orbitalViewMode}
        onToggleOrbitalViewMode={() =>
          setOrbitalViewMode((prev) =>
            prev === 'condensed' ? 'full' : 'condensed'
          )
        }
        onClose={handleCloseModal}
        onNavigate={handleNavigateModal}
      />

      <ElectronConverterModal
        isOpen={isConverterOpen}
        orbitalViewMode={orbitalViewMode}
        onToggleOrbitalViewMode={() =>
          setOrbitalViewMode((prev) =>
            prev === 'condensed' ? 'full' : 'condensed'
          )
        }
        onClose={handleCloseConverter}
        onOpenElementDetail={handleOpenDetailFromConverter}
      />
    </div>
  );
}
