import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, test } from "bun:test";
import type { CustomToolAPI, CustomToolContext } from "@oh-my-pi/pi-coding-agent";
import factory from "../tools/kimi-datasource";

type ToolText = {
  type: "text";
  text: string;
};

type ToolResult = {
  content: ToolText[];
  isError?: boolean;
};

type CustomTool = {
  name: string;
  label: string;
  description: string;
  parameters: unknown;
  execute: (
    toolCallId: string,
    params: Record<string, unknown>,
    onUpdate: unknown,
    ctx: CustomToolContext,
    signal: AbortSignal | undefined,
  ) => Promise<ToolResult>;
};

const originalFetch = globalThis.fetch;
const tempDirs: string[] = [];

function mockFetch(handler: typeof fetch): void {
  // @ts-expect-error override global fetch in tests
  globalThis.fetch = handler;
}

function fakePi(): CustomToolAPI {
  const schema = {
    describe() {
      return schema;
    },
  };
  return {
    cwd: process.cwd(),
    exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
    ui: {} as CustomToolAPI["ui"],
    hasUI: false,
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
  } as unknown as CustomToolAPI;
}

function fakeContext(): CustomToolContext {
  return {
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
  } as unknown as CustomToolContext;
}

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "kimi-custom-tool-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("custom tool factory", () => {
  test("工厂返回两个指定名字的工具", () => {
    const tools = factory(fakePi()) as CustomTool[];

    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toEqual(["get_data_source_desc", "call_data_source_tool"]);
  });

  test("get_data_source_desc 自定义工具成功结果追加 trace 行", async () => {
    const tools = factory(fakePi()) as CustomTool[];
    mockFetch(async () => {
      return new Response(
        JSON.stringify({ result: { assistant: [{ type: "text", text: "desc ok" }] } }),
        {
          status: 200,
          headers: { "x-request-id": "req-ct-1" },
        },
      );
    });

    const getDesc = tools.find((t) => t.name === "get_data_source_desc");
    const result = await getDesc?.execute("tool-call", { name: "yuandian_law" }, undefined, fakeContext(), undefined);

    expect(result?.content[0]?.text).toContain("desc ok");
    expect(result?.content[0]?.text).toContain("[kimi-datasource] request-id: req-ct-1 · tool-call-id:");
  });

  test("call_data_source_tool 自定义工具对 filepath 未落盘追加告警和 trace", async () => {
    const tools = factory(fakePi()) as CustomTool[];
    const expectedPath = join(tempDir(), "law.csv");
    mockFetch(async () => {
      return new Response(
        JSON.stringify({ is_success: true, data_preview: [{ title: "case" }] }),
        {
          status: 200,
        },
      );
    });

    const callTool = tools.find((t) => t.name === "call_data_source_tool");
    const result = await callTool?.execute(
      "tool-call",
      {
        data_source_name: "yuandian_law",
        api_name: "search_cases",
        params: { filepath: expectedPath },
      },
      undefined,
      fakeContext(),
      undefined,
    );

    expect(result?.content[0]?.text).toContain(`请求中指定了 file_path=${expectedPath}`);
    expect(result?.content[0]?.text).toContain("已写入的文件：无");
  });
});
