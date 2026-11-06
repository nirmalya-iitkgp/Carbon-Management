import React from 'react';
import { formatCurrencyValue } from '../engine/carbonEngine';
import { CurrencyCode, PortfolioSummary } from '../types/carbon';

interface KpiStripProps {
  summary: PortfolioSummary;
  reportingCurrency: CurrencyCode;
}

export const KpiStrip: React.FC<KpiStripProps> = ({ summary, reportingCurrency }) => {
  const avoidedTaxEurM = Math.max(
    0,
    summary.unmitigatedCbamLiabilityEurM - summary.netCbamLiabilityEurM
  );
  const abatementPct =
    summary.grossEmissionsKt > 0
      ? (summary.abatedEmissionsKt / summary.grossEmissionsKt) * 100
      : 0;

  return (
    <section
      aria-label="Portfolio Carbon & Financial Summary"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* KPI 1: Net Annual CBAM Liability */}
      <div className="bg-[#111B15] border border-[#22352A] rounded-md p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#9CB0A4]">
          <span>Net Annual CBAM Liability</span>
          <span className="font-semibold text-[#EF4444]">Net Liability</span>
        </div>
        <div className="mt-2 font-mono-tabular text-2xl font-bold text-[#ECF3EE]">
          {formatCurrencyValue(summary.netCbamLiabilityEurM, reportingCurrency, 2)}M
        </div>
        <div className="mt-1.5 text-xs text-[#677D70] font-mono-tabular">
          Unmitigated:{' '}
          {formatCurrencyValue(summary.unmitigatedCbamLiabilityEurM, reportingCurrency, 2)}M ·
          Avoided: {formatCurrencyValue(avoidedTaxEurM, reportingCurrency, 2)}M
        </div>
      </div>

      {/* KPI 2: Abatable Emissions & Intensity */}
      <div className="bg-[#111B15] border border-[#22352A] rounded-md p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#9CB0A4]">
          <span>Active MACC Abatement</span>
          <span className="font-semibold text-[#84CC16]">Abatement Gain</span>
        </div>
        <div className="mt-2 font-mono-tabular text-2xl font-bold text-[#84CC16]">
          -{summary.abatedEmissionsKt.toFixed(0)} ktCO₂e
        </div>
        <div className="mt-1.5 text-xs text-[#677D70] font-mono-tabular">
          {abatementPct.toFixed(1)}% of {summary.grossEmissionsKt.toFixed(0)} kt gross ·{' '}
          {summary.weightedIntensityTco2PerTonne.toFixed(2)} tCO₂e/t
        </div>
      </div>

      {/* KPI 3: Internal Carbon Shadow Fee */}
      <div className="bg-[#111B15] border border-[#22352A] rounded-md p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#9CB0A4]">
          <span>Internal Carbon Shadow Fee</span>
          <span className="font-semibold text-[#F59E0B]">ICP Allocation</span>
        </div>
        <div className="mt-2 font-mono-tabular text-2xl font-bold text-[#ECF3EE]">
          {formatCurrencyValue(summary.internalCarbonShadowFeeEurM, reportingCurrency, 2)}M
        </div>
        <div className="mt-1.5 text-xs text-[#677D70] font-mono-tabular">
          {(summary.totalVolumeTonnes / 1000).toFixed(0)}k t/yr · FX Hedge:{' '}
          {formatCurrencyValue(summary.fxHedgeSavingsEurM, reportingCurrency, 2)}M
        </div>
      </div>

      {/* KPI 4: Decarbonization Capex & Net NPV */}
      <div className="bg-[#111B15] border border-[#22352A] rounded-md p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#9CB0A4]">
          <span>Arbitrage &amp; Capex NPV</span>
          <span
            className={`font-semibold ${
              summary.portfolioNpvEurM >= 0 ? 'text-[#84CC16]' : 'text-[#EF4444]'
            }`}
          >
            {summary.portfolioNpvEurM >= 0 ? 'Net Value Add' : 'Capex Deficit'}
          </span>
        </div>
        <div
          className={`mt-2 font-mono-tabular text-2xl font-bold ${
            summary.portfolioNpvEurM >= 0 ? 'text-[#84CC16]' : 'text-[#EF4444]'
          }`}
        >
          {summary.portfolioNpvEurM >= 0 ? '+' : ''}
          {formatCurrencyValue(summary.portfolioNpvEurM, reportingCurrency, 1)}M
        </div>
        <div className="mt-1.5 text-xs text-[#677D70] font-mono-tabular">
          Capex: {formatCurrencyValue(summary.totalCapexRequiredEurM, reportingCurrency, 1)}M ·
          Net:{' '}
          {formatCurrencyValue(
            summary.annualArbitrageAndAbatementSavingsEurM,
            reportingCurrency,
            2
          )}
          M/yr
        </div>
      </div>
    </section>
  );
};
