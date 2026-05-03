# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review. | branch-pr | /home/dreykdev/.config/opencode/skills/branch-pr/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | /home/dreykdev/.config/opencode/skills/issue-creation/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage. | go-testing | /home/dreykdev/.config/opencode/skills/go-testing/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI. | skill-creator | /home/dreykdev/.config/opencode/skills/skill-creator/SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", or "que lo juzguen". | judgment-day | /home/dreykdev/.config/opencode/skills/judgment-day/SKILL.md |

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
- Keep SKILL.md structured with clear triggers, critical patterns, and minimal examples.
- Use `skills/{skill-name}/SKILL.md` as the required entry point.

### judgment-day
- Resolve skill registry/compact rules before launching judges.
- Run two blind reviewers in parallel; never sequentially.
- Treat real warnings/criticals as fix-required; theoretical warnings become INFO.
- Re-run both judges after fixes until convergence or escalation.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | /home/dreykdev/Desktop/dreyk/AGENTS.md | Index of repo rules and doc references |
| 01-architecture.md | /home/dreykdev/Desktop/dreyk/01-architecture.md | Target monorepo architecture, stack, dependency rules |
| 02-data-model.md | /home/dreykdev/Desktop/dreyk/02-data-model.md | SQL schema, RLS, TS types |
| 04-code-conventions.md | /home/dreykdev/Desktop/dreyk/04-code-conventions.md | TS, hooks, services, store, component rules |
| 05-development-phases.md | /home/dreykdev/Desktop/dreyk/05-development-phases.md | Phase plan and exit criteria |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
