# omp-kimi-datasource

Kimi Code data-source plugin for [oh-my-pi](https://github.com/can1357/oh-my-pi), synced with upstream kimi-datasource **3.4.0**.

Query 25 external data sources — stock/finance, global markets, macroeconomics (World Bank, IMF, FRED, NBS), Chinese government open data catalogs, national & industry standards, international organizations (WHO, FAO, UNSD, ECB, Eurostat, UNICEF, OECD), SEC filings, Chinese enterprise registry, academic papers, legal data, and financial news (Xinhua Finance, Caixin) — through the Kimi Code gateway.

Upstream official implementation: https://github.com/MoonshotAI/kimi-code/tree/main/plugins/official/kimi-datasource

> 🌐 [中文文档](README.zh-CN.md)

## Supported Data Sources

| Domain | Data Source Name | Typical Use |
|---|---|---|
| A-share / HK / US stocks & financials | `stock_finance_data` | Real-time quotes, financials, shareholders |
| Yahoo Finance global markets | `yahoo_finance` | Analyst ratings, options chains, institutional holders (FX history ~2 years) |
| World Bank historical macro | `world_bank_open_data` | 50+ year historical GDP / population / inflation series |
| IMF international macro | `imf` | FX rates, CPI, GDP forecasts, balance of payments |
| Wind (A-shares / funds / bonds / macro) | `wind` | Intraday minute series, treasury yields, fund NAV |
| Gildata smart screening | `gildata` | Natural-language stock / fund / fund-manager screening |
| US SEC filings | `sec_edgar` | 10-K / 10-Q, S-1, Form 4, 13F, 8-K |
| S&P Capital IQ fundamentals | `sp_data` | Consensus estimates, valuation ratios, transcripts |
| Chinese government open data catalogs | `china_nda` | National Data Administration registry + provincial open data platform datasets |
| National Bureau of Statistics macro indicators | `china_nbs` | Official NBS macroeconomic time series (national / provincial / major cities) |
| Chinese standards | `china_standards` | GB national, HB industry, DB local, TT association standards text & status |
| WHO global health data | `who` | Global health indicators, infant mortality, life expectancy |
| FAO food & agriculture data | `fao` | Global crop production, agricultural commodity price indices |
| United Nations UNdata | `unsd` | UN member statistical yearbooks, international trade, population |
| European Central Bank statistics | `ecb` | Eurozone benchmark interest rates, money supply M1/M2/M3 |
| Eurostat European statistics | `eurostat` | EU member unemployment rates, Eurozone HICP inflation |
| UNICEF child indicators | `unicef` | Global child nutrition, education, vaccination rates |
| OECD comparative statistics | `oecd` | OECD member country GDP comparison, education spending, labor markets |
| FRED macroeconomic data | `fred` | St. Louis Fed macro series (long-horizon US CPI, Fed funds rate, unemployment) |
| Xinhua Finance news & announcements | `xhcj` | Xinhua Finance (CNFIC) 7x24 flashes, A-share company announcements, policies |
| Caixin database | `caixin` | Caixin database (600+ data APIs, discover via `caixin_api_search` first) |
| Chinese enterprise registry | `tianyancha` | Company shareholders, judicial risk, patents |
| arXiv preprints | `arxiv` | Paper search and download |
| Google Scholar academic search | `scholar` | Author papers, highly-cited literature |
| Chinese laws, regulations, and judicial cases | `yuandian_law` | Statutes and case law lookup |

These tools provide structured, batch, domain-specific data queries — they do not replace general web search or real-time news outside xhcj / caixin.

## Installation

### Marketplace (recommended)

```bash
omp plugin marketplace add dlivxpr/omp-kimi-datasource
omp plugin install omp-kimi-datasource@omp-kimi-datasource
```

For local testing before publishing:

```bash
omp plugin marketplace add .
omp plugin install --force omp-kimi-datasource@omp-kimi-datasource
```

### Local development / npm-link style

```bash
# Clone the repo
git clone https://github.com/dlivxpr/omp-kimi-datasource.git
cd omp-kimi-datasource

# Install into omp
omp plugin install .
```

This path uses `package.json#omp.extensions` directly (loads `src/extension.ts`), whereas marketplace installs load the custom-tool factory `tools/kimi-datasource.ts`. Do not enable both entry points at once: omp merges tools by name and the later registration wins, so both active would register the same tools twice.

> **Note:** This repository intentionally ships `.omp-plugin/marketplace.json` only. It does not ship `.claude-plugin` metadata because the runtime tools require omp auth/session APIs and Claude Code cannot execute them.

## Prerequisites

This plugin reuses the Kimi subscription already configured in omp — **no extra API key is required**.

Just make sure you are logged in to Kimi via omp:

```bash
omp login kimi-code
```

On gateway 401 responses the client automatically refreshes the credential and retries once.

## Usage

Once installed, the agent automatically uses this plugin's tools whenever external data queries are needed:

1. **`get_data_source_desc(name)`** — Query a data source's current API documentation.
2. **`call_data_source_tool(data_source_name, api_name, params)`** — Call a specific API.

The standard workflow is: first call `get_data_source_desc` to learn the available interfaces, then call `call_data_source_tool` to fetch data. For simple lookups, pick exactly one specialized source and stop once a result covers the user's question; only query a second source when the user explicitly asks for a cross-source comparison.

For details, see [`skills/omp-kimi-datasource/SKILL.md`](skills/omp-kimi-datasource/SKILL.md).

## Verification

After installation, confirm the plugin is enabled:

```bash
omp plugin list
```

When omp starts, the model should see both `get_data_source_desc` and `call_data_source_tool` tools.

## Directory Structure

```
.
├── package.json             # npm package info + omp manifest
├── tsconfig.json            # TypeScript config
├── .omp-plugin/
│   └── marketplace.json     # omp native marketplace catalog
├── src/
│   ├── extension.ts         # Extension entry: registers both tools
│   ├── tools.ts             # Shared tool definitions used by extension and marketplace
│   ├── auth.ts              # Reads Kimi token via omp auth storage
│   ├── client.ts            # Kimi Code gateway HTTP client (401 refresh-and-retry)
│   └── utils.ts             # Response parsing and file writing
├── tools/
│   └── kimi-datasource.ts   # Marketplace custom-tool factory
├── skills/
│   └── omp-kimi-datasource/
│       ├── SKILL.md         # Usage guide
│       └── watchlist.json   # User watchlist (editable)
├── tests/                   # bun:test suites for client/auth/utils/extension/factory
└── README.md
```

## Development

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Run tests
bun run test        # same as: bun test tests/*.test.ts
```

## License

MIT
