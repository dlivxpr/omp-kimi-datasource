import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { createKimiDatasourceTools } from "./tools";

export default function activate(pi: ExtensionAPI) {
  for (const tool of createKimiDatasourceTools(pi, pi.logger)) {
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
