import { describe, expect, test } from "bun:test";
import type { ExtensionContext } from "@oh-my-pi/pi-coding-agent";
import { getKimiToken, KIMI_LOGIN_ERROR } from "../src/auth";

type GetApiKeyForProviderCall = {
  provider: string;
  sessionId: string;
  options: { signal?: AbortSignal };
};

type FakeContext = ExtensionContext & {
  calls: GetApiKeyForProviderCall[];
};

function fakeContext(token: string | undefined): FakeContext {
  const calls: GetApiKeyForProviderCall[] = [];
  const context = {
    calls,
    modelRegistry: {
      async getApiKeyForProvider(provider: string, sessionId: string, options: { signal?: AbortSignal }) {
        calls.push({ provider, sessionId, options });
        return token;
      },
    },
    sessionManager: {
      getSessionId() {
        return "session-id";
      },
    },
  };
  return context as unknown as FakeContext;
}

describe("getKimiToken", () => {
  test("读取 omp 凭证中的 kimi-code token", async () => {
    await expect(getKimiToken(fakeContext("omp-token"))).resolves.toBe("omp-token");
  });

  test("缺少 omp kimi 认证时提示登录和环境变量要求", async () => {
    await expect(getKimiToken(fakeContext(undefined))).rejects.toThrow(KIMI_LOGIN_ERROR);
  });

  test("传递 AbortSignal 到 modelRegistry", async () => {
    const ctx = fakeContext("omp-token");
    const controller = new AbortController();

    await expect(getKimiToken(ctx, controller.signal)).resolves.toBe("omp-token");

    expect(ctx.calls).toEqual([
      {
        provider: "kimi-code",
        sessionId: "session-id",
        options: { signal: controller.signal },
      },
    ]);
  });
});
