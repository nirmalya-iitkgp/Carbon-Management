import React, { useState } from 'react';
import { formatCurrencyValue } from '../engine/carbonEngine';
import { CurrencyCode, TrajectoryYearPoint } from '../types/carbon';

interface PhaseInTrajectoryChartProps {
  trajectory: TrajectoryYearPoint[];
  reportingCurrency: CurrencyCode;
  activePhaseInPct: number;
  onSelectPhaseInPct: (pct: number) => void;
}

export const PhaseInTrajectoryChart: React.FC<PhaseInTrajectoryChartProps> = ({
  trajectory,
  reportingCurrency,
  activePhaseInPct,
  onSelectPhaseInPct,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const chartW = 760;
  const chartH = 260;
  const padL = 56;
  const padR = 56;
  const padT = 24;
  const padB = 38;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxLiability = Math.max(
    10,
    ...trajectory.map((t) => t.unmitigatedLiabilityEurM * 1.1)
  );
  const maxEts = Math.max(
    120,
    ...trajectory.map((t) => t.projectedEtsPriceEur * 1.12)
  );

  const yForLiability = (val: number) =>
    padT + ((maxLiability - Math.max(0, val)) / maxLiability) * plotH;
  const yForEts = (ets: number) =>
    padT + ((maxEts - Math.max(0, ets)) / maxEts) * plotH;

  const colW = plotW / Math.max(1, trajectory.length);
  const barW = Math.min(36, colW * 0.56);

  const etsLinePath = trajectory
    .map((pt, idx) => {
      const cx = padL + idx * colW + colW / 2;
      const cy = yForEts(pt.projectedEtsPriceEur);
      return `${idx === 0 ? 'M' : 'L'} ${cx} ${cy}`;
    })
    .join(' ');

  const activePoint =
    trajectory.find((t) => t.year === hoveredYear) ??
    trajectory.find((t) => Math.abs(t.phaseOutPct - activePhaseInPct) < 0.5) ??
    trajectory[0];

  return (
    <section
      aria-label="Multi-Year CBAM Phase-In Trajectory 2026 to 2034"
      className="bg-[#111B15] border border-[#22352A] rounded-md p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div>
          <h2 className="font-display text-base font-semibold text-[#ECF3EE]">
            Multi-Year CBAM Phase-In Trajectory (2026–2034)
          </h2>
          <p className="text-xs text-[#9CB0A4] mt-0.5">
            Statutory EU CBAM free-allocation phase-out (2.5% → 100%) vs. projected EU ETS price curve · Click any year to simulate
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#9CB0A4]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#EF4444] inline-block rounded-[2px]" />
            Net CBAM Liability
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#84CC16]/35 border border-[#84CC16] inline-block rounded-[2px]" />
            Abated / Avoided Tax
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#F59E0B] inline-block" />
            Projected EU ETS
          </span>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded border border-[#22352A] bg-[#0B120E]">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-auto block select-none"
          role="img"
          aria-label="2026 to 2034 CBAM Phase-In Waterfall and EU ETS Price Trajectory"
        >
          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = padT + frac * plotH;
            const liabVal = maxLiability * (1 - frac);
            const etsVal = maxEts * (1 - frac);
            return (
              <g key={frac}>
                <line
                  x1={padL}
                  y1={y}
                  x2={chartW - padR}
                  y2={y}
                  stroke="#16231B"
                  strokeWidth="1"
                />
                <text
                  x={padL - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#9CB0A4"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatCurrencyValue(liabVal, reportingCurrency, 0)}M
                </text>
                <text
                  x={chartW - padR + 8}
                  y={y + 3.5}
                  textAnchor="start"
                  fill="#F59E0B"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatCurrencyValue(etsVal, reportingCurrency, 0)}
                </text>
              </g>
            );
          })}

          {/* Waterfall / Stacked Year Bars */}
          {trajectory.map((pt, idx) => {
            const cx = padL + idx * colW + colW / 2;
            const x = cx - barW / 2;
            const yUnmit = yForLiability(pt.unmitigatedLiabilityEurM);
            const yNet = yForLiability(pt.netLiabilityEurM);
            const baseY = padT + plotH;

            const isSelected = Math.abs(pt.phaseOutPct - activePhaseInPct) < 0.5;
            const isHovered = hoveredYear === pt.year;

            return (
              <g
                key={pt.year}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredYear(pt.year)}
                onMouseLeave={() => setHoveredYear(null)}
                onClick={() => onSelectPhaseInPct(pt.phaseOutPct)}
              >
                {/* Avoided Tax Ghost Cap */}
                <rect
                  x={x}
                  y={yUnmit}
                  width={barW}
                  height={Math.max(1, yNet - yUnmit)}
                  fill="#84CC16"
                  fillOpacity="0.22"
                  stroke="#84CC16"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                {/* Net CBAM Liability Bar */}
                <rect
                  x={x}
                  y={yNet}
                  width={barW}
                  height={Math.max(2, baseY - yNet)}
                  fill={isSelected ? '#EF4444' : '#B91C1C'}
                  stroke={isSelected || isHovered ? '#ECF3EE' : '#0B120E'}
                  strokeWidth={isSelected || isHovered ? 1.4 : 0.8}
                />
                {/* Year & Statutory Phase-Out % */}
                <text
                  x={cx}
                  y={baseY + 14}
                  textAnchor="middle"
                  fill={isSelected ? '#84CC16' : '#ECF3EE'}
                  fontSize="10"
                  fontWeight={isSelected ? '700' : '500'}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {pt.year}
                </text>
                <text
                  x={cx}
                  y={baseY + 26}
                  textAnchor="middle"
                  fill="#677D70"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {pt.phaseOutPct}%
                </text>
              </g>
            );
          })}

          {/* Projected EU ETS Price Curve */}
          <path
            d={etsLinePath}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          {trajectory.map((pt, idx) => {
            const cx = padL + idx * colW + colW / 2;
            const cy = yForEts(pt.projectedEtsPriceEur);
            return (
              <circle
                key={`ets-${pt.year}`}
                cx={cx}
                cy={cy}
                r="3.2"
                fill="#0B120E"
                stroke="#F59E0B"
                strokeWidth="1.8"
              />
            );
          })}
        </svg>

        {/* Year Telemetry Bar */}
        {activePoint && (
          <div className="px-4 py-2.5 bg-[#16231B] border-t border-[#22352A] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#ECF3EE]">
              <span className="font-mono-tabular font-semibold text-[#84CC16]">
                FY {activePoint.year}
              </span>
              <span>·</span>
              <span className="text-[#9CB0A4]">
                Statutory Free-Allocation Phase-Out:{' '}
                <strong className="text-[#ECF3EE] font-mono-tabular">
                  {activePoint.phaseOutPct}%
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-5 font-mono-tabular">
              <span className="text-[#9CB0A4]">
                Projected EU ETS:{' '}
                <strong className="text-[#F59E0B]">
                  {formatCurrencyValue(
                    activePoint.projectedEtsPriceEur,
                    reportingCurrency,
                    0
                  )}
                  /t
                </strong>
              </span>
              <span className="text-[#9CB0A4]">
                Net CBAM:{' '}
                <strong className="text-[#EF4444]">
                  {formatCurrencyValue(
                    activePoint.netLiabilityEurM,
                    reportingCurrency,
                    2
                  )}
                  M
                </strong>
              </span>
              <span className="text-[#9CB0A4]">
                Avoided Tax:{' '}
                <strong className="text-[#84CC16]">
                  {formatCurrencyValue(
                    activePoint.avoidedTaxEurM,
                    reportingCurrency,
                    2
                  )}
                  M
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
