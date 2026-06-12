import { afterEach, describe, expect, test } from "bun:test";
import { callGateway, GatewayError } from "../src/client";

const originalFetch = globalThis.fetch;
const envNames = [
  "KIMI_DATASOURCE_API_URL",
  "KIMI_CODE_BASE_URL",
  "KIMI_MSH_PLATFORM",
  "KIMI_MSH_VERSION",
  "KIMI_MSH_DEVICE_NAME",
  "KIMI_MSH_DEVICE_MODEL",
  "KIMI_MSH_OS_VERSION",
  "KIMI_MSH_DEVICE_ID",
] as const;
const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));

function mockFetch(handler: typeof fetch): void {
  // @ts-expect-error override global fetch in tests
  globalThis.fetch = handler;
}

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

function restoreEnv(): void {
  for (const [name, value] of originalEnv) {
    setEnv(name, value);
  }
}

function setEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function headerValue(headers: HeadersInit | undefined, name: string): string | null {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  if (Array.isArray(headers)) {
    const found = headers.find(([key]) => key.toLowerCase() === name.toLowerCase());
    return found?.[1] ?? null;
  }
  return headers[name] ?? null;
}

afterEach(() => {
  restoreFetch();
  restoreEnv();
});

describe("callGateway", () => {
  test("get_data_source_desc 使用官方 /tools 协议", async () => {
    let requestBody: Record<string, unknown> | undefined;
    let requestHeaders: HeadersInit | undefined;

    mockFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.kimi.com/coding/v1/tools");
      requestBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      requestHeaders = init?.headers;
      return new Response(JSON.stringify({ result: { assistant: [{ type: "text", text: "数据源描述结果" }] } }), {
        status: 200,
        headers: { "Content-Type": "application/json", "x-request-id": "req-1" },
      });
    });

    const result = await callGateway("fake-token", "get_data_source_desc", { name: "stock_finance_data" });

    expect(requestBody).toEqual({
      method: "get_data_source_desc",
      params: { name: "stock_finance_data" },
    });
    expect(requestBody).not.toHaveProperty("tool");
    expect(requestBody).not.toHaveProperty("arguments");
    expect(headerValue(requestHeaders, "Authorization")).toBe("Bearer fake-token");
    expect(headerValue(requestHeaders, "X-Msh-Platform")).toBe("kimi-code-cli");
    expect(headerValue(requestHeaders, "User-Agent")).toBe("kimi-datasource/3.2.0");
    expect(result.payload).toEqual({ result: { assistant: [{ type: "text", text: "数据源描述结果" }] } });
    expect(result.trace.requestId).toBe("req-1");
    expect(result.trace.toolCallId).toBe(headerValue(requestHeaders, "X-Msh-Tool-Call-Id"));
  });

  test("KIMI_MSH 环境变量覆盖请求头并清理非 ASCII", async () => {
    process.env.KIMI_MSH_PLATFORM = " custom-platform ";
    process.env.KIMI_MSH_VERSION = " 9.9.9 ";
    process.env.KIMI_MSH_DEVICE_NAME = "设备";
    process.env.KIMI_MSH_DEVICE_MODEL = " Módel X ";
    process.env.KIMI_MSH_OS_VERSION = " 14.0 ";
    process.env.KIMI_MSH_DEVICE_ID = " device-1 ";
    let requestHeaders: HeadersInit | undefined;

    mockFetch(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestHeaders = init?.headers;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await callGateway("fake-token", "get_data_source_desc", { name: "stock_finance_data" });

    expect(headerValue(requestHeaders, "X-Msh-Platform")).toBe("custom-platform");
    expect(headerValue(requestHeaders, "X-Msh-Version")).toBe("9.9.9");
    expect(headerValue(requestHeaders, "X-Msh-Device-Name")).toBe("unknown");
    expect(headerValue(requestHeaders, "X-Msh-Device-Model")).toBe("Mdel X");
    expect(headerValue(requestHeaders, "X-Msh-Os-Version")).toBe("14.0");
    expect(headerValue(requestHeaders, "X-Msh-Device-Id")).toBe("device-1");
  });

  test("call_data_source_tool 使用官方 /tools 协议", async () => {
    let requestBody: Record<string, unknown> | undefined;

    mockFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.kimi.com/coding/v1/tools");
      requestBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      return new Response(JSON.stringify({ is_success: true, data_preview: [{ ticker: "600519.SH" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const params = { ticker: "600519.SH", file_path: "/tmp/stock.csv" };
    const result = await callGateway("fake-token", "call_data_source_tool", {
      data_source_name: "stock_finance_data",
      api_name: "get_historical_stock_prices",
      params,
    });

    expect(requestBody).toEqual({
      method: "call_data_source_tool",
      params: {
        data_source_name: "stock_finance_data",
        api_name: "get_historical_stock_prices",
        params,
      },
    });
    expect(requestBody).not.toHaveProperty("tool");
    expect(requestBody).not.toHaveProperty("arguments");
    expect(result.payload).toEqual({ is_success: true, data_preview: [{ ticker: "600519.SH" }] });
    expect(result.trace.toolCallId).toBeString();
  });

  test("KIMI_DATASOURCE_API_URL 覆盖默认 URL", async () => {
    process.env.KIMI_DATASOURCE_API_URL = " https://example.test/custom-tools ";
    let requestBody: Record<string, unknown> | undefined;
    let toolCallId: string | null = null;

    mockFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://example.test/custom-tools");
      requestBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      toolCallId = headerValue(init?.headers, "X-Msh-Tool-Call-Id");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const result = await callGateway("fake-token", "get_data_source_desc", { name: "yuandian_law" });

    expect(requestBody).toEqual({
      method: "get_data_source_desc",
      params: { name: "yuandian_law" },
    });
    expect(result.trace.toolCallId).toBe(toolCallId);
  });

  test("KIMI_CODE_BASE_URL 追加 /tools", async () => {
    process.env.KIMI_CODE_BASE_URL = "https://example.test/coding/v2/";

    mockFetch(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("https://example.test/coding/v2/tools");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await expect(callGateway("fake-token", "get_data_source_desc", { name: "stock_finance_data" }))
      .resolves.toMatchObject({ payload: { ok: true } });
  });

  test("纯文本成功响应返回字符串 payload", async () => {
    mockFetch(async () => new Response("plain result", { status: 200 }));

    await expect(callGateway("fake-token", "get_data_source_desc", { name: "stock_finance_data" }))
      .resolves.toMatchObject({ payload: "plain result" });
  });

  test("非 200 响应抛出包含响应体片段和 trace 的 GatewayError", async () => {
    mockFetch(async () => {
      return new Response('{"error":{"message":"invalid authentication"}}', {
        status: 401,
        statusText: "Unauthorized",
        headers: { "x-trace-id": "trace-401" },
      });
    });

    try {
      await callGateway("bad-token", "get_data_source_desc", { name: "stock_finance_data" });
      throw new Error("Expected callGateway to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(GatewayError);
      expect(err).toHaveProperty("message", 'Kimi API 错误: 401 Unauthorized {"error":{"message":"invalid authentication"}}');
      expect((err as GatewayError).trace?.requestId).toBe("trace-401");
      expect((err as GatewayError).trace?.toolCallId).toBeString();
    }
  });

  test("200 顶层 error.message 抛 GatewayError 并携带 trace", async () => {
    mockFetch(async () => {
      return new Response(JSON.stringify({ error: { message: "bad params" } }), {
        status: 200,
        headers: { "x-request-id": "req-error" },
      });
    });

    try {
      await callGateway("fake-token", "get_data_source_desc", { name: "stock_finance_data" });
      throw new Error("Expected callGateway to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(GatewayError);
      expect(err).toHaveProperty("message", "Kimi API 返回错误: bad params");
      expect((err as GatewayError).trace?.requestId).toBe("req-error");
      expect((err as GatewayError).trace?.toolCallId).toBeString();
    }
  });
  test("200 顶层字符串 error 抛 GatewayError 并携带 trace", async () => {
    mockFetch(async () => {
      return new Response(JSON.stringify({ error: "bad params" }), {
        status: 200,
        headers: { "x-request-id": "req-string-error" },
      });
    });

    try {
      await callGateway("fake-token", "get_data_source_desc", { name: "stock_finance_data" });
      throw new Error("Expected callGateway to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(GatewayError);
      expect(err).toHaveProperty("message", "Kimi API 返回错误: bad params");
      expect((err as GatewayError).trace?.requestId).toBe("req-string-error");
      expect((err as GatewayError).trace?.toolCallId).toBeString();
    }
  });


  test("超时抛出 30 秒错误并携带 trace", async () => {
    const originalSetTimeout = globalThis.setTimeout;
    const originalClearTimeout = globalThis.clearTimeout;
    globalThis.setTimeout = ((handler: TimerHandler) => {
      if (typeof handler === "function") handler();
      return 0 as never;
    }) as typeof setTimeout;
    globalThis.clearTimeout = (() => {}) as typeof clearTimeout;
    mockFetch((_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal?.aborted) {
        return Promise.reject(new DOMException("Aborted", "AbortError"));
      }
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
    });

    try {
      await callGateway("fake-token", "get_data_source_desc", { name: "stock_finance_data" });
      throw new Error("Expected callGateway to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(GatewayError);
      expect(err).toHaveProperty("message", "Request timed out after 30 seconds.");
      expect((err as GatewayError).trace?.toolCallId).toBeString();
    } finally {
      globalThis.setTimeout = originalSetTimeout;
      globalThis.clearTimeout = originalClearTimeout;
    }
  });
});
