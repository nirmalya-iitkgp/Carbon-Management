import React, { useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CapexRoiPanel } from './components/CapexRoiPanel';
import { CbamMatrixTable } from './components/CbamMatrixTable';
import { GlobalCbamMap } from './components/GlobalCbamMap';
import { KpiStrip } from './components/KpiStrip';
import { MaccChart } from './components/MaccChart';
import { PhaseInTrajectoryChart } from './components/PhaseInTrajectoryChart';
import { TopBar, WorkspaceSection } from './components/TopBar';
import {
  INITIAL_PORTFOLIO_ROUTES,
  MACC_ABATEMENT_LEVERS,
  SCENARIO_PRESETS,
} from './data/portfolioData';
import {
  buildMaccCurve,
  calculateMultiYearTrajectory,
  calculatePortfolioSummary,
  calculatePrecursorScope3,
  calculateRouteExposure,
  clampNumber,
  generateAuditCsv,
} from './engine/carbonEngine';
import { ProductRouteEntry, SimulationParams } from './types/carbon';

export default function App() {
  const defaultPreset = SCENARIO_PRESETS[0];

  const [activeSection, setActiveSection] = useState<WorkspaceSection>('overview');
  const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);
  const [routes, setRoutes] = useState<ProductRouteEntry[]>(INITIAL_PORTFOLIO_ROUTES);
  const [params, setParams] = useState<SimulationParams>(defaultPreset.params);
  const [activeLeverIds, setActiveLeverIds] = useState<Set<string>>(
    () => new Set(defaultPreset.activeLeverIds)
  );
  const [switchedRouteIds, setSwitchedRouteIds] = useState<Set<string>>(
    () => new Set(defaultPreset.switchedRouteIds)
  );
  const [selectedMapRouteId, setSelectedMapRouteId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const maccRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const handleSelectSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    const targetMap: Record<WorkspaceSection, React.RefObject<HTMLDivElement | null>> = {
      overview: mapRef,
      macc: maccRef,
      matrix: matrixRef,
      arbitrage: matrixRef,
    };
    targetMap[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setParams({ ...preset.params });
    setActiveLeverIds(new Set(preset.activeLeverIds));
    setSwitchedRouteIds(new Set(preset.switchedRouteIds));
    setSelectedMapRouteId(null);
  };

  const handleReset = () => {
    setRoutes(INITIAL_PORTFOLIO_ROUTES);
    handleApplyPreset(defaultPreset.id);
  };

  const handleToggleLever = (leverId: string) => {
    setActiveLeverIds((prev) => {
      const next = new Set(prev);
      if (next.has(leverId)) {
        next.delete(leverId);
      } else {
        next.add(leverId);
      }
      return next;
    });
  };

  const handleToggleSupplierSwitch = (routeId: string) => {
    setSwitchedRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  const handleAddRoute = (newRoute: ProductRouteEntry) => {
    setRoutes((prev) => [newRoute, ...prev]);
  };

  const handleUpdatePrecursor = (
    routeId: string,
    precursorId: string,
    field: 'massRatioPerTonne' | 'emissionFactorTco2PerTonne',
    value: number
  ) => {
    const safeVal =
      field === 'massRatioPerTonne'
        ? clampNumber(value, 0, 20)
        : clampNumber(value, 0, 50);

    setRoutes((prev) =>
      prev.map((route) => {
        if (route.id !== routeId) return route;
        const updatedPrecursors = route.precursors.map((p) =>
          p.id === precursorId ? { ...p, [field]: safeVal } : p
        );
        const newScope3 = Number(
          calculatePrecursorScope3(updatedPrecursors).toFixed(3)
        );
        return {
          ...route,
          precursors: updatedPrecursors,
          scope3Tco2PerTonne: newScope3,
        };
      })
    );
  };

  const allRouteResults = useMemo(
    () =>
      routes.map((entry) =>
        calculateRouteExposure(entry, params, switchedRouteIds.has(entry.id))
      ),
    [routes, params, switchedRouteIds]
  );

  const visibleRouteResults = useMemo(() => {
    if (!selectedMapRouteId) return allRouteResults;
    return allRouteResults.filter((r) => r.entry.id === selectedMapRouteId);
  }, [allRouteResults, selectedMapRouteId]);

  const maccBars = useMemo(
    () => buildMaccCurve(MACC_ABATEMENT_LEVERS, activeLeverIds, params),
    [activeLeverIds, params]
  );

  const portfolioSummary = useMemo(
    () => calculatePortfolioSummary(allRouteResults, maccBars, params),
    [allRouteResults, maccBars, params]
  );

  const trajectoryPoints = useMemo(
    () =>
      calculateMultiYearTrajectory(
        routes,
        activeLeverIds,
        switchedRouteIds,
        params
      ),
    [routes, activeLeverIds, switchedRouteIds, params]
  );

  const handleSelectAllInTheMoney = () => {
    const inMoneyIds = maccBars.filter((b) => b.inTheMoney).map((b) => b.lever.id);
    setActiveLeverIds(new Set(inMoneyIds));
  };

  const handleExportCsv = () => {
    const csv = generateAuditCsv(allRouteResults, portfolioSummary);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `carbonledger-cbam-audit-${activePresetId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice('Sanitized CBAM & MACC audit report exported (CSV).');
    window.setTimeout(() => setExportNotice(null), 3500);
  };

  const effectiveCarbonPriceEur = Math.max(
    params.euCbamPriceEur,
    params.internalCarbonPriceEur
  );

  return (
    <div className="min-h-screen bg-[#0B120E] text-[#ECF3EE] flex flex-col">
      <TopBar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onExportCsv={handleExportCsv}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Scenario Preset & Command Header */}
        <section
          aria-label="Scenario Presets"
          className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#22352A]"
        >
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#ECF3EE] text-balance">
              Cross-Border Carbon Tax &amp; CBAM Exposure Arbitrage
            </h1>
            <p className="text-xs text-[#9CB0A4] mt-1">
              Multi-sector embodied carbon ledger · EU/UK/US border tariff matrix · Marginal Abatement Cost Curve
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SCENARIO_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  title={preset.subtitle}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#16231B] text-[#84CC16] border border-[#84CC16]'
                      : 'bg-[#111B15] text-[#9CB0A4] border border-[#22352A] hover:text-[#ECF3EE]'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleReset}
              title="Reset simulation to default baseline"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9CB0A4] hover:text-[#ECF3EE] bg-[#111B15] border border-[#22352A] rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </section>

        {exportNotice && (
          <div
            role="status"
            className="px-4 py-2.5 text-xs font-medium bg-[#16231B] border border-[#84CC16] text-[#84CC16] rounded"
          >
            {exportNotice}
          </div>
        )}

        {/* 4-Column Tabular KPI Strip */}
        <KpiStrip
          summary={portfolioSummary}
          reportingCurrency={params.reportingCurrency}
        />

        {/* Global CBAM Tariff Map Overlay */}
        <div ref={mapRef}>
          <GlobalCbamMap
            routes={allRouteResults}
            euCbamPriceEur={params.euCbamPriceEur}
            reportingCurrency={params.reportingCurrency}
            selectedRouteId={selectedMapRouteId}
            onSelectRoute={setSelectedMapRouteId}
          />
        </div>

        {/* Multi-Year CBAM Phase-In Trajectory (2026–2034) */}
        <PhaseInTrajectoryChart
          trajectory={trajectoryPoints}
          reportingCurrency={params.reportingCurrency}
          activePhaseInPct={params.cbamPhaseInPct}
          onSelectPhaseInPct={(pct) =>
            setParams((prev) => ({ ...prev, cbamPhaseInPct: pct }))
          }
        />

        {/* MACC Step-Bar Chart & Decarbonization Capex ROI + FX Sliders */}
        <div ref={maccRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex">
            <div className="w-full flex flex-col">
              <MaccChart
                bars={maccBars}
                effectiveCarbonPriceEur={effectiveCarbonPriceEur}
                onToggleLever={handleToggleLever}
              />
            </div>
          </div>
          <div className="lg:col-span-5 flex">
            <div className="w-full flex flex-col">
              <CapexRoiPanel
                params={params}
                onChangeParams={setParams}
                maccBars={maccBars}
                onToggleLever={handleToggleLever}
                onSelectAllInTheMoney={handleSelectAllInTheMoney}
              />
            </div>
          </div>
        </div>

        {/* Product-Level CBAM Matrix & Precursor BOM Breakdown */}
        <div ref={matrixRef}>
          <CbamMatrixTable
            routes={visibleRouteResults}
            reportingCurrency={params.reportingCurrency}
            switchedRouteIds={switchedRouteIds}
            onToggleSupplierSwitch={handleToggleSupplierSwitch}
            onAddRoute={handleAddRoute}
            onUpdatePrecursor={handleUpdatePrecursor}
          />
        </div>
      </main>

      <footer className="border-t border-[#22352A] py-4 px-6 text-xs text-[#677D70]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>CarbonLedger Trade · Enterprise CBAM, ICP &amp; MACC Simulation Engine</span>
          <span>Deterministic In-Memory Modeling · Zero External Data Transmission</span>
        </div>
      </footer>
    </div>
  );
}
