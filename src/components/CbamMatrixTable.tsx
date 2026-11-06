import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import { SECTORS } from '../data/portfolioData';
import { clampNumber, formatCurrencyValue } from '../engine/carbonEngine';
import {
  CurrencyCode,
  DestinationRegime,
  ProductRouteEntry,
  RouteExposureResult,
  Sector,
} from '../types/carbon';

interface CbamMatrixTableProps {
  routes: RouteExposureResult[];
  reportingCurrency: CurrencyCode;
  switchedRouteIds: Set<string>;
  onToggleSupplierSwitch: (routeId: string) => void;
  onAddRoute: (newRoute: ProductRouteEntry) => void;
  onUpdatePrecursor: (
    routeId: string,
    precursorId: string,
    field: 'massRatioPerTonne' | 'emissionFactorTco2PerTonne',
    value: number
  ) => void;
}

const REGIMES: DestinationRegime[] = [
  'EU-27 CBAM',
  'UK CBAM',
  'US CCA',
  'Japan GX',
  'Canada OBPS',
];

export const CbamMatrixTable: React.FC<CbamMatrixTableProps> = ({
  routes,
  reportingCurrency,
  switchedRouteIds,
  onToggleSupplierSwitch,
  onAddRoute,
  onUpdatePrecursor,
}) => {
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(
    routes[0]?.entry.id ?? null
  );

  // New Route Form State
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [sector, setSector] = useState<Sector>('Steel & Iron');
  const [originHub, setOriginHub] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destinationRegime, setDestinationRegime] =
    useState<DestinationRegime>('EU-27 CBAM');
  const [volume, setVolume] = useState('50000');
  const [scope123, setScope123] = useState('1.85');
  const [originTax, setOriginTax] = useState('5');

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return routes.filter((r) => {
      if (sectorFilter !== 'All' && r.entry.sector !== sectorFilter) return false;
      if (!q) return true;
      return (
        r.entry.sku.toLowerCase().includes(q) ||
        r.entry.productName.toLowerCase().includes(q) ||
        r.activeOriginCountry.toLowerCase().includes(q) ||
        r.activeOriginHub.toLowerCase().includes(q) ||
        r.entry.destinationRegime.toLowerCase().includes(q)
      );
    });
  }, [routes, sectorFilter, searchQuery]);

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSku = sku.trim().slice(0, 24) || `SKU-${Date.now().toString().slice(-4)}`;
    const cleanName = productName.trim().slice(0, 80) || 'Custom Industrial Product';
    const cleanHub = originHub.trim().slice(0, 40) || 'Port Hub';
    const cleanCountry = originCountry.trim().slice(0, 40) || 'Export Origin';
    const parsedVol = clampNumber(Number(volume), 100, 10_000_000);
    const parsedIntensity = clampNumber(Number(scope123), 0.05, 25);
    const parsedOriginTax = clampNumber(Number(originTax), 0, 200);
    const scope3Val = Number((parsedIntensity * 0.15).toFixed(2));

    const newEntry: ProductRouteEntry = {
      id: `rt-custom-${Date.now()}`,
      sku: cleanSku.toUpperCase(),
      productName: cleanName,
      sector,
      originHub: cleanHub,
      originCountry: cleanCountry,
      originCurrency: 'USD',
      originCoords: { x: 650, y: 220 },
      destinationRegime,
      destinationHub: destinationRegime === 'US CCA' ? 'Houston' : 'Rotterdam',
      destinationCoords:
        destinationRegime === 'US CCA' ? { x: 215, y: 205 } : { x: 488, y: 138 },
      annualVolumeTonnes: parsedVol,
      scope1Tco2PerTonne: Number((parsedIntensity * 0.67).toFixed(2)),
      scope2Tco2PerTonne: Number((parsedIntensity * 0.18).toFixed(2)),
      scope3Tco2PerTonne: scope3Val,
      precursors: [
        {
          id: `pre-custom-${Date.now()}`,
          name: 'Primary Feedstock Precursor',
          cnCode: 'CN 7201 10 00',
          massRatioPerTonne: 1.0,
          emissionFactorTco2PerTonne: scope3Val,
        },
      ],
      euBenchmarkTco2PerTonne: 1.25,
      originCarbonPriceEur: parsedOriginTax,
      baseUnitCostEur: 620,
      alternativeSupplier: {
        supplierName: 'Regional Low-Carbon Partner',
        originHub: 'Gothenburg',
        originCountry: 'Sweden',
        originCoords: { x: 515, y: 108 },
        greenIntensityTco2PerTonne: Number((parsedIntensity * 0.35).toFixed(2)),
        unitPricePremiumEur: 55,
        originCarbonPriceEur: 82,
      },
    };

    onAddRoute(newEntry);
    setExpandedRouteId(newEntry.id);
    setSku('');
    setProductName('');
    setOriginHub('');
    setOriginCountry('');
    setShowAddForm(false);
  };

  return (
    <section
      aria-label="Product-Level CBAM Matrix and Precursor BOM Breakdown"
      className="bg-[#111B15] border border-[#22352A] rounded-md p-5"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#ECF3EE]">
            Product-Level CBAM Matrix &amp; Precursor BOM Breakdown
          </h2>
          <p className="text-xs text-[#9CB0A4] mt-0.5">
            Expand any SKU row to inspect &amp; edit EU CBAM Implementing Regulation Scope 3 precursor emission factors
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-[#677D70] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter SKU, product, origin..."
              aria-label="Filter trade routes"
              className="pl-8 pr-3 py-1.5 text-xs bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE] placeholder-[#677D70] focus:outline-none focus:border-[#84CC16]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#16231B] hover:bg-[#1E3025] text-[#ECF3EE] border border-[#22352A] rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#84CC16]" aria-hidden="true" />
            <span>Add Trade Route</span>
          </button>
        </div>
      </div>

      {/* Sector Segmented Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-[#22352A]">
        {['All', ...SECTORS].map((sec) => {
          const active = sectorFilter === sec;
          return (
            <button
              key={sec}
              type="button"
              onClick={() => setSectorFilter(sec)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#84CC16] text-[#0B120E] font-semibold'
                  : 'bg-[#16231B] text-[#9CB0A4] hover:text-[#ECF3EE]'
              }`}
            >
              {sec}
            </button>
          );
        })}
      </div>

      {/* Inline Add Trade Route Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateRoute}
          className="mb-4 p-4 bg-[#16231B] border border-[#22352A] rounded grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs"
        >
          <div>
            <label className="block text-[#9CB0A4] mb-1">SKU Code</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="STL-PLT-09"
              className="w-full px-2.5 py-1.5 bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE]"
            />
          </div>
          <div>
            <label className="block text-[#9CB0A4] mb-1">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Heavy Marine Plate"
              className="w-full px-2.5 py-1.5 bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE]"
            />
          </div>
          <div>
            <label className="block text-[#9CB0A4] mb-1">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as Sector)}
              className="w-full px-2.5 py-1.5 bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE]"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#9CB0A4] mb-1">Origin Country</label>
            <input
              type="text"
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              placeholder="Vietnam"
              className="w-full px-2.5 py-1.5 bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE]"
            />
          </div>
          <div>
            <label className="block text-[#9CB0A4] mb-1">Destination Regime</label>
            <select
              value={destinationRegime}
              onChange={(e) =>
                setDestinationRegime(e.target.value as DestinationRegime)
              }
              className="w-full px-2.5 py-1.5 bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE]"
            >
              {REGIMES.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#9CB0A4] mb-1">
              Intensity (tCO₂e/t)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              max="25"
              value={scope123}
              onChange={(e) => setScope123(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE] font-mono-tabular"
            />
          </div>
          <div>
            <label className="block text-[#9CB0A4] mb-1">Volume (t/yr)</label>
            <input
              type="number"
              step="1000"
              min="100"
              max="10000000"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE] font-mono-tabular"
            />
          </div>
          <div>
            <label className="block text-[#9CB0A4] mb-1">
              Origin Carbon (€/t)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="200"
              value={originTax}
              onChange={(e) => setOriginTax(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE] font-mono-tabular"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-[#9CB0A4] hover:text-[#ECF3EE] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-[#84CC16] text-[#0B120E] rounded hover:bg-[#95DC28] cursor-pointer"
            >
              Save Route
            </button>
          </div>
        </form>
      )}

      {/* High-Density Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#22352A] text-[11px] font-semibold text-[#9CB0A4]">
              <th className="py-2.5 pr-3">SKU / Product &amp; BOM</th>
              <th className="py-2.5 px-3">Trade Corridor</th>
              <th className="py-2.5 px-3 text-right">Volume (t/yr)</th>
              <th className="py-2.5 px-3 text-right">Embodied (tCO₂e/t)</th>
              <th className="py-2.5 px-3 text-right">Origin Credit</th>
              <th className="py-2.5 px-3 text-right">Net CBAM Rate</th>
              <th className="py-2.5 px-3 text-right">Annual Tax</th>
              <th className="py-2.5 pl-3 text-right">Sourcing Arbitrage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#22352A] text-xs">
            {filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#9CB0A4]">
                  No product trade routes match your current filter.
                </td>
              </tr>
            ) : (
              filteredRoutes.map((r) => {
                const isSwitched = switchedRouteIds.has(r.entry.id);
                const isExpanded = expandedRouteId === r.entry.id;

                return (
                  <React.Fragment key={r.entry.id}>
                    <tr className="hover:bg-[#16231B]/70 transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRouteId(isExpanded ? null : r.entry.id)
                            }
                            aria-expanded={isExpanded}
                            title="Expand Precursor BOM Breakdown"
                            className="mt-0.5 p-0.5 text-[#9CB0A4] hover:text-[#84CC16] cursor-pointer shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div>
                            <div className="font-medium text-[#ECF3EE]">
                              {r.entry.productName}
                            </div>
                            <div className="text-[11px] text-[#677D70] font-mono-tabular">
                              {r.entry.sku} · {r.entry.sector} ·{' '}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRouteId(isExpanded ? null : r.entry.id)
                                }
                                className="text-[#84CC16] hover:underline cursor-pointer"
                              >
                                {r.entry.precursors.length} Precursor
                                {r.entry.precursors.length === 1 ? '' : 's'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[#ECF3EE]">
                          {r.activeOriginHub}, {r.activeOriginCountry} →{' '}
                          {r.entry.destinationHub}
                        </div>
                        <div className="text-[11px] text-[#677D70]">
                          {r.entry.destinationRegime} · {r.entry.originCurrency}
                          {isSwitched
                            ? ` · ${r.entry.alternativeSupplier.supplierName}`
                            : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular text-[#ECF3EE]">
                        {r.entry.annualVolumeTonnes.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular text-[#ECF3EE]">
                        {r.grossIntensityTco2PerTonne.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular text-[#9CB0A4]">
                        {formatCurrencyValue(
                          r.originCreditEurPerTonne,
                          reportingCurrency,
                          1
                        )}
                        /t
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold text-[#EF4444]">
                        {formatCurrencyValue(
                          r.netCbamRateEurPerTonne,
                          reportingCurrency,
                          1
                        )}
                        /t
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold text-[#EF4444]">
                        {formatCurrencyValue(
                          r.annualCbamLiabilityEur / 1_000_000,
                          reportingCurrency,
                          2
                        )}
                        M
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => onToggleSupplierSwitch(r.entry.id)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                            isSwitched
                              ? 'bg-[#84CC16] text-[#0B120E]'
                              : 'bg-[#16231B] text-[#84CC16] border border-[#22352A] hover:border-[#84CC16]'
                          }`}
                        >
                          {isSwitched
                            ? `Green Active (${
                                r.annualArbitrageNetSavingsEur >= 0 ? '+' : ''
                              }${formatCurrencyValue(
                                r.annualArbitrageNetSavingsEur / 1_000_000,
                                reportingCurrency,
                                2
                              )}M)`
                            : `Switch → ${r.entry.alternativeSupplier.originCountry}`}
                        </button>
                      </td>
                    </tr>

                    {/* Precursor BOM Breakdown Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#0B120E]">
                        <td colSpan={8} className="p-4 border-t border-[#22352A]">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                            <div className="text-xs font-semibold text-[#ECF3EE]">
                              Precursor BOM Breakdown — {r.entry.sku} (EU CBAM Implementing Regulation Scope 3)
                            </div>
                            <div className="text-[11px] font-mono-tabular text-[#9CB0A4]">
                              Scope 1: {r.entry.scope1Tco2PerTonne.toFixed(2)} · Scope 2:{' '}
                              {r.entry.scope2Tco2PerTonne.toFixed(2)} · Precursor Scope 3:{' '}
                              <strong className="text-[#84CC16]">
                                {r.entry.scope3Tco2PerTonne.toFixed(3)} tCO₂e/t
                              </strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {r.entry.precursors.map((pre) => {
                              const contribution =
                                pre.massRatioPerTonne * pre.emissionFactorTco2PerTonne;
                              return (
                                <div
                                  key={pre.id}
                                  className="bg-[#111B15] border border-[#22352A] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                                >
                                  <div className="min-w-[160px]">
                                    <div className="font-medium text-[#ECF3EE]">
                                      {pre.name}
                                    </div>
                                    <div className="text-[11px] font-mono-tabular text-[#677D70]">
                                      {pre.cnCode} · Contribution:{' '}
                                      <span className="text-[#ECF3EE]">
                                        {contribution.toFixed(3)} tCO₂e/t
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 font-mono-tabular">
                                    <div>
                                      <label className="block text-[10px] text-[#9CB0A4]">
                                        Ratio (t/t)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="20"
                                        value={pre.massRatioPerTonne}
                                        onChange={(e) =>
                                          onUpdatePrecursor(
                                            r.entry.id,
                                            pre.id,
                                            'massRatioPerTonne',
                                            Number(e.target.value)
                                          )
                                        }
                                        className="w-20 px-2 py-1 text-xs bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-[#9CB0A4]">
                                        EF (tCO₂e/t)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.05"
                                        min="0"
                                        max="50"
                                        value={pre.emissionFactorTco2PerTonne}
                                        onChange={(e) =>
                                          onUpdatePrecursor(
                                            r.entry.id,
                                            pre.id,
                                            'emissionFactorTco2PerTonne',
                                            Number(e.target.value)
                                          )
                                        }
                                        className="w-20 px-2 py-1 text-xs bg-[#0B120E] border border-[#22352A] rounded text-[#ECF3EE]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
