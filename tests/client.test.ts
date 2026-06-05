import { afterEach, describe, expect, test } from "bun:test";
import { callGateway } from "../src/client";

const originalFetch = globalThis.fetch;

function mockFetch(handler: typeof fetch): void {
  // @ts-expect-error override global fetch in tests
  globalThis.fetch = handler;
}

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
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
        headers: { "Content-Type": "application/json" },
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
    expect(headerValue(requestHeaders, "User-Agent")).toBe("kimi-datasource/3.1.1");
    expect(result).toEqual({ result: { assistant: [{ type: "text", text: "数据源描述结果" }] } });
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
    expect(result).toEqual({ is_success: true, data_preview: [{ ticker: "600519.SH" }] });
  });

  test("非 200 响应抛出包含响应体片段的错误", async () => {
    mockFetch(async () => {
      return new Response('{"error":{"message":"invalid authentication"}}', {
        status: 401,
        statusText: "Unauthorized",
      });
    });

    await expect(
      callGateway("bad-token", "get_data_source_desc", { name: "stock_finance_data" })
    ).rejects.toThrow('Kimi API 错误: 401 Unauthorized {"error":{"message":"invalid authentication"}}');
  });
});
