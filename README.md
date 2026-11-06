# CarbonLedger Trade

**CarbonLedger Trade** is an Enterprise Carbon Tax & CBAM Exposure Arbitrage Engine built for trade compliance leads, Chief Sustainability Officers, procurement VPs, and international tax directors.

## Core Capabilities

1. **Carbon Border Adjustment Mechanism (CBAM) Matrix & Precursor BOM Breakdown**
   - Models product-level embodied carbon (`Scope 1 + Scope 2 + precursor Scope 3` in `tCO₂e/t`) across 6 industrial sectors: **Steel & Iron**, **Aluminum**, **Cement & Clinker**, **Fertilizers & Ammonia**, **Chemicals & Polymers**, and **Automotive & Machinery**.
   - Expandable **Precursor BOM Breakdown Drawer** per SKU to inspect and edit EU CBAM Implementing Regulation precursor mass ratios and emission factors (e.g., sintered ore, calcined alumina, clinker ratio) in real time.
   - Supports 1-click **Low-Carbon Supplier Switching** to quantify landed-cost tariff arbitrage across **EU-27 CBAM**, **UK CBAM**, **US CCA**, **Japan GX**, and **Canada OBPS**.

2. **Multi-Year CBAM Phase-In Trajectory (2026–2034)**
   - Year-by-year waterfall chart modeling the statutory EU CBAM free-allocation phase-out schedule (`2.5%` in 2026 up to `100%` in 2034) alongside projected EU ETS price escalation.

3. **Marginal Abatement Cost Curve (MACC) Simulator**
   - Interactive variable-width step-bar chart (`ktCO₂e/yr` width vs. `€/tCO₂e` marginal cost) with a live **Arbitrage Hurdle** threshold line and click-to-toggle capex levers.

4. **Internal Carbon Pricing (ICP), Capex ROI & Multi-Currency FX Hedging**
   - Real-time sliders for **EU ETS / CBAM Benchmark (€/tCO₂e)**, **Internal Carbon Price (€/tCO₂e)**, **CBAM Free-Allocation Phase-Out (%)**, **Capex Hurdle Rate (WACC %)**, and **Origin FX Depreciation Shock (%)**.
   - **Multi-Currency Reporting (`EUR`, `USD`, `GBP`, `CNY`)** and **FX Hedging Toggle** to quantify FX impact on non-EUR origin carbon credit deductions.

5. **Security & Audit Export**
   - Formula-injection-safe CSV audit report export (`sanitizeCsvCell` neutralizes `=`, `+`, `-`, `@`, `\t`, `\r` prefixes) and strict numeric bounds clamping (`clampNumber`).

## Running Locally & Testing

```bash
npm install
npm run dev
```

Run unit & security tests:

```bash
npx tsx --test tests/carbonEngine.test.ts
```
