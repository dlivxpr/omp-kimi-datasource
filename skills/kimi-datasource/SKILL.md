---
name: kimi-datasource
description: |
  结构化、批量、领域专属的数据源助手。当用户要查股票/财报/技术指标/全球宏观经济/中国企业工商/学术论文 这类外部数据时，使用这个 skill。
  本 plugin 注册了两个工具：
  - `get_data_source_desc(name)`：查某个数据源能做什么，返回 Markdown 文档
  - `call_data_source_tool(data_source_name, api_name, params)`：实际调任意数据源的任意 API（含实时行情）
compatibility:
  - get_data_source_desc
  - call_data_source_tool
---

# kimi-datasource — 结构化数据源助手

## 1. 这个 skill 提供什么能力

本 plugin 后面挂了 6 个外部数据源。每一行的"数据源名"就是你后续传给 `get_data_source_desc(name=...)` 的参数。

| 能力域 | 数据源名 | 典型问题 |
|---|---|---|
| **A股 / 港股 / 美股 行情和财务** | `stock_finance_data` | "茅台现在多少钱"、"宁德时代 2024 年财报"、"腾讯股东"、"杭州的人工智能股票" |
| **Yahoo Finance 全球金融** | `yahoo_finance` | "苹果分析师评级"、"AAPL 期权链"、"标普 500 历年价格" |
| **世界银行宏观经济** | `world_bank_open_data` | "中国历年 GDP"、"印度通胀率"、"各国人口增长对比" |
| **中国企业工商信息** | `tianyancha` | "字节跳动股东"、"比亚迪司法风险"、"宁德时代专利" |
| **arXiv 论文预印本** | `arxiv` | "找 RAG 综述"、"下载 2406.xxxxx" |
| **Google Scholar 学术搜索** | `scholar` | "Hinton 最新论文"、"transformer 综述高引文献" |

**不支持的能力**：通用 Web 搜索 / 实时新闻。问到这类问题，告诉用户当前数据源不覆盖。

## 2. 标准工作流：`get_data_source_desc` → `call_data_source_tool`

后端可用 API 经常会调整，**这份 skill 故意不抄具体的 API 名和参数表**。每次调用前你都应当现场问数据源："你都有什么接口？"

```
1. 根据用户问题，从上表挑出一个 data_source_name
2. 调 get_data_source_desc(name=<上一步选的名字>)
3. 仔细读返回的 Markdown，里面列了：
     - 该数据源整体说明 (含 ticker 格式、全局约束)
     - 每个 API 的描述 / 必填参数 / 可选参数 / 默认值 / 取值范围
4. 选最匹配的 API，按文档拼 params
5. 调 call_data_source_tool(data_source_name=<...>, api_name=<...>, params={...})
6. 读返回结果给用户
```

### 例 1：用户问"茅台最近一年走势"

1. 股票走势 → `stock_finance_data`
2. `get_data_source_desc(name="stock_finance_data")`
3. 从文档里找到"获取历史价格"那个 API，看它要 `ticker / start_date / end_date / file_path` 等
4. 用 web_search 核对 → 茅台 = `600519.SH`
5. `call_data_source_tool("stock_finance_data", "<文档里写的 api>", {ticker: "600519.SH", start_date: "...", end_date: "...", file_path: "/tmp/mao_1y.csv"})`

### 例 2：用户问"找几篇 retrieval augmented generation 的综述"

1. 论文搜索 → `arxiv`（或 `scholar`，arxiv 更适合预印本，scholar 引用更全）
2. `get_data_source_desc(name="arxiv")`
3. 从文档里找到搜索类 API，看它要 `query / file_path / max_results` 等
4. `call_data_source_tool("arxiv", "<文档里写的 api>", {...})`

### 例 3：用户问"字节跳动有哪些股东"

1. 企业工商 → `tianyancha`
2. `get_data_source_desc(name="tianyancha")`
3. 注意：tianyancha 的 API 是动态注册的，文档会指引你**先用搜索类接口找到合适的 API 名，再调用**
4. **必须使用企业全称**（"北京字节跳动科技有限公司"），不要用简称。不知道全称就先用 tianyancha 文档里的"公司搜索"接口查

## 3. 调用前的几条铁律

### 3.1 股票代码必须核对，不能凭记忆猜

A 股 `.SH/.SZ/.BJ`，港股 `.HK`，美股 `.US` 等。用户通常只说中文名（"茅台"、"宁德时代"、"腾讯"），不会给代码。

**调任何股票相关 API 前**，先用 `web_search` / `WebSearch` 一类联网工具确认正确代码 + 后缀。

如果当前环境没有任何联网工具，**让用户亲口确认代码**，不要硬猜。错了的话接口会静默返回错数据或空数据。

### 3.2 企业相关查询必须用全称

`tianyancha` 拒收"特斯拉"、"网易"、"腾讯"这种简称，必须给"北京特斯拉销售有限公司"这种全名。不知道全名时，先调它的公司搜索 API。

### 3.3 多数 API 需要 `file_path`

绝大部分数据源 API 把完整结果以 CSV 形式写到 `file_path`。漏传会报 `Missing required parameters: file_path`。不知道传啥时，给一个 `/tmp/<场景>_<时间戳>.csv` 即可。

**注意**：如果工具返回中出现了 `⚠️ 警告：请求中指定了 file_path=...，但未观察到该路径的文件已落盘`，说明服务端没有返回文件，此时不要声称完整数据已保存，应把 `data_preview` 中的内容作为最终结果回答用户。

### 3.4 一次调用不要堆太多 ticker

`stock_finance_data` 的实时接口最多 3 个 ticker，历史接口最多 10 个。超过会被截断或报错。多了就分批调。

## 4. 怎么读返回结果

`call_data_source_tool` 的返回内容有两处数据：

1. **`data_preview`**：CSV 表头 + 数据行预览，**最多 50 行**，方便你直接答简单问题
2. **完整数据已落盘**：你在 `params` 里传的 `file_path` 所指的 CSV 已由工具写到磁盘（返回文本中也会回显实际写入的路径列表），不再受 50 行限制

策略：
- 用户只问"XX 现在多少钱"、"中国 2023 GDP 多少"这种单值 → `data_preview` 一般够，直接答
- 用户要画图、对比、算盈亏、列清单，或结果超过 50 行 → 用 `read` 工具把落盘的 CSV 读出来再处理
- 混合 A+港股查询时服务端会把结果拆成 `_a.csv` / `_hk.csv`（工具按服务端实际返回的文件名落盘），原 `file_path` 那个文件不会生成；返回文本中会列出实际写入的路径
- 如果返回文本中出现 `⚠️ 警告：未观察到文件已落盘`，说明没有文件生成，不要继续声称"完整数据已落盘"，直接基于 `data_preview` 回答

如果接口返回 `is_success=false`，提示文字一般会写明原因（参数不对 / 不支持 / 数据空等）。把人话原因反馈给用户，不要硬走第二次。

## 5. `watchlist.json` — 用户自选股

skill 目录下的 `watchlist.json` 是用户的自选股列表。用户问"看一下我的自选股"时，读这个文件，再走标准 `get_data_source_desc("stock_finance_data") → call_data_source_tool` 流程查实时行情（文档里的实时接口最多 3 个 ticker 一批，多了分批调）。

格式：
```json
[
  {"code": "600519.SH", "name": "贵州茅台"},
  {"code": "0700.HK", "name": "腾讯控股", "hold_cost": 350.5, "hold_quantity": 100}
]
```

- `code` 和 `name` 必填；`hold_cost` 和 `hold_quantity` 可选
- 两者都有时顺便算盈亏：`(当前价 − hold_cost) × hold_quantity`
- 用户说"帮我加 XX 到自选股"时：先 web_search 核对代码，再追加到 JSON 数组

## 6. 注意事项

- **不要凭记忆猜股票代码 / 企业全称**。错代码会让接口静默返回错数据，用户察觉不到
- **不要在没读 desc 的情况下硬传 `api_name`**。后端会报 `API_NOT_FOUND`。除非这次会话里你已经读过该数据源的 desc 并记得参数
- **不要给投资建议**。给完数据加一句"AI 生成，不构成投资建议"即可
- 如果某个数据源接口返回的报错明显是后端 bug（参数 schema 自相矛盾、内部 Python 报错等），**汇报错误给用户，不要硬试**——这种 bug 我们这边修不了，要后端服务侧改
