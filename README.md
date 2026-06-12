# kimi-datasource-for-omp

Kimi Code data-source plugin for [oh-my-pi](https://github.com/oh-my-pi/oh-my-pi).

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

### Local / Private Repository (Recommended)

```bash
# Clone the repo
git clone https://github.com/dlivxpr/kimi-datasource-for-omp.git
cd kimi-datasource-for-omp

# Install into omp
omp plugin install .
```

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

For details, see [`skills/kimi-datasource/SKILL.md`](skills/kimi-datasource/SKILL.md).

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
├── src/
│   ├── extension.ts         # Extension entry: registers both tools
│   ├── auth.ts              # Reads Kimi token from omp agent.db
│   ├── client.ts            # Kimi Code gateway HTTP client
│   └── utils.ts             # Response parsing and file writing
├── skills/
│   └── kimi-datasource/
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
```

## License

MIT
