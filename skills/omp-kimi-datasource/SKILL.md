---
name: omp-kimi-datasource
description: |
  结构化、批量、领域专属的数据源助手。当用户要查股票/财报/技术指标/Wind/美股SEC披露/S&P基本面/全球宏观经济(世行/IMF/FRED/国家统计局)/中国政府开放数据/国家标准与行业标准/WHO/FAO/OECD/中国企业工商/学术论文/中国法律法规与司法案例/新华财经与财新资讯/化学与生物信息(ChEMBL/PubChem/BLAST/PDB/UniProt)/材料科学(Materials Project/OQMD)/卖方研报与财联社快讯这类外部数据时，使用这个 skill。
  本 plugin 注册了两个工具：
  - `get_data_source_desc(name)`：查某个数据源能做什么，返回 Markdown 文档
  - `call_data_source_tool(data_source_name, api_name, params)`：按文档调用具体数据源 API（含实时行情）
---

# omp-kimi-datasource — 结构化数据源助手

## 1. 这个 skill 提供什么能力

本 plugin 后面挂了 35 个外部数据源。每一行的"数据源名"就是你后续传给 `get_data_source_desc(name=...)` 的参数。

| 能力域 | 数据源名 | 典型问题 |
|---|---|---|
| **A股 / 港股 / 美股 行情和财务** | `stock_finance_data` | "茅台现在多少钱"、"宁德时代 2024 年财报"、"腾讯股东"、"杭州的人工智能股票" |
| **Yahoo Finance 全球金融** | `yahoo_finance` | "苹果分析师评级"、"AAPL 期权链"、"苹果前十大机构股东" |
| **世界银行历史宏观** | `world_bank_open_data` | "中国历年 GDP"、"印度通胀率"、"各国人口增长对比" |
| **中国企业工商信息** | `tianyancha` | "字节跳动股东"、"比亚迪司法风险"、"宁德时代专利" |
| **arXiv 论文预印本** | `arxiv` | "找 RAG 综述"、"下载 2406.xxxxx" |
| **Google Scholar 学术搜索** | `scholar` | "Hinton 最新论文"、"transformer 综述高引文献" |
| **中国法律法规 / 司法案例** | `yuandian_law` | "民法典关于居住权的规定"、"帮我查劳动合同解除的相关法条"、"找几个不当得利的判例" |
| **Wind 万得（A股/基金/债券/宏观）** | `wind` | "茅台今天的分钟线"、"十年期国债收益率走势"、"基金净值查询" |
| **IMF 国际宏观（汇率 / CPI / 预测）** | `imf` | "美元兑人民币汇率"、"各国 GDP 增速预测"、"全球通胀率对比" |
| **恒生聚源智能筛选** | `gildata` | "筛选净利润增速超 30% 且 ROE 大于 15% 的股票"、"基金经理筛选" |
| **美股 SEC 披露文件** | `sec_edgar` | "特斯拉 10-K 年报"、"苹果 10-Q 季报"、"Form 4 内部人交易"、"13F 机构持仓" |
| **S&P Capital IQ 美股基本面** | `sp_data` | "苹果分析师一致预期"、"美股估值比率对比"、"竞争对手关系" |
| **中国政府开放数据目录** | `china_nda` | "国家数据局公共数据资源登记目录"、"查询浙江省公共数据开放平台有哪些数据集" |
| **国家统计局宏观指标** | `china_nbs` | "国家统计局历年 GDP 官方数据"、"全国月度 CPI/PPI 走势"、"各省历年城镇就业人数" |
| **中国标准查询** | `china_standards` | "GB/T 19001 最新版标准文本"、"汽车行业标准 QC/T 现行状态"、"DB11 地方标准" |
| **世界卫生组织公开数据** | `who` | "全球各国人均预期寿命"、"全球婴儿死亡率统计"、"WHO 疫苗接种覆盖率" |
| **联合国粮农组织数据** | `fao` | "全球小麦产量趋势"、"各国农产品价格指数"、"全球耕地面积统计" |
| **联合国统计司 UNdata** | `unsd` | "联合国成员国统计年鉴数据"、"全球国际贸易统计"、"各国人口统计" |
| **欧洲中央银行统计** | `ecb` | "欧洲央行主要再融资利率"、"欧元区 M1/M2/M3 货币供应量" |
| **欧盟统计局数据** | `eurostat` | "欧盟各成员国失业率"、"欧元区调和消费者物价指数 (HICP)" |
| **联合国儿童基金会数据** | `unicef` | "全球儿童营养不良率"、"各国儿童失学率统计"、"儿童麻疹疫苗接种率" |
| **经合组织 OECD 数据** | `oecd` | "OECD 成员国人均 GDP 对比"、"各国公共教育支出占 GDP 比重"、"劳动力市场数据" |
| **FRED 宏观经济数据** | `fred` | "美国长周期 CPI 指数"、"美联储联邦基金有效利率 (EFFR)"、"美国失业率走势" |
| **新华财经资讯与公告** | `xhcj` | "新华财经 7x24 快讯"、"A股上市公司最新公告"、"最新宏观与产业政策解读" |
| **财新数据库** | `caixin` | "财新数据接口查询"、"财新专有高频金融数据库取数" |
| **ChEMBL 生物活性 / 药物机制** | `chembl` | "伊马替尼对 ABL1 的 IC50/Ki 和作用机制" |
| **Materials Project 材料计算** | `materials_project` | "筛选含 Fe、O 且带隙为 1–3 eV 的稳定材料" |
| **NCBI BLAST 序列相似性** | `ncbi_blast` | "用 blastp 搜索这段蛋白序列的同源命中" |
| **OQMD 材料性质 / 晶体结构** | `oqmd` | "查 Fe2O3 的形成能、带隙和晶体结构" |
| **RCSB PDB 实验三维结构** | `pdb` | "1TUP 的实验方法、分辨率和聚合物链" |
| **PubChem 化合物身份 / 性质 / 相似性** | `pubchem` | "查阿司匹林 CID、分子量和结构相似化合物" |
| **UniProt 蛋白序列 / 注释 / ID 映射** | `uniprot` | "查人源 TP53 的序列与功能注释，并映射到 PDB" |
| **东方财富妙想金融数据 / 分析 / 报告** | `dongcai` | "分析茅台的基本面和估值，生成首次覆盖深度研报" |
| **财联社快讯 / 深度要闻** | `cls` | "汇总过去两小时的财联社快讯和股市要闻" |
| **国内外卖方研报检索** | `finance_research` | "检索 2025 年以来中国半导体行业的卖方研报" |

### 选源原则

1. **用户点名了数据源** → 直接用指定的源。
2. **没点名** → 按能力域从上表选最匹配的一个；结合下面的"能力边界参考"和用户问题的深度、范围自行判断。
3. **一次简单查询只选一个数据源**，不要并行读取其他源的 desc。选定的源成功返回且已经覆盖用户问题后，立即回答；不要为了补充字段、重新格式化或交叉验证继续调用其他 API。只有用户明确要求跨源对比时，才能查询第二个数据源。

### 能力边界参考（客观事实，选源时考虑）

- `yahoo_finance` 的外汇历史最多约 2 年；`imf` 提供长期的汇率、CPI、GDP 预测和国际收支序列
- `stock_finance_data` 的行情是实时/收盘快照；分钟级分时序列在 `wind`（另有基金、债券、国债收益率）
- 股东 / 机构持仓：`yahoo_finance`、`sec_edgar`（13F）、`sp_data`（S&P 标准化持有人）都覆盖，口径和深度不同
- `world_bank_open_data` 是 50 年以上的历史宏观序列；要 IMF 的预测值用 `imf`
- `gildata` 的查询输入是自然语言条件（选股 / 选基金 / 基金经理筛选），`tianyancha` 是企业工商档案
- `wind` 的 `indexes`/`indicators` 参数要求 Wind 原生字段名；PE/PB/ROE/总市值这类常用字段先调 `wind_search_fields` 映射（支持别名和中文，一次查一个），不要硬猜字段名
- **中国官方宏观口径划分**：`china_nbs` 是国家统计局宏观指标时间序列（GDP/CPI/PPI 等，全国/省/主要城市），`china_nda` 是国家数据局开放数据目录（回答“有哪些数据集可用”）；`world_bank_open_data` 和 `imf` 属于国际口径
- **国际组织数据源直接路由**：WHO、FAO、UNSD、ECB、Eurostat、UNICEF、OECD、FRED 各自作为独立数据源直接按机构名称选用；IMF 自有数据（汇率/CPI/预测）走 `imf`
- **标准与法律严格区分**：国家标准（GB）、行业标准（HB）、地方标准（DB）、团体标准（TT）使用 `china_standards`；法律法规与司法判例使用 `yuandian_law`，两者不得混淆
- **资讯与动态接口发现**：新华财经（`xhcj`）侧重公告、快讯与政策；`caixin` 覆盖 600+ 接口，必须先调用 `caixin_api_search` 发现可用接口后再取数
- **化学与生物源分工**：`chembl` 查策展生物活性和作用机制；`pubchem` 查化合物身份、计算性质和 2D 结构相似性，两者不要混用
- **结构 / 序列 / 比对分工**：`pdb` 是实验三维结构条目；`uniprot` 是蛋白序列、功能注释和跨库 ID 映射；`ncbi_blast` 是异步序列相似性搜索，提交后需用 RID 获取结果
- **材料源分工**：`materials_project` 支持 MP ID 和成分 / 性质筛选，需要 `MP_API_KEY`；`oqmd` 另有 OPTIMADE 晶体结构查询，其结构 ID 与原生 API 的 entry ID 不通用
- **金融资讯与研报分工**：`dongcai` 覆盖结构化金融数据、专项诊断和报告生成；`finance_research` 用于国内外卖方研报检索；`cls` 只覆盖财联社快讯和深度要闻

**不支持的能力**：通用 Web 搜索，以及 xhcj / caixin / cls / dongcai 覆盖范围之外的实时新闻。问到这类问题，告诉用户当前数据源不覆盖。

## 2. 标准工作流：`get_data_source_desc` → `call_data_source_tool`

后端可用 API 经常会调整，**这份 skill 故意不抄具体的 API 名和参数表**。每次调用前你都应当现场问数据源："你都有什么接口？"

```
1. 根据用户问题，从上表只挑一个 data_source_name
2. 调 get_data_source_desc(name=<上一步选的名字>)
3. 仔细读返回的 Markdown，里面列了：
     - 该数据源整体说明 (含 ticker 格式、全局约束)
     - 每个 API 的描述 / 必填参数 / 可选参数 / 默认值 / 取值范围
4. 选最匹配的 API，按文档拼 params
5. 调 call_data_source_tool(data_source_name=<...>, api_name=<...>, params={...})；结果成功且已经覆盖问题时停止调用。注意：caixin_api_search、wind_search_fields、tianyancha 公司搜索等前置发现类调用不受单次调用限制，需继续调至真正的取数 API
6. 读返回结果，用用户提问时使用的语言回答
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

### 3.3 文件参数以数据源文档为准

需要 `file_path` 的 API 会把完整结果写到指定路径（部分源使用 `filepath`）。漏传必填的文件参数会报 `Missing required parameters`。不知道传啥时，可给 `/tmp/<场景>_<时间戳>.csv`；会生成 CSV / PDF / DOCX 的接口若提供文件参数，应显式给出目标路径，以便插件保存附件。直接返回 JSON 或文本的接口不要强行补文件参数，以 desc 的参数表为准。

**注意**：如果工具返回中出现了 `⚠️ 警告：请求中指定了 file_path=...，但未观察到该路径的文件已落盘`，说明服务端没有返回文件，此时不要声称完整数据已保存，应把 `data_preview` 中的内容作为最终结果回答用户。

### 3.4 一次调用不要堆太多 ticker

`stock_finance_data` 的实时接口最多 3 个 ticker，历史接口最多 10 个。超过会被截断或报错。多了就分批调。

## 4. 怎么读返回结果

对输出 CSV 的 API，`call_data_source_tool` 的返回内容有两处数据：

1. **`data_preview`**：CSV 表头 + 数据行预览，**最多 50 行**，方便你直接答简单问题
2. **完整数据已落盘**：你在 `params` 里传的 `file_path` 所指的 CSV 已由工具写到磁盘（返回文本中也会回显实际写入的路径列表），不再受 50 行限制

直接返回 JSON / 文本的 API 读取正文即可；生成 PDF / DOCX 等报告时，确认附件路径和保存结果。

策略：
- 用户只问"XX 现在多少钱"、"中国 2023 GDP 多少"这种单值 → `data_preview` 一般够，直接答
- 用户要画图、对比、算盈亏、列清单，或结果超过 50 行 → 用 `read` 工具把落盘的 CSV 读出来再处理
- 混合 A+港股查询时服务端会把结果拆成 `_a.csv` / `_hk.csv`（工具按服务端实际返回的文件名落盘），原 `file_path` 那个文件不会生成；返回文本中会列出实际写入的路径
- 如果返回文本中出现 `⚠️ 警告：请求中指定了 file_path=...，但未观察到该路径的文件已落盘`，说明没有文件生成，不要继续声称"完整数据已落盘"，直接基于 `data_preview` 回答
  - `file_path` 和 `filepath` 都会触发同样的落盘检查
- 返回末尾形如 `[kimi-datasource] request-id: ... · tool-call-id: ...` 或 `[kimi-datasource] tool-call-id: ...` 的 trace 行只用于后端排障关联，不是数据结果，不要把它当作查询结论

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
- 回答用户时使用用户提问时使用的语言；用户用中文问就用中文答，用户用英文问就用英文答
