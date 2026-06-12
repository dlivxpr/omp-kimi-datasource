import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, test } from "bun:test";
import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";
import activate from "../src/extension";

type ToolText = {
  type: "text";
  text: string;
};

type ToolResult = {
  content: ToolText[];
  isError?: boolean;
};

type RegisteredTool = {
  name: string;
  description: string;
  execute: (
    toolCallId: string,
    params: Record<string, unknown>,
    signal: AbortSignal | undefined,
    onUpdate: unknown,
    ctx: ExtensionContext,
  ) => Promise<ToolResult>;
};

type FakePi = ExtensionAPI & {
  tools: RegisteredTool[];
};

const originalFetch = globalThis.fetch;
const tempDirs: string[] = [];

function mockFetch(handler: typeof fetch): void {
  // @ts-expect-error override global fetch in tests
  globalThis.fetch = handler;
}

function fakePi(): FakePi {
  const tools: RegisteredTool[] = [];
  const schema = {
    describe() {
      return schema;
    },
  };
  const pi = {
    tools,
    registerTool(tool: RegisteredTool) {
      tools.push(tool);
    },
    zod: {
      object() {
        return schema;
      },
      string() {
        return schema;
      },
      record() {
        return schema;
      },
      unknown() {
        return schema;
      },
    },
    logger: {
      error() {},
      warn() {},
    },
  };
  return pi as unknown as FakePi;
}

function fakeContext(): ExtensionContext {
  const context = {
    modelRegistry: {
      authStorage: {
        async getApiKey() {
          return "omp-token";
        },
      },
    },
    sessionManager: {
      getSessionId() {
        return "session-id";
      },
    },
  };
  return context as unknown as ExtensionContext;
}

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "kimi-extension-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("activate", () => {
  test("注册的工具描述包含 yuandian_law", () => {
    const pi = fakePi();

    activate(pi);

    const getDesc = pi.tools.find((tool) => tool.name === "get_data_source_desc");
    const callTool = pi.tools.find((tool) => tool.name === "call_data_source_tool");
    expect(getDesc?.description).toContain("yuandian_law");
    expect(callTool?.description).toContain("Kimi Code gateway");
  });

  test("get_data_source_desc 成功结果追加 trace 行", async () => {
    const pi = fakePi();
    activate(pi);
    mockFetch(async () => {
      return new Response(JSON.stringify({ result: { assistant: [{ type: "text", text: "desc ok" }] } }), {
        status: 200,
        headers: { "x-request-id": "req-1" },
      });
    });

    const getDesc = pi.tools.find((tool) => tool.name === "get_data_source_desc");
    const result = await getDesc?.execute("tool-call", { name: "yuandian_law" }, undefined, undefined, fakeContext());

    expect(result?.content[0]?.text).toContain("desc ok");
    expect(result?.content[0]?.text).toContain("[kimi-datasource] request-id: req-1 · tool-call-id:");
  });

  test("call_data_source_tool 对 filepath 未落盘追加告警和 trace", async () => {
    const pi = fakePi();
    const expectedPath = join(tempDir(), "law.csv");
    activate(pi);
    mockFetch(async () => {
      return new Response(JSON.stringify({ is_success: true, data_preview: [{ title: "case" }] }), {
        status: 200,
        headers: { "x-request-id": "req-2" },
      });
    });

    const callTool = pi.tools.find((tool) => tool.name === "call_data_source_tool");
    const result = await callTool?.execute(
      "tool-call",
      {
        data_source_name: "yuandian_law",
        api_name: "search_cases",
        params: { filepath: expectedPath },
      },
      undefined,
      undefined,
      fakeContext(),
    );

    expect(result?.content[0]?.text).toContain(`请求中指定了 file_path=${expectedPath}`);
    expect(result?.content[0]?.text).toContain("已写入的文件：无");
    expect(result?.content[0]?.text).toContain("[kimi-datasource] request-id: req-2 · tool-call-id:");
  });

  test("GatewayError 错误路径返回 isError 并保留 trace", async () => {
    const pi = fakePi();
    activate(pi);
    mockFetch(async () => {
      return new Response("bad gateway", {
        status: 502,
        statusText: "Bad Gateway",
        headers: { "x-request-id": "req-error" },
      });
    });

    const callTool = pi.tools.find((tool) => tool.name === "call_data_source_tool");
    const result = await callTool?.execute(
      "tool-call",
      {
        data_source_name: "yuandian_law",
        api_name: "search_cases",
        params: {},
      },
      undefined,
      undefined,
      fakeContext(),
    );

    expect(result?.isError).toBe(true);
    expect(result?.content[0]?.text).toContain("调用数据源工具失败：Kimi API 错误: 502 Bad Gateway bad gateway");
    expect(result?.content[0]?.text).toContain("[kimi-datasource] request-id: req-error · tool-call-id:");
  });
});
