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

## 2026-07-22T14:17:11+02:00 - Made Kanban alignment Firefox-compatible

Reason/result: Replaced flex safe-centering with intrinsic board sizing and
auto margins so fitting columns are centered consistently across browsers,
while overflowing boards begin at the wrapper's left edge for scrolling.

Files:
- `tasktrail/src/styles/components/kanban.sass`

Verification: `git diff --check` passed. Firefox and build verification remain
pending because Node.js is not installed on the current environment PATH.

## 2026-07-22T14:29:05+02:00 - Corrected main content sizing beside sidebar

Reason/result: The app content no longer uses the full viewport as its flex
base size. It now occupies only the remaining space after the expanded sidebar,
so Kanban centering and overflow are calculated against the visible content
area consistently across Firefox and Chromium.

Files:
- `tasktrail/src/styles/components/app.sass`

Verification: `git diff --check` passed. Browser/build verification remains
pending because Node.js is not installed on the current environment PATH.
