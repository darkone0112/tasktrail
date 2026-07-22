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

## 2026-07-22T14:58:00+02:00 - Redesigned Kanban cards and added activity history

Reason/result: Removed the card ID and completed checkbox, moved the deadline
to the card header, added display-only `#tag` rendering, and introduced a
detailed card view with persistent authored activity entries.

Files:
- `tasktrail/prisma/schema.prisma`
- `tasktrail/prisma/migrations/20260722145411_add_kanban_task_activities/migration.sql`
- `tasktrail/routes/api.js`
- `tasktrail/src/components/KanbanTask.vue`
- `tasktrail/src/components/modals/KanbanTaskDetails.vue`
- `tasktrail/src/locales/locales.json`
- `tasktrail/src/styles/components/kanban.sass`
- `tasktrail/src/utils/helpers.js`
- `tasktrail/src/views/KanbanView.vue`

Verification: Locale JSON and `git diff --check` passed. Runtime, Prisma, and
browser checks remain pending because Node.js is not installed on the current
environment PATH.

## 2026-07-22T15:02:07+02:00 - Defined append-only change register ordering

Reason/result: Documented that change records must be appended as the final
entry, preserving strict chronological order and avoiding ambiguous insertion
anchors.

Files:
- `agents.md`
- `CHANGE_REGISTER.md`

Verification: Confirmed this record is the final entry in the register.

## 2026-07-22T15:17:20+02:00 - Added themed card activity logging and recycle bin

Reason/result: Added automatic timeline entries for card changes and column
moves, made the new Kanban controls inherit dark and high-contrast themes, and
replaced permanent card deletion with a 15-day restore bin.

Files:
- `tasktrail/prisma/schema.prisma`
- `tasktrail/prisma/migrations/20260722160000_add_kanban_task_recycle_bin/migration.sql`
- `tasktrail/routes/api.js`
- `tasktrail/src/components/KanbanTask.vue`
- `tasktrail/src/components/modals/KanbanRecycleBin.vue`
- `tasktrail/src/locales/locales.json`
- `tasktrail/src/styles/components/kanban.sass`
- `tasktrail/src/styles/components/settings.sass`
- `tasktrail/src/utils/helpers.js`
- `tasktrail/src/views/KanbanView.vue`

Verification: Locale JSON and `git diff --check` passed. Runtime, Prisma, and
browser checks remain pending because Node.js is not installed on the current
environment PATH.

## 2026-07-22T15:35:07+02:00 - Centralized themed Kanban detail surfaces

Reason/result: Moved new Kanban detail, timeline, date, and recycle UI colors
to active-theme variables; added value-aware and tag-aware activity records;
enabled editing card details in the modal; and isolated timeline scrolling.

Files:
- `tasktrail/routes/api.js`
- `tasktrail/src/components/modals/KanbanTaskDetails.vue`
- `tasktrail/src/locales/locales.json`
- `tasktrail/src/styles/components/kanban.sass`
- `tasktrail/src/styles/components/settings.sass`
- `tasktrail/src/views/KanbanView.vue`

Verification: Locale JSON and `git diff --check` passed. Runtime and browser
checks remain pending because Node.js is not installed on the current
environment PATH.
