import { dirname, parse, resolve } from "path";
import { mkdirSync, writeFileSync } from "fs";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
type Logger = Pick<ExtensionAPI["logger"], "warn">;
export function extractText(response: unknown): string {
  if (typeof response === "string") {
    return response;
  }
  if (!response || typeof response !== "object") {
    return JSON.stringify(response, null, 2);
  }

  const r = response as Record<string, unknown>;

  if (r.is_success === false) {
    const errUser = (r.error as Record<string, unknown> | undefined)?.user as
      | Array<Record<string, unknown>>
      | undefined;
    const msg =
      (errUser?.[0]?.text as string | undefined) ?? JSON.stringify(response, null, 2);
    return `接口返回失败：${msg}`;
  }

  const result = r.result as Record<string, unknown> | undefined;
  if (result) {
    for (const channel of ["assistant", "user"] as const) {
      const items = result[channel] as Array<Record<string, unknown>> | undefined;
      if (items) {
        const text = items
          .filter((item) => item.type === "text")
          .map((item) => (item.text as string) ?? "")
          .filter(Boolean)
          .join("\n\n")
          .trim();
        if (text) {
          return text;
        }
      }
    }
  }

  return JSON.stringify(response, null, 2);
}

function allowedResponseFilePath(name: string, expectedOutputPath?: string): string | undefined {
  if (!expectedOutputPath) return undefined;

  const actual = resolve(name);
  const expected = resolve(expectedOutputPath);
  if (actual === expected) return actual;

  const actualParts = parse(actual);
  const expectedParts = parse(expected);
  if (actualParts.dir !== expectedParts.dir) return undefined;
  if (actualParts.ext !== expectedParts.ext) return undefined;
  if (!actualParts.name.startsWith(`${expectedParts.name}_`)) return undefined;

  return actual;
}

export function writeFiles(response: unknown, expectedOutputPath?: string, logger?: Logger): string[] {
  const written: string[] = [];
  if (!response || typeof response !== "object") return written;

  const files = (response as Record<string, unknown>).files as
    | Array<Record<string, unknown>>
    | undefined;
  if (!files) return written;

  for (const f of files) {
    const name = f.name as string | undefined;
    const content = f.content as string | undefined;
    if (!name || content == null) continue;

    const writePath = allowedResponseFilePath(name, expectedOutputPath);
    if (!writePath) {
      const msg = `跳过服务端返回的文件 ${name}：不在请求的输出路径范围内`;
      if (logger) {
        logger.warn(msg);
      } else {
        console.warn(`警告：${msg}`);
      }
      continue;
    }

    try {
      mkdirSync(dirname(writePath), { recursive: true });

      if (f.encoding === "base64") {
        writeFileSync(writePath, Buffer.from(content, "base64"));
      } else {
        writeFileSync(writePath, content, "utf-8");
      }
      written.push(writePath);
    } catch (e) {
      const msg = `落盘 ${writePath} 失败：${e instanceof Error ? e.message : String(e)}`;
      if (logger) {
        logger.warn(msg);
      } else {
        console.warn(`警告：${msg}`);
      }
    }
  }
  return written;
}
