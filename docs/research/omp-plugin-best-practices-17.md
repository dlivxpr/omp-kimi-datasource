# omp-kimi-datasource 17.1.4 最佳实践核对报告

> 调研目标：核对本仓库 `omp-kimi-datasource`（oh-my-pi 数据源 plugin）是否符合 omp 官方仓库文档中的 plugin / marketplace / extension / custom-tool / skill 开发最佳实践，并确认其使用的 omp API 在 omp **17.1.4** 中是否仍然正确。
>
> 调研时间：2026-07-27  
> 本机 omp 版本：`omp/17.1.4`（由父 agent 核实）  
> 仓库 devDependency：`@oh-my-pi/pi-coding-agent ^17.1.4`（由父 agent 核实）  
>
> 约束：本报告只读调研，不修改业务代码；所有 omp 行为声明均附官方来源链接。

---

## 1. 调研范围与来源

### 1.1 本仓库被核对文件

- `package.json`（omp 字段、依赖版本）
- `.omp-plugin/marketplace.json`
- `src/extension.ts`（Extension 入口）
- `src/tools.ts`（工具定义，被 extension 和 custom-tool factory 共用）
- `src/auth.ts`（Kimi token 获取）
- `src/client.ts`（Kimi gateway HTTP 客户端）
- `tools/kimi-datasource.ts`（marketplace custom-tool factory）
- `skills/omp-kimi-datasource/SKILL.md`
- `README.md`

### 1.2 官方文档来源（均来自 `https://github.com/can1357/oh-my-pi`）

| 文档 | 用途 |
|---|---|
| [`docs/marketplace.md`](https://github.com/can1357/oh-my-pi/blob/main/docs/marketplace.md) | marketplace 命令、目录布局、`marketplace.json` schema |
| [`docs/custom-tools.md`](https://github.com/can1357/oh-my-pi/blob/main/docs/custom-tools.md) | custom tool factory 签名、`CustomToolAPI`、`execute` 参数顺序 |
| [`docs/extensions.md`](https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md) | `ExtensionAPI`、`registerTool` 签名、事件面、最佳实践 |
| [`docs/extension-loading.md`](https://github.com/can1357/oh-my-pi/blob/main/docs/extension-loading.md) | extension 模块发现路径、`package.json#omp.extensions` 解析 |
| [`docs/skills/authoring-extensions.md`](https://github.com/can1357/oh-my-pi/blob/main/docs/skills/authoring-extensions.md) | extension 编写快速入门、调试、约束 |
| [`docs/skills/authoring-marketplaces.md`](https://github.com/can1357/oh-my-pi/blob/main/docs/skills/authoring-marketplaces.md) | marketplace 编写、`marketplace.json` 字段、插件结构 |
| [`docs/hooks.md`](https://github.com/can1357/oh-my-pi/blob/main/docs/hooks.md) | hook 与 extension 的关系、旧 API 边界 |
| [`packages/coding-agent/CHANGELOG.md`](https://github.com/can1357/oh-my-pi/blob/main/packages/coding-agent/CHANGELOG.md) | 17.x 变更记录、breaking changes |
| [`packages/ai/CHANGELOG.md`](https://github.com/can1357/oh-my-pi/blob/main/packages/ai/CHANGELOG.md) | `AuthStorage` / `getApiKey` 变更记录 |

### 1.3 本机源码来源（`node_modules/@oh-my-pi/pi-coding-agent@17.1.4`）

- `src/extensibility/extensions/types.ts` — `ExtensionAPI`、`ToolDefinition`、`ExtensionContext`
- `src/extensibility/custom-tools/types.ts` — `CustomToolFactory`、`CustomTool`、`CustomToolContext`
- `src/capability/skill.ts` — `SkillFrontmatter`
- `src/config/model-registry.ts` — `ModelRegistry.getApiKey` / `getApiKeyForProvider`
- `src/session/auth-storage.ts` — `AuthStorage` 再导出（实际实现位于 `@oh-my-pi/pi-ai`）
- `../pi-ai/src/auth-storage.ts` — `AuthStorage.getApiKey` 签名与优先级

---

## 2. 仓库当前 omp API 用法清单

| 位置 | 用途 | 当前写法 |
|---|---|---|
| `package.json` | extension 入口声明 | `"omp": { "extensions": ["./src/extension.ts"] }` |
| `src/extension.ts` | 默认导出 extension factory，注册两个工具 | `export default function activate(pi: ExtensionAPI) { ... pi.registerTool({ ... }) }` |
| `src/tools.ts` | 工具 schema/execute 共享逻辑 | `createKimiDatasourceTools(pi, logger)` 返回 `KimiDatasourceToolSpec[]` |
| `src/auth.ts` | 读取 Kimi token | `ctx.modelRegistry.authStorage.getApiKey("kimi-code", ctx.sessionManager.getSessionId(), { signal })` |
| `tools/kimi-datasource.ts` | marketplace custom-tool factory | `const factory: CustomToolFactory = (pi) => createKimiDatasourceTools(pi, pi.logger).map(...)` |
| `skills/omp-kimi-datasource/SKILL.md` | skill 提示词 | YAML frontmatter：`name` / `description` / `compatibility` |
| `.omp-plugin/marketplace.json` | marketplace catalog | `$schema` 指向 anthropic.com schema，`plugins[0].source: "./"` |

---

## 3. 逐条 API 核对结果

### 3.1 `package.json#omp.extensions`

- **状态**：符合
- **说明**：`extension-loading.md` 明确说明目录解析时优先读取 `package.json` 的 `omp.extensions`（或旧版 `pi.extensions`）作为入口。
- **当前写法**：`"omp": { "extensions": ["./src/extension.ts"] }`
- **来源**：
  - [`docs/extension-loading.md` — Path and entry resolution / If configured path is a directory](https://github.com/can1357/oh-my-pi/blob/main/docs/extension-loading.md)
  - [`docs/skills/authoring-extensions.md` — package.json manifest](https://github.com/can1357/oh-my-pi/blob/main/docs/skills/authoring-extensions.md)

### 3.2 `src/extension.ts` 默认导出 factory + `pi.registerTool`

- **状态**：符合
- **说明**：`extensions.md` 与 `authoring-extensions.md` 均要求 extension 模块默认导出一个接收 `ExtensionAPI` 的 factory，并在其中调用 `pi.registerTool(...)`。当前实现完全一致。
- **来源**：
  - [`docs/extensions.md` — What an extension is](https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md)
  - [`docs/skills/authoring-extensions.md` — Minimum viable extension](https://github.com/can1357/oh-my-pi/blob/main/docs/skills/authoring-extensions.md)

### 3.3 `registerTool` 的 `execute` 签名

- **状态**：符合
- **说明**：`ToolDefinition.execute` 在 17.1.4 中的签名是 `(toolCallId, params, signal, onUpdate, ctx)`。当前 `src/extension.ts` 中 execute 参数顺序与此一致（虽然 `_onUpdate` 未使用，但位置正确）。
- **当前写法**：`async execute(toolCallId, params, signal, _onUpdate, ctx) { ... }`
- **来源**：
  - [`docs/extensions.md` — Tool authoring details](https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md)
  - 本机 `src/extensibility/extensions/types.ts`：`ToolDefinition.execute(toolCallId, params, signal, onUpdate, ctx)`

### 3.4 custom-tool factory 签名与 `execute` 参数顺序

- **状态**：符合
- **说明**：custom tool 与 extension 的 `execute` 参数顺序**不同**。`CustomTool.execute` 签名是 `(toolCallId, params, onUpdate, ctx, signal)`。当前 `tools/kimi-datasource.ts` 的 wrapper 完全匹配该顺序。
- **当前写法**：`async execute(toolCallId, params, _onUpdate, ctx, signal)`
- **来源**：
  - [`docs/custom-tools.md` — Module contract / Execution contract](https://github.com/can1357/oh-my-pi/blob/main/docs/custom-tools.md)
  - 本机 `src/extensibility/custom-tools/types.ts`：`execute(toolCallId, params, onUpdate, ctx, signal)`

> 注意：这是 17.x 中容易踩坑的地方。Extension 注册的工具把 `signal` 放第 3 位，而 CustomTool factory 把 `signal` 放第 5 位。本仓库通过两套 wrapper 分别适配，写法正确。

### 3.5 使用 `pi.zod` / `pi.zod.object(...)` 定义参数 schema

- **状态**：符合
- **说明**：官方文档明确 `pi.zod` 是 canonical schema 模块。当前工具参数全部使用 `pi.zod.object(...)` / `pi.zod.string()` / `pi.zod.record(...)`。
- **来源**：
  - [`docs/custom-tools.md` — API surface passed to factories](https://github.com/can1357/oh-my-pi/blob/main/docs/custom-tools.md)
  - [`docs/skills/authoring-extensions.md` — Registering tools](https://github.com/can1357/oh-my-pi/blob/main/docs/skills/authoring-extensions.md)

### 3.6 工具返回结构 `{ content, isError }`

- **状态**：符合
- **说明**：`AgentToolResult` 类型为 `{ content: ContentPart[]; details?: unknown; isError?: boolean }`。当前两个工具在失败时返回 `{ content: [...], isError: true }`。
- **来源**：
  - [`docs/custom-tools.md` — Failures and cancellation semantics](https://github.com/can1357/oh-my-pi/blob/main/docs/custom-tools.md)
  - 本机 `src/extensibility/custom-tools/types.ts`：`CustomToolResult<TDetails> = AgentToolResult<TDetails>`

### 3.7 通过 `ctx.modelRegistry.authStorage.getApiKey` 取 token

- **状态**：**可运行，但不符合最佳实践，存在未来兼容性风险**
- **说明**：
  - `ModelRegistry` 的构造函数将 `authStorage` 暴露为 `readonly authStorage: AuthStorage`，因此直接访问在编译和运行时都能工作。
  - 但是官方文档和示例推荐的 API key 解析入口是 `ctx.modelRegistry.getApiKey(model)`（模型级）或 `ctx.modelRegistry.getApiKeyForProvider(provider, sessionId, options)`（provider 级）。
  - 直接访问 `authStorage` 绕过了 `ModelRegistry` 的 model-scoped 解析，如果未来 omp 调整 `authStorage` 的可见性或优先级，插件容易失效。
- **当前写法**：`ctx.modelRegistry.authStorage.getApiKey("kimi-code", ctx.sessionManager.getSessionId(), { signal })`
- **建议写法**：`await ctx.modelRegistry.getApiKeyForProvider("kimi-code", ctx.sessionManager.getSessionId(), { signal })`
- **来源**：
  - [`docs/extensions.md` — Extension Context (`modelRegistry for API key resolution`)](https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md)
  - [`docs/hooks.md` — Realistic API examples (`ctx.modelRegistry.getApiKey(model)`)](https://github.com/can1357/oh-my-pi/blob/main/docs/hooks.md)
  - 本机 `src/config/model-registry.ts`：`getApiKeyForProvider(provider, sessionId?, options?)`
  - 本机 `../pi-ai/src/auth-storage.ts`：`getApiKey(provider, sessionId?, options?)`

### 3.8 `sessionManager.getSessionId()` 用法

- **状态**：符合
- **说明**：`CustomToolContext` 与 `ExtensionContext` 均提供 `sessionManager: ReadonlySessionManager`，其 `getSessionId()` 用于获取当前会话 ID，与 `AuthStorage.getApiKey` 的 `sessionId` 参数配套使用，保证 session-sticky credential 正确解析。
- **来源**：
  - 本机 `src/extensibility/custom-tools/types.ts`：`CustomToolContext.sessionManager`
  - [`packages/ai/CHANGELOG.md` — 17.1.0 前后关于 sessionId / promptCacheKey 的修复](https://github.com/can1357/oh-my-pi/blob/main/packages/ai/CHANGELOG.md)

---

## 4. 非 API 最佳实践核对

### 4.1 `marketplace.json` 的 schema 与路径

- **状态**：符合
- **说明**：
  - `docs/marketplace.md` 与 `docs/skills/authoring-marketplaces.md` 均说明：omp 优先读取 `.omp-plugin/marketplace.json`，回退到 `.claude-plugin/marketplace.json`；`$schema` 使用 `https://anthropic.com/claude-code/marketplace.schema.json` 是 catalog format 的一部分。
  - 当前文件路径为 `.omp-plugin/marketplace.json`，schema URL 与该格式一致。
- **来源**：
  - [`docs/marketplace.md` — Catalog format](https://github.com/can1357/oh-my-pi/blob/main/docs/marketplace.md)
  - [`docs/skills/authoring-marketplaces.md` — marketplace.json schema](https://github.com/can1357/oh-my-pi/blob/main/docs/skills/authoring-marketplaces.md)

### 4.2 `marketplace.json` 字段完整性

- **状态**：基本符合，有一处可改进
- **说明**：
  - 必填字段 `name`、`owner.name`、`plugins` 均存在。
  - `plugins[0].source: "./"` 是相对路径字符串，指向 marketplace 仓库根目录，符合 "Relative path string" 要求（必须以 `./` 开头）。
  - `metadata.pluginRoot` 未设置，无影响。
  - 额外字段 `keywords` 被保留但不影响安装/运行时。
- **可改进点**：
  - `plugins[0].version` 存在，但 marketplace install 时若 catalog 未提供 `version`，会回退到插件 manifest。由于当前插件根目录没有 `package.json` 中的 version 被 marketplace 读取的明确保证（marketplace 安装拷贝的是插件目录），保留 `version` 无害。
- **来源**：
  - [`docs/marketplace.md` — Required fields / Plugin entry fields](https://github.com/can1357/oh-my-pi/blob/main/docs/marketplace.md)

### 4.3 插件目录布局

- **状态**：基本符合，但存在双重入口带来的潜在冲突
- **说明**：
  - 官方推荐的市场插件目录结构包括 `skills/<name>/SKILL.md`、`tools/`、`commands/` 等，extension 模块通过 `package.json#omp.extensions` 仅在 npm/link 安装时加载，**marketplace 安装不会加载 extension 模块**。
  - 当前仓库同时提供：
    1. `src/extension.ts` + `package.json#omp.extensions`（本地 / npm-link 安装路径）
    2. `tools/kimi-datasource.ts`（marketplace custom-tool 路径）
  - 两套入口注册同名工具。若用户以 `omp plugin install .` 本地安装，extension loader 与 custom-tool loader 可能同时工作，导致 `"get_data_source_desc"` / `"call_data_source_tool"` 名称冲突，触发 "Tool name conflicts are rejected" 的错误。
- **建议**：
  - 明确区分安装方式：marketplace 安装走 `tools/`；本地开发走 `src/extension.ts`。
  - 或在 `src/extension.ts` 中通过某种运行时检测（如检查 `pi.registerTool` 是否已存在同名工具）避免重复注册，避免安装方式重叠时冲突。
- **来源**：
  - [`docs/skills/authoring-marketplaces.md` — Plugin structure](https://github.com/can1357/oh-my-pi/blob/main/docs/skills/authoring-marketplaces.md)
  - [`docs/extension-loading.md` — Installed plugin extension entries](https://github.com/can1357/oh-my-pi/blob/main/docs/extension-loading.md)
  - [`docs/custom-tools.md` — Important behavior / Duplicate resolved paths are deduplicated. Tool name conflicts are rejected](https://github.com/can1357/oh-my-pi/blob/main/docs/custom-tools.md)

### 4.4 `SKILL.md` 约定

- **状态**：基本符合，有一处冗余
- **说明**：
  - `SkillFrontmatter` 接口定义 `name?`、`description?`、`globs?`、`hide?`、`disableModelInvocation?`，并允许 `[key: string]: unknown`。当前 frontmatter 包含 `name`、`description`、`compatibility`，因此能被正常解析。
  - 但 `compatibility` 不是 omp `SkillFrontmatter` 中定义的属性，omp 不会读取它。由于 README 声明这是 omp-only plugin，该字段属于冗余；可移除或改为官方支持的 `tags`。
- **来源**：
  - 本机 `src/capability/skill.ts`：`SkillFrontmatter`

### 4.5 登录/凭证获取方式

- **状态**：符合设计，但实现可更贴近 public API
- **说明**：
  - README 要求用户运行 `omp login kimi-code`，这与 omp 的 `AuthStorage` 凭证模型一致。
  - 代码中直接读取 `authStorage` 的 private-ish 字段，建议改为 `modelRegistry.getApiKeyForProvider`，以使用官方推荐的 API key resolution 入口。
- **来源**：
  - [`docs/extensions.md` — Extension Context `modelRegistry for API key resolution`](https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md)

### 4.6 工具命名与 schema 定义

- **状态**：符合
- **说明**：
  - 工具名使用 `snake_case`（`get_data_source_desc`、`call_data_source_tool`），与官方示例一致。
  - `label` 为 human-readable，`description` 详细说明用途。
  - schema 使用 `pi.zod`，并对每个字段调用 `.describe(...)`，符合推荐做法。
- **来源**：
  - [`docs/skills/authoring-extensions.md` — Registering tools](https://github.com/can1357/oh-my-pi/blob/main/docs/skills/authoring-extensions.md)

---

## 5. 修改建议清单（按优先级）

### P1 — 高优先级（影响稳定性/未来兼容性）

1. **改 token 获取为 public API**
   - 文件：`src/auth.ts`、`src/tools.ts`
   - 建议将 `ctx.modelRegistry.authStorage.getApiKey(...)` 替换为 `ctx.modelRegistry.getApiKeyForProvider("kimi-code", sessionId, { signal })`。
   - 理由：官方文档/示例推荐通过 `modelRegistry` 解析 API key；直接访问 `authStorage` 是内部字段，未来可见性或签名变化时容易失效。

2. **统一 context 类型定义**
   - 文件：`src/tools.ts`
   - 建议将本地手写的 `KimiToolContext` 改为从 `@oh-my-pi/pi-coding-agent` 的公开类型派生，例如：
     ```ts
     import type { CustomToolContext } from "@oh-my-pi/pi-coding-agent";
     type KimiToolContext = Pick<CustomToolContext, "modelRegistry" | "sessionManager">;
     ```
   - 理由：当前手写类型只描述了实际使用字段的子集，若 omp 未来重命名或调整字段，编译期不会报错；使用公开派生类型更安全。

### P2 — 中优先级（避免安装路径冲突/冗余）

3. **处理 extension 与 custom-tool 的双重注册**
   - 文件：`src/extension.ts`、`tools/kimi-datasource.ts`
   - 建议：在 `src/extension.ts` 的 `activate` 中先检查是否已存在同名工具（通过 `pi.getAllTools()` 或 try-catch `pi.registerTool`），若已存在则跳过注册，避免本地安装时与 marketplace custom-tool 冲突。
   - 或明确文档：说明 `src/extension.ts` 仅用于本地开发，`tools/kimi-datasource.ts` 用于 marketplace 安装。

4. **移除 `SKILL.md` 冗余 `compatibility` 字段**
   - 文件：`skills/omp-kimi-datasource/SKILL.md`
   - 建议：移除 `compatibility` 列表，或替换为官方支持的 `tags`。omp 的 `SkillFrontmatter` 不识别该字段，且 README 已声明这是 omp-only plugin。

### P3 — 低优先级（文档/规范）

5. **在 `marketplace.json` 中保持 `version` 与 `package.json#version` 同步**
   - 文件：`.omp-plugin/marketplace.json`、`package.json`
   - 当前两者都是 `1.1.0`，已一致；后续发布时注意同步。

6. **README 补充本地开发与 marketplace 安装的差异说明**
   - 文件：`README.md`
   - 建议：明确说明 `omp plugin install .` 会加载 `src/extension.ts`，而 `omp plugin install omp-kimi-datasource@omp-kimi-datasource` 会加载 `tools/kimi-datasource.ts`，避免用户误以为两者行为完全等价。

---

## 6. 16.x → 17.x 迁移说明核对

- **官方仓库 `docs/` 目录下未找到 16.x → 17.x 的迁移指南或 `BREAKING.md`。**
- `packages/coding-agent/CHANGELOG.md` 与 `packages/ai/CHANGELOG.md` 从 `17.0.9` 开始才有系统化的变更记录，并在 `coding-agent/CHANGELOG.md` 末尾明确注明：

> "Previous releases did not maintain a changelog."

- 因此，**无法从官方文档核对 16.x 的具体 API 形态**。本报告所有结论均基于当前 17.1.4 的公开 API 与文档。

---

## 7. 结论摘要

### 7.1 符合项

- `package.json#omp.extensions` 声明与解析规则符合官方要求。
- `src/extension.ts` 的 Extension factory + `pi.registerTool(...)` 用法正确。
- `registerTool` 的 `execute` 参数顺序 `(toolCallId, params, signal, onUpdate, ctx)` 与 17.1.4 类型一致。
- `tools/kimi-datasource.ts` 的 CustomTool factory 与 `execute(toolCallId, params, onUpdate, ctx, signal)` 顺序与 17.1.4 类型一致。
- 使用 `pi.zod` 作为参数 schema 的 canonical 模块，并对字段使用 `.describe(...)`。
- 工具返回 `{ content, isError }` 结构符合 `AgentToolResult`。
- `.omp-plugin/marketplace.json` 路径、`$schema`、必填字段均符合 marketplace 文档。
- `marketplace.json` 的相对 `source` 路径格式正确。
- 工具命名采用 `snake_case`，label/description 完整。
- `SKILL.md` frontmatter 的 `name` / `description` 能被 omp 正常解析。

### 7.2 不符合/可改进项

- **认证获取**：直接访问 `ctx.modelRegistry.authStorage.getApiKey(...)`，应改为公开的 `ctx.modelRegistry.getApiKeyForProvider(...)`。
- **Context 类型**：`src/tools.ts` 中手写 `KimiToolContext`，建议从 `CustomToolContext` / `ExtensionContext` 派生。
- **双重入口冲突**：`src/extension.ts` 与 `tools/kimi-datasource.ts` 可能同时注册同名工具，marketplace 安装与本地安装路径重叠时会冲突。
- **`SKILL.md` 冗余字段**：`compatibility` 不被 omp 识别，可移除或改为 `tags`。

### 7.3 无法从官方文档确认项

- **16.x → 17.x 迁移细节**：官方仓库没有 16.x 迁移文档，CHANGELOG 从 17.0.9 才开始系统记录。
- **`authStorage` 直接访问的稳定性**：虽然 17.1.4 源码中 `ModelRegistry.authStorage` 是 `public readonly`，但官方文档和示例均未将其作为推荐公共 API，未来存在可见性调整的可能。

---

*报告结束。*
