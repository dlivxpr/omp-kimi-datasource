import type { CustomToolContext, ExtensionAPI, ToolDefinition } from "@oh-my-pi/pi-coding-agent";
import { getKimiToken } from "./auth";
import { callGateway, GatewayError } from "./client";
import { appendTrace, expectedResponseFilePath, extractText, writeFiles } from "./utils";

export type KimiToolLogger = Pick<ExtensionAPI["logger"], "error" | "warn">;

export type KimiToolContext = Pick<CustomToolContext, "modelRegistry" | "sessionManager">;

export type KimiToolParameters = ToolDefinition["parameters"];

export type KimiDatasourceToolSpec = {
  name: "get_data_source_desc" | "call_data_source_tool";
  label: string;
  description: string;
  parameters: KimiToolParameters;
  execute(
    toolCallId: string,
    params: Record<string, unknown>,
    signal: AbortSignal | undefined,
    ctx: KimiToolContext,
  ): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }>;
};
export function createKimiDatasourceTools(
  pi: Pick<ExtensionAPI, "zod">,
  logger: KimiToolLogger,
): KimiDatasourceToolSpec[] {
  return [
    {
      name: "get_data_source_desc",
      label: "Describe Data Source",
      description:
        "Get the current API documentation for one Kimi data source before calling a specific API. " +
        "For a simple lookup, choose exactly one specialized source; do not inspect fallback or comparison sources unless the user explicitly asks for a cross-source comparison. " +
        "This tool provides structured, batch, domain-specific data-source API docs; it does not replace general web search or real-time news.",
      parameters: pi.zod.object({
        name: pi.zod.string().describe(
          "Data source name. Must be one of: stock_finance_data, yahoo_finance, world_bank_open_data, " +
          "tianyancha, arxiv, scholar, yuandian_law, wind, imf, gildata, sec_edgar, sp_data, " +
          "china_nda, china_nbs, china_standards, who, fao, unsd, ecb, eurostat, unicef, oecd, fred, xhcj, caixin, " +
          "chembl, materials_project, ncbi_blast, oqmd, pdb, pubchem, uniprot, dongcai, cls, finance_research. " +
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
          "caixin = Caixin database (600+ data APIs, discover via caixin_api_search first); " +
          "chembl = curated ChEMBL compounds, targets, assays, bioactivities, and mechanisms of action; " +
          "materials_project = Materials Project DFT properties and MP ID lookup (requires MP_API_KEY); " +
          "ncbi_blast = asynchronous nucleotide/protein sequence similarity searches; " +
          "oqmd = OQMD DFT material properties and OPTIMADE crystal structures; " +
          "pdb = RCSB PDB experimental 3D structures, polymer entities, and ligands; " +
          "pubchem = PubChem chemical identities, synonyms, computed properties, and 2D similarity; " +
          "uniprot = UniProtKB protein sequences, annotations, and cross-database ID mapping; " +
          "dongcai = Eastmoney financial data, market analysis, and research report generation; " +
          "cls = CLS financial telegraphs and in-depth news; " +
          "finance_research = domestic and international sell-side research reports."
        ),
      }),
      async execute(_toolCallId, params, signal, ctx) {
        try {
          const token = await getKimiToken(ctx, signal);
          const { payload, trace } = await callGateway(
            token,
            "get_data_source_desc",
            { name: (params as Record<string, unknown>).name },
            signal,
            () => getKimiToken(ctx, signal),
          );
          return {
            content: [{ type: "text" as const, text: appendTrace(extractText(payload), trace) }],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const trace = err instanceof GatewayError ? err.trace : undefined;
          logger.error("get_data_source_desc 失败", { message });
          return {
            content: [{ type: "text" as const, text: appendTrace(`查询数据源描述失败：${message}`, trace) }],
            isError: true,
          };
        }
      },
    },
    {
      name: "call_data_source_tool",
      label: "Call Data Source",
      description:
        "Dispatch one call to the data source selected for the user's request. " +
        "Always call get_data_source_desc(name) first, then use an api_name and params from that description. " +
        "For a simple lookup, use one specialized source and stop once a result covers the user's question; " +
        "do not query fallback or comparison sources unless the user explicitly asks for a cross-source comparison. " +
        "When the user names a data source, use that source. " +
        "This tool provides structured, batch, domain-specific data queries; it does not replace general web search or real-time news.",
      parameters: pi.zod.object({
        data_source_name: pi.zod.string().describe(
          "The data source selected via get_data_source_desc. When the user names a source, pass that source."
        ),
        api_name: pi.zod.string().describe(
          "API name. Do not guess from memory; it must be obtained from the docs returned by get_data_source_desc."
        ),
        params: pi.zod.record(pi.zod.string(), pi.zod.unknown()).describe(
          "Parameter object for the API. Keys must match the schema in the get_data_source_desc docs. " +
          "Most APIs require a file_path; use an absolute path like /tmp/<scenario>_<timestamp>.csv."
        ),
      }),
      async execute(_toolCallId, params, signal, ctx) {
        try {
          const typedParams = params as {
            data_source_name?: unknown;
            api_name?: unknown;
            params?: Record<string, unknown>;
          };
          const token = await getKimiToken(ctx, signal);
          const { payload, trace } = await callGateway(
            token,
            "call_data_source_tool",
            {
              data_source_name: typedParams.data_source_name,
              api_name: typedParams.api_name,
              params: typedParams.params,
            },
            signal,
            () => getKimiToken(ctx, signal),
          );

          const expectedPath = expectedResponseFilePath(typedParams.params ?? {});
          const writtenPaths = writeFiles(payload, expectedPath, logger);
          let resultText = extractText(payload);

          if (expectedPath && !writtenPaths.includes(expectedPath)) {
            const hasSplit = writtenPaths.some(
              (p) =>
                p === expectedPath.replace(".csv", "_a.csv") ||
                p === expectedPath.replace(".csv", "_hk.csv"),
            );
            if (!hasSplit) {
              resultText = `${resultText}\n\n⚠️ 警告：请求中指定了 file_path=${expectedPath}，但未观察到该路径的文件已落盘。已写入的文件：${writtenPaths.length > 0 ? writtenPaths.join(", ") : "无"}`;
            }
          }

          if (writtenPaths.length > 0 && !resultText.includes("完整数据已落盘")) {
            resultText = `${resultText}\n\n完整数据已落盘：${writtenPaths.join(", ")}`;
          }

          return {
            content: [{ type: "text" as const, text: appendTrace(resultText, trace) }],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const trace = err instanceof GatewayError ? err.trace : undefined;
          logger.error("call_data_source_tool 失败", { message });
          return {
            content: [{ type: "text" as const, text: appendTrace(`调用数据源工具失败：${message}`, trace) }],
            isError: true,
          };
        }
      },
    },
  ];
}
