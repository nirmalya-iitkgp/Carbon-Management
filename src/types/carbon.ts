export type Sector =
  | 'Steel & Iron'
  | 'Aluminum'
  | 'Cement & Clinker'
  | 'Fertilizers & Ammonia'
  | 'Chemicals & Polymers'
  | 'Automotive & Machinery';

export type DestinationRegime = 'EU-27 CBAM' | 'UK CBAM' | 'US CCA' | 'Japan GX' | 'Canada OBPS';

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'CNY';

export interface Coordinates {
  x: number; // SVG map X (0..1000)
  y: number; // SVG map Y (0..440)
}

export interface PrecursorItem {
  id: string;
  name: string;
  cnCode: string;
  massRatioPerTonne: number; // e.g., 1.35 t precursor / t product
  emissionFactorTco2PerTonne: number; // tCO2e / t precursor
}

export interface AlternativeSupplier {
  supplierName: string;
  originHub: string;
  originCountry: string;
  originCoords: Coordinates;
  greenIntensityTco2PerTonne: number;
  unitPricePremiumEur: number;
  originCarbonPriceEur: number;
}

export interface ProductRouteEntry {
  id: string;
  sku: string;
  productName: string;
  sector: Sector;
  originHub: string;
  originCountry: string;
  originCurrency: CurrencyCode;
  originCoords: Coordinates;
  destinationRegime: DestinationRegime;
  destinationHub: string;
  destinationCoords: Coordinates;
  annualVolumeTonnes: number;
  scope1Tco2PerTonne: number;
  scope2Tco2PerTonne: number;
  scope3Tco2PerTonne: number;
  precursors: PrecursorItem[];
  euBenchmarkTco2PerTonne: number;
  originCarbonPriceEur: number;
  baseUnitCostEur: number;
  alternativeSupplier: AlternativeSupplier;
}

export interface AbatementLever {
  id: string;
  title: string;
  sector: Sector | 'Cross-Sector';
  capexEurM: number;
  annualOpexDeltaEurM: number; // negative = opex savings
  abatementKtCo2PerYr: number;
  marginalCostEurPerTco2: number;
  paybackYears: number;
  horizonYears: number;
}

export interface SimulationParams {
  euCbamPriceEur: number; // €/tCO2e
  internalCarbonPriceEur: number; // €/tCO2e
  cbamPhaseInPct: number; // 0..100% of free allocation phased out
  waccPct: number; // % discount rate for capex NPV
  reportingCurrency: CurrencyCode;
  fxHedgingActive: boolean;
  fxShockPct: number; // -15..+15% origin currency depreciation vs EUR
}

export interface ScenarioPreset {
  id: string;
  name: string;
  subtitle: string;
  params: SimulationParams;
  activeLeverIds: string[];
  switchedRouteIds: string[];
}

export interface RouteExposureResult {
  entry: ProductRouteEntry;
  isSwitched: boolean;
  activeOriginHub: string;
  activeOriginCountry: string;
  activeOriginCoords: Coordinates;
  grossIntensityTco2PerTonne: number;
  chargeableIntensityTco2PerTonne: number;
  grossEmissionsKt: number;
  effectiveRegimePriceEur: number;
  originCreditEurPerTonne: number;
  fxCreditDeltaEurPerTonne: number;
  netCbamRateEurPerTonne: number;
  annualCbamLiabilityEur: number;
  annualInternalCarbonFeeEur: number;
  annualArbitrageNetSavingsEur: number;
}

export interface MaccBarData {
  lever: AbatementLever;
  isActive: boolean;
  inTheMoney: boolean;
  xStartKt: number;
  xEndKt: number;
  widthKt: number;
  annualCarbonSavingsEurM: number;
  netAnnualCashflowEurM: number;
  npvEurM: number;
  irrPct: number;
}

export interface TrajectoryYearPoint {
  year: number;
  phaseOutPct: number;
  projectedEtsPriceEur: number;
  unmitigatedLiabilityEurM: number;
  netLiabilityEurM: number;
  incrementalStepEurM: number;
  avoidedTaxEurM: number;
}

export interface PortfolioSummary {
  totalVolumeTonnes: number;
  grossEmissionsKt: number;
  abatedEmissionsKt: number;
  netEmissionsKt: number;
  weightedIntensityTco2PerTonne: number;
  unmitigatedCbamLiabilityEurM: number;
  netCbamLiabilityEurM: number;
  internalCarbonShadowFeeEurM: number;
  totalCapexRequiredEurM: number;
  annualArbitrageAndAbatementSavingsEurM: number;
  portfolioNpvEurM: number;
  fxHedgeSavingsEurM: number;
}
