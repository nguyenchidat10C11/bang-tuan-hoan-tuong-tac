import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  ChemicalElement,
  ElementCategoryKey,
  GROUP_ROMAN,
} from '../data/elementsData';
import { CenterInspector } from './CenterInspector';
import { ElementCell } from './ElementCell';

interface PeriodicGridProps {
  elements: ChemicalElement[];
  matchedZSet: Set<number>;
  hasActiveHighlightFilter: boolean;
  inspectedElement: ChemicalElement;
  selectedZ: number | null;
  activeCategory: ElementCategoryKey | null;
  onHoverElement: (el: ChemicalElement) => void;
  onSelectElement: (z: number, triggerEl: HTMLButtonElement | null) => void;
  onToggleCategory: (category: ElementCategoryKey) => void;
}

interface PressSession {
  active: boolean;
  startZ: number;
  currentZ: number;
  startTime: number;
  didScrub: boolean;
  pointerType: string;
  isTouchScrubLocked: boolean;
  touchTimer: number | null;
  suppressNextClick: boolean;
}

export const PeriodicGrid: React.FC<PeriodicGridProps> = ({
  elements,
  matchedZSet,
  hasActiveHighlightFilter,
  inspectedElement,
  selectedZ,
  activeCategory,
  onHoverElement,
  onSelectElement,
  onToggleCategory,
}) => {
  const [pressedZ, setPressedZ] = useState<number | null>(null);
  const [hoveredZ, setHoveredZ] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const elementByZ = useMemo(() => {
    const map = new Map<number, ChemicalElement>();
    for (const el of elements) {
      map.set(el.z, el);
    }
    return map;
  }, [elements]);

  const pressSessionRef = useRef<PressSession>({
    active: false,
    startZ: 0,
    currentZ: 0,
    startTime: 0,
    didScrub: false,
    pointerType: 'mouse',
    isTouchScrubLocked: false,
    touchTimer: null,
    suppressNextClick: false,
  });

  const clearTouchTimer = useCallback(() => {
    if (pressSessionRef.current.touchTimer !== null) {
      window.clearTimeout(pressSessionRef.current.touchTimer);
      pressSessionRef.current.touchTimer = null;
    }
  }, []);

  const updateScrubTargetAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      const session = pressSessionRef.current;
      if (!session.active) return;

      const hit = document.elementFromPoint(clientX, clientY);
      const tileBtn = hit?.closest<HTMLElement>('[data-element-z]');
      if (tileBtn) {
        const nextZ = Number(tileBtn.dataset.elementZ);
        if (Number.isInteger(nextZ) && elementByZ.has(nextZ)) {
          if (nextZ !== session.currentZ) {
            session.currentZ = nextZ;
            session.didScrub = true;
            setPressedZ(nextZ);
            const nextEl = elementByZ.get(nextZ);
            if (nextEl) onHoverElement(nextEl);
          }
          return;
        }
      }

      // If pointer dragged completely outside the periodic grid bounds, lower the elevated tile
      const gridRect = gridRef.current?.getBoundingClientRect();
      if (
        gridRect &&
        (clientX < gridRect.left ||
          clientX > gridRect.right ||
          clientY < gridRect.top ||
          clientY > gridRect.bottom)
      ) {
        if (session.currentZ !== 0) {
          session.currentZ = 0;
          session.didScrub = true;
          setPressedZ(null);
        }
      }
    },
    [elementByZ, onHoverElement]
  );

  const endPressSession = useCallback(
    (shouldCheckSuppress: boolean) => {
      const session = pressSessionRef.current;
      clearTouchTimer();
      if (!session.active) return;

      const heldMs = performance.now() - session.startTime;
      if (shouldCheckSuppress && (session.didScrub || heldMs >= 380)) {
        session.suppressNextClick = true;
        window.setTimeout(() => {
          pressSessionRef.current.suppressNextClick = false;
        }, 60);
      }

      session.active = false;
      session.isTouchScrubLocked = false;
      setPressedZ(null);
    },
    [clearTouchTimer]
  );

  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      const session = pressSessionRef.current;
      if (!session.active) return;
      if (session.pointerType === 'touch' && !session.isTouchScrubLocked) return;
      updateScrubTargetAtPoint(e.clientX, e.clientY);
    };

    const onWindowPointerUp = (e: PointerEvent) => {
      const wasActive = pressSessionRef.current.active;
      endPressSession(true);
      if (wasActive && e.pointerType !== 'touch') {
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const tileBtn = hit?.closest<HTMLElement>('[data-element-z]');
        const releasedZ = tileBtn ? Number(tileBtn.dataset.elementZ) : NaN;
        if (Number.isInteger(releasedZ) && elementByZ.has(releasedZ)) {
          setHoveredZ(releasedZ);
        } else {
          setHoveredZ(null);
        }
      }
    };

    const onWindowPointerCancel = () => {
      endPressSession(false);
      setHoveredZ(null);
    };

    const onWindowBlur = () => {
      endPressSession(false);
      setHoveredZ(null);
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerCancel);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerCancel);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [updateScrubTargetAtPoint, endPressSession, elementByZ]);

  // Non-passive touchmove listener so touch-scrubbing across tiles works smoothly without page scroll fighting
  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const onTouchMove = (e: TouchEvent) => {
      const session = pressSessionRef.current;
      if (!session.active || session.pointerType !== 'touch') return;
      if (!session.isTouchScrubLocked) return;

      const touch = e.touches[0];
      if (!touch) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      updateScrubTargetAtPoint(touch.clientX, touch.clientY);
    };

    gridEl.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      gridEl.removeEventListener('touchmove', onTouchMove);
    };
  }, [updateScrubTargetAtPoint]);

  const handleTilePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, el: ChemicalElement) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      clearTouchTimer();
      const container = scrollContainerRef.current;
      const hasHorizontalScroll = Boolean(
        container && container.scrollWidth > container.clientWidth + 2
      );

      const session = pressSessionRef.current;
      session.active = true;
      session.startZ = el.z;
      session.currentZ = el.z;
      session.startTime = performance.now();
      session.didScrub = false;
      session.pointerType = e.pointerType;
      session.suppressNextClick = false;
      session.isTouchScrubLocked =
        e.pointerType !== 'touch' || !hasHorizontalScroll;

      if (e.pointerType === 'touch' && hasHorizontalScroll) {
        // Holding >= 160ms on narrow touchscreens activates multi-tile scrub mode
        session.touchTimer = window.setTimeout(() => {
          if (pressSessionRef.current.active) {
            pressSessionRef.current.isTouchScrubLocked = true;
          }
        }, 160);
      }

      setHoveredZ(null);
      setPressedZ(el.z);
      onHoverElement(el);
    },
    [clearTouchTimer, onHoverElement]
  );

  const handleTileHoverStart = useCallback(
    (el: ChemicalElement) => {
      if (!pressSessionRef.current.active) {
        setHoveredZ(el.z);
        onHoverElement(el);
      }
    },
    [onHoverElement]
  );

  const handleTileHoverEnd = useCallback((z: number) => {
    setHoveredZ((prev) => (prev === z ? null : prev));
  }, []);

  const handleShouldPreventContextMenu = useCallback(() => {
    return pressSessionRef.current.active;
  }, []);

  const handleShouldSuppressClick = useCallback(() => {
    if (pressSessionRef.current.suppressNextClick) {
      pressSessionRef.current.suppressNextClick = false;
      return true;
    }
    return false;
  }, []);

  const handleTileSelect = useCallback(
    (z: number, triggerEl: HTMLButtonElement) => {
      onSelectElement(z, triggerEl);
    },
    [onSelectElement]
  );

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={scrollContainerRef}
        className="liquid-glass-panel rounded-2xl p-3 sm:p-4 overflow-x-auto custom-scrollbar"
      >
      <div
        ref={gridRef}
        className={`periodic-grid ${pressedZ !== null ? 'select-none' : ''}`}
        role="region"
        aria-label="Bảng tuần hoàn 118 nguyên tố hóa học"
      >
        {/* Corner Cell */}
        <div
          className="flex items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-[10px] font-bold text-slate-300"
          style={{ gridRow: 1, gridColumn: 1 }}
          title="Chu kỳ (hàng) \ Nhóm (cột)"
        >
          CK\N
        </div>

        {/* Group Headers 1..18 */}
        {Array.from({ length: 18 }, (_, i) => i + 1).map((groupNum) => (
          <div
            key={`group-${groupNum}`}
            className="flex flex-col items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            style={{ gridRow: 1, gridColumn: groupNum + 1 }}
          >
            <span className="text-[11px] font-bold text-slate-200 tabular-nums">
              {groupNum}
            </span>
            <span className="text-[8.5px] font-semibold text-slate-400 mt-0.5">
              {GROUP_ROMAN[groupNum]}
            </span>
          </div>
        ))}

        {/* Period Headers 1..7 */}
        {Array.from({ length: 7 }, (_, i) => i + 1).map((periodNum) => (
          <div
            key={`period-${periodNum}`}
            className="flex items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-[11px] font-bold text-slate-200 tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            style={{ gridRow: periodNum + 1, gridColumn: 1 }}
            title={`Chu kỳ ${periodNum}`}
          >
            {periodNum}
          </div>
        ))}

        {/* f-block Period Labels */}
        <div
          className="flex items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-[10px] font-bold text-slate-300 tabular-nums"
          style={{ gridRow: 10, gridColumn: 3 }}
          title="Họ Lantan (Chu kỳ 6)"
        >
          6*
        </div>
        <div
          className="flex items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-[10px] font-bold text-slate-300 tabular-nums"
          style={{ gridRow: 11, gridColumn: 3 }}
          title="Họ Actini (Chu kỳ 7)"
        >
          7*
        </div>

        {/* Center Inspector Card */}
        <CenterInspector
          element={inspectedElement}
          onInspectOpenModal={(z) => onSelectElement(z, null)}
        />

        {/* Lanthanide & Actinide Placeholder Buttons */}
        <button
          type="button"
          onClick={() => onToggleCategory('họ Lantan')}
          aria-pressed={activeCategory === 'họ Lantan'}
          aria-label="Lọc họ Lantan (57 đến 71)"
          className={`rounded-xl border border-dashed flex flex-col items-center justify-center p-1 text-center transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300 ${
            activeCategory === 'họ Lantan'
              ? 'border-pink-300/80 bg-pink-400/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'border-white/20 bg-white/[0.04] text-slate-200 hover:border-white/40 hover:bg-white/[0.10]'
          }`}
          style={{ gridRow: 7, gridColumn: 4 }}
        >
          <span className="text-[11px] font-bold tabular-nums">57–71</span>
          <span className="text-[9px] text-slate-300">La–Lu</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleCategory('họ Actini')}
          aria-pressed={activeCategory === 'họ Actini'}
          aria-label="Lọc họ Actini (89 đến 103)"
          className={`rounded-xl border border-dashed flex flex-col items-center justify-center p-1 text-center transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-300 ${
            activeCategory === 'họ Actini'
              ? 'border-fuchsia-300/80 bg-fuchsia-400/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'border-white/20 bg-white/[0.04] text-slate-200 hover:border-white/40 hover:bg-white/[0.10]'
          }`}
          style={{ gridRow: 8, gridColumn: 4 }}
        >
          <span className="text-[11px] font-bold tabular-nums">89–103</span>
          <span className="text-[9px] text-slate-300">Ac–Lr</span>
        </button>

        {/* 118 Element Cells */}
        {elements.map((el) => {
          const isMatched = matchedZSet.has(el.z);
          const isSelected = selectedZ === el.z;
          const isPressed = pressedZ === el.z;
          const isHovered = pressedZ === null && hoveredZ === el.z;

          return (
            <ElementCell
              key={el.z}
              element={el}
              isMatched={isMatched}
              isSelected={isSelected}
              isPressed={isPressed}
              isHovered={isHovered}
              hasActiveHighlightFilter={hasActiveHighlightFilter}
              onTilePointerDown={handleTilePointerDown}
              onTileHoverStart={handleTileHoverStart}
              onTileHoverEnd={handleTileHoverEnd}
              onTileFocus={onHoverElement}
              onTileSelect={handleTileSelect}
              shouldPreventContextMenu={handleShouldPreventContextMenu}
              shouldSuppressClick={handleShouldSuppressClick}
            />
          );
        })}
      </div>
    </div>
    </MotionConfig>
  );
};
