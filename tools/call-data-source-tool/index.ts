import { Type } from "@sinclair/typebox";
import type { PiAPI } from "@oh-my-pi/pi-coding-agent";
import { getKimiToken } from "../../src/auth";
import { callGateway } from "../../src/client";
import { extractText, writeFiles } from "../../src/utils";

export default function createTool(pi: PiAPI) {
  return {
    name: "call_data_source_tool",
    label: "调用数据源工具",
    description:
      "通过 Kimi Code 网关调用任意数据源的任意 API（含实时行情、历史数据、搜索等）。" +
      "必须先调用 get_data_source_desc(name) 了解该数据源的 API 列表和参数要求，再构造此调用。" +
      "params 中通常需要传 file_path（如 /tmp/xxx.csv），网关会把完整结果写入该路径。",
    parameters: Type.Object({
      data_source_name: Type.String({
        description:
          "数据源名称，例如 'stock_finance_data'、'tianyancha'、'arxiv' 等",
      }),
      api_name: Type.String({
        description:
          "API 名称。不要凭记忆猜测，必须从 get_data_source_desc 返回的文档中获取",
      }),
      params: Type.Record(Type.String(), Type.Unknown(), {
        description:
          "传给该 API 的参数对象，键值对必须与 get_data_source_desc 文档中的 schema 一致。" +
          "绝大多数 API 需要 file_path 参数，建议传绝对路径如 /tmp/<场景>_<时间戳>.csv",
      }),
    }),
    async execute(args: {
      data_source_name: string;
      api_name: string;
      params: Record<string, unknown>;
    }) {
      const token = await getKimiToken(pi);
      const response = await callGateway(
        token,
        "call_data_source_tool",
        {
          data_source_name: args.data_source_name,
          api_name: args.api_name,
          params: args.params,
        }
      );

      writeFiles(response);

      return {
        content: [{ type: "text" as const, text: extractText(response) }],
      };
    },
  };
}
