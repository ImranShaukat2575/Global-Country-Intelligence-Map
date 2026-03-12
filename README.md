# Global Country Intelligence Map

A standalone HTML/CSS/JS app for interactive country analytics with real public data sources.

## Features
- Hover tooltips on countries with live stats
- Click-to-pin details panel with country profile + key indicators
- Choropleth map metric switcher (GDP, adjusted net income, GDP per capita, population, UN crime rate, airlines count, airports count, life expectancy, unemployment, area)
- Natural hazard exposure map metric (composite score from EM-DAT + ND-GAIN)
- Added macro and development metrics: inflation/debt/current account (IMF + World Bank), poverty and Gini (World Bank), tourism arrivals/receipts (UN Tourism/World Bank), WHO health, ND-GAIN vulnerability/readiness, EM-DAT disaster stats
- Region filter + search
- Top-country ranking table
- Country-vs-country comparison table
- GDP trend chart (2000 to latest available year)
- Crime trend chart from UN SDG API (indicator 16.1.1)
- Live weather panel on country click (Open-Meteo current conditions)
- Forecast mode panel (IMF projected series when available + linear fallback)
- Alert watchlists with user-defined threshold rules (saved in localStorage)
- Country change alerts scanner (selected country + watchlist, year-over-year triggers)
- Natural disaster timeline chart (EM-DAT events vs deaths by year)
- Natural hazard exposure lens (risk-level and component breakdown)
- Family safety lens (composite from crime/disaster/health/stability/readiness)
- Visa + residency path finder (pre-screen using regional mobility blocs + destination conditions; verify official rules)
- Job market fit by profession (macro-proxy model by profession profile)
- Best alternatives engine (finds substitute countries by cost/safety/jobs/resilience focus)
- Shareable snapshot links (stateful URL for filters/country/year/compare/forecast mode)
- Relocation planner with family/lifestyle parameters and multi-country comparison for moving decisions (select from list or type country names/ISO3)
- Export dataset as JSON or CSV

## Data sources (real)
- REST Countries API: primary country metadata
- World Bank Countries endpoint: fallback country metadata
- World Bank Indicators API: GDP and other economic/social indicators
- IMF DataMapper API: inflation, debt (% GDP), current account (% GDP)
- UN SDG API (`16.1.1`): intentional homicide rate trend by country
- WHO Global Health Observatory API: life expectancy snapshot
- ND-GAIN public extract: climate vulnerability/readiness snapshot
- EM-DAT country profiles (HDX): disaster events/deaths snapshot
- UN Tourism (UNWTO): tourism source methodology (surfaced via World Bank tourism indicators)
- OpenFlights open dataset: airlines and airports by country
- Open-Meteo API: live weather by country centroid coordinates
- Public world GeoJSON datasets: map geometry
- Regional mobility bloc definitions (EU/EEA/CH, GCC, MERCOSUR, ECOWAS, CARICOM): used for visa/residency pre-screen context

## Net worth note
- There is no single globally standardized, always-updated country "net worth" API available for every country.
- This app uses **World Bank indicator `NY.ADJ.NNTY.CD` (Adjusted Net National Income)** as a transparent proxy for a net-worth-like national aggregate.

## Military aircraft note
- Military aircraft counts are not available from a free global public API with consistent country-level coverage.
- This app does **not** invent/fake military aircraft counts.

## Performance note
- To keep startup fast, IMF/WHO/ND-GAIN/EM-DAT are shipped as local snapshot JSON files in `data/`.

## Relocation planner note
- Relocation budget is an analytic estimate, not legal/financial advice.
- It uses World Bank household consumption and PPP price-level proxies, plus risk adjustments from inflation/crime and suitability scoring from labor, safety, climate, and health indicators.

## Visa/residency path finder note
- There is no single free, complete global API for visa + long-term residency policy across all countries.
- The tool therefore provides a **pre-screen score** from regional mobility blocs plus open destination indicators.
- Treat it as decision support only and confirm final requirements with official immigration/embassy sources.

## Run locally
1. Start a local static server in this folder:
   - `python3 -m http.server 8080`
2. Open [http://localhost:8080](http://localhost:8080)

Using a local server is recommended instead of opening `index.html` directly.

## Files
- `index.html`
- `styles.css`
- `app.js`
