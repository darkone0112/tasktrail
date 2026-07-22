# Change Register

Compact context anchors for meaningful repository changes. This is not a
changelog or code-diff archive.

## Entry Format

```md
## YYYY-MM-DDTHH:MM:SS+TZ - Short title

Reason/result: One or two concise sentences.

Files:
- `path/to/file`

Verification: Focused checks, tests, or known limitations.
```

## 2026-07-22T13:37:30+02:00 - Documented session persistence fix

Reason/result: Recorded the existing authentication change that makes sessions
persist across browser sessions and routes already-authenticated users from the
landing or login page to the application.

Files:
- `tasktrail/app.js`
- `tasktrail/routes/index.js`
- `tasktrail/.env.example`

Verification: `git diff --check` passed. JavaScript checks were unavailable
because Node.js is not installed on the current environment PATH.

## 2026-07-22T13:37:30+02:00 - Added agent workflow documentation

Reason/result: Added lightweight repository guidance and a compact register
format so future agents can preserve context without duplicating diffs.

Files:
- `agents.md`
- `CHANGE_REGISTER.md`

Verification: Reviewed the documents for scope, brevity, and consistent entry
format.

## 2026-07-22T13:54:53+02:00 - Stabilized Kanban column alignment

Reason/result: Safe centering keeps the column group centered while it fits in
the wrapper and uses the wrapper's left scroll origin when four or more fixed-
width columns require horizontal overflow.

Files:
- `tasktrail/src/styles/components/kanban.sass`

Verification: `git diff --check` passed. Browser/build verification remains
pending because Node.js is not installed on the current environment PATH.
