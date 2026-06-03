import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const API_URL = "https://api.kimi.com/coding/v1/tools";

function getKimiHeader(
  envVar: string,
  defaultValue: string,
): string {
  return process.env[envVar] || defaultValue;
}

function getDeviceId(): string {
  const fromEnv = process.env.KIMI_MSH_DEVICE_ID;
  if (fromEnv) return fromEnv;

  try {
    const id = readFileSync(
      join(homedir(), ".omp", "agent", "kimi-device-id"),
      "utf-8",
    ).trim();
    if (id) return id;
  } catch {
    // ignore: file may not exist
  }

  return "kimi-datasource-omp";
}

export async function callGateway(
  token: string,
  tool: string,
  arguments_: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Msh-Tool-Call-Id": randomUUID(),
      "X-Msh-Platform": getKimiHeader("KIMI_MSH_PLATFORM", "kimi_cli"),
      "X-Msh-Version": getKimiHeader("KIMI_MSH_VERSION", "kimi-datasource-omp"),
      "X-Msh-Device-Name": getKimiHeader("KIMI_MSH_DEVICE_NAME", "kimi-datasource-omp"),
      "X-Msh-Device-Model": getKimiHeader("KIMI_MSH_DEVICE_MODEL", "kimi-datasource-omp"),
      "X-Msh-Os-Version": getKimiHeader("KIMI_MSH_OS_VERSION", process.platform),
      "X-Msh-Device-Id": getDeviceId(),
      "User-Agent": "kimi-datasource-omp/1.0",
    },
    body: JSON.stringify({ tool, arguments: arguments_ }),
  });

  if (!response.ok) {
    throw new Error(
      `网关 HTTP 错误: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}
