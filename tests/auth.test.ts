import { describe, expect, test } from "bun:test";
import type { ExtensionContext } from "@oh-my-pi/pi-coding-agent";
import { getKimiToken, KIMI_LOGIN_ERROR } from "../src/auth";

type GetApiKeyCall = {
  provider: string;
  sessionId: string;
  options: { signal?: AbortSignal };
};

type FakeContext = ExtensionContext & {
  calls: GetApiKeyCall[];
};

function fakeContext(token: string | undefined): FakeContext {
  const calls: GetApiKeyCall[] = [];
  const context = {
    calls,
    modelRegistry: {
      authStorage: {
        async getApiKey(provider: string, sessionId: string, options: { signal?: AbortSignal }) {
          calls.push({ provider, sessionId, options });
          return token;
        },
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
  test("读取 omp authStorage 中的 kimi-code token", async () => {
    await expect(getKimiToken(fakeContext("omp-token"))).resolves.toBe("omp-token");
  });

  test("缺少 omp kimi 认证时提示登录和环境变量要求", async () => {
    await expect(getKimiToken(fakeContext(undefined))).rejects.toThrow(KIMI_LOGIN_ERROR);
  });

  test("传递 AbortSignal 到 authStorage", async () => {
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
