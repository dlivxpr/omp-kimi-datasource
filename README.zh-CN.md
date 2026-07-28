# omp-kimi-datasource

[oh-my-pi](https://github.com/can1357/oh-my-pi) 的 Kimi Code 数据源插件，已同步上游 kimi-datasource **3.3.0**。

通过 Kimi Code 网关查询 12 个外部数据源：股票/财报、全球金融、宏观经济、智能筛选、SEC 披露、中国企业工商信息、学术论文、法律法规与司法案例。

上游官方实现：https://github.com/MoonshotAI/kimi-code/tree/main/plugins/official/kimi-datasource

> 🌐 [English](README.md)

## 支持的数据源

| 能力域 | 数据源名 | 典型用途 |
|---|---|---|
| A股/港股/美股 行情和财务 | `stock_finance_data` | 实时行情、财报、股东 |
| Yahoo Finance 全球金融 | `yahoo_finance` | 分析师评级、期权链、机构持仓（外汇历史约 2 年） |
| 世界银行历史宏观 | `world_bank_open_data` | 50 年以上 GDP / 人口 / 通胀历史序列 |
| IMF 国际宏观 | `imf` | 汇率、CPI、GDP 预测、国际收支 |
| Wind 万得（A股/基金/债券/宏观） | `wind` | 分钟级分时、国债收益率、基金净值 |
| 恒生聚源智能筛选 | `gildata` | 自然语言选股 / 选基金 / 基金经理筛选 |
| 美股 SEC 披露文件 | `sec_edgar` | 10-K / 10-Q、S-1、Form 4、13F、8-K |
| S&P Capital IQ 美股基本面 | `sp_data` | 一致预期、估值比率、业绩会纪要 |
| 中国企业工商信息 | `tianyancha` | 股东、司法风险、专利 |
| arXiv 论文预印本 | `arxiv` | 论文搜索与下载 |
| Google Scholar 学术搜索 | `scholar` | 作者论文、高引文献 |
| 中国法律法规与司法案例 | `yuandian_law` | 法条与判例查询 |

这些工具提供结构化、批量、领域专属的数据查询，不替代通用 Web 搜索或实时新闻。

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

该路径直接使用 `package.json#omp.extensions`（加载 `src/extension.ts`），而 marketplace 安装加载的是 custom-tool factory `tools/kimi-datasource.ts`。不要同时启用两个入口：omp 按工具名合并，后注册者生效，两个都启用会重复注册同名工具。

> **注意：** 本仓库只提供 `.omp-plugin/marketplace.json`，不附带 `.claude-plugin` 元数据，因为运行态工具依赖 omp 的认证/会话 API，Claude Code 无法执行。

## 前置条件

本插件复用 omp 自身的 Kimi 订阅，**无需额外配置 API key**。

只需确保已通过 omp 登录 Kimi：

```bash
omp login kimi-code
```

网关返回 401 时客户端会自动刷新凭证并重试一次。

## 使用

安装后，智能体会在涉及外部数据查询时自动使用本插件的工具：

1. **`get_data_source_desc(name)`** — 查询某个数据源当前的 API 文档
2. **`call_data_source_tool(data_source_name, api_name, params)`** — 调用具体 API

标准工作流是先 `get_data_source_desc` 了解接口，再 `call_data_source_tool` 取数。简单查询只选一个最匹配的数据源，成功返回后即停止；只有用户明确要求跨源对比时才查询第二个数据源。

详见 [`skills/omp-kimi-datasource/SKILL.md`](skills/omp-kimi-datasource/SKILL.md)。

## 验证

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
│   ├── auth.ts              # 通过 omp auth storage 读取 Kimi 凭证
│   ├── client.ts            # Kimi Code 网关 HTTP 客户端（401 刷新重试）
│   └── utils.ts             # 响应解析与文件落盘
├── tools/
│   └── kimi-datasource.ts   # Marketplace 自定义工具工厂
├── skills/
│   └── omp-kimi-datasource/
│       ├── SKILL.md         # 使用指南
│       └── watchlist.json   # 用户自选股（可编辑）
├── tests/                   # client/auth/utils/extension/factory 的 bun:test 测试
└── README.md
```

## 开发

```bash
# 安装依赖
bun install

# 类型检查
bun run typecheck

# 运行测试
bun run test        # 等价于 bun test tests/*.test.ts
```

## License

MIT
