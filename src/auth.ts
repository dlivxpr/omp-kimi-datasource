import type { KimiToolContext } from "./tools";

export const KIMI_LOGIN_ERROR =
  "未找到 kimi-code 的认证凭证。请先运行 `omp login kimi-code` 登录，并确认账号拥有可用的 Kimi 订阅。如果设置了 `KIMI_CODE_OAUTH_HOST` / `KIMI_CODE_BASE_URL`，请在相同环境变量下重新登录后再调用本插件。";

export async function getKimiToken(ctx: KimiToolContext, signal?: AbortSignal): Promise<string> {
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
