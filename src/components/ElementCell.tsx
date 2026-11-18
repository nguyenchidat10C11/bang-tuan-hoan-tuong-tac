import React from 'react';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { CATEGORIES, ChemicalElement } from '../data/elementsData';
import {
  getElementState,
  getElementTileMotionTarget,
  getGridPosition,
  isRadioactive,
} from '../logic/elementLogic';

const TILE_SPRING_TRANSITION: Transition = {
  y: { type: 'spring', stiffness: 520, damping: 24, mass: 0.65 },
  scale: { type: 'spring', stiffness: 520, damping: 24, mass: 0.65 },
  opacity: { duration: 0.16, ease: 'easeOut' },
  boxShadow: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  borderColor: { duration: 0.2, ease: 'easeOut' },
};

const GLASS_OVERLAY_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1],
};

export interface ElementCellProps {
  element: ChemicalElement;
  isMatched: boolean;
  isSelected: boolean;
  isPressed: boolean;
  isHovered: boolean;
  hasActiveHighlightFilter: boolean;
  onTilePointerDown: (
    e: React.PointerEvent<HTMLButtonElement>,
    el: ChemicalElement
  ) => void;
  onTileHoverStart: (el: ChemicalElement) => void;
  onTileHoverEnd: (z: number) => void;
  onTileFocus: (el: ChemicalElement) => void;
  onTileSelect: (z: number, triggerEl: HTMLButtonElement) => void;
  shouldPreventContextMenu: () => boolean;
  shouldSuppressClick: () => boolean;
}

export const ElementCell: React.FC<ElementCellProps> = React.memo(
  ({
    element: el,
    isMatched,
    isSelected,
    isPressed,
    isHovered,
    hasActiveHighlightFilter,
    onTilePointerDown,
    onTileHoverStart,
    onTileHoverEnd,
    onTileFocus,
    onTileSelect,
    shouldPreventContextMenu,
    shouldSuppressClick,
  }) => {
    const catInfo = CATEGORIES[el.category];
    const stateInfo = getElementState(el.z);
    const radioactive = isRadioactive(el.z);
    const pos = getGridPosition(el);

    const motionTarget = getElementTileMotionTarget({
      isPressed,
      isHovered,
      isSelected,
      isMatched,
      hasActiveHighlightFilter,
    });

    const saturatePct = isPressed
      ? 190
      : isHovered && isMatched
      ? 175
      : isSelected
      ? 165
      : 135;

    const showFrostedGlassLayer = motionTarget.backdropBlur > 0;
    const activeBackdropFilter = showFrostedGlassLayer
      ? `blur(${motionTarget.backdropBlur}px) saturate(${saturatePct}%)`
      : 'none';

    const animatedBorderColor = isPressed
      ? 'rgba(255, 255, 255, 0.96)'
      : isSelected
      ? 'rgba(255, 255, 255, 0.9)'
      : isHovered && isMatched
      ? 'rgba(255, 255, 255, 0.8)'
      : hasActiveHighlightFilter && isMatched
      ? 'rgba(125, 211, 252, 0.9)'
      : isMatched
      ? 'rgba(255, 255, 255, 0.18)'
      : 'rgba(255, 255, 255, 0.08)';

    const animatedBoxShadow = isPressed
      ? `0 24px 42px -8px rgba(2, 6, 23, 0.94), 0 0 30px 0 ${catInfo.color}88, inset 0 1px 0 0 rgba(255, 255, 255, 0.78), inset 0 0 18px 0 ${catInfo.color}42`
      : isHovered && isMatched
      ? `0 16px 30px -8px rgba(2, 6, 23, 0.85), 0 0 22px -2px ${catInfo.color}68, inset 0 1px 0 0 rgba(255, 255, 255, 0.62), inset 0 0 14px 0 ${catInfo.color}30`
      : isSelected
      ? `0 14px 26px -8px rgba(2, 6, 23, 0.8), 0 0 18px -3px ${catInfo.color}55, inset 0 1px 0 0 rgba(255, 255, 255, 0.54)`
      : hasActiveHighlightFilter && isMatched
      ? `0 8px 20px -6px rgba(2, 6, 23, 0.75), 0 0 16px rgba(56, 189, 248, 0.42), inset 0 1px 0 0 rgba(255, 255, 255, 0.38)`
      : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.28), inset 0 -1px 0 0 rgba(255, 255, 255, 0.05), 0 6px 16px -10px rgba(2, 6, 23, 0.65)';

    return (
      <motion.button
        type="button"
        id={`element-cell-${el.z}`}
        data-testid={`element-cell-${el.z}`}
        data-element-z={el.z}
        data-pressed={isPressed ? 'true' : 'false'}
        data-hovered={isHovered ? 'true' : 'false'}
        aria-label={`${el.symbol} - ${el.nameVi}, Số hiệu ${el.z}, NTK ${el.atomicMass}, ${catInfo.label}`}
        initial={false}
        animate={{
          y: motionTarget.y,
          scale: motionTarget.scale,
          opacity: motionTarget.opacity,
          borderColor: animatedBorderColor,
          boxShadow: animatedBoxShadow,
        }}
        transition={TILE_SPRING_TRANSITION}
        onPointerDown={(e) => onTilePointerDown(e, el)}
        onMouseEnter={() => onTileHoverStart(el)}
        onMouseLeave={() => onTileHoverEnd(el.z)}
        onFocus={() => onTileFocus(el)}
        onContextMenu={(e) => {
          if (shouldPreventContextMenu()) {
            e.preventDefault();
          }
        }}
        onClick={(e) => {
          if (e.detail !== 0 && shouldSuppressClick()) {
            return;
          }
          onTileSelect(el.z, e.currentTarget);
        }}
        style={{
          gridRow: pos.row,
          gridColumn: pos.col,
          zIndex: motionTarget.zIndex,
          borderTopColor:
            isPressed || isHovered ? catInfo.color : catInfo.borderTopColor,
          borderTopWidth: '2.5px',
          background: isPressed
            ? `linear-gradient(150deg, ${catInfo.color}55 0%, rgba(255, 255, 255, 0.22) 44%, rgba(12, 20, 42, 0.88) 100%)`
            : isHovered && isMatched
            ? `linear-gradient(152deg, ${catInfo.color}3c 0%, rgba(255, 255, 255, 0.16) 44%, rgba(10, 17, 36, 0.78) 100%)`
            : `linear-gradient(155deg, ${catInfo.tintBg} 0%, rgba(255, 255, 255, 0.05) 42%, rgba(9, 15, 32, 0.64) 100%)`,
        }}
        className={`liquid-tile relative rounded-xl px-1.5 py-1 flex flex-col justify-between text-left border min-h-[60px] overflow-hidden cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-300 ${
          isPressed
            ? 'ring-1 ring-white/80'
            : isSelected
            ? 'ring-2 ring-white/75'
            : isMatched
            ? ''
            : 'grayscale-[70%]'
        }`}
      >
        {/* Active-only frosted backdrop-blur + specular border-glow layer */}
        <AnimatePresence>
          {showFrostedGlassLayer && (
            <motion.span
              key="liquid-glass-overlay"
              data-testid={`element-glass-overlay-${el.z}`}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: motionTarget.borderGlowOpacity }}
              exit={{ opacity: 0 }}
              transition={GLASS_OVERLAY_TRANSITION}
              className="pointer-events-none absolute inset-0 rounded-[11px]"
              style={{
                backdropFilter: activeBackdropFilter,
                WebkitBackdropFilter: activeBackdropFilter,
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.30) 0%, rgba(255, 255, 255, 0.06) 36%, transparent 62%, ${catInfo.color}2a 100%)`,
                boxShadow: `inset 0 0 0 1px ${catInfo.color}66`,
              }}
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 flex items-center justify-between w-full leading-none gap-0.5">
          <span className="text-[10.5px] font-bold text-slate-300 tabular-nums">
            {el.z}
          </span>
          <span className="flex items-center gap-0.5">
            {radioactive && (
              <span
                className="text-[9px] text-amber-400 leading-none"
                title="Nguyên tố phóng xạ"
              >
                ☢
              </span>
            )}
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: stateInfo.dotColor }}
              title={`Trạng thái 25°C: ${stateInfo.label}`}
            />
          </span>
        </div>

        <div className="relative z-10 text-[17px] font-extrabold tracking-tight text-center text-white leading-tight w-full">
          {el.symbol}
        </div>

        <div className="relative z-10 text-[9px] font-medium text-center text-slate-300 truncate w-full leading-tight">
          {el.nameVi}
        </div>
      </motion.button>
    );
  }
);

ElementCell.displayName = 'ElementCell';
