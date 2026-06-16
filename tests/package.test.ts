import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

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
});
