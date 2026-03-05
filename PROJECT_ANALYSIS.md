# PROJECT ANALYSIS

## project overview
This repository is a **single-page web application** (pure HTML/CSS/Vanilla JavaScript) for construction cost management.

Main business domains in one app:
- Expense invoices (`Hóa đơn / Chi phí`)
- Advance payments (`Tiền ứng`)
- Weekly attendance and payroll (`Chấm công`)
- Equipment tracking (`Thiết bị`)
- Revenue, contract value, and profit/loss (`Doanh thu & Lãi/Lỗ`)
- Dashboard and reporting (CSV/Excel/image export)
- Local backup + Firebase cloud sync

Technical shape:
- No backend service code in this repo
- Browser-side state + `localStorage` as primary datastore
- Optional Firebase Firestore REST sync
- Heavy global-state architecture (`invoices`, `ccData`, `tbData`, `cats`, etc.)

## folder structure explanation
Project is currently a **flat root structure** (no subfolders):

- `index.html` (882 lines)
  - Main SPA layout
  - All pages, modals, templates (salary slip, advance slip)
  - Script load order wiring (`lib.js` -> `utils.js` -> feature modules -> `main.js`)

- `style.css` (979 lines)
  - Full UI system and page/component styling

- `lib.js` (748 lines)
  - Core data defaults
  - localStorage helpers
  - schema migration and backup
  - JSON import/export backup
  - Firebase REST sync and sync UI
  - global data initialization (`cats`, `invoices`, etc.)

- `utils.js` (485 lines)
  - Shared formatting/helpers (`money`, text escape, year filtering)
  - mobile numpad overlay logic
  - keyboard navigation for entry tables

- `hoadon.js` (1667 lines)
  - Expense entry flow
  - all-invoices listing/filter/pagination
  - soft delete/trash
  - advance payment flow
  - category/settings management
  - import/export Excel and data deletion modal

- `chamcong.js` (1065 lines)
  - Weekly attendance table logic
  - wage/allowance/retail invoice computation
  - rebuild invoice records from attendance
  - payroll and history exports
  - salary/advance slip image export via `html2canvas`

- `thietbi.js` (389 lines)
  - Equipment CRUD, filtering, pagination
  - device transfer back to warehouse logic
  - equipment summary by item name

- `doanhtu.js` (586 lines)
  - Dashboard KPIs/charts (SVG)
  - contract and revenue records
  - profit/loss table per project

- `main.js` (160 lines)
  - App bootstrap (`init()`)
  - page/sub-page navigation
  - year-switch orchestration across tabs

## module responsibilities
### 1) Core platform module
- File: `lib.js`
- Owns data model versions (`DATA_VERSION`), migration, backup snapshots, JSON restore.
- Owns cloud sync contracts and Firestore payload compression/expansion (`compressInv`, `expandInv`, etc.).
- Exposes `save()`/`load()` persistence and many global datasets.

### 2) UI + utilities module
- File: `utils.js`
- Formatting + parsing helpers reused across domains.
- Input interaction layer (numpad, keyboard table navigation).

### 3) Expense and advances domain
- File: `hoadon.js`
- Invoice entry, duplicate detection, edit/delete, filtering, pagination.
- Advance entry and reporting.
- Category settings (project/type/supplier/actor).
- Import/export and destructive data operations.

### 4) Attendance and payroll domain
- File: `chamcong.js`
- Weekly attendance forms and per-worker wage calculations.
- Converts attendance to synthetic invoices (`ccKey`) for accounting consistency.
- Attendance history and aggregate payroll views.

### 5) Equipment domain
- File: `thietbi.js`
- Equipment intake, status updates, assignment by project.
- Warehouse return flow and summary tables.

### 6) Revenue/contracts + dashboard domain
- File: `doanhtu.js`
- Contract declaration and payment receipt tracking.
- Financial analytics (KPI, charts, CT-level breakdown, profit/loss).

### 7) App composition/orchestration
- File: `main.js`
- Startup sequence, tab navigation, year filtering refresh fan-out.

## data flow
### A) Runtime flow
1. `index.html` loads scripts in strict order.
2. `lib.js` initializes global data from `localStorage`.
3. `main.js:init()` initializes UI tables, performs migration, starts auto-backup, attempts cloud load.
4. Feature modules mutate global arrays and call `save(key, value)`.
5. `save()` writes to `localStorage` and debounces cloud push.

### B) Persistence flow
- Primary: `localStorage`
  - `inv_v3`, `ung_v1`, `cc_v2`, `tb_v1`, `hopdong_v1`, `thu_v1`, category keys, backup keys.
- Cloud: Firestore documents
  - `y{year}` for year-scoped data
  - `cats` for category/contract shared data

### C) Cross-domain flow
- Attendance (`ccData`) is converted into accounting invoices with `ccKey` for:
  - labor invoice (`Nhân Công`) per week/project
  - retail invoice (`Hóa Đơn Lẻ`) per worker if applicable
- Dashboard and P/L consume merged outputs from invoices + advances + equipment + revenue records.

### D) Import/export flow
- Import Excel (`hoadon.js`) parses sheets to domain arrays, merges into current local data, then optionally pushes to Firebase.
- Export supports:
  - CSV for many tables
  - Excel workbook
  - PNG salary/advance slips via `html2canvas`

## potential bugs / fragile code
### 1) XSS risk from unsanitized `innerHTML` interpolations in dashboard
- `doanhtu.js:211` uses `${inv.nd || inv.loai}` directly in HTML.
- `doanhtu.js:239` uses `${ct}` directly in title/body.
- Most other files use `x(...)` escaping, but these lines bypass it.

### 2) Excel date import can shift by timezone
- `hoadon.js:1179-1180` converts Excel serial to `Date` then `toISOString().slice(0,10)`.
- This can cause off-by-one date in some timezone offsets.

### 3) Year-scoped cloud push may miss out-of-year edits
- `lib.js:410-413` (`save`) always schedules `fbPushAll()`.
- `fbPushAll()` uses `activeYear` (`lib.js:484-485`) to choose payload year.
- If user edits records of another year while current filter is different, cloud may not receive that year immediately.

### 4) Silent failure paths hide sync issues
- Multiple empty catches (example: `lib.js:497`, `hoadon.js:1528`, `hoadon.js:1818`) swallow errors.
- Failures may leave local/cloud divergence without clear user signal.

### 5) ID generation is non-deterministic and collision-prone under extreme concurrency
- Many records use `Date.now() + Math.random()` IDs (e.g., `hoadon.js:276`, `chamcong.js:53`, `doanhtu.js:503`).
- Usually acceptable for small apps, but brittle for future sync/merge logic and conflict resolution.

### 6) High coupling via mutable global state
- Cross-file shared variables (`invoices`, `ccData`, `tbData`, `cats`, `thuRecords`, `hopDongData`) can be mutated from many modules.
- This makes side effects hard to reason about and regression risk high.

### 7) Large monolithic files increase regression risk
- `hoadon.js` (1667 lines) and `chamcong.js` (1065 lines) each combine UI rendering, business rules, IO, and sync interactions.

## recommended improvements
### 1) Security hardening
- Enforce escaping helper (`x`) for every `innerHTML` interpolation path.
- Prefer `textContent` for plain text rendering.

### 2) Data layer modernization
- Introduce a centralized data store module with explicit actions/reducers.
- Move raw `localStorage` access behind repository APIs.
- Replace ad-hoc IDs with UUIDs.

### 3) Sync reliability
- Track dirty years and push all changed years, not only `activeYear`.
- Add sync job queue + retry + visible error status.
- Add basic conflict policy (timestamp/version) for multi-device safety.

### 4) Import robustness
- Normalize Excel date parsing in local timezone-safe logic.
- Add duplicate-detection options at import time (skip/merge/overwrite).

### 5) Architectural refactor
- Split feature files into:
  - `domain` (pure business logic)
  - `ui` (rendering/events)
  - `infra` (storage/sync/export)
- Start with `hoadon` and `chamcong` modules first due to size.

### 6) Type safety and testability
- Adopt TypeScript (or JSDoc typedefs first) for data contracts.
- Add unit tests for:
  - payroll->invoice conversion
  - money/date parsing
  - year filtering
  - sync payload compression/expansion

### 7) Performance/scalability
- Virtualize long tables and reduce full-table rerenders.
- Cache computed aggregates for dashboard and summaries.

### 8) Operational resilience
- Add lightweight telemetry/logging for critical operations (import, delete, sync, migration).
- Surface recoverable errors instead of silent catches.
