import { Type } from "@sinclair/typebox";
import type { PiAPI } from "@oh-my-pi/pi-coding-agent";
import { getKimiToken } from "../../src/auth";
import { callGateway } from "../../src/client";
import { extractText } from "../../src/utils";

export default function createTool(pi: PiAPI) {
  return {
    name: "get_data_source_desc",
    label: "获取数据源描述",
    description:
      "查询某个外部数据源能做什么，返回 Markdown 格式的 API 文档。" +
      "在调用 call_data_source_tool 前，必须先调用此工具了解该数据源有哪些 API、每个 API 需要什么参数。" +
      "支持的数据源包括：stock_finance_data（A股/港股/美股）、yahoo_finance（全球金融）、" +
      "world_bank_open_data（宏观经济）、tianyancha（中国企业工商）、arxiv（论文预印本）、scholar（学术搜索）。",
    parameters: Type.Object({
      name: Type.String({
        description:
          "数据源名称，例如 'stock_finance_data'、'tianyancha'、'arxiv'、'scholar'、'yahoo_finance'、'world_bank_open_data'",
      }),
    }),
    async execute(args: { name: string }) {
      const token = await getKimiToken(pi);
      const response = await callGateway(token, "get_data_source_desc", {
        name: args.name,
      });
      return {
        content: [{ type: "text" as const, text: extractText(response) }],
      };
    },
  };
}
