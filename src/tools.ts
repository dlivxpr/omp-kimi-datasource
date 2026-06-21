import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import type { ZodType } from "zod/v4";
import { getKimiToken } from "./auth";
import { callGateway, GatewayError } from "./client";
import { appendTrace, expectedResponseFilePath, extractText, writeFiles } from "./utils";

export type KimiToolLogger = Pick<ExtensionAPI["logger"], "error" | "warn">;

export type KimiToolContext = {
  modelRegistry: {
    authStorage: {
      getApiKey(provider: string, sessionId: string, options: { signal?: AbortSignal }): Promise<string | undefined>;
    };
  };
  sessionManager: {
    getSessionId(): string;
  };
};

export interface KimiToolParameters extends ZodType {}

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
        "Query what an external data source can do and return its API documentation in Markdown format. " +
        "Before calling call_data_source_tool, you must use this tool first to learn which APIs the data source provides and what parameters each API requires. " +
        "Supported data sources: stock_finance_data (A/HK/US stocks), yahoo_finance (global finance), " +
        "world_bank_open_data (macroeconomics), tianyancha (Chinese enterprise registry), arxiv (preprints), scholar (academic search), " +
        "yuandian_law (Chinese laws/regulations and judicial cases). " +
        "This tool provides structured, batch, domain-specific data-source API docs; it does not replace general web search or real-time news.",
      parameters: pi.zod.object({
        name: pi.zod.string().describe(
          "Data source name, e.g. 'stock_finance_data', 'tianyancha', 'arxiv', 'scholar', 'yahoo_finance', 'world_bank_open_data', 'yuandian_law'"
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
        "Invoke any API of any data source through the Kimi Code gateway (includes real-time quotes, historical data, search, etc.). " +
        "You must first call get_data_source_desc(name) to learn the available APIs and their parameter schemas before constructing this call. " +
        "The params object usually needs a file_path (e.g. /tmp/xxx.csv); the gateway writes the full result to that path. " +
        "This tool provides structured, batch, domain-specific data queries; it does not replace general web search or real-time news.",
      parameters: pi.zod.object({
        data_source_name: pi.zod.string().describe(
          "Data source name, e.g. 'stock_finance_data', 'tianyancha', 'arxiv', 'yuandian_law', etc."
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
