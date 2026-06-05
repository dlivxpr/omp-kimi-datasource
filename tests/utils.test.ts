import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, test } from "bun:test";
import { extractText, writeFiles } from "../src/utils";
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
