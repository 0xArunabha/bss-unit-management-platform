# Light of Science · Jalpaiguri Unit Workspace
**Breakthrough Science Society (BSS) — Unified Unit Management & Field Operations Platform**

A responsive, database-backed progressive web platform built with Next.js (App Router), React, Tailwind CSS, PostgreSQL, and Drizzle ORM for **Light of Science (Breakthrough Science Society, Jalpaiguri Unit, West Bengal)**.

> 📄 **Official Specification:** See [PRD.md](./PRD.md) for the complete Product Requirements Document, module specifications, database schema, and multi-phase implementation roadmap.

---

## Unit Identity & Print-Tech Design System

The platform rejects generic AI-slop tropes (Inter defaults, purple gradients, uniform rounded cards, thin-line icons in coloured squares, three-equal-card grids). Instead, it commits to a **two-ink riso print & ledger book archetype**:
- **Palette**: Rust (`#bf5029`) and Olive (`#6b7f50`) on warm newsprint paper (`#f5f3ea`), with charcoal ink (`#1e2418`) and subtle paper grain.
- **Typography**: DM Sans paired with **Courier Prime** for typewriter-style circulars, voucher codes, numerals, and metadata; plus **Noto Sans Bengali** for the recurring native-script mark (`বিজ্ঞান` - *Science*).
- **Leitmotif**: Print registration marks (`✛`), rubber stamps (`VERIFIED`, `URGENT`), ruled continuous ledger lines, and tear-off perforations.
- **Official Society Identity**: Registered under West Bengal Societies Registration Act, 1961 · Regd. No. `S/86180 of 1996–97`. Headquarters: 8A, Creek Lane, Kolkata 700014. Unit: Jalpaiguri Unit.

---

## PRD Modules & Functional Specifications

### Module A: Membership Dues & Treasury Ledger
- **Strict Baseline Minimum**: ₹20 per member per month with no upper cap. Custom recurring pledges supported (₹50, ₹100, custom).
- **Advance & Multi-Month Lump-Sum Auto-Allocation**: Bulk contributions (e.g. ₹240 or ₹500) automatically distribute across consecutive upcoming unpaid months on the ledger matrix.
- **6-Month Inactivity Threshold Rule**: Automatically flags any member account with 6 consecutive unpaid months as `Inactive / Dues Pending` on unit rosters and provides dedicated filter tabs.
- **Meeting Quick-Collector**: Fast entry dialog for unit executives to record cash, UPI, or bank transfer payments during weekly/monthly meetings with collector stamp attribution.
- **12-Month Treasury Matrix**: Continuous ruled ledger grid displaying paid amounts, advance months (`ADV 100`, `ADV 50`), collector stamp popovers, and annual totals.
- **Data Export**: Full UTF-8 CSV ledger download with formula sanitization.

### Module B: Donation Register & Extensible Receipts
- **Public & Patron Contributions**: Tracks external contributions with categorization badges (`PATRON`, `INSTITUTION`, `COMMUNITY`, `CITIZEN`) and purpose attribution.
- **Extensible Receipt Architecture**:
  - Official Society Registration badge (`Regd. No. S/86180 of 1996–97`).
  - Embossed circular SVG Unit Seal (`★ BREAKTHROUGH SCIENCE SOCIETY ★ JALPAIGURI UNIT ★ ESTD 1995` with `বিজ্ঞান`).
  - Authorized Treasurer Signature Block graphic with officer title and date stamp.
  - Perforated tear-off archive slip (`✄ ----------------- UNIT ARCHIVE COPY ----------------- ✄`).
- **Multi-Channel Receipt Delivery**:
  - Instant Universal Sharing: 1-click WhatsApp and Telegram direct sharing with pre-formatted contribution text.
  - Direct link copy and A4 Print / Save PDF.
  - Automated SMS Notification Gateway simulator tracking `SMS Dispatched` vs `SMS Ready` with handset carrier payload preview.

### Module C: Real-Time Event Procurement & Dual Verification
- **3-Stage State Machine**: `needed` (Orange), `purchased` (Yellow), `verified` (Green).
- **Voucher Identification**: Serial requisition codes (`REQ-26-01`, `REQ-26-02`...).
- **Urgent Field Alerting**: Requisitions for events within 48 hours receive prominent `URGENT <48H` stamps and trigger the top broadcast alert.
- **Exact Out-of-Pocket Expenditure Logging**: Buyers record the exact amount paid without pre-approval caps. Visual spend badges show budget deviations (`-₹120 under estimate` or `+₹234 over estimate (logged without bottleneck)`).
- **Anti-Collusion Enforcement**: Database constraint `CHECK (verified_by != purchased_by)` prevents self-verification. The UI displays an explicit lock banner when the current user is the buyer.
- **Verification Finality**: Physical inspection by a peer volunteer alone closes the item. No administrative reimbursement bottleneck. Stamped with double-ruled `PEER VERIFIED AT VENUE` stamp.

### Module D: Notification Engine (PWA & Web Push)
- Real-time in-app activity stream for treasury, procurement, and broadcasts.
- Web Push API with VAPID key exchange and service worker background alerts.
- Dedicated notifications panel with category filters, unread counts, and 1-click jump actions.
- Optional audible notification chime and dues reminder toggle.

### Module E: Field Repertoire & Anti-Superstition Lab
- **Demonstration Protocols**:
  - 🧪 *Spontaneous fire without matchsticks* (Potassium permanganate + glycerin oxidation).
  - 🍋 *The bleeding lemon illusion* (Ferric chloride + potassium thiocyanate complexation).
  - 👣 *Walking on burning coals (Angaar)* (Thermal conductivity & Leidenfrost physics).
  - 🦯 *Bending iron rod on the neck* (Lever arm mechanics & force distribution).
- **Interactive Repertoire**: Step-by-step narration guides, materials checklist, mandatory safety protocols, and inquiry prompts.
- **Campaign Literature**: Draft resolution demanding a National Anti-Superstition Act, North Bengal ecological monitoring toolkit, and astronomical sky-gazing camp manual.
- **Poster & Publication Archive**: High-resolution All India Science Conference 2025 poster inspector & download, Breakthrough Science Journal archive.

---

## Technical Validation

The project passes the platform's full validation sequence:
1. `npx next typegen`
2. `npm exec tsc -- --noEmit --pretty false`
3. `npm run build`
4. `build_and_start` (database bootstrap & `/api/health` check)
5. `node scripts/smoke-test.mjs` (comprehensive automated Playwright regression suite covering all modules, permissions, offline routing, manifest, and mobile navigation).
