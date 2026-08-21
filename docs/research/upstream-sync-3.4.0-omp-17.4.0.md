# 上游 kimi-datasource 3.4.0 与 oh-my-pi 17.4.0 变更调研与适配方案

> **调研日期**：2026-08-21  
> **上游数据源仓库**：[MoonshotAI/kimi-code](https://github.com/MoonshotAI/kimi-code)（`plugins/official/kimi-datasource`）  
> **上游宿主仓库**：[can1357/oh-my-pi](https://github.com/can1357/oh-my-pi)  
> **本项目版本基线**：`omp-kimi-datasource@1.1.0`（基于上游 3.3.0 与 omp 17.1.4）  
> **调研目标**：全面查证上游两个项目的最新变更，提供具备一手来源证据（Primary Sources）的分析，并给出针对本项目的代码、配置、文档与测试适配操作方案。

---

## 1. 调研一手来源清单 (Primary Sources)

### 1.1 Kimi Code (kimi-datasource 3.4.0)

| 来源类型 | 路径 / 标识 | 链接 / 凭证 | 关键内容 |
|---|---|---|---|
| **Release Commit** | Commit `03dcfcf6d08a` | [`03dcfcf6d08a`](https://github.com/MoonshotAI/kimi-code/commit/03dcfcf6d08a4b8f0c00432dfe400ed8d9d9868a) | 3.4.0 主提交：新增 13 个数据源、完善边界与路由规则 |
| **Pull Request** | PR #3115 | [#3115](https://github.com/MoonshotAI/kimi-code/pull/3115) | `feat(datasource): add NDA/NBS, standards, IGO, xhcj, and caixin sources` |
| **Changelog** | `plugins/official/kimi-datasource/CHANGELOG.md` | [CHANGELOG.md](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/official/kimi-datasource/CHANGELOG.md) | 3.4.0 (2026-08-17) 发布日志 |
| **Plugin Manifest** | `plugins/official/kimi-datasource/kimi.plugin.json` | [kimi.plugin.json](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/official/kimi-datasource/kimi.plugin.json) | 插件元数据、版本号 `3.4.0`、25 个数据源描述 |
| **MCP Entrypoint** | `plugins/official/kimi-datasource/bin/kimi-datasource.mjs` | [kimi-datasource.mjs](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/official/kimi-datasource/bin/kimi-datasource.mjs) | MCP 服务器实现、25 个数据源 enum、协议头、文件处理与鉴权重试 |
| **Skill Guide** | `plugins/official/kimi-datasource/SKILL.md` | [SKILL.md](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/official/kimi-datasource/SKILL.md) | 25 个数据源路由原则、客观能力边界、发现类接口调用规范 |
| **Marketplace Catalog** | `plugins/marketplace.json` | [marketplace.json](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/marketplace.json) | 官方市场中 kimi-datasource 的 3.4.0 版本记录 |

### 1.2 oh-my-pi (omp 17.1.4 → 17.4.0)

| 来源类型 | 路径 / 标识 | 链接 / 凭证 | 关键内容 |
|---|---|---|---|
| **Release Tag** | Tag `v17.4.0` | [`v17.4.0`](https://github.com/can1357/oh-my-pi/releases/tag/v17.4.0) | 17.4.0 正式发布（2026-08-20） |
| **Coding Agent Changelog** | `packages/coding-agent/CHANGELOG.md` | [CHANGELOG.md](https://github.com/can1357/oh-my-pi/blob/main/packages/coding-agent/CHANGELOG.md) | 17.2.1 至 17.4.0 全部核心改动与破坏性变更记录 |
| **AI Subsystem Changelog** | `packages/ai/CHANGELOG.md` | [CHANGELOG.md](https://github.com/can1357/oh-my-pi/blob/main/packages/ai/CHANGELOG.md) | 17.3.5 Kimi 多账号智能路由与 AuthStorage 凭证管理演进 |
| **Extensions Guide** | `docs/extensions.md` | [docs/extensions.md](https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md) | `ExtensionAPI`、`ToolDefinition`、受控定时器、文件回退通道 |
| **Custom Tools Guide** | `docs/custom-tools.md` | [docs/custom-tools.md](https://github.com/can1357/oh-my-pi/blob/main/docs/custom-tools.md) | `CustomToolFactory`、`CustomToolAPI`、`execute` 参数签名差异 |
| **Extension Loading** | `docs/extension-loading.md` | [docs/extension-loading.md](https://github.com/can1357/oh-my-pi/blob/main/docs/extension-loading.md) | 扩展模块发现、`package.json#omp.extensions` 规范 |
| **Marketplace Guide** | `docs/marketplace.md` | [docs/marketplace.md](https://github.com/can1357/oh-my-pi/blob/main/docs/marketplace.md) | 市场清单格式、Agent Plugins 1.0.0 规范支持 |
| **Types Source** | `packages/coding-agent/src/extensibility/extensions/types.ts` | [types.ts](https://github.com/can1357/oh-my-pi/blob/main/packages/coding-agent/src/extensibility/extensions/types.ts) | 17.4.0 扩展与工具核心 TypeScript 类型定义 |

---

## 2. 上游 kimi-datasource 3.4.0 变更深度调研

### 2.1 数据源大幅扩容（12 个 → 25 个）

上游在 3.4.0 中将支持的外部数据源从 12 个一举扩充至 **25 个**（新增 13 个）。定位由垂类金融与法律工具，正式升级为涵盖政务开放数据、国家标准、国际组织公开库、宏观统计与专业财经资讯的**通用结构化数据中台**。

#### 完整 25 个数据源对照表

| 序号 | 数据源标识 (`name`) | 能力域 | 引入版本 | 典型查询场景 |
|:---:|---|---|:---:|---|
| 1 | `stock_finance_data` | A股/港股/美股 行情与财务 | 3.0.0 | 股票实时/收盘快照、财报、估值指标、概念板块 |
| 2 | `yahoo_finance` | Yahoo Finance 全球金融 | 3.0.0 | 评级、期权链、机构股东（外汇历史最多约 2 年） |
| 3 | `world_bank_open_data` | 世界银行历史宏观 | 3.0.0 | 50 年以上官方历史宏观序列（各国 GDP、通胀率、人口） |
| 4 | `tianyancha` | 中国企业工商档案 | 3.0.0 | 股权穿透、司法风险、专利（必须使用企业全称） |
| 5 | `arxiv` | arXiv 学术预印本 | 3.0.0 | 预印本论文检索与 PDF 摘要/下载 |
| 6 | `scholar` | Google Scholar 学术搜索 | 3.0.0 | 学者主页、高引文献与学术出版物检索 |
| 7 | `yuandian_law` | 中国法律法规与案例 | 3.2.0 | 元典法律数据库：现行法条、司法解释、裁判文书 |
| 8 | `wind` | 万得（Wind 金融） | 3.3.0 | 分钟级分时行情、国债收益率曲线、基金净值（指标需映射） |
| 9 | `imf` | IMF 国际货币基金组织 | 3.3.0 | 长期汇率、CPI、GDP 预测、国际收支平衡表 |
| 10 | `gildata` | 恒生聚源智能筛选 | 3.3.0 | 自然语言多因子选股/选基金/基金经理筛选 |
| 11 | `sec_edgar` | 美股 SEC 官方披露 | 3.3.0 | 10-K 年报、10-Q 季报、Form 4 内部人交易、13F 机构持仓 |
| 12 | `sp_data` | S&P Capital IQ 基本面 | 3.3.0 | 分析师一致预期、估值比率、竞争对手、业绩会纪要 |
| 13 | `china_nda` | **中国政府开放数据目录** | **3.4.0 (新)** | **国家数据局公共数据资源登记目录、各省开放数据平台数据集检索** |
| 14 | `china_nbs` | **国家统计局宏观指标** | **3.4.0 (新)** | **国家统计局官方口径指标序列（全国/省/主要城市历年 GDP、CPI、PPI、就业）** |
| 15 | `china_standards` | **中国标准查询** | **3.4.0 (新)** | **GB 国家标准、HB 行业标准、DB 地方标准、TT 团体标准全文与现行状态** |
| 16 | `who` | **世界卫生组织公开数据** | **3.4.0 (新)** | **全球健康数据、婴儿死亡率、各国人均预期寿命** |
| 17 | `fao` | **联合国粮农组织数据** | **3.4.0 (新)** | **各国粮食产量、农产品价格指数、农业资源统计** |
| 18 | `unsd` | **联合国统计司 UNdata** | **3.4.0 (新)** | **联合国成员国统计年鉴、国际贸易与人口统计** |
| 19 | `ecb` | **欧洲中央银行统计** | **3.4.0 (新)** | **欧元区基准利率、欧元区货币供应量 M1/M2/M3** |
| 20 | `eurostat` | **欧盟统计局数据** | **3.4.0 (新)** | **欧盟成员国失业率、欧元区 HICP 通胀率** |
| 21 | `unicef` | **联合国儿童基金会数据** | **3.4.0 (新)** | **全球儿童营养状况、基础教育与疫苗接种率** |
| 22 | `oecd` | **经合组织 OECD 数据** | **3.4.0 (新)** | **OECD 国家 GDP 对比、教育支出、劳动力市场指标** |
| 23 | `fred` | **FRED 宏观经济数据** | **3.4.0 (新)** | **美联储圣路易斯分行宏观序列（美国 CPI 长序列、联邦基金利率、失业率）** |
| 24 | `xhcj` | **新华财经资讯与公告** | **3.4.0 (新)** | **新华财经 (CNFIC) 7x24 实时快讯、A股上市公司公告、宏观与行业政策** |
| 25 | `caixin` | **财新数据库** | **3.4.0 (新)** | **覆盖 600+ 财新数据接口（先用 `caixin_api_search` 发现接口）** |

---

### 2.2 工具 Schema 与描述文案演进

#### 1. `get_data_source_desc` 参数枚举与描述
- `name` 参数的 `enum` 数组从 12 个扩增为 **25 个**。
- `name` 的 description 新增了 13 个新数据源的客观能力定义：
  ```text
  china_nda = CN government open data catalogs (National Data Administration registry + provincial platforms);
  china_nbs = CN NBS macro indicators and time series (national / provincial / major-city scopes);
  china_standards = CN standards (GB national, HB industry, DB local, TT association);
  who / fao / unsd / ecb / eurostat / unicef / oecd / fred = international organization open data (global health, food & agriculture, UN statistics, ECB & EU statistics, child indicators, OECD datasets, US & global macro series);
  xhcj = Xinhua Finance (CNFIC) news flashes, announcements, and policies;
  caixin = Caixin database (600+ data APIs, discover via caixin_api_search first).
  ```

#### 2. `call_data_source_tool` 描述微调（停止条件语义升级）
- **3.3.0 文案**：`... stop after its first successful result; ...`
- **3.4.0 文案**：`... stop once a result covers the user's question; ...`
- **设计意图**：从“第一次成功即停止”调整为“结果已覆盖用户问题时停止”，避免因第一次调用仅获取到前置索引/列表而过早中断调用链。

---

### 2.3 提示词与路由策略演进 (SKILL.md)

1. **Frontmatter 触发词前置**：
   - 将 Wind, S&P, SEC EDGAR, FRED, NBS, GB/HB/DB/TT 标准库、WHO/FAO/OECD 及新华财经、财新等高频触发词直接置于 Frontmatter `description` 前部。
2. **新增 4 条“能力边界参考”客观事实**：
   - **中国官方宏观口径划分**：`china_nbs` 是国家统计局宏观指标时间序列（GDP/CPI/PPI 等，全国/省/主要城市），`china_nda` 是国家数据局开放数据目录（回答“有哪些数据集可用”）；`world_bank_open_data` 和 `imf` 属于国际口径。
   - **国际组织数据源直接路由**：WHO、FAO、UNSD、ECB、Eurostat、UNICEF、OECD、FRED 各自作为独立数据源直接按机构名称选用；IMF 自有数据（汇率/CPI/预测）走 `imf`。
   - **标准与法律严格区分**：国家标准（GB）、行业标准（HB）、地方标准（DB）、团体标准（TT）使用 `china_standards`；法律法规与司法判例使用 `yuandian_law`，两者不得混淆。
   - **资讯与动态接口发现**：新华财经（`xhcj`）侧重公告、快讯与政策；`caixin` 覆盖 600+ 接口，必须先调用 `caixin_api_search` 发现可用接口后再取数。
3. **发现类接口豁免“单次”限制**：
   - 在标准工作流第 5 步明确：`caixin_api_search`、`wind_search_fields`、`tianyancha` 公司搜索等前置发现类调用**不受单次调用限制**，需继续调至真正的取数 API。
4. **实时新闻能力边界精确化**：
   - 由原先的全面禁止调整为：`不支持通用 Web 搜索，以及 xhcj / caixin 覆盖范围之外的实时新闻`。

---

### 2.4 协议头与元数据更新

- `VERSION` 常量：`"3.3.0"` → `"3.4.0"`
- `User-Agent` Header：`kimi-datasource/3.4.0`
- `X-Msh-Version` Header：默认 `3.4.0`
- 鉴权重试与端点：沿用 3.3.0 的 401 凭证刷新重试与多环境隔离端点规范。

---

## 3. 上游 oh-my-pi (omp) 17.1.4 → 17.4.0 变更深度调研

### 3.1 核心演进时间线 (17.1.4 → 17.4.0)

```
17.1.4 (2026-07-27)
   │
   ├─ 17.2.7~17.2.10 (2026-08-03~08-06): Schema 引擎重构
   │   └─ 移除外部 zod 依赖，切换至 @oh-my-pi/omptype 及 zod 兼容层 (性能提升 ~100x)
   │
   ├─ 17.2.11 (2026-08-07): Agent Plugins 1.0.0 规范落地
   │   └─ 标准化 marketplace.json、package.json#omp.extensions 加载体系
   │
   ├─ 17.3.5 (2026-08-16): Kimi Code 多账号智能路由与配额感知
   │   └─ pi-ai 增强多凭证轮换、429 冷却周期与一致性用量记录
   │
   ├─ 17.3.6 (2026-08-17): 沙箱文件操作回退通道
   │   └─ ExtensionAPI 新增 registerFileWriteFallback / registerFileDeleteFallback
   │
   ├─ 17.3.8 (2026-08-19): 扩展与子 Agent 稳定性修复
   │   └─ 彻底修复唤醒子 agent (revived subagents) 的扩展运行时初始化异常
   │
   └─ 17.4.0 (2026-08-20): 扩展能力与 UI 全面增强
       ├─ pi.registerProvider 支持扩展提供 usage: UsageProvider 规范化配额
       ├─ ExtensionContext.isProjectTrusted() 兼容垫片
       └─ registerComposerShape 支持自定义终端编辑器样式
```

---

### 3.2 插件与扩展关键 API 演进分析

#### 1. Schema 引擎重构（`@oh-my-pi/omptype`）
- **变更点**：在 17.2.10 中，`@oh-my-pi/pi-coding-agent` 完全移除了外部 `zod` 包的直接依赖，转向内置的 `@oh-my-pi/omptype/zod` 兼容层。
- **影响**：
  - `pi.zod.object({...})` 与 `pi.zod.string()` API 行为保持 100% 兼容。
  - 插件不应再直接从外部 `import type { ZodType } from "zod/v4"`，而应直接利用 `ExtensionAPI["zod"]` 派生类型，避免引入外部冗余依赖及版本漂移。

#### 2. `ExtensionAPI` 新增核心接口 (17.3.6 & 17.4.0)
- **`registerFileWriteFallback(handler: FileWriteFallbackHandler)`**：
  - 当文件写入（`write`/`edit`/`apply_patch`）遇到 `EPERM`/`EACCES`/`EROFS` 权限拒绝时，触发注册的回退处理器（`req.dst` 保证为绝对符号链接解析路径）。
- **`registerFileDeleteFallback(handler: FileDeleteFallbackHandler)`**：
  - 针对文件删除权限拒绝的回退处理通道。
- **`registerComposerShape(definition: ComposerShapeDefinition)`**：
  - 允许扩展注册自定义终端编辑器布局与边框风格。
- **`registerProvider` 扩展 `usage` 属性**：
  - 扩展注册自定义模型提供方时，可直接提供 `fetchUsage` 实现接入 `/usage` 统计面板。

#### 3. `ExtensionContext` 与 `CustomToolContext` 增强
- **受控定时器**：`ctx.setInterval` / `ctx.setTimeout` / `ctx.clearTimer`。在扩展同进程无隔离运行模式下，捕获异步异常防止崩溃，并在会话关闭时自动回收。
- **模型查询接口**：`ctx.models.list()`, `ctx.models.current()`, `ctx.models.resolve(spec)`, `ctx.models.family(model)`。
- **内置工具委派**：`ctx.invokeTool<TDetails>(params, options)`，允许遮蔽原生工具的扩展安全委派调用。

#### 4. `execute` 参数顺序合约确认（双体系差异）

omp 在设计上对 Extension 注册工具与 Custom Tool Factory 导出的工具有明确的签名区分：

```ts
// 1. ExtensionAPI.registerTool 中的 execute:
execute(
  toolCallId: string,
  params: Static<TParams>,
  signal: AbortSignal | undefined,
  onUpdate: AgentToolUpdateCallback<TDetails> | undefined,
  ctx: ExtensionContext
): Promise<AgentToolResult<TDetails>>;

// 2. CustomToolFactory 导出的 execute:
execute(
  toolCallId: string,
  params: Static<TParams>,
  onUpdate: AgentToolUpdateCallback<TDetails> | undefined,
  ctx: CustomToolContext,
  signal: AbortSignal | undefined
): Promise<AgentToolResult<TDetails>>;
```

> **核验结论**：本项目在 `src/extension.ts` 和 `tools/kimi-datasource.ts` 中已分别正确实现了各自的参数顺序转发，完全符合 17.4.0 规范。

#### 5. 凭证解析与 Kimi 认证机制
- **推荐规范**：统一采用 `ctx.modelRegistry.getApiKeyForProvider("kimi-code", ctx.sessionManager.getSessionId(), { signal })`。
- **底层强化**：omp 17.3.5 在 `pi-ai` 内部针对 `kimi-code` 实现了多账号智能配额路由、429 冷却周期感知及会话级一致性，插件调用该标准接口即可自动继承这些底层优化。

---

## 4. `omp-kimi-datasource` 针对性适配方案

基于上述调研结果，本项目需要执行以下精准适配：

### 4.1 文件级修改清单

```
omp-kimi-datasource/
├── package.json                          # [P0] 升级 @oh-my-pi/pi-coding-agent 至 ^17.4.0，更新描述与版本
├── .omp-plugin/marketplace.json          # [P0] 同步更新插件版本号 (1.2.0) 与 25 个数据源描述
├── src/
│   ├── tools.ts                          # [P0] 扩充 25 个数据源 enum、更新 capabilities 与停止条件描述、解耦 zod 类型
│   ├── client.ts                         # [P0] 更新 CLIENT_VERSION 为 "3.4.0" (同步 User-Agent 与 X-Msh-Version)
│   ├── auth.ts                           # [保持] 保持已实现的 modelRegistry.getApiKeyForProvider 规范
│   └── utils.ts                          # [保持] 文件安全落盘与拆分检测保持完全兼容
├── skills/omp-kimi-datasource/
│   └── SKILL.md                          # [P0] 更新 25 个数据源表、4 条新能力边界、发现类接口免单次限制
├── README.md & README.zh-CN.md           # [P1] 同步更新 25 个数据源介绍与能力范围
├── AGENTS.md                             # [P1] 同步支持数据源列表
└── tests/
    ├── client.test.ts                    # [P0] 更新 User-Agent 断言为 kimi-datasource/3.4.0
    ├── extension.test.ts                 # [P0] 更新 25 个数据源 enum 与工具注册断言
    ├── custom-tool.test.ts               # [P0] 更新 custom-tool factory 注册断言
    └── package.test.ts                   # [P0] 更新包清单与文档一致性断言
```

---

### 4.2 详细代码修改要点

#### 1. `src/tools.ts` 修改

```typescript
// 1. 类型定义解耦：直接基于 ExtensionAPI["zod"]
export type KimiZod = ExtensionAPI["zod"];
export type KimiToolParameters = ReturnType<KimiZod["object"]>;

// 2. get_data_source_desc 枚举与描述扩充为 25 个
parameters: pi.zod.object({
  name: pi.zod.string().describe(
    "Data source name. Must be one of: stock_finance_data, yahoo_finance, world_bank_open_data, " +
    "tianyancha, arxiv, scholar, yuandian_law, wind, imf, gildata, sec_edgar, sp_data, " +
    "china_nda, china_nbs, china_standards, who, fao, unsd, ecb, eurostat, unicef, oecd, fred, xhcj, caixin. " +
    "Capabilities: stock_finance_data / yahoo_finance = general quotes and financials " +
    "(yahoo_finance FX history is limited to about 2 years); world_bank_open_data = historical macro; " +
    "imf = FX rates, CPI, GDP forecasts, balance of payments; tianyancha = CN company registry; " +
    "arxiv / scholar = papers; yuandian_law = CN laws and cases; " +
    "wind = A-share intraday minute series, funds, bonds (map PE/PB/ROE-style field names via wind_search_fields first); " +
    "gildata = natural-language stock/fund screening; " +
    "sec_edgar = US filings (10-K/10-Q, S-1, Form 4, 13F, 8-K); " +
    "sp_data = S&P fundamentals (consensus estimates, valuation ratios, transcripts); " +
    "china_nda = CN government open data catalogs (National Data Administration registry + provincial platforms); " +
    "china_nbs = CN NBS macro indicators and time series (national / provincial / major-city scopes); " +
    "china_standards = CN standards (GB national, HB industry, DB local, TT association); " +
    "who / fao / unsd / ecb / eurostat / unicef / oecd / fred = international organization open data " +
    "(global health, food & agriculture, UN statistics, ECB & EU statistics, child indicators, OECD datasets, US & global macro series); " +
    "xhcj = Xinhua Finance (CNFIC) news flashes, announcements, and policies; " +
    "caixin = Caixin database (600+ data APIs, discover via caixin_api_search first)."
  ),
})

// 3. call_data_source_tool 描述调整为覆盖性停止
description:
  "Dispatch one call to the data source selected for the user's request. " +
  "Always call get_data_source_desc(name) first, then use an api_name and params from that description. " +
  "For a simple lookup, use one specialized source and stop once a result covers the user's question; " +
  "do not query fallback or comparison sources unless the user explicitly asks for a cross-source comparison. " +
  "When the user names a data source, use that source. " +
  "This tool provides structured, batch, domain-specific data queries; it does not replace general web search or real-time news.",
```

#### 2. `src/client.ts` 修改

```typescript
const CLIENT_VERSION = "3.4.0";
```

#### 3. `skills/omp-kimi-datasource/SKILL.md` 修改

- 更新 Frontmatter description。
- 将能力域表格扩充为 25 项。
- 在“能力边界参考”中增加 4 条新增客观事实。
- 将第 2 节标准工作流第 5 步更新为豁免发现类接口单次调用限制。
- 将第 6 节不支持能力调整为：`不支持通用 Web 搜索，以及 xhcj / caixin 覆盖之外的实时新闻`。

#### 4. `package.json` & `.omp-plugin/marketplace.json` 修改

```json
{
  "version": "1.2.0",
  "description": "Kimi Code data-source plugin for oh-my-pi: stocks (Wind, S&P, SEC EDGAR), macro (World Bank, IMF, FRED, NBS), Chinese government data & standards, corporate, academic, legal, WHO/FAO/OECD, and financial news (Xinhua, Caixin)",
  "devDependencies": {
    "@oh-my-pi/pi-coding-agent": "^17.4.0",
    "@types/bun": "^1.3.14",
    "@types/node": "^26.1.1",
    "typescript": "^7.0.2"
  }
}
```

---

## 5. 适配验证与质量门禁

在完成上述代码修改后，必须通过以下完整验证：

1. **类型检查**：
   ```bash
   bun run typecheck
   ```
   验证所有 TypeScript 类型定义在 `@oh-my-pi/pi-coding-agent@17.4.0` 下无编译错误。

2. **单元与集成测试**：
   ```bash
   bun test tests/*.test.ts
   ```
   覆盖：
   - `tests/client.test.ts`：验证 HTTP 请求头 `User-Agent: kimi-datasource/3.4.0`、`X-Msh-Version: 3.4.0`、401 重试、超时及错误解析。
   - `tests/extension.test.ts`：验证 25 个数据源 enum 声明、描述格式及工具注册。
   - `tests/custom-tool.test.ts`：验证 custom-tool factory 参数转发与 25 个数据源支持。
   - `tests/auth.test.ts`：验证 `getApiKeyForProvider` 凭证获取与未登录提示。
   - `tests/utils.test.ts`：验证文件路径白名单、拆分文件检测与输出格式。
   - `tests/package.test.ts`：验证 `package.json`、`marketplace.json` 与 `SKILL.md` 的版本及命名一致性。

3. **本地安装与运行验证**：
   ```bash
   omp plugin install .
   ```
   在本地 omp 17.4.0 实例中验证插件能被正常识别、加载，且 `get_data_source_desc` 能完整返回 25 个数据源的描述。

---

## 6. 风险与兼容性评估

| 评估维度 | 现状与风险分析 | 应对措施 |
|---|---|---|
| **服务端网关兼容性** | Kimi 官方后端网关已全量支持 3.4.0 的 25 个数据源接口 | 客户端协议完全对齐，无破坏性风险 |
| **omp 宿主版本兼容性** | 插件使用了 `getApiKeyForProvider` 及标准 `ExtensionAPI.registerTool`，在 omp 17.1.x ~ 17.4.0 均可平滑运行 | 将依赖更新为 `^17.4.0`，无额外破坏性 API 调用 |
| **Zod 类型解耦风险** | omp 17.2.10+ 迁移至 omptype，若插件强依赖外部 zod 内部类型可能产生潜在冲突 | 在 `src/tools.ts` 中直接通过 `ExtensionAPI["zod"]` 派生参数类型，消除外部依赖隐患 |
| **多源选源混淆风险** | 扩充至 25 个数据源后，LLM 可能在相近领域（如国家标准 vs 法律案例、NBS vs NDA、国际组织）发生选源混淆 | 严格同步 3.4.0 的 4 条客观能力边界说明与触发词前置优化，约束单次查询停止条件 |

---
*调研报告归档完毕。*
