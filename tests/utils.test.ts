import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, test } from "bun:test";
import { appendTrace, expectedResponseFilePath, extractText, writeFiles } from "../src/utils";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

type Logger = Pick<ExtensionAPI["logger"], "warn">;

const silentLogger: Logger = {
  warn() {},
};

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "kimi-utils-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("extractText", () => {
  test("提取官方 /tools 文本响应", () => {
    const response = {
      result: {
        assistant: [{ type: "text", text: "# stock_finance_data\n\nAPI 文档" }],
      },
    };

    expect(extractText(response)).toBe("# stock_finance_data\n\nAPI 文档");
  });

  test("失败响应提取用户可读错误", () => {
    const response = {
      is_success: false,
      error: {
        user: [{ type: "text", text: "参数 ticker 缺失" }],
      },
    };

    expect(extractText(response)).toBe("接口返回失败：参数 ticker 缺失");
  });
});

describe("appendTrace", () => {
  test("追加 request-id 和 tool-call-id", () => {
    expect(appendTrace("ok", { requestId: "req-1", toolCallId: "tool-1" })).toBe(
      "ok\n\n[kimi-datasource] request-id: req-1 · tool-call-id: tool-1"
    );
  });

  test("没有 request-id 时只追加 tool-call-id", () => {
    expect(appendTrace("ok", { toolCallId: "tool-1" })).toBe(
      "ok\n\n[kimi-datasource] tool-call-id: tool-1"
    );
  });
});

describe("expectedResponseFilePath", () => {
  test("优先读取 file_path", () => {
    expect(expectedResponseFilePath({ file_path: " /tmp/result.csv ", filepath: "/tmp/other.csv" })).toBe(
      "/tmp/result.csv"
    );
  });

  test("file_path 缺失时读取 filepath", () => {
    expect(expectedResponseFilePath({ filepath: " /tmp/result.csv " })).toBe("/tmp/result.csv");
  });

  test("空字符串不返回路径", () => {
    expect(expectedResponseFilePath({ file_path: " ", filepath: "" })).toBeUndefined();
  });
});

describe("writeFiles", () => {
  test("只写入请求指定的 file_path", () => {
    const dir = tempDir();
    const filePath = join(dir, "stock.csv");
    const response = {
      files: [{ name: filePath, content: "ticker,price\n600519.SH,100", encoding: "utf-8" }],
    };

    expect(writeFiles(response, filePath)).toEqual([filePath]);
    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath, "utf-8")).toBe("ticker,price\n600519.SH,100");
  });

  test("允许官方拆分文件写入", () => {
    const dir = tempDir();
    const filePath = join(dir, "stock.csv");
    const splitPath = join(dir, "stock_a.csv");
    const response = {
      files: [{ name: splitPath, content: "ticker,price\n600519.SH,100", encoding: "utf-8" }],
    };

    expect(writeFiles(response, filePath)).toEqual([splitPath]);
    expect(existsSync(splitPath)).toBe(true);
  });

  test("写入 base64 文件内容", () => {
    const dir = tempDir();
    const filePath = join(dir, "stock.csv");
    const response = {
      files: [{ name: filePath, content: Buffer.from("ticker,price\n600519.SH,100").toString("base64"), encoding: "base64" }],
    };

    expect(writeFiles(response, filePath)).toEqual([filePath]);
    expect(readFileSync(filePath, "utf-8")).toBe("ticker,price\n600519.SH,100");
  });

  test("跳过不在请求输出路径范围内的文件", () => {
    const dir = tempDir();
    const filePath = join(dir, "stock.csv");
    const outsidePath = join(dir, "nested", "stock.csv");
    const response = {
      files: [{ name: outsidePath, content: "bad", encoding: "utf-8" }],
    };

    expect(writeFiles(response, filePath, silentLogger)).toEqual([]);
    expect(existsSync(outsidePath)).toBe(false);
  });
});
