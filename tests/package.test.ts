import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const marketplace = JSON.parse(
  readFileSync(new URL("../.omp-plugin/marketplace.json", import.meta.url), "utf8"),
);
const skillGuide = readFileSync(new URL("../skills/omp-kimi-datasource/SKILL.md", import.meta.url), "utf8");

const PROJECT_NAME = "omp-kimi-datasource";

describe("package manifest", () => {
  it("package.json 使用 omp.extensions 注册 extension 入口", () => {
    expect(pkg.omp?.extensions).toEqual(["./src/extension.ts"]);
    expect(pkg.omp?.hooks).toBeUndefined();
    expect(pkg.omp?.customTools).toBeUndefined();
    expect(pkg.pi).toBeUndefined();
  });

  it("package.json 使用 omp 16 类型依赖", () => {
    const dep = pkg.devDependencies?.["@oh-my-pi/pi-coding-agent"];
    expect(dep).toMatch(/^\^16\./);
  });

  it("package/marketplace/skill 使用统一项目名", () => {
    expect(pkg.name).toBe(PROJECT_NAME);
    expect(pkg.repository?.url).toBe(`git+https://github.com/dlivxpr/${PROJECT_NAME}.git`);
    expect(marketplace.name).toBe(PROJECT_NAME);
    expect(marketplace.owner?.name).toBe("dlivxpr");
    expect(marketplace.plugins).toHaveLength(1);
    expect(marketplace.plugins[0]).toEqual(expect.objectContaining({
      name: PROJECT_NAME,
      version: pkg.version,
      source: "./",
      repository: `https://github.com/dlivxpr/${PROJECT_NAME}`,
    }));
    expect(existsSync(new URL("../.claude-plugin/plugin.json", import.meta.url))).toBe(false);
    expect(skillGuide).toContain(`name: ${PROJECT_NAME}`);
    expect(skillGuide).toContain(`# ${PROJECT_NAME} — 结构化数据源助手`);
  });
});
