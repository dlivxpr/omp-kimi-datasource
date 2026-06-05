import { describe, expect, test } from "bun:test";
import { getKimiToken } from "../src/auth";

type FakeContext = Parameters<typeof getKimiToken>[0];

function fakeContext(token: string | undefined): FakeContext {
  return {
    modelRegistry: {
      authStorage: {
        async getApiKey() {
          return token;
        },
      },
    },
    sessionManager: {
      getSessionId() {
        return "session-id";
      },
    },
  } as unknown as FakeContext;
}

describe("getKimiToken", () => {
  test("读取 omp authStorage 中的 kimi-code token", async () => {
    await expect(getKimiToken(fakeContext("omp-token"))).resolves.toBe("omp-token");
  });

  test("缺少 omp kimi 认证时提示登录和订阅要求", async () => {
    await expect(getKimiToken(fakeContext(undefined))).rejects.toThrow(
      "请先运行 `omp login kimi-code` 登录，并确认账号拥有可用的 Kimi 订阅。"
    );
  });
});
