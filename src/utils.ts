import { dirname } from "path";
import { mkdirSync, writeFileSync } from "fs";

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

export function writeFiles(response: unknown): void {
  if (!response || typeof response !== "object") return;

  const files = (response as Record<string, unknown>).files as
    | Array<Record<string, unknown>>
    | undefined;
  if (!files) return;

  for (const f of files) {
    const name = f.name as string | undefined;
    const content = f.content as string | undefined;
    if (!name || content == null) continue;

    try {
      mkdirSync(dirname(name), { recursive: true });

      if (f.encoding === "base64") {
        writeFileSync(name, Buffer.from(content, "base64"));
      } else {
        writeFileSync(name, content, "utf-8");
      }
    } catch (e) {
      console.warn(`警告：落盘 ${name} 失败：${e}`);
    }
  }
}
