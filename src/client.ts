import { randomUUID } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { arch, homedir, hostname, platform, release, version } from "os";
import { dirname, join } from "path";

const CLIENT_VERSION = "3.2.0";
const REQUEST_TIMEOUT_MS = 30_000;

export type GatewayTrace = {
  requestId?: string;
  toolCallId: string;
};

export type GatewayResult = {
  payload: unknown;
  trace: GatewayTrace;
};

export class GatewayError extends Error {
  constructor(message: string, readonly trace?: GatewayTrace) {
    super(message);
    this.name = "GatewayError";
  }
}

function kimiCodeBaseUrl(): string {
  return (process.env.KIMI_CODE_BASE_URL ?? "https://api.kimi.com/coding/v1").replace(/\/+$/, "");
}

function datasourceApiUrl(): string {
  const explicitUrl = process.env.KIMI_DATASOURCE_API_URL?.trim();
  if (explicitUrl) return explicitUrl;
  return `${kimiCodeBaseUrl()}/tools`;
}

function asciiHeaderValue(value: string | undefined): string {
  const sanitized = (value ?? "").replace(/[^\x20-\x7E]/g, "").trim();
  return sanitized || "unknown";
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

function headerValue(name: string, fallback: string): string {
  return asciiHeaderValue(process.env[name] ?? fallback);
}

function buildHeaders(token: string, toolCallId: string): Record<string, string> {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Msh-Tool-Call-Id": toolCallId,
    "X-Msh-Platform": headerValue("KIMI_MSH_PLATFORM", "kimi-code-cli"),
    "X-Msh-Version": headerValue("KIMI_MSH_VERSION", CLIENT_VERSION),
    "X-Msh-Device-Name": headerValue("KIMI_MSH_DEVICE_NAME", hostname()),
    "X-Msh-Device-Model": headerValue("KIMI_MSH_DEVICE_MODEL", getDeviceModel()),
    "X-Msh-Os-Version": headerValue("KIMI_MSH_OS_VERSION", version()),
    "X-Msh-Device-Id": headerValue("KIMI_MSH_DEVICE_ID", getDeviceId()),
    "User-Agent": `kimi-datasource/${CLIENT_VERSION}`,
  };
}

function responseRequestId(headers: Headers): string | undefined {
  for (const name of [
    "x-request-id",
    "x-trace-id",
    "x-msh-request-id",
    "x-msh-trace-id",
    "request-id",
  ]) {
    const value = headers.get(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

function parseResponseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function topLevelErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const error = (payload as Record<string, unknown>).error;
  if (!error) return undefined;
  if (typeof error !== "object") return String(error);
  const message = (error as Record<string, unknown>).message;
  return typeof message === "string" ? message : JSON.stringify(error);
}

export async function callGateway(
  token: string,
  tool: string,
  arguments_: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<GatewayResult> {
  if (tool !== "get_data_source_desc" && tool !== "call_data_source_tool") {
    throw new Error(`未知工具: ${tool}`);
  }

  const toolCallId = randomUUID();
  const trace: GatewayTrace = { toolCallId };
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(datasourceApiUrl(), {
      method: "POST",
      headers: buildHeaders(token, toolCallId),
      body: JSON.stringify({ method: tool, params: arguments_ }),
      signal: controller.signal,
    });

    trace.requestId = responseRequestId(response.headers);
    const text = await response.text();

    if (!response.ok) {
      throw new GatewayError(
        `Kimi API 错误: ${response.status} ${response.statusText} ${text.slice(0, 200)}`,
        trace,
      );
    }

    const payload = parseResponseBody(text);
    const errorMessage = topLevelErrorMessage(payload);
    if (errorMessage) {
      throw new GatewayError(`Kimi API 返回错误: ${errorMessage}`, trace);
    }

    return { payload, trace };
  } catch (err) {
    if (timedOut) {
      throw new GatewayError("Request timed out after 30 seconds.", trace);
    }
    if (signal?.aborted) {
      throw err;
    }
    if (err instanceof GatewayError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new GatewayError(message, trace);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
