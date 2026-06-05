import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { getKimiToken } from "./auth";
import { callGateway } from "./client";
import { extractText, writeFiles } from "./utils";

export default function activate(pi: ExtensionAPI) {
  pi.registerTool({
    name: "get_data_source_desc",
    label: "获取数据源描述",
    description:
      "查询某个外部数据源能做什么，返回 Markdown 格式的 API 文档。" +
      "在调用 call_data_source_tool 前，必须先调用此工具了解该数据源有哪些 API、每个 API 需要什么参数。" +
      "支持的数据源包括：stock_finance_data（A股/港股/美股）、yahoo_finance（全球金融）、" +
      "world_bank_open_data（宏观经济）、tianyancha（中国企业工商）、arxiv（论文预印本）、scholar（学术搜索）。" +
      "本工具提供结构化、批量、领域专属的数据源 API 文档，不替代通用 Web 搜索或实时新闻。",
    parameters: pi.zod.object({
      name: pi.zod.string().describe(
        "数据源名称，例如 'stock_finance_data'、'tianyancha'、'arxiv'、'scholar'、'yahoo_finance'、'world_bank_open_data'"
      ),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      try {
        const token = await getKimiToken(ctx, signal);
        const response = await callGateway(
          token,
          "get_data_source_desc",
          { name: params.name },
          signal
        );
        return {
          content: [{ type: "text" as const, text: extractText(response) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        pi.logger.error("get_data_source_desc 失败", { message });
        return {
          content: [{ type: "text" as const, text: `查询数据源描述失败：${message}` }],
        };
      }
    },
  });

  pi.registerTool({
    name: "call_data_source_tool",
    label: "调用数据源工具",
    description:
      "通过 Kimi Code 网关调用任意数据源的任意 API（含实时行情、历史数据、搜索等）。" +
      "必须先调用 get_data_source_desc(name) 了解该数据源的 API 列表和参数要求，再构造此调用。" +
      "params 中通常需要传 file_path（如 /tmp/xxx.csv），网关会把完整结果写入该路径。" +
      "本工具提供结构化、批量、领域专属的数据查询，不替代通用 Web 搜索或实时新闻。",
    parameters: pi.zod.object({
      data_source_name: pi.zod.string().describe(
        "数据源名称，例如 'stock_finance_data'、'tianyancha'、'arxiv' 等"
      ),
      api_name: pi.zod.string().describe(
        "API 名称。不要凭记忆猜测，必须从 get_data_source_desc 返回的文档中获取"
      ),
      params: pi.zod.record(pi.zod.string(), pi.zod.unknown()).describe(
        "传给该 API 的参数对象，键值对必须与 get_data_source_desc 文档中的 schema 一致。" +
        "绝大多数 API 需要 file_path 参数，建议传绝对路径如 /tmp/<场景>_<时间戳>.csv"
      ),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      try {
        const token = await getKimiToken(ctx, signal);
        const response = await callGateway(
          token,
          "call_data_source_tool",
          {
            data_source_name: params.data_source_name,
            api_name: params.api_name,
            params: params.params,
          },
          signal
        );

        const expectedPath = params.params.file_path as string | undefined;
        const writtenPaths = writeFiles(response, expectedPath, pi.logger);
        let resultText = extractText(response);

        // 检查用户期望的 file_path 是否实际落盘
        if (expectedPath && !writtenPaths.includes(expectedPath)) {
          const hasSplit = writtenPaths.some(
            (p) =>
              p === expectedPath.replace(".csv", "_a.csv") ||
              p === expectedPath.replace(".csv", "_hk.csv")
          );
          if (!hasSplit) {
            resultText = `${resultText}\n\n⚠️ 警告：请求中指定了 file_path=${expectedPath}，但未观察到该路径的文件已落盘。已写入的文件：${writtenPaths.length > 0 ? writtenPaths.join(", ") : "无"}`;
          }
        }

        if (writtenPaths.length > 0 && !resultText.includes("完整数据已落盘")) {
          resultText = `${resultText}\n\n完整数据已落盘：${writtenPaths.join(", ")}`;
        }

        return {
          content: [{ type: "text" as const, text: resultText }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        pi.logger.error("call_data_source_tool 失败", { message });
        return {
          content: [{ type: "text" as const, text: `调用数据源工具失败：${message}` }],
        };
      }
    },
  });
}
