import type { ExtensionContext } from "@oh-my-pi/pi-coding-agent";

export const KIMI_LOGIN_ERROR =
  "未找到 kimi-code 的认证凭证。请先运行 `omp login kimi-code` 登录，并确认账号拥有可用的 Kimi 订阅。";

export async function getKimiToken(ctx: ExtensionContext, signal?: AbortSignal): Promise<string> {
  const token = await ctx.modelRegistry.authStorage.getApiKey(
    "kimi-code",
    ctx.sessionManager.getSessionId(),
    { signal }
  );

  if (!token) {
    throw new Error(KIMI_LOGIN_ERROR);
  }

  return token;
}
