# dreyk — Frontend UI/UX Manual Workflow

This document defines how UI/UX work must be handled in this repository.

## Core rule

The agent must not invent UI/UX decisions.

Frontend presentation work is user-directed.

If a component or screen should be added, the user must provide the implementation reference first.

---

## Required input from the user

Before the agent integrates a new frontend component, the user should provide all of the following:

1. **Install command**
   - Example:

   ```bash
   npx shadcn@latest add @thegridcn/command-menu @thegridcn/theme-ares @thegridcn/intensity-none
   ```

2. **Reference component code**
   - The exact component source, or the exact upstream snippet to follow.

3. **Exact placement**
   - Example: “below the login card”, “inside the admin header”, “to the right of the profile title”.

4. **Exact behavior**
   - Example: “open with trigger”, “always visible”, “close with escape”, “use these commands only”.

5. **Allowed adaptation level**
   - `literal` → no visual reinterpretation
   - `minimal adaptation` → only imports, types, local handlers, and project wiring
   - `adaptation allowed` → structural adjustments are allowed if explicitly approved

---

## Agent responsibilities

When the user provides the input above, the agent may:

- integrate the component into the repo,
- adapt imports, types, and event handlers,
- add the minimum glue code required for project integration,
- ask clarification questions if placement or behavior is ambiguous.

The agent must not:

- redesign the component,
- reinterpret spacing, hierarchy, or interactions,
- add extra visual features not requested,
- replace the reference component with an invented alternative,
- expand the change into a broader frontend refactor.

---

## Default workflow

1. User provides command + reference code + placement + behavior.
2. Agent verifies ambiguity.
3. If ambiguous, the agent stops and asks.
4. If clear, the agent integrates the component with minimal glue code.
5. The agent keeps the implementation scoped to the exact requested feature.

---

## Recommended prompt format

Use this format when requesting frontend work:

```md
Install command:
<command>

Reference code:
<component code>

Placement:
<exact location>

Behavior:
<exact expected behavior>

Adaptation level:
literal | minimal adaptation | adaptation allowed
```

---

## Safety rule

If the user does not provide enough frontend direction, the correct behavior is to stop and request clarification instead of improvising UI/UX.
