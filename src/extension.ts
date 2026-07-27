import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { createKimiDatasourceTools } from "./tools";

export default function activate(pi: ExtensionAPI) {
  const existing = new Set(pi.getAllTools());
  for (const tool of createKimiDatasourceTools(pi, pi.logger)) {
    if (existing.has(tool.name)) {
      pi.logger.warn(`工具 "${tool.name}" 已注册（可能来自 marketplace custom-tool），跳过 extension 注册以避免名称冲突。`);
      continue;
    }
    pi.registerTool({
      name: tool.name,
      label: tool.label,
      description: tool.description,
      parameters: tool.parameters,
      async execute(toolCallId, params, signal, _onUpdate, ctx) {
        return tool.execute(toolCallId, params as Record<string, unknown>, signal, ctx);
      },
    });
  }
}
