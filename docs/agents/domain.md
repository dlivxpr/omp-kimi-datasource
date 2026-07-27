# Domain Docs

本仓库的 engineering skills 在探索代码库时应如何消费 domain 文档。

## 开始探索前先读这些

- 仓库根目录的 **`CONTEXT.md`**，或
- 仓库根目录的 **`CONTEXT-MAP.md`**（如果存在）——它指向每个 context 的 `CONTEXT.md`。读取与主题相关的每个文件。
- **`docs/adr/`** — 读取涉及你即将工作区域的 ADR。在 multi-context 仓库中，同时检查 `src/<context>/docs/adr/` 中的 context-scoped 决策。

如果这些文件不存在，**静默继续**。不要标记其缺失，也不要建议提前创建。`/domain-modeling` 技能（通过 `/grill-with-docs` 和 `/improve-codebase-architecture` 可达）会在术语或决策实际被确定时惰性创建它们。

## 文件结构

Single-context 仓库（大多数仓库）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context 仓库（根目录存在 `CONTEXT-MAP.md`）：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← context-specific 决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用 glossary 中的词汇

当你的输出命名一个 domain 概念（issue 标题、重构提案、假设、测试名）时，使用 `CONTEXT.md` 中定义的术语。不要偏离 glossary 明确避免的同义词。

如果你需要的概念尚未在 glossary 中，这是一个信号——要么你在发明项目不使用的语言（请重新考虑），要么确实存在缺口（请记录给 `/domain-modeling`）。

## 标记 ADR 冲突

如果你的输出与现有 ADR 冲突，请明确说明，而不是静默覆盖：

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
