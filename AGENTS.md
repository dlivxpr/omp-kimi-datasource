# omp-kimi-datasource 项目上下文

## 项目定位

这是 oh-my-pi 的 Kimi Code 数据源插件。插件注册两个工具：

- `get_data_source_desc(name)`：读取指定数据源的动态 API 文档。
- `call_data_source_tool(data_source_name, api_name, params)`：按文档调用具体数据源 API。

本项目基于 kimi-code 官方 datasource 插件修改而来，上游地址：
https://github.com/MoonshotAI/kimi-code/tree/main/plugins/official/kimi-datasource

这些工具用于结构化、批量、领域专属数据查询；不要把它们当作通用 `web_search` 或实时新闻工具。

## 常用命令

```bash
bun install
bun run typecheck
bun run test        # 等价于 bun test tests/*.test.ts
bun test tests/*.test.ts
omp plugin install .
omp login kimi-code
```

- 使用 `bun`，不要用 `npm`、`yarn`、`pnpm` 或 `npx`。
- `bun run typecheck` 只检查 `src/**/*.ts`。
- `bun run test` 与 `bun test tests/*.test.ts` 等价；测试文件位于 `tests/` 目录。
- 本地/私有仓库安装用 `omp plugin install .`。
- 插件复用 omp 的 Kimi 登录态；缺凭证时提示用户运行 `omp login kimi-code`，不要要求额外 API key。


## 代码结构

- `src/extension.ts`：插件入口，将工具注册到 omp。
- `src/tools.ts`：工具定义共享层，定义 `get_data_source_desc` / `call_data_source_tool` 的 schema、描述和执行逻辑。
- `src/auth.ts`：通过 `ctx.modelRegistry.authStorage.getApiKey("kimi-code", sessionId)` 读取 Kimi 凭证。
- `src/client.ts`：调用 `https://api.kimi.com/coding/v1/tools`，请求体是 `{ method, params }`。
- `src/utils.ts`：提取 Kimi 返回文本，按响应中的 `files` 写入允许路径。
- `tools/kimi-datasource.ts`：omp marketplace 的 custom-tool factory，复用 `src/tools.ts`。
- `.omp-plugin/marketplace.json`：omp marketplace 清单。
- `skills/omp-kimi-datasource/SKILL.md`：面向智能体的使用规则和数据源流程。
- `skills/omp-kimi-datasource/watchlist.json`：用户自选股列表（可编辑）。

## 支持的数据源

调用 `get_data_source_desc(name)` 时，`name` 的合法取值：

| 能力域 | 数据源名 |
|---|---|
| A股 / 港股 / 美股 行情和财务 | `stock_finance_data` |
| Yahoo Finance 全球金融 | `yahoo_finance` |
| 世界银行宏观经济 | `world_bank_open_data` |
| 中国企业工商信息 | `tianyancha` |
| arXiv 论文预印本 | `arxiv` |
| Google Scholar 学术搜索 | `scholar` |
| 中国法律法规 / 司法案例 | `yuandian_law` |

## 关键约束

- 调用数据 API 前必须先用 `get_data_source_desc` 读取该数据源的当前 API 名和参数 schema；不要凭记忆构造 `api_name`。
- `call_data_source_tool.params` 通常需要绝对 `file_path`，例如 `/tmp/<scenario>_<timestamp>.csv`。
- `writeFiles` 只允许写入请求指定的 `file_path`，或同目录、同扩展名、以原文件名加 `_` 前缀的官方拆分文件。
- 如果服务端没有返回文件内容或未观察到文件落盘，不要声称完整数据已保存；基于 `data_preview` 回答。
- 股票代码和企业全称不要凭记忆猜；需要核对后再调用数据源。

## 测试约定

- 测试使用 `bun:test`。
- `tests/client.test.ts` 覆盖 Kimi `/tools` 请求协议、请求头和错误响应。
- `tests/auth.test.ts` 覆盖凭证读取和缺凭证提示。
- `tests/utils.test.ts` 覆盖文本提取、失败响应、文件写入白名单和官方拆分文件。
- `tests/extension.test.ts` 覆盖插件激活与工具注册。
- `tests/custom-tool.test.ts` 覆盖 marketplace custom-tool factory。
- `tests/package.test.ts` 覆盖 `package.json`、`.omp-plugin/marketplace.json` 和 SKILL.md 的命名一致性。

## 修改守则
- 修改工具行为时同步更新 `skills/omp-kimi-datasource/SKILL.md`、README 中的用户可见说明和相关测试。
- 保持工具描述明确区分结构化/批量/领域数据查询与通用搜索。
- 保持 `get_data_source_desc` → `call_data_source_tool` 的两步工作流。
- 不添加兼容别名、旧协议分支或未被测试覆盖的兜底路径。
