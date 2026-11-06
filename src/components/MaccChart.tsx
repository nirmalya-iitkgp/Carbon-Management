import React, { useState } from 'react';
import { MaccBarData } from '../types/carbon';

interface MaccChartProps {
  bars: MaccBarData[];
  effectiveCarbonPriceEur: number;
  onToggleLever: (leverId: string) => void;
}

export const MaccChart: React.FC<MaccChartProps> = ({
  bars,
  effectiveCarbonPriceEur,
  onToggleLever,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalKt = bars.length > 0 ? bars[bars.length - 1].xEndKt : 600;
  const minCost = -55;
  const maxCost = 165;
  const costRange = maxCost - minCost;

  const chartW = 760;
  const chartH = 290;
  const padL = 54;
  const padR = 20;
  const padT = 22;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const yForCost = (cost: number) => {
    const clamped = Math.min(maxCost, Math.max(minCost, cost));
    return padT + ((maxCost - clamped) / costRange) * plotH;
  };

  const zeroY = yForCost(0);
  const thresholdY = yForCost(effectiveCarbonPriceEur);

  const hoveredBar = bars.find((b) => b.lever.id === hoveredId) ?? null;

  return (
    <div className="bg-[#111B15] border border-[#22352A] rounded-md p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div>
          <h2 className="font-display text-base font-semibold text-[#ECF3EE]">
            Marginal Abatement Cost Curve (MACC)
          </h2>
          <p className="text-xs text-[#9CB0A4] mt-0.5">
            Bar width = annual abatement (ktCO₂e) · Bar height = marginal cost (€/tCO₂e) · Click bars to toggle capex
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#9CB0A4]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#84CC16] inline-block rounded-[2px]" />
            In-the-Money (&le; €{effectiveCarbonPriceEur})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#EF4444] inline-block rounded-[2px]" />
            Above Threshold
          </span>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded border border-[#22352A] bg-[#0B120E]">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Marginal Abatement Cost Curve Step-Bar Chart"
        >
          {/* Y-axis gridlines */}
          {[-40, 0, 40, 80, 120, 160].map((tick) => {
            const y = yForCost(tick);
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  y1={y}
                  x2={chartW - padR}
                  y2={y}
                  stroke={tick === 0 ? '#365242' : '#16231B'}
                  strokeWidth={tick === 0 ? 1.4 : 1}
                />
                <text
                  x={padL - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#9CB0A4"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  €{tick}
                </text>
              </g>
            );
          })}

          {/* Step-Bars */}
          {bars.map((bar) => {
            const x = padL + (bar.xStartKt / totalKt) * plotW;
            const w = Math.max(4, (bar.widthKt / totalKt) * plotW - 1.5);
            const cost = bar.lever.marginalCostEurPerTco2;
            const yVal = yForCost(cost);
            const y = cost >= 0 ? yVal : zeroY;
            const h = Math.max(2, Math.abs(yVal - zeroY));

            const isHovered = hoveredId === bar.lever.id;
            let fill = bar.inTheMoney ? '#84CC16' : '#EF4444';
            if (!bar.isActive) {
              fill = bar.inTheMoney ? '#365314' : '#5C1D1D';
            }

            return (
              <g
                key={bar.lever.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredId(bar.lever.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onToggleLever(bar.lever.id)}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={fill}
                  stroke={isHovered ? '#ECF3EE' : '#0B120E'}
                  strokeWidth={isHovered ? 1.5 : 0.8}
                  opacity={bar.isActive ? 0.92 : 0.45}
                />
                {w > 26 && (
                  <text
                    x={x + w / 2}
                    y={cost >= 0 ? y - 5 : y + h + 11}
                    textAnchor="middle"
                    fill="#9CB0A4"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {cost > 0 ? `+€${cost}` : `€${cost}`}
                  </text>
                )}
              </g>
            );
          })}

          {/* Active CBAM / ICP Price Threshold Line */}
          <line
            x1={padL}
            y1={thresholdY}
            x2={chartW - padR}
            y2={thresholdY}
            stroke="#F59E0B"
            strokeWidth="1.6"
            strokeDasharray="5 4"
          />
          <rect
            x={chartW - padR - 168}
            y={Math.max(padT, thresholdY - 18)}
            width="166"
            height="15"
            rx="2"
            fill="#16231B"
            stroke="#F59E0B"
            strokeWidth="0.8"
          />
          <text
            x={chartW - padR - 85}
            y={Math.max(padT + 10.5, thresholdY - 7.5)}
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="9.5"
            fontWeight="600"
            fontFamily="JetBrains Mono, monospace"
          >
            Arbitrage Hurdle: €{effectiveCarbonPriceEur}/t
          </text>

          {/* X-axis Cumulative Abatement Ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const kt = Math.round(totalKt * frac);
            const x = padL + frac * plotW;
            return (
              <text
                key={frac}
                x={x}
                y={chartH - 10}
                textAnchor={frac === 1 ? 'end' : frac === 0 ? 'start' : 'middle'}
                fill="#677D70"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {kt} ktCO₂e
              </text>
            );
          })}
        </svg>

        {/* Interactive Telemetry Readout Footer */}
        <div className="px-4 py-2.5 bg-[#16231B] border-t border-[#22352A] flex flex-wrap items-center justify-between gap-4 text-xs">
          {hoveredBar ? (
            <>
              <div className="flex items-center gap-2 text-[#ECF3EE]">
                <span
                  className={`font-semibold ${
                    hoveredBar.isActive ? 'text-[#84CC16]' : 'text-[#9CB0A4]'
                  }`}
                >
                  [{hoveredBar.isActive ? 'ACTIVE' : 'INACTIVE'}]
                </span>
                <span className="font-medium">{hoveredBar.lever.title}</span>
                <span className="text-[#677D70]">· {hoveredBar.lever.sector}</span>
              </div>
              <div className="flex items-center gap-4 font-mono-tabular">
                <span className="text-[#9CB0A4]">
                  Abatement:{' '}
                  <strong className="text-[#ECF3EE]">
                    {hoveredBar.lever.abatementKtCo2PerYr} kt/yr
                  </strong>
                </span>
                <span className="text-[#9CB0A4]">
                  Capex:{' '}
                  <strong className="text-[#ECF3EE]">
                    €{hoveredBar.lever.capexEurM.toFixed(1)}M
                  </strong>
                </span>
                <span className="text-[#9CB0A4]">
                  NPV:{' '}
                  <strong
                    className={
                      hoveredBar.npvEurM >= 0 ? 'text-[#84CC16]' : 'text-[#EF4444]'
                    }
                  >
                    {hoveredBar.npvEurM >= 0 ? '+' : ''}€{hoveredBar.npvEurM.toFixed(1)}M
                  </strong>
                </span>
                <span className="text-[#9CB0A4]">
                  IRR:{' '}
                  <strong className="text-[#ECF3EE]">
                    {hoveredBar.irrPct.toFixed(1)}%
                  </strong>
                </span>
              </div>
            </>
          ) : (
            <div className="text-[#9CB0A4]">
              Hover any MACC step-bar to inspect project capex, NPV, and IRR. Click to include or exclude from portfolio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
