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

  it("package.json 使用 omp 18 类型依赖", () => {
    const dep = pkg.devDependencies?.["@oh-my-pi/pi-coding-agent"];
    expect(dep).toMatch(/^\^18\./);
  });

  it("package/marketplace/skill 使用统一项目名与 1.3.0 版本", () => {
    expect(pkg.name).toBe(PROJECT_NAME);
    expect(pkg.version).toBe("1.3.0");
    expect(pkg.repository?.url).toBe(`git+https://github.com/dlivxpr/${PROJECT_NAME}.git`);
    expect(marketplace.name).toBe(PROJECT_NAME);
    expect(marketplace.metadata?.version).toBe("1.3.0");
    expect(marketplace.owner?.name).toBe("dlivxpr");
    expect(marketplace.plugins).toHaveLength(1);
    expect(marketplace.plugins[0]).toEqual(expect.objectContaining({
      name: PROJECT_NAME,
      version: "1.3.0",
      source: "./",
      repository: `https://github.com/dlivxpr/${PROJECT_NAME}`,
    }));
    expect(existsSync(new URL("../.claude-plugin/plugin.json", import.meta.url))).toBe(false);
    expect(skillGuide).toContain(`name: ${PROJECT_NAME}`);
    expect(skillGuide).toContain(`# ${PROJECT_NAME} — 结构化数据源助手`);
  });

  it("SKILL.md 覆盖全部 35 个数据源与关键边界规则", () => {
    expect(skillGuide).toContain("35 个外部数据源");
    const expectedSources = [
      "stock_finance_data",
      "yahoo_finance",
      "world_bank_open_data",
      "tianyancha",
      "arxiv",
      "scholar",
      "yuandian_law",
      "wind",
      "imf",
      "gildata",
      "sec_edgar",
      "sp_data",
      "china_nda",
      "china_nbs",
      "china_standards",
      "who",
      "fao",
      "unsd",
      "ecb",
      "eurostat",
      "unicef",
      "oecd",
      "fred",
      "xhcj",
      "caixin",
      "chembl",
      "materials_project",
      "ncbi_blast",
      "oqmd",
      "pdb",
      "pubchem",
      "uniprot",
      "dongcai",
      "cls",
      "finance_research",
    ];

    for (const source of expectedSources) {
      expect(skillGuide).toContain(`\`${source}\``);
    }

    expect(skillGuide).toContain("china_nbs");
    expect(skillGuide).toContain("china_nda");
    expect(skillGuide).toContain("china_standards");
    expect(skillGuide).toContain("caixin_api_search");
    expect(skillGuide).toContain("wind_search_fields");
    expect(skillGuide).toContain("不受单次调用限制");
  });
});
