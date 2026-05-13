# Skill Registry

**Delegator use only.** Agents that launch sub-agents read this registry to resolve compact rules, then inject the matching rules directly into sub-agent prompts. Sub-agents do not need to read individual `SKILL.md` files.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| Creating a pull request, opening a PR, or preparing changes for review. | branch-pr | /home/dreykdev/.config/opencode/skills/branch-pr/SKILL.md |
| Creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | /home/dreykdev/.config/opencode/skills/issue-creation/SKILL.md |
| Writing Go tests, using teatest, or adding test coverage. | go-testing | /home/dreykdev/.config/opencode/skills/go-testing/SKILL.md |
| Creating a new skill, adding agent instructions, or documenting AI patterns. | skill-creator | /home/dreykdev/.config/opencode/skills/skill-creator/SKILL.md |
| Running adversarial review: "judgment day", "dual review", "doble review", "juzgar". | judgment-day | /home/dreykdev/.config/opencode/skills/judgment-day/SKILL.md |
| Writing guides, READMEs, RFCs, onboarding docs, architecture docs, or review-facing documentation. | cognitive-doc-design | /home/dreykdev/.claude/skills/cognitive-doc-design/SKILL.md |
| Drafting or posting PR comments, issue comments, review feedback, maintainer replies, or chat updates. | comment-writer | /home/dreykdev/.claude/skills/comment-writer/SKILL.md |
| Planning chained/stacked PRs or any PR expected to exceed 400 changed lines. | gentle-ai-chained-pr | /home/dreykdev/.claude/skills/chained-pr/SKILL.md |
| Implementing a change, preparing commits, splitting PRs, or planning reviewable work units. | work-unit-commits | /home/dreykdev/.claude/skills/work-unit-commits/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR must link exactly one approved issue; blank PRs are blocked.
- Add exactly one `type:*` label before merge.
- Use branch names like `feat/description` with lowercase and `a-z0-9._-` only.
- Follow the issue-first workflow before opening a PR.

### issue-creation
- Blank issues are disabled; use a template every time.
- New issues get `status:needs-review`; a maintainer must add `status:approved` before PRs.
- Search duplicates first.
- Questions belong in Discussions, not issues.

### go-testing
- Prefer table-driven tests for multiple cases.
- Test Bubbletea models by calling `Update` directly and asserting state transitions.
- Use `teatest` / golden files for TUI behavior when appropriate.
- Keep tests explicit on `wantErr` and expected values.

### skill-creator
- Create skills only for repeated, non-trivial AI guidance.
- Do not create a skill if docs already cover the pattern.
- Keep `SKILL.md` structured with clear triggers, critical patterns, and minimal examples.
- Use `skills/{skill-name}/SKILL.md` as the required entry point.

### judgment-day
- Resolve skill registry/compact rules before launching judges.
- Run two blind reviewers in parallel; never sequentially.
- Treat real warnings/criticals as fix-required; theoretical warnings become INFO.
- Re-run both judges after fixes until convergence or escalation.

### cognitive-doc-design
- Lead with the answer, then disclose detail progressively.
- Use headings, tables, checklists, labels, and examples to reduce recall burden.
- Keep review docs focused on what changed, what to review first, and what is out of scope.

### comment-writer
- Be useful fast, warm, and direct.
- Explain why when requesting a change.
- Match thread language; Spanish should use Rioplatense voseo.
- Avoid pile-ons and keep comments short.

### gentle-ai-chained-pr
- Split PRs above 400 changed lines unless the maintainer approves `size:exception`.
- Keep each chained PR autonomous, reviewable, and rollback-safe.
- Ask the user to choose stacked PRs, feature-branch chain, or exception when the workload exceeds budget.

### work-unit-commits
- Commit by deliverable behavior, fix, migration, or docs unit, not by file type.
- Keep tests/docs beside the code they verify or explain.
- Each commit should tell a coherent story and remain rollback-friendly.
- Map SDD work units cleanly to commits or chained PR slices.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | /home/dreykdev/Desktop/dreyk/AGENTS.md | Index of repo rules and doc references |
| 01-architecture.md | /home/dreykdev/Desktop/dreyk/01-architecture.md | Monorepo structure, stack, dependency rules, auth flow, GPS pipeline |
| 02-data-model.md | /home/dreykdev/Desktop/dreyk/02-data-model.md | SQL schema, RLS, TypeScript types |
| 03-frontend-ui-manual.md | /home/dreykdev/Desktop/dreyk/03-frontend-ui-manual.md | Manual workflow for user-directed UI/UX and component integration |
| 04-code-conventions.md | /home/dreykdev/Desktop/dreyk/04-code-conventions.md | TypeScript, hooks, services, store, component rules |
| 05-development-phases.md | /home/dreykdev/Desktop/dreyk/05-development-phases.md | Phase plan and exit criteria |

## Project-Specific Compact Rules

- TypeScript is strict: no `any`, no untyped params, no missing return types, no unchecked assertions.
- Prefer `interface` for object shapes; use `type` only for unions/primitives/utility types.
- Components must use named exports and typed `Props` interfaces, except Next.js `page.tsx`/`layout.tsx` default export requirements.
- Feature layout is `components/`, `hooks/`, `services/`, `store/`, `types.ts`; narrow root support files like `navigation.ts` and `mockData.ts` are allowed.
- Services are pure functions with explicit parameter and return types; no React hooks, no component state, no Supabase client calls.
- Hooks follow the 5-step structure and return one object, never arrays.
- Stores hold state only; no async operations, API calls, or computed values.
- Apps never import from each other; `packages/shared` never imports from apps; cross-feature imports are rejected.
- Do not run build commands automatically. Use lint, typecheck, format, tests, or smoke checks first.
- Commit messages must be conventional commits and must not include AI attribution or `Co-Authored-By` trailers.
