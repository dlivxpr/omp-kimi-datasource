import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent";
import { createKimiDatasourceTools } from "../src/tools";

const factory: CustomToolFactory = (pi) =>
  createKimiDatasourceTools(pi, pi.logger).map((tool) => ({
    name: tool.name,
    label: tool.label,
    description: tool.description,
    parameters: tool.parameters,
    async execute(toolCallId, params, _onUpdate, ctx, signal) {
      return tool.execute(toolCallId, params as Record<string, unknown>, signal, ctx);
    },
  }));

export default factory;
