# CarbonLedger Trade — Enterprise Carbon Tax & CBAM Exposure Arbitrage Engine

**CarbonLedger Trade** is an enterprise carbon trade exposure and decarbonization command center enabling trade compliance, procurement, and sustainability leaders to model product-level embodied carbon, simulate cross-border CBAM tariff liabilities across global trade routes, and prioritize green capex investments using an interactive Marginal Abatement Cost Curve (MACC) and Internal Carbon Pricing (ICP) engine.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and architectural decisions incorporate your Phase 1 selections and establish the baseline for implementation:

- **Confirmed Brand Identity**: **CarbonLedger Trade** — positioned as an industrial-grade carbon border tax and sourcing arbitrage platform.
- **Confirmed Multi-Sector Portfolio**: Pre-loaded with a comprehensive cross-border manufacturing dataset spanning **Steel & Iron**, **Primary & Secondary Aluminum**, **Cement & Clinker**, **Nitrogenous Fertilizers & Ammonia**, **Organic Chemicals & Polymers**, and **Automotive & Industrial Machinery**.
- **Confirmed Session & Scenario Model**: Purely deterministic, client-side in-memory simulation state with instant switching across **4 executive scenario presets** (*2026 CBAM Phase-In Baseline*, *EU ETS €110/tCO₂e Price Shock*, *Green Capex Decarbonization Sprint*, and *Dual-Sourcing Tariff Arbitrage*), plus custom product/route editing and sanitized CSV/JSON export.
- **No AI / LLM Calls**: All CBAM certificate calculations, internal carbon pricing, and MACC abatement curves are computed deterministically via auditable financial and emissions formulas—no external AI APIs or chatbots are included.

---

## 1. Overview & Core Concept

### What It Does
Cross-border manufacturers face escalating carbon border tariffs—led by the **EU Carbon Border Adjustment Mechanism (CBAM)**, **UK CBAM**, and emerging **US/G7 border carbon frameworks**. **CarbonLedger Trade** replaces fragmented spreadsheets with a unified quantitative engine connecting three core models:

1. **CBAM Exposure Matrix**: Calculates gross embedded emissions (Scope 1 direct, Scope 2 indirect electricity, and Scope 3 precursor materials) per SKU and trade route, deducts verified carbon prices already paid in the origin jurisdiction (e.g., China ETS, India CCTS, Turkey ETS), and computes net CBAM certificate liability (`€/yr` and `€/tonne`).
2. **Internal Carbon Pricing (ICP) & Sourcing Arbitrage Engine**: Applies a configurable shadow carbon price (`€/tCO₂e`) and WACC hurdle rate to compare incumbent high-carbon suppliers against low-carbon alternatives (e.g., DRI-EAF green steel, hydro-smelted aluminum), quantifying landed-cost parity and net tariff savings.
3. **Marginal Abatement Cost Curve (MACC) Simulator**: Ranks decarbonization capex levers by marginal abatement cost (`€/tCO₂e` on the Y-axis) and annual abatement volume (`ktCO₂e/yr` on the X-axis). Levers below the active CBAM/ICP price threshold represent net-positive arbitrage opportunities.

### Target Audience
- **Head of Trade Compliance**: Tracks CBAM transitional-to-definitive phase-in exposure, default vs. actual emission factor gaps, and origin carbon price credits.
- **Chief Sustainability Officer (CSO)**: Prioritizes Scope 1–3 abatement capex levers using the interactive MACC chart.
- **Procurement VP & International Tax Director**: Evaluates supplier switching, dual-sourcing arbitrage, and internal carbon fee allocation across business units.

---

## 2. User Experience & Visual Design

### Aesthetic Direction & Color Palette
- **Theme**: **High-Density Data Command Center / Industrial Slate Mode**
- **60% Dominant Neutral Canvas**: Deep Forest Charcoal (`#0B120E`) primary background with subtle radial atmospheric depth.
- **30% Structural Surfaces**: Elevated Industrial Slate-Charcoal (`#111B15` and `#16231B`) containers separated by crisp `1px` hairline borders (`#22352A`)—strictly single-elevation depth with zero nested card-in-card clutter.
- **10% High-Intent Accents & Semantic Signals**:
  - **Abatement & Arbitrage**: High-contrast Lime Green (`#84CC16`) for cost-negative/profitable abatement bars, green trade routes, and net savings indicators.
  - **Tax Liability & Exposure**: High-contrast Crimson Red (`#EF4444`) for unmitigated CBAM tariff liabilities and high-intensity corridors, always paired with explicit text labels (e.g., `Net Liability`, `Abatement Gain`) for color-blind accessibility.
  - **Warning / Transitional**: Amber (`#F59E0B`) for marginal/break-even levers near the carbon price threshold.

### Typography & Tabular Discipline
- **Display & Headings**: `Plus Jakarta Sans` (SemiBold 600 / Bold 700, `text-wrap: balance`, optical tracking compensation on dark surfaces).
- **Body & Dense Tables**: `DM Sans` (Regular 400 / Medium 500, crisp legibility at `13px–15px`).
- **Financial & Telemetry Figures**: `JetBrains Mono` with `font-variant-numeric: tabular-nums` enforced across all KPIs, MACC axes, map tooltips, and product-route ledger cells.

### Workspace Layout & Key User Flows
1. **Top Navigation Bar (3-Zone Contract)**:
   - *Left*: `CarbonLedger Trade` wordmark + custom PNG emblem.
   - *Center*: Single-line workspace view links (`Command Overview`, `CBAM Matrix`, `MACC & Capex`, `Sourcing Arbitrage`).
   - *Right*: Primary action button (`Export Audit Report` — downloads sanitized CSV/JSON).
2. **Executive Scenario & KPI Strip**:
   - Instant scenario preset selector (*2026 CBAM Phase-In*, *EU ETS €110 Shock*, *Green Capex Sprint*, *Dual-Sourcing Arbitrage*) + `Reset` control.
   - 4-column tabular KPI strip: **Net Annual CBAM Liability (€M)**, **Embedded Carbon Intensity (tCO₂e/t)**, **Abatable Emissions Below ICP (ktCO₂e)**, and **Net Arbitrage & Capex NPV (€M)**.
3. **Interactive Global CBAM Tariff Map Overlay**:
   - Custom high-precision SVG world trade map showing origin production hubs (e.g., Tangshan, Odisha, Ras Al-Khaimah, Kocaeli, Monterrey, Ruhr) connected to export destination regimes (EU-27, UK, US, Japan, Canada).
   - Clicking any trade corridor or hub filters the CBAM Matrix and highlights route-specific tariff exposure, origin carbon credit deductions, and landed-cost impact.
4. **Interactive MACC Step-Bar Chart & Decarbonization Capex ROI Sliders**:
   - Variable-width step-bar chart where each bar's width is proportional to `ktCO₂e/yr` abatement potential and height represents `€/tCO₂e` marginal cost.
   - Dynamic horizontal dashed threshold line synced to the **Internal Carbon Price / CBAM Benchmark Slider (€40–€180/tCO₂e)**.
   - Clicking any MACC bar toggles that capex project active/inactive, immediately recalculating portfolio emissions, capex outlay, IRR, payback years, and net CBAM tax saved.
5. **Product-Level CBAM Matrix & Supplier Arbitrage Ledger**:
   - Searchable, sector-filterable high-density data grid (`36px–42px` rows) with inline ability to add/edit product SKUs, adjust Scope 1/2/3 intensity, or simulate switching to a low-carbon supplier.

---

## 3. Key Product Decisions & Trade-Offs

- **Deterministic Client-Side Quantitative Engine vs. Backend Database**:
  - *Chosen Approach*: Pure TypeScript calculation modules running in-memory with pre-loaded multi-sector datasets and 4 curated scenario presets.
  - *Why*: Zero-latency slider responsiveness (`<16ms` recalculation across all charts and tables), deterministic auditability, and full unit-test coverage without network/database failure modes.
- **Custom Interactive SVG MACC & Global Trade Map vs. Heavy Charting Libraries**:
  - *Chosen Approach*: Purpose-built, responsive SVG components for the variable-width MACC step-bar chart and global CBAM trade route map.
  - *Why*: Standard bar charts cannot render variable-width MACC step-bars (where bar width encodes `ktCO₂e` volume) cleanly; custom SVG gives exact geometric control, crisp hover crosshairs, and zero bundle bloat.
- **Security & Input Hygiene**:
  - *Chosen Approach*: Strict numeric bounds validation on all sliders and SKU inputs, formula-injection-safe CSV cell escaping (prefixing `=`, `+`, `-`, `@` with `'`), and zero `dangerouslySetInnerHTML` or dynamic code evaluation.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CarbonLedger Trade UI                            │
│  ┌───────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │
│  │ Scenario & ICP    │  │ Global CBAM Tariff  │  │ Interactive MACC  │  │
│  │ ROI Sliders       │  │ Map Overlay (SVG)   │  │ Step-Bar Chart    │  │
│  └─────────┬─────────┘  └──────────┬──────────┘  └─────────┬─────────┘  │
│            │                       │                       │            │
│            └───────────────────────┼───────────────────────┘            │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Unified Simulation & Arbitrage State                 │  │
│  │  • Active Scenario Preset & ICP/CBAM Price (€/tCO₂e)              │  │
│  │  • Selected Trade Route / Sector Filter                           │  │
│  │  • Active Abatement Levers (MACC Toggles) & Supplier Switches     │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │           Deterministic Carbon & Financial Engine                 │  │
│  │  • CBAM Liability: (Embedded - Benchmark - Abated) × Net Tariff   │  │
│  │  • MACC Ranking: Marginal Cost (€/tCO₂e) vs. Abatement (ktCO₂e)   │  │
│  │  • Capex ROI: NPV, IRR, Simple Payback & Sourcing Parity          │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │         Multi-Sector Portfolio & Sanitized Export Layer           │  │
│  │  • 6 Industrial Sectors (Steel, Aluminum, Cement, Fertilizer,     │  │
│  │    Chemicals, Automotive) × Global Trade Corridors                │  │
│  │  • CSV / JSON Audit Report Generator (Formula-Injection Safe)     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Data Entities
- **ProductRouteEntry**: SKU code, product name, sector, origin facility & country, destination regime (EU, UK, US, JP, CA), annual volume (`tonnes/yr`), Scope 1/2/3 intensity (`tCO₂e/t`), origin carbon price paid (`€/tCO₂e`), base unit cost (`€/t`), and low-carbon alternative supplier option.
- **AbatementLever**: Lever ID, title, sector applicability, capex (`€M`), annual opex delta (`€M/yr`), abatement potential (`ktCO₂e/yr`), marginal abatement cost (`€/tCO₂e`), implementation timeline (`years`), and active toggle state.
- **ScenarioPreset**: Pre-configured macro parameters (EU CBAM benchmark price, internal shadow carbon price, WACC hurdle rate, phase-in percentage, and active abatement levers).
