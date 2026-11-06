import React, { useState } from 'react';
import { REGIME_MULTIPLIERS } from '../data/portfolioData';
import { formatCurrencyValue } from '../engine/carbonEngine';
import { CurrencyCode, DestinationRegime, RouteExposureResult } from '../types/carbon';

interface GlobalCbamMapProps {
  routes: RouteExposureResult[];
  euCbamPriceEur: number;
  reportingCurrency: CurrencyCode;
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string | null) => void;
}

const REGIME_HUBS: {
  regime: DestinationRegime;
  x: number;
  y: number;
  label: string;
}[] = [
  { regime: 'EU-27 CBAM', x: 564, y: 188, label: 'EU-27 CBAM' },
  { regime: 'UK CBAM', x: 528, y: 184, label: 'UK CBAM' },
  { regime: 'US CCA', x: 244, y: 272, label: 'US CCA' },
  { regime: 'Canada OBPS', x: 326, y: 192, label: 'Canada OBPS' },
  { regime: 'Japan GX', x: 986, y: 246, label: 'Japan GX' },
];

export const GlobalCbamMap: React.FC<GlobalCbamMapProps> = ({
  routes,
  euCbamPriceEur,
  reportingCurrency,
  selectedRouteId,
  onSelectRoute,
}) => {
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);

  const activeRoute =
    routes.find((r) => r.entry.id === (hoveredRouteId ?? selectedRouteId)) ?? null;

  return (
    <div className="bg-[#111B15] border border-[#22352A] rounded-md p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div>
          <h2 className="font-display text-base font-semibold text-[#ECF3EE]">
            Global CBAM Tariff &amp; Trade Corridor Overlay
          </h2>
          <p className="text-xs text-[#9CB0A4] mt-0.5">
            Click any trade arc to isolate route-level carbon border exposure and origin credit deductions
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#9CB0A4]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#EF4444] inline-block" />
            High Tariff Exposure
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#84CC16] inline-block" />
            Low-Carbon / Switched
          </span>
          {selectedRouteId && (
            <button
              type="button"
              onClick={() => onSelectRoute(null)}
              className="text-xs font-medium text-[#84CC16] hover:underline cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Interactive SVG World Map (1100x650 = exact 2x of 550x325 world silhouette) */}
      <div className="relative w-full overflow-hidden rounded border border-[#22352A] bg-[#0B120E]">
        <svg
          viewBox="0 0 1100 650"
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Global CBAM Trade Routes and Carbon Tariff Map"
        >
          {/* Subtle latitude/longitude grid */}
          <g stroke="#142019" strokeWidth="1">
            {[130, 260, 390, 520].map((y) => (
              <line key={`lat-${y}`} x1="0" y1={y} x2="1100" y2={y} />
            ))}
            {[220, 440, 660, 880].map((x) => (
              <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="650" />
            ))}
          </g>

          {/* Uploaded World Map Silhouette tinted to Industrial Forest Slate */}
          <image
            href="/assets/aistudio/image_c6065888.png"
            x="0"
            y="0"
            width="1100"
            height="650"
            preserveAspectRatio="none"
            style={{
              filter:
                'invert(1) brightness(0.22) sepia(0.35) hue-rotate(85deg) contrast(1.15)',
              opacity: 0.92,
            }}
          />

          {/* Trade Route Arcs */}
          {routes.map((route) => {
            const { x: x1, y: y1 } = route.activeOriginCoords;
            const { x: x2, y: y2 } = route.entry.destinationCoords;
            const mx = (x1 + x2) / 2;
            const my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.14 - 24;
            const pathD = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;

            const isSelected = selectedRouteId === route.entry.id;
            const isHovered = hoveredRouteId === route.entry.id;
            const isLowCarbon =
              route.isSwitched || route.netCbamRateEurPerTonne < 25;
            const strokeColor = isLowCarbon ? '#84CC16' : '#EF4444';
            const opacity =
              selectedRouteId && !isSelected && !isHovered ? 0.22 : 0.9;

            return (
              <g
                key={route.entry.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredRouteId(route.entry.id)}
                onMouseLeave={() => setHoveredRouteId(null)}
                onClick={() =>
                  onSelectRoute(isSelected ? null : route.entry.id)
                }
              >
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="14" />
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isSelected || isHovered ? 3.2 : 2.0}
                  strokeDasharray={route.isSwitched ? '6 4' : undefined}
                  opacity={opacity}
                />
                <circle
                  cx={x1}
                  cy={y1}
                  r={isSelected || isHovered ? 5.5 : 4.0}
                  fill={strokeColor}
                  opacity={opacity}
                />
              </g>
            );
          })}

          {/* Destination Regime Anchors */}
          {REGIME_HUBS.map((hub) => {
            const rateEur =
              euCbamPriceEur * (REGIME_MULTIPLIERS[hub.regime] ?? 1);
            return (
              <g key={hub.regime}>
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r="6"
                  fill="#0B120E"
                  stroke="#ECF3EE"
                  strokeWidth="2.2"
                />
                <rect
                  x={hub.x - 68}
                  y={hub.y - 30}
                  width="136"
                  height="18"
                  rx="3"
                  fill="#0B120E"
                  fillOpacity="0.88"
                  stroke="#22352A"
                  strokeWidth="1"
                />
                <text
                  x={hub.x}
                  y={hub.y - 17.5}
                  textAnchor="middle"
                  fill="#ECF3EE"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {hub.label} ({formatCurrencyValue(rateEur, reportingCurrency, 0)})
                </text>
              </g>
            );
          })}
        </svg>

        {/* Route Inspection Bar */}
        <div className="px-4 py-2.5 bg-[#16231B] border-t border-[#22352A] flex flex-wrap items-center justify-between gap-4 text-xs">
          {activeRoute ? (
            <>
              <div className="flex items-center gap-2 text-[#ECF3EE]">
                <span className="font-mono-tabular font-semibold text-[#84CC16]">
                  {activeRoute.entry.sku}
                </span>
                <span>·</span>
                <span>
                  {activeRoute.activeOriginHub}, {activeRoute.activeOriginCountry} →{' '}
                  {activeRoute.entry.destinationHub} ({activeRoute.entry.destinationRegime})
                </span>
              </div>
              <div className="flex items-center gap-5 font-mono-tabular">
                <span className="text-[#9CB0A4]">
                  Intensity:{' '}
                  <strong className="text-[#ECF3EE]">
                    {activeRoute.grossIntensityTco2PerTonne.toFixed(2)} tCO₂e/t
                  </strong>
                </span>
                <span className="text-[#9CB0A4]">
                  Net CBAM:{' '}
                  <strong className="text-[#EF4444]">
                    {formatCurrencyValue(
                      activeRoute.netCbamRateEurPerTonne,
                      reportingCurrency,
                      1
                    )}
                    /t
                  </strong>
                </span>
                <span className="text-[#9CB0A4]">
                  Annual Tax:{' '}
                  <strong className="text-[#EF4444]">
                    {formatCurrencyValue(
                      activeRoute.annualCbamLiabilityEur / 1_000_000,
                      reportingCurrency,
                      2
                    )}
                    M
                  </strong>
                </span>
              </div>
            </>
          ) : (
            <div className="text-[#9CB0A4]">
              Hover or click any trade corridor above to inspect origin carbon credits, net CBAM certificate rate, and annual liability.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
