import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INITIAL_PORTFOLIO_ROUTES,
  MACC_ABATEMENT_LEVERS,
  SCENARIO_PRESETS,
} from '../src/data/portfolioData';
import {
  buildMaccCurve,
  calculateMultiYearTrajectory,
  calculatePortfolioSummary,
  calculatePrecursorScope3,
  calculateRouteExposure,
  clampNumber,
  formatCurrencyValue,
  generateAuditCsv,
  sanitizeCsvCell,
} from '../src/engine/carbonEngine';

test('CBAM liability calculation deducts free allocation shield and origin carbon credit', () => {
  const steelRoute = INITIAL_PORTFOLIO_ROUTES[0];
  const params = {
    ...SCENARIO_PRESETS[0].params,
    euCbamPriceEur: 100,
    internalCarbonPriceEur: 100,
    cbamPhaseInPct: 50,
    waccPct: 8.5,
    fxHedgingActive: true,
  };

  const result = calculateRouteExposure(steelRoute, params, false);
  assert.ok(Math.abs(result.chargeableIntensityTco2PerTonne - 1.565) < 1e-6);
  assert.ok(Math.abs(result.netCbamRateEurPerTonne - 136.9375) < 1e-4);
  assert.equal(
    Math.round(result.annualCbamLiabilityEur),
    Math.round(136.9375 * steelRoute.annualVolumeTonnes)
  );
});

test('CBAM net rate never goes negative when origin carbon price exceeds destination price', () => {
  const route = INITIAL_PORTFOLIO_ROUTES[0];
  const params = {
    ...SCENARIO_PRESETS[0].params,
    euCbamPriceEur: 40,
    internalCarbonPriceEur: 50,
    cbamPhaseInPct: 100,
    waccPct: 8.0,
  };

  const result = calculateRouteExposure(route, params, true);
  assert.equal(result.netCbamRateEurPerTonne, 0);
  assert.equal(result.annualCbamLiabilityEur, 0);
});

test('Multi-Currency FX Hedging protects origin carbon credit value under FX depreciation', () => {
  const cnyRoute = INITIAL_PORTFOLIO_ROUTES[0]; // China CNY origin with €12.5/t credit
  const hedgedParams = {
    ...SCENARIO_PRESETS[0].params,
    cbamPhaseInPct: 50,
    fxHedgingActive: true,
    fxShockPct: 10,
  };
  const unhedgedParams = {
    ...hedgedParams,
    fxHedgingActive: false,
  };

  const hedgedRes = calculateRouteExposure(cnyRoute, hedgedParams, false);
  const unhedgedRes = calculateRouteExposure(cnyRoute, unhedgedParams, false);

  assert.equal(hedgedRes.fxCreditDeltaEurPerTonne, 0);
  assert.ok(unhedgedRes.fxCreditDeltaEurPerTonne > 0);
  assert.ok(unhedgedRes.annualCbamLiabilityEur > hedgedRes.annualCbamLiabilityEur);
  assert.equal(formatCurrencyValue(100, 'USD', 0), '$108');
});

test('Precursor BOM calculation sums massRatio * emissionFactor accurately', () => {
  const steelPrecursors = INITIAL_PORTFOLIO_ROUTES[0].precursors;
  const scope3 = calculatePrecursorScope3(steelPrecursors);
  // 1.35 * 0.10 + 0.025 * 2.2 = 0.135 + 0.055 = 0.19
  assert.ok(Math.abs(scope3 - 0.19) < 1e-6);
});

test('Multi-Year 2026-2034 trajectory follows statutory 2.5% to 100% phase-out schedule', () => {
  const params = SCENARIO_PRESETS[0].params;
  const trajectory = calculateMultiYearTrajectory(
    INITIAL_PORTFOLIO_ROUTES,
    new Set(SCENARIO_PRESETS[0].activeLeverIds),
    new Set(),
    params
  );

  assert.equal(trajectory.length, 9);
  assert.equal(trajectory[0].year, 2026);
  assert.equal(trajectory[0].phaseOutPct, 2.5);
  assert.equal(trajectory[8].year, 2034);
  assert.equal(trajectory[8].phaseOutPct, 100);
  assert.ok(trajectory[8].netLiabilityEurM > trajectory[0].netLiabilityEurM);
});

test('MACC curve sorts levers by marginal cost ascending and computes cumulative widths', () => {
  const params = SCENARIO_PRESETS[0].params;
  const active = new Set(['macc-1', 'macc-2']);
  const bars = buildMaccCurve(MACC_ABATEMENT_LEVERS, active, params);

  for (let i = 1; i < bars.length; i++) {
    assert.ok(
      bars[i].lever.marginalCostEurPerTco2 >= bars[i - 1].lever.marginalCostEurPerTco2
    );
    assert.equal(bars[i].xStartKt, bars[i - 1].xEndKt);
  }
  assert.equal(bars[0].isActive, true);
  assert.equal(bars[0].inTheMoney, true);
});

test('Portfolio summary aggregates abated emissions and reduces net CBAM liability', () => {
  const params = SCENARIO_PRESETS[1].params;
  const active = new Set(SCENARIO_PRESETS[1].activeLeverIds);
  const switched = new Set(SCENARIO_PRESETS[1].switchedRouteIds);

  const routeResults = INITIAL_PORTFOLIO_ROUTES.map((r) =>
    calculateRouteExposure(r, params, switched.has(r.id))
  );
  const maccBars = buildMaccCurve(MACC_ABATEMENT_LEVERS, active, params);
  const summary = calculatePortfolioSummary(routeResults, maccBars, params);

  assert.ok(summary.abatedEmissionsKt > 0);
  assert.ok(summary.netCbamLiabilityEurM < summary.unmitigatedCbamLiabilityEurM);
  assert.ok(summary.totalCapexRequiredEurM > 0);
});

test('Security: sanitizeCsvCell neutralizes spreadsheet formula injection payloads', () => {
  assert.equal(sanitizeCsvCell('=CMD|"/C calc"!A0'), `"'=CMD|""/C calc""!A0"`);
  assert.equal(sanitizeCsvCell('+SUM(A1:A2)'), "'+SUM(A1:A2)");
  assert.equal(sanitizeCsvCell('-100+200'), "'-100+200");
  assert.equal(sanitizeCsvCell('@malicious'), "'@malicious");

  const maliciousRoute = {
    ...INITIAL_PORTFOLIO_ROUTES[0],
    sku: '=HYPERLINK("http://evil.example","Click")',
  };
  const params = SCENARIO_PRESETS[0].params;
  const res = [calculateRouteExposure(maliciousRoute, params, false)];
  const bars = buildMaccCurve(MACC_ABATEMENT_LEVERS, new Set(), params);
  const summary = calculatePortfolioSummary(res, bars, params);
  const csv = generateAuditCsv(res, summary);

  assert.ok(csv.includes("'=HYPERLINK("));
});

test('Security: clampNumber handles NaN, Infinity, and out-of-range inputs safely', () => {
  assert.equal(clampNumber(Number.NaN, 10, 100), 10);
  assert.equal(clampNumber(Number.POSITIVE_INFINITY, 10, 100), 10);
  assert.equal(clampNumber(-999, 10, 100), 10);
  assert.equal(clampNumber(999, 10, 100), 100);
  assert.equal(clampNumber(55, 10, 100), 55);
});
