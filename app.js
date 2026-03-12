"use strict";

const WORLD_GEOJSON_URLS = [
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
];
// REST Countries v3.1 limits the ?fields filter to 10 fields — split across two requests.
const REST_COUNTRIES_URL_P1 = "https://restcountries.com/v3.1/all?fields=name,cca3,ccn3,capital,region,subregion,population,area,languages,currencies";
const REST_COUNTRIES_URL_P2 = "https://restcountries.com/v3.1/all?fields=cca3,flags,timezones,continents,latlng,unMember,independent,landlocked,startOfWeek,car";
const WORLD_BANK_BASE = "https://api.worldbank.org/v2";
const WORLD_BANK_COUNTRY_URL = `${WORLD_BANK_BASE}/country?format=json&per_page=400`;
const UN_SDG_CRIME_URL =
  "https://unstats.un.org/sdgs/UNSDGAPIV5/v1/sdg/Indicator/Data?indicator=16.1.1&pageSize=25000";
const OPENFLIGHTS_AIRLINES_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat";
const OPENFLIGHTS_AIRPORTS_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const NEWS_CORS_PROXY = "https://corsproxy.io/?url=";
const ALLORIGINS_PROXY = "https://api.allorigins.win/raw?url=";
const UN_SDG_CRIME_URLS = [
  UN_SDG_CRIME_URL,
  `${NEWS_CORS_PROXY}${encodeURIComponent(UN_SDG_CRIME_URL)}`,
  `${ALLORIGINS_PROXY}${encodeURIComponent(UN_SDG_CRIME_URL)}`
];
const LOCAL_SNAPSHOT_URLS = {
  imf: "data/imf_snapshot.json",
  who: "data/who_snapshot.json",
  ndgain: "data/ndgain_snapshot.json",
  emdat: "data/emdat_snapshot.json"
};
const NEWS_RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";
const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";
const NEWS_DIRECT_FEEDS = [
  { name: "BBC News", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "CNN", url: "http://rss.cnn.com/rss/edition_world.rss" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" }
];
const NEWS_MAX_ARTICLES = 8;
const NEWS_CACHE_TTL_MS = 15 * 60 * 1000;
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;
const SNAPSHOT_STATE_VERSION = "1";
const WATCHLIST_STORAGE_KEY = "countryIntelligenceWatchlistV1";
const CURRENT_YEAR = new Date().getFullYear();
const WEATHER_CODE_LABELS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};

const INDICATORS = {
  gdp: { code: "NY.GDP.MKTP.CD", label: "GDP", type: "money" },
  gdpPerCapita: { code: "NY.GDP.PCAP.CD", label: "GDP per Capita", type: "money" },
  netWorth: {
    code: "NY.ADJ.NNTY.CD",
    label: "Adjusted Net National Income",
    type: "money",
    note: "Closest globally available public proxy for national net-worth-like value."
  },
  populationWB: { code: "SP.POP.TOTL", label: "Population", type: "integer" },
  lifeExpectancy: { code: "SP.DYN.LE00.IN", label: "Life Expectancy", type: "years" },
  unemployment: { code: "SL.UEM.TOTL.ZS", label: "Unemployment", type: "percent" },
  inflation: { code: "FP.CPI.TOTL.ZG", label: "Inflation, consumer prices (annual %, IMF/WB)", type: "percent" },
  debtPctGdp: { code: "GC.DOD.TOTL.GD.ZS", label: "Central government debt (% of GDP, IMF/WB)", type: "percent" },
  currentAccountPctGdp: { code: "BN.CAB.XOKA.GD.ZS", label: "Current account balance (% of GDP, IMF/WB)", type: "percent" },
  poverty215: { code: "SI.POV.DDAY", label: "Poverty headcount ratio at $2.15/day (%)", type: "percent" },
  gini: { code: "SI.POV.GINI", label: "Gini index", type: "score" },
  tourismArrivals: { code: "ST.INT.ARVL", label: "International tourism arrivals (UN Tourism/WB)", type: "integer" },
  tourismReceipts: { code: "ST.INT.RCPT.CD", label: "International tourism receipts (US$, UN Tourism/WB)", type: "money" },
  privateConsumptionPerCapita: { code: "NE.CON.PRVT.PC.CD", label: "Household final consumption expenditure per capita (current US$)", type: "money" },
  priceLevelRatio: { code: "PA.NUS.PPPC.RF", label: "Price level ratio of PPP conversion factor", type: "score" },
  milExpenditure: { code: "MS.MIL.XPND.CD", label: "Military Expenditure (USD)", type: "money" },
  milExpPctGdp: { code: "MS.MIL.XPND.GD.ZS", label: "Military Expenditure (% of GDP)", type: "percent" },
  armedForces: { code: "MS.MIL.TOTL.P1", label: "Armed Forces Personnel", type: "integer" },
  armedForcesPctLabor: { code: "MS.MIL.TOTL.TF.ZS", label: "Armed Forces (% of Labor Force)", type: "percent" }
};

const METRICS = [
  { key: "gdp", label: "GDP (current US$)", type: "money" },
  { key: "netWorth", label: "Adjusted Net National Income (US$)", type: "money" },
  { key: "gdpPerCapita", label: "GDP per Capita (US$)", type: "money" },
  { key: "population", label: "Population", type: "integer" },
  { key: "crimeRate", label: "Crime Rate (UN SDG 16.1.1, per 100k)", type: "rate" },
  { key: "inflation", label: "Inflation (annual %, IMF/WB)", type: "percent" },
  { key: "debtPctGdp", label: "Debt (% of GDP, IMF/WB)", type: "percent" },
  { key: "currentAccountPctGdp", label: "Current Account (% of GDP, IMF/WB)", type: "percent" },
  { key: "poverty215", label: "Poverty at $2.15/day (%)", type: "percent" },
  { key: "gini", label: "Gini Index", type: "score" },
  { key: "tourismArrivals", label: "Tourism Arrivals (UN Tourism/WB)", type: "integer" },
  { key: "tourismReceipts", label: "Tourism Receipts (US$, UN Tourism/WB)", type: "money" },
  { key: "whoLifeExpectancy", label: "WHO Life Expectancy (years)", type: "years" },
  { key: "ndgainVulnerability", label: "ND-GAIN Vulnerability", type: "score" },
  { key: "ndgainReadiness", label: "ND-GAIN Readiness", type: "score" },
  { key: "emdatEvents", label: "EM-DAT Disaster Events", type: "integer" },
  { key: "emdatDeaths", label: "EM-DAT Disaster Deaths", type: "integer" },
  { key: "hazardExposure", label: "Natural Hazard Exposure Score (EM-DAT + ND-GAIN)", type: "index" },
  { key: "airlinesCount", label: "Airlines Count (OpenFlights)", type: "integer" },
  { key: "airportsCount", label: "Airports Count (OpenFlights)", type: "integer" },
  { key: "lifeExpectancy", label: "Life Expectancy (years)", type: "years" },
  { key: "unemployment", label: "Unemployment (%)", type: "percent" },
  { key: "area", label: "Area (km²)", type: "area" },
  { key: "milExpenditure", label: "Military Expenditure (current US$)", type: "money" },
  { key: "milExpPctGdp", label: "Military Expenditure (% of GDP)", type: "percent" },
  { key: "armedForces", label: "Armed Forces Personnel", type: "integer" },
  { key: "armedForcesPctLabor", label: "Armed Forces (% of Labor Force)", type: "percent" }
];

const COMPARE_METRICS = [
  { key: "gdp", label: "GDP", type: "money" },
  { key: "gdpPerCapita", label: "GDP per Capita", type: "money" },
  { key: "netWorth", label: "Adjusted Net National Income", type: "money" },
  { key: "population", label: "Population", type: "integer" },
  { key: "crimeRate", label: "Crime Rate (per 100k)", type: "rate" },
  { key: "inflation", label: "Inflation (annual %, IMF/WB)", type: "percent" },
  { key: "debtPctGdp", label: "Debt (% GDP, IMF/WB)", type: "percent" },
  { key: "currentAccountPctGdp", label: "Current Account (% GDP, IMF/WB)", type: "percent" },
  { key: "poverty215", label: "Poverty at $2.15/day (%)", type: "percent" },
  { key: "gini", label: "Gini", type: "score" },
  { key: "tourismArrivals", label: "Tourism Arrivals (UN Tourism/WB)", type: "integer" },
  { key: "tourismReceipts", label: "Tourism Receipts (UN Tourism/WB)", type: "money" },
  { key: "whoLifeExpectancy", label: "WHO Life Expectancy", type: "years" },
  { key: "ndgainVulnerability", label: "ND-GAIN Vulnerability", type: "score" },
  { key: "ndgainReadiness", label: "ND-GAIN Readiness", type: "score" },
  { key: "emdatEvents", label: "EM-DAT Events", type: "integer" },
  { key: "emdatDeaths", label: "EM-DAT Deaths", type: "integer" },
  { key: "hazardExposure", label: "Natural Hazard Exposure Score", type: "index" },
  { key: "airlinesCount", label: "Airlines Count", type: "integer" },
  { key: "airportsCount", label: "Airports Count", type: "integer" },
  { key: "area", label: "Area", type: "area" },
  { key: "lifeExpectancy", label: "Life Expectancy", type: "years" },
  { key: "unemployment", label: "Unemployment", type: "percent" },
  { key: "milExpenditure", label: "Military Expenditure", type: "money" },
  { key: "milExpPctGdp", label: "Military Expenditure (% GDP)", type: "percent" },
  { key: "armedForces", label: "Armed Forces Personnel", type: "integer" },
  { key: "armedForcesPctLabor", label: "Armed Forces (% Labor)", type: "percent" }
];

const FORECAST_METRICS = [
  { key: "gdp", label: "GDP", type: "money" },
  { key: "inflation", label: "Inflation", type: "percent" },
  { key: "debtPctGdp", label: "Debt (% GDP)", type: "percent" },
  { key: "currentAccountPctGdp", label: "Current Account (% GDP)", type: "percent" },
  { key: "crimeRate", label: "Crime Rate", type: "rate" },
  { key: "unemployment", label: "Unemployment", type: "percent" }
];

const WATCHLIST_ALERT_METRICS = [
  { key: "inflation", label: "Inflation (annual %)", type: "percent" },
  { key: "crimeRate", label: "Crime Rate (/100k)", type: "rate" },
  { key: "unemployment", label: "Unemployment (%)", type: "percent" },
  { key: "debtPctGdp", label: "Debt (% GDP)", type: "percent" },
  { key: "emdatEvents", label: "EM-DAT Events", type: "integer" },
  { key: "emdatDeaths", label: "EM-DAT Deaths", type: "integer" },
  { key: "hazardExposure", label: "Natural Hazard Exposure", type: "index" }
];

const RELOCATION_FACTORS = {
  lifestyle: { frugal: 0.85, balanced: 1, comfortable: 1.2, premium: 1.5 },
  housing: { modestRent: 1, familyRent: 1.2, centralRent: 1.5, ownHome: 0.8 },
  cityTier: { rural: 0.82, secondary: 0.95, major: 1.15, megacity: 1.32 },
  schooling: { public: 1, mixed: 1.15, private: 1.35, international: 1.65 },
  healthcare: { public: 1, mixed: 1.1, private: 1.25, international: 1.45 }
};

const MOBILITY_BLOCS = [
  {
    name: "EU/EEA/CH free movement",
    description: "Citizens can live and work with streamlined rules inside bloc.",
    members: new Set([
      "AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA",
      "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX", "MLT", "NLD",
      "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE", "ISL", "LIE", "NOR", "CHE"
    ])
  },
  {
    name: "GCC freedom of movement",
    description: "GCC nationals get preferential residency/work pathways inside GCC.",
    members: new Set(["BHR", "KWT", "OMN", "QAT", "SAU", "ARE"])
  },
  {
    name: "MERCOSUR residency agreement",
    description: "Member/associate nationals can usually apply for temporary-to-permanent residence.",
    members: new Set(["ARG", "BOL", "BRA", "CHL", "COL", "ECU", "GUY", "PRY", "PER", "SUR", "URY"])
  },
  {
    name: "ECOWAS mobility zone",
    description: "Regional citizens typically have visa-free entry and broader mobility rights.",
    members: new Set([
      "BEN", "BFA", "CPV", "CIV", "GMB", "GHA", "GIN", "GNB", "LBR",
      "MLI", "MRT", "NER", "NGA", "SEN", "SLE", "TGO"
    ])
  },
  {
    name: "CARICOM CSME",
    description: "Many member nationals have easier movement and skilled worker pathways.",
    members: new Set([
      "ATG", "BHS", "BRB", "BLZ", "DMA", "GRD", "GUY", "JAM", "KNA", "LCA", "VCT", "SUR", "TTO"
    ])
  }
];

const JOB_PROFILES = [
  {
    key: "software",
    label: "Software / IT",
    weights: { unemployment: 0.28, gdpPerCapita: 0.29, readiness: 0.2, inflationStability: 0.08, marketSize: 0.15 }
  },
  {
    key: "healthcare",
    label: "Healthcare (Nurse/Doctor)",
    weights: { unemployment: 0.22, gdpPerCapita: 0.23, lifeExpectancy: 0.2, marketSize: 0.2, inflationStability: 0.15 }
  },
  {
    key: "engineering",
    label: "Engineering",
    weights: { unemployment: 0.27, gdpPerCapita: 0.28, marketSize: 0.2, readiness: 0.15, inflationStability: 0.1 }
  },
  {
    key: "education",
    label: "Education",
    weights: { unemployment: 0.25, marketSize: 0.24, gdpPerCapita: 0.2, lifeExpectancy: 0.15, inflationStability: 0.16 }
  },
  {
    key: "hospitality",
    label: "Hospitality / Tourism",
    weights: { tourism: 0.38, unemployment: 0.22, inflationStability: 0.12, gdpPerCapita: 0.12, marketSize: 0.16 }
  },
  {
    key: "finance",
    label: "Finance / Business",
    weights: { gdpPerCapita: 0.35, unemployment: 0.25, readiness: 0.2, inflationStability: 0.12, marketSize: 0.08 }
  },
  {
    key: "logistics",
    label: "Logistics / Supply Chain",
    weights: { unemployment: 0.27, marketSize: 0.28, tourism: 0.15, inflationStability: 0.15, gdpPerCapita: 0.15 }
  },
  {
    key: "defense",
    label: "Defense / Aerospace",
    weights: { defenseSpend: 0.38, unemployment: 0.24, gdpPerCapita: 0.2, readiness: 0.1, marketSize: 0.08 }
  }
];

const CHANGE_ALERT_RULES = [
  { key: "inflation", label: "Inflation", type: "percent", mode: "delta", threshold: 2 },
  { key: "unemployment", label: "Unemployment", type: "percent", mode: "delta", threshold: 1.2 },
  { key: "crimeRate", label: "Crime Rate", type: "rate", mode: "pct", threshold: 0.12 },
  { key: "emdatEvents", label: "Disaster Events", type: "integer", mode: "delta", threshold: 2 },
  { key: "gdpPerCapita", label: "GDP per Capita", type: "money", mode: "pct_drop", threshold: -0.05 }
];

const GLOBAL_RANKING_CAROUSEL_SLIDES = [
  {
    key: "familySafety",
    title: "Safest For Families",
    subtitle: "Countries with the strongest family safety profile from crime, health, resilience, and stability.",
    valueLabel: "Family Safety",
    note: "Low risk and stronger daily-life conditions.",
    compute(country) {
      return computeFamilySafetyLens(country).overall;
    },
    type: "index"
  },
  {
    key: "decisionFit",
    title: "Best Decision Fit",
    subtitle: "Countries where the active Decision Mode currently scores highest.",
    valueLabel: "Decision Fit",
    note: "Good livability relative to modeled cost and risk.",
    compute(country) {
      return computeDecisionModeScore(country).overall;
    },
    type: "index"
  },
  {
    key: "jobFit",
    title: "Strongest Job Markets",
    subtitle: "Best-fit countries for the currently selected profession profile.",
    valueLabel: "Job Fit",
    note: "Updates with the current profession selector.",
    compute(country) {
      return computeJobMarketFit(country, state.jobProfession).overall;
    },
    type: "index"
  },
  {
    key: "hazardResilience",
    title: "Lowest Hazard Stress",
    subtitle: "Countries with lower climate and disaster exposure based on EM-DAT and ND-GAIN.",
    valueLabel: "Hazard Resilience",
    note: "Higher score means more resilience and lower exposure.",
    compute(country) {
      const exposure = computeHazardExposure(country).score;
      return Number.isFinite(exposure) ? 100 - exposure : null;
    },
    type: "index"
  },
  {
    key: "macroStability",
    title: "Most Stable Macro Backdrop",
    subtitle: "Countries scoring best on inflation, debt pressure, and external balance stability.",
    valueLabel: "Macro Stability",
    note: "Helps surface steadier economic environments.",
    compute(country) {
      return computeMacroStabilityScore(country);
    },
    type: "index"
  },
  {
    key: "highRisk",
    title: "Highest Alert Pressure",
    subtitle: "Countries under the most combined pressure from hazard exposure, crime, and instability.",
    valueLabel: "Risk Pressure",
    note: "Higher score means more caution is needed.",
    compute(country) {
      return computeRiskPressureScore(country);
    },
    type: "index"
  }
];

const MAP_LAYERS = [
  {
    key: "custom",
    label: "Custom Metric",
    shortLabel: "Custom",
    description: "Use the raw metric dropdown.",
    portray: "A direct single-indicator view for users who want the exact source metric instead of a composite lens.",
    factors: ["Selected metric", "Selected year or latest available year", "No composite weighting"],
    type: "metric",
    higherIsBetter: true,
    palette: d3.interpolateYlGnBu
  },
  {
    key: "economy",
    label: "Economic Power",
    shortLabel: "Economy",
    description: "Composite from GDP per capita, income level, labor conditions, and stability.",
    portray: "A quick picture of how economically strong and structurally healthy a country looks overall.",
    factors: ["GDP per capita", "Net national income", "Unemployment", "Macro stability"],
    type: "index",
    higherIsBetter: true,
    palette: d3.interpolateGnBu,
    compute(country) {
      return computeEconomyLayerScore(country);
    }
  },
  {
    key: "familySafety",
    label: "Family Safety",
    shortLabel: "Safety",
    description: "Composite from crime, health, resilience, and economic stability.",
    portray: "A practical safety-and-livability lens for users thinking about day-to-day stability and family life.",
    factors: ["Crime", "Health", "Resilience", "Economic stability"],
    type: "index",
    higherIsBetter: true,
    palette: d3.interpolateYlGn,
    compute(country) {
      return computeFamilySafetyLens(country).overall;
    }
  },
  {
    key: "decisionFit",
    label: "Decision Fit",
    shortLabel: "Decision",
    description: "Decision-mode-aware country fit based on the currently selected goal.",
    portray: "A goal-driven fit layer that changes meaning depending on the Decision Mode selected above.",
    factors: ["Mode priorities", "Affordability", "Safety", "Jobs", "Resilience", "Stability"],
    type: "index",
    higherIsBetter: true,
    palette: d3.interpolatePuBuGn,
    compute(country) {
      return computeDecisionModeScore(country).overall;
    }
  },
  {
    key: "hazards",
    label: "Climate / Hazard Risk",
    shortLabel: "Hazards",
    description: "Exposure to climate and disaster stress. Higher values mean higher risk.",
    portray: "A risk lens showing where climate and disaster pressure is stronger, not where conditions are better.",
    factors: ["Disaster events", "Disaster deaths", "Affected population", "Climate vulnerability"],
    type: "index",
    higherIsBetter: false,
    palette: d3.interpolateYlOrRd,
    compute(country) {
      return computeHazardExposure(country).score;
    }
  },
  {
    key: "jobs",
    label: "Job Opportunity",
    shortLabel: "Jobs",
    description: "Best-fit job-market score for the currently selected profession profile.",
    portray: "A profession-aware view of where current open-data signals look more favorable for work opportunities.",
    factors: ["Labor market", "Income potential", "Market size", "Readiness", "Sector-linked proxies"],
    type: "index",
    higherIsBetter: true,
    palette: d3.interpolateBlues,
    compute(country) {
      return computeJobMarketFit(country, state.jobProfession).overall;
    }
  }
];

const DECISION_MODES = [
  {
    key: "balancedMove",
    label: "Balanced Move",
    shortLabel: "Balanced",
    description: "A general-purpose mode for users who want a balanced mix of affordability, safety, jobs, and resilience.",
    portray: "This mode tries to answer: overall, is this country a sensible move option for a typical household?",
    priorities: ["Affordability", "Safety", "Jobs", "Climate resilience", "Stability"],
    weights: { relocation: 0.28, family: 0.22, jobs: 0.18, stability: 0.12, hazardResilience: 0.1, economy: 0.06, health: 0.04 }
  },
  {
    key: "familyMove",
    label: "Family Move",
    shortLabel: "Family",
    description: "Prioritizes everyday safety, stability, health support, and lower household stress for family relocation decisions.",
    portray: "This mode asks whether the country feels safer and steadier for a family planning a real move.",
    priorities: ["Family safety", "Health support", "Household livability", "Climate resilience", "Stability"],
    weights: { family: 0.34, relocation: 0.22, health: 0.14, hazardResilience: 0.12, stability: 0.1, jobs: 0.05, economy: 0.03 }
  },
  {
    key: "careerGrowth",
    label: "Career Growth",
    shortLabel: "Career",
    description: "Prioritizes job-market strength, economic upside, and stability for users optimizing for work opportunities.",
    portray: "This mode asks where the strongest upside exists for building a career rather than simply reducing risk.",
    priorities: ["Job market", "Economic upside", "Stability", "Livability", "Safety"],
    weights: { jobs: 0.34, economy: 0.24, stability: 0.14, relocation: 0.13, family: 0.08, hazardResilience: 0.04, health: 0.03 }
  },
  {
    key: "retirement",
    label: "Retirement",
    shortLabel: "Retire",
    description: "Prioritizes health support, stability, safety, and manageable everyday living pressure for retirees.",
    portray: "This mode asks whether the country feels steady, healthy, and realistic for a lower-stress retirement plan.",
    priorities: ["Health support", "Safety", "Affordability", "Stability", "Climate resilience"],
    weights: { health: 0.24, family: 0.22, relocation: 0.18, stability: 0.16, hazardResilience: 0.12, economy: 0.05, jobs: 0.03 }
  },
  {
    key: "studyAbroad",
    label: "Study Abroad",
    shortLabel: "Study",
    description: "Balances safety, stability, opportunity, and cost pressure for students and education-focused moves.",
    portray: "This mode asks where the environment looks more supportive for study, daily safety, and future opportunity.",
    priorities: ["Safety", "Stability", "Opportunity", "Affordability", "Health support"],
    weights: { family: 0.22, jobs: 0.2, relocation: 0.18, stability: 0.16, economy: 0.12, health: 0.07, hazardResilience: 0.05 }
  },
  {
    key: "remoteWork",
    label: "Remote Work",
    shortLabel: "Remote",
    description: "Prioritizes livability, job flexibility proxies, stability, and low-friction daily life for remote workers.",
    portray: "This mode asks where a remote worker is more likely to get a stable, practical, and comfortable base.",
    priorities: ["Livability", "Job flexibility", "Stability", "Safety", "Climate resilience"],
    weights: { relocation: 0.26, jobs: 0.24, stability: 0.16, family: 0.12, hazardResilience: 0.1, economy: 0.08, health: 0.04 }
  },
  {
    key: "investment",
    label: "Investment Lens",
    shortLabel: "Invest",
    description: "Prioritizes economic strength, macro stability, and labor-market depth for users thinking in opportunity terms.",
    portray: "This mode asks where the stronger upside sits from a high-level economic and stability perspective.",
    priorities: ["Economic power", "Macro stability", "Market opportunity", "Risk pressure", "Labor depth"],
    weights: { economy: 0.34, stability: 0.24, jobs: 0.18, hazardResilience: 0.08, family: 0.08, relocation: 0.05, health: 0.03 }
  }
];

const state = {
  countriesByIso3: new Map(),
  mapFeatures: [],
  metric: "gdp",
  region: "all",
  search: "",
  selectedIso3: null,
  hoveredIso3: null,
  colorScale: null,
  colorDomain: null,
  mapViewMode: "metric",
  mapLayer: "custom",
  decisionMode: "balancedMove",
  gdpTrendCache: new Map(),
  unCrimeLoaded: false,
  unCrimeError: null,
  newsCache: new Map(),
  weatherCache: new Map(),
  weatherInFlight: new Map(),
  imfForecastByMetric: {
    inflation: new Map(),
    debtPctGdp: new Map(),
    currentAccountPctGdp: new Map()
  },
  forecastMode: false,
  forecastMetric: "gdp",
  visaOriginIso3: "USA",
  visaOriginManualOverride: false,
  visaGoal: "work",
  jobProfession: "software",
  alternativesFocus: "balanced",
  alternativesScope: "region",
  rankingsCarouselIndex: 0,
  watchlistCountries: [],
  watchlistRules: [],
  relocation: {
    incomeMonthly: null,
    adults: 2,
    children: 2,
    lifestyle: "balanced",
    housing: "familyRent",
    cityTier: "secondary",
    schooling: "public",
    healthcare: "public",
    bufferPct: 15
  },
  relocationCountries: [],
  rankingLimit: 25,
  year: null,
  yearRange: { min: 2000, max: 2024 },
  playInterval: null,
  darkMode: localStorage.getItem("theme") === "dark"
};

const ui = {
  metricSelect: document.getElementById("metric-select"),
  regionSelect: document.getElementById("region-select"),
  searchInput: document.getElementById("country-search"),
  mapLayersPanel: document.getElementById("map-layers-panel"),
  mapLayerExplainer: document.getElementById("map-layer-explainer"),
  decisionModePanel: document.getElementById("decision-mode-panel"),
  decisionModeExplainer: document.getElementById("decision-mode-explainer"),
  shareSnapshot: document.getElementById("share-snapshot"),
  clearFilters: document.getElementById("clear-filters"),
  exportJson: document.getElementById("export-json"),
  exportCsv: document.getElementById("export-csv"),
  statusText: document.getElementById("status-text"),
  updatedAt: document.getElementById("updated-at"),
  tooltip: document.getElementById("tooltip"),
  legend: document.getElementById("legend"),
  countryEmpty: document.getElementById("country-empty"),
  countryDetails: document.getElementById("country-details"),
  countryFlag: document.getElementById("country-flag"),
  countryName: document.getElementById("country-name"),
  countrySubtitle: document.getElementById("country-subtitle"),
  detailsJumpMenu: document.getElementById("details-jump-menu"),
  countryHero: document.getElementById("country-hero"),
  countryHeroEyebrow: document.getElementById("country-hero-eyebrow"),
  countryHeroSummary: document.getElementById("country-hero-summary"),
  countryHeroTags: document.getElementById("country-hero-tags"),
  countryHeroOverallRing: document.getElementById("country-hero-overall-ring"),
  countryHeroOverallValue: document.getElementById("country-hero-overall-value"),
  countryHeroPulseLabel: document.getElementById("country-hero-pulse-label"),
  countryHeroMetrics: document.getElementById("country-hero-metrics"),
  countryStory: document.getElementById("country-story"),
  countryStoryTitle: document.getElementById("country-story-title"),
  countryStoryBadge: document.getElementById("country-story-badge"),
  countryStorySummary: document.getElementById("country-story-summary"),
  countryStoryStrengths: document.getElementById("country-story-strengths"),
  countryStoryCautions: document.getElementById("country-story-cautions"),
  countryStoryFit: document.getElementById("country-story-fit"),
  statGrid: document.getElementById("stat-grid"),
  metaGrid: document.getElementById("meta-grid"),
  rankingTitle: document.getElementById("ranking-title"),
  rankingTableBody: document.querySelector("#ranking-table tbody"),
  rankingsCarouselTitle: document.getElementById("rankings-carousel-title"),
  rankingsCarouselSubtitle: document.getElementById("rankings-carousel-subtitle"),
  rankingsCarouselTrack: document.getElementById("rankings-carousel-track"),
  rankingsCarouselDots: document.getElementById("rankings-carousel-dots"),
  rankingsCarouselPrev: document.getElementById("rankings-carousel-prev"),
  rankingsCarouselNext: document.getElementById("rankings-carousel-next"),
  compareA: document.getElementById("compare-a"),
  compareB: document.getElementById("compare-b"),
  compareHeadA: document.getElementById("compare-head-a"),
  compareHeadB: document.getElementById("compare-head-b"),
  compareBody: document.querySelector("#compare-table tbody"),
  refreshTrend: document.getElementById("refresh-trend"),
  trendChart: document.getElementById("trend-chart"),
  trendMeta: document.getElementById("trend-meta"),
  refreshCrime: document.getElementById("refresh-crime"),
  crimeTrendChart: document.getElementById("crime-trend-chart"),
  crimeTrendMeta: document.getElementById("crime-trend-meta"),
  forecastToggle: document.getElementById("forecast-toggle"),
  forecastMetric: document.getElementById("forecast-metric"),
  refreshForecast: document.getElementById("refresh-forecast"),
  forecastChart: document.getElementById("forecast-chart"),
  forecastMeta: document.getElementById("forecast-meta"),
  refreshDisaster: document.getElementById("refresh-disaster"),
  disasterChart: document.getElementById("disaster-chart"),
  disasterMeta: document.getElementById("disaster-meta"),
  refreshHazardLens: document.getElementById("refresh-hazard-lens"),
  hazardLensBody: document.getElementById("hazard-lens-body"),
  hazardLensMeta: document.getElementById("hazard-lens-meta"),
  refreshWeather: document.getElementById("refresh-weather"),
  weatherBody: document.getElementById("weather-body"),
  weatherMeta: document.getElementById("weather-meta"),
  refreshVisaPath: document.getElementById("refresh-visa-path"),
  visaOriginSelect: document.getElementById("visa-origin-select"),
  visaGoalSelect: document.getElementById("visa-goal-select"),
  visaPathBody: document.getElementById("visa-path-body"),
  visaPathMeta: document.getElementById("visa-path-meta"),
  refreshFamilySafety: document.getElementById("refresh-family-safety"),
  familySafetyBody: document.getElementById("family-safety-body"),
  familySafetyMeta: document.getElementById("family-safety-meta"),
  refreshJobFit: document.getElementById("refresh-job-fit"),
  jobProfessionSelect: document.getElementById("job-profession-select"),
  jobFitBody: document.getElementById("job-fit-body"),
  jobFitMeta: document.getElementById("job-fit-meta"),
  refreshAlternatives: document.getElementById("refresh-alternatives"),
  alternativesFocusSelect: document.getElementById("alternatives-focus-select"),
  alternativesScopeSelect: document.getElementById("alternatives-scope-select"),
  alternativesBody: document.getElementById("alternatives-body"),
  alternativesMeta: document.getElementById("alternatives-meta"),
  refreshChangeAlerts: document.getElementById("refresh-change-alerts"),
  changeAlertsBody: document.getElementById("change-alerts-body"),
  changeAlertsMeta: document.getElementById("change-alerts-meta"),
  refreshNews: document.getElementById("refresh-news"),
  newsList: document.getElementById("news-list"),
  newsMeta: document.getElementById("news-meta"),
  watchlistAddCountry: document.getElementById("watchlist-add-country"),
  watchlistCheckAlerts: document.getElementById("watchlist-check-alerts"),
  watchlistMetric: document.getElementById("watchlist-metric"),
  watchlistOperator: document.getElementById("watchlist-operator"),
  watchlistThreshold: document.getElementById("watchlist-threshold"),
  watchlistAddRule: document.getElementById("watchlist-add-rule"),
  watchlistRules: document.getElementById("watchlist-rules"),
  watchlistCountries: document.getElementById("watchlist-countries"),
  watchlistAlerts: document.getElementById("watchlist-alerts"),
  relocateIncome: document.getElementById("relocate-income"),
  relocateAdults: document.getElementById("relocate-adults"),
  relocateChildren: document.getElementById("relocate-children"),
  relocateLifestyle: document.getElementById("relocate-lifestyle"),
  relocateHousing: document.getElementById("relocate-housing"),
  relocateCityTier: document.getElementById("relocate-city-tier"),
  relocateSchooling: document.getElementById("relocate-schooling"),
  relocateHealthcare: document.getElementById("relocate-healthcare"),
  relocateBuffer: document.getElementById("relocate-buffer"),
  relocateCountries: document.getElementById("relocate-countries"),
  relocateCountryEntryInput: document.getElementById("relocate-country-entry-input"),
  relocateAddTyped: document.getElementById("relocate-add-typed"),
  relocateUseCurrent: document.getElementById("relocate-use-current"),
  relocateClear: document.getElementById("relocate-clear"),
  relocateRun: document.getElementById("relocate-run"),
  relocateMeta: document.getElementById("relocate-meta"),
  relocateTableBody: document.querySelector("#relocate-table tbody"),
  yearSlider: document.getElementById("year-slider"),
  yearLabel: document.getElementById("year-label"),
  yearLatest: document.getElementById("year-latest"),
  yearPlay: document.getElementById("year-play"),
  themeToggle: document.getElementById("theme-toggle"),
  zoomIn: document.getElementById("zoom-in"),
  zoomOut: document.getElementById("zoom-out"),
  zoomReset: document.getElementById("zoom-reset")
};

const fmtCompactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2
});

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const fmtCompactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2
});

const fmtInteger = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

let mapSvg;
let mapProjection;
let mapPath;
let countryLayer;
let graticuleLayer;
let zoomBehavior;

// Apply saved theme immediately to avoid flash.
if (state.darkMode) {
  document.documentElement.setAttribute("data-theme", "dark");
  ui.themeToggle.innerHTML = "&#9788;";
}

init().catch((error) => {
  console.error(error);
  setStatus(`Failed to load app: ${error.message}`, true);
});

async function init() {
  setStatus("Loading map + country profile data...");

  const [geoJson, countriesRaw] = await Promise.all([
    fetchFirstWorkingJson(WORLD_GEOJSON_URLS, "World map geometry"),
    loadCountryProfiles()
  ]);

  setStatus("Loading World Bank indicators...");

  const indicatorMaps = await Promise.all([
    loadIndicatorSafely("gdp"),
    loadIndicatorSafely("gdpPerCapita"),
    loadIndicatorSafely("netWorth"),
    loadIndicatorSafely("populationWB"),
    loadIndicatorSafely("lifeExpectancy"),
    loadIndicatorSafely("unemployment"),
    loadIndicatorSafely("privateConsumptionPerCapita"),
    loadIndicatorSafely("priceLevelRatio"),
    loadIndicatorSafely("milExpenditure"),
    loadIndicatorSafely("milExpPctGdp"),
    loadIndicatorSafely("armedForces"),
    loadIndicatorSafely("armedForcesPctLabor")
  ]);

  const indicatorByKey = {
    gdp: indicatorMaps[0],
    gdpPerCapita: indicatorMaps[1],
    netWorth: indicatorMaps[2],
    populationWB: indicatorMaps[3],
    lifeExpectancy: indicatorMaps[4],
    unemployment: indicatorMaps[5],
    privateConsumptionPerCapita: indicatorMaps[6],
    priceLevelRatio: indicatorMaps[7],
    milExpenditure: indicatorMaps[8],
    milExpPctGdp: indicatorMaps[9],
    armedForces: indicatorMaps[10],
    armedForcesPctLabor: indicatorMaps[11]
  };

  hydrateCountryDataset(countriesRaw, indicatorByKey);
  hydrateMapFeatures(geoJson);

  recomputeYearRangeFromIndicators();

  loadWatchlistState();
  setupControls();
  setupGlobalRankingsCarousel();
  setupDetailsJumpMenu();
  setupWatchlistControls();
  setupRelocationPlanner();
  setupYearSlider();
  applySnapshotFromUrl();
  setupPlayback();
  setupThemeToggle();
  setupMap();
  updateAllViews();

  const now = new Date();
  ui.updatedAt.textContent = `Loaded ${now.toLocaleString()}`;
  setStatus("Core data loaded. Loading extended datasets in background...");
  void loadNonBlockingDatasets();
}

async function loadNonBlockingDatasets() {
  const tasks = [
    loadOpenFlightsDataSafely(),
    loadUnCrimeDataSafely(),
    loadBackgroundWorldBankIndicatorsSafely(),
    loadImfSnapshotSafely(),
    loadWhoSnapshotSafely(),
    loadNdGainSnapshotSafely(),
    loadEmdatSnapshotSafely()
  ];

  await Promise.allSettled(tasks);
  recomputeYearRangeFromIndicators();
  syncYearSliderRange();
  updateAllViews();
  if (state.selectedIso3) {
    renderCountryDetails();
    renderCrimeTrendChart(state.selectedIso3);
  }

  setStatus(state.unCrimeLoaded ? "Data loaded." : "Data loaded (UN crime unavailable).");
}

function recomputeYearRangeFromIndicators() {
  let minYear = Infinity;
  let maxYear = -Infinity;

  for (const country of state.countriesByIso3.values()) {
    for (const ind of Object.values(country.indicators)) {
      if (!ind?.byYear) continue;
      for (const y of ind.byYear.keys()) {
        if (y < minYear) minYear = y;
        if (y > maxYear) maxYear = y;
      }
    }
  }

  if (Number.isFinite(minYear) && Number.isFinite(maxYear)) {
    state.yearRange = { min: minYear, max: maxYear };
  }
}

function syncYearSliderRange() {
  if (!ui.yearSlider) return;

  const prevYear = state.year;
  ui.yearSlider.min = state.yearRange.min;
  ui.yearSlider.max = state.yearRange.max;

  if (prevYear == null) {
    ui.yearSlider.value = ui.yearSlider.max;
    ui.yearLabel.textContent = "Latest";
    return;
  }

  if (prevYear < state.yearRange.min || prevYear > state.yearRange.max) {
    state.year = null;
    ui.yearSlider.value = ui.yearSlider.max;
    ui.yearLabel.textContent = "Latest";
    return;
  }

  ui.yearSlider.value = String(prevYear);
  ui.yearLabel.textContent = String(prevYear);
}

async function loadIndicatorSafely(indicatorKey) {
  try {
    return await fetchIndicatorAllYears(INDICATORS[indicatorKey].code);
  } catch (error) {
    console.warn(`Indicator ${indicatorKey} failed:`, error);
    return new Map();
  }
}

function setStatus(message, isError = false) {
  ui.statusText.textContent = message;
  ui.statusText.style.color = isError ? "#b63a3a" : "";
}

async function fetchJson(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText || "HTTP error"} (${url})`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText || "HTTP error"} (${url})`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFirstWorkingJson(urls, label, timeoutMs = 30000) {
  const errors = [];

  for (const url of urls) {
    try {
      const payload = await fetchJson(url, timeoutMs);
      if (payload != null) {
        return payload;
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  throw new Error(`${label} unavailable. ${errors.join(" | ")}`);
}

async function fetchIndicatorAllYears(indicatorCode) {
  const currentYear = new Date().getFullYear();
  const url = `${WORLD_BANK_BASE}/country/all/indicator/${indicatorCode}?format=json&per_page=20000&date=2000:${currentYear}`;
  const payload = await fetchJson(url);
  const rows = Array.isArray(payload) ? payload[1] : [];

  const tempMap = new Map();

  for (const row of rows ?? []) {
    const iso3 = row?.countryiso3code?.trim();
    if (!iso3 || iso3.length !== 3 || row.value == null) continue;

    const year = Number(row.date);
    const value = Number(row.value);
    if (!Number.isFinite(value) || !Number.isFinite(year)) continue;

    if (!tempMap.has(iso3)) tempMap.set(iso3, new Map());
    tempMap.get(iso3).set(year, value);
  }

  const result = new Map();
  for (const [iso3, yearMap] of tempMap) {
    let latestYear = -Infinity;
    let latestValue = null;
    for (const [y, v] of yearMap) {
      if (y > latestYear) { latestYear = y; latestValue = v; }
    }
    result.set(iso3, {
      latest: { value: latestValue, year: latestYear },
      byYear: yearMap
    });
  }
  return result;
}

async function loadCountryProfiles() {
  try {
    const [part1, part2] = await Promise.all([
      fetchJson(REST_COUNTRIES_URL_P1),
      fetchJson(REST_COUNTRIES_URL_P2)
    ]);
    const part2Map = new Map(part2.map((c) => [c.cca3, c]));
    return part1.map((c) => ({ ...c, ...(part2Map.get(c.cca3) ?? {}) }));
  } catch (restError) {
    console.warn("REST Countries failed, falling back to World Bank country endpoint.", restError);
    setStatus("REST Countries unavailable. Falling back to World Bank country profiles...");
    const wbPayload = await fetchJson(WORLD_BANK_COUNTRY_URL);
    const wbRows = Array.isArray(wbPayload) ? wbPayload[1] ?? [] : [];
    return transformWorldBankCountriesToRestLike(wbRows);
  }
}

async function loadBackgroundWorldBankIndicatorsSafely() {
  const extraKeys = [
    "inflation",
    "debtPctGdp",
    "currentAccountPctGdp",
    "poverty215",
    "gini",
    "tourismArrivals",
    "tourismReceipts"
  ];

  const maps = await Promise.all(extraKeys.map((key) => loadIndicatorSafely(key)));
  const byKey = Object.fromEntries(extraKeys.map((key, idx) => [key, maps[idx]]));

  for (const country of state.countriesByIso3.values()) {
    for (const key of extraKeys) {
      country.indicators[key] = byKey[key].get(country.iso3) ?? null;
    }
  }
}

async function loadImfSnapshotSafely() {
  try {
    const payload = await fetchJson(LOCAL_SNAPSHOT_URLS.imf, 30000);
    const series = payload?.series ?? {};
    state.imfForecastByMetric = {
      inflation: buildImfForecastSeriesMap(series?.inflation),
      debtPctGdp: buildImfForecastSeriesMap(series?.debtPctGdp),
      currentAccountPctGdp: buildImfForecastSeriesMap(series?.currentAccountPctGdp)
    };

    for (const country of state.countriesByIso3.values()) {
      country.indicators.imfInflation = indicatorFromYearRecord(series?.inflation?.[country.iso3], { maxYear: CURRENT_YEAR });
      country.indicators.imfDebtPctGdp = indicatorFromYearRecord(series?.debtPctGdp?.[country.iso3], { maxYear: CURRENT_YEAR });
      country.indicators.imfCurrentAccountPctGdp =
        indicatorFromYearRecord(series?.currentAccountPctGdp?.[country.iso3], { maxYear: CURRENT_YEAR });
    }
  } catch (error) {
    console.warn("IMF snapshot load failed:", error);
  }
}

function buildImfForecastSeriesMap(rawSeriesByIso3) {
  const result = new Map();
  if (!rawSeriesByIso3 || typeof rawSeriesByIso3 !== "object") return result;

  for (const [iso3, byYearRaw] of Object.entries(rawSeriesByIso3)) {
    if (!state.countriesByIso3.has(iso3)) continue;
    const points = Object.entries(byYearRaw ?? {})
      .map(([yearText, valueRaw]) => ({ year: Number(yearText), value: Number(valueRaw) }))
      .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.value))
      .sort((a, b) => a.year - b.year);
    if (points.length) {
      result.set(iso3, points);
    }
  }

  return result;
}

async function loadWhoSnapshotSafely() {
  try {
    const payload = await fetchJson(LOCAL_SNAPSHOT_URLS.who, 30000);
    const countries = payload?.countries ?? {};
    for (const country of state.countriesByIso3.values()) {
      const yearly = countries[country.iso3];
      country.indicators.whoLifeExpectancy = indicatorFromYearRecord(yearly);
    }
  } catch (error) {
    console.warn("WHO snapshot load failed:", error);
  }
}

async function loadNdGainSnapshotSafely() {
  try {
    const payload = await fetchJson(LOCAL_SNAPSHOT_URLS.ndgain, 30000);
    const countries = payload?.countries ?? {};
    for (const country of state.countriesByIso3.values()) {
      const row = countries[country.iso3] ?? null;
      country.indicators.ndgainVulnerability = indicatorFromYearRecord(row?.vulnerability);
      country.indicators.ndgainReadiness = indicatorFromYearRecord(row?.readiness);
    }
  } catch (error) {
    console.warn("ND-GAIN snapshot load failed:", error);
  }
}

async function loadEmdatSnapshotSafely() {
  try {
    const payload = await fetchJson(LOCAL_SNAPSHOT_URLS.emdat, 30000);
    const countries = payload?.countries ?? {};
    for (const country of state.countriesByIso3.values()) {
      const row = countries[country.iso3] ?? null;
      country.indicators.emdatEvents = indicatorFromYearRecord(row?.events);
      country.indicators.emdatDeaths = indicatorFromYearRecord(row?.deaths);
      country.indicators.emdatAffected = indicatorFromYearRecord(row?.affected);
      country.indicators.emdatDamageAdjustedUsd = indicatorFromYearRecord(row?.damageAdjustedUsd);
    }
  } catch (error) {
    console.warn("EM-DAT snapshot load failed:", error);
  }
}

function indicatorFromYearRecord(record, options = {}) {
  if (!record || typeof record !== "object") return null;
  const maxYear = Number.isFinite(options.maxYear) ? options.maxYear : Infinity;

  const byYear = new Map();
  let latestYear = -Infinity;
  let latestValue = null;

  for (const [yearText, valueRaw] of Object.entries(record)) {
    const year = Number(yearText);
    const value = Number(valueRaw);
    if (!Number.isFinite(year) || !Number.isFinite(value) || year > maxYear) continue;
    byYear.set(year, value);
    if (year > latestYear) {
      latestYear = year;
      latestValue = value;
    }
  }

  if (!byYear.size) return null;
  return {
    latest: { value: latestValue, year: latestYear },
    byYear
  };
}

async function loadUnCrimeDataSafely(force = false) {
  if (!force && state.unCrimeLoaded) return;

  try {
    const crimeByIso3 = await fetchUnCrimeSeriesByCountry();
    for (const country of state.countriesByIso3.values()) {
      country.indicators.crimeRate = crimeByIso3.get(country.iso3) ?? null;
    }
    state.unCrimeLoaded = true;
    state.unCrimeError = null;
  } catch (error) {
    state.unCrimeLoaded = false;
    state.unCrimeError = error?.message ?? "Unknown error";
    console.warn("UN crime data load failed:", error);
  }
}

async function fetchUnCrimeSeriesByCountry() {
  const payload = await fetchFirstWorkingJson(UN_SDG_CRIME_URLS, "UN crime dataset", 120000);
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  const m49ToIso3 = new Map();
  for (const country of state.countriesByIso3.values()) {
    const m49 = normalizeM49Code(country.ccn3);
    if (m49) m49ToIso3.set(m49, country.iso3);
  }

  const nameLookup = buildCountryNameLookup();
  const seriesByIso3 = new Map();

  for (const row of rows) {
    if (String(row?.series ?? "").toUpperCase() !== "VC_IHR_PSRC") continue;

    const year = Number(row?.timePeriodStart);
    const value = Number(row?.value);
    if (!Number.isFinite(year) || !Number.isFinite(value)) continue;

    const sex = String(row?.dimensions?.Sex ?? "").toUpperCase();
    if (sex && sex !== "BOTHSEX") continue;

    let iso3 = m49ToIso3.get(normalizeM49Code(row?.geoAreaCode)) ?? null;
    if (!iso3) {
      iso3 = resolveCountryNameToIso3(row?.geoAreaName, nameLookup);
    }
    if (!iso3) continue;

    if (!seriesByIso3.has(iso3)) seriesByIso3.set(iso3, new Map());

    const byYear = seriesByIso3.get(iso3);
    const prev = byYear.get(year);
    const incomingScore = getUnCrimeDataQualityScore(row);

    if (!prev || incomingScore >= prev.score) {
      byYear.set(year, { value, score: incomingScore });
    }
  }

  const result = new Map();
  for (const [iso3, byYearRaw] of seriesByIso3) {
    const byYear = new Map();
    let latestYear = -Infinity;
    let latestValue = null;

    for (const [year, obj] of byYearRaw) {
      byYear.set(year, obj.value);
      if (year > latestYear) {
        latestYear = year;
        latestValue = obj.value;
      }
    }

    result.set(iso3, {
      latest: { value: latestValue, year: latestYear },
      byYear
    });
  }

  return result;
}

function getUnCrimeDataQualityScore(row) {
  const nature = String(row?.attributes?.Nature ?? "").toUpperCase();
  if (nature === "C") return 5;
  if (nature === "CA") return 4;
  if (nature === "E") return 3;
  if (nature === "M") return 2;
  return 1;
}

function normalizeM49Code(value) {
  if (value == null) return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return String(Number(digits)).padStart(3, "0");
}

async function loadOpenFlightsDataSafely() {
  try {
    const countsByIso3 = await fetchOpenFlightsCountryCounts();
    applyOpenFlightsCounts(countsByIso3);
  } catch (error) {
    console.warn("OpenFlights load failed:", error);
  }
}

async function fetchOpenFlightsCountryCounts() {
  const [airlinesText, airportsText] = await Promise.all([
    fetchText(OPENFLIGHTS_AIRLINES_URL),
    fetchText(OPENFLIGHTS_AIRPORTS_URL)
  ]);

  const countryNameLookup = buildCountryNameLookup();
  const countsByIso3 = new Map();

  const ensureCounts = (iso3) => {
    if (!countsByIso3.has(iso3)) {
      countsByIso3.set(iso3, { airlinesCount: 0, airportsCount: 0 });
    }
    return countsByIso3.get(iso3);
  };

  const airlineRows = d3.csvParseRows(airlinesText);
  for (const row of airlineRows) {
    const iso3 = resolveCountryNameToIso3(row?.[6], countryNameLookup);
    if (!iso3) continue;
    ensureCounts(iso3).airlinesCount += 1;
  }

  const airportRows = d3.csvParseRows(airportsText);
  for (const row of airportRows) {
    const iso3 = resolveCountryNameToIso3(row?.[3], countryNameLookup);
    if (!iso3) continue;
    ensureCounts(iso3).airportsCount += 1;
  }

  return countsByIso3;
}

function applyOpenFlightsCounts(countsByIso3) {
  for (const country of state.countriesByIso3.values()) {
    const counts = countsByIso3.get(country.iso3);
    country.airlinesCount = counts?.airlinesCount ?? 0;
    country.airportsCount = counts?.airportsCount ?? 0;
  }
}

function transformWorldBankCountriesToRestLike(wbRows) {
  return (wbRows ?? [])
    .filter((row) => row?.region?.value !== "Aggregates")
    .filter((row) => typeof row?.id === "string" && row.id.trim().length === 3)
    .map((row) => {
      const iso3 = row.id.trim().toUpperCase();
      const iso2 = (row.iso2Code ?? "").trim().toLowerCase();
      const latitude = Number(row.latitude);
      const longitude = Number(row.longitude);
      const latlng =
        Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;

      return {
        cca3: iso3,
        ccn3: null,
        name: { common: row.name ?? iso3, official: row.name ?? iso3 },
        capital: row.capitalCity ? [row.capitalCity] : [],
        region: row.region?.value || "Other",
        subregion: row.adminregion?.value || "N/A",
        population: null,
        area: null,
        languages: null,
        currencies: null,
        flags: {
          png: iso2 ? `https://flagcdn.com/w160/${iso2}.png` : "",
          svg: iso2 ? `https://flagcdn.com/${iso2}.svg` : ""
        },
        timezones: [],
        continents: [],
        latlng,
        unMember: null,
        independent: null,
        landlocked: null,
        startOfWeek: null,
        car: null
      };
    });
}

function hydrateCountryDataset(countriesRaw, indicatorByKey) {
  state.countriesByIso3.clear();

  for (const item of countriesRaw) {
    const iso3 = item.cca3;
    if (!iso3) {
      continue;
    }

    state.countriesByIso3.set(iso3, {
      iso3,
      ccn3: item.ccn3 ?? null,
      name: item.name?.common ?? iso3,
      officialName: item.name?.official ?? item.name?.common ?? iso3,
      capital: item.capital?.join(", ") || "N/A",
      region: item.region || "Other",
      subregion: item.subregion || "N/A",
      population: numberOrNull(item.population),
      area: numberOrNull(item.area),
      languages: item.languages ? Object.values(item.languages).join(", ") : "N/A",
      currencies: item.currencies
        ? Object.values(item.currencies)
            .map((currency) => currency.name)
            .join(", ")
        : "N/A",
      flagSvg: item.flags?.svg ?? item.flags?.png ?? "",
      timezones: item.timezones?.join(", ") || "N/A",
      continents: item.continents?.join(", ") || "N/A",
      latlng: Array.isArray(item.latlng) ? item.latlng : null,
      unMember: item.unMember,
      independent: item.independent,
      landlocked: item.landlocked,
      startOfWeek: item.startOfWeek ?? "N/A",
      drivingSide: item.car?.side ?? "N/A",
      airlinesCount: 0,
      airportsCount: 0,
      indicators: {
        gdp: indicatorByKey.gdp.get(iso3) ?? null,
        gdpPerCapita: indicatorByKey.gdpPerCapita.get(iso3) ?? null,
        netWorth: indicatorByKey.netWorth.get(iso3) ?? null,
        populationWB: indicatorByKey.populationWB.get(iso3) ?? null,
        lifeExpectancy: indicatorByKey.lifeExpectancy.get(iso3) ?? null,
        unemployment: indicatorByKey.unemployment.get(iso3) ?? null,
        privateConsumptionPerCapita: indicatorByKey.privateConsumptionPerCapita.get(iso3) ?? null,
        priceLevelRatio: indicatorByKey.priceLevelRatio.get(iso3) ?? null,
        imfInflation: null,
        imfDebtPctGdp: null,
        imfCurrentAccountPctGdp: null,
        inflation: null,
        debtPctGdp: null,
        currentAccountPctGdp: null,
        poverty215: null,
        gini: null,
        tourismArrivals: null,
        tourismReceipts: null,
        whoLifeExpectancy: null,
        ndgainVulnerability: null,
        ndgainReadiness: null,
        emdatEvents: null,
        emdatDeaths: null,
        emdatAffected: null,
        emdatDamageAdjustedUsd: null,
        crimeRate: null,
        milExpenditure: indicatorByKey.milExpenditure.get(iso3) ?? null,
        milExpPctGdp: indicatorByKey.milExpPctGdp.get(iso3) ?? null,
        armedForces: indicatorByKey.armedForces.get(iso3) ?? null,
        armedForcesPctLabor: indicatorByKey.armedForcesPctLabor.get(iso3) ?? null
      }
    });
  }
}

function hydrateMapFeatures(geoJson) {
  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];
  const nameLookup = buildCountryNameLookup();

  state.mapFeatures = features.map((feature, index) => {
    const iso3 = getIso3FromFeature(feature, nameLookup);
    const mapId = iso3 || feature.id || `f-${index}`;
    feature.properties = {
      ...(feature.properties ?? {}),
      iso3,
      mapId
    };
    return feature;
  });
}

function getIso3FromFeature(feature, nameLookup) {
  const props = feature?.properties ?? {};
  const candidates = [
    feature?.id,
    props.iso_a3,
    props.ISO_A3,
    props.adm0_a3,
    props.ADM0_A3,
    props.gu_a3,
    props.GU_A3,
    props.sr_adm0_a3,
    props.SR_ADM0_A3
  ];

  for (const candidate of candidates) {
    const iso3 = String(candidate ?? "").trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(iso3) && state.countriesByIso3.has(iso3)) {
      return iso3;
    }
  }

  const nameCandidates = [
    props.name,
    props.NAME,
    props.admin,
    props.ADMIN,
    props.sovereignt,
    props.SOVEREIGNT,
    props.name_long,
    props.NAME_LONG,
    props.brk_name,
    props.BRK_NAME
  ];

  for (const name of nameCandidates) {
    const normalized = normalizeCountryName(name);
    if (!normalized) continue;
    const iso3 = nameLookup.get(normalized);
    if (iso3) return iso3;
  }

  return null;
}

function buildCountryNameLookup() {
  const lookup = new Map();

  for (const country of state.countriesByIso3.values()) {
    const names = [country.name, country.officialName];
    for (const name of names) {
      const normalized = normalizeCountryName(name);
      if (normalized) {
        lookup.set(normalized, country.iso3);
      }
    }
  }

  // Common map-vs-dataset naming differences.
  const aliases = {
    "united states": "USA",
    "united states of america": "USA",
    "russia": "RUS",
    "russian federation": "RUS",
    "south korea": "KOR",
    "north korea": "PRK",
    "iran": "IRN",
    "iran islamic republic of": "IRN",
    "syria": "SYR",
    "syrian arab republic": "SYR",
    "venezuela": "VEN",
    "venezuela bolivarian republic of": "VEN",
    "bolivia": "BOL",
    "bolivia plurinational state of": "BOL",
    "moldova": "MDA",
    "moldova republic of": "MDA",
    "tanzania": "TZA",
    "tanzania united republic of": "TZA",
    "laos": "LAO",
    "lao peoples democratic republic": "LAO",
    "vietnam": "VNM",
    "viet nam": "VNM",
    "brunei": "BRN",
    "brunei darussalam": "BRN",
    "cape verde": "CPV",
    "cabo verde": "CPV",
    "czech republic": "CZE",
    "czechia": "CZE",
    "swaziland": "SWZ",
    "eswatini": "SWZ",
    "palestine": "PSE",
    "state of palestine": "PSE",
    "myanmar": "MMR",
    "burma": "MMR",
    "congo": "COG",
    "republic of the congo": "COG",
    "democratic republic of the congo": "COD",
    "congo kinshasa": "COD",
    "congo brazzaville": "COG",
    "macedonia": "MKD",
    "north macedonia": "MKD",
    "micronesia": "FSM",
    "micronesia federated states of": "FSM",
    "st helena": "SHN",
    "saint helena": "SHN",
    "saint vincent": "VCT",
    "saint vincent and the grenadines": "VCT",
    "st vincent and the grenadines": "VCT",
    "st kitts and nevis": "KNA",
    "saint kitts and nevis": "KNA",
    "st lucia": "LCA",
    "saint lucia": "LCA",
    "curacao": "CUW",
    "kosovo": "XKX",
    "taiwan": "TWN",
    "taiwan province of china": "TWN",
    "ivory coast": "CIV",
    "cote divoire": "CIV"
  };

  for (const [name, iso3] of Object.entries(aliases)) {
    if (state.countriesByIso3.has(iso3)) {
      const normalized = normalizeCountryName(name);
      if (normalized) lookup.set(normalized, iso3);
    }
  }

  return lookup;
}

function resolveCountryNameToIso3(countryName, nameLookup) {
  if (!countryName || countryName === "\\N") return null;
  const normalized = normalizeCountryName(countryName);
  if (!normalized || normalized === "n") return null;
  return nameLookup.get(normalized) ?? null;
}

function normalizeCountryName(value) {
  if (typeof value !== "string") return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(the|of|and|republic|state|federal|democratic|kingdom|islamic|arab|plurinational|peoples)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function setupControls() {
  renderMapLayersPanel();
  renderDecisionModePanel();

  for (const metric of METRICS) {
    const opt = document.createElement("option");
    opt.value = metric.key;
    opt.textContent = metric.label;
    ui.metricSelect.append(opt);
  }

  const regions = [...new Set([...state.countriesByIso3.values()].map((c) => c.region).filter(Boolean))].sort();
  for (const region of regions) {
    const opt = document.createElement("option");
    opt.value = region;
    opt.textContent = region;
    ui.regionSelect.append(opt);
  }

  const countriesSorted = [...state.countriesByIso3.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const country of countriesSorted) {
    const optA = document.createElement("option");
    optA.value = country.iso3;
    optA.textContent = country.name;

    const optB = optA.cloneNode(true);
    ui.compareA.append(optA);
    ui.compareB.append(optB);
  }

  if (state.countriesByIso3.has("USA")) ui.compareA.value = "USA";
  if (state.countriesByIso3.has("CHN")) ui.compareB.value = "CHN";

  if (ui.visaOriginSelect && !ui.visaOriginSelect.options.length) {
    for (const country of countriesSorted) {
      const opt = document.createElement("option");
      opt.value = country.iso3;
      opt.textContent = `${country.name} (${country.iso3})`;
      ui.visaOriginSelect.append(opt);
    }
  }
  if (ui.visaOriginSelect) {
    if (!state.countriesByIso3.has(state.visaOriginIso3)) {
      state.visaOriginIso3 = state.countriesByIso3.has("USA") ? "USA" : (countriesSorted[0]?.iso3 ?? "");
    }
    ui.visaOriginSelect.value = state.visaOriginIso3;
  }
  if (ui.visaGoalSelect) {
    ui.visaGoalSelect.value = state.visaGoal;
  }

  if (ui.jobProfessionSelect && !ui.jobProfessionSelect.options.length) {
    for (const profile of JOB_PROFILES) {
      const opt = document.createElement("option");
      opt.value = profile.key;
      opt.textContent = profile.label;
      ui.jobProfessionSelect.append(opt);
    }
    ui.jobProfessionSelect.value = state.jobProfession;
  }

  if (ui.alternativesFocusSelect) ui.alternativesFocusSelect.value = state.alternativesFocus;
  if (ui.alternativesScopeSelect) ui.alternativesScopeSelect.value = state.alternativesScope;

  if (ui.forecastMetric) {
    for (const metric of FORECAST_METRICS) {
      const opt = document.createElement("option");
      opt.value = metric.key;
      opt.textContent = metric.label;
      ui.forecastMetric.append(opt);
    }
    ui.forecastMetric.value = state.forecastMetric;
  }

  ui.metricSelect.value = state.metric;

  ui.metricSelect.addEventListener("change", () => {
    state.metric = ui.metricSelect.value;
    state.mapViewMode = "metric";
    state.mapLayer = "custom";
    renderMapLayersPanel();
    updateAllViews();
  });

  ui.regionSelect.addEventListener("change", () => {
    state.region = ui.regionSelect.value;
    updateAllViews();
  });

  ui.searchInput.addEventListener("input", debounce(() => {
    state.search = ui.searchInput.value.trim().toLowerCase();
    if (state.search) {
      state.selectedIso3 = findBestSearchMatchIso3(state.search);
    }
    updateAllViews();
  }, 200));

  ui.clearFilters.addEventListener("click", () => {
    state.region = "all";
    state.search = "";
    state.year = null;
    ui.regionSelect.value = "all";
    ui.searchInput.value = "";
    stopPlayback();
    if (ui.yearSlider) {
      ui.yearSlider.value = ui.yearSlider.max;
      ui.yearLabel.textContent = "Latest";
    }
    updateAllViews();
  });

  ui.exportJson.addEventListener("click", exportDatasetAsJson);
  ui.exportCsv.addEventListener("click", exportDatasetAsCsv);
  if (ui.shareSnapshot) {
    ui.shareSnapshot.addEventListener("click", copySnapshotLink);
  }

  ui.compareA.addEventListener("change", () => {
    renderComparisonTable();
    renderRelocationTable();
  });
  ui.compareB.addEventListener("change", () => {
    renderComparisonTable();
    renderRelocationTable();
  });

  ui.refreshTrend.addEventListener("click", async () => {
    if (!state.selectedIso3) return;
    await loadGdpTrend(state.selectedIso3, true);
    renderTrendChart(state.selectedIso3);
  });

  if (ui.refreshCrime) {
    ui.refreshCrime.addEventListener("click", async () => {
      setStatus("Refreshing UN crime data...");
      await loadUnCrimeDataSafely(true);
      recomputeYearRangeFromIndicators();
      syncYearSliderRange();
      updateAllViews();
      if (state.selectedIso3) {
        renderCrimeTrendChart(state.selectedIso3);
      }
      setStatus(state.unCrimeLoaded ? "Data loaded." : "Core data loaded. UN crime data unavailable.");
    });
  }

  if (ui.refreshWeather) {
    ui.refreshWeather.addEventListener("click", async () => {
      const iso3 = state.selectedIso3;
      if (!iso3) return;
      if (ui.weatherBody) {
        ui.weatherBody.innerHTML = '<p class="weather-loading">Refreshing live weather…</p>';
      }
      if (ui.weatherMeta) {
        ui.weatherMeta.textContent = "Refreshing current weather...";
      }
      try {
        await loadCountryWeather(iso3, true);
      } catch (error) {
        console.warn("Weather refresh failed:", error);
      }
      if (state.selectedIso3 === iso3) {
        renderWeatherBlock(iso3);
      }
    });
  }

  if (ui.forecastToggle) {
    ui.forecastToggle.addEventListener("click", () => {
      state.forecastMode = !state.forecastMode;
      updateForecastToggleButton();
      if (state.selectedIso3) {
        renderForecastChart(state.selectedIso3);
      }
    });
  }

  if (ui.forecastMetric) {
    ui.forecastMetric.addEventListener("change", () => {
      state.forecastMetric = ui.forecastMetric.value;
      if (state.selectedIso3) {
        renderForecastChart(state.selectedIso3);
      }
    });
  }

  if (ui.refreshForecast) {
    ui.refreshForecast.addEventListener("click", () => {
      if (!state.selectedIso3) return;
      renderForecastChart(state.selectedIso3);
    });
  }

  if (ui.refreshDisaster) {
    ui.refreshDisaster.addEventListener("click", () => {
      if (!state.selectedIso3) return;
      renderDisasterTimelineChart(state.selectedIso3);
    });
  }

  if (ui.refreshHazardLens) {
    ui.refreshHazardLens.addEventListener("click", () => {
      if (!state.selectedIso3) return;
      renderHazardLens(state.selectedIso3);
    });
  }

  if (ui.visaOriginSelect) {
    ui.visaOriginSelect.addEventListener("change", () => {
      state.visaOriginIso3 = ui.visaOriginSelect.value;
      state.visaOriginManualOverride = state.selectedIso3
        ? ui.visaOriginSelect.value !== state.selectedIso3
        : true;
      if (state.selectedIso3) renderVisaPathFinder(state.selectedIso3);
    });
  }
  if (ui.visaGoalSelect) {
    ui.visaGoalSelect.addEventListener("change", () => {
      state.visaGoal = ui.visaGoalSelect.value;
      if (state.selectedIso3) renderVisaPathFinder(state.selectedIso3);
    });
  }
  if (ui.refreshVisaPath) {
    ui.refreshVisaPath.addEventListener("click", () => {
      if (!state.selectedIso3) return;
      renderVisaPathFinder(state.selectedIso3);
    });
  }

  if (ui.jobProfessionSelect) {
    ui.jobProfessionSelect.addEventListener("change", () => {
      state.jobProfession = ui.jobProfessionSelect.value;
      if (state.selectedIso3) {
        renderJobMarketFit(state.selectedIso3);
        renderBestAlternatives(state.selectedIso3);
        const selectedCountry = getCountryByIso3(state.selectedIso3);
        if (selectedCountry) {
          renderCountryHero(selectedCountry);
        }
      }
      renderDecisionModePanel();
      renderMapLayerExplainer();
      if (state.mapViewMode === "layer" && ["jobs", "decisionFit"].includes(state.mapLayer)) {
        updateAllViews();
      } else {
        renderGlobalRankingsCarousel();
      }
    });
  }
  if (ui.refreshJobFit) {
    ui.refreshJobFit.addEventListener("click", () => {
      if (!state.selectedIso3) return;
      renderJobMarketFit(state.selectedIso3);
    });
  }

  if (ui.refreshFamilySafety) {
    ui.refreshFamilySafety.addEventListener("click", () => {
      if (!state.selectedIso3) return;
      renderFamilySafetyLens(state.selectedIso3);
    });
  }

  if (ui.alternativesFocusSelect) {
    ui.alternativesFocusSelect.addEventListener("change", () => {
      state.alternativesFocus = ui.alternativesFocusSelect.value;
      if (state.selectedIso3) renderBestAlternatives(state.selectedIso3);
    });
  }
  if (ui.alternativesScopeSelect) {
    ui.alternativesScopeSelect.addEventListener("change", () => {
      state.alternativesScope = ui.alternativesScopeSelect.value;
      if (state.selectedIso3) renderBestAlternatives(state.selectedIso3);
    });
  }
  if (ui.refreshAlternatives) {
    ui.refreshAlternatives.addEventListener("click", () => {
      if (!state.selectedIso3) return;
      renderBestAlternatives(state.selectedIso3);
    });
  }

  if (ui.refreshChangeAlerts) {
    ui.refreshChangeAlerts.addEventListener("click", () => {
      if (!state.selectedIso3) return;
      renderCountryChangeAlerts(state.selectedIso3);
    });
  }

  ui.refreshNews.addEventListener("click", async () => {
    const iso3 = state.selectedIso3;
    if (!iso3) return;
    ui.newsList.innerHTML =
      '<p class="news-loading">Loading news\u2026</p>' +
      '<div class="news-progress-wrap"><div class="news-progress-bar" id="news-progress"></div></div>' +
      '<p class="news-progress-label" id="news-progress-label">Connecting to news sources\u2026</p>';
    const onProgress = (pct, label) => {
      const bar = document.getElementById("news-progress");
      const lbl = document.getElementById("news-progress-label");
      if (bar) bar.style.width = pct + "%";
      if (lbl) lbl.textContent = label;
    };
    await loadCountryNews(iso3, true, onProgress);
    renderNewsBlock(iso3);
  });

  updateForecastToggleButton();
}

function renderDecisionModePanel() {
  if (!ui.decisionModePanel || !ui.decisionModeExplainer) return;
  ui.decisionModePanel.innerHTML = DECISION_MODES.map((mode) => `
    <button
      class="decision-mode-pill ${state.decisionMode === mode.key ? "active" : ""}"
      data-mode="${escapeHtml(mode.key)}"
      title="${escapeHtml(mode.description)}"
      aria-pressed="${state.decisionMode === mode.key ? "true" : "false"}"
    >${escapeHtml(mode.shortLabel)}</button>
  `).join("");

  if (!ui.decisionModePanel.dataset.bound) {
    ui.decisionModePanel.addEventListener("click", (event) => {
      const button = event.target.closest(".decision-mode-pill[data-mode]");
      if (!button) return;
      const modeKey = button.getAttribute("data-mode");
      if (!modeKey || !DECISION_MODES.some((mode) => mode.key === modeKey)) return;
      state.decisionMode = modeKey;
      renderDecisionModePanel();
      updateAllViews();
    });
    ui.decisionModePanel.dataset.bound = "1";
  }

  renderDecisionModeExplainer();
}

function renderDecisionModeExplainer() {
  if (!ui.decisionModeExplainer) return;
  const mode = getDecisionModeConfig();
  const selectedCountry = getCountryByIso3(state.selectedIso3);
  const score = selectedCountry ? computeDecisionModeScore(selectedCountry) : null;
  const ranking = selectedCountry ? getDecisionModeRankingForCountry(selectedCountry) : null;

  let scoreNumber = "Pick a country";
  let scoreCaption = "Decision Fit";
  let scoreCopy = "Click a country to see how well it matches this decision mode.";
  if (selectedCountry && score && Number.isFinite(score.overall)) {
    scoreNumber = `${score.overall.toFixed(1)} /100`;
    scoreCaption = selectedCountry.name;
    const rankText = ranking ? `Rank ${ranking.rank} of ${ranking.totalShown} shown countries.` : "Ranking unavailable.";
    scoreCopy = `${selectedCountry.name} currently scores ${score.overall.toFixed(1)} /100 for ${mode.label}. ${rankText}`;
  }

  ui.decisionModeExplainer.innerHTML = `
    <div class="decision-mode-top">
      <div>
        <p class="decision-mode-title">${escapeHtml(mode.label)}</p>
        <p class="decision-mode-copy">${escapeHtml(mode.description)}</p>
      </div>
      <span class="decision-mode-badge">Decision Mode</span>
    </div>
    <p class="decision-mode-copy">${escapeHtml(mode.portray)}</p>
    <div class="decision-mode-score">
      <div class="decision-mode-score-value">
        <div class="decision-mode-score-number">${escapeHtml(scoreNumber)}</div>
        <div class="decision-mode-score-caption">${escapeHtml(scoreCaption)}</div>
      </div>
      <div class="decision-mode-copy">${escapeHtml(scoreCopy)}</div>
    </div>
    <p class="decision-mode-priority-label">This mode prioritizes:</p>
    <div class="decision-mode-priority-list">
      ${mode.priorities.map((item) => `<span class="decision-mode-priority">${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function renderMapLayersPanel() {
  if (!ui.mapLayersPanel) return;
  ui.mapLayersPanel.innerHTML = MAP_LAYERS.map((layer) => {
    const active =
      layer.key === "custom"
        ? state.mapViewMode === "metric"
        : state.mapViewMode === "layer" && state.mapLayer === layer.key;
    return `
      <button
        class="map-layer-pill ${active ? "active" : ""}"
        data-layer="${escapeHtml(layer.key)}"
        title="${escapeHtml(layer.description)}"
        aria-pressed="${active ? "true" : "false"}"
      >${escapeHtml(layer.shortLabel)}</button>
    `;
  }).join("");

  if (!ui.mapLayersPanel.dataset.bound) {
    ui.mapLayersPanel.addEventListener("click", (event) => {
      const button = event.target.closest(".map-layer-pill[data-layer]");
      if (!button) return;
      const layerKey = button.getAttribute("data-layer");
      if (!layerKey) return;

      if (layerKey === "custom") {
        state.mapViewMode = "metric";
        state.mapLayer = "custom";
      } else if (MAP_LAYERS.some((layer) => layer.key === layerKey)) {
        state.mapViewMode = "layer";
        state.mapLayer = layerKey;
      }

      renderMapLayersPanel();
      updateAllViews();
    });
    ui.mapLayersPanel.dataset.bound = "1";
  }

  renderMapLayerExplainer();
}

function renderMapLayerExplainer() {
  if (!ui.mapLayerExplainer) return;
  const active = getActiveMapConfig();
  const selectedCountry = getCountryByIso3(state.selectedIso3);
  const selectedValue = selectedCountry ? getActiveMapValue(selectedCountry) : null;
  const ranking = selectedCountry ? getActiveMapRankingForCountry(selectedCountry) : null;
  const badge = active.source === "layer"
    ? (active.higherIsBetter ? { text: "Higher is better", tone: "good" } : { text: "Higher = more risk", tone: "risk" })
    : { text: "Raw metric", tone: "neutral" };

  let scoreNumber = "Pick a country";
  let scoreCaption = "Selected country";
  let scoreCopy = "Click or search a country to see how it scores on the active map layer.";
  if (selectedCountry && Number.isFinite(selectedValue)) {
    scoreNumber = formatValue(selectedValue, active.type);
    scoreCaption = selectedCountry.name;
    const rankText = ranking ? `Rank ${ranking.rank} of ${ranking.totalShown} shown countries.` : "Ranking unavailable.";
    scoreCopy = `${selectedCountry.name} currently maps at ${formatValue(selectedValue, active.type)}. ${rankText}`;
  } else if (selectedCountry) {
    scoreNumber = "N/A";
    scoreCaption = selectedCountry.name;
    scoreCopy = `${selectedCountry.name} does not currently have enough data for this view.`;
  }

  ui.mapLayerExplainer.innerHTML = `
    <div class="map-layer-explainer-top">
      <div>
        <p class="map-layer-explainer-title">${escapeHtml(active.label)}</p>
        <p class="map-layer-explainer-copy">${escapeHtml(active.description)}</p>
      </div>
      <span class="map-layer-explainer-badge ${badge.tone}">${escapeHtml(badge.text)}</span>
    </div>
    <p class="map-layer-explainer-copy">${escapeHtml(active.portray || "")}</p>
    <div class="map-layer-explainer-score">
      <div class="map-layer-score-value">
        <div class="map-layer-score-number">${escapeHtml(scoreNumber)}</div>
        <div class="map-layer-score-caption">${escapeHtml(scoreCaption)}</div>
      </div>
      <div class="map-layer-score-copy">${escapeHtml(scoreCopy)}</div>
    </div>
    <p class="map-layer-factor-label">This layer is built from:</p>
    <div class="map-layer-factor-list">
      ${(active.factors || []).map((factor) => `<span class="map-layer-factor">${escapeHtml(factor)}</span>`).join("")}
    </div>
  `;
}

function getActiveMapRankingForCountry(country) {
  if (!country) return null;
  const active = getActiveMapConfig();
  const rows = [...state.countriesByIso3.values()]
    .filter((entry) => isCountryVisible(entry))
    .map((entry) => ({ iso3: entry.iso3, value: getActiveMapValue(entry) }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => active.higherIsBetter ? b.value - a.value : a.value - b.value);

  const index = rows.findIndex((entry) => entry.iso3 === country.iso3);
  if (index === -1) return null;
  return { rank: index + 1, totalShown: rows.length };
}

function setupGlobalRankingsCarousel() {
  if (
    !ui.rankingsCarouselTrack ||
    !ui.rankingsCarouselTitle ||
    !ui.rankingsCarouselSubtitle ||
    !ui.rankingsCarouselDots
  ) {
    return;
  }

  ui.rankingsCarouselPrev?.addEventListener("click", () => {
    const total = GLOBAL_RANKING_CAROUSEL_SLIDES.length;
    state.rankingsCarouselIndex = (state.rankingsCarouselIndex - 1 + total) % total;
    renderGlobalRankingsCarousel();
  });

  ui.rankingsCarouselNext?.addEventListener("click", () => {
    const total = GLOBAL_RANKING_CAROUSEL_SLIDES.length;
    state.rankingsCarouselIndex = (state.rankingsCarouselIndex + 1) % total;
    renderGlobalRankingsCarousel();
  });

  ui.rankingsCarouselDots.addEventListener("click", (event) => {
    const dot = event.target.closest(".rankings-carousel-dot[data-index]");
    if (!dot) return;
    const index = Number(dot.getAttribute("data-index"));
    if (!Number.isInteger(index)) return;
    state.rankingsCarouselIndex = index;
    renderGlobalRankingsCarousel();
  });

  ui.rankingsCarouselTrack.addEventListener("click", (event) => {
    const card = event.target.closest(".carousel-card[data-iso3]");
    if (!card) return;
    const iso3 = card.getAttribute("data-iso3");
    if (!iso3 || !state.countriesByIso3.has(iso3)) return;
    state.selectedIso3 = iso3;
    renderCountryDetails();
    renderRelocationTable();
    repaintMap();
  });
}

function setupDetailsJumpMenu() {
  if (!ui.detailsJumpMenu || !ui.countryDetails) return;

  ui.detailsJumpMenu.addEventListener("click", (event) => {
    const button = event.target.closest(".details-jump-link");
    if (!button) return;

    const targetId = button.getAttribute("data-target");
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveDetailsJumpLink(targetId);
  });

  ui.countryDetails.addEventListener("scroll", debounce(updateActiveDetailsJumpLinkFromScroll, 40));
}

function setActiveDetailsJumpLink(targetId) {
  if (!ui.detailsJumpMenu) return;
  for (const link of ui.detailsJumpMenu.querySelectorAll(".details-jump-link")) {
    link.classList.toggle("active", link.getAttribute("data-target") === targetId);
  }
}

function updateActiveDetailsJumpLinkFromScroll() {
  if (!ui.detailsJumpMenu || !ui.countryDetails || ui.countryDetails.classList.contains("hidden")) return;
  const targets = [...ui.countryDetails.querySelectorAll(".jump-target[id]")];
  if (!targets.length) return;

  const containerTop = ui.countryDetails.getBoundingClientRect().top;
  let bestTarget = targets[0];
  let bestDistance = Infinity;

  for (const target of targets) {
    const distance = Math.abs(target.getBoundingClientRect().top - containerTop - 88);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestTarget = target;
    }
  }

  if (bestTarget?.id) {
    setActiveDetailsJumpLink(bestTarget.id);
  }
}

function setupWatchlistControls() {
  if (!ui.watchlistMetric || !ui.watchlistAddRule) return;

  if (!ui.watchlistMetric.options.length) {
    for (const metric of WATCHLIST_ALERT_METRICS) {
      const opt = document.createElement("option");
      opt.value = metric.key;
      opt.textContent = metric.label;
      ui.watchlistMetric.append(opt);
    }
  }

  if (ui.watchlistAddCountry) {
    ui.watchlistAddCountry.addEventListener("click", () => {
      if (!state.selectedIso3) {
        setStatus("Select a country first, then add it to watchlist.");
        return;
      }
      addWatchlistCountry(state.selectedIso3);
      renderWatchlistPanel();
      saveWatchlistState();
    });
  }

  if (ui.watchlistAddRule) {
    ui.watchlistAddRule.addEventListener("click", () => {
      const metricKey = ui.watchlistMetric.value;
      const operator = ui.watchlistOperator?.value === "<" ? "<" : ">";
      const threshold = Number(ui.watchlistThreshold?.value);
      if (!metricKey || !Number.isFinite(threshold)) {
        setStatus("Enter a numeric threshold for the watchlist rule.");
        return;
      }
      addWatchlistRule(metricKey, operator, threshold);
      if (ui.watchlistThreshold) ui.watchlistThreshold.value = "";
      renderWatchlistPanel();
      saveWatchlistState();
    });
  }

  if (ui.watchlistCheckAlerts) {
    ui.watchlistCheckAlerts.addEventListener("click", () => {
      renderWatchlistPanel();
      setStatus("Watchlist alerts refreshed.");
    });
  }

  if (ui.watchlistCountries) {
    ui.watchlistCountries.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-remove-iso3]");
      if (!btn) return;
      removeWatchlistCountry(btn.getAttribute("data-remove-iso3"));
      renderWatchlistPanel();
      saveWatchlistState();
    });
  }

  if (ui.watchlistRules) {
    ui.watchlistRules.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-remove-rule]");
      if (!btn) return;
      removeWatchlistRule(btn.getAttribute("data-remove-rule"));
      renderWatchlistPanel();
      saveWatchlistState();
    });
  }

  renderWatchlistPanel();
}

function addWatchlistCountry(iso3) {
  if (!iso3 || !state.countriesByIso3.has(iso3)) return;
  if (state.watchlistCountries.includes(iso3)) return;
  state.watchlistCountries.push(iso3);
}

function removeWatchlistCountry(iso3) {
  state.watchlistCountries = state.watchlistCountries.filter((code) => code !== iso3);
}

function addWatchlistRule(metricKey, operator, threshold) {
  const metric = WATCHLIST_ALERT_METRICS.find((m) => m.key === metricKey);
  if (!metric) return;
  state.watchlistRules.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    metricKey,
    operator: operator === "<" ? "<" : ">",
    threshold
  });
}

function removeWatchlistRule(ruleId) {
  state.watchlistRules = state.watchlistRules.filter((rule) => rule.id !== ruleId);
}

function loadWatchlistState() {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const countries = Array.isArray(parsed?.countries) ? parsed.countries : [];
    const rules = Array.isArray(parsed?.rules) ? parsed.rules : [];

    state.watchlistCountries = countries
      .map((iso3) => String(iso3 || "").toUpperCase())
      .filter((iso3) => state.countriesByIso3.has(iso3));

    state.watchlistRules = rules
      .map((rule) => ({
        id: String(rule?.id || ""),
        metricKey: String(rule?.metricKey || ""),
        operator: rule?.operator === "<" ? "<" : ">",
        threshold: Number(rule?.threshold)
      }))
      .filter((rule) =>
        rule.id &&
        WATCHLIST_ALERT_METRICS.some((metric) => metric.key === rule.metricKey) &&
        Number.isFinite(rule.threshold)
      );
  } catch (error) {
    console.warn("Watchlist state load failed:", error);
  }
}

function saveWatchlistState() {
  const payload = {
    countries: state.watchlistCountries,
    rules: state.watchlistRules
  };
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Watchlist state save failed:", error);
  }
}

function evaluateWatchlistAlerts() {
  const alerts = [];
  for (const iso3 of state.watchlistCountries) {
    const country = getCountryByIso3(iso3);
    if (!country) continue;

    for (const rule of state.watchlistRules) {
      const metric = WATCHLIST_ALERT_METRICS.find((m) => m.key === rule.metricKey);
      if (!metric) continue;

      const value = getMetricValue(country, rule.metricKey);
      if (!Number.isFinite(value)) continue;

      const triggered = rule.operator === ">" ? value > rule.threshold : value < rule.threshold;
      if (!triggered) continue;

      const year = getMetricYear(country, rule.metricKey);
      const distance = Math.abs(value - rule.threshold);
      const ratio = Math.abs(rule.threshold) > 0 ? distance / Math.abs(rule.threshold) : distance;
      alerts.push({
        iso3: country.iso3,
        country: country.name,
        metricLabel: metric.label,
        operator: rule.operator,
        threshold: rule.threshold,
        value,
        year,
        severity: ratio > 0.25 ? "critical" : "normal",
        type: metric.type
      });
    }
  }

  alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    return a.country.localeCompare(b.country);
  });
  return alerts;
}

function renderWatchlistPanel() {
  if (!ui.watchlistRules || !ui.watchlistCountries || !ui.watchlistAlerts) return;

  if (!state.watchlistRules.length) {
    ui.watchlistRules.innerHTML = '<p class="alert-empty">No alert rules yet.</p>';
  } else {
    ui.watchlistRules.innerHTML = `
      <div class="watchlist-list">
        ${state.watchlistRules.map((rule) => {
          const metric = WATCHLIST_ALERT_METRICS.find((m) => m.key === rule.metricKey);
          const label = metric?.label ?? rule.metricKey;
          return `
            <span class="rule-chip">
              ${escapeHtml(label)} ${escapeHtml(rule.operator)} ${escapeHtml(String(rule.threshold))}
              <button class="chip-remove" data-remove-rule="${escapeHtml(rule.id)}" title="Remove rule">×</button>
            </span>
          `;
        }).join("")}
      </div>
    `;
  }

  if (!state.watchlistCountries.length) {
    ui.watchlistCountries.innerHTML = '<p class="alert-empty">No countries in watchlist yet.</p>';
  } else {
    ui.watchlistCountries.innerHTML = `
      <div class="watchlist-list">
        ${state.watchlistCountries.map((iso3) => {
          const country = getCountryByIso3(iso3);
          if (!country) return "";
          return `
            <span class="watch-chip">
              ${escapeHtml(country.name)} (${escapeHtml(iso3)})
              <button class="chip-remove" data-remove-iso3="${escapeHtml(iso3)}" title="Remove country">×</button>
            </span>
          `;
        }).join("")}
      </div>
    `;
  }

  const alerts = evaluateWatchlistAlerts();
  if (!alerts.length) {
    ui.watchlistAlerts.innerHTML = '<p class="alert-empty">No active alerts.</p>';
    return;
  }

  ui.watchlistAlerts.innerHTML = alerts.map((alert) => `
    <div class="alert-item ${alert.severity}">
      <strong>${escapeHtml(alert.country)}</strong>: ${escapeHtml(alert.metricLabel)}
      ${escapeHtml(alert.operator)} ${escapeHtml(String(alert.threshold))}
      (current ${escapeHtml(formatValue(alert.value, alert.type))}${alert.year ? `, ${alert.year}` : ""})
    </div>
  `).join("");
}

function setupRelocationPlanner() {
  if (!ui.relocateCountries || !ui.relocateTableBody) return;

  if (!ui.relocateCountries.options.length) {
    const countries = [...state.countriesByIso3.values()].sort((a, b) => a.name.localeCompare(b.name));
    for (const country of countries) {
      const opt = document.createElement("option");
      opt.value = country.iso3;
      opt.textContent = country.name;
      ui.relocateCountries.append(opt);
    }
  }

  ui.relocateIncome.value = state.relocation.incomeMonthly == null ? "" : String(state.relocation.incomeMonthly);
  ui.relocateAdults.value = String(state.relocation.adults);
  ui.relocateChildren.value = String(state.relocation.children);
  ui.relocateLifestyle.value = state.relocation.lifestyle;
  ui.relocateHousing.value = state.relocation.housing;
  ui.relocateCityTier.value = state.relocation.cityTier;
  ui.relocateSchooling.value = state.relocation.schooling;
  ui.relocateHealthcare.value = state.relocation.healthcare;
  ui.relocateBuffer.value = String(state.relocation.bufferPct);

  if (!state.relocationCountries.length && state.selectedIso3 && state.countriesByIso3.has(state.selectedIso3)) {
    state.relocationCountries = [state.selectedIso3];
  }
  setRelocationCountries(state.relocationCountries);

  const onParamChange = debounce(() => {
    collectRelocationParamsFromUi();
    renderRelocationTable();
  }, 120);

  [
    ui.relocateIncome,
    ui.relocateAdults,
    ui.relocateChildren,
    ui.relocateLifestyle,
    ui.relocateHousing,
    ui.relocateCityTier,
    ui.relocateSchooling,
    ui.relocateHealthcare,
    ui.relocateBuffer
  ].forEach((el) => el?.addEventListener("input", onParamChange));
  [
    ui.relocateAdults,
    ui.relocateChildren,
    ui.relocateLifestyle,
    ui.relocateHousing,
    ui.relocateCityTier,
    ui.relocateSchooling,
    ui.relocateHealthcare
  ].forEach((el) => el?.addEventListener("change", onParamChange));

  ui.relocateCountries.addEventListener("change", () => {
    state.relocationCountries = [...ui.relocateCountries.selectedOptions].map((opt) => opt.value);
    renderRelocationTable();
  });

  ui.relocateAddTyped?.addEventListener("click", () => {
    applyTypedRelocationCountries();
    renderRelocationTable();
  });

  ui.relocateCountryEntryInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      runRelocationAnalysis();
    }
  });

  ui.relocateUseCurrent?.addEventListener("click", () => {
    const seeds = seedRelocationCountries({ includeCompare: true });
    setRelocationCountries(seeds);
    renderRelocationTable();
  });

  ui.relocateClear?.addEventListener("click", () => {
    setRelocationCountries([]);
    renderRelocationTable();
  });

  ui.relocateRun?.addEventListener("click", () => {
    runRelocationAnalysis();
  });

  renderRelocationTable();
}

function runRelocationAnalysis() {
  const typedResult = applyTypedRelocationCountries({ silentWhenEmpty: true });
  collectRelocationParamsFromUi();
  renderRelocationTable();

  const comparedCount = state.relocationCountries.length;
  if (comparedCount < 2) {
    setStatus("Select or add at least two countries, then run analysis.");
    return;
  }

  if (typedResult && typedResult.foundCount > 0) {
    setStatus(`Relocation analysis updated. Added ${typedResult.foundCount} typed countr${typedResult.foundCount === 1 ? "y" : "ies"}.`);
  } else {
    setStatus(`Relocation analysis updated for ${comparedCount} countries.`);
  }
}

function applyTypedRelocationCountries(options = {}) {
  const raw = ui.relocateCountryEntryInput?.value ?? "";
  if (!raw.trim()) {
    if (!options.silentWhenEmpty) setStatus("Typed country box is empty.");
    return { foundCount: 0, missingCount: 0 };
  }

  const { found, missing } = parseTypedRelocationCountries(raw);
  if (!found.length) {
    setStatus("No valid countries found in typed input.");
    return { foundCount: 0, missingCount: missing.length };
  }

  const before = new Set(state.relocationCountries);
  const merged = [...new Set([...state.relocationCountries, ...found])];
  setRelocationCountries(merged);
  if (ui.relocateCountryEntryInput) {
    ui.relocateCountryEntryInput.value = "";
  }

  const newlyAdded = merged.filter((iso3) => !before.has(iso3));

  if (missing.length) {
    const preview = missing.slice(0, 4).join(", ");
    const suffix = missing.length > 4 ? ` +${missing.length - 4} more` : "";
    setStatus(`Added ${newlyAdded.length} countries. Unmatched: ${preview}${suffix}.`);
  } else {
    setStatus(`Added ${newlyAdded.length} countries from typed input.`);
  }

  return { foundCount: newlyAdded.length, missingCount: missing.length };
}

function seedRelocationCountries(options = {}) {
  const includeCompare = options.includeCompare === true;
  const seeded = [];
  if (state.selectedIso3 && state.countriesByIso3.has(state.selectedIso3)) {
    seeded.push(state.selectedIso3);
  }
  if (includeCompare) {
    if (ui.compareA?.value && state.countriesByIso3.has(ui.compareA.value)) {
      seeded.push(ui.compareA.value);
    }
    if (ui.compareB?.value && state.countriesByIso3.has(ui.compareB.value)) {
      seeded.push(ui.compareB.value);
    }
  }
  return [...new Set(seeded)];
}

function setRelocationCountries(iso3s) {
  const selected = new Set(
    (iso3s ?? [])
      .map((iso3) => String(iso3 || "").toUpperCase())
      .filter((iso3) => state.countriesByIso3.has(iso3))
  );

  for (const option of ui.relocateCountries.options) {
    option.selected = selected.has(option.value);
  }

  state.relocationCountries = [...selected];
}

function parseTypedRelocationCountries(text) {
  const tokens = String(text ?? "")
    .split(/[\n,;|]+/g)
    .map((value) => value.trim())
    .filter(Boolean);

  const lookup = buildCountryNameLookup();
  const found = [];
  const missing = [];

  for (const token of tokens) {
    const iso3 = resolveCountryTokenToIso3(token, lookup);
    if (iso3) {
      found.push(iso3);
    } else {
      missing.push(token);
    }
  }

  return { found: [...new Set(found)], missing };
}

function resolveCountryTokenToIso3(token, nameLookup) {
  const raw = String(token ?? "").trim();
  if (!raw) return null;

  if (/^[a-z]{3}$/i.test(raw)) {
    const iso3 = raw.toUpperCase();
    if (state.countriesByIso3.has(iso3)) return iso3;
  }

  const normalized = normalizeCountryName(raw);
  if (!normalized) return null;
  const exact = nameLookup.get(normalized);
  if (exact && state.countriesByIso3.has(exact)) return exact;

  let best = null;
  for (const country of state.countriesByIso3.values()) {
    const nameNorm = normalizeCountryName(country.name);
    const officialNorm = normalizeCountryName(country.officialName);
    const score = searchScoreForName(normalized, nameNorm, officialNorm);
    if (score === Infinity) continue;
    const tie = country.name.length;
    if (!best || score < best.score || (score === best.score && tie < best.tie)) {
      best = { iso3: country.iso3, score, tie };
    }
  }

  return best?.iso3 ?? null;
}

function collectRelocationParamsFromUi() {
  const incomeRaw = Number(ui.relocateIncome?.value);
  state.relocation.incomeMonthly = Number.isFinite(incomeRaw) && incomeRaw > 0 ? incomeRaw : null;
  state.relocation.adults = clampInteger(ui.relocateAdults?.value, 1, 4, 2);
  state.relocation.children = clampInteger(ui.relocateChildren?.value, 0, 8, 2);
  state.relocation.lifestyle = ui.relocateLifestyle?.value || "balanced";
  state.relocation.housing = ui.relocateHousing?.value || "familyRent";
  state.relocation.cityTier = ui.relocateCityTier?.value || "secondary";
  state.relocation.schooling = ui.relocateSchooling?.value || "public";
  state.relocation.healthcare = ui.relocateHealthcare?.value || "public";
  state.relocation.bufferPct = clampNumber(Number(ui.relocateBuffer?.value), 0, 100, 15);
}

function renderRelocationTable() {
  if (!ui.relocateTableBody || !ui.relocateMeta) return;

  collectRelocationParamsFromUi();
  const selectedIso3s = state.relocationCountries;
  const countries = selectedIso3s
    .map((iso3) => getCountryByIso3(iso3))
    .filter(Boolean);

  if (countries.length < 2) {
    ui.relocateMeta.textContent = "Select at least two countries for relocation comparison.";
    ui.relocateTableBody.innerHTML = '<tr><td colspan="7">Pick 2+ countries from the list above.</td></tr>';
    return;
  }

  const params = state.relocation;
  const rows = countries
    .map((country) => computeRelocationEstimate(country, params))
    .sort((a, b) => b.relocationScore - a.relocationScore);

  ui.relocateTableBody.innerHTML = rows
    .map((row) => {
      const gapText =
        row.incomeGap == null
          ? "N/A"
          : row.incomeGap >= 0
            ? `+${formatValue(row.incomeGap, "money")}`
            : `-${formatValue(Math.abs(row.incomeGap), "money")}`;
      const gapClass = row.incomeGap == null ? "" : row.incomeGap >= 0 ? "value-positive" : "value-negative";
      return `
        <tr>
          <td>${escapeHtml(row.countryName)}</td>
          <td>${formatValue(row.requiredMonthly, "money")}</td>
          <td>${formatValue(row.requiredAnnual, "money")}</td>
          <td class="${gapClass}">${escapeHtml(gapText)}</td>
          <td>${row.relocationScore.toFixed(1)} / 100</td>
          <td>${escapeHtml(row.verdict)}</td>
          <td>${escapeHtml(row.notes.join(" | "))}</td>
        </tr>
      `;
    })
    .join("");

  ui.relocateMeta.textContent =
    "Cost estimate uses WB household consumption and PPP price-level fallback; suitability score blends affordability, safety, jobs, climate, health, and stability.";
}

function computeRelocationEstimate(country, params) {
  const eqHousehold = params.adults + params.children * 0.7;
  const consumptionPc = getLatestMetricValue(country, "privateConsumptionPerCapita");
  const gdpPc = getLatestMetricValue(country, "gdpPerCapita");
  const priceLevel = getLatestMetricValue(country, "priceLevelRatio");

  let basePerEquivalentAdult = 1100;
  let basis = "Global fallback";
  if (Number.isFinite(consumptionPc) && consumptionPc > 0) {
    basePerEquivalentAdult = consumptionPc / 12;
    basis = "WB consumption per capita";
  } else if (Number.isFinite(gdpPc) && gdpPc > 0) {
    basePerEquivalentAdult = (gdpPc * 0.55) / 12;
    basis = "GDP-per-capita fallback";
  }

  if (basis !== "WB consumption per capita" && Number.isFinite(priceLevel) && priceLevel > 0) {
    basePerEquivalentAdult *= clampNumber(priceLevel, 0.45, 2.2, 1);
  }

  const factors =
    (RELOCATION_FACTORS.lifestyle[params.lifestyle] ?? 1) *
    (RELOCATION_FACTORS.housing[params.housing] ?? 1) *
    (RELOCATION_FACTORS.cityTier[params.cityTier] ?? 1) *
    (RELOCATION_FACTORS.schooling[params.schooling] ?? 1) *
    (RELOCATION_FACTORS.healthcare[params.healthcare] ?? 1) *
    (1 + params.bufferPct / 100);

  let requiredMonthly = basePerEquivalentAdult * eqHousehold * factors;

  const inflation = getLatestMetricValue(country, "inflation");
  if (Number.isFinite(inflation) && inflation > 6) {
    requiredMonthly *= 1 + Math.min((inflation - 6) * 0.01, 0.22);
  }

  const crime = getLatestMetricValue(country, "crimeRate");
  if (Number.isFinite(crime) && crime > 6) {
    requiredMonthly *= 1 + Math.min((crime - 6) * 0.008, 0.15);
  }

  const requiredAnnual = requiredMonthly * 12;
  const score = scoreRelocationCountry(country, requiredMonthly, params.incomeMonthly);
  const incomeGap = Number.isFinite(params.incomeMonthly) ? params.incomeMonthly - requiredMonthly : null;
  const verdict = relocationVerdictForScore(score.overall, incomeGap);

  const notes = [`Cost basis: ${basis}`];
  if (incomeGap != null && incomeGap < 0) {
    notes.push(`Shortfall ${formatValue(Math.abs(incomeGap), "money")}/mo`);
  }
  if (score.safety < 45) notes.push("Safety risk elevated");
  if (score.climate < 45) notes.push("Climate resilience weaker");
  if (score.jobs < 45) notes.push("Labor market pressure");

  return {
    iso3: country.iso3,
    countryName: country.name,
    requiredMonthly,
    requiredAnnual,
    incomeGap,
    relocationScore: score.overall,
    verdict,
    notes
  };
}

function scoreRelocationCountry(country, requiredMonthly, incomeMonthly) {
  const inflation = getLatestMetricValue(country, "inflation");
  const crime = getLatestMetricValue(country, "crimeRate");
  const unemployment = getLatestMetricValue(country, "unemployment");
  const vulnerability = getLatestMetricValue(country, "ndgainVulnerability");
  const readiness = getLatestMetricValue(country, "ndgainReadiness");
  const lifeExp = getLatestMetricValue(country, "whoLifeExpectancy") ?? getLatestMetricValue(country, "lifeExpectancy");

  const affordability = Number.isFinite(incomeMonthly)
    ? clampNumber((incomeMonthly / Math.max(requiredMonthly, 1)) * 100, 0, 100, 50)
    : clampNumber(100 - ((requiredMonthly - 1500) / 9000) * 100, 15, 95, 55);
  const safety = Number.isFinite(crime) ? clampNumber(100 - crime * 3.2, 5, 95, 55) : 55;
  const jobs = Number.isFinite(unemployment) ? clampNumber(100 - unemployment * 4.5, 5, 95, 55) : 55;

  let climate = 55;
  if (Number.isFinite(vulnerability) && Number.isFinite(readiness)) {
    climate = clampNumber((((1 - vulnerability) * 0.55) + (readiness * 0.45)) * 100, 0, 100, 55);
  } else if (Number.isFinite(vulnerability)) {
    climate = clampNumber((1 - vulnerability) * 100, 0, 100, 55);
  } else if (Number.isFinite(readiness)) {
    climate = clampNumber(readiness * 100, 0, 100, 55);
  }

  const health = Number.isFinite(lifeExp) ? clampNumber(((lifeExp - 50) / 35) * 100, 0, 100, 55) : 55;
  const stability = Number.isFinite(inflation) ? clampNumber(100 - Math.abs(inflation - 3) * 6, 0, 100, 55) : 55;

  const overall = Number.isFinite(incomeMonthly)
    ? affordability * 0.34 + safety * 0.2 + jobs * 0.15 + climate * 0.15 + health * 0.1 + stability * 0.06
    : affordability * 0.22 + safety * 0.24 + jobs * 0.18 + climate * 0.18 + health * 0.12 + stability * 0.06;

  return { overall, affordability, safety, jobs, climate, health, stability };
}

function relocationVerdictForScore(score, incomeGap) {
  let level = 0;
  if (score >= 78) level = 3;
  else if (score >= 62) level = 2;
  else if (score >= 48) level = 1;

  if (incomeGap != null && incomeGap < 0) {
    if (incomeGap < -700) level = Math.max(0, level - 2);
    else level = Math.max(0, level - 1);
  }

  if (level === 3) return "Strong fit";
  if (level === 2) return "Possible fit";
  if (level === 1) return "Needs caution";
  return "Not ideal";
}

function updateForecastToggleButton() {
  if (!ui.forecastToggle) return;
  ui.forecastToggle.textContent = `Forecast: ${state.forecastMode ? "On" : "Off"}`;
}

function buildSnapshotUrl() {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  params.set("v", SNAPSHOT_STATE_VERSION);
  params.set("metric", state.metric);
  params.set("mapMode", state.mapViewMode);
  params.set("mapLayer", state.mapLayer);
  params.set("decisionMode", state.decisionMode);
  params.set("region", state.region);
  params.set("search", state.search || "");
  params.set("iso3", state.selectedIso3 || "");
  params.set("year", state.year == null ? "latest" : String(state.year));
  params.set("compareA", ui.compareA?.value || "");
  params.set("compareB", ui.compareB?.value || "");
  params.set("forecast", state.forecastMode ? "1" : "0");
  params.set("forecastMetric", state.forecastMetric);
  params.set("relocCountries", state.relocationCountries.join(","));
  params.set("relocIncome", state.relocation.incomeMonthly == null ? "" : String(state.relocation.incomeMonthly));
  params.set("relocAdults", String(state.relocation.adults));
  params.set("relocChildren", String(state.relocation.children));
  params.set("relocLifestyle", state.relocation.lifestyle);
  params.set("relocHousing", state.relocation.housing);
  params.set("relocCity", state.relocation.cityTier);
  params.set("relocSchooling", state.relocation.schooling);
  params.set("relocHealthcare", state.relocation.healthcare);
  params.set("relocBuffer", String(state.relocation.bufferPct));
  params.set("visaOrigin", state.visaOriginIso3 || "");
  params.set("visaGoal", state.visaGoal || "work");
  params.set("job", state.jobProfession || "software");
  params.set("altFocus", state.alternativesFocus || "balanced");
  params.set("altScope", state.alternativesScope || "region");

  url.search = params.toString();
  return url.toString();
}

async function copySnapshotLink() {
  const snapshotUrl = buildSnapshotUrl();
  try {
    await navigator.clipboard.writeText(snapshotUrl);
    setStatus("Snapshot link copied to clipboard.");
  } catch {
    window.prompt("Copy snapshot URL:", snapshotUrl);
  }
}

function applySnapshotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.size) return;

  const metric = params.get("metric");
  if (metric && METRICS.some((m) => m.key === metric)) {
    state.metric = metric;
    ui.metricSelect.value = metric;
  }

  const mapMode = params.get("mapMode");
  if (mapMode === "metric" || mapMode === "layer") {
    state.mapViewMode = mapMode;
  }
  const mapLayer = params.get("mapLayer");
  if (mapLayer && MAP_LAYERS.some((layer) => layer.key === mapLayer)) {
    state.mapLayer = mapLayer;
  }
  const decisionMode = params.get("decisionMode");
  if (decisionMode && DECISION_MODES.some((mode) => mode.key === decisionMode)) {
    state.decisionMode = decisionMode;
  }

  const region = params.get("region");
  if (region && (region === "all" || [...ui.regionSelect.options].some((opt) => opt.value === region))) {
    state.region = region;
    ui.regionSelect.value = region;
  }

  const search = (params.get("search") || "").trim().toLowerCase();
  state.search = search;
  if (ui.searchInput) ui.searchInput.value = search;

  const iso3 = (params.get("iso3") || "").toUpperCase();
  if (iso3 && state.countriesByIso3.has(iso3)) {
    state.selectedIso3 = iso3;
  }

  const yearText = params.get("year");
  if (!yearText || yearText === "latest") {
    state.year = null;
  } else {
    const year = Number(yearText);
    state.year = Number.isFinite(year) ? year : null;
  }

  const compareA = (params.get("compareA") || "").toUpperCase();
  const compareB = (params.get("compareB") || "").toUpperCase();
  if (compareA && [...ui.compareA.options].some((opt) => opt.value === compareA)) ui.compareA.value = compareA;
  if (compareB && [...ui.compareB.options].some((opt) => opt.value === compareB)) ui.compareB.value = compareB;

  state.forecastMode = params.get("forecast") === "1";
  const forecastMetric = params.get("forecastMetric");
  if (forecastMetric && FORECAST_METRICS.some((m) => m.key === forecastMetric)) {
    state.forecastMetric = forecastMetric;
  }

  const relocCountries = (params.get("relocCountries") || "")
    .split(",")
    .map((v) => v.trim().toUpperCase())
    .filter((iso3) => state.countriesByIso3.has(iso3));
  if (relocCountries.length) {
    state.relocationCountries = [...new Set(relocCountries)];
    if (ui.relocateCountries) setRelocationCountries(state.relocationCountries);
  }

  const relocIncome = Number(params.get("relocIncome"));
  state.relocation.incomeMonthly = Number.isFinite(relocIncome) && relocIncome > 0 ? relocIncome : null;
  state.relocation.adults = clampInteger(params.get("relocAdults"), 1, 4, state.relocation.adults);
  state.relocation.children = clampInteger(params.get("relocChildren"), 0, 8, state.relocation.children);
  state.relocation.bufferPct = clampNumber(Number(params.get("relocBuffer")), 0, 100, state.relocation.bufferPct);

  const visaOrigin = (params.get("visaOrigin") || "").toUpperCase();
  if (visaOrigin && state.countriesByIso3.has(visaOrigin)) {
    state.visaOriginIso3 = visaOrigin;
    state.visaOriginManualOverride = true;
  }
  const visaGoal = params.get("visaGoal");
  if (["work", "study", "family", "retire", "business"].includes(visaGoal)) {
    state.visaGoal = visaGoal;
  }
  const job = params.get("job");
  if (job && JOB_PROFILES.some((profile) => profile.key === job)) {
    state.jobProfession = job;
  }
  const altFocus = params.get("altFocus");
  if (["balanced", "affordability", "safety", "jobs", "resilience"].includes(altFocus)) {
    state.alternativesFocus = altFocus;
  }
  const altScope = params.get("altScope");
  if (["region", "global"].includes(altScope)) {
    state.alternativesScope = altScope;
  }

  const selectFields = [
    ["relocLifestyle", "lifestyle", Object.keys(RELOCATION_FACTORS.lifestyle)],
    ["relocHousing", "housing", Object.keys(RELOCATION_FACTORS.housing)],
    ["relocCity", "cityTier", Object.keys(RELOCATION_FACTORS.cityTier)],
    ["relocSchooling", "schooling", Object.keys(RELOCATION_FACTORS.schooling)],
    ["relocHealthcare", "healthcare", Object.keys(RELOCATION_FACTORS.healthcare)]
  ];
  for (const [paramKey, stateKey, allowed] of selectFields) {
    const raw = params.get(paramKey);
    if (raw && allowed.includes(raw)) {
      state.relocation[stateKey] = raw;
    }
  }

  if (ui.forecastMetric) {
    ui.forecastMetric.value = state.forecastMetric;
  }
  renderMapLayersPanel();
  renderDecisionModePanel();
  if (ui.relocateIncome) ui.relocateIncome.value = state.relocation.incomeMonthly == null ? "" : String(state.relocation.incomeMonthly);
  if (ui.relocateAdults) ui.relocateAdults.value = String(state.relocation.adults);
  if (ui.relocateChildren) ui.relocateChildren.value = String(state.relocation.children);
  if (ui.relocateLifestyle) ui.relocateLifestyle.value = state.relocation.lifestyle;
  if (ui.relocateHousing) ui.relocateHousing.value = state.relocation.housing;
  if (ui.relocateCityTier) ui.relocateCityTier.value = state.relocation.cityTier;
  if (ui.relocateSchooling) ui.relocateSchooling.value = state.relocation.schooling;
  if (ui.relocateHealthcare) ui.relocateHealthcare.value = state.relocation.healthcare;
  if (ui.relocateBuffer) ui.relocateBuffer.value = String(state.relocation.bufferPct);
  if (ui.visaOriginSelect && [...ui.visaOriginSelect.options].some((opt) => opt.value === state.visaOriginIso3)) {
    ui.visaOriginSelect.value = state.visaOriginIso3;
  }
  if (ui.visaGoalSelect) ui.visaGoalSelect.value = state.visaGoal;
  if (ui.jobProfessionSelect && [...ui.jobProfessionSelect.options].some((opt) => opt.value === state.jobProfession)) {
    ui.jobProfessionSelect.value = state.jobProfession;
  }
  if (ui.alternativesFocusSelect) ui.alternativesFocusSelect.value = state.alternativesFocus;
  if (ui.alternativesScopeSelect) ui.alternativesScopeSelect.value = state.alternativesScope;
  if (ui.yearSlider) {
    if (state.year == null) {
      ui.yearSlider.value = ui.yearSlider.max;
      ui.yearLabel.textContent = "Latest";
    } else {
      const clamped = Math.max(Number(ui.yearSlider.min), Math.min(Number(ui.yearSlider.max), state.year));
      state.year = clamped;
      ui.yearSlider.value = String(clamped);
      ui.yearLabel.textContent = String(clamped);
    }
  }
  updateForecastToggleButton();
}

function setupYearSlider() {
  if (!ui.yearSlider) return;
  ui.yearSlider.min = state.yearRange.min;
  ui.yearSlider.max = state.yearRange.max;
  ui.yearSlider.value = state.yearRange.max;
  ui.yearLabel.textContent = "Latest";

  ui.yearSlider.addEventListener("input", () => {
    const val = Number(ui.yearSlider.value);
    state.year = val;
    ui.yearLabel.textContent = String(val);
    updateAllViews();
  });

  ui.yearLatest.addEventListener("click", () => {
    stopPlayback();
    state.year = null;
    ui.yearSlider.value = ui.yearSlider.max;
    ui.yearLabel.textContent = "Latest";
    updateAllViews();
  });
}

function setupPlayback() {
  if (!ui.yearPlay) return;

  ui.yearPlay.addEventListener("click", () => {
    if (state.playInterval) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });
}

function startPlayback() {
  if (state.playInterval) return;

  // Start from min if at latest or max.
  if (state.year == null || state.year >= state.yearRange.max) {
    state.year = state.yearRange.min;
  }

  ui.yearPlay.innerHTML = "&#9632;";
  ui.yearPlay.classList.add("playing");

  state.playInterval = setInterval(() => {
    state.year += 1;
    if (state.year > state.yearRange.max) {
      stopPlayback();
      return;
    }
    ui.yearSlider.value = state.year;
    ui.yearLabel.textContent = String(state.year);
    updateAllViews();
  }, 400);

  // Trigger the first frame immediately.
  ui.yearSlider.value = state.year;
  ui.yearLabel.textContent = String(state.year);
  updateAllViews();
}

function stopPlayback() {
  if (state.playInterval) {
    clearInterval(state.playInterval);
    state.playInterval = null;
  }
  ui.yearPlay.innerHTML = "&#9654;";
  ui.yearPlay.classList.remove("playing");
}

function setupThemeToggle() {
  if (!ui.themeToggle) return;

  ui.themeToggle.addEventListener("click", () => {
    state.darkMode = !state.darkMode;
    if (state.darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      ui.themeToggle.innerHTML = "&#9788;";
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      ui.themeToggle.innerHTML = "&#9790;";
      localStorage.setItem("theme", "light");
    }
  });
}

function setupMap() {
  mapSvg = d3.select("#world-map");

  const zoomContainer = mapSvg.append("g").attr("class", "zoom-container");
  graticuleLayer = zoomContainer.append("g").attr("class", "graticule-layer");
  countryLayer = zoomContainer.append("g").attr("class", "country-layer");

  // Zoom & pan behavior.
  zoomBehavior = d3.zoom()
    .scaleExtent([1, 12])
    .on("zoom", (event) => {
      zoomContainer.attr("transform", event.transform);
    });

  mapSvg.call(zoomBehavior);

  // Disable double-click zoom (interferes with country click).
  mapSvg.on("dblclick.zoom", null);

  // Zoom control buttons.
  if (ui.zoomIn) {
    ui.zoomIn.addEventListener("click", () => {
      mapSvg.transition().duration(300).call(zoomBehavior.scaleBy, 1.5);
    });
  }
  if (ui.zoomOut) {
    ui.zoomOut.addEventListener("click", () => {
      mapSvg.transition().duration(300).call(zoomBehavior.scaleBy, 1 / 1.5);
    });
  }
  if (ui.zoomReset) {
    ui.zoomReset.addEventListener("click", () => {
      mapSvg.transition().duration(400).call(zoomBehavior.transform, d3.zoomIdentity);
    });
  }

  renderMapGeometry();
  window.addEventListener("resize", debounce(renderMapGeometry, 120));
}

function renderMapGeometry() {
  const wrap = document.getElementById("map-wrap");
  const width = Math.max(360, Math.floor(wrap.clientWidth));
  const height = Math.max(420, Math.floor(width * 0.52));

  mapSvg.attr("viewBox", `0 0 ${width} ${height}`);
  mapProjection = d3.geoNaturalEarth1().fitSize([width, height], { type: "Sphere" });
  mapPath = d3.geoPath(mapProjection);

  // Sphere rendered inside zoom container (inserted before graticule layer so it's behind).
  const zoomContainer = mapSvg.select(".zoom-container");
  const sphere = zoomContainer.selectAll("path.sphere").data([{ type: "Sphere" }]);
  sphere
    .join(
      (enter) => enter.insert("path", ":first-child").attr("class", "sphere"),
      (update) => update,
      (exit) => exit.remove()
    )
    .attr("d", mapPath);

  const graticule = graticuleLayer.selectAll("path").data([d3.geoGraticule10()]);
  graticule
    .join("path")
    .attr("d", mapPath);

  const countries = countryLayer
    .selectAll("path.country")
    .data(state.mapFeatures, (d) => d?.properties?.mapId ?? d?.id);

  countries
    .join("path")
    .attr("class", "country")
    .attr("d", mapPath)
    .on("mousemove", onCountryHover)
    .on("mouseleave", onCountryLeave)
    .on("click", onCountryClick);

  repaintMap();
}

function onCountryHover(event, feature) {
  const iso3 = feature?.properties?.iso3;
  state.hoveredIso3 = iso3;

  const country = getCountryByIso3(iso3);
  if (country) {
    showTooltip(event, country);
  } else {
    hideTooltip();
  }

  repaintMap();
}

function onCountryLeave() {
  state.hoveredIso3 = null;
  hideTooltip();
  repaintMap();
}

function onCountryClick(event, feature) {
  event.stopPropagation();
  const iso3 = feature?.properties?.iso3;
  if (!iso3 || !state.countriesByIso3.has(iso3)) {
    return;
  }

  state.selectedIso3 = iso3;
  renderMapLayerExplainer();
  renderCountryDetails();
  renderRelocationTable();
  repaintMap();
}

function getCountryByIso3(iso3) {
  if (!iso3) return null;
  return state.countriesByIso3.get(iso3) ?? null;
}

function getMetricConfig(key = state.metric) {
  return METRICS.find((metric) => metric.key === key) ?? METRICS[0];
}

function getMapLayerConfig(key = state.mapLayer) {
  return MAP_LAYERS.find((layer) => layer.key === key) ?? MAP_LAYERS[0];
}

function getDecisionModeConfig(key = state.decisionMode) {
  return DECISION_MODES.find((mode) => mode.key === key) ?? DECISION_MODES[0];
}

function getActiveMapConfig() {
  if (state.mapViewMode === "layer" && state.mapLayer !== "custom") {
    const layer = getMapLayerConfig(state.mapLayer);
    if (layer.key === "decisionFit") {
      const mode = getDecisionModeConfig();
      return {
        key: layer.key,
        label: `${layer.label}: ${mode.label}`,
        type: layer.type,
        higherIsBetter: layer.higherIsBetter,
        description: `${mode.label} weights affordability, safety, jobs, resilience, and stability for this map view.`,
        portray: mode.portray,
        factors: [...mode.priorities, "Composite 0-100 score"],
        palette: layer.palette,
        source: "layer",
        compute: layer.compute
      };
    }
    return {
      key: layer.key,
      label: layer.label,
      type: layer.type,
      higherIsBetter: layer.higherIsBetter,
      description: layer.description,
      portray: layer.portray,
      factors: layer.factors,
      palette: layer.palette,
      source: "layer",
      compute: layer.compute
    };
  }

  const metric = getMetricConfig();
  return {
    key: metric.key,
    label: metric.label,
    type: metric.type,
    higherIsBetter: metric.key !== "hazardExposure",
    description: "Raw indicator metric from selected data source.",
    portray: `This map is showing the exact ${metric.label} metric rather than a composite score.`,
    factors: [
      metric.label,
      state.year == null ? "Latest available year per country" : `Year ${state.year}`,
      "Direct source value"
    ],
    palette: d3.interpolateYlGnBu,
    source: "metric",
    compute(country) {
      return getMetricValue(country, metric.key);
    }
  };
}

function getActiveMapValue(country) {
  const config = getActiveMapConfig();
  return config.compute(country);
}

function resolveIndicator(indicator) {
  if (!indicator) return null;
  if (state.year == null) return indicator.latest?.value ?? null;
  return indicator.byYear?.get(state.year) ?? null;
}

function resolveIndicatorLatest(indicator) {
  if (!indicator) return null;
  return indicator.latest?.value ?? null;
}

function resolveIndicatorYear(indicator) {
  if (!indicator) return null;
  if (state.year == null) return indicator.latest?.year ?? null;
  return indicator.byYear?.has(state.year) ? state.year : null;
}

function getMetricValue(country, metricKey = state.metric) {
  if (!country) return null;

  switch (metricKey) {
    case "gdp":               return resolveIndicator(country.indicators.gdp);
    case "netWorth":          return resolveIndicator(country.indicators.netWorth);
    case "gdpPerCapita":      return resolveIndicator(country.indicators.gdpPerCapita);
    case "population":        return resolveIndicator(country.indicators.populationWB) ?? country.population ?? null;
    case "crimeRate":         return resolveIndicator(country.indicators.crimeRate);
    case "inflation":
      return resolveIndicator(country.indicators.imfInflation) ?? resolveIndicator(country.indicators.inflation);
    case "debtPctGdp":
      return resolveIndicator(country.indicators.imfDebtPctGdp) ?? resolveIndicator(country.indicators.debtPctGdp);
    case "currentAccountPctGdp":
      return resolveIndicator(country.indicators.imfCurrentAccountPctGdp) ?? resolveIndicator(country.indicators.currentAccountPctGdp);
    case "poverty215":        return resolveIndicator(country.indicators.poverty215);
    case "gini":              return resolveIndicator(country.indicators.gini);
    case "tourismArrivals":   return resolveIndicator(country.indicators.tourismArrivals);
    case "tourismReceipts":   return resolveIndicator(country.indicators.tourismReceipts);
    case "whoLifeExpectancy": return resolveIndicator(country.indicators.whoLifeExpectancy);
    case "ndgainVulnerability": return resolveIndicator(country.indicators.ndgainVulnerability);
    case "ndgainReadiness":   return resolveIndicator(country.indicators.ndgainReadiness);
    case "emdatEvents":       return resolveIndicator(country.indicators.emdatEvents);
    case "emdatDeaths":       return resolveIndicator(country.indicators.emdatDeaths);
    case "hazardExposure":    return computeHazardExposure(country).score;
    case "airlinesCount":     return country.airlinesCount ?? 0;
    case "airportsCount":     return country.airportsCount ?? 0;
    case "lifeExpectancy":    return resolveIndicator(country.indicators.lifeExpectancy);
    case "unemployment":      return resolveIndicator(country.indicators.unemployment);
    case "milExpenditure":    return resolveIndicator(country.indicators.milExpenditure);
    case "milExpPctGdp":      return resolveIndicator(country.indicators.milExpPctGdp);
    case "armedForces":       return resolveIndicator(country.indicators.armedForces);
    case "armedForcesPctLabor": return resolveIndicator(country.indicators.armedForcesPctLabor);
    case "area":              return country.area ?? null;
    default:                  return null;
  }
}

function getMetricYear(country, metricKey = state.metric) {
  if (!country) return null;

  switch (metricKey) {
    case "gdp":               return resolveIndicatorYear(country.indicators.gdp);
    case "netWorth":          return resolveIndicatorYear(country.indicators.netWorth);
    case "gdpPerCapita":      return resolveIndicatorYear(country.indicators.gdpPerCapita);
    case "population":        return resolveIndicatorYear(country.indicators.populationWB);
    case "crimeRate":         return resolveIndicatorYear(country.indicators.crimeRate);
    case "inflation":
      return resolveIndicatorYear(country.indicators.imfInflation) ?? resolveIndicatorYear(country.indicators.inflation);
    case "debtPctGdp":
      return resolveIndicatorYear(country.indicators.imfDebtPctGdp) ?? resolveIndicatorYear(country.indicators.debtPctGdp);
    case "currentAccountPctGdp":
      return resolveIndicatorYear(country.indicators.imfCurrentAccountPctGdp) ?? resolveIndicatorYear(country.indicators.currentAccountPctGdp);
    case "poverty215":        return resolveIndicatorYear(country.indicators.poverty215);
    case "gini":              return resolveIndicatorYear(country.indicators.gini);
    case "tourismArrivals":   return resolveIndicatorYear(country.indicators.tourismArrivals);
    case "tourismReceipts":   return resolveIndicatorYear(country.indicators.tourismReceipts);
    case "whoLifeExpectancy": return resolveIndicatorYear(country.indicators.whoLifeExpectancy);
    case "ndgainVulnerability": return resolveIndicatorYear(country.indicators.ndgainVulnerability);
    case "ndgainReadiness":   return resolveIndicatorYear(country.indicators.ndgainReadiness);
    case "emdatEvents":       return resolveIndicatorYear(country.indicators.emdatEvents);
    case "emdatDeaths":       return resolveIndicatorYear(country.indicators.emdatDeaths);
    case "hazardExposure":    return getHazardReferenceYear(country);
    case "airlinesCount":     return null;
    case "airportsCount":     return null;
    case "lifeExpectancy":    return resolveIndicatorYear(country.indicators.lifeExpectancy);
    case "unemployment":      return resolveIndicatorYear(country.indicators.unemployment);
    case "milExpenditure":    return resolveIndicatorYear(country.indicators.milExpenditure);
    case "milExpPctGdp":      return resolveIndicatorYear(country.indicators.milExpPctGdp);
    case "armedForces":       return resolveIndicatorYear(country.indicators.armedForces);
    case "armedForcesPctLabor": return resolveIndicatorYear(country.indicators.armedForcesPctLabor);
    default:                  return null;
  }
}

function getLatestMetricValue(country, metricKey) {
  if (!country) return null;
  switch (metricKey) {
    case "inflation":
      return resolveIndicatorLatest(country.indicators.imfInflation) ?? resolveIndicatorLatest(country.indicators.inflation);
    case "crimeRate":
      return resolveIndicatorLatest(country.indicators.crimeRate);
    case "unemployment":
      return resolveIndicatorLatest(country.indicators.unemployment);
    case "ndgainVulnerability":
      return resolveIndicatorLatest(country.indicators.ndgainVulnerability);
    case "ndgainReadiness":
      return resolveIndicatorLatest(country.indicators.ndgainReadiness);
    case "hazardExposure":
      return computeHazardExposure(country).score;
    case "whoLifeExpectancy":
      return resolveIndicatorLatest(country.indicators.whoLifeExpectancy);
    case "lifeExpectancy":
      return resolveIndicatorLatest(country.indicators.lifeExpectancy);
    case "gdpPerCapita":
      return resolveIndicatorLatest(country.indicators.gdpPerCapita);
    case "privateConsumptionPerCapita":
      return resolveIndicatorLatest(country.indicators.privateConsumptionPerCapita);
    case "priceLevelRatio":
      return resolveIndicatorLatest(country.indicators.priceLevelRatio);
    default:
      return getMetricValue(country, metricKey);
  }
}

function getMetricTimeSeries(country, metricKey = state.metric) {
  if (!country) return [];
  let indicator = null;
  switch (metricKey) {
    case "gdp":               indicator = country.indicators.gdp; break;
    case "netWorth":          indicator = country.indicators.netWorth; break;
    case "gdpPerCapita":      indicator = country.indicators.gdpPerCapita; break;
    case "population":        indicator = country.indicators.populationWB; break;
    case "crimeRate":         indicator = country.indicators.crimeRate; break;
    case "inflation":
      indicator = country.indicators.imfInflation ?? country.indicators.inflation;
      break;
    case "debtPctGdp":
      indicator = country.indicators.imfDebtPctGdp ?? country.indicators.debtPctGdp;
      break;
    case "currentAccountPctGdp":
      indicator = country.indicators.imfCurrentAccountPctGdp ?? country.indicators.currentAccountPctGdp;
      break;
    case "poverty215":        indicator = country.indicators.poverty215; break;
    case "gini":              indicator = country.indicators.gini; break;
    case "tourismArrivals":   indicator = country.indicators.tourismArrivals; break;
    case "tourismReceipts":   indicator = country.indicators.tourismReceipts; break;
    case "whoLifeExpectancy": indicator = country.indicators.whoLifeExpectancy; break;
    case "ndgainVulnerability": indicator = country.indicators.ndgainVulnerability; break;
    case "ndgainReadiness":   indicator = country.indicators.ndgainReadiness; break;
    case "emdatEvents":       indicator = country.indicators.emdatEvents; break;
    case "emdatDeaths":       indicator = country.indicators.emdatDeaths; break;
    case "hazardExposure":    return [];
    case "lifeExpectancy":    indicator = country.indicators.lifeExpectancy; break;
    case "unemployment":      indicator = country.indicators.unemployment; break;
    case "milExpenditure":    indicator = country.indicators.milExpenditure; break;
    case "milExpPctGdp":      indicator = country.indicators.milExpPctGdp; break;
    case "armedForces":       indicator = country.indicators.armedForces; break;
    case "armedForcesPctLabor": indicator = country.indicators.armedForcesPctLabor; break;
    default: return [];
  }
  if (!indicator?.byYear) return [];
  return [...indicator.byYear.entries()]
    .map(([y, v]) => ({ year: y, value: v }))
    .sort((a, b) => a.year - b.year);
}

function renderSparkline(points) {
  if (points.length < 2) return "";
  const w = 60, h = 20, pad = 1;
  const vals = points.map((p) => p.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const rangeV = maxV - minV || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - 2 * pad);
    const y = pad + (1 - (p.value - minV) / rangeV) * (h - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = points[points.length - 1];
  const first = points[0];
  const up = last.value >= first.value;
  const color = up ? "var(--accent)" : "var(--danger)";
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${coords.join(" ")}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function renderLayerScoreBar(value) {
  if (!Number.isFinite(value)) return "";
  const pct = clampNumber(value, 0, 100, 0);
  return `
    <div class="layer-score-bar" aria-hidden="true">
      <span style="width:${pct.toFixed(1)}%"></span>
    </div>
  `;
}

function formatValue(value, type) {
  if (value == null || !Number.isFinite(value)) {
    return "N/A";
  }

  switch (type) {
    case "money":
      if (Math.abs(value) >= 1e9) return fmtCompactMoney.format(value);
      return fmtMoney.format(value);
    case "integer":
      if (Math.abs(value) >= 1e6) return fmtCompactNumber.format(value);
      return fmtInteger.format(value);
    case "years":
      return `${value.toFixed(1)} yrs`;
    case "percent":
      return `${value.toFixed(2)}%`;
    case "rate":
      return `${value.toFixed(2)} /100k`;
    case "score":
      return value.toFixed(3);
    case "index":
      return `${value.toFixed(1)} /100`;
    case "area":
      if (Math.abs(value) >= 1e6) return `${fmtCompactNumber.format(value)} km²`;
      return `${fmtInteger.format(value)} km²`;
    default:
      return fmtCompactNumber.format(value);
  }
}

function formatDelta(value, type) {
  if (value == null || !Number.isFinite(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (type === "money") {
    return `${sign}${abs >= 1e9 ? fmtCompactMoney.format(abs) : fmtMoney.format(abs)}`;
  }

  if (type === "percent") {
    return `${sign}${abs.toFixed(2)}%`;
  }

  if (type === "rate") {
    return `${sign}${abs.toFixed(2)} /100k`;
  }

  if (type === "score") {
    return `${sign}${abs.toFixed(3)}`;
  }

  if (type === "index") {
    return `${sign}${abs.toFixed(1)} /100`;
  }

  if (type === "years") {
    return `${sign}${abs.toFixed(1)} yrs`;
  }

  if (type === "area") {
    return `${sign}${formatValue(abs, "area")}`;
  }

  if (type === "integer") {
    return `${sign}${formatValue(abs, "integer")}`;
  }

  return `${sign}${fmtCompactNumber.format(abs)}`;
}

function updateAllViews() {
  syncSelectedCountryWithFilters();
  buildColorScale();
  repaintMap();
  renderLegend();
  renderRankingTable();
  renderGlobalRankingsCarousel();
  renderCountryDetails();
  renderComparisonTable();
  renderWatchlistPanel();
  renderRelocationTable();
}

function isCountryVisible(country) {
  const regionOk = state.region === "all" || country.region === state.region;
  const query = state.search;
  const searchOk =
    !query ||
    country.name.toLowerCase().includes(query) ||
    country.officialName.toLowerCase().includes(query) ||
    country.iso3.toLowerCase() === query;
  return regionOk && searchOk;
}

function syncSelectedCountryWithFilters() {
  const selected = getCountryByIso3(state.selectedIso3);
  if (selected && isCountryVisible(selected)) {
    return;
  }

  if (state.search) {
    state.selectedIso3 = findBestSearchMatchIso3(state.search);
    return;
  }

  state.selectedIso3 = null;
}

function findBestSearchMatchIso3(query) {
  const raw = String(query ?? "").trim();
  if (!raw) return null;

  // Support direct ISO3 searches like "OMN".
  if (/^[a-z]{3}$/i.test(raw)) {
    const iso3 = raw.toUpperCase();
    const country = getCountryByIso3(iso3);
    if (country && (state.region === "all" || country.region === state.region)) {
      return iso3;
    }
  }

  const normalizedQuery = normalizeCountryName(raw);
  if (!normalizedQuery) return null;

  // Fast exact alias/common-name match first.
  const lookup = buildCountryNameLookup();
  const exactIso3 = lookup.get(normalizedQuery);
  if (exactIso3) {
    const country = getCountryByIso3(exactIso3);
    if (country && (state.region === "all" || country.region === state.region)) {
      return exactIso3;
    }
  }

  let best = null;
  for (const country of state.countriesByIso3.values()) {
    if (state.region !== "all" && country.region !== state.region) continue;

    const nameNorm = normalizeCountryName(country.name);
    const officialNorm = normalizeCountryName(country.officialName);

    const score = searchScoreForName(normalizedQuery, nameNorm, officialNorm);
    if (score === Infinity) continue;

    const tie = country.name.length;
    if (
      !best ||
      score < best.score ||
      (score === best.score && tie < best.tie) ||
      (score === best.score && tie === best.tie && country.name < best.name)
    ) {
      best = { iso3: country.iso3, score, tie, name: country.name };
    }
  }

  return best?.iso3 ?? null;
}

function searchScoreForName(queryNorm, nameNorm, officialNorm) {
  let score = Infinity;
  const names = [nameNorm, officialNorm];
  for (const candidate of names) {
    if (!candidate) continue;
    if (candidate === queryNorm) {
      score = Math.min(score, 0);
    } else if (candidate.startsWith(queryNorm)) {
      score = Math.min(score, 1);
    } else if (candidate.includes(queryNorm)) {
      score = Math.min(score, 2);
    }
  }
  return score;
}

function buildColorScale() {
  const active = getActiveMapConfig();
  const values = [...state.countriesByIso3.values()]
    .filter((country) => isCountryVisible(country))
    .map((country) => getActiveMapValue(country))
    .filter((value) => Number.isFinite(value));

  if (values.length < 2) {
    state.colorScale = null;
    state.colorDomain = null;
    return;
  }

  const min = d3.min(values);
  const max = d3.max(values);

  state.colorDomain = [min, max];

  if (min > 0 && max / min > 30 && active.source === "metric") {
    state.colorScale = d3.scaleSequentialLog(active.palette).domain([min, max]);
  } else {
    state.colorScale = d3.scaleSequential(active.palette).domain([min, max]);
  }
}

function repaintMap() {
  if (!countryLayer) return;

  countryLayer
    .selectAll("path.country")
    .attr("fill", (feature) => {
      const country = getCountryByIso3(feature?.properties?.iso3);
      if (!country || !state.colorScale) return "#d4dddd";

      const value = getActiveMapValue(country);
      if (value == null) return "#d4dddd";

      // Log scale is undefined for non-positive values; clamp to the interpolator minimum.
      if (typeof state.colorScale.base === "function" && value <= 0) {
        return getActiveMapConfig().palette(0);
      }

      return state.colorScale(value);
    })
    .classed("dimmed", (feature) => {
      const country = getCountryByIso3(feature?.properties?.iso3);
      if (!country) return true;
      return !isCountryVisible(country);
    })
    .classed("selected", (feature) => feature?.properties?.iso3 === state.selectedIso3)
    .classed("hovered", (feature) => feature?.properties?.iso3 === state.hoveredIso3);
}

function renderLegend() {
  const active = getActiveMapConfig();

  if (!state.colorScale || !state.colorDomain) {
    ui.legend.innerHTML = `<p>Not enough data for <strong>${escapeHtml(active.label)}</strong> under current filters.</p>`;
    return;
  }

  const [min, max] = state.colorDomain;
  const gradient = `linear-gradient(90deg, ${active.palette(0)}, ${active.palette(1)})`;
  const rightLabel =
    active.source === "layer"
      ? (active.higherIsBetter ? "Higher score is better" : "Higher score means higher risk")
      : (active.key === "hazardExposure"
        ? "Composite latest values"
        : (state.year == null ? "Latest available year per country" : `Year: ${state.year}`));

  ui.legend.innerHTML = `
    <div class="legend-head">
      <span>${escapeHtml(active.label)}</span>
      <span>${formatValue(max, active.type)}</span>
    </div>
    <div class="legend-gradient" style="background:${gradient};"></div>
    <div class="legend-head">
      <span>${formatValue(min, active.type)}</span>
      <span>${rightLabel}</span>
    </div>
    <p class="legend-copy">${escapeHtml(active.description)}</p>
  `;
}

function showTooltip(event, country) {
  const active = getActiveMapConfig();
  const mapValue = getActiveMapValue(country);
  const mapYear = active.source === "metric" ? getMetricYear(country, active.key) : null;
  const helperLine = active.source === "layer"
    ? (active.higherIsBetter ? "Higher score is better" : "Higher score means higher risk")
    : "Raw metric";

  ui.tooltip.innerHTML = `
    <h4>${escapeHtml(country.name)}</h4>
    <div class="tooltip-grid">
      <span class="k">${escapeHtml(active.label)}</span>
      <span>${formatValue(mapValue, active.type)}${mapYear ? ` (${mapYear})` : ""}</span>
      <span class="k">Map mode</span>
      <span>${escapeHtml(helperLine)}</span>
      <span class="k">GDP</span>
      <span>${formatValue(getMetricValue(country, "gdp"), "money")}${getMetricYear(country, "gdp") ? ` (${getMetricYear(country, "gdp")})` : ""}</span>
      <span class="k">GDP / Capita</span>
      <span>${formatValue(getMetricValue(country, "gdpPerCapita"), "money")}</span>
      <span class="k">Population</span>
      <span>${formatValue(getMetricValue(country, "population"), "integer")}</span>
      <span class="k">Crime Rate</span>
      <span>${formatValue(getMetricValue(country, "crimeRate"), "rate")}${getMetricYear(country, "crimeRate") ? ` (${getMetricYear(country, "crimeRate")})` : ""}</span>
      <span class="k">Hazard Exposure</span>
      <span>${formatValue(getMetricValue(country, "hazardExposure"), "index")}${getMetricYear(country, "hazardExposure") ? ` (${getMetricYear(country, "hazardExposure")})` : ""}</span>
      <span class="k">Inflation (IMF/WB)</span>
      <span>${formatValue(getMetricValue(country, "inflation"), "percent")}${getMetricYear(country, "inflation") ? ` (${getMetricYear(country, "inflation")})` : ""}</span>
      <span class="k">Airlines</span>
      <span>${formatValue(getMetricValue(country, "airlinesCount"), "integer")}</span>
      <span class="k">Airports</span>
      <span>${formatValue(getMetricValue(country, "airportsCount"), "integer")}</span>
      <span class="k">Region</span>
      <span>${escapeHtml(country.region)}</span>
    </div>
  `;

  ui.tooltip.classList.remove("hidden");

  const offset = 14;
  const tooltipWidth = 320;
  const tooltipHeight = 220;
  const left = Math.min(event.clientX + offset, window.innerWidth - tooltipWidth);
  const top = Math.min(event.clientY + offset, window.innerHeight - tooltipHeight);

  ui.tooltip.style.left = `${Math.max(8, left)}px`;
  ui.tooltip.style.top = `${Math.max(8, top)}px`;
}

function hideTooltip() {
  ui.tooltip.classList.add("hidden");
}

function renderCountryDetails() {
  const country = getCountryByIso3(state.selectedIso3);
  if (!country) {
    renderDecisionModeExplainer();
    ui.countryEmpty.classList.remove("hidden");
    ui.countryDetails.classList.add("hidden");
    return;
  }

  renderDecisionModeExplainer();
  ui.countryEmpty.classList.add("hidden");
  ui.countryDetails.classList.remove("hidden");

  ui.countryFlag.src = country.flagSvg;
  ui.countryFlag.alt = `${country.name} flag`;
  ui.countryName.textContent = country.name;
  ui.countrySubtitle.textContent = `${country.region} • ${country.subregion} • ${country.iso3}`;
  syncVisaOriginWithSelectedCountry(country);
  setActiveDetailsJumpLink("country-hero");
  renderCountryHero(country);

  const statItems = [
    { label: "GDP", value: formatValue(getMetricValue(country, "gdp"), "money"), year: getMetricYear(country, "gdp") },
    { label: "GDP per Capita", value: formatValue(getMetricValue(country, "gdpPerCapita"), "money"), year: getMetricYear(country, "gdpPerCapita") },
    { label: "Adj. Net National Income", value: formatValue(getMetricValue(country, "netWorth"), "money"), year: getMetricYear(country, "netWorth") },
    { label: "Population", value: formatValue(getMetricValue(country, "population"), "integer"), year: getMetricYear(country, "population") },
    { label: "Crime Rate (UN 16.1.1, /100k)", value: formatValue(getMetricValue(country, "crimeRate"), "rate"), year: getMetricYear(country, "crimeRate") },
    { label: "Inflation (annual %, IMF/WB)", value: formatValue(getMetricValue(country, "inflation"), "percent"), year: getMetricYear(country, "inflation") },
    { label: "Debt (% GDP, IMF/WB)", value: formatValue(getMetricValue(country, "debtPctGdp"), "percent"), year: getMetricYear(country, "debtPctGdp") },
    { label: "Current Account (% GDP, IMF/WB)", value: formatValue(getMetricValue(country, "currentAccountPctGdp"), "percent"), year: getMetricYear(country, "currentAccountPctGdp") },
    { label: "Poverty at $2.15/day (%)", value: formatValue(getMetricValue(country, "poverty215"), "percent"), year: getMetricYear(country, "poverty215") },
    { label: "Gini Index", value: formatValue(getMetricValue(country, "gini"), "score"), year: getMetricYear(country, "gini") },
    { label: "Tourism Arrivals (UN Tourism/WB)", value: formatValue(getMetricValue(country, "tourismArrivals"), "integer"), year: getMetricYear(country, "tourismArrivals") },
    { label: "Tourism Receipts (UN Tourism/WB)", value: formatValue(getMetricValue(country, "tourismReceipts"), "money"), year: getMetricYear(country, "tourismReceipts") },
    { label: "WHO Life Expectancy", value: formatValue(getMetricValue(country, "whoLifeExpectancy"), "years"), year: getMetricYear(country, "whoLifeExpectancy") },
    { label: "ND-GAIN Vulnerability", value: formatValue(getMetricValue(country, "ndgainVulnerability"), "score"), year: getMetricYear(country, "ndgainVulnerability") },
    { label: "ND-GAIN Readiness", value: formatValue(getMetricValue(country, "ndgainReadiness"), "score"), year: getMetricYear(country, "ndgainReadiness") },
    { label: "EM-DAT Events", value: formatValue(getMetricValue(country, "emdatEvents"), "integer"), year: getMetricYear(country, "emdatEvents") },
    { label: "EM-DAT Deaths", value: formatValue(getMetricValue(country, "emdatDeaths"), "integer"), year: getMetricYear(country, "emdatDeaths") },
    { label: "Hazard Exposure Score", value: formatValue(getMetricValue(country, "hazardExposure"), "index"), year: getMetricYear(country, "hazardExposure") },
    { label: "Airlines (OpenFlights)", value: formatValue(getMetricValue(country, "airlinesCount"), "integer"), year: null },
    { label: "Airports (OpenFlights)", value: formatValue(getMetricValue(country, "airportsCount"), "integer"), year: null },
    { label: "Life Expectancy", value: formatValue(getMetricValue(country, "lifeExpectancy"), "years"), year: getMetricYear(country, "lifeExpectancy") },
    { label: "Unemployment", value: formatValue(getMetricValue(country, "unemployment"), "percent"), year: getMetricYear(country, "unemployment") },
    { label: "Military Expenditure", value: formatValue(getMetricValue(country, "milExpenditure"), "money"), year: getMetricYear(country, "milExpenditure") },
    { label: "Military Exp. (% GDP)", value: formatValue(getMetricValue(country, "milExpPctGdp"), "percent"), year: getMetricYear(country, "milExpPctGdp") },
    { label: "Armed Forces", value: formatValue(getMetricValue(country, "armedForces"), "integer"), year: getMetricYear(country, "armedForces") },
    { label: "Armed Forces (% Labor)", value: formatValue(getMetricValue(country, "armedForcesPctLabor"), "percent"), year: getMetricYear(country, "armedForcesPctLabor") }
  ];

  ui.statGrid.innerHTML = statItems
    .map(
      (item) => `
      <article class="stat-card">
        <p class="k">${escapeHtml(item.label)}</p>
        <p class="v">${item.value}</p>
        <p class="y">${item.year ? `Year: ${item.year}` : "Year: N/A"}</p>
      </article>
    `
    )
    .join("");

  const metaItems = [
    ["Capital", country.capital],
    ["Area", formatValue(country.area, "area")],
    ["Languages", country.languages],
    ["Currencies", country.currencies],
    ["Timezones", country.timezones],
    ["UN Member", boolLabel(country.unMember)],
    ["Independent", boolLabel(country.independent)],
    ["Landlocked", boolLabel(country.landlocked)],
    ["Start Of Week", country.startOfWeek],
    ["Driving Side", country.drivingSide],
    ["Continents", country.continents],
    ["Coordinates", country.latlng ? `${country.latlng[0]}, ${country.latlng[1]}` : "N/A"],
    ["Military Aircraft Counts", "No free global public API currently available"]
  ];

  ui.metaGrid.innerHTML = metaItems
    .map(
      ([key, value]) => `
      <div class="meta-cell">
        <div class="k">${escapeHtml(key)}</div>
        <div class="v">${escapeHtml(String(value ?? "N/A"))}</div>
      </div>
    `
    )
    .join("");

  const trendIso3 = country.iso3;
  loadGdpTrend(trendIso3)
    .then(() => {
      if (state.selectedIso3 === trendIso3) renderTrendChart(trendIso3);
    })
    .catch((error) => {
      console.error(error);
      if (state.selectedIso3 === trendIso3) ui.trendMeta.textContent = "Trend unavailable.";
    });

  renderCrimeTrendChart(trendIso3);
  renderForecastChart(trendIso3);
  renderDisasterTimelineChart(trendIso3);
  renderHazardLens(trendIso3);
  renderWeatherBlock(trendIso3);
  renderVisaPathFinder(trendIso3);
  renderFamilySafetyLens(trendIso3);
  renderJobMarketFit(trendIso3);
  renderBestAlternatives(trendIso3);
  renderCountryChangeAlerts(trendIso3);

  // News
  const newsIso3 = country.iso3;
  ui.newsList.innerHTML =
    '<p class="news-loading">Loading news\u2026</p>' +
    '<div class="news-progress-wrap"><div class="news-progress-bar" id="news-progress"></div></div>' +
    '<p class="news-progress-label" id="news-progress-label">Connecting to news sources\u2026</p>';
  ui.newsMeta.textContent = "";
  const onProgress = (pct, label) => {
    if (state.selectedIso3 !== newsIso3) return;
    const bar = document.getElementById("news-progress");
    const lbl = document.getElementById("news-progress-label");
    if (bar) bar.style.width = pct + "%";
    if (lbl) lbl.textContent = label;
  };
  loadCountryNews(newsIso3, false, onProgress)
    .then(() => {
      if (state.selectedIso3 === newsIso3) renderNewsBlock(newsIso3);
    })
    .catch((error) => {
      console.error(error);
      if (state.selectedIso3 === newsIso3) {
        ui.newsList.innerHTML = '<p class="news-empty">Unable to load news.</p>';
      }
    });
}

function renderCountryHero(country) {
  if (
    !ui.countryHero ||
    !ui.countryHeroEyebrow ||
    !ui.countryHeroSummary ||
    !ui.countryHeroTags ||
    !ui.countryHeroOverallRing ||
    !ui.countryHeroOverallValue ||
    !ui.countryHeroPulseLabel ||
    !ui.countryHeroMetrics
  ) {
    return;
  }

  const family = computeFamilySafetyLens(country);
  const hazard = computeHazardExposure(country);
  const job = computeJobMarketFit(country, state.jobProfession);
  const relocation = computeRelocationEstimate(country, { ...state.relocation, incomeMonthly: null });
  const stability = computeMacroStabilityScore(country);
  const decision = computeDecisionModeScore(country);
  const pulse = computeCountryPulseScore({ family, hazard, job, relocation, stability, decision });
  const localTime = formatCountryLocalTime(country);
  const summary = buildCountryHeroSummary(country, { family, hazard, job, relocation, stability, pulse, decision });
  const tags = buildCountryHeroTags(country, { family, hazard, job, relocation, stability, pulse, decision, localTime });
  const mode = getDecisionModeConfig();

  ui.countryHeroEyebrow.textContent = localTime
    ? `${country.capital || country.name} • Local time ${localTime} • ${mode.label}`
    : `${country.capital || country.name} • ${mode.label}`;
  ui.countryHeroSummary.textContent = summary;
  ui.countryHeroOverallRing.style.setProperty("--pct", pulse.toFixed(1));
  ui.countryHeroOverallValue.textContent = pulse.toFixed(0);
  ui.countryHeroPulseLabel.textContent = `${mode.shortLabel} Pulse`;
  ui.countryHeroTags.innerHTML = tags
    .map((tag) => `<span class="hero-tag ${tag.tone}">${escapeHtml(tag.label)}</span>`)
    .join("");

  const heroMetrics = [
    {
      label: "Family Safety",
      score: family.overall,
      value: `${family.overall.toFixed(0)} / 100`
    },
    {
      label: "Decision Fit",
      score: decision.overall,
      value: `${decision.overall.toFixed(0)} / 100`
    },
    {
      label: "Job Fit",
      score: job.overall,
      value: `${job.overall.toFixed(0)} / 100`
    },
    {
      label: "Hazard Resilience",
      score: Number.isFinite(hazard.score) ? Math.max(0, 100 - hazard.score) : 50,
      value: Number.isFinite(hazard.score) ? `${Math.max(0, 100 - hazard.score).toFixed(0)} / 100` : "N/A"
    }
  ];

  ui.countryHeroMetrics.innerHTML = heroMetrics
    .map((metric) => `
      <article class="hero-metric-card">
        <div class="hero-ring" style="--pct:${clampNumber(metric.score, 0, 100, 50).toFixed(1)}">
          <span>${Number.isFinite(metric.score) ? metric.score.toFixed(0) : "N/A"}</span>
        </div>
        <div class="hero-metric-label">${escapeHtml(metric.label)}</div>
        <div class="hero-metric-value">${escapeHtml(metric.value)}</div>
      </article>
    `)
    .join("");

  renderCountryStoryMode(country, { family, hazard, job, relocation, stability, pulse, decision });
}

function syncVisaOriginWithSelectedCountry(country, options = {}) {
  if (!country || !ui.visaOriginSelect) return;
  const force = options.force === true;
  if (!force && state.visaOriginManualOverride) return;

  if (![...ui.visaOriginSelect.options].some((opt) => opt.value === country.iso3)) return;
  state.visaOriginIso3 = country.iso3;
  if (ui.visaOriginSelect.value !== country.iso3) {
    ui.visaOriginSelect.value = country.iso3;
  }
}

function getDefaultMapLayerRelocationParams() {
  return {
    incomeMonthly: null,
    adults: 2,
    children: 2,
    lifestyle: "balanced",
    housing: "familyRent",
    cityTier: "secondary",
    schooling: "public",
    healthcare: "public",
    bufferPct: 15
  };
}

function computeEconomyLayerScore(country) {
  const gdpPc = getLatestMetricValue(country, "gdpPerCapita");
  const netWorth = getLatestMetricValue(country, "netWorth");
  const unemployment = getLatestMetricValue(country, "unemployment");
  const stability = computeMacroStabilityScore(country);

  const incomeScore = scaleLogScore(gdpPc, 1200, 95000, 55);
  const netWorthScore = scaleLogScore(netWorth, 1000000000, 20000000000000, 55);
  const jobsScore = Number.isFinite(unemployment) ? clampNumber(100 - unemployment * 4.8, 0, 100, 55) : 55;

  return clampNumber(
    incomeScore * 0.42 + netWorthScore * 0.18 + jobsScore * 0.22 + stability * 0.18,
    0,
    100,
    55
  );
}

function computeHealthSupportScore(country) {
  const lifeExp = getLatestMetricValue(country, "whoLifeExpectancy") ?? getLatestMetricValue(country, "lifeExpectancy");
  const readiness = getLatestMetricValue(country, "ndgainReadiness");
  const healthSafety = Number.isFinite(lifeExp) ? clampNumber(((lifeExp - 50) / 35) * 100, 0, 100, 55) : 55;
  const systemsReadiness = Number.isFinite(readiness) ? clampNumber(readiness * 100, 0, 100, 55) : 55;
  return clampNumber(healthSafety * 0.76 + systemsReadiness * 0.24, 0, 100, 55);
}

function computeMacroStabilityScore(country) {
  const inflation = getLatestMetricValue(country, "inflation");
  const debt = getLatestMetricValue(country, "debtPctGdp");
  const currentAccount = getLatestMetricValue(country, "currentAccountPctGdp");

  const inflationScore = Number.isFinite(inflation) ? clampNumber(100 - Math.abs(inflation - 3) * 6.5, 0, 100, 55) : 55;
  const debtScore = Number.isFinite(debt) ? clampNumber(100 - Math.max(0, debt - 45) * 0.8, 0, 100, 55) : 55;
  const externalScore = Number.isFinite(currentAccount) ? clampNumber(100 - Math.abs(currentAccount) * 5.5, 0, 100, 55) : 55;

  return (inflationScore * 0.5) + (debtScore * 0.3) + (externalScore * 0.2);
}

function computeDecisionModeScore(country, modeKey = state.decisionMode) {
  if (!country) {
    return {
      mode: getDecisionModeConfig(modeKey),
      overall: null,
      components: {}
    };
  }

  const mode = getDecisionModeConfig(modeKey);
  const neutralRelocation = computeRelocationEstimate(country, getDefaultMapLayerRelocationParams());
  const hazard = computeHazardExposure(country);
  const components = {
    relocation: neutralRelocation.relocationScore,
    family: computeFamilySafetyLens(country).overall,
    jobs: computeJobMarketFit(country, state.jobProfession).overall,
    stability: computeMacroStabilityScore(country),
    hazardResilience: Number.isFinite(hazard.score) ? clampNumber(100 - hazard.score, 0, 100, 50) : 50,
    economy: computeEconomyLayerScore(country),
    health: computeHealthSupportScore(country)
  };

  let weighted = 0;
  let totalWeight = 0;
  for (const [componentKey, weight] of Object.entries(mode.weights)) {
    const value = Number(components[componentKey]);
    if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += value * weight;
    totalWeight += weight;
  }

  return {
    mode,
    overall: clampNumber(totalWeight > 0 ? weighted / totalWeight : 55, 0, 100, 55),
    components
  };
}

function getDecisionModeRankingForCountry(country) {
  if (!country) return null;
  const rows = [...state.countriesByIso3.values()]
    .filter((entry) => isCountryVisible(entry))
    .map((entry) => ({
      iso3: entry.iso3,
      value: computeDecisionModeScore(entry).overall
    }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => b.value - a.value);

  const index = rows.findIndex((entry) => entry.iso3 === country.iso3);
  if (index === -1) return null;
  return { rank: index + 1, totalShown: rows.length };
}

function computeCountryPulseScore(context) {
  if (context.decision?.overall != null) {
    return clampNumber(context.decision.overall, 0, 100, 50);
  }

  const hazardResilience = Number.isFinite(context.hazard.score) ? Math.max(0, 100 - context.hazard.score) : 50;
  const values = [
    { score: context.family.overall, weight: 0.28 },
    { score: context.relocation.relocationScore, weight: 0.24 },
    { score: context.job.overall, weight: 0.2 },
    { score: hazardResilience, weight: 0.16 },
    { score: context.stability, weight: 0.12 }
  ];

  let weighted = 0;
  let weightTotal = 0;
  for (const item of values) {
    if (!Number.isFinite(item.score)) continue;
    weighted += item.score * item.weight;
    weightTotal += item.weight;
  }
  return clampNumber(weightTotal > 0 ? weighted / weightTotal : 50, 0, 100, 50);
}

function buildCountryHeroSummary(country, context) {
  const mode = getDecisionModeConfig();
  const strongest = [
    { label: "family safety", score: context.family.overall },
    { label: `${mode.shortLabel.toLowerCase()} fit`, score: context.decision?.overall ?? context.relocation.relocationScore },
    { label: "job-fit outlook", score: context.job.overall },
    { label: "macro stability", score: context.stability },
    { label: "hazard resilience", score: Number.isFinite(context.hazard.score) ? 100 - context.hazard.score : null }
  ]
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)[0];

  const weakest = [
    { label: "family safety", score: context.family.overall },
    { label: `${mode.shortLabel.toLowerCase()} fit`, score: context.decision?.overall ?? context.relocation.relocationScore },
    { label: "job-fit outlook", score: context.job.overall },
    { label: "macro stability", score: context.stability },
    { label: "hazard resilience", score: Number.isFinite(context.hazard.score) ? 100 - context.hazard.score : null }
  ]
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score)[0];

  const pulseLabel =
    context.pulse >= 78 ? "a strong all-round profile" :
      context.pulse >= 62 ? "a balanced profile with clear strengths" :
        context.pulse >= 48 ? "a mixed profile that needs closer review" :
          "a higher-risk profile for most users";

  if (!strongest || !weakest) {
    return `${country.name} currently shows ${pulseLabel} for ${mode.label}.`;
  }

  return `${country.name} shows ${pulseLabel} for ${mode.label}, led by ${strongest.label} and held back most by ${weakest.label}.`;
}

function buildCountryHeroTags(country, context) {
  const mode = getDecisionModeConfig();
  const tags = [];

  if (context.family.overall >= 72) tags.push({ label: "Family-friendly", tone: "positive" });
  else if (context.family.overall < 52) tags.push({ label: "Safety caution", tone: "risk" });

  if ((context.decision?.overall ?? context.relocation.relocationScore) >= 72) {
    tags.push({ label: `Strong ${mode.shortLabel.toLowerCase()} fit`, tone: "positive" });
  } else if ((context.decision?.overall ?? context.relocation.relocationScore) < 50) {
    tags.push({ label: `${mode.shortLabel} tradeoffs`, tone: "caution" });
  }

  if (context.job.overall >= 72) tags.push({ label: `Strong ${context.job.profile.label}`, tone: "positive" });
  else if (context.job.overall < 50) tags.push({ label: "Weaker job signal", tone: "caution" });

  if (Number.isFinite(context.hazard.score)) {
    if (context.hazard.score >= 65) tags.push({ label: "Elevated hazard exposure", tone: "risk" });
    else if (context.hazard.score <= 35) tags.push({ label: "Lower climate/disaster stress", tone: "positive" });
  }

  if (context.stability >= 68) tags.push({ label: "Stable macro backdrop", tone: "positive" });
  else if (context.stability < 48) tags.push({ label: "Economic volatility", tone: "risk" });

  const weatherEntry = state.weatherCache.get(country.iso3);
  if (weatherEntry?.data?.current?.temperature_2m != null) {
    const temp = Number(weatherEntry.data.current.temperature_2m);
    if (Number.isFinite(temp)) {
      tags.push({ label: `${temp.toFixed(0)}${weatherEntry.data.current_units?.temperature_2m || "°C"} now`, tone: "caution" });
    }
  }

  if (tags.length < 4) {
    tags.push({ label: `${country.region} region`, tone: "caution" });
  }

  return tags.slice(0, 5);
}

function formatCountryLocalTime(country) {
  const timezone = Array.isArray(country?.timezones) ? country.timezones[0] : null;
  if (!timezone || timezone === "N/A") return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone
    }).format(new Date());
  } catch {
    return "";
  }
}

function renderCountryStoryMode(country, context) {
  if (
    !ui.countryStory ||
    !ui.countryStoryTitle ||
    !ui.countryStoryBadge ||
    !ui.countryStorySummary ||
    !ui.countryStoryStrengths ||
    !ui.countryStoryCautions ||
    !ui.countryStoryFit
  ) {
    return;
  }

  const story = buildCountryStory(country, context);
  ui.countryStoryTitle.textContent = story.title;
  ui.countryStoryBadge.textContent = story.badge.label;
  ui.countryStoryBadge.className = `country-story-badge ${story.badge.tone}`;
  ui.countryStorySummary.textContent = story.summary;
  ui.countryStoryStrengths.innerHTML = story.strengths.map((item) => renderCountryStoryItem(item, "positive")).join("");
  ui.countryStoryCautions.innerHTML = story.cautions.map((item) => renderCountryStoryItem(item, item.tone || "caution")).join("");
  ui.countryStoryFit.innerHTML = story.fit.map((item) => renderCountryStoryItem(item, "positive")).join("");
}

function buildCountryStory(country, context) {
  const mode = getDecisionModeConfig();
  const hazardResilience = Number.isFinite(context.hazard.score) ? 100 - context.hazard.score : null;
  const inflation = getLatestMetricValue(country, "inflation");
  const unemployment = getLatestMetricValue(country, "unemployment");
  const crime = getLatestMetricValue(country, "crimeRate");
  const gdpPc = getLatestMetricValue(country, "gdpPerCapita");
  const decisionScore = context.decision?.overall ?? context.relocation.relocationScore;

  const strengths = [];
  const cautions = [];
  const fit = [];

  if (context.family.overall >= 72) strengths.push("Family safety profile is stronger than average.");
  if (context.relocation.relocationScore >= 72) strengths.push("Relocation math looks relatively favorable for a balanced household.");
  if (decisionScore >= 74) strengths.push(`${mode.label} score is one of the stronger signals in this profile.`);
  if (context.job.overall >= 72) strengths.push(`${context.job.profile.label} outlook is one of this country's stronger signals.`);
  if (context.stability >= 68) strengths.push("Macro conditions look comparatively stable.");
  if (Number.isFinite(hazardResilience) && hazardResilience >= 68) strengths.push("Climate and disaster exposure is relatively manageable.");
  if (Number.isFinite(gdpPc) && gdpPc >= 30000) strengths.push("Income level and market depth support a stronger baseline quality of life.");

  if (context.family.overall < 52) cautions.push({ text: "Safety conditions need closer review, especially at city level.", tone: "risk" });
  if (context.relocation.relocationScore < 50) cautions.push({ text: "Relocation fit is weaker unless the household budget is flexible.", tone: "caution" });
  if (decisionScore < 48) cautions.push({ text: `${mode.label} currently reads as a weaker fit than the map average.`, tone: "caution" });
  if (context.job.overall < 50) cautions.push({ text: `${context.job.profile.label} demand signal is not especially strong here.`, tone: "caution" });
  if (Number.isFinite(hazardResilience) && hazardResilience < 45) cautions.push({ text: "Disaster or climate stress is meaningfully elevated.", tone: "risk" });
  if (Number.isFinite(inflation) && inflation > 7) cautions.push({ text: "Inflation pressure could erode day-to-day affordability.", tone: "risk" });
  if (Number.isFinite(unemployment) && unemployment > 9) cautions.push({ text: "Labor market pressure is on the high side.", tone: "caution" });
  if (Number.isFinite(crime) && crime > 8) cautions.push({ text: "Crime trend deserves a city-by-city check before deciding to move.", tone: "risk" });

  if (context.family.overall >= 70 && context.relocation.relocationScore >= 62) fit.push("Families looking for a steadier move shortlist.");
  if (context.job.overall >= 70) fit.push(`${context.job.profile.label} professionals targeting better market fit.`);
  if (context.relocation.relocationScore >= 68 && context.stability >= 60) fit.push("Users prioritizing day-to-day livability over speculation.");
  if (decisionScore >= 70) fit.push(`Users specifically optimizing for ${mode.label.toLowerCase()}.`);
  if (Number.isFinite(hazardResilience) && hazardResilience >= 68) fit.push("People who want lower climate-disruption stress.");
  if (context.family.overall < 55 && context.job.overall >= 68) fit.push("Career-first movers who can tolerate tradeoffs elsewhere.");

  const badge =
    context.pulse >= 78 ? { label: "Strong Story", tone: "positive" } :
      context.pulse >= 62 ? { label: "Balanced Story", tone: "positive" } :
        context.pulse >= 48 ? { label: "Mixed Story", tone: "caution" } :
          { label: "High-Caution Story", tone: "risk" };

  const strongest = describeStoryAxis(getBestStoryAxis(context));
  const weakest = describeStoryAxis(getWeakestStoryAxis(context));

  const summary =
    context.pulse >= 78
      ? `${country.name} reads as a convincing option for ${mode.label.toLowerCase()}, with its strongest signal in ${strongest} and its main tradeoff in ${weakest}.`
      : context.pulse >= 62
        ? `${country.name} looks fairly balanced for ${mode.label.toLowerCase()}: it has a credible edge in ${strongest}, but users should still watch ${weakest}.`
        : context.pulse >= 48
          ? `${country.name} tells a mixed story for ${mode.label.toLowerCase()}. There is some upside in ${strongest}, but ${weakest} is strong enough to change the decision for many users.`
          : `${country.name} currently leans toward a cautionary story for ${mode.label.toLowerCase()}. Even if ${strongest} is workable, ${weakest} creates meaningful friction for most moves.`;

  return {
    title: `${country.name} in plain language`,
    badge,
    summary,
    strengths: strengths.length ? strengths.slice(0, 4) : ["This country has a usable baseline, but its story is more mixed than obviously strong."],
    cautions: cautions.length ? cautions.slice(0, 4) : [{ text: "No major red flags stand out from the current open-data profile.", tone: "caution" }],
    fit: fit.length ? fit.slice(0, 4) : ["Users willing to compare cities and specific budgets before deciding."]
  };
}

function getBestStoryAxis(context) {
  return [
    { key: "family", score: context.family.overall },
    { key: "decision", score: context.decision?.overall ?? context.relocation.relocationScore },
    { key: "jobs", score: context.job.overall },
    { key: "stability", score: context.stability },
    { key: "hazard", score: Number.isFinite(context.hazard.score) ? 100 - context.hazard.score : null }
  ]
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)[0]?.key || "stability";
}

function getWeakestStoryAxis(context) {
  return [
    { key: "family", score: context.family.overall },
    { key: "decision", score: context.decision?.overall ?? context.relocation.relocationScore },
    { key: "jobs", score: context.job.overall },
    { key: "stability", score: context.stability },
    { key: "hazard", score: Number.isFinite(context.hazard.score) ? 100 - context.hazard.score : null }
  ]
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score)[0]?.key || "stability";
}

function describeStoryAxis(key) {
  switch (key) {
    case "family": return "family safety";
    case "decision": return `${getDecisionModeConfig().label.toLowerCase()} fit`;
    case "relocation": return "relocation affordability and fit";
    case "jobs": return "job-market potential";
    case "hazard": return "hazard resilience";
    case "stability": return "economic stability";
    default: return key;
  }
}

function renderCountryStoryItem(item, tone) {
  const text = typeof item === "string" ? item : item.text;
  const finalTone = typeof item === "object" && item?.tone ? item.tone : tone;
  return `<div class="country-story-item ${finalTone}">${escapeHtml(text)}</div>`;
}

function renderRankingTable() {
  const active = getActiveMapConfig();
  ui.rankingTitle.textContent =
    active.source === "layer" && !active.higherIsBetter
      ? `Lowest-Risk Countries by ${active.label}`
      : `Top Countries by ${active.label}`;

  const rows = [...state.countriesByIso3.values()]
    .filter((country) => isCountryVisible(country))
    .map((country) => ({
      country,
      value: getActiveMapValue(country)
    }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => active.higherIsBetter ? b.value - a.value : a.value - b.value)
    .slice(0, state.rankingLimit);

  if (!rows.length) {
    ui.rankingTableBody.innerHTML = `<tr><td colspan="5">No matching countries for current filters.</td></tr>`;
    return;
  }

  ui.rankingTableBody.innerHTML = rows
    .map((entry, idx) => {
      const selected = entry.country.iso3 === state.selectedIso3 ? "focus-row" : "";
      const series = active.source === "metric" ? getMetricTimeSeries(entry.country, active.key) : [];
      return `
        <tr class="${selected}" data-iso3="${entry.country.iso3}">
          <td>${idx + 1}</td>
          <td>${escapeHtml(entry.country.name)}</td>
          <td>${escapeHtml(entry.country.region)}</td>
          <td>${formatValue(entry.value, active.type)}</td>
          <td class="sparkline-cell">${active.source === "metric" ? renderSparkline(series) : renderLayerScoreBar(entry.value)}</td>
        </tr>
      `;
    })
    .join("");

  for (const row of ui.rankingTableBody.querySelectorAll("tr[data-iso3]")) {
    row.addEventListener("click", () => {
      const iso3 = row.getAttribute("data-iso3");
      if (!iso3) return;
      state.selectedIso3 = iso3;
      renderMapLayerExplainer();
      renderCountryDetails();
      renderRelocationTable();
      repaintMap();
      row.scrollIntoView({ block: "nearest" });
    });
  }
}

function renderGlobalRankingsCarousel() {
  if (
    !ui.rankingsCarouselTrack ||
    !ui.rankingsCarouselTitle ||
    !ui.rankingsCarouselSubtitle ||
    !ui.rankingsCarouselDots
  ) {
    return;
  }

  const total = GLOBAL_RANKING_CAROUSEL_SLIDES.length;
  const index = ((state.rankingsCarouselIndex % total) + total) % total;
  state.rankingsCarouselIndex = index;

  const slide = GLOBAL_RANKING_CAROUSEL_SLIDES[index];
  const mode = getDecisionModeConfig();
  const slideTitle = slide.key === "decisionFit" ? `${mode.label}: Best Matches` : slide.title;
  const slideSubtitle = slide.key === "decisionFit"
    ? `Countries that currently score highest for ${mode.label.toLowerCase()} under the active decision weights.`
    : slide.subtitle;
  ui.rankingsCarouselTitle.textContent = slideTitle;
  ui.rankingsCarouselSubtitle.textContent = slideSubtitle;

  const rows = [...state.countriesByIso3.values()]
    .map((country) => {
      const value = slide.compute(country);
      return Number.isFinite(value)
        ? {
            iso3: country.iso3,
            name: country.name,
            region: country.region,
            value,
            note: buildCarouselCardNote(slide.key, country)
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (!rows.length) {
    ui.rankingsCarouselTrack.innerHTML = '<p class="insight-empty">Not enough data to build this ranking right now.</p>';
  } else {
    ui.rankingsCarouselTrack.innerHTML = rows
      .map((row, rowIndex) => `
        <article class="carousel-card ${row.iso3 === state.selectedIso3 ? "active" : ""}" data-iso3="${escapeHtml(row.iso3)}">
          <span class="carousel-rank">#${rowIndex + 1}</span>
          <p class="carousel-country">${escapeHtml(row.name)}</p>
          <p class="carousel-region">${escapeHtml(row.region)}</p>
          <p class="carousel-value">${escapeHtml(slide.key === "decisionFit" ? `${mode.label} Score` : slide.valueLabel)}: ${escapeHtml(formatValue(row.value, slide.type))}</p>
          <p class="carousel-note">${escapeHtml(row.note || slide.note)}</p>
        </article>
      `)
      .join("");
  }

  ui.rankingsCarouselDots.innerHTML = GLOBAL_RANKING_CAROUSEL_SLIDES.map((item, dotIndex) => `
    <button
      class="rankings-carousel-dot ${dotIndex === index ? "active" : ""}"
      data-index="${dotIndex}"
      aria-label="Show ${escapeHtml(item.key === "decisionFit" ? `${mode.label}: Best Matches` : item.title)}"
      title="${escapeHtml(item.key === "decisionFit" ? `${mode.label}: Best Matches` : item.title)}"
    ></button>
  `).join("");
}

function buildCarouselCardNote(slideKey, country) {
  switch (slideKey) {
    case "familySafety": {
      const hazard = computeHazardExposure(country).score;
      return Number.isFinite(hazard) && hazard < 40
        ? "Strong safety profile with relatively low hazard stress."
        : "Stronger family conditions from safety, health, and stability metrics.";
    }
    case "decisionFit":
      return `${getDecisionModeConfig().label} is currently a comparatively strong match here.`;
    case "jobFit":
      return `${getJobProfileConfig().label} fit is currently strong here.`;
    case "hazardResilience":
      return "Lower disaster and climate exposure than most peers.";
    case "macroStability":
      return "Inflation, debt, and external-balance profile looks steadier.";
    case "highRisk":
      return "Combined pressure from safety, hazard, and economic stress signals.";
    default:
      return "";
  }
}

function renderComparisonTable() {
  const isoA = ui.compareA.value;
  const isoB = ui.compareB.value;
  const countryA = getCountryByIso3(isoA);
  const countryB = getCountryByIso3(isoB);

  if (!countryA || !countryB) {
    ui.compareBody.innerHTML = `<tr><td colspan="4">Select two countries to compare.</td></tr>`;
    return;
  }

  ui.compareHeadA.textContent = countryA.name;
  ui.compareHeadB.textContent = countryB.name;

  ui.compareBody.innerHTML = COMPARE_METRICS.map((metric) => {
    const valueA = getMetricValue(countryA, metric.key);
    const valueB = getMetricValue(countryB, metric.key);
    const delta = Number.isFinite(valueA) && Number.isFinite(valueB) ? valueA - valueB : null;

    const deltaClass = delta == null ? "" : delta > 0 ? "value-positive" : delta < 0 ? "value-negative" : "";

    return `
      <tr>
        <td>${escapeHtml(metric.label)}</td>
        <td>${formatValue(valueA, metric.type)}</td>
        <td>${formatValue(valueB, metric.type)}</td>
        <td class="${deltaClass}">${formatDelta(delta, metric.type)}</td>
      </tr>
    `;
  }).join("");
}

async function loadGdpTrend(iso3, force = false) {
  if (!iso3) return;
  if (!force && state.gdpTrendCache.has(iso3)) return;

  const endYear = new Date().getFullYear() - 1;
  const url = `${WORLD_BANK_BASE}/country/${iso3}/indicator/NY.GDP.MKTP.CD?format=json&per_page=200&date=2000:${endYear}`;
  const payload = await fetchJson(url);
  const rows = Array.isArray(payload) ? payload[1] : [];

  const points = (rows ?? [])
    .filter((row) => row.value != null)
    .map((row) => ({ year: Number(row.date), value: Number(row.value) }))
    .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.value))
    .sort((a, b) => a.year - b.year);

  state.gdpTrendCache.set(iso3, points);
}

function renderTrendChart(iso3) {
  const points = state.gdpTrendCache.get(iso3) ?? [];
  const svg = d3.select(ui.trendChart);
  svg.selectAll("*").remove();

  const width = 420;
  const height = 210;
  const margin = { top: 18, right: 20, bottom: 28, left: 56 };

  if (!points.length) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#5b7271")
      .text("No GDP trend data available.");
    ui.trendMeta.textContent = "World Bank GDP series unavailable for this country.";
    return;
  }

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(points, (d) => d.year))
    .range([margin.left, width - margin.right]);

  const yMin = d3.min(points, (d) => d.value);
  const yMax = d3.max(points, (d) => d.value);

  const yScale = d3
    .scaleLinear()
    .domain([Math.min(0, yMin * 0.9), yMax * 1.05])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = d3
    .axisBottom(xScale)
    .ticks(6)
    .tickFormat((value) => String(Math.round(value)));

  const yAxis = d3
    .axisLeft(yScale)
    .ticks(5)
    .tickFormat((value) => fmtCompactMoney.format(value));

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .call((g) => g.selectAll("text").attr("font-size", 10));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call((g) => g.selectAll("text").attr("font-size", 10));

  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  svg
    .append("path")
    .datum(points)
    .attr("fill", "none")
    .attr("stroke", "#0c8f72")
    .attr("stroke-width", 2.2)
    .attr("d", line);

  const last = points[points.length - 1];
  svg
    .append("circle")
    .attr("cx", xScale(last.year))
    .attr("cy", yScale(last.value))
    .attr("r", 3.8)
    .attr("fill", "#125d56");

  const lastLabel = `${last.year}: ${fmtCompactMoney.format(last.value)}`;
  const lastLabelX = xScale(last.year);
  // ~6px per character — flip label to the left if it would overflow the right edge.
  const labelAnchor = lastLabelX + lastLabel.length * 6 + 6 > width - margin.right ? "end" : "start";
  const labelOffset = labelAnchor === "end" ? -6 : 6;

  svg
    .append("text")
    .attr("x", lastLabelX + labelOffset)
    .attr("y", yScale(last.value) - 8)
    .attr("text-anchor", labelAnchor)
    .attr("fill", "#125d56")
    .attr("font-size", 10)
    .text(lastLabel);

  ui.trendMeta.textContent = `Series points: ${points.length} years (${points[0].year}-${last.year}).`;
}

function renderCrimeTrendChart(iso3) {
  if (!ui.crimeTrendChart || !ui.crimeTrendMeta) return;

  const country = getCountryByIso3(iso3);
  const points = getMetricTimeSeries(country, "crimeRate");
  const svg = d3.select(ui.crimeTrendChart);
  svg.selectAll("*").remove();

  const width = 420;
  const height = 210;
  const margin = { top: 18, right: 20, bottom: 28, left: 56 };

  if (!points.length) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#5b7271")
      .text("No UN crime trend available.");
    if (!state.unCrimeLoaded && state.unCrimeError) {
      ui.crimeTrendMeta.textContent =
        "UN crime API could not be loaded (CORS/network). Try Reload crime.";
    } else {
      ui.crimeTrendMeta.textContent =
        "UN SDG API (16.1.1) has no available country series for current selection.";
    }
    return;
  }

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(points, (d) => d.year))
    .range([margin.left, width - margin.right]);

  const yMin = d3.min(points, (d) => d.value);
  const yMax = d3.max(points, (d) => d.value);
  const yScale = d3
    .scaleLinear()
    .domain([Math.max(0, yMin * 0.9), yMax * 1.08])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat((value) => String(Math.round(value)));
  const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((value) => `${Number(value).toFixed(1)}`);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .call((g) => g.selectAll("text").attr("font-size", 10));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call((g) => g.selectAll("text").attr("font-size", 10));

  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  svg
    .append("path")
    .datum(points)
    .attr("fill", "none")
    .attr("stroke", "#b35a00")
    .attr("stroke-width", 2.2)
    .attr("d", line);

  const last = points[points.length - 1];
  svg
    .append("circle")
    .attr("cx", xScale(last.year))
    .attr("cy", yScale(last.value))
    .attr("r", 3.8)
    .attr("fill", "#8f4300");

  const lastLabel = `${last.year}: ${last.value.toFixed(2)} /100k`;
  const lastLabelX = xScale(last.year);
  const labelAnchor = lastLabelX + lastLabel.length * 6 + 6 > width - margin.right ? "end" : "start";
  const labelOffset = labelAnchor === "end" ? -6 : 6;

  svg
    .append("text")
    .attr("x", lastLabelX + labelOffset)
    .attr("y", yScale(last.value) - 8)
    .attr("text-anchor", labelAnchor)
    .attr("fill", "#8f4300")
    .attr("font-size", 10)
    .text(lastLabel);

  ui.crimeTrendMeta.textContent =
    `UN SDG 16.1.1 points: ${points.length} years (${points[0].year}-${last.year}).`;
}

function getForecastMetricConfig(key = state.forecastMetric) {
  return FORECAST_METRICS.find((metric) => metric.key === key) ?? FORECAST_METRICS[0];
}

function getForecastProjection(country, metricKey, actualPoints) {
  const horizon = 5;
  const lastActualYear = actualPoints.length ? actualPoints[actualPoints.length - 1].year : null;

  if (
    lastActualYear != null &&
    (metricKey === "inflation" || metricKey === "debtPctGdp" || metricKey === "currentAccountPctGdp")
  ) {
    const imfSeries = state.imfForecastByMetric?.[metricKey]?.get(country.iso3) ?? [];
    const forecastPoints = imfSeries
      .filter((row) => row.year > lastActualYear && row.year <= lastActualYear + horizon)
      .map((row) => ({ year: row.year, value: row.value }));
    if (forecastPoints.length) {
      return { points: forecastPoints, method: "IMF projected series" };
    }
  }

  const linear = buildLinearForecast(actualPoints, horizon);
  if (linear.length) {
    return { points: linear, method: "Linear trend projection (last 8 points)" };
  }

  return { points: [], method: "No forecast available" };
}

function buildLinearForecast(points, horizon = 5) {
  const sample = points.slice(-8);
  if (sample.length < 3) return [];

  const n = sample.length;
  const sumX = sample.reduce((acc, row) => acc + row.year, 0);
  const sumY = sample.reduce((acc, row) => acc + row.value, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;
  for (const row of sample) {
    numerator += (row.year - meanX) * (row.value - meanY);
    denominator += (row.year - meanX) ** 2;
  }
  if (!Number.isFinite(denominator) || denominator === 0) return [];

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  const lastYear = sample[sample.length - 1].year;
  const forecast = [];
  for (let i = 1; i <= horizon; i += 1) {
    const year = lastYear + i;
    const value = intercept + slope * year;
    if (!Number.isFinite(value)) continue;
    forecast.push({ year, value });
  }
  return forecast;
}

function renderForecastChart(iso3) {
  if (!ui.forecastChart || !ui.forecastMeta) return;

  const svg = d3.select(ui.forecastChart);
  svg.selectAll("*").remove();

  const country = getCountryByIso3(iso3);
  if (!country) {
    ui.forecastMeta.textContent = "Select a country to view forecasts.";
    return;
  }

  const metric = getForecastMetricConfig();
  const actual = getMetricTimeSeries(country, metric.key)
    .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.value))
    .sort((a, b) => a.year - b.year);

  const width = 420;
  const height = 210;
  const margin = { top: 18, right: 44, bottom: 28, left: 56 };

  if (!actual.length) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#5b7271")
      .text("No historical series available.");
    ui.forecastMeta.textContent = `${metric.label}: no historical data for this country.`;
    return;
  }

  const projection = state.forecastMode ? getForecastProjection(country, metric.key, actual) : { points: [], method: "Forecast mode disabled" };
  const allPoints = [...actual, ...projection.points];

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(allPoints, (d) => d.year))
    .range([margin.left, width - margin.right]);

  const yMin = d3.min(allPoints, (d) => d.value);
  const yMax = d3.max(allPoints, (d) => d.value);
  const yPad = (yMax - yMin || Math.abs(yMax) || 1) * 0.12;
  const yScale = d3
    .scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat((v) => String(Math.round(v))))
    .call((g) => g.selectAll("text").attr("font-size", 10));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).ticks(5).tickFormat((v) => formatAxisValue(v, metric.type)))
    .call((g) => g.selectAll("text").attr("font-size", 10));

  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  svg
    .append("path")
    .datum(actual)
    .attr("fill", "none")
    .attr("stroke", "#0c8f72")
    .attr("stroke-width", 2.2)
    .attr("d", line);

  if (state.forecastMode && projection.points.length) {
    svg
      .append("path")
      .datum([actual[actual.length - 1], ...projection.points])
      .attr("fill", "none")
      .attr("stroke", "#b35a00")
      .attr("stroke-width", 2.2)
      .attr("stroke-dasharray", "5 4")
      .attr("d", line);
  }

  const latestActual = actual[actual.length - 1];
  svg
    .append("circle")
    .attr("cx", xScale(latestActual.year))
    .attr("cy", yScale(latestActual.value))
    .attr("r", 3.5)
    .attr("fill", "#125d56");

  if (state.forecastMode && projection.points.length) {
    const lastForecast = projection.points[projection.points.length - 1];
    svg
      .append("circle")
      .attr("cx", xScale(lastForecast.year))
      .attr("cy", yScale(lastForecast.value))
      .attr("r", 3.5)
      .attr("fill", "#8f4300");
  }

  svg
    .append("text")
    .attr("x", margin.left + 2)
    .attr("y", margin.top + 2)
    .attr("fill", "#0c8f72")
    .attr("font-size", 10)
    .text("Historical");

  if (state.forecastMode) {
    svg
      .append("text")
      .attr("x", margin.left + 78)
      .attr("y", margin.top + 2)
      .attr("fill", "#b35a00")
      .attr("font-size", 10)
      .text("Forecast");
  }

  ui.forecastMeta.textContent = state.forecastMode
    ? `${metric.label}: ${projection.method}. Historical ${actual[0].year}-${actual[actual.length - 1].year}.`
    : `${metric.label}: turn Forecast mode on to project the next 5 years.`;
}

function renderDisasterTimelineChart(iso3) {
  if (!ui.disasterChart || !ui.disasterMeta) return;

  const svg = d3.select(ui.disasterChart);
  svg.selectAll("*").remove();

  const country = getCountryByIso3(iso3);
  if (!country) {
    ui.disasterMeta.textContent = "Select a country to view disaster timeline.";
    return;
  }

  const eventsPoints = getMetricTimeSeries(country, "emdatEvents");
  const deathsPoints = getMetricTimeSeries(country, "emdatDeaths");
  if (!eventsPoints.length && !deathsPoints.length) {
    svg
      .append("text")
      .attr("x", 210)
      .attr("y", 105)
      .attr("text-anchor", "middle")
      .attr("fill", "#5b7271")
      .text("No EM-DAT disaster timeline data.");
    ui.disasterMeta.textContent = "EM-DAT has no yearly events/deaths data for this country.";
    return;
  }

  const width = 420;
  const height = 210;
  const margin = { top: 18, right: 56, bottom: 28, left: 56 };

  const yearSet = new Set([
    ...eventsPoints.map((row) => row.year),
    ...deathsPoints.map((row) => row.year)
  ]);
  const years = [...yearSet].sort((a, b) => a - b);
  const eventsByYear = new Map(eventsPoints.map((row) => [row.year, row.value]));
  const deathsByYear = new Map(deathsPoints.map((row) => [row.year, row.value]));
  const rows = years.map((year) => ({
    year,
    events: Number(eventsByYear.get(year) ?? 0),
    deaths: Number(deathsByYear.get(year) ?? 0)
  }));

  const xScale = d3.scaleLinear().domain(d3.extent(years)).range([margin.left, width - margin.right]);
  const maxEvents = Math.max(1, d3.max(rows, (row) => row.events) || 1);
  const maxDeaths = Math.max(1, d3.max(rows, (row) => row.deaths) || 1);
  const yLeft = d3.scaleLinear().domain([0, maxEvents * 1.1]).nice().range([height - margin.bottom, margin.top]);
  const yRight = d3.scaleLinear().domain([0, maxDeaths * 1.1]).nice().range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat((v) => String(Math.round(v))))
    .call((g) => g.selectAll("text").attr("font-size", 10));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yLeft).ticks(5).tickFormat((v) => fmtInteger.format(v)))
    .call((g) => g.selectAll("text").attr("font-size", 10));

  svg
    .append("g")
    .attr("transform", `translate(${width - margin.right}, 0)`)
    .call(d3.axisRight(yRight).ticks(5).tickFormat((v) => fmtCompactNumber.format(v)))
    .call((g) => g.selectAll("text").attr("font-size", 10));

  const lineEvents = d3.line().x((d) => xScale(d.year)).y((d) => yLeft(d.events)).curve(d3.curveMonotoneX);
  const lineDeaths = d3.line().x((d) => xScale(d.year)).y((d) => yRight(d.deaths)).curve(d3.curveMonotoneX);

  svg
    .append("path")
    .datum(rows)
    .attr("fill", "none")
    .attr("stroke", "#0c8f72")
    .attr("stroke-width", 2.1)
    .attr("d", lineEvents);

  svg
    .append("path")
    .datum(rows)
    .attr("fill", "none")
    .attr("stroke", "#b63a3a")
    .attr("stroke-width", 2.1)
    .attr("stroke-dasharray", "5 4")
    .attr("d", lineDeaths);

  svg
    .append("text")
    .attr("x", margin.left + 2)
    .attr("y", margin.top + 2)
    .attr("fill", "#0c8f72")
    .attr("font-size", 10)
    .text("Events (left axis)");

  svg
    .append("text")
    .attr("x", margin.left + 96)
    .attr("y", margin.top + 2)
    .attr("fill", "#b63a3a")
    .attr("font-size", 10)
    .text("Deaths (right axis)");

  const startYear = years[0];
  const endYear = years[years.length - 1];
  ui.disasterMeta.textContent = `EM-DAT timeline: ${rows.length} years (${startYear}-${endYear}).`;
}

function getHazardReferenceYear(country) {
  const years = [
    country?.indicators?.emdatEvents?.latest?.year,
    country?.indicators?.emdatDeaths?.latest?.year,
    country?.indicators?.emdatAffected?.latest?.year,
    country?.indicators?.ndgainVulnerability?.latest?.year
  ].filter((year) => Number.isFinite(year));
  if (!years.length) return null;
  return Math.max(...years);
}

function computeHazardExposure(country) {
  if (!country) {
    return {
      score: null,
      level: "Unknown",
      referenceYear: null,
      components: {
        events: null,
        deaths: null,
        affected: null,
        vulnerability: null
      }
    };
  }

  const events = getLatestMetricValue(country, "emdatEvents");
  const deaths = getLatestMetricValue(country, "emdatDeaths");
  const affected = resolveIndicatorLatest(country.indicators.emdatAffected);
  const vulnerability = getLatestMetricValue(country, "ndgainVulnerability");

  const weightedParts = [];
  if (Number.isFinite(events)) {
    weightedParts.push({ weight: 0.24, score: clampNumber((events / 6) * 100, 0, 100, 50) });
  }
  if (Number.isFinite(deaths)) {
    weightedParts.push({ weight: 0.24, score: clampNumber((Math.log10(deaths + 1) / 3.4) * 100, 0, 100, 50) });
  }
  if (Number.isFinite(affected)) {
    weightedParts.push({ weight: 0.16, score: clampNumber((Math.log10(affected + 1) / 6.4) * 100, 0, 100, 50) });
  }
  if (Number.isFinite(vulnerability)) {
    weightedParts.push({ weight: 0.36, score: clampNumber(vulnerability * 100, 0, 100, 50) });
  }

  if (!weightedParts.length) {
    return {
      score: null,
      level: "Unknown",
      referenceYear: getHazardReferenceYear(country),
      components: {
        events,
        deaths,
        affected,
        vulnerability
      }
    };
  }

  const weightSum = weightedParts.reduce((sum, part) => sum + part.weight, 0);
  const score = weightedParts.reduce((sum, part) => sum + part.score * part.weight, 0) / weightSum;

  const level =
    score >= 72 ? "Very high" :
      score >= 58 ? "High" :
        score >= 42 ? "Moderate" :
          score >= 28 ? "Low" : "Very low";

  return {
    score: clampNumber(score, 0, 100, 50),
    level,
    referenceYear: getHazardReferenceYear(country),
    components: {
      events,
      deaths,
      affected,
      vulnerability
    }
  };
}

function renderHazardLens(iso3) {
  if (!ui.hazardLensBody || !ui.hazardLensMeta) return;

  const country = getCountryByIso3(iso3);
  if (!country) {
    ui.hazardLensBody.innerHTML = '<p class="insight-empty">Select a country to view hazard exposure.</p>';
    ui.hazardLensMeta.textContent = "";
    return;
  }

  const hazard = computeHazardExposure(country);
  const scoreText = Number.isFinite(hazard.score) ? `${hazard.score.toFixed(1)} / 100` : "N/A";

  const cards = [
    {
      title: "Composite hazard exposure",
      value: scoreText,
      detail: `Risk level: ${hazard.level}${hazard.referenceYear ? ` (latest inputs up to ${hazard.referenceYear})` : ""}`,
      pct: clampNumber(hazard.score, 0, 100, 0)
    },
    {
      title: "Disaster events",
      value: formatValue(hazard.components.events, "integer"),
      detail: "Latest yearly count from EM-DAT profile.",
      pct: Number.isFinite(hazard.components.events) ? clampNumber((hazard.components.events / 8) * 100, 0, 100, 0) : 0
    },
    {
      title: "Disaster deaths",
      value: formatValue(hazard.components.deaths, "integer"),
      detail: "Latest yearly deaths from EM-DAT profile.",
      pct: Number.isFinite(hazard.components.deaths)
        ? clampNumber((Math.log10(hazard.components.deaths + 1) / 3.4) * 100, 0, 100, 0)
        : 0
    },
    {
      title: "Climate vulnerability",
      value: formatValue(hazard.components.vulnerability, "score"),
      detail: "ND-GAIN vulnerability score (higher means more vulnerable).",
      pct: Number.isFinite(hazard.components.vulnerability) ? clampNumber(hazard.components.vulnerability * 100, 0, 100, 0) : 0
    }
  ];

  ui.hazardLensBody.innerHTML = cards.map(renderInsightCard).join("");
  ui.hazardLensMeta.textContent =
    "Hazard lens uses EM-DAT yearly events/deaths/affected plus ND-GAIN vulnerability to build a comparable exposure score (higher score = higher risk).";
}

function computeFamilySafetyLens(country) {
  const crime = getLatestMetricValue(country, "crimeRate");
  const unemployment = getLatestMetricValue(country, "unemployment");
  const inflation = getLatestMetricValue(country, "inflation");
  const lifeExp = getLatestMetricValue(country, "whoLifeExpectancy") ?? getLatestMetricValue(country, "lifeExpectancy");
  const readiness = getLatestMetricValue(country, "ndgainReadiness");
  const hazard = computeHazardExposure(country).score;

  const communitySafety = Number.isFinite(crime) ? clampNumber(100 - crime * 3.3, 5, 98, 55) : 55;
  const disasterSafety = Number.isFinite(hazard) ? clampNumber(100 - hazard, 3, 98, 55) : 55;
  const healthSafety = Number.isFinite(lifeExp) ? clampNumber(((lifeExp - 50) / 35) * 100, 5, 99, 55) : 55;
  const economySafety = [
    Number.isFinite(unemployment) ? clampNumber(100 - unemployment * 4.8, 0, 100, 55) : 55,
    Number.isFinite(inflation) ? clampNumber(100 - Math.abs(inflation - 3) * 6, 0, 100, 55) : 55
  ].reduce((sum, value) => sum + value, 0) / 2;
  const childReadiness = Number.isFinite(readiness) ? clampNumber(readiness * 100, 0, 100, 55) : 55;

  const overall =
    communitySafety * 0.28 +
    disasterSafety * 0.22 +
    healthSafety * 0.2 +
    economySafety * 0.17 +
    childReadiness * 0.13;

  return {
    overall,
    communitySafety,
    disasterSafety,
    healthSafety,
    economySafety,
    childReadiness
  };
}

function renderFamilySafetyLens(iso3) {
  if (!ui.familySafetyBody || !ui.familySafetyMeta) return;
  const country = getCountryByIso3(iso3);
  if (!country) {
    ui.familySafetyBody.innerHTML = '<p class="insight-empty">Select a country to view family safety lens.</p>';
    ui.familySafetyMeta.textContent = "";
    return;
  }

  const lens = computeFamilySafetyLens(country);
  const cards = [
    {
      title: "Family safety score",
      value: `${lens.overall.toFixed(1)} / 100`,
      detail: lens.overall >= 72 ? "Stronger family safety profile." : lens.overall >= 55 ? "Mixed profile; verify city-level conditions." : "Elevated caution suggested.",
      pct: lens.overall
    },
    {
      title: "Community safety",
      value: `${lens.communitySafety.toFixed(1)} / 100`,
      detail: "Proxy from UN homicide trend (SDG 16.1.1).",
      pct: lens.communitySafety
    },
    {
      title: "Disaster safety",
      value: `${lens.disasterSafety.toFixed(1)} / 100`,
      detail: "Inverse of hazard exposure score.",
      pct: lens.disasterSafety
    },
    {
      title: "Health environment",
      value: `${lens.healthSafety.toFixed(1)} / 100`,
      detail: "Proxy from WHO/WB life expectancy.",
      pct: lens.healthSafety
    },
    {
      title: "Economic stability",
      value: `${lens.economySafety.toFixed(1)} / 100`,
      detail: "Blend of inflation and unemployment stability.",
      pct: lens.economySafety
    },
    {
      title: "Child readiness",
      value: `${lens.childReadiness.toFixed(1)} / 100`,
      detail: "ND-GAIN readiness proxy for systems capacity.",
      pct: lens.childReadiness
    }
  ];

  ui.familySafetyBody.innerHTML = cards.map(renderInsightCard).join("");
  ui.familySafetyMeta.textContent =
    "Family Safety Lens is an evidence-based composite using open UN/WHO/WB/ND-GAIN/EM-DAT data; use city-specific checks before final decisions.";
}

function getJobProfileConfig(key = state.jobProfession) {
  return JOB_PROFILES.find((profile) => profile.key === key) ?? JOB_PROFILES[0];
}

function buildJobProxyScores(country) {
  const unemployment = getLatestMetricValue(country, "unemployment");
  const gdpPerCapita = getLatestMetricValue(country, "gdpPerCapita");
  const readiness = getLatestMetricValue(country, "ndgainReadiness");
  const inflation = getLatestMetricValue(country, "inflation");
  const population = getLatestMetricValue(country, "population");
  const tourism = getLatestMetricValue(country, "tourismArrivals");
  const lifeExp = getLatestMetricValue(country, "whoLifeExpectancy") ?? getLatestMetricValue(country, "lifeExpectancy");
  const defenseSpend = getLatestMetricValue(country, "milExpenditure");

  return {
    unemployment: Number.isFinite(unemployment) ? clampNumber(100 - unemployment * 4.8, 0, 100, 55) : 55,
    gdpPerCapita: scaleLogScore(gdpPerCapita, 1200, 95000, 55),
    readiness: Number.isFinite(readiness) ? clampNumber(readiness * 100, 0, 100, 55) : 55,
    inflationStability: Number.isFinite(inflation) ? clampNumber(100 - Math.abs(inflation - 3) * 6, 0, 100, 55) : 55,
    marketSize: scaleLogScore(population, 800000, 1500000000, 55),
    tourism: scaleLogScore(tourism, 120000, 90000000, 55),
    lifeExpectancy: Number.isFinite(lifeExp) ? clampNumber(((lifeExp - 50) / 35) * 100, 0, 100, 55) : 55,
    defenseSpend: scaleLogScore(defenseSpend, 100000000, 900000000000, 55)
  };
}

function computeJobMarketFit(country, profileKey = state.jobProfession) {
  const profile = getJobProfileConfig(profileKey);
  const proxies = buildJobProxyScores(country);
  let overall = 0;

  for (const [proxyKey, weight] of Object.entries(profile.weights)) {
    const value = Number(proxies[proxyKey]);
    overall += (Number.isFinite(value) ? value : 55) * weight;
  }

  const rankedDrivers = Object.entries(profile.weights)
    .map(([proxyKey, weight]) => ({
      proxyKey,
      weight,
      value: Number(proxies[proxyKey])
    }))
    .sort((a, b) => b.weight - a.weight);

  return {
    profile,
    overall: clampNumber(overall, 0, 100, 55),
    proxies,
    topDrivers: rankedDrivers.slice(0, 3)
  };
}

function renderJobMarketFit(iso3) {
  if (!ui.jobFitBody || !ui.jobFitMeta) return;
  const country = getCountryByIso3(iso3);
  if (!country) {
    ui.jobFitBody.innerHTML = '<p class="insight-empty">Select a country to evaluate job fit.</p>';
    ui.jobFitMeta.textContent = "";
    return;
  }

  const fit = computeJobMarketFit(country, state.jobProfession);
  const cards = [
    {
      title: "Profession fit score",
      value: `${fit.overall.toFixed(1)} / 100`,
      detail: fit.overall >= 72 ? "High-fit market for this profession." : fit.overall >= 55 ? "Moderate fit; validate city/salary specifics." : "Lower-fit market for this profession.",
      pct: fit.overall
    },
    ...fit.topDrivers.map((driver) => ({
      title: jobProxyLabel(driver.proxyKey),
      value: `${driver.value.toFixed(1)} / 100`,
      detail: `Weight in model: ${(driver.weight * 100).toFixed(0)}%`,
      pct: driver.value
    }))
  ];

  ui.jobFitBody.innerHTML = cards.map(renderInsightCard).join("");
  ui.jobFitMeta.textContent =
    `${fit.profile.label}: model uses open macro proxies (unemployment, income level, stability, market size, and sector-linked indicators).`;
}

function jobProxyLabel(proxyKey) {
  switch (proxyKey) {
    case "unemployment": return "Labor market tightness";
    case "gdpPerCapita": return "Income potential proxy";
    case "readiness": return "Institutional readiness";
    case "inflationStability": return "Price stability";
    case "marketSize": return "Market size";
    case "tourism": return "Tourism demand";
    case "lifeExpectancy": return "Health-system maturity";
    case "defenseSpend": return "Defense spending proxy";
    default: return proxyKey;
  }
}

function getMobilityBlocForPair(originIso3, destinationIso3) {
  if (!originIso3 || !destinationIso3) return null;
  for (const bloc of MOBILITY_BLOCS) {
    if (bloc.members.has(originIso3) && bloc.members.has(destinationIso3)) {
      return bloc;
    }
  }
  return null;
}

function computeVisaResidencyAssessment(destination, originIso3, goal) {
  if (!destination) return null;
  const origin = getCountryByIso3(originIso3);
  const sameCountry = origin?.iso3 === destination.iso3;
  const bloc = getMobilityBlocForPair(origin?.iso3, destination.iso3);
  const sameRegion = origin && origin.region === destination.region;
  const sameSubregion = origin && origin.subregion === destination.subregion && origin.subregion !== "N/A";

  let baselineEase = 36;
  let mobilityNote = "General third-country national path.";
  if (sameCountry) {
    baselineEase = 98;
    mobilityNote = "Domestic move: no visa barrier.";
  } else if (bloc) {
    baselineEase = 82;
    mobilityNote = `${bloc.name}: ${bloc.description}`;
  } else if (sameSubregion) {
    baselineEase = 61;
    mobilityNote = "Same subregion often has easier short-stay pathways.";
  } else if (sameRegion) {
    baselineEase = 51;
    mobilityNote = "Same region may have moderately easier entry pathways.";
  }

  const familyLens = computeFamilySafetyLens(destination).overall;
  const jobFit = computeJobMarketFit(destination, state.jobProfession).overall;
  const hazardInverse = clampNumber(100 - computeHazardExposure(destination).score, 0, 100, 50);
  const inflation = getLatestMetricValue(destination, "inflation");
  const inflationStability = Number.isFinite(inflation) ? clampNumber(100 - Math.abs(inflation - 3) * 6, 0, 100, 55) : 55;
  const readiness = getLatestMetricValue(destination, "ndgainReadiness");
  const readinessScore = Number.isFinite(readiness) ? clampNumber(readiness * 100, 0, 100, 55) : 55;

  const goalFitMap = {
    work: jobFit * 0.52 + readinessScore * 0.18 + inflationStability * 0.15 + familyLens * 0.15,
    study: readinessScore * 0.4 + familyLens * 0.35 + inflationStability * 0.25,
    family: familyLens * 0.52 + inflationStability * 0.23 + hazardInverse * 0.25,
    retire: familyLens * 0.38 + hazardInverse * 0.3 + inflationStability * 0.17 + readinessScore * 0.15,
    business: readinessScore * 0.38 + inflationStability * 0.24 + jobFit * 0.22 + familyLens * 0.16
  };
  const goalFit = clampNumber(goalFitMap[goal] ?? goalFitMap.work, 0, 100, 55);

  const pathways = [
    {
      title: "Employment-sponsored route",
      ease: clampNumber(baselineEase * 0.52 + goalFit * 0.48 + (goal === "work" ? 8 : -2), 0, 100, 50),
      detail: "Usually needs a job offer and employer sponsorship."
    },
    {
      title: "Study-to-residency route",
      ease: clampNumber(baselineEase * 0.5 + goalFit * 0.5 + (goal === "study" ? 10 : 0), 0, 100, 50),
      detail: "Often starts with student permit, then work transition."
    },
    {
      title: "Family reunification route",
      ease: clampNumber(baselineEase * 0.55 + goalFit * 0.45 + (goal === "family" ? 10 : 0), 0, 100, 50),
      detail: "Requires eligible family ties and documentation."
    },
    {
      title: "Retirement / independent means route",
      ease: clampNumber(baselineEase * 0.46 + goalFit * 0.54 + (goal === "retire" ? 9 : -3), 0, 100, 50),
      detail: "Usually needs recurring income proof and health insurance."
    },
    {
      title: "Investment / business route",
      ease: clampNumber(baselineEase * 0.45 + goalFit * 0.55 + (goal === "business" ? 11 : 0), 0, 100, 50),
      detail: "Usually capital requirements and business compliance checks."
    }
  ].sort((a, b) => b.ease - a.ease);

  return {
    baselineEase,
    goalFit,
    mobilityNote,
    pathways
  };
}

function renderVisaPathFinder(iso3) {
  if (!ui.visaPathBody || !ui.visaPathMeta) return;
  const destination = getCountryByIso3(iso3);
  if (!destination) {
    ui.visaPathBody.innerHTML = '<p class="insight-empty">Select a country to evaluate pathways.</p>';
    ui.visaPathMeta.textContent = "";
    return;
  }

  const originIso3 = ui.visaOriginSelect?.value || state.visaOriginIso3;
  state.visaOriginIso3 = originIso3;
  state.visaGoal = ui.visaGoalSelect?.value || state.visaGoal;
  const origin = getCountryByIso3(originIso3);

  const assessment = computeVisaResidencyAssessment(destination, originIso3, state.visaGoal);
  if (!assessment) {
    ui.visaPathBody.innerHTML = '<p class="insight-empty">Visa pathway data unavailable for this selection.</p>';
    return;
  }

  const cards = [
    renderInsightCard({
      title: "Mobility baseline",
      value: `${assessment.baselineEase.toFixed(1)} / 100`,
      detail: `${origin ? origin.name : "Origin"} -> ${destination.name}. ${assessment.mobilityNote}`,
      pct: assessment.baselineEase
    }),
    renderInsightCard({
      title: `Goal fit (${state.visaGoal})`,
      value: `${assessment.goalFit.toFixed(1)} / 100`,
      detail: "Fit uses destination labor, safety, climate-risk, and stability indicators.",
      pct: assessment.goalFit
    }),
    ...assessment.pathways.slice(0, 3).map((route) =>
      renderInsightCard({
        title: route.title,
        value: `${route.ease.toFixed(1)} / 100`,
        detail: route.detail,
        pct: route.ease
      })
    )
  ];

  ui.visaPathBody.innerHTML = cards.join("");
  ui.visaPathMeta.textContent =
    "No single free global visa policy API exists. This module is a pre-screen using regional free-movement blocs plus open destination risk/economic indicators. Always verify official immigration rules.";
}

function computeBestAlternativeCandidates(baseCountry) {
  const neutralRelocationParams = { ...state.relocation, incomeMonthly: null };
  const baseRelocation = computeRelocationEstimate(baseCountry, neutralRelocationParams);
  const baseFamily = computeFamilySafetyLens(baseCountry).overall;
  const baseHazard = computeHazardExposure(baseCountry).score;
  const baseJob = computeJobMarketFit(baseCountry, state.jobProfession).overall;

  const candidates = [...state.countriesByIso3.values()]
    .filter((country) => country.iso3 !== baseCountry.iso3)
    .filter((country) => state.alternativesScope === "global" || country.region === baseCountry.region);

  const rows = candidates.map((country) => {
    const relocation = computeRelocationEstimate(country, neutralRelocationParams);
    const family = computeFamilySafetyLens(country).overall;
    const hazard = computeHazardExposure(country).score;
    const job = computeJobMarketFit(country, state.jobProfession).overall;

    const similarity = computeCountrySimilarity(baseCountry, country);
    const improvement = computeAlternativeImprovement({
      baseRelocation,
      baseFamily,
      baseHazard: Number.isFinite(baseHazard) ? baseHazard : 50,
      baseJob,
      relocation,
      family,
      hazard: Number.isFinite(hazard) ? hazard : 50,
      job
    }, state.alternativesFocus);

    const improvementScore = clampNumber(50 + improvement, 0, 100, 50);
    const score = similarity * 0.42 + improvementScore * 0.58;

    return {
      iso3: country.iso3,
      name: country.name,
      region: country.region,
      relocation,
      family,
      hazard: Number.isFinite(hazard) ? hazard : 50,
      job,
      similarity,
      improvement,
      score
    };
  });

  return rows.sort((a, b) => b.score - a.score).slice(0, 6);
}

function computeCountrySimilarity(a, b) {
  const pairs = [
    [getLatestMetricValue(a, "gdpPerCapita"), getLatestMetricValue(b, "gdpPerCapita")],
    [getLatestMetricValue(a, "unemployment"), getLatestMetricValue(b, "unemployment")],
    [getLatestMetricValue(a, "inflation"), getLatestMetricValue(b, "inflation")],
    [getLatestMetricValue(a, "crimeRate"), getLatestMetricValue(b, "crimeRate")]
  ];

  let totalDiff = 0;
  let used = 0;
  for (const [av, bv] of pairs) {
    if (!Number.isFinite(av) || !Number.isFinite(bv)) continue;
    const denom = Math.max(Math.abs(av), Math.abs(bv), 1);
    totalDiff += Math.min(1, Math.abs(av - bv) / denom);
    used += 1;
  }
  if (!used) return 50;
  return clampNumber((1 - totalDiff / used) * 100, 0, 100, 50);
}

function computeRiskPressureScore(country) {
  const family = computeFamilySafetyLens(country).overall;
  const hazard = computeHazardExposure(country).score;
  const stability = computeMacroStabilityScore(country);
  const unemployment = getLatestMetricValue(country, "unemployment");
  const unemploymentPressure = Number.isFinite(unemployment) ? clampNumber(unemployment * 6.5, 0, 100, 50) : 50;

  const familyPressure = Number.isFinite(family) ? 100 - family : 50;
  const hazardPressure = Number.isFinite(hazard) ? hazard : 50;
  const stabilityPressure = Number.isFinite(stability) ? 100 - stability : 50;

  return clampNumber(
    familyPressure * 0.38 + hazardPressure * 0.28 + stabilityPressure * 0.22 + unemploymentPressure * 0.12,
    0,
    100,
    50
  );
}

function computeAlternativeImprovement(context, focus) {
  const costDiffPct = context.baseRelocation.requiredMonthly > 0
    ? ((context.baseRelocation.requiredMonthly - context.relocation.requiredMonthly) / context.baseRelocation.requiredMonthly) * 100
    : 0;
  const safetyDiff = context.family - context.baseFamily;
  const jobsDiff = context.job - context.baseJob;
  const resilienceDiff = (100 - context.hazard) - (100 - context.baseHazard);
  const relocationDiff = context.relocation.relocationScore - context.baseRelocation.relocationScore;

  switch (focus) {
    case "affordability":
      return costDiffPct * 1.1 + relocationDiff * 0.35;
    case "safety":
      return safetyDiff * 0.9 + resilienceDiff * 0.35 + costDiffPct * 0.2;
    case "jobs":
      return jobsDiff * 0.95 + relocationDiff * 0.3;
    case "resilience":
      return resilienceDiff * 1.0 + safetyDiff * 0.25;
    default:
      return relocationDiff * 0.55 + safetyDiff * 0.25 + jobsDiff * 0.2;
  }
}

function renderBestAlternatives(iso3) {
  if (!ui.alternativesBody || !ui.alternativesMeta) return;
  const baseCountry = getCountryByIso3(iso3);
  if (!baseCountry) {
    ui.alternativesBody.innerHTML = '<p class="insight-empty">Select a country to discover alternatives.</p>';
    ui.alternativesMeta.textContent = "";
    return;
  }

  const rows = computeBestAlternativeCandidates(baseCountry);
  if (!rows.length) {
    ui.alternativesBody.innerHTML = '<p class="insight-empty">No alternatives available for current filters.</p>';
    ui.alternativesMeta.textContent = "";
    return;
  }

  ui.alternativesBody.innerHTML = rows.map((row, idx) => {
    const chipClass = row.improvement >= 10 ? "high" : row.improvement >= 3 ? "medium" : "";
    const summary = `Relocation ${row.relocation.relocationScore.toFixed(1)} | Family safety ${row.family.toFixed(1)} | Job fit ${row.job.toFixed(1)} | Hazard ${row.hazard.toFixed(1)}`;
    return renderInsightCard({
      title: `#${idx + 1} ${row.name} (${row.iso3})`,
      value: `${row.score.toFixed(1)} / 100`,
      detail: `${escapeHtml(summary)}<br><span class="alert-chip ${chipClass}">Improvement ${row.improvement >= 0 ? "+" : ""}${row.improvement.toFixed(1)}</span>`,
      pct: row.score,
      detailIsHtml: true
    });
  }).join("");

  ui.alternativesMeta.textContent =
    `Base country: ${baseCountry.name}. Focus: ${state.alternativesFocus}. Scope: ${state.alternativesScope === "global" ? "Global" : "Same region"}.`;
}

function computeChangeAlertsForCountry(country) {
  const alerts = [];
  for (const rule of CHANGE_ALERT_RULES) {
    const series = getMetricTimeSeries(country, rule.key);
    if (series.length < 2) continue;
    const prev = series[series.length - 2];
    const latest = series[series.length - 1];
    const delta = latest.value - prev.value;
    const pct = prev.value === 0 ? null : delta / Math.abs(prev.value);

    let triggered = false;
    let magnitude = 0;
    if (rule.mode === "delta") {
      triggered = delta >= rule.threshold;
      magnitude = rule.threshold === 0 ? delta : delta / rule.threshold;
    } else if (rule.mode === "pct") {
      triggered = Number.isFinite(pct) && pct >= rule.threshold;
      magnitude = Number.isFinite(pct) && rule.threshold !== 0 ? pct / rule.threshold : 0;
    } else if (rule.mode === "pct_drop") {
      triggered = Number.isFinite(pct) && pct <= rule.threshold;
      magnitude = Number.isFinite(pct) && rule.threshold !== 0 ? Math.abs(pct / rule.threshold) : 0;
    }

    if (!triggered) continue;

    const severity = magnitude >= 1.6 ? "high" : "medium";
    alerts.push({
      iso3: country.iso3,
      country: country.name,
      metricKey: rule.key,
      metricLabel: rule.label,
      type: rule.type,
      prevYear: prev.year,
      prevValue: prev.value,
      latestYear: latest.year,
      latestValue: latest.value,
      delta,
      pct,
      severity
    });
  }

  return alerts;
}

function renderCountryChangeAlerts(iso3) {
  if (!ui.changeAlertsBody || !ui.changeAlertsMeta) return;
  const selected = getCountryByIso3(iso3);
  if (!selected) {
    ui.changeAlertsBody.innerHTML = '<p class="insight-empty">Select a country to scan year-over-year changes.</p>';
    ui.changeAlertsMeta.textContent = "";
    return;
  }

  const targetIso3s = [selected.iso3, ...state.watchlistCountries]
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .slice(0, 10);
  const alerts = targetIso3s
    .map((code) => getCountryByIso3(code))
    .filter(Boolean)
    .flatMap((country) => computeChangeAlertsForCountry(country))
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));

  if (!alerts.length) {
    ui.changeAlertsBody.innerHTML = '<p class="insight-empty">No significant year-over-year alerts detected.</p>';
    ui.changeAlertsMeta.textContent = `Scanned ${targetIso3s.length} countr${targetIso3s.length === 1 ? "y" : "ies"} across inflation, jobs, crime, disasters, and GDP/capita changes.`;
    return;
  }

  ui.changeAlertsBody.innerHTML = alerts.slice(0, 12).map((alert) => {
    const chip = `<span class="alert-chip ${alert.severity === "high" ? "high" : "medium"}">${alert.severity === "high" ? "High" : "Medium"}</span>`;
    const changeText = formatChangeAlertDelta(alert);
    return renderInsightCard({
      title: `${alert.country}: ${alert.metricLabel}`,
      value: `${formatValue(alert.latestValue, alert.type)} (${alert.latestYear})`,
      detail: `${chip} from ${escapeHtml(formatValue(alert.prevValue, alert.type))} (${alert.prevYear}) -> ${escapeHtml(changeText)}`,
      pct: alert.severity === "high" ? 82 : 62,
      detailIsHtml: true
    });
  }).join("");

  ui.changeAlertsMeta.textContent =
    `Showing ${Math.min(alerts.length, 12)} alert${alerts.length === 1 ? "" : "s"} from selected country + watchlist.`;
}

function formatChangeAlertDelta(alert) {
  if (alert.metricKey === "gdpPerCapita" && Number.isFinite(alert.pct)) {
    const pct = alert.pct * 100;
    return `${pct.toFixed(1)}%`;
  }
  if (alert.metricKey === "crimeRate" && Number.isFinite(alert.pct)) {
    const pct = alert.pct * 100;
    return `${alert.delta >= 0 ? "+" : ""}${alert.delta.toFixed(2)} /100k (${pct.toFixed(1)}%)`;
  }
  return formatDelta(alert.delta, alert.type);
}

function renderInsightCard({ title, value, detail, pct = null, detailIsHtml = false }) {
  const hasBar = Number.isFinite(pct);
  const detailContent = detailIsHtml ? String(detail ?? "") : escapeHtml(String(detail ?? "")).replaceAll("\n", "<br>");
  return `
    <article class="insight-card">
      <div class="insight-card-head">
        <span class="insight-card-title">${escapeHtml(title)}</span>
        <span class="insight-card-value">${escapeHtml(value)}</span>
      </div>
      ${hasBar ? `<div class="insight-bar"><span style="width:${clampNumber(pct, 0, 100, 0).toFixed(1)}%"></span></div>` : ""}
      <div class="insight-card-meta">${detailContent}</div>
    </article>
  `;
}

function scaleLogScore(value, min, max, fallback = 55) {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= min) {
    return fallback;
  }
  const clamped = Math.max(min, Math.min(max, value));
  const score = (Math.log(clamped) - Math.log(min)) / (Math.log(max) - Math.log(min));
  return clampNumber(score * 100, 0, 100, fallback);
}

function formatAxisValue(value, type) {
  if (!Number.isFinite(value)) return "";
  switch (type) {
    case "money":
      return fmtCompactMoney.format(value);
    case "percent":
      return `${Number(value).toFixed(1)}%`;
    case "rate":
      return `${Number(value).toFixed(1)}`;
    case "index":
      return `${Number(value).toFixed(0)}`;
    case "integer":
      return fmtCompactNumber.format(value);
    default:
      return fmtCompactNumber.format(value);
  }
}

function renderWeatherBlock(iso3) {
  if (!ui.weatherBody || !ui.weatherMeta) return;
  const country = getCountryByIso3(iso3);
  if (!country) {
    ui.weatherBody.innerHTML = '<p class="weather-empty">Select a country to load current weather.</p>';
    ui.weatherMeta.textContent = "";
    return;
  }

  const latitude = Number(country.latlng?.[0]);
  const longitude = Number(country.latlng?.[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    ui.weatherBody.innerHTML = '<p class="weather-empty">No coordinates available for weather lookup.</p>';
    ui.weatherMeta.textContent = "Country coordinates are unavailable in profile data.";
    return;
  }

  const entry = state.weatherCache.get(iso3);
  const hasData = Boolean(entry?.data);
  const isFresh = hasData && Date.now() - entry.fetchedAt <= WEATHER_CACHE_TTL_MS;

  if (hasData) {
    ui.weatherBody.innerHTML = renderWeatherGridHtml(entry.data);
    const observedAt = formatWeatherObservedAt(entry.data);
    ui.weatherMeta.textContent = `${isFresh ? "Live" : "Cached"} weather for ${country.name} at ${observedAt}.`;

    // Refresh stale cache in background without blocking the UI.
    if (!isFresh && !state.weatherInFlight.has(iso3)) {
      void loadCountryWeather(iso3, true)
        .then(() => {
          if (state.selectedIso3 === iso3) renderWeatherBlock(iso3);
        })
        .catch((error) => {
          console.warn("Background weather refresh failed:", error);
        });
    }
    return;
  }

  if (entry?.error && Date.now() - entry.fetchedAt <= WEATHER_CACHE_TTL_MS) {
    ui.weatherBody.innerHTML = '<p class="weather-empty">Live weather unavailable right now.</p>';
    ui.weatherMeta.textContent = `Open-Meteo request failed: ${entry.error}`;
    return;
  }

  ui.weatherBody.innerHTML = '<p class="weather-loading">Loading live weather…</p>';
  ui.weatherMeta.textContent = `Fetching current weather for ${country.name}...`;

  void loadCountryWeather(iso3, false)
    .then(() => {
      if (state.selectedIso3 === iso3) renderWeatherBlock(iso3);
    })
    .catch((error) => {
      if (state.selectedIso3 !== iso3) return;
      ui.weatherBody.innerHTML = '<p class="weather-empty">Live weather unavailable right now.</p>';
      ui.weatherMeta.textContent = `Open-Meteo request failed: ${error.message}`;
    });
}

async function loadCountryWeather(iso3, force = false) {
  if (!iso3) throw new Error("Missing country for weather request.");
  const country = getCountryByIso3(iso3);
  if (!country) throw new Error("Country not found.");

  const latitude = Number(country.latlng?.[0]);
  const longitude = Number(country.latlng?.[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Country coordinates unavailable.");
  }

  const cached = state.weatherCache.get(iso3);
  if (
    !force &&
    cached?.data &&
    Date.now() - cached.fetchedAt <= WEATHER_CACHE_TTL_MS
  ) {
    return cached.data;
  }

  if (!force && state.weatherInFlight.has(iso3)) {
    return state.weatherInFlight.get(iso3);
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day",
    timezone: "auto"
  });
  const url = `${OPEN_METEO_FORECAST_URL}?${params.toString()}`;

  const request = fetchJson(url, 15000)
    .then((payload) => {
      if (!payload?.current || !payload?.current_units) {
        throw new Error("Malformed weather response.");
      }
      state.weatherCache.set(iso3, {
        data: payload,
        fetchedAt: Date.now(),
        error: null
      });
      return payload;
    })
    .catch((error) => {
      state.weatherCache.set(iso3, {
        data: null,
        fetchedAt: Date.now(),
        error: error.message
      });
      throw error;
    })
    .finally(() => {
      state.weatherInFlight.delete(iso3);
    });

  state.weatherInFlight.set(iso3, request);
  return request;
}

function renderWeatherGridHtml(weatherPayload) {
  const current = weatherPayload?.current ?? {};
  const units = weatherPayload?.current_units ?? {};

  const weatherCode = Number(current.weather_code);
  const weatherLabel = getWeatherCodeLabel(weatherCode, current.is_day);
  const direction = windDirectionToCompass(current.wind_direction_10m);
  const observedAt = formatWeatherObservedAt(weatherPayload);

  const items = [
    ["Condition", weatherLabel],
    ["Temperature", formatWeatherMetric(current.temperature_2m, units.temperature_2m, 1)],
    ["Feels Like", formatWeatherMetric(current.apparent_temperature, units.apparent_temperature, 1)],
    ["Humidity", formatWeatherMetric(current.relative_humidity_2m, units.relative_humidity_2m, 0)],
    ["Precipitation", formatWeatherMetric(current.precipitation, units.precipitation, 1)],
    ["Wind Speed", formatWeatherMetric(current.wind_speed_10m, units.wind_speed_10m, 1)],
    ["Wind Direction", direction],
    ["Observed At", observedAt]
  ];

  return `
    <div class="weather-grid">
      ${items.map(([label, value]) => `
        <div class="weather-cell">
          <div class="weather-k">${escapeHtml(label)}</div>
          <div class="weather-v">${escapeHtml(value)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function formatWeatherObservedAt(weatherPayload) {
  const ts = typeof weatherPayload?.current?.time === "string" ? weatherPayload.current.time : "";
  const timezone = typeof weatherPayload?.timezone_abbreviation === "string" ? weatherPayload.timezone_abbreviation : "";
  if (!ts) return "N/A";
  const pretty = ts.replace("T", " ");
  return timezone ? `${pretty} ${timezone}` : pretty;
}

function formatWeatherMetric(value, unit, decimals = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "N/A";
  const shown = numeric.toFixed(decimals);
  return unit ? `${shown} ${unit}` : shown;
}

function getWeatherCodeLabel(code, isDay) {
  const normalized = Number(code);
  let label = WEATHER_CODE_LABELS[normalized] ?? "Unknown";
  if ((normalized === 0 || normalized === 1 || normalized === 2) && isDay != null) {
    label += Number(isDay) === 1 ? " (day)" : " (night)";
  }
  return label;
}

function windDirectionToCompass(degrees) {
  const deg = Number(degrees);
  if (!Number.isFinite(deg)) return "N/A";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return `${dirs[idx]} (${deg.toFixed(0)}°)`;
}

function exportDatasetAsJson() {
  const data = buildExportRows();
  downloadFile(
    `country-intelligence-${timestampForFile()}.json`,
    JSON.stringify(data, null, 2),
    "application/json"
  );
}

function exportDatasetAsCsv() {
  const rows = buildExportRows();
  const columns = [
    "iso3",
    "name",
    "officialName",
    "capital",
    "region",
    "subregion",
    "population",
    "populationYear",
    "crimeRatePer100k",
    "crimeRateYear",
    "inflation",
    "inflationYear",
    "debtPctGdp",
    "debtPctGdpYear",
    "currentAccountPctGdp",
    "currentAccountPctGdpYear",
    "poverty215",
    "poverty215Year",
    "gini",
    "giniYear",
    "tourismArrivals",
    "tourismArrivalsYear",
    "tourismReceipts",
    "tourismReceiptsYear",
    "whoLifeExpectancy",
    "whoLifeExpectancyYear",
    "ndgainVulnerability",
    "ndgainVulnerabilityYear",
    "ndgainReadiness",
    "ndgainReadinessYear",
    "emdatEvents",
    "emdatEventsYear",
    "emdatDeaths",
    "emdatDeathsYear",
    "hazardExposure",
    "hazardExposureYear",
    "familySafetyScore",
    "airlinesCount",
    "airportsCount",
    "areaKm2",
    "gdp",
    "gdpYear",
    "gdpPerCapita",
    "gdpPerCapitaYear",
    "netWorthProxy",
    "netWorthYear",
    "lifeExpectancy",
    "lifeExpectancyYear",
    "unemployment",
    "unemploymentYear",
    "milExpenditure",
    "milExpenditureYear",
    "milExpPctGdp",
    "milExpPctGdpYear",
    "armedForces",
    "armedForcesYear",
    "armedForcesPctLabor",
    "armedForcesPctLaborYear",
    "languages",
    "currencies",
    "timezones",
    "continents",
    "unMember",
    "independent",
    "landlocked"
  ];

  const csv = [
    columns.join(","),
    ...rows.map((row) =>
      columns
        .map((column) => csvEscape(row[column]))
        .join(",")
    )
  ].join("\n");

  downloadFile(`country-intelligence-${timestampForFile()}.csv`, csv, "text/csv;charset=utf-8");
}

function buildExportRows() {
  return [...state.countriesByIso3.values()].map((country) => ({
    iso3: country.iso3,
    name: country.name,
    officialName: country.officialName,
    capital: country.capital,
    region: country.region,
    subregion: country.subregion,
    population: getMetricValue(country, "population"),
    populationYear: getMetricYear(country, "population"),
    crimeRatePer100k: getMetricValue(country, "crimeRate"),
    crimeRateYear: getMetricYear(country, "crimeRate"),
    inflation: getMetricValue(country, "inflation"),
    inflationYear: getMetricYear(country, "inflation"),
    debtPctGdp: getMetricValue(country, "debtPctGdp"),
    debtPctGdpYear: getMetricYear(country, "debtPctGdp"),
    currentAccountPctGdp: getMetricValue(country, "currentAccountPctGdp"),
    currentAccountPctGdpYear: getMetricYear(country, "currentAccountPctGdp"),
    poverty215: getMetricValue(country, "poverty215"),
    poverty215Year: getMetricYear(country, "poverty215"),
    gini: getMetricValue(country, "gini"),
    giniYear: getMetricYear(country, "gini"),
    tourismArrivals: getMetricValue(country, "tourismArrivals"),
    tourismArrivalsYear: getMetricYear(country, "tourismArrivals"),
    tourismReceipts: getMetricValue(country, "tourismReceipts"),
    tourismReceiptsYear: getMetricYear(country, "tourismReceipts"),
    whoLifeExpectancy: getMetricValue(country, "whoLifeExpectancy"),
    whoLifeExpectancyYear: getMetricYear(country, "whoLifeExpectancy"),
    ndgainVulnerability: getMetricValue(country, "ndgainVulnerability"),
    ndgainVulnerabilityYear: getMetricYear(country, "ndgainVulnerability"),
    ndgainReadiness: getMetricValue(country, "ndgainReadiness"),
    ndgainReadinessYear: getMetricYear(country, "ndgainReadiness"),
    emdatEvents: getMetricValue(country, "emdatEvents"),
    emdatEventsYear: getMetricYear(country, "emdatEvents"),
    emdatDeaths: getMetricValue(country, "emdatDeaths"),
    emdatDeathsYear: getMetricYear(country, "emdatDeaths"),
    hazardExposure: getMetricValue(country, "hazardExposure"),
    hazardExposureYear: getMetricYear(country, "hazardExposure"),
    familySafetyScore: computeFamilySafetyLens(country).overall,
    airlinesCount: getMetricValue(country, "airlinesCount"),
    airportsCount: getMetricValue(country, "airportsCount"),
    areaKm2: country.area,
    gdp: getMetricValue(country, "gdp"),
    gdpYear: getMetricYear(country, "gdp"),
    gdpPerCapita: getMetricValue(country, "gdpPerCapita"),
    gdpPerCapitaYear: getMetricYear(country, "gdpPerCapita"),
    netWorthProxy: getMetricValue(country, "netWorth"),
    netWorthYear: getMetricYear(country, "netWorth"),
    lifeExpectancy: getMetricValue(country, "lifeExpectancy"),
    lifeExpectancyYear: getMetricYear(country, "lifeExpectancy"),
    unemployment: getMetricValue(country, "unemployment"),
    unemploymentYear: getMetricYear(country, "unemployment"),
    milExpenditure: getMetricValue(country, "milExpenditure"),
    milExpenditureYear: getMetricYear(country, "milExpenditure"),
    milExpPctGdp: getMetricValue(country, "milExpPctGdp"),
    milExpPctGdpYear: getMetricYear(country, "milExpPctGdp"),
    armedForces: getMetricValue(country, "armedForces"),
    armedForcesYear: getMetricYear(country, "armedForces"),
    armedForcesPctLabor: getMetricValue(country, "armedForcesPctLabor"),
    armedForcesPctLaborYear: getMetricYear(country, "armedForcesPctLabor"),
    languages: country.languages,
    currencies: country.currencies,
    timezones: country.timezones,
    continents: country.continents,
    unMember: boolLabel(country.unMember),
    independent: boolLabel(country.independent),
    landlocked: boolLabel(country.landlocked)
  }));
}

function downloadFile(filename, contents, mimeType) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function timestampForFile() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}-${h}${min}`;
}

function numberOrNull(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function clampNumber(value, min, max, fallback = min) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function clampInteger(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.trunc(Math.min(max, Math.max(min, numeric)));
}

function boolLabel(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "N/A";
}

function csvEscape(value) {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function debounce(fn, waitMs) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

/* ── News (RSS) ─────────────────────────────────────────── */

async function loadCountryNews(iso3, force = false, onProgress = () => {}) {
  if (!iso3) return;
  const cached = state.newsCache.get(iso3);
  if (!force && cached && Date.now() - cached.fetchedAt < NEWS_CACHE_TTL_MS) return;

  const country = getCountryByIso3(iso3);
  if (!country) return;

  let articles = [];

  // Strategy 1: Google News RSS via CORS proxy (country-specific search)
  onProgress(10, "Fetching Google News\u2026");
  try {
    const query = encodeURIComponent(country.name + " news");
    const googleRssUrl = `${GOOGLE_NEWS_RSS}?q=${query}&hl=en&gl=US&ceid=US:en`;
    const proxyUrl = `${NEWS_CORS_PROXY}${encodeURIComponent(googleRssUrl)}`;
    onProgress(25, "Fetching Google News\u2026");
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      onProgress(60, "Parsing articles\u2026");
      const xml = await response.text();
      articles = parseRssXml(xml).slice(0, NEWS_MAX_ARTICLES);
    }
  } catch (err) {
    console.warn("Google News RSS proxy failed:", err.message);
  }

  // Strategy 2: Fetch multiple feeds via rss2json, filter by country name
  if (!articles.length) {
    onProgress(30, "Trying BBC, CNN, Al Jazeera feeds\u2026");
    try {
      const countryLower = country.name.toLowerCase();
      let completed = 0;
      const feedPromises = NEWS_DIRECT_FEEDS.map(async (feed) => {
        try {
          const data = await fetchJson(`${NEWS_RSS2JSON}${encodeURIComponent(feed.url)}`);
          completed++;
          onProgress(30 + Math.round((completed / NEWS_DIRECT_FEEDS.length) * 50),
            `Loaded ${feed.name} (${completed}/${NEWS_DIRECT_FEEDS.length})\u2026`);
          if (data.status === "ok" && Array.isArray(data.items)) {
            return data.items.map((item) => ({
              ...normalizeRss2JsonItem(item),
              source: item.author || feed.name
            }));
          }
        } catch (e) {
          completed++;
          onProgress(30 + Math.round((completed / NEWS_DIRECT_FEEDS.length) * 50),
            `${feed.name} unavailable, continuing\u2026`);
          console.warn(`RSS feed ${feed.name} failed:`, e.message);
        }
        return [];
      });

      const allItems = (await Promise.all(feedPromises)).flat();
      onProgress(85, "Filtering for country\u2026");
      const filtered = allItems.filter((a) => {
        const text = (a.title + " " + a.description).toLowerCase();
        return text.includes(countryLower);
      });
      filtered.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
      articles = filtered.slice(0, NEWS_MAX_ARTICLES);
    } catch (err) {
      console.warn("Multi-feed fallback failed:", err.message);
    }
  }

  onProgress(100, "Done");
  state.newsCache.set(iso3, { articles, fetchedAt: Date.now() });
}

function renderNewsBlock(iso3) {
  const cached = state.newsCache.get(iso3);
  const articles = cached?.articles ?? [];

  if (!articles.length) {
    ui.newsList.innerHTML = '<p class="news-empty">No recent news found for this country.</p>';
    ui.newsMeta.textContent = "Powered by RSS feeds from BBC, CNN, Al Jazeera.";
    return;
  }

  ui.newsList.innerHTML = articles
    .map((a) => {
      const dateStr = a.pubDate ? formatNewsDate(a.pubDate) : "";
      const sourceStr = a.source ? escapeHtml(a.source) : "";
      const cleanTitle = a.source ? a.title.replace(` - ${a.source}`, "") : a.title;
      return `
        <a class="news-card" href="${escapeHtml(a.link)}" target="_blank" rel="noreferrer noopener">
          <span class="news-card-title">${escapeHtml(cleanTitle)}</span>
          <span class="news-card-meta">
            ${sourceStr ? `<span class="news-source">${sourceStr}</span>` : ""}
            ${dateStr ? `<span class="news-date">${escapeHtml(dateStr)}</span>` : ""}
          </span>
        </a>`;
    })
    .join("");

  ui.newsMeta.textContent = `Showing ${articles.length} article${articles.length === 1 ? "" : "s"} via RSS.`;
}

function normalizeRss2JsonItem(item) {
  return {
    title: item.title || "Untitled",
    link: item.link || "#",
    pubDate: item.pubDate || null,
    source: extractSourceFromTitle(item.title),
    description: stripHtml(item.description || "").slice(0, 160)
  };
}

function extractSourceFromTitle(title) {
  const dashIdx = title.lastIndexOf(" - ");
  if (dashIdx > 0) return title.slice(dashIdx + 3).trim();
  return "";
}

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function parseRssXml(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");
  const items = doc.querySelectorAll("item");
  return [...items].map((item) => ({
    title: item.querySelector("title")?.textContent || "Untitled",
    link: item.querySelector("link")?.textContent || "#",
    pubDate: item.querySelector("pubDate")?.textContent || null,
    source:
      item.querySelector("source")?.textContent ||
      extractSourceFromTitle(item.querySelector("title")?.textContent || ""),
    description: stripHtml(item.querySelector("description")?.textContent || "").slice(0, 160)
  }));
}

function formatNewsDate(dateString) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d;
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return "Just now";
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
