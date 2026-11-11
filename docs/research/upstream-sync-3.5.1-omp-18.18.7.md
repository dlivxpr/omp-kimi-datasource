# 上游 kimi-datasource 3.5.1 与 oh-my-pi 18.18.7 变更调研与适配记录

> 调研日期：2026-11-11
> 本项目基线：`omp-kimi-datasource@1.2.0`（上游 kimi-datasource 3.4.0 / omp 17.4.0）
> 适配目标：`omp-kimi-datasource@1.3.0`（上游 kimi-datasource 3.5.1 / omp 18.18.7）
> 本机 omp：`omp/18.18.7`；Bun：`1.4.4`

## 1. 调研方法

| 来源 | 用途 |
|---|---|
| `https://api.github.com/repos/MoonshotAI/kimi-code` | 上游仓库提交、插件目录、文档历史 |
| `https://api.kimi.com/coding/v1/plugins/marketplace` | 上游官方插件 marketplace 当前版本与下载源 |
| `https://registry.npmjs.org/@oh-my-pi/pi-coding-agent` | omp 版本列表与发布时间 |
| `https://github.com/can1357/oh-my-pi/releases` | omp 17.4.0 → 18.18.7 的 changelog / breaking changes |
| `node_modules/@oh-my-pi/pi-coding-agent/dist/types`（17.4.0 与 18.18.7 各一份） | 类型签名逐项对比 |
| Kimi Code 网关真实调用 | 验证新数据源可用性与返回格式 |

## 2. 上游 kimi-datasource 变更

### 2.1 版本与分发方式

上游仓库在提交 `80193374`（2026-11-03，PR #4525「add plugin marketplace and native mcp oauth」）中移除了 `plugins/official/kimi-datasource/` 目录，改为通过 Kimi Code 官方 marketplace 分发。仓库内仅保留文档 `docs/en/customization/plugins.md`（`docs/en/customization/datasource.md` 为重定向页）。

marketplace 当前条目：

| 字段 | 值 |
|---|---|
| id | `kimi-datasource` |
| version | `3.5.1` |
| source | `https://kimi-for-coding-plugins.tos-cn-beijing.volces.com/plugins/kimi-datasource/3.5.1/02abe5` |
| sha256sum | `02abe5387c95dbea4aed97995034c7d6ec24eacc38a28dc6b3b80cc3aa3d48a2` |
| filename | `kimi-datasource-3.5.1.zip` |
| billing | `paid` |

下载并解压 3.5.1 后，插件结构为：

```text
kimi.plugin.json
bin/kimi-datasource.mjs
skills/kimi-datasource/SKILL.md
skills/kimi-datasource/watchlist.json
locales/zh-CN.json
CHANGELOG.md
```

### 2.2 3.4.0 → 3.5.1 变更

`CHANGELOG.md` 记录：

- **3.5.0（2026-10-29）**
  - 新增 7 个科学数据源：`chembl`、`materials_project`、`ncbi_blast`、`oqmd`、`pdb`、`pubchem`、`uniprot`
  - 新增 3 个金融/研报数据源：`dongcai`（东方财富妙想）、`cls`（财联社）、`finance_research`（卖方研报）
  - 文档新增 JSON / 文本 / 报告三类输出，与既有 CSV 输出并列
- **3.5.1（2026-11-03）**
  - 仅更新插件图标

数据源总数从 25 增至 35。

### 2.3 工具协议与行为对比

`bin/kimi-datasource.mjs`（MCP stdio server）与本地 `src/client.ts` 的关键行为一致：

| 行为 | 上游 3.5.1 | 本地适配 |
|---|---|---|
| 请求体 | `{ method, params }` | 一致 |
| 超时 | 30s | 一致 |
| 401 重试 | 重新读取凭证并重试一次 | 通过 `refreshToken` 回调重试一次 |
| trace 头 | `X-Msh-Tool-Call-Id` / `X-Msh-*` | 一致 |
| request-id 提取 | `x-request-id` / `x-trace-id` / `x-msh-request-id` / `x-msh-trace-id` / `request-id` | 一致 |
| 文件落盘白名单 | 目标路径或同目录、同扩展名、以 `<原名>_` 开头的拆分文件 | 一致 |
| 文件写入警告 | 英文 `Warning: ...` 附加到结果 | 中文 `⚠️ 警告` 附加到结果（保留本地风格） |
| 版本头 | `VERSION = "3.5.0"`（3.5.1 未改脚本） | 更新为 `3.5.1`，与插件版本对齐 |

上游 `expectedResponseFilePath` 同时检查顶层参数与嵌套 `params.params`；本地调用方传入的已是 `params.params`，语义等价。

## 3. oh-my-pi 17.4.0 → 18.18.7 变更

### 3.1 版本

- npm 最新版：`18.18.7`（2026-11-10）
- 本机 `omp --version`：`18.18.7`
- Bun 引擎要求：`>=1.4.4`（自 18.13.3 起）

### 3.2 与本插件相关的 breaking changes

逐项核对 17.4.0 → 18.18.7 的 release notes，与本插件相关的条目：

| 版本 | 变更 | 影响 |
|---|---|---|
| 17.0.0 | 工具展示统一为 `loadMode`（`essential` / `discoverable`），custom / extension / MCP 工具默认 `discoverable` 并挂到 `xd://` | 基线 17.4.0 已包含；本插件未显式设置 `loadMode`，行为不变 |
| 17.2.10 | 移除 `zod` 依赖与 `z`/`ZodType` re-export，改用 `omptype` facade（`@oh-my-pi/omptype/zod`） | 基线 17.4.0 已包含；`pi.zod` 仍是 Zod 风格 facade，现有 schema 写法兼容 |
| 18.11.3 | `ui.approve()` 返回 `"once"` / `"session"` / `"deny"` 而非 boolean | 本插件未使用 `ui.approve()` |
| 18.14.0 | Custom tool loader 构造器改为以 `cwd` 为首参，自行解析注入的 host SDK | 本插件只导出 factory，不直接构造 `CustomToolLoader` |
| 18.14.1 | `SentToolDefinitions.inactiveFor` 替换为 `withInactiveTools` | 本插件未使用 |

结论：**17.4.0 → 18.18.7 没有影响本插件 factory / execute 签名的 breaking change**。

### 3.3 新增可选 API（未使用，不影响兼容）

- `CustomToolAPI.arktype`：原生 omptype builder
- `ToolDefinition.approvalCacheTargets`：按参数缓存审批目标
- `ToolDefinition.readsSkillUris`：声明可读取 `skill://`
- `ToolDefinition.mcpReadOnlyHint` / `legacyName`
- `ExtensionAPI.registerComposerShape`
- `session_before_shutdown` 事件
- `ui.formDialog(html, options)`

### 3.4 类型签名核对

| API | 17.4.0 | 18.18.7 | 结论 |
|---|---|---|---|
| `ExtensionAPI.registerTool` 的 `execute` | `(toolCallId, params, signal, onUpdate, ctx)` | 同左 | 兼容 |
| `CustomTool.execute` | `(toolCallId, params, onUpdate, ctx, signal)` | 同左 | 兼容 |
| `CustomToolAPI.zod` | omptype Zod facade | 同左 | 兼容 |
| `CustomToolAPI.logger` | `typeof PiLogger` | 同左 | 兼容 |
| `ModelRegistry.getApiKeyForProvider` | `(provider, sessionId?, options?)` | 同左 | 兼容 |
| `CustomToolContext.sessionManager` | 存在 | 存在 | 兼容 |

## 4. 适配内容

### 4.1 依赖与清单

- `@oh-my-pi/pi-coding-agent`：`^17.4.0` → `^18.18.7`
- 新增 `engines.bun: ">=1.4.4"`，与 omp 18 的引擎要求一致
- 包版本 `1.2.0` → `1.3.0`
- `.omp-plugin/marketplace.json` 版本同步 `1.3.0`，描述更新为 35 个数据源

### 4.2 数据源同步

| 文件 | 变更 |
|---|---|
| `src/tools.ts` | `get_data_source_desc` 的 `name` 描述加入 10 个新源及能力边界 |
| `src/client.ts` | `CLIENT_VERSION` 3.4.0 → 3.5.1 |
| `skills/omp-kimi-datasource/SKILL.md` | 数据源 25 → 35；新增 10 行表格；新增化学/生物、结构/序列、材料、金融资讯四组边界；文件参数与 JSON/文本/报告输出说明 |
| `README.md` / `README.zh-CN.md` | 版本、源数量、表格、上游链接（旧链接已 404，改为官方插件文档锚点） |
| `AGENTS.md` | 数据源表新增 10 行 |
| `tests/*.test.ts` | 版本、依赖、源数量与源列表断言同步 |

### 4.3 未改动的设计决策

- **不设置 `loadMode: "essential"`**：omp 17.0.0 起 custom / extension 工具默认 `discoverable` 并挂到 `xd://`，与 MCP 工具一致。保持默认，避免改变既有工具暴露方式。
- **不引入 `arktype`**：现有 `pi.zod` schema 在 18 中仍兼容，无迁移必要。
- **保留中文文件写入警告**：与本地既有输出风格一致，不跟随上游英文文案。

## 5. 验证

### 5.1 静态检查

```bash
bun run typecheck   # tsc --noEmit，通过
bun run test        # 36 pass / 0 fail，178 expect() calls
```

### 5.2 omp 18 加载器验证

使用 `@oh-my-pi/pi-coding-agent/extensibility/custom-tools` 的 `loadCustomTools` 加载 `tools/kimi-datasource.ts`：

- `errors: []`
- 注册工具：`get_data_source_desc`、`call_data_source_tool`
- 参数 schema 的 `ir` 中包含 `chembl`、`finance_research` 等新源

使用 `@oh-my-pi/pi-coding-agent/extensibility/extensions` 的 `loadExtensions` 加载 `src/extension.ts`：

- `errors: []`
- 注册工具 Map 大小为 2，名称正确

### 5.3 真实网关调用

使用 `omp token kimi-code` 取得的凭证调用 `callGateway`：

| 调用 | 结果 |
|---|---|
| `get_data_source_desc("chembl")` | 成功，4659 字符，返回 ChEMBL API 文档 |
| `get_data_source_desc("finance_research")` | 成功，699 字符 |
| `get_data_source_desc("cls")` | 成功，1107 字符 |
| `get_data_source_desc("dongcai")` | 成功，7995 字符 |
| `call_data_source_tool("cls", "cls_telegraphs", { pageSize: 3 })` | 成功，返回 JSON 快讯数据，含 request-id |

## 6. 风险与未验证项

- **marketplace 安装流程未实跑**：为避免修改用户 `~/.omp` 环境，未执行 `omp plugin install`。已验证 omp 18 的 extension / custom-tool 加载器可直接加载本仓库两个入口。
- **新数据源的取数 API 未逐一实测**：仅验证 `get_data_source_desc` 与 `cls_telegraphs`。其余新源的 API 名与参数以运行时 desc 为准。
- **`materials_project` 需要 `MP_API_KEY`**：插件本身不管理该 key，需用户自行配置或由网关侧处理；文档已注明。
- **omp TUI 交互未完整验证**：未在 omp 18 TUI 中手动触发工具调用；加载器与真实网关调用已覆盖主要路径。
