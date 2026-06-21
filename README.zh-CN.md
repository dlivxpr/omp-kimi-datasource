# omp-kimi-datasource

Kimi Code data-source plugin for [oh-my-pi](https://github.com/can1357/oh-my-pi).

通过 Kimi Code 网关查询股票/财报、全球金融、宏观经济、中国企业工商信息、学术论文、法律法规与司法案例等外部数据。

上游官方实现：https://github.com/MoonshotAI/kimi-code/tree/main/plugins/official/kimi-datasource

## 支持的数据源

| 能力域 | 数据源名 |
|---|---|
| A股/港股/美股 行情和财务 | `stock_finance_data` |
| Yahoo Finance 全球金融 | `yahoo_finance` |
| 世界银行宏观经济 | `world_bank_open_data` |
| 中国企业工商信息 | `tianyancha` |
| arXiv 论文预印本 | `arxiv` |
| Google Scholar 学术搜索 | `scholar` |
| 中国法律法规与司法案例 | `yuandian_law` |

## 安装

### Marketplace（推荐）

```bash
omp plugin marketplace add dlivxpr/omp-kimi-datasource
omp plugin install omp-kimi-datasource@omp-kimi-datasource
```

发布前本地测试：

```bash
omp plugin marketplace add .
omp plugin install --force omp-kimi-datasource@omp-kimi-datasource
```

### 本地开发 / npm-link 方式

```bash
# 克隆仓库
git clone https://github.com/dlivxpr/omp-kimi-datasource.git
cd omp-kimi-datasource

# 安装到 omp
omp plugin install .
```

该路径直接使用 `package.json#omp.extensions`。

> **注意：** 本仓库只提供 `.omp-plugin/marketplace.json`，不附带 `.claude-plugin` 元数据，因为运行态工具依赖 omp 的认证/会话 API，Claude Code 无法执行。


## 前置条件

本插件复用 omp 自身的 kimi 订阅，**无需额外配置 API key**。

只需确保已通过 omp 登录 Kimi：

```bash
omp login kimi-code
```
## 使用

安装后，Claude 会在涉及外部数据查询时自动使用本插件的工具：

1. **`get_data_source_desc(name)`** — 查询某个数据源的 API 文档
2. **`call_data_source_tool(data_source_name, api_name, params)`** — 调用具体 API

标准工作流是先 `get_data_source_desc` 了解接口，再 `call_data_source_tool` 取数。

详见 [`skills/omp-kimi-datasource/SKILL.md`](skills/omp-kimi-datasource/SKILL.md)。

## 验收

安装完成后，确认插件已启用：

```bash
omp plugin list
```

启动 omp 后，模型应当可见 `get_data_source_desc` 和 `call_data_source_tool` 两个工具。

## 目录结构

```
.
├── package.json             # npm 包信息 + omp manifest
├── tsconfig.json            # TypeScript 配置
├── .omp-plugin/
│   └── marketplace.json     # omp 原生 marketplace 目录
├── src/
│   ├── extension.ts         # Extension 入口，注册两个工具
│   ├── tools.ts             # extension 与 marketplace 共用的工具定义
│   ├── auth.ts              # 从 omp agent.db 读取 kimi token
│   ├── client.ts            # Kimi Code 网关 HTTP 客户端
│   └── utils.ts             # 响应解析与文件落盘
├── tools/
│   └── kimi-datasource.ts   # Marketplace 自定义工具工厂
├── skills/
│   └── omp-kimi-datasource/
│       ├── SKILL.md         # 使用指南
│       └── watchlist.json   # 用户自选股（可编辑）
└── README.md
```

## 开发

```bash
# 安装依赖
bun install

# 类型检查
bun run typecheck

# 运行测试
bun test tests/*.test.ts
```

## License

MIT
