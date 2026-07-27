# Issue tracker: GitHub

本仓库的 issue 和 PRD 使用 GitHub Issues 管理。所有操作通过 `gh` CLI 完成。

## 约定

- **创建 issue**：`gh issue create --title "..." --body "..."`。多行正文使用 heredoc。
- **读取 issue**：`gh issue view <number> --comments`，通过 `jq` 过滤评论并获取 labels。
- **列出 issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，按需添加 `--label` 和 `--state` 过滤。
- **评论**：`gh issue comment <number> --body "..."`
- **添加 / 移除标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭**：`gh issue close <number> --comment "..."`

仓库从 `git remote -v` 推断——在 clone 中运行 `gh` 会自动识别。

## Pull requests as a triage surface

**PR 作为请求表面：否。**（如果本仓库将外部 PR 视为功能请求，请设为 `yes`；`/triage` 会读取此标志。）

当设为 `yes` 时，PR 使用与 issue 相同的标签和状态，并使用 `gh pr` 等价命令：

- **读取 PR**：`gh pr view <number> --comments` 和 `gh pr diff <number>` 查看 diff。
- **列出待 triage 的外部 PR**：`gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`，仅保留 `authorAssociation` 为 `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR` 或 `NONE` 的项（排除 `OWNER`/`MEMBER`/`COLLABORATOR`）。
- **评论 / 标签 / 关闭**：`gh pr comment`、`gh pr edit --add-label`/`--remove-label`、`gh pr close`。

GitHub 的 issue 和 PR 共享同一编号空间，单独的 `#42` 可能是 issue 或 PR——先用 `gh pr view 42` 解析，失败后再用 `gh issue view 42`。

## 当技能说 "publish to the issue tracker"

创建 GitHub issue。

## 当技能说 "fetch the relevant ticket"

运行 `gh issue view <number> --comments`。

## Wayfinding 操作

`/wayfinder` 使用。Map 是一个 issue，子 issue 是 ticket。

- **Map**：单个 issue，标签为 `wayfinder:map`，正文包含 Notes / Decisions-so-far / Fog。创建：`gh issue create --label wayfinder:map`。
- **子 ticket**：作为 GitHub sub-issue 链接到 map 的 issue。如果 sub-issues 未启用，在 map 正文的 task list 中添加子项，并在子 issue 正文顶部加上 `Part of #<map>`。标签：`wayfinder:<type>`（`research`/`prototype`/`grilling`/`task`）。被认领后，分配给当前开发人。
- **阻塞**：优先使用 GitHub 的 **native issue dependencies**（UI 可见的正式表示）。通过 `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>` 添加阻塞边，其中 `<blocker-db-id>` 是阻塞项的 numeric **database id**（通过 `gh api repos/<owner>/<repo>/issues/<n> --jq .id` 获取，不是 `#number` 或 `node_id`）。GitHub 通过 `issue_dependencies_summary.blocked_by` 报告（仅统计 open 的阻塞项——实时门控）。如果 dependencies 不可用，在子 issue 正文顶部使用 `Blocked by: #<n>, #<n>` 行。当所有阻塞项关闭时，ticket 解阻。
- **Frontier query**：列出 map 的 open 子 issue（`gh issue list --state open`，限定到 map 的 sub-issues / task list），丢弃仍有 open blocker（`issue_dependencies_summary.blocked_by > 0` 或 `Blocked by` 行中有 open issue）或已有 assignee 的项；按 map 顺序取第一个。
- **Claim**：`gh issue edit <n> --add-assignee @me` — 本会话首次写入。
- **Resolve**：`gh issue comment <n> --body "<answer>"`，然后 `gh issue close <n>`，再将上下文指针（gist + link）追加到 map 的 Decisions-so-far。
