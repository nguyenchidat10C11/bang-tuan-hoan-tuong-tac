import React from 'react';
import { SHELL_NAMES } from '../data/elementsData';
import { calcShellDistribution } from '../logic/elementLogic';

interface BohrModelSvgProps {
  atomicNumber: number;
  configFull: string;
  accentColor: string;
}

export const BohrModelSvg: React.FC<BohrModelSvgProps> = ({
  atomicNumber,
  configFull,
  accentColor,
}) => {
  const shells = calcShellDistribution(configFull);
  const k = shells.length;
  const cx = 110;
  const cy = 110;
  const minR = 32;
  const maxR = 96;

  return (
    <div className="liquid-glass-well w-full rounded-2xl p-3.5 flex flex-col items-center gap-2">
      <div className="text-[11px] font-bold tracking-wide text-sky-300">
        Mô hình nguyên tử Bohr
      </div>

      <svg
        className="w-[184px] h-[184px] overflow-visible"
        viewBox="0 0 220 220"
        aria-label={`Mô hình nguyên tử Bohr với ${shells.length} lớp electron`}
      >
        <defs>
          <radialGradient id={`nucGlow-${atomicNumber}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="48%" stopColor={accentColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.2" />
          </radialGradient>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={18}
          fill={`url(#nucGlow-${atomicNumber})`}
          stroke={accentColor}
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fill="#060b16"
          fontSize="11"
          fontWeight="800"
        >
          {atomicNumber}+
        </text>

        {shells.map((count, idx) => {
          const r = k === 1 ? 56 : minR + (idx / (k - 1)) * (maxR - minR);
          const dur = 12 + idx * 5;
          const isReverse = idx % 2 === 1;
          const dotRadius = count > 18 ? 2.3 : 3.1;

          return (
            <g key={`shell-${idx}`}>
              <circle
                cx={cx}
                cy={cy}
                r={Number(r.toFixed(1))}
                fill="none"
                stroke="rgba(148, 163, 184, 0.28)"
                strokeWidth={1}
                strokeDasharray="3 2"
              />
              <g transform={`translate(${cx}, ${cy})`}>
                <g
                  className={isReverse ? 'bohr-shell-spin-reverse' : 'bohr-shell-spin'}
                  style={{ '--spin-dur': `${dur}s` } as React.CSSProperties}
                >
                  {Array.from({ length: count }, (_, j) => {
                    const angle = (2 * Math.PI * j) / count - Math.PI / 2;
                    const ex = Number((r * Math.cos(angle)).toFixed(2));
                    const ey = Number((r * Math.sin(angle)).toFixed(2));
                    return (
                      <circle
                        key={`e-${idx}-${j}`}
                        cx={ex}
                        cy={ey}
                        r={dotRadius}
                        fill="#38bdf8"
                        stroke="#060b16"
                        strokeWidth={0.6}
                      />
                    );
                  })}
                </g>
              </g>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[11px] font-mono tabular-nums text-slate-300">
        {shells.map((cnt, idx) => {
          const shellLabel = SHELL_NAMES[idx] ?? `Lớp ${idx + 1}`;
          return (
            <span key={shellLabel}>
              <span className="text-slate-400">{shellLabel}:</span>
              <span className="font-semibold text-slate-100">{cnt}</span>
              {idx < shells.length - 1 ? <span className="text-slate-600 ml-2">·</span> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
};
