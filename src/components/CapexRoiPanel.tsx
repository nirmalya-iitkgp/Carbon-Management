import React from 'react';
import { CURRENCY_RATES } from '../data/portfolioData';
import { CurrencyCode, MaccBarData, SimulationParams } from '../types/carbon';

interface CapexRoiPanelProps {
  params: SimulationParams;
  onChangeParams: (next: SimulationParams) => void;
  maccBars: MaccBarData[];
  onToggleLever: (leverId: string) => void;
  onSelectAllInTheMoney: () => void;
}

const CURRENCIES: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'CNY'];

export const CapexRoiPanel: React.FC<CapexRoiPanelProps> = ({
  params,
  onChangeParams,
  maccBars,
  onToggleLever,
  onSelectAllInTheMoney,
}) => {
  return (
    <div className="bg-[#111B15] border border-[#22352A] rounded-md p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-[#ECF3EE]">
            Decarbonization Capex, ICP &amp; FX Controls
          </h2>
          <p className="text-xs text-[#9CB0A4] mt-0.5">
            Border carbon prices, internal shadow pricing, WACC, and FX credit hedging
          </p>
        </div>

        {/* Reporting Currency Segmented Selector */}
        <div
          role="group"
          aria-label="Reporting Currency"
          className="flex items-center gap-1 p-1 bg-[#0B120E] border border-[#22352A] rounded"
        >
          {CURRENCIES.map((cur) => {
            const active = params.reportingCurrency === cur;
            return (
              <button
                key={cur}
                type="button"
                onClick={() =>
                  onChangeParams({ ...params, reportingCurrency: cur })
                }
                className={`px-2 py-1 text-[11px] font-mono-tabular font-semibold rounded transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#84CC16] text-[#0B120E]'
                    : 'text-[#9CB0A4] hover:text-[#ECF3EE]'
                }`}
              >
                {cur}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Precision ROI Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#16231B] border border-[#22352A] rounded p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="slider-eu-cbam" className="text-[#9CB0A4] font-medium">
              EU ETS / CBAM Benchmark
            </label>
            <span className="font-mono-tabular font-semibold text-[#ECF3EE]">
              €{params.euCbamPriceEur}/tCO₂e
            </span>
          </div>
          <input
            id="slider-eu-cbam"
            type="range"
            min={40}
            max={160}
            step={1}
            value={params.euCbamPriceEur}
            onChange={(e) =>
              onChangeParams({ ...params, euCbamPriceEur: Number(e.target.value) })
            }
            className="industrial-slider"
          />
        </div>

        <div className="bg-[#16231B] border border-[#22352A] rounded p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="slider-icp" className="text-[#9CB0A4] font-medium">
              Internal Carbon Price (ICP)
            </label>
            <span className="font-mono-tabular font-semibold text-[#84CC16]">
              €{params.internalCarbonPriceEur}/tCO₂e
            </span>
          </div>
          <input
            id="slider-icp"
            type="range"
            min={35}
            max={175}
            step={1}
            value={params.internalCarbonPriceEur}
            onChange={(e) =>
              onChangeParams({
                ...params,
                internalCarbonPriceEur: Number(e.target.value),
              })
            }
            className="industrial-slider"
          />
        </div>

        <div className="bg-[#16231B] border border-[#22352A] rounded p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="slider-phasein" className="text-[#9CB0A4] font-medium">
              CBAM Free-Allocation Phase-Out
            </label>
            <span className="font-mono-tabular font-semibold text-[#ECF3EE]">
              {params.cbamPhaseInPct.toFixed(1)}%
            </span>
          </div>
          <input
            id="slider-phasein"
            type="range"
            min={2.5}
            max={100}
            step={2.5}
            value={params.cbamPhaseInPct}
            onChange={(e) =>
              onChangeParams({ ...params, cbamPhaseInPct: Number(e.target.value) })
            }
            className="industrial-slider"
          />
        </div>

        <div className="bg-[#16231B] border border-[#22352A] rounded p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="slider-wacc" className="text-[#9CB0A4] font-medium">
              Capex Hurdle Rate (WACC)
            </label>
            <span className="font-mono-tabular font-semibold text-[#ECF3EE]">
              {params.waccPct.toFixed(1)}%
            </span>
          </div>
          <input
            id="slider-wacc"
            type="range"
            min={4}
            max={15}
            step={0.5}
            value={params.waccPct}
            onChange={(e) =>
              onChangeParams({ ...params, waccPct: Number(e.target.value) })
            }
            className="industrial-slider"
          />
        </div>
      </div>

      {/* Multi-Currency FX Hedging Toggle & Sensitivity Bar */}
      <div className="bg-[#16231B] border border-[#22352A] rounded p-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#ECF3EE]">
              Origin Carbon Credit FX Hedging
            </span>
            <span className="text-[11px] font-mono-tabular text-[#677D70]">
              (1 EUR = {CURRENCY_RATES[params.reportingCurrency].toFixed(2)}{' '}
              {params.reportingCurrency})
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              onChangeParams({
                ...params,
                fxHedgingActive: !params.fxHedgingActive,
              })
            }
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
              params.fxHedgingActive
                ? 'bg-[#84CC16] text-[#0B120E]'
                : 'bg-[#0B120E] text-[#EF4444] border border-[#EF4444]'
            }`}
          >
            {params.fxHedgingActive ? 'FX Hedged (Locked)' : 'Unhedged (Exposed)'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="slider-fx-shock"
            className="text-[11px] text-[#9CB0A4] whitespace-nowrap shrink-0"
          >
            Origin FX Depreciation:
          </label>
          <input
            id="slider-fx-shock"
            type="range"
            min={-15}
            max={15}
            step={0.5}
            value={params.fxShockPct}
            onChange={(e) =>
              onChangeParams({ ...params, fxShockPct: Number(e.target.value) })
            }
            className="industrial-slider"
          />
          <span className="font-mono-tabular text-xs font-semibold text-[#ECF3EE] w-14 text-right shrink-0">
            {params.fxShockPct > 0 ? `+${params.fxShockPct}%` : `${params.fxShockPct}%`}
          </span>
        </div>
      </div>

      {/* Abatement Capex Queue */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#9CB0A4]">
            Abatement Capex Projects (Sorted by Marginal Cost)
          </span>
          <button
            type="button"
            onClick={onSelectAllInTheMoney}
            className="text-xs font-semibold text-[#84CC16] hover:underline cursor-pointer"
          >
            Auto-Select In-the-Money
          </button>
        </div>

        <div className="max-h-[195px] overflow-y-auto divide-y divide-[#22352A] border border-[#22352A] rounded bg-[#0B120E]">
          {maccBars.map((bar) => (
            <label
              key={bar.lever.id}
              className="flex items-center justify-between gap-3 px-3.5 py-2 text-xs hover:bg-[#16231B] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={bar.isActive}
                  onChange={() => onToggleLever(bar.lever.id)}
                  className="accent-[#84CC16] w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                />
                <div className="truncate">
                  <div className="font-medium text-[#ECF3EE] truncate">
                    {bar.lever.title}
                  </div>
                  <div className="text-[11px] text-[#677D70]">
                    {bar.lever.sector} · {bar.lever.abatementKtCo2PerYr} kt/yr · Capex €
                    {bar.lever.capexEurM.toFixed(1)}M
                  </div>
                </div>
              </div>

              <div className="text-right font-mono-tabular shrink-0">
                <div
                  className={`font-semibold ${
                    bar.inTheMoney ? 'text-[#84CC16]' : 'text-[#EF4444]'
                  }`}
                >
                  {bar.lever.marginalCostEurPerTco2 > 0 ? '+' : ''}€
                  {bar.lever.marginalCostEurPerTco2}/t
                </div>
                <div className="text-[11px] text-[#9CB0A4]">
                  NPV {bar.npvEurM >= 0 ? '+' : ''}€{bar.npvEurM.toFixed(1)}M
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
