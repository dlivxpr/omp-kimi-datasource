import { randomUUID } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { arch, homedir, hostname, platform, release, version } from "os";
import { dirname, join } from "path";

const API_URL = "https://api.kimi.com/coding/v1/tools";
const CLIENT_VERSION = "3.1.1";

function asciiHeaderValue(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "?");
}

function getDeviceModel(): string {
  const currentPlatform = platform();
  const currentRelease = release();
  const currentArch = arch();
  const label = currentPlatform === "darwin"
    ? "macOS"
    : currentPlatform === "win32"
      ? "Windows"
      : currentPlatform === "linux"
        ? "Linux"
        : currentPlatform;

  return [label, currentRelease, currentArch].filter(Boolean).join(" ").trim();
}

function getDeviceId(): string {
  const deviceIdPath = join(homedir(), ".omp", "agent", "kimi-device-id");

  try {
    const id = readFileSync(deviceIdPath, "utf-8").trim();
    if (id) return id;
  } catch {
    // ignore: file may not exist
  }

  const id = randomUUID().replace(/-/g, "");
  try {
    mkdirSync(dirname(deviceIdPath), { recursive: true, mode: 0o700 });
    writeFileSync(deviceIdPath, `${id}\n`, { mode: 0o600 });
  } catch {
    // Device id persistence is best-effort; do not block the API request.
  }
  return id;
}

function buildHeaders(token: string): Record<string, string> {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Msh-Tool-Call-Id": randomUUID(),
    "X-Msh-Platform": "kimi-code-cli",
    "X-Msh-Version": CLIENT_VERSION,
    "X-Msh-Device-Name": asciiHeaderValue(hostname()),
    "X-Msh-Device-Model": asciiHeaderValue(getDeviceModel()),
    "X-Msh-Os-Version": asciiHeaderValue(version()),
    "X-Msh-Device-Id": asciiHeaderValue(getDeviceId()),
    "User-Agent": `kimi-datasource/${CLIENT_VERSION}`,
  };
}

export async function callGateway(
  token: string,
  tool: string,
  arguments_: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<unknown> {
  if (tool !== "get_data_source_desc" && tool !== "call_data_source_tool") {
    throw new Error(`未知工具: ${tool}`);
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({ method: tool, params: arguments_ }),
    signal,
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(
      `Kimi API 错误: ${response.status} ${response.statusText} ${errBody.slice(0, 200)}`,
    );
  }

  const json = await response.json() as Record<string, unknown>;
  const err = json.error as Record<string, unknown> | undefined;
  if (err) {
    const msg = (err.message as string) ?? JSON.stringify(err);
    throw new Error(`Kimi API 返回错误: ${msg}`);
  }

  return json;
}
