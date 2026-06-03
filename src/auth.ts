import { homedir } from "os";
import { join } from "path";
import type { PiAPI } from "@oh-my-pi/pi-coding-agent";

const AGENT_DB = join(homedir(), ".omp", "agent", "agent.db");

const SQL =
  `SELECT data FROM auth_credentials ` +
  `WHERE provider='kimi-code' AND disabled_cause IS NULL ` +
  `ORDER BY updated_at DESC LIMIT 1;`;

export async function getKimiToken(pi: PiAPI): Promise<string> {
  const { stdout, stderr, exitCode } = await pi.exec("sqlite3", [
    AGENT_DB,
    SQL,
  ]);

  if (exitCode !== 0) {
    throw new Error(`无法读取 kimi 认证信息: ${stderr || "sqlite3 退出码非 0"}`);
  }

  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error(
      "未找到 kimi-code 的认证凭证。请先运行 `omp login kimi-code` 登录。"
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new Error("kimi-code 凭证数据 JSON 解析失败");
  }

  if (!data || typeof data !== "object") {
    throw new Error("kimi-code 凭证格式异常");
  }

  const access = (data as Record<string, unknown>).access;
  if (typeof access !== "string" || !access) {
    throw new Error("kimi-code OAuth token 中缺少 access 字段");
  }

  return access;
}
