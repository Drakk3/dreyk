# Backlog

## feature-first-realignment

- Keep `signOut` as shared behavior in the app shell API.
- Long-term, `activeNav` should also be modeled in the shared shell contract because it represents feature navigation state rendered by a shared sidebar template.
- Short-term, keep `activeNav` wired directly from the feature while the shell is refactored.
- Follow-up refactor: instantiate a shared base `MainSideNavbar` component/template and let each feature provide its own sections via typed props.
- Expected direction: shared template, feature-owned section definitions.
