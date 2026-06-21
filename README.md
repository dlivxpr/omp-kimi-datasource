# omp-kimi-datasource

Kimi Code data-source plugin for [oh-my-pi](https://github.com/can1357/oh-my-pi).

Query external data such as stock/finance, global markets, macroeconomics, Chinese enterprise registry, academic papers, and legal data through the Kimi Code gateway.

Upstream official implementation: https://github.com/MoonshotAI/kimi-code/tree/main/plugins/official/kimi-datasource

> 🌐 [中文文档](README.zh-CN.md)

## Supported Data Sources

| Domain | Data Source Name |
|---|---|
| A-shares / HK / US stocks & financials | `stock_finance_data` |
| Yahoo Finance global markets | `yahoo_finance` |
| World Bank macroeconomics | `world_bank_open_data` |
| Chinese enterprise registry | `tianyancha` |
| arXiv preprints | `arxiv` |
| Google Scholar academic search | `scholar` |
| Chinese laws, regulations, and judicial cases | `yuandian_law` |

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

This path uses `package.json#omp.extensions` directly.

> **Note:** This repository intentionally ships `.omp-plugin/marketplace.json` only. It does not ship `.claude-plugin` metadata because the runtime tools require omp auth/session APIs and Claude Code cannot execute them.

## Prerequisites

This plugin reuses the Kimi subscription already configured in omp — **no extra API key is required**.

Just make sure you are logged in to Kimi via omp:

```bash
omp login kimi-code
```

## Usage

Once installed, Claude will automatically use this plugin's tools whenever external data queries are needed:

1. **`get_data_source_desc(name)`** — Query a data source's API documentation.
2. **`call_data_source_tool(data_source_name, api_name, params)`** — Call a specific API.

The standard workflow is: first call `get_data_source_desc` to learn the available interfaces, then call `call_data_source_tool` to fetch data.

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
│   ├── auth.ts              # Reads Kimi token from omp agent.db
│   ├── client.ts            # Kimi Code gateway HTTP client
│   └── utils.ts             # Response parsing and file writing
├── tools/
│   └── kimi-datasource.ts   # Marketplace custom-tool factory
├── skills/
│   └── omp-kimi-datasource/
│       ├── SKILL.md         # Usage guide
│       └── watchlist.json   # User watchlist (editable)
└── README.md
```

## Development

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Run tests
bun test tests/*.test.ts
```

## License

MIT
