# 上游 kimi-datasource 插件同步调研报告

> 调研日期：2026-07-27
> 上游仓库：[MoonshotAI/kimi-code](https://github.com/MoonshotAI/kimi-code)
> 上游插件路径：`plugins/official/kimi-datasource`

---

## 1. 调研方法与来源

### 方法

1. 读取本地 fork 全部关键源码建立基线（`src/tools.ts`、`src/client.ts`、`src/auth.ts`、`src/utils.ts`、`src/extension.ts`、`tools/kimi-datasource.ts`、`.omp-plugin/marketplace.json`、`skills/omp-kimi-datasource/SKILL.md`）
2. 通过 GitHub API 读取上游 `plugins/official/kimi-datasource` 目录结构及全部文件内容
3. 通过 GitHub Commits API 追溯该路径的完整 commit 历史（共 7 个 commit）
4. 通过 commit diff 精确对比 3.2.0 → 3.3.0 的全部变更

### 上游 commit 历史（`plugins/official/kimi-datasource` 路径）

| SHA | 日期 | 说明 |
|-----|------|------|
| [`ebf6e8181ea2`](https://github.com/MoonshotAI/kimi-code/commit/ebf6e8181ea2) | 2026-05-27 | feat: add plugin manager and official plugins (#119) — 初始版本 |
| [`c88b7bf0efcf`](https://github.com/MoonshotAI/kimi-code/commit/c88b7bf0efcf) | 2026-05-28 | fix: preserve datasource response files (#159) |
| [`b9860e9f6ec6`](https://github.com/MoonshotAI/kimi-code/commit/b9860e9f6ec6) | 2026-05-29 | feat: align datasource plugin with generic workflow (#215) |
| [`0e57e739c7dd`](https://github.com/MoonshotAI/kimi-code/commit/0e57e739c7dd) | 2026-06-02 | docs: refine datasource skill description (#322) |
| [`1580f35136ee`](https://github.com/MoonshotAI/kimi-code/commit/1580f35136ee) | 2026-06-10 | fix: align datasource plugin environment (#595) |
| [`71f5926d0e58`](https://github.com/MoonshotAI/kimi-code/commit/71f5926d0e58) | 2026-06-10 | feat(datasource): add yuandian_law legal data source + request-id trace (#611) — **3.2.0** |
| [`e0f2a4176917`](https://github.com/MoonshotAI/kimi-code/commit/e0f2a4176917) | 2026-07-22 | feat(datasource): add wind, imf, gildata, sec_edgar, and sp_data sources (#2029) — **3.3.0** |

### "3.3.0" 指什么

"3.3.0" 是上游插件 [`kimi.plugin.json`](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/official/kimi-datasource/kimi.plugin.json) 中的 `version` 字段，同时出现在 [`plugins/marketplace.json`](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/marketplace.json) 的 `version` 字段和 [`CHANGELOG.md`](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/official/kimi-datasource/CHANGELOG.md) 中。

对应 commit：[`e0f2a4176917`](https://github.com/MoonshotAI/kimi-code/commit/e0f2a4176917)，日期 2026-07-22（5 天前），PR #2029。

---

## 2. Fork 基线状态

本 fork 基于上游 **3.2.0**（commit [`71f5926d0e58`](https://github.com/MoonshotAI/kimi-code/commit/71f5926d0e58)），核心指标：

| 指标 | Fork 值 | 上游 3.2.0 值 |
|------|---------|---------------|
| `CLIENT_VERSION` | `"3.2.0"` (`src/client.ts:5`) | `VERSION = '3.2.0'` |
| 数据源数量 | 7 个 | 7 个 |
| 数据源列表 | `stock_finance_data`, `yahoo_finance`, `world_bank_open_data`, `tianyancha`, `arxiv`, `scholar`, `yuandian_law` | 同左 |
| 架构 | omp Extension API（TypeScript 源码） | MCP stdio server（`bin/kimi-datasource.mjs`） |
| Auth | `ctx.modelRegistry.authStorage.getApiKey("kimi-code", ...)` | 本地 credentials JSON 文件 |
| `X-Msh-Platform` | `kimi-code-cli` (`src/client.ts:71`) | `kimi-code-cli` |
| API endpoint | `https://api.kimi.com/coding/v1/tools` | 同左 |

---

## 3. 上游 3.3.0 相对 Fork 的变更清单

### 3.1 新增 5 个数据源（最核心变更）

上游 3.3.0 将数据源从 7 个扩展到 **12 个**，新增：

| 数据源名 | 说明 | 典型场景 |
|----------|------|----------|
| `wind` | 万得（A股/基金/债券/宏观） | 分钟级分时序列、国债收益率、基金净值 |
| `imf` | IMF 国际宏观 | 汇率、CPI、GDP 预测、国际收支 |
| `gildata` | 恒生聚源智能筛选 | 自然语言选股/选基金/基金经理筛选 |
| `sec_edgar` | 美股 SEC 披露文件 | 10-K/10-Q、S-1、Form 4、13F、8-K |
| `sp_data` | S&P Capital IQ 美股基本面 | 一致预期、估值比率、竞争对手、电话会议 transcript |

**影响位置：**
- `get_data_source_desc` 工具参数的 `enum` 列表从 7 项扩展到 12 项
- `get_data_source_desc` 工具参数的 `description` 中新增各数据源能力边界说明
- `call_data_source_tool` 工具描述中新增数据源选择约束

来源：
- [`e0f2a4176917`](https://github.com/MoonshotAI/kimi-code/commit/e0f2a4176917) — `bin/kimi-datasource.mjs` diff 第 61-82 行
- [上游 SKILL.md](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/official/kimi-datasource/SKILL.md) 第 1 节表格

### 3.2 选源路由策略强化

上游在 `call_data_source_tool` 和 `get_data_source_desc` 的工具描述中新增了严格的路由约束：

- **简单查询只选一个专门数据源**，不查备选/对比源
- **用户点名数据源时直接用该源**
- **第一个成功结果即停止**，不为补充字段/重新格式化/交叉验证继续调其他 API
- **只有用户明确要求跨源对比时才查第二个源**

来源：
- [`e0f2a4176917`](https://github.com/MoonshotAI/kimi-code/commit/e0f2a4176917) — `bin/kimi-datasource.mjs` diff 第 30-35 行（`call_data_source_tool` description）和第 54-57 行（`get_data_source_desc` description）

### 3.3 能力边界文档化

上游在 `get_data_source_desc` 参数的 `description` 和 `SKILL.md` 中为每个数据源写明了**客观能力边界**，让模型能自主选源：

- `yahoo_finance` 外汇历史最多约 2 年；分钟级分时序列在 `wind`
- `stock_finance_data` 是实时/收盘快照
- `world_bank_open_data` 是 50 年以上历史宏观序列；IMF 预测值用 `imf`
- `gildata` 输入是自然语言条件
- `wind` 的 `indexes`/`indicators` 参数要求 Wind 原生字段名，PE/PB/ROE 等先调 `wind_search_fields` 映射
- 股东/机构持仓：`yahoo_finance`、`sec_edgar`（13F）、`sp_data` 口径不同

来源：
- [`e0f2a4176917`](https://github.com/MoonshotAI/kimi-code/commit/e0f2a4176917) — `bin/kimi-datasource.mjs` diff 第 70-82 行（enum description）
- [上游 SKILL.md](https://github.com/MoonshotAI/kimi-code/blob/main/plugins/official/kimi-datasource/SKILL.md) "能力边界参考" 一节

### 3.4 401 凭证轮换重试

上游在 `callKimiTool` 中新增了 401 重试逻辑：

1. 首次请求收到 401 时，重新加载本地 credentials
2. 如果新加载的 token 与之前不同，用新 token 重试一次
3. 如果仍然 401，抛出"access_token was rejected"错误
4. **删除了 3.2.0 中的 `expires_at` 客户端过期检查**（改为依赖服务端返回 401）

来源：
- [`e0f2a4176917`](https://github.com/MoonshotAI/kimi-code/commit/e0f2a4176917) — `bin/kimi-datasource.mjs` diff 第 315-356 行（`callKimiTool` 函数重写）

**注意**：fork 使用 `ctx.modelRegistry.authStorage.getApiKey()` 获取 token，由 omp host 管理 token 生命周期，与上游的本地 credentials 文件机制不同。但 401 重试逻辑的思想仍然适用——omp host 在 token 轮换后 `getApiKey` 可能返回新值。

### 3.5 SKILL.md 结构变化

上游 SKILL.md 3.3.0 相对 3.2.0 的变更：

- **新增"选源原则"小节**（第 1 节内）：3 条路由规则
- **新增"能力边界参考"小节**（第 1 节内）：6 条客观边界说明
- **数据源表格从 7 行扩展到 12 行**
- **工作流步骤 1** 从"挑出一个"改为"只挑一个"
- **工作流步骤 5** 新增"结果成功且已经覆盖问题时停止调用"
- **删除 yuandian_law 示例**（例 4）
- `yahoo_finance` 典型问题从"标普 500 历年价格"改为"苹果前十大机构股东"
- `world_bank_open_data` 描述从"宏观经济"改为"历史宏观"

来源：
- [`e0f2a4176917`](https://github.com/MoonshotAI/kimi-code/commit/e0f2a4176917) — `SKILL.md` diff

### 3.6 工具描述文案变化（`call_data_source_tool`）

3.2.0：
```
Dispatch a call to any registered data source's API via the Kimi Code gateway. Always call get_data_source_desc(name) first to learn that source's available APIs and required params, then construct this call with api_name and params taken from that description.
```

3.3.0：
```
Dispatch one call to the data source selected for the user's request. Always call get_data_source_desc(name) first, then use an api_name and params from that description. For a simple lookup, use one specialized source and stop after its first successful result; do not query fallback or comparison sources unless the user explicitly asks for a cross-source comparison. When the user names a data source, use that source.
```

`data_source_name` 参数描述也从：
```
Data source name returned or documented by get_data_source_desc.
```
变为：
```
The data source selected via get_data_source_desc. When the user names a source, pass that source.
```

来源：[`e0f2a4176917`](https://github.com/MoonshotAI/kimi-code/commit/e0f2a4176917) — `bin/kimi-datasource.mjs` diff 第 30-35 行

---

## 4. Fork 需要同步更新的位置

### 4.1 `src/tools.ts` — 工具描述和参数（必须更新）

| 位置 | 改什么 | 为什么 |
|------|--------|--------|
| `get_data_source_desc` 的 `description` | 更新数据源列表为 12 个，新增能力边界说明；新增选源路由约束 | 上游 3.3.0 新增 5 个数据源，工具描述是模型选源的主要依据 |
| `get_data_source_desc` 的 `parameters.name` 描述 | 更新枚举值列表，新增 `wind`/`imf`/`gildata`/`sec_edgar`/`sp_data`；新增能力边界描述 | 上游在 enum 和 description 中写了各源能力边界 |
| `call_data_source_tool` 的 `description` | 新增单源路由约束（"use one specialized source and stop after its first successful result"等） | 上游 3.3.0 强化了路由策略 |
| `call_data_source_tool` 的 `data_source_name` 参数描述 | 从 "Data source name, e.g. ..." 改为强调"When the user names a source, pass that source." | 上游描述更精确 |

### 4.2 `src/client.ts` — 版本号和 401 重试（必须更新）

| 位置 | 改什么 | 为什么 |
|------|--------|--------|
| `CLIENT_VERSION` | `"3.2.0"` → `"3.3.0"` | 与上游版本对齐；该值同时用于 `X-Msh-Version` header 和 `User-Agent` |
| `callGateway` 函数 | 新增 401 重试逻辑：首次请求 401 时重新调用 `getKimiToken` 获取新 token，若不同则重试一次 | 上游 3.3.0 新增了凭证轮换重试；fork 用 `getApiKey` 替代 `loadAccessToken`，思想相同 |

### 4.3 `skills/omp-kimi-datasource/SKILL.md` — 用户文档（必须更新）

| 位置 | 改什么 | 为什么 |
|------|--------|--------|
| 第 1 节数据源表格 | 从 7 行扩展到 12 行，新增 `wind`/`imf`/`gildata`/`sec_edgar`/`sp_data` | 核心变更 |
| 第 1 节 | 新增"选源原则"和"能力边界参考"两个小节 | 上游 3.3.0 新增 |
| 第 2 节工作流步骤 1 | "挑出一个" → "只挑一个" | 上游措辞更严格 |
| 第 2 节工作流步骤 5 | 新增"结果成功且已经覆盖问题时停止调用" | 上游新增停止条件 |
| 第 2 节 | 删除 yuandian_law 例 4 | 上游删除了该示例 |
| `yahoo_finance` 典型问题 | "标普 500 历年价格" → "苹果前十大机构股东" | 上游更新 |
| `world_bank_open_data` 描述 | "宏观经济" → "历史宏观" | 上游更新 |

### 4.4 `.omp-plugin/marketplace.json` — 版本号（可选更新）

| 位置 | 改什么 | 为什么 |
|------|--------|--------|
| `metadata.version` | `"1.0.0"` → `"1.1.0"` 或其他 | fork 独立版本号，可考虑 bump 以反映上游同步 |
| `plugins[0].version` | `"1.0.0"` → 同上 | 同上 |

### 4.5 `skills/omp-kimi-datasource/watchlist.json` — 示例数据（可选更新）

上游包含 3 条示例数据（茅台、平安银行、腾讯），fork 当前为空数组 `[]`。如果希望提供开箱即用的示例，可以同步。

---

## 5. 不需要同步的项

### 5.1 架构差异（fork 有意分叉）

| 项 | 上游 | Fork | 说明 |
|----|------|------|------|
| 运行时架构 | MCP stdio server（`bin/kimi-datasource.mjs`） | omp Extension API（TypeScript） | fork 是有意的架构适配，不需要同步 |
| Auth 机制 | 本地 `~/.kimi-code/credentials/*.json` 文件 | `ctx.modelRegistry.authStorage.getApiKey()` | fork 通过 omp host 管理 token，不需要同步 |
| 凭证环境隔离 | `resolveKimiCodeCredentialName()` 根据 `KIMI_CODE_OAUTH_HOST`/`KIMI_CODE_BASE_URL` 哈希生成 credential name | 由 omp host 的 `authStorage` 处理 | fork 不需要 |
| `X-Msh-Device-Id` 路径 | `~/.kimi-code/device_id` | `~/.omp/agent/kimi-device-id` | fork 有意使用 omp 路径 |
| 工具注册方式 | MCP `tools/list` + `tools/call` | `pi.registerTool()` | fork 是有意的 omp 适配 |

### 5.2 Fork 已有但上游没有的功能

| 项 | Fork | 上游 | 说明 |
|----|------|------|------|
| `writeFiles` 中的落盘警告 | `⚠️ 警告：请求中指定了 file_path=...，但未观察到该路径的文件已落盘` | 无 | fork 额外增加了文件落盘校验和警告 |
| `_a.csv`/`_hk.csv` 拆分校验 | `hasSplit` 检查 | 无 | fork 额外处理了混合 A+港股拆分场景 |
| `完整数据已落盘` 追加提示 | `if (!resultText.includes("完整数据已落盘"))` 自动追加 | 无 | fork 增强了返回文本 |
| `appendTrace` 中文错误消息 | `查询数据源描述失败：${message}` | 英文错误消息 | fork 适配了中文用户 |
| `GatewayError` 类 | 带 trace 信息的自定义错误类 | 无（直接 throw Error） | fork 增强了错误处理 |
| `expectedResponseFilePath` 支持 `params.params` | fork 直接在 `params.file_path`/`params.filepath` 查找 | 上游在 `params` 和 `params.params` 两层查找 | fork 的实现略有不同但功能等价 |

### 5.3 上游有但 fork 不适用的功能

| 项 | 上游 | Fork | 说明 |
|----|------|------|------|
| MCP stdio transport | JSON-RPC 2.0 over stdin/stdout | N/A | fork 不是 MCP server |
| `expires_at` 客户端过期检查 | 3.2.0 有，3.3.0 删除 | N/A | fork 由 omp host 管理 token 生命周期 |
| `handler.format` 钩子 | `handler.format?.(text, built)` | 无 | 上游预留的格式化钩子，当前未使用 |

---

## 6. 未决风险与无法确认项

1. **后端 API 兼容性**：上游 3.3.0 新增了 5 个数据源，但这些数据源是否已经在 `https://api.kimi.com/coding/v1/tools` 后端上线，无法从客户端代码确认。如果后端尚未支持 `wind`/`imf`/`gildata`/`sec_edgar`/`sp_data`，调用会返回 `API_NOT_FOUND` 错误。[INFERENCE]

2. **401 重试在 omp 架构下的可行性**：上游 3.3.0 的 401 重试依赖于重新读取本地 credentials 文件获取新 token。fork 使用 `ctx.modelRegistry.authStorage.getApiKey()`，该方法是否会在 omp host 轮换 token 后返回新值，取决于 omp host 的实现。如果 `getApiKey` 有缓存，401 重试可能拿到同一个过期 token。[INFERENCE]

3. **上游 SKILL.md 中的 MCP 工具前缀**：上游 SKILL.md 中工具名带 `mcp__plugin-kimi-datasource_data__` 前缀，这是 kimi-code 的 MCP 命名空间。fork 使用 omp 的 `registerTool`，工具名不带前缀，因此 SKILL.md 中的调用方式部分不需要同步。

4. **`wind_search_fields` API**：上游在 `get_data_source_desc` 的 enum description 中提到 `wind` 数据源的 `wind_search_fields` API，但这是后端 API 而非客户端工具，fork 无需额外实现。

5. **上游测试文件**：上游在 [`apps/kimi-code/test/utils/kimi-datasource-plugin.test.ts`](https://github.com/MoonshotAI/kimi-code/blob/main/apps/kimi-code/test/utils/kimi-datasource-plugin.test.ts) 有插件测试（3.3.0 中 +133/-3 行），但 fork 使用自己的测试体系（`tests/*.test.ts`），不需要同步。
