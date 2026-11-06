import {
  CURRENCY_RATES,
  CURRENCY_SYMBOLS,
  REGIME_MULTIPLIERS,
  STATUTORY_CBAM_SCHEDULE,
} from '../data/portfolioData';
import {
  AbatementLever,
  CurrencyCode,
  MaccBarData,
  PortfolioSummary,
  PrecursorItem,
  ProductRouteEntry,
  RouteExposureResult,
  SimulationParams,
  TrajectoryYearPoint,
} from '../types/carbon';

/**
 * Clamps numeric inputs to safe, finite bounds.
 */
export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Formats a EUR value into the active reporting currency.
 */
export function formatCurrencyValue(
  eurAmount: number,
  currency: CurrencyCode = 'EUR',
  decimals = 2
): string {
  const rate = CURRENCY_RATES[currency] ?? 1.0;
  const sym = CURRENCY_SYMBOLS[currency] ?? '€';
  return `${sym}${(eurAmount * rate).toFixed(decimals)}`;
}

/**
 * Computes total Scope 3 precursor intensity (tCO2e/t) from a SKU's precursor BOM list.
 */
export function calculatePrecursorScope3(precursors: PrecursorItem[]): number {
  return precursors.reduce(
    (sum, p) =>
      sum +
      clampNumber(p.massRatioPerTonne, 0, 20) *
        clampNumber(p.emissionFactorTco2PerTonne, 0, 50),
    0
  );
}

/**
 * Calculates CBAM certificate liability, FX credit sensitivity, internal carbon shadow fee,
 * and supplier-switch arbitrage for a single product trade route.
 */
export function calculateRouteExposure(
  entry: ProductRouteEntry,
  params: SimulationParams,
  isSwitched: boolean
): RouteExposureResult {
  const euPrice = clampNumber(params.euCbamPriceEur, 0, 500);
  const icpPrice = clampNumber(params.internalCarbonPriceEur, 0, 500);
  const phaseInFraction = clampNumber(params.cbamPhaseInPct, 0, 100) / 100;
  const fxShock = clampNumber(params.fxShockPct ?? 0, -25, 25) / 100;
  const volume = Math.max(0, entry.annualVolumeTonnes);

  const incumbentGrossIntensity =
    entry.scope1Tco2PerTonne + entry.scope2Tco2PerTonne + entry.scope3Tco2PerTonne;

  const activeIntensity = isSwitched
    ? entry.alternativeSupplier.greenIntensityTco2PerTonne
    : incumbentGrossIntensity;

  const baseOriginPriceEur = isSwitched
    ? entry.alternativeSupplier.originCarbonPriceEur
    : entry.originCarbonPriceEur;

  // Non-EUR origin carbon credits lose EUR value if origin currency depreciates and FX is unhedged
  const isNonEurOrigin = entry.originCurrency !== 'EUR' && !isSwitched;
  const unhedgedOriginPriceEur = isNonEurOrigin
    ? baseOriginPriceEur / Math.max(0.5, 1 + fxShock)
    : baseOriginPriceEur;

  const effectiveOriginPriceEur = params.fxHedgingActive
    ? baseOriginPriceEur
    : unhedgedOriginPriceEur;

  // Free allocation shields (1 - phaseInFraction) of the EU benchmark
  const freeAllocationShield = entry.euBenchmarkTco2PerTonne * (1 - phaseInFraction);
  const chargeableIntensity = Math.max(0, activeIntensity - freeAllocationShield);

  const regimeMultiplier = REGIME_MULTIPLIERS[entry.destinationRegime] ?? 1.0;
  const effectiveRegimePriceEur = euPrice * regimeMultiplier;

  const grossCbamPerTonne = chargeableIntensity * effectiveRegimePriceEur;
  const originCreditTotalPerTonne = chargeableIntensity * effectiveOriginPriceEur;
  const netCbamRateEurPerTonne = Math.max(0, grossCbamPerTonne - originCreditTotalPerTonne);

  const hedgedOriginCreditTotal = chargeableIntensity * baseOriginPriceEur;
  const hedgedNetRate = Math.max(0, grossCbamPerTonne - hedgedOriginCreditTotal);
  const fxCreditDeltaEurPerTonne = Math.max(0, netCbamRateEurPerTonne - hedgedNetRate);

  const annualCbamLiabilityEur = netCbamRateEurPerTonne * volume;
  const grossEmissionsKt = (activeIntensity * volume) / 1000;
  const annualInternalCarbonFeeEur = activeIntensity * volume * icpPrice;

  // Counterfactual incumbent liability for supplier-switch arbitrage
  const incumbentChargeable = Math.max(0, incumbentGrossIntensity - freeAllocationShield);
  const incumbentOriginPrice = params.fxHedgingActive
    ? entry.originCarbonPriceEur
    : entry.originCurrency !== 'EUR'
      ? entry.originCarbonPriceEur / Math.max(0.5, 1 + fxShock)
      : entry.originCarbonPriceEur;
  const incumbentNetRate = Math.max(
    0,
    incumbentChargeable * (effectiveRegimePriceEur - incumbentOriginPrice)
  );
  const incumbentTotalCost = (entry.baseUnitCostEur + incumbentNetRate) * volume;
  const switchedTotalCost =
    (entry.baseUnitCostEur +
      entry.alternativeSupplier.unitPricePremiumEur +
      netCbamRateEurPerTonne) *
    volume;

  const annualArbitrageNetSavingsEur = isSwitched ? incumbentTotalCost - switchedTotalCost : 0;

  return {
    entry,
    isSwitched,
    activeOriginHub: isSwitched ? entry.alternativeSupplier.originHub : entry.originHub,
    activeOriginCountry: isSwitched
      ? entry.alternativeSupplier.originCountry
      : entry.originCountry,
    activeOriginCoords: isSwitched
      ? entry.alternativeSupplier.originCoords
      : entry.originCoords,
    grossIntensityTco2PerTonne: activeIntensity,
    chargeableIntensityTco2PerTonne: chargeableIntensity,
    grossEmissionsKt,
    effectiveRegimePriceEur,
    originCreditEurPerTonne: Math.min(effectiveRegimePriceEur, effectiveOriginPriceEur),
    fxCreditDeltaEurPerTonne,
    netCbamRateEurPerTonne,
    annualCbamLiabilityEur,
    annualInternalCarbonFeeEur,
    annualArbitrageNetSavingsEur,
  };
}

/**
 * Builds the Marginal Abatement Cost Curve (MACC) sorted from lowest to highest marginal cost.
 */
export function buildMaccCurve(
  levers: AbatementLever[],
  activeLeverIds: Set<string>,
  params: SimulationParams
): MaccBarData[] {
  const effectiveCarbonPrice = Math.max(
    clampNumber(params.euCbamPriceEur, 0, 500),
    clampNumber(params.internalCarbonPriceEur, 0, 500)
  );
  const wacc = clampNumber(params.waccPct, 0.5, 30) / 100;

  const sorted = [...levers].sort(
    (a, b) => a.marginalCostEurPerTco2 - b.marginalCostEurPerTco2
  );

  let cumulativeKt = 0;

  return sorted.map((lever) => {
    const xStartKt = cumulativeKt;
    const widthKt = Math.max(1, lever.abatementKtCo2PerYr);
    const xEndKt = xStartKt + widthKt;
    cumulativeKt = xEndKt;

    const annualCarbonSavingsEurM = (lever.abatementKtCo2PerYr * effectiveCarbonPrice) / 1000;
    const netAnnualCashflowEurM = annualCarbonSavingsEurM - lever.annualOpexDeltaEurM;

    let pvCashflows = 0;
    for (let t = 1; t <= lever.horizonYears; t++) {
      pvCashflows += netAnnualCashflowEurM / Math.pow(1 + wacc, t);
    }
    const npvEurM = pvCashflows - lever.capexEurM;

    const irrPct =
      lever.capexEurM > 0
        ? (netAnnualCashflowEurM / lever.capexEurM) * 100 - 100 / lever.horizonYears
        : 0;

    return {
      lever,
      isActive: activeLeverIds.has(lever.id),
      inTheMoney: lever.marginalCostEurPerTco2 <= effectiveCarbonPrice,
      xStartKt,
      xEndKt,
      widthKt,
      annualCarbonSavingsEurM,
      netAnnualCashflowEurM,
      npvEurM,
      irrPct,
    };
  });
}

/**
 * Aggregates portfolio-wide CBAM liability, abated emissions, capex, FX hedge savings, and net NPV.
 */
export function calculatePortfolioSummary(
  routeResults: RouteExposureResult[],
  maccBars: MaccBarData[],
  _params: SimulationParams
): PortfolioSummary {
  const totalVolumeTonnes = routeResults.reduce(
    (sum, r) => sum + r.entry.annualVolumeTonnes,
    0
  );
  const grossEmissionsKt = routeResults.reduce((sum, r) => sum + r.grossEmissionsKt, 0);
  const unmitigatedCbamLiabilityEurM =
    routeResults.reduce((sum, r) => sum + r.annualCbamLiabilityEur, 0) / 1_000_000;
  const internalCarbonShadowFeeEurM =
    routeResults.reduce((sum, r) => sum + r.annualInternalCarbonFeeEur, 0) / 1_000_000;
  const supplierArbitrageSavingsEurM =
    routeResults.reduce((sum, r) => sum + r.annualArbitrageNetSavingsEur, 0) / 1_000_000;
  const fxHedgeSavingsEurM =
    routeResults.reduce(
      (sum, r) => sum + r.fxCreditDeltaEurPerTonne * r.entry.annualVolumeTonnes,
      0
    ) / 1_000_000;

  const activeBars = maccBars.filter((b) => b.isActive);
  const rawAbatedKt = activeBars.reduce((sum, b) => sum + b.lever.abatementKtCo2PerYr, 0);
  const abatedEmissionsKt = Math.min(grossEmissionsKt, rawAbatedKt);
  const netEmissionsKt = Math.max(0, grossEmissionsKt - abatedEmissionsKt);

  const abatementRatio = grossEmissionsKt > 0 ? abatedEmissionsKt / grossEmissionsKt : 0;
  const netCbamLiabilityEurM = Math.max(
    0,
    unmitigatedCbamLiabilityEurM * (1 - abatementRatio)
  );

  const totalCapexRequiredEurM = activeBars.reduce((sum, b) => sum + b.lever.capexEurM, 0);
  const maccNetSavingsEurM = activeBars.reduce((sum, b) => sum + b.netAnnualCashflowEurM, 0);
  const portfolioNpvEurM = activeBars.reduce((sum, b) => sum + b.npvEurM, 0);

  const weightedIntensityTco2PerTonne =
    totalVolumeTonnes > 0 ? (netEmissionsKt * 1000) / totalVolumeTonnes : 0;

  return {
    totalVolumeTonnes,
    grossEmissionsKt,
    abatedEmissionsKt,
    netEmissionsKt,
    weightedIntensityTco2PerTonne,
    unmitigatedCbamLiabilityEurM,
    netCbamLiabilityEurM,
    internalCarbonShadowFeeEurM,
    totalCapexRequiredEurM,
    annualArbitrageAndAbatementSavingsEurM: maccNetSavingsEurM + supplierArbitrageSavingsEurM,
    portfolioNpvEurM,
    fxHedgeSavingsEurM,
  };
}

/**
 * Computes the 2026–2034 statutory EU CBAM free-allocation phase-out trajectory
 * alongside projected EU ETS price escalation (+5.2%/yr).
 */
export function calculateMultiYearTrajectory(
  entries: ProductRouteEntry[],
  activeLeverIds: Set<string>,
  switchedRouteIds: Set<string>,
  baseParams: SimulationParams,
  etsAnnualEscalationPct = 5.2
): TrajectoryYearPoint[] {
  const esc = clampNumber(etsAnnualEscalationPct, 0, 15) / 100;
  let prevNetLiability = 0;

  return STATUTORY_CBAM_SCHEDULE.map((item, idx) => {
    const projectedEtsPriceEur = Math.round(
      baseParams.euCbamPriceEur * Math.pow(1 + esc, idx)
    );
    const yearParams: SimulationParams = {
      ...baseParams,
      euCbamPriceEur: projectedEtsPriceEur,
      cbamPhaseInPct: item.phaseOutPct,
    };

    const routeResults = entries.map((e) =>
      calculateRouteExposure(e, yearParams, switchedRouteIds.has(e.id))
    );
    const maccBars = buildMaccCurve(
      [],
      activeLeverIds,
      yearParams
    );
    void maccBars;

    const grossKt = routeResults.reduce((s, r) => s + r.grossEmissionsKt, 0);
    const unmitigatedEurM =
      routeResults.reduce((s, r) => s + r.annualCbamLiabilityEur, 0) / 1_000_000;

    // Abatement ratio from active levers
    const activeAbatedKt = routeResults.length > 0 ? grossKt * 0.28 * (activeLeverIds.size / 5) : 0;
    const abatementRatio = grossKt > 0 ? Math.min(0.85, activeAbatedKt / grossKt) : 0;
    const netLiabilityEurM = Math.max(0, unmitigatedEurM * (1 - abatementRatio));
    const incrementalStepEurM = idx === 0 ? netLiabilityEurM : netLiabilityEurM - prevNetLiability;
    prevNetLiability = netLiabilityEurM;

    return {
      year: item.year,
      phaseOutPct: item.phaseOutPct,
      projectedEtsPriceEur,
      unmitigatedLiabilityEurM: unmitigatedEurM,
      netLiabilityEurM,
      incrementalStepEurM,
      avoidedTaxEurM: Math.max(0, unmitigatedEurM - netLiabilityEurM),
    };
  });
}

/**
 * Sanitizes a CSV cell against formula injection (OWASP CSV Injection prevention).
 */
export function sanitizeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  const trimmed = str.replace(/\r?\n/g, ' ');
  const neutralized = /^[=+\-@\t\r]/.test(trimmed) ? `'${trimmed}` : trimmed;
  if (/[",]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

/**
 * Generates a formula-injection-safe CSV audit report for the active portfolio.
 */
export function generateAuditCsv(
  routeResults: RouteExposureResult[],
  summary: PortfolioSummary
): string {
  const headers = [
    'SKU',
    'Product Name',
    'Sector',
    'Origin Hub',
    'Origin Country',
    'Destination Regime',
    'Destination Hub',
    'Supplier Mode',
    'Annual Volume (t)',
    'Embedded Intensity (tCO2e/t)',
    'Chargeable Intensity (tCO2e/t)',
    'Net CBAM Rate (€/t)',
    'Annual CBAM Liability (€)',
    'Internal Carbon Fee (€)',
  ];

  const rows = routeResults.map((r) =>
    [
      r.entry.sku,
      r.entry.productName,
      r.entry.sector,
      r.activeOriginHub,
      r.activeOriginCountry,
      r.entry.destinationRegime,
      r.entry.destinationHub,
      r.isSwitched ? r.entry.alternativeSupplier.supplierName : 'Incumbent Supplier',
      r.entry.annualVolumeTonnes,
      r.grossIntensityTco2PerTonne.toFixed(3),
      r.chargeableIntensityTco2PerTonne.toFixed(3),
      r.netCbamRateEurPerTonne.toFixed(2),
      r.annualCbamLiabilityEur.toFixed(0),
      r.annualInternalCarbonFeeEur.toFixed(0),
    ]
      .map(sanitizeCsvCell)
      .join(',')
  );

  const summaryRow = [
    'PORTFOLIO TOTAL',
    'Net Post-Abatement Summary',
    'All Sectors',
    '-',
    '-',
    '-',
    '-',
    '-',
    summary.totalVolumeTonnes,
    summary.weightedIntensityTco2PerTonne.toFixed(3),
    '-',
    '-',
    (summary.netCbamLiabilityEurM * 1_000_000).toFixed(0),
    (summary.internalCarbonShadowFeeEurM * 1_000_000).toFixed(0),
  ]
    .map(sanitizeCsvCell)
    .join(',');

  return [headers.map(sanitizeCsvCell).join(','), ...rows, summaryRow].join('\n');
}
