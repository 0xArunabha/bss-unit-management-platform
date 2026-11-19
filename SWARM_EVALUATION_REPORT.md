# SWARM EVALUATION REPORT: LIGHT OF SCIENCE PLATFORM
## Comprehensive Multi-Persona Audit & UI/UX Evaluation
**Target System**: Breakthrough Science Society (BSS), Jalpaiguri Unit Management Platform (*"Light of Science"*)  
**Society Registration**: Regd. No. `S/86180 of 1996–97` (West Bengal Societies Registration Act, 1961)  
**Evaluation Target**: `http://localhost:3000` (Next.js 16.2.6 App Router, React 19.2.6, Tailwind CSS 4.1.17, TypeScript 5.9.3, Drizzle ORM, PWA)  
**Evaluation Scope**: Public Portal, Authentication, Member Roster, 12-Month Treasury Ledger, Donation Register & Digital Slips, Campaigns & Events, Real-time Procurement Board, Anti-Superstition Field Repertoire, Accessibility (WCAG 2.1 AA/AAA), and Offline Resilience  
**Date of Synthesis**: November 18, 2026  
**Evaluation Mechanism**: Autonomous Agent Swarm (6 Specialized Domain Personas)  

---

## Table of Contents
1. [Executive Summary & Domain Context](#1-executive-summary--domain-context)
2. [Agent Swarm Persona Roster](#2-agent-swarm-persona-roster)
3. [Persona Walkthroughs & User Experiences](#3-persona-walkthroughs--user-experiences)
   - 3.1 [Riya Sen — First-Time Visitor & Prospective Student Member](#31-riya-sen--first-time-visitor--prospective-student-member)
   - 3.2 [Kunal Roy — Daily Operations Manager & Unit Secretary](#32-kunal-roy--daily-operations-manager--unit-secretary)
   - 3.3 [Swapan Dasgupta — Administrative Auditor & Veteran Treasurer](#33-swapan-dasgupta--administrative-auditor--veteran-treasurer)
   - 3.4 [Utsav Roy — Field Volunteer & Materials Logistics Coordinator](#34-utsav-roy--field-volunteer--materials-logistics-coordinator)
   - 3.5 [Dr. Ananya Mukherjee — Science Educator & Miracle-Busting Lead](#35-dr-ananya-mukherjee--science-educator--miracle-busting-lead)
   - 3.6 [Souvik Karmakar — Accessibility Engineer & Assistive Technology Specialist](#36-souvik-karmakar--accessibility-engineer--assistive-technology-specialist)
4. [Missing Features & Functionality](#4-missing-features--functionality)
   - 4.1 [Public Onboarding, Civic Petitions & Patron Donations](#41-public-onboarding-civic-petitions--patron-donations)
   - 4.2 [Governance, Executive Secretarial & Cadre Administration](#42-governance-executive-secretarial--cadre-administration)
   - 4.3 [Treasury, Statutory Accounting & Legal Compliance (WB Act 1961)](#43-treasury-statutory-accounting--legal-compliance-wb-act-1961)
   - 4.4 [Field Operations, Mobile Procurement & Offline Resilience](#44-field-operations-mobile-procurement--offline-resilience)
   - 4.5 [Science Pedagogy, Miracle-Busting Lab & Article 51A(h)](#45-science-pedagogy-miracle-busting-lab--article-51ah)
   - 4.6 [Accessibility Controls, Assistive Technology & PWA Infrastructure](#46-accessibility-controls-assistive-technology--pwa-infrastructure)
5. [Friction Points, Bugs & "What Is Off"](#5-friction-points-bugs--what-is-off)
   - 5.1 [Critical Glitch: The "Arrears Eradication" Loop in Dues Calculation](#51-critical-glitch-the-arrears-eradication-loop-in-dues-calculation)
   - 5.2 [Critical Blocker: Public Donation Rejection & Silent Receipt Drop](#52-critical-blocker-public-donation-rejection--silent-receipt-drop)
   - 5.3 [Orphaned Workflow: Zero UI Trigger for Membership Applications Review](#53-orphaned-workflow-zero-ui-trigger-for-membership-applications-review)
   - 5.4 [Document Mutation: Reference Codes Dynamically Shifting with DOM Index](#54-document-mutation-reference-codes-dynamically-shifting-with-dom-index)
   - 5.5 [Premature Balance Deduction & Cash vs. Liability Discrepancy](#55-premature-balance-deduction--cash-vs-liability-discrepancy)
   - 5.6 [The Guest Mode Demonstration Safety Paradox](#56-the-guest-mode-demonstration-safety-paradox)
   - 5.7 [Severe Accessibility Blocker: Keyboard Focus Trap in HelpModal](#57-severe-accessibility-blocker-keyboard-focus-trap-in-helpmodal)
   - 5.8 [Mathematical Contrast Failures Across Riso Palette Tokens](#58-mathematical-contrast-failures-across-riso-palette-tokens)
   - 5.9 [Desktop Micro-Typography Defect (--fs-floor: 0px)](#59-desktop-micro-typography-defect---fs-floor-0px)
   - 5.10 [Mobile Touch Ergonomics & Missing Bill Photo Capture](#510-mobile-touch-ergonomics--missing-bill-photo-capture)
   - 5.11 [Browser Native Dialogues & Alert Banner Multi-Event Occlusion](#511-browser-native-dialogues--alert-banner-multi-event-occlusion)
   - 5.12 [Zero-PIN Authentication Paradox in Remote Field Deployments](#512-zero-pin-authentication-paradox-in-remote-field-deployments)
6. [Prioritized UI/UX Recommendations](#6-prioritized-uiux-recommendations)
   - 6.1 [Priority 0: Critical Bugs & Blocker Deficits (Immediate Hotfixes)](#61-priority-0-critical-bugs--blocker-deficits-immediate-hotfixes)
   - 6.2 [Priority 1: High-Impact Governance & Accounting Compliance](#62-priority-1-high-impact-governance--accounting-compliance)
   - 6.3 [Priority 2: Field Usability, Mobile Ergonomics & Logistics Refinements](#63-priority-2-field-usability-mobile-ergonomics--logistics-refinements)
   - 6.4 [Priority 3: Polish, Pedagogy & Design System Harmonization](#64-priority-3-polish-pedagogy--design-system-harmonization)
7. [Traceability Matrix](#7-traceability-matrix)

---

## 1. Executive Summary & Domain Context

### 1.1 Platform Identity & Cultural Grounding
The **Light of Science** platform serves as the digital operating system for the Jalpaiguri Unit of the **Breakthrough Science Society (BSS)**. Established nationally in 1995 and registered under the *West Bengal Societies Registration Act, 1961* (Registration No. `S/86180 of 1996–97`), the society is a non-governmental democratic movement dedicated to popularizing science, fighting dogmatism and superstition, defending secular education, and protecting ecological resources. 

The Jalpaiguri Unit operates across the historic plains of North Bengal, bordered by the Teesta and Karala rivers, and extending into the rural tea gardens of Dooars (e.g., Malbazar, Maynaguri, Dhupguri, and Diana Tea Estate). Its day-to-day work balances two dimensions:
1. **Grassroots Activism & Scientific Temper**: Conducting frontline chemical and physical demonstrations to debunk occult "miracles" performed by charlatans, leading student environmental investigations into river pollution, and spearheading civic actions such as the ongoing **Clean Mashkalaibari** movement against toxic crematorium furnace smoke.
2. **Democratic Organizational Discipline**: Maintaining rigorous collective governance through decentralized field purchasing, transparent dual-volunteer verification, strict minimum monthly cadre pledges (₹20/month baseline), and statutory compliance with West Bengal cooperative and society accounting standards.

### 1.2 Design System Architecture
The application rejects generic Silicon Valley SaaS dashboards in favor of a culturally resonant **Two-Ink Riso Print & Continuous Ledger Book** archetype. Developed with Next.js 16.2.6 (App Router), React 19, Tailwind CSS 4, and Lucide React, its visual identity is built upon:
- **Palette**: Rust (`#bf5029`) and Olive (`#6b7f50`) inks layered onto warm, tactile newsprint (`#f5f3ea` / `#f3efe4`).
- **Typography**: Authentic Bengali script (`বিজ্ঞান`), Courier Prime typewriter monospace for financial accounting, and crisp sans-serif headings.
- **Physical Motifs**: Registration crosshairs, printer alignment marks, perforated tear-off slips, rubber stamps (*COLLECTED*, *VERIFIED*, *VOID*), and continuous ruled ledger matrices.
- **Progressive Web App (PWA)**: Service Worker asset caching, Web App Manifest, and an IndexedDB offline queue (`bss_offline_db`) for remote tea garden operations.

### 1.3 Audit Swarm Methodology
To achieve a genuinely exhaustive, uncompromised evaluation, an autonomous agent swarm consisting of **six distinct personas** was deployed against the active local platform at `http://localhost:3000`. Operating in preview mode with simulated in-memory storage (`src/lib/demo-data.ts`) and cross-referencing production Drizzle PostgreSQL models (`src/db/schema.ts`), each agent probed the platform through their specific operational worldview, technical needs, and domain mandates:
- **Persona 1 (Riya Sen)**: Prospective undergraduate member assessing discovery, DPDP Act minor safety, civic campaigns, and public donation workflows.
- **Persona 2 (Kunal Roy)**: Daily Operations Manager and Unit Secretary evaluating member onboarding, single-use invite codes, circular reference continuity, meeting agendas, and executive oversight.
- **Persona 3 (Swapan Dasgupta)**: 40-year veteran auditor and treasurer examining statutory compliance with the West Bengal Societies Registration Act 1961, arrears calculation algorithms, voucher continuity, and financial reporting.
- **Persona 4 (Utsav Roy)**: Field logistics coordinator evaluating mobile touchscreen ergonomics, out-of-pocket bazaar buying, anti-collusion peer verification, and tea garden network dropouts.
- **Persona 5 (Dr. Ananya Mukherjee)**: High school physics educator and rationalist demonstration lead auditing Article 51A(h) pedagogical rigor, chemical hazard disclosures, stoichiometric formatting, and Bengali localization.
- **Persona 6 (Souvik Karmakar)**: Accessibility engineer and assistive technology specialist running WCAG 2.1 AA/AAA contrast calculations, keyboard focus trap diagnostics, ARIA live region audits, and screen reader parsing.

---

## 2. Agent Swarm Persona Roster

| # | Persona Name | Operational Role | Background & Context | Primary Goals & Mandates | Primary Views & Workflows Evaluated |
|---|--------------|------------------|----------------------|--------------------------|-------------------------------------|
| **1** | **Riya Sen** | First-Time Visitor & Prospective Member | 2nd-year undergraduate at Ananda Chandra College, Jalpaiguri. Discovered BSS through the Karala River pollution student rally. | Explore unit objectives, verify legitimacy, inspect Clean Mashkalaibari evidence, test DPDP-compliant membership application, claim invite code, and contribute via public donation. | `/`, `login-screen.tsx`, `overview.tsx`, `workspace-modals.tsx` (Campaign, Application, Public Donation, Digital Receipt Slip). |
| **2** | **Kunal Roy** | Daily Operations Manager & Unit Secretary | Frontline executive coordinating 32 cadre members, club room deliberations, municipality deputations, and weekly assemblies. | Morning health scan, reviewing public join applications, issuing Crockford Base32 invite codes, publishing circulars and agendas, dispatching WhatsApp alerts, and monitoring cadre audit trails. | `overview.tsx`, `people-views.tsx` (Members), `field-views.tsx` (Circulars, Procurement), `workspace-modals.tsx` (Agendas, Applications, Claim Codes). |
| **3** | **Swapan Dasgupta** | Administrative Auditor & Veteran Treasurer | 40+ years auditing North Bengal agricultural credit cooperatives and registered societies. Strict guardian of double-entry integrity. | Audit statutory compliance under WB Societies Registration Act 1961, inspect 12-month dues matrix, verify arrears logic, examine cash balance deductions, check voucher serial continuity, and test CSV exports. | `people-views.tsx` (12-Month Dues Matrix), `overview.tsx` (Treasury Card), `receipts/[id]`, `src/lib/workspace.ts`, `src/app/api/workspace/route.ts`. |
| **4** | **Utsav Roy** | Field Volunteer & Materials Logistics Coordinator | Grassroots cadre handling bazaar purchasing at Dinbazar and science camp logistics in Dooars tea gardens on a mid-range Android phone. | Log real out-of-pocket reagent expenses without pre-approval delays, inspect comrades' items at venues, enforce anti-collusion (`verified_by != purchased_by`), collect meeting dues, and test offline IndexedDB sync. | `field-views.tsx` (Procurement Board), `workspace-modals.tsx` (Purchase, Verify, Quick Dues Collector), `src/lib/offline-queue.ts`. |
| **5** | **Dr. Ananya Mukherjee** | Science Educator & Miracle-Busting Lead | Senior High School Physics Teacher and BSS rationalist demonstration lead conducting rural anti-superstition workshops. | Evaluate Article 51A(h) pedagogical rigor, verify chemical safety protocols (GHS hazards, PPE, stoichiometry), audit demonstration scripts, check lever-arm mechanics, and assess Bengali rationalist terminology. | `field-views.tsx` (Science Resources & Anti-Superstition Lab), `workspace-modals.tsx` (Demonstration Reader), `src/lib/resources.ts`, `src/lib/i18n.tsx`. |
| **6** | **Souvik Karmakar** | Accessibility Engineer & Assistive Tech Specialist | Low-vision accessibility engineer and NVDA/VoiceOver power user evaluating compliance with W3C WCAG 2.1 AA/AAA standards. | Audit mathematical color contrast, test keyboard navigation and focus management, verify screen reader accessibility across dynamic math engines, inspect mobile touch targets, and audit PWA localization. | Full application DOM, `src/app/globals.css`, `src/components/ui.tsx`, `HelpModal`, `src/components/id-card.tsx`. |

---

## 3. Persona Walkthroughs & User Experiences

### 3.1 Riya Sen — First-Time Visitor & Prospective Student Member

#### Journey & Qualitative Walkthrough
Riya Sen, a 20-year-old physics student at Ananda Chandra College, arrived at `http://localhost:3000` seeking to understand the society behind the Karala River cleanup posters she noticed near the Jublee Park footbridge.

1. **Initial Encounter**: The landing screen (`src/components/login-screen.tsx`) made an immediate positive impression. The warm newsprint texture (`#f5f3ea`), registration crop marks, and authentic Bengali masthead (`বিজ্ঞান · JALPAIGURI UNIT`) conveyed grassroots authenticity rather than sterile corporate software. She noticed three actions: "Member Login with Google", "New to the unit? Apply to join", and "Explore Public Unit Portal". However, having received a slip of paper with a handwritten invite code (`H892-KJ3P`) from a senior comrade at college, she searched the screen in vain for a "Claim Code" input field. It was not visible anywhere on the initial screen, forcing her to guess that she had to click Google Login first.
2. **Membership Application & DPDP Act Verification**: Selecting "Apply to join", Riya tested the membership form. As a student advocate, she was particularly impressed by the age checkbox: *"I am 18 years of age or older"*. Toggling it off expanded a required parent/guardian field labeled *"Parent / Guardian Name (Required under DPDP Act 2023)"*. Submitting while under 18 with an empty field immediately triggered a clear compliance warning. Entering valid details returned a green confirmation banner, smoothly transitioning her into the unit portal as an authenticated guest after 2 seconds.
3. **Exploring the Clean Mashkalaibari Campaign**: In guest mode, a persistent rust banner alerted her to the active civic struggle: *"🚨 ACTIVE CIVIC CAMPAIGN: Clean Mashkalaibari: Ending toxic crematorium furnace smoke & river dumping (Phase 2 · 20% Reached)"*. Opening the campaign action plan revealed a comprehensive 5-phase roadmap and a photographic investigation gallery containing 6 high-resolution field inspection photographs of the crematorium chimney and riverbank dumping. The ability to swipe through photos, read captions about school children inhaling soot, and see the campaign's demand for an automated Air Pollution Control System (APCS) made the movement feel organized and credible.
4. **The Donation Blocker Disappointment**: Moved by the campaign, Riya decided to make a ₹250 contribution via UPI. On the Overview page, Stat Card 4 proclaimed *"Public movement · Support"*. Clicking "Support" opened the "Record Public / Patron Donation" modal. Riya entered her name, mobile number, selected "UPI instant transfer", and tapped "Record & generate receipt". Instead of displaying a receipt slip, the modal crashed with an error:
   ```json
   {"error": "Please log in to the workspace with your member account."}
   ```
   Riya felt alienated: why would a public movement invite donations from visitors only to demand an internal member login? Furthermore, when testing via the direct route (`/receipts/40000000-0000-4000-8000-000000000001`), she saw that the digital receipt slip itself was extraordinarily well crafted—featuring the circular SVG unit seal, official registration numbers, treasurer signature block, and 1-click WhatsApp/Telegram share links. The frontend modal failure completely prevented public patrons from ever seeing this slip.
5. **Dead-End Navigation**: Returning to the Overview, she clicked "Visit the notice board" (`overview.tsx:496`). Because guest access to `circulars` is restricted, `workspace.tsx:222` silently forced the view back to `overview`, causing the screen to flash and reload with zero explanatory feedback.

---

### 3.2 Kunal Roy — Daily Operations Manager & Unit Secretary

#### Journey & Qualitative Walkthrough
Kunal Roy logged into the workspace at 7:30 AM to prepare for the weekly executive committee assembly and coordinate logistics for upcoming school outreach camps.

1. **Morning Dashboard Scan**: The executive dashboard immediately surfaced unit metrics: 32 active members, ₹16,920 treasury balance, and the Clean Mashkalaibari campaign spotlight. At the top of the screen, an amber alert seized his attention:
   ```text
   🛡️ URGENT FIELD DISPATCH <48H: 1 requisitions urgently needed for upcoming programme: Campaign: Clean Mashkalaibari.
   ```
   Tapping the alert navigated him directly to the Procurement Board with the filter preset. However, upon calling comrade Utsav on the phone and confirming that the materials were already purchased at Dinbazar, Kunal found no way to acknowledge, dismiss, or snooze the alert. Worse, if multiple upcoming events had emergency requisitions, the banner collapsed all other events behind the first event's title (`urgentItems[0]?.eventId`).
2. **The Orphaned Onboarding Pipeline**: Kunal navigated to the Members register (`people-views.tsx`) to approve new volunteer applications submitted over the weekend. To his utter shock, there was no "Pending Applications" button, no badge, and no review queue anywhere in the interface. Unknown to him, an extensive `ReviewApplicationsModal` existed in code (`workspace-modals.tsx:635`), but lacked any button or link to open it. Prospective members who applied via the public portal were left stranded in database purgatory.
3. **Crockford Base32 Code Issuance Friction**: For unlinked member Kaushiki Ray, Kunal clicked "Issue Code". A modal popped up displaying `P4KR-7H2B` formatted in Crockford Base32 with an in-person security checklist. While the modal subtitle stated *"Hand over in person or via direct WhatsApp"*, there was no WhatsApp button. Kunal had to copy the code, open WhatsApp Web in another tab, locate Kaushiki, and manually write an explanation. Upon closing the modal, the code vanished forever. The backend projected `data.claimCodes`, but the UI provided no ledger showing which codes were active, claimed, or nearing their 14-day expiry.
4. **The Mutating Circular Code Hazard**: In the Circulars view (`field-views.tsx`), Kunal inspected Circular #4: *"Proposal for Constituting Operational Teams & Working Committees"*, marked with official code `LOS/JPG/2026/04`. To review urgent circulars, he clicked the "Pinned" tab. Instantly, the card re-rendered as `LOS/JPG/2026/01`! Typing a search query caused the reference numbers to scramble again. Deriving official reference numbers from dynamic DOM array indices (`idx + 1`) violated organizational document integrity. Furthermore, the circular reader had no print stylesheet or "Save Draft" state, preventing him from printing paper agenda slips for comrades attending the offline club room meeting.

---

### 3.3 Swapan Dasgupta — Administrative Auditor & Veteran Treasurer

#### Journey & Qualitative Walkthrough
With over four decades of auditing cooperative banks, trade unions, and societies registered under the *West Bengal Societies Registration Act, 1961*, Swapan Dasgupta approached the platform with meticulous professional rigor.

1. **Visual & Structural Appreciation**: Opening the **12-Month Treasury Matrix** (`people-views.tsx:550–700`), Swapan felt deep aesthetic admiration. The continuous ruled ledger lines, minimum ₹20 baseline enforcement, distinct visual stamps for advance multi-month contributions, and collector attribution tags reflected genuine grassroots accounting.
2. **Discovery of the "Arrears Eradication" Glitch**: Scrutinizing the arrears calculation engine (`src/lib/workspace.ts:145–155` and `src/app/api/workspace/route.ts:425–431`), Swapan discovered a catastrophic algorithmic loophole. Under society bylaws and Section 16 of the Act, a member defaulting for six consecutive months loses voting rights and must be classified as Inactive. The code's arrears scanner walked backwards from the current month:
   ```typescript
   for (let i = 0; i < 24; i++) {
     const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
     if (d < new Date(person.createdAt.getFullYear(), person.createdAt.getMonth(), 1)) break;
     if (memPaymentSet.has(`${d.getFullYear()}-${d.getMonth() + 1}`)) break; // <-- CRITICAL FLAW
     remainingUnpaid++;
   }
   ```
   Because the loop executed `break` upon encountering the *first* paid month, an inactive member who defaulted for 8 months could pay a single ₹20 fee for November 2026. The algorithm evaluated month 0, saw a payment, executed `break`, and calculated `0 unpaid months`! Compounding this, `src/lib/demo-data.ts:750` unconditionally executed `member.unpaidMonths = 0; member.status = "active";` upon *any* collection. A chronic defaulter was instantly restored to "UP TO DATE" status, erasing historical debts from executive oversight.
3. **Break in Voucher Continuity**: In society accounting, audit certification requires unbroken chronological receipt numbering. Examining receipt generation (`src/app/api/workspace/route.ts:455` and `src/lib/demo-data.ts:777`), Swapan found that while seed data used sequential numbers (`LOS-JPG-2026-001` to `006`), new receipts were assigned random UUID slices: `${identity.receiptPrefix}-${year}-${randomUUID().slice(0, 8).toUpperCase()}`. An auditor examining books where Receipt No. 006 is followed by `LOS-JPG-2026-F81A9B` would suspect off-the-books skimming and refuse audit certification.
4. **Premature Expense Deduction**: Inspecting `overview.tsx:58`, Swapan noted that the unit balance subtracted procurement costs the moment a volunteer entered `actualCost` in "purchased" status, long before Stage 3 Peer Verification. Furthermore, deducting volunteer out-of-pocket spending directly from the treasury balance without recording a corresponding accounts payable liability distorted cash reconciliation. If an un-reimbursed volunteer spent ₹1,080 at the bazaar, physical cash in the unit's metal cash box remained unchanged, causing immediate cash-count discrepancies.
5. **Statutory Gaps**: Receipts lacked mandatory "Amount in Words" (e.g., *"Rupees Five Thousand Only"*), Society PAN disclosures, and 80G tax status disclaimers. Most critically, the platform lacked an **Annual Receipts & Payments Account** generator, rendering it incapable of producing statutory filings for the Registrar of Societies.

---

### 3.4 Utsav Roy — Field Volunteer & Materials Logistics Coordinator

#### Journey & Qualitative Walkthrough
Operating on a mid-range Android phone with a cracked screen protector, Utsav Roy tested the platform amidst the bustling noise of Dinbazar and during outdoor field demonstrations in the rural tea gardens of Dooars.

1. **Bazaar Out-of-Pocket Procurement**: Standing in a stationery and hardware shop at Dinbazar, Utsav needed to buy water sampling test tubes for the Karala River rally. The shopkeeper demanded ₹520 (exceeding the ₹450 reference estimate due to local stock shortages). In conventional bureaucratic software, exceeding budget caps requires multi-day managerial approval. In Light of Science, Utsav tapped "Log out-of-pocket purchase", entered `520.00`, and tapped "Log exact purchase". The item immediately moved from *Stage 1 (Needed)* to *Stage 2 (Ready for Peer Check)*, displaying a transparent spend delta: `+₹70 over estimate (logged without cap)`. This design respected grassroots realities by prioritizing timely field procurement while relying on peer verification for integrity.
2. **Venue Peer Verification & Anti-Collusion**: Arriving at Kotwali Thana More one hour before the rally, Utsav met fellow volunteer Pritam Sarkar. Opening the Procurement Board, Utsav inspected Pritam's voucher for electrical cables (₹1,080). He tapped "Inspect & peer verify at venue", checked the mandatory physical inspection box, and closed the voucher with finality. When Utsav examined his own purchase (water tubes), the verification button was replaced by a prominent warning notice:
   ```text
   Buyer self-verification blocked.
   Rule: verified_by ≠ purchased_by. Awaiting peer at venue.
   ```
   Both the UI, API controller (`route.ts:515`), and database schema (`CHECK (verified_by != purchased_by)`) strictly barred self-verification, providing robust fraud prevention without administrative bottlenecks.
3. **The Mobile Usability Nightmare**: Despite the strong backend logic, using the mobile interface was frustrating:
   - On screens ≤640px, the Procurement Board stacked all three Kanban columns vertically (`grid-template-columns: 1fr !important`). Utsav had to scroll past 12 "Needed" items just to reach the "Ready for Peer Check" items waiting for venue inspection.
   - The purchase modal lacked any camera capture or file upload button, despite `receiptPhotoUrl` existing in the database schema (`schema.ts:68`). Peer verifiers had to inspect paper slips in person, with no permanent photo attached to the voucher.
   - Micro-action buttons (WhatsApp reminders, voucher tags) measured only 23px to 27px, causing repeated mis-taps with dusty, sweaty fingers.
4. **Tea Garden Network Dropout**: Conducting an outreach camp at Diana Tea Estate with zero cellular reception, Utsav went offline. The platform's IndexedDB queue (`offline-queue.ts`) caught his actions, attached idempotency keys, and queued them locally. However, the topbar indicator (`⚡ 1 queued`) was completely unclickable. There was no queue inspector to view pending actions, fix typos, or verify what was queued. Most alarming was the **Offline Auth Paradox**: because the platform strictly relies on online Google OAuth, any volunteer whose session expires while in a remote tea garden is locked out permanently, dropping to guest mode where procurement is invisible.

---

### 3.5 Dr. Ananya Mukherjee — Science Educator & Miracle-Busting Lead

#### Journey & Qualitative Walkthrough
Dr. Ananya Mukherjee, a senior high school physics teacher in Jalpaiguri, evaluated the **Field Repertoire & Anti-Superstition Lab** (`/?view=resources`) to prepare volunteer demonstration teams for school outreach programs.

1. **Pedagogical Inspiration & Editorial Hero**: The editorial banner—citing **Article 51A(h) of the Constitution of India** (*“To develop the scientific temper, humanism and the spirit of inquiry and reform”*) alongside the historic 2025 All India Science Conference poster—immediately established high pedagogical purpose.
2. **The Guest Mode Safety Quarantine Paradox**: Opening the "Demonstrations" tab, Dr. Mukherjee expanded `Spontaneous fire without matchsticks` (Potassium permanganate + Glycerin oxidation). The inquiry prompt was compelling: *"Can chemical energy release heat and flames without any supernatural intervention?"* However, in guest mode, the reagents grid and safety checklist were completely blank. Clicking "Open complete narration script & explanation" revealed a single truncated disclaimer:
   ```text
   [Summary for Public Viewers] How fake godmen trigger flames from 'divine prayers'... Log in with your unit member account to view full chemical safety checklists, reagent proportions, and demonstration protocols.
   ```
   Dr. Mukherjee was stunned by the inverse safety hazard: public visitors and curious students learned that mixing potassium permanganate and glycerin produces spontaneous fire, but were completely shielded from critical warnings about the 15–40 second exothermic induction delay, toxic manganese oxide smoke, and the mandatory requirement for a ceramic tile! In science pedagogy, reactive chemical names must never be publicized without accompanying safety protocols.
3. **Chemical Typography & Section Formatting Breakdown**: Viewing the full protocol as an authenticated member, Dr. Mukherjee found the scientific content robust, but the formatting broken. Stoichiometric equations:
   ```text
   14 KMnO₄ + 4 C₃H₅(OH)₃ → 7 K₂CO₃ + 7 Mn₂O₃ + 5 CO₂ + 16 H₂O + ΔH (Heat)
   Fe³⁺(aq) + SCN⁻(aq) ⇌ [Fe(SCN)]²⁺(aq)
   ```
   were dumped as unstructured text inside plain paragraph tags without monospace font, chemical formula highlighting, or equilibrium arrows. Furthermore, in `workspace-modals.tsx:1217`, paragraph parsing hardcoded `i === 0 ? <h3> : <p>`. As a result, critical section headings (`1. THE CONTEXT IN THE FIELD`, `2. THE ACTUAL SCIENCE`, `3. VOLUNTEER NARRATION SCRIPT`) rendered as flat body text, making it impossible for demonstrators to scan speaking points during live presentations.
4. **The Complete Bengali Void**: Switching the interface to Bengali (`বাং`) revealed that while top navigation tabs translated, the entire pedagogical repertoire—all demonstration titles, descriptions, reagents, safety rules, and narration scripts—remained 100% English. In rural Jalpaiguri blocks (Rajganj, Maynaguri, Dhupguri), demonstrations are conducted in Bengali. Cadres were forced to mentally translate technical terms on the fly.
5. **Repertoire Omission**: The system Help modal explicitly promised *"lever-arm rod bending"* (bending iron rods against the suprasternal notch using fulcrum mechanics), but the protocol was entirely missing from `src/lib/resources.ts`.

---

### 3.6 Souvik Karmakar — Accessibility Engineer & Assistive Technology Specialist

#### Journey & Qualitative Walkthrough
Souvik Karmakar, a low-vision accessibility engineer and NVDA screen reader user, audited the platform against W3C WCAG 2.1 Level AA/AAA standards and mobile touch ergonomics.

1. **The Broken Skip Link & Landing Gate**: Pressing `Tab` upon initial page load brought up the skip link (*"Skip to main content"*). Pressing `Enter` did nothing. The landing screen (`login-screen.tsx`) omitted the target landmark `<main id="main-content">`, stranding keyboard users at the top of the DOM.
2. **The HelpModal Keyboard Focus Trap**: In the workspace shell, Souvik navigated via keyboard to the sidebar help button (*"Need a helping hand?"*) and pressed `Enter`. The `HelpModal` appeared. Pressing `Tab` to read the help topics trapped focus permanently on the modal Close button (`X`). In `src/components/ui.tsx:97`, the modal focus trap query selector searched for buttons, inputs, selects, and textareas, but omitted `<summary>`. Because `HelpModal` consisted solely of `<details><summary>` elements, the Close button was the sole focusable element recognized (`first === last`). Every `Tab` press executed `event.preventDefault(); first.focus();`, locking keyboard users out of the platform's architectural documentation.
3. **Empirical Contrast Deficits**: Computing contrast ratios using the W3C Relative Luminance formula ($L = 0.2126R + 0.7152G + 0.0722B$):
   - **Signature Rust (`#bf5029`) on Newsprint (`#f5f3ea`)**: **4.30:1** (FAILS WCAG AA 4.5:1 for regular text).
   - **Signature Olive (`#6b7f50`) on Newsprint (`#f5f3ea`)**: **3.95:1** (FAILS WCAG AA 4.5:1 for regular text).
   - Secondary tokens were severely impaired: `.page-heading p` (`#93998c`): **2.63:1**; `.nav-group-label` (`#a0a497`): **2.29:1**; input placeholders (`#b1b9a3`): **2.03:1**; unpaid dues cells (`#c9cebf`): **1.61:1**; border rules (`--rule #bfb59d`): **1.83:1**.
4. **Desktop Micro-Typography Defect**: Inspecting typography across desktop screens (>1000px), Souvik discovered that `globals.css:3831` set `--fs-floor: 0px`. Dozens of operational elements coded as `max(Npx, var(--fs-floor, 0px))` rendered at unreadable sizes: `.resource-feature .eyebrow` at **5.5px**, `.global-search-field kbd` at **6px**, and `.dues-cell` at **8.5px**, causing extreme visual strain.
5. **Screen Reader Blind Spots**: The 12-Month Dues advance calculator updated dynamically without `aria-live="polite"`, leaving blind treasurers unaware of how lump-sum payments mapped to calendar months. Furthermore, toggling the language to Bengali updated React state but failed to set `<html lang="bn">`, causing screen readers to mangle Bengali phonemes using English pronunciation rules.

---

## 4. Missing Features & Functionality

### 4.1 Public Onboarding, Civic Petitions & Patron Donations
1. **Direct "Claim Invite Code" Entry Point on Login Screen** (`src/components/login-screen.tsx`): First-time visitors holding paper invite slips distributed at campus meetings have no visible link to enter their Crockford Base32 code without first initiating Google OAuth.
2. **Autonomous Public Donation & Instant Receipt Issuance** (`src/lib/demo-data.ts:539` & `src/components/workspace-modals.tsx:586`): Public patrons cannot contribute via UPI/card without an internal member profile, and the frontend modal fails to render digital receipt slips for unauthenticated users.
3. **Citizen Petition & Campaign Endorsement Signatures** (`src/components/workspace-modals.tsx:435`): The Clean Mashkalaibari campaign targets 500+ citizen signatures for municipality deputations, but provides no digital petition signing or endorsement pledge form.
4. **Public Unit Information & Club Room FAQ Modal** (`src/components/login-screen.tsx`): No dedicated modal details the 30-year history of BSS in Jalpaiguri, its registration under the 1961 Act, or physical club room meeting timings.
5. **Guest Read Access to Field Reports & Public Circulars** (`src/components/overview.tsx:496` & `src/components/field-views.tsx:870`): Pinned public interest circulars (e.g. World Environment Day action reports) cannot be opened by guests.

### 4.2 Governance, Executive Secretarial & Cadre Administration
6. **Executive Membership Application Review Queue & Header Badge** (`src/components/overview.tsx` & `src/components/people-views.tsx`): The executive dashboard has no UI trigger, notification pill, or register tab to open `ReviewApplicationsModal` (`workspace-modals.tsx:635`), leaving applicant cadres stranded indefinitely.
7. **Invite Code Status Ledger (`claimCodes`)** (`src/components/people-views.tsx`): Executives have no interface to track which Crockford Base32 codes are active, claimed, or expiring within their 14-day validity window.
8. **1-Click WhatsApp Onboarding Dispatch** (`src/components/workspace-modals.tsx:615`): The invite code issuance modal lacks a direct WhatsApp dispatch button to send pre-formatted onboarding instructions.
9. **Draft Resolutions & Agendas Mode** (`src/components/workspace-modals.tsx:1015`): Secretaries cannot save draft circulars or meeting agendas for committee review prior to public broadcast.
10. **A4 Agenda Print Stylesheet & Minutes Generator** (`src/components/workspace-modals.tsx:1042`): The circular reader lacks a print button and `@media print` styling to generate physical meeting agendas with unit seal and signature blocks.
11. **Event & Assembly Volunteer Attendance Register** (`src/components/workspace-modals.tsx:400`): Events track volunteer participation as a static integer count rather than an interactive roster of member check-offs.
12. **Consolidated WhatsApp Arrears & Alert Broadcast** (`src/components/people-views.tsx`): Secretaries must click individual member WhatsApp links 32 times; there is no bulk reminder generator.
13. **Full Audit Activity Log Page & CSV Export** (`src/components/overview.tsx:451`): The dashboard activity stream is hard-truncated to 4 rows, with no paginated audit trail page.

### 4.3 Treasury, Statutory Accounting & Legal Compliance (WB Act 1961)
14. **Annual Receipts & Payments Account Generator**: No 1-click statutory financial statement summarizing opening cash/bank balances, categorized receipts, itemized disbursements, and closing balances for annual filing under Section 15 of the WB Societies Registration Act 1961.
15. **Indian Currency "Amount in Words" on Slips** (`src/app/receipts/[id]/page.tsx`): Digital donation slips omit statutory amount in words (e.g., *"Rupees Five Thousand Only"*), creating legal vulnerability to fraudulent alteration.
16. **Statutory Tax & PAN Disclosures** (`src/app/receipts/[id]/page.tsx`): Receipts omit the society's PAN number and explicit disclosures regarding non-exemption under Section 80G of the Income Tax Act.
17. **Petty Cash Disbursement & Volunteer Reimbursement Stage** (`src/components/field-views.tsx:536`): The procurement board lacks a 4th stage (`reimbursed`), prematurely deducting volunteer out-of-pocket expenses from unit cash balances.
18. **Printable Dues Contribution Vouchers for Members** (`src/components/workspace-modals.tsx:1300`): Unlike public donors, internal members paying monthly dues receive no printable receipt voucher.
19. **Receipt Cancellation / Void Audit Trail** (`src/app/api/workspace/route.ts:450`): Executives cannot void mistaken receipts while preserving sequential serial numbers.
20. **Indian Financial Year (Apr–Mar) Matrix Toggle** (`src/components/people-views.tsx:595`): The 12-month treasury matrix is locked to calendar years (Jan–Dec), misaligned with the Indian statutory fiscal year (April 1 to March 31).

### 4.4 Field Operations, Mobile Procurement & Offline Resilience
21. **Mobile Cash Receipt / Bill Photo Attachment** (`src/components/workspace-modals.tsx:882` & `src/components/field-views.tsx:781`): The purchase modal lacks a file input or camera capture button, leaving the schema's `receiptPhotoUrl` field unpopulated.
22. **Member ID Card QR Scanner in Quick-Collector** (`src/components/workspace-modals.tsx:1326`): Volunteers collecting dues at busy meetings must scroll through an HTML dropdown rather than scanning the member's digital ID card QR code.
23. **Field Offline Queue Inspector Drawer ("Sync Center")** (`src/components/workspace.tsx:616`): Clicking `⚡ X queued` does nothing; volunteers cannot view, edit, or retry actions stored in IndexedDB.
24. **Volunteer Assignment Tagging on Requisitions** (`src/components/workspace-modals.tsx:844`): Requisitions are posted without an assigned responsible cadre, leading to field coordination confusion.
25. **Offline Credential Caching for Remote Deployments**: Relying solely on online Google OAuth locks volunteers out of the workspace when sessions expire in remote Dooars tea gardens.

### 4.5 Science Pedagogy, Miracle-Busting Lab & Article 51A(h)
26. **Standard GHS Chemical Hazard Pictograms & PPE Badges** (`src/lib/resources.ts` & `src/components/field-views.tsx:1064`): Chemical protocols omit GHS symbols (GHS03 Oxidizer, GHS05 Corrosive, GHS07 Toxic) and protective equipment guidelines.
27. **Dual-Language Printable Demonstration Leaflets (A4 Handouts)** (`src/components/workspace-modals.tsx:1228`): The protocol export only dumps raw `.txt` files instead of formatted, printable two-column handouts with the unit seal and student inquiry prompts.
28. **Missing Repertoire Item: Lever-Arm Rod Bending** (`src/lib/resources.ts`): The system Help modal promises a lever-arm rod bending physics protocol, but it is omitted from the repertoire.
29. **Demonstration Stopwatch Widget with Acoustic/Haptic Timing** (`src/components/workspace-modals.tsx:1210`): No interactive timer assists demonstrators with the 15–40s induction delay of spontaneous permanganate-glycerin combustion.
30. **Citizen Science Water Quality Field Log Sheet** (`src/components/workspace-modals.tsx:1225`): The Karala River environment toolkit lacks a printable monitoring sheet for recording pH, turbidity, and dissolved oxygen during student walks.

### 4.6 Accessibility Controls, Assistive Technology & PWA Infrastructure
31. **High-Contrast Ledger Display Mode** (`src/components/field-views.tsx:1258`): No user-selectable high-contrast mode for outdoor sunlight use.
32. **Dynamic Screen Reader Language Synchronization** (`src/lib/i18n.tsx` & `src/components/workspace.tsx`): Switching to Bengali fails to set `<html lang="bn">`, breaking text-to-speech pronunciation.
33. **Contextual Accessible Names for Roster Actions** (`src/components/people-views.tsx:220`): Identical buttons ("ID Card", "Collect dues") lack member names in their ARIA labels.

---

## 5. Friction Points, Bugs & "What Is Off"

### 5.1 Critical Glitch: The "Arrears Eradication" Loop in Dues Calculation
- **Files**: `src/lib/workspace.ts` (lines 145–155), `src/app/api/workspace/route.ts` (lines 425–431), `src/lib/demo-data.ts` (line 750).
- **The Defect**:
  ```typescript
  // src/lib/workspace.ts:145-155
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    if (d < new Date(person.createdAt.getFullYear(), person.createdAt.getMonth(), 1)) break;
    if (memPaymentSet.has(`${d.getFullYear()}-${d.getMonth() + 1}`)) break; // BUG: Exits on first paid month!
    remainingUnpaid++;
  }
  ```
- **Consequence**: When checking historical dues backwards from November 2026, encountering *any* paid month immediately terminates the loop. A chronic defaulter owing 8 months can pay a single ₹20 fee for the current month; the loop exits at `i = 0`, calculating `remainingUnpaid = 0`. In `demo-data.ts:750`, `collectDues` unconditionally executes `member.unpaidMonths = 0; member.status = "active";`. Consequently, chronic arrears are wiped clean from executive oversight, evading the statutory 6-month inactivity rule under Section 16 of the WB Societies Registration Act 1961.

---

### 5.2 Critical Blocker: Public Donation Rejection & Silent Receipt Drop
- **Files**: `src/lib/demo-data.ts` (line 539) & `src/components/workspace-modals.tsx` (lines 586, 1432).
- **The Defect**:
  In `src/app/api/workspace/route.ts:82`, `isPublicAction` correctly includes `["claimInviteCode", "applyToJoin", "addDonation"]`. However, in `src/lib/demo-data.ts:539`, `"addDonation"` was omitted:
  ```typescript
  const isPublicAction = ["claimInviteCode", "applyToJoin", "checkMemberDues"].includes(action);
  ```
  Unauthenticated visitors attempting to donate receive HTTP 400: `{"error": "Please log in to the workspace with your member account."}`.
  Furthermore, in `src/components/workspace-modals.tsx:586`:
  ```typescript
  if (result.receiptId) open("receipt", result.data.donations.find((d) => d.id === result.receiptId));
  ```
  Because unauthenticated sessions receive an empty array (`donations: []`), `find(...)` returns `undefined`. In `workspace-modals.tsx:1432`, `ReceiptModal` begins with:
  ```typescript
  if (!donation) return null;
  ```
  The modal vanishes silently, leaving public donors without receipt confirmation or verification links.

---

### 5.3 Orphaned Workflow: Zero UI Trigger for Membership Applications Review
- **Files**: `src/components/workspace-modals.tsx` (lines 635–685) & `src/lib/demo-data.ts` (line 531).
- **The Defect**: An extensive modal component `ReviewApplicationsModal` is fully implemented in `workspace-modals.tsx`, handling pending applications, DPDP minor guardian verification, and executive approval dispatching `approveApplication`. However, a search across the entire UI codebase reveals **zero calls to `open("reviewApplications")`**. There is no button on the Overview dashboard, no badge on the sidebar, and no tab in the Members view. The entire public onboarding pipeline terminates in an orphaned modal.

---

### 5.4 Document Mutation: Reference Codes Dynamically Shifting with DOM Index
- **Files**: `src/components/field-views.tsx` (lines 759, 907) & `src/components/people-views.tsx` (lines 152, 570).
- **The Defect**:
  Official circulars, member roll numbers, and procurement vouchers derive their reference codes from dynamic DOM array indices:
  ```tsx
  // src/components/field-views.tsx:907
  const circularNum = `LOS/JPG/2026/${String(idx + 1).padStart(2, "0")}`;
  // src/components/field-views.tsx:759
  const voucherCode = `REQ-26-${String(index).padStart(2, "0")}`;
  // src/components/people-views.tsx:152
  const memberCode = `JPG-${String(page * 12 + index + 1).padStart(3, "0")}`;
  ```
- **Consequence**:
  1. Filtering circulars by "Pinned" swaps Circular #4 (`LOS/JPG/2026/04`) to `LOS/JPG/2026/01`.
  2. Procurement vouchers in each Kanban column reset index, causing the first item in "Needed", "Purchased", and "Verified" to simultaneously display `REQ-26-00`.
  3. Filtering the member roster by "Inactive" assigns `JPG-001` to member #16.
  This violates administrative document continuity and basic audit principles.

---

### 5.5 Premature Balance Deduction & Cash vs. Liability Discrepancy
- **File**: `src/components/overview.tsx` (lines 53–60).
- **The Defect**:
  ```typescript
  const balance =
    data.openingBalance +
    data.dues.reduce((s, d) => s + d.amount, 0) +
    data.donations.reduce((s, d) => s + d.amount, 0) -
    data.procurements.reduce((s, d) => s + (d.actualCost || 0), 0);
  ```
- **Consequence**: Out-of-pocket volunteer purchases are deducted from the unit's net balance immediately upon logging `actualCost` in "purchased" status, prior to Stage 3 venue peer verification. More critically, volunteer purchases are personal out-of-pocket outlays. Deducting them directly from treasury cash without recording an Accounts Payable liability creates an immediate discrepancy between the digital balance and physical cash in the unit's cash box.

---

### 5.6 The Guest Mode Demonstration Safety Paradox
- **Files**: `src/lib/resources.ts` (lines 228–251) & `src/components/field-views.tsx` (lines 1087–1108).
- **The Defect**:
  To protect chemical protocols from unauthorized access, `getSanitizedResources(false)` strips `materials` and `safetyNotes` while truncating `content`. However, the qualitative description—naming potassium permanganate and glycerin—remains visible. In `field-views.tsx:1087`, `.protocol-reagents-grid` renders completely blank without an explanatory notice. Curious students and public visitors learn that reactive chemicals produce spontaneous flames, but are deprived of critical warnings regarding the 15–40s exothermic induction delay, toxic fumes, and fire bucket precautions.

---

### 5.7 Severe Accessibility Blocker: Keyboard Focus Trap in HelpModal
- **Files**: `src/components/ui.tsx` (lines 96–103) & `src/components/workspace-modals.tsx` (lines 1250–1271).
- **The Defect**:
  In `ui.tsx`, modal focus trapping queries focusable elements:
  ```typescript
  const focusable = ref.current?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
  );
  ```
  The selector omits `summary`. In `HelpModal`, the entire dialog content consists of `<details><summary>` accordion elements. Consequently, the only recognized focusable element is the header Close button (`first === last`). Pressing `Tab` triggers `event.preventDefault(); first.focus();`, locking keyboard users onto the Close button and completely barring them from accessing the help accordions.

---

### 5.8 Mathematical Contrast Failures Across Riso Palette Tokens
- **Files**: `PROJECT.md` (line 7) & `src/app/globals.css` (lines 65–74, 3831).
- **Empirical Ratios (W3C Relative Luminance $L = 0.2126R + 0.7152G + 0.0722B$)**:
  - **Rust (`#bf5029`) on Newsprint (`#f5f3ea`)**: **4.30:1** (FAILS WCAG 2.1 AA 4.5:1 for normal text).
  - **Olive (`#6b7f50`) on Newsprint (`#f5f3ea`)**: **3.95:1** (FAILS WCAG 2.1 AA 4.5:1 for normal text).
  - **Page Subheadings (`#93998c` on `#f3efe4`)**: **2.63:1** (FAILS AA).
  - **Sidebar Group Labels (`#a0a497` on `#faf8f5`)**: **2.29:1** (FAILS AA/AAA).
  - **Input Placeholders (`#b1b9a3` on `#ffffff`)**: **2.03:1** (FAILS Non-text Contrast 1.4.11).
  - **Unpaid Dues Cells (`#c9cebf` on `#fdfefb`)**: **1.61:1** (Severely illegible).
  - **Border Rules (`--rule #bfb59d`)**: **1.83:1** (FAILS 1.4.11 required 3.0:1 for essential UI boundaries).

---

### 5.9 Desktop Micro-Typography Defect (`--fs-floor: 0px`)
- **File**: `src/app/globals.css` (lines 3831–3835).
- **The Defect**:
  ```css
  :root { --fs-floor: 0px }
  @media screen and (max-width: 1000px) { :root { --fs-floor: 11px } }
  ```
  On desktop viewports (>1000px), `--fs-floor` evaluates to `0px`. Elements coded as `font-size: max(Npx, var(--fs-floor, 0px))` collapse to their raw pixel values: `.resource-feature .eyebrow` at **5.5px**, `.global-search-field kbd` at **6px**, `.procurement-costs small` at **6.5px**, and `.dues-cell` at **8.5px**, creating severe eye strain and violating WCAG 1.4.4.

---

### 5.10 Mobile Touch Ergonomics & Missing Bill Photo Capture
- **Files**: `src/app/globals.css`, `src/components/workspace-modals.tsx` (lines 882–915), `src/components/field-views.tsx` (lines 781–808).
- **The Defects**:
  1. Multiple mobile controls measure between 20px and 30px: `.icon-button` (30px), modal header close (26px), pagination buttons (25px), `.dues-cell` height (27px), and toggle switch height (20px), severely failing WCAG 2.5.5 / 2.5.8 touch target standards (44px × 44px).
  2. While the database schema defines `receiptPhotoUrl` (`schema.ts:68`), the purchase modal provides no camera capture or file input button. Bazaar paper receipts cannot be photographed, impairing auditability.

---

### 5.11 Browser Native Dialogues & Alert Banner Multi-Event Occlusion
- **Files**: `src/components/people-views.tsx` (line 269) & `src/components/overview.tsx` (lines 90–112).
- **The Defects**:
  1. Account unlinking uses `window.confirm(...)`, freezing PWA webviews on mobile devices and breaking the riso aesthetic.
  2. The urgent requisition banner hardcodes `urgentItems[0]?.eventId`. If multiple events have urgent supply shortages within 48h, all subsequent events are hidden behind the first event's title, and no snooze or dismiss button exists.

---

### 5.12 Zero-PIN Authentication Paradox in Remote Field Deployments
- **Files**: `src/components/field-views.tsx` (lines 1258–1286) & `src/components/login-screen.tsx` (lines 64–81).
- **The Defect**:
  Retiring PINs in favor of Google OAuth requires active connectivity to Google authentication servers. When volunteers operate in remote tea gardens of Dooars with zero mobile reception, an expired session token permanently locks them out of the workspace, reducing them to guest mode where procurement boards are hidden and offline queues cannot be reached.

---

## 6. Prioritized UI/UX Recommendations

### 6.1 Priority 0: Critical Bugs & Blocker Deficits (Immediate Hotfixes)

| Ref # | Target File & Lines | Defect Summary | Concrete Actionable Remediation |
|---|---|---|---|
| **P0-1** | `src/lib/demo-data.ts:539` | Public donation rejection in demo mode. | Add `"addDonation"` to `isPublicAction` array so unauthenticated visitors can contribute without receiving `"Please log in to the workspace with your member account."`. |
| **P0-2** | `src/components/workspace-modals.tsx:586, 1432` | Disappearing receipt modal for guest donors. | When `result.receiptId` is returned, if `result.data.donations` does not contain the item, navigate directly to `/receipts/${result.receiptId}` or open a standalone confirmation modal populated from `result`. |
| **P0-3** | `src/lib/workspace.ts:145–155` & `src/app/api/workspace/route.ts:425` | "Arrears Eradication" loop glitch. | Replace the loop's `break` on the first paid month with a proper chronological scanner that sums all unpaid months from enrollment to current date. In `demo-data.ts:750`, decrement arrears proportionally rather than resetting to `0`. |
| **P0-4** | `src/components/ui.tsx:97` | Keyboard focus trap in `HelpModal`. | Append `, summary, [role="button"]` to the query selector string inside `handleKeyDown` in `ModalWrap`, enabling Tab navigation into accordion summaries. |
| **P0-5** | `src/components/login-screen.tsx:154` | Broken skip link on landing screen. | Replace `<div className="login-screen-wrap">` with `<main className="login-screen-wrap" id="main-content">` so the skip link resolves. |
| **P0-6** | `src/components/field-views.tsx:907` | Circular reference code mutation. | Compute `circularNum` from the immutable index in `data.circulars` (`data.circulars.findIndex(c => c.id === notice.id) + 1`) rather than the filtered DOM array index. |

---

### 6.2 Priority 1: High-Impact Governance & Accounting Compliance

| Ref # | Target File & Lines | Defect Summary | Concrete Actionable Remediation |
|---|---|---|---|
| **P1-1** | `src/components/overview.tsx` & `src/components/people-views.tsx` | Orphaned `ReviewApplicationsModal`. | Add an amber badge to the Overview header (`🚨 ${pendingCount} Pending Applications`) and a button in `MembersView` beside "Add member" to trigger `open("reviewApplications")`. |
| **P1-2** | `src/app/globals.css:3831` | Desktop micro-typography floor. | Set `--fs-floor: 11px` across all screen widths in `:root`, ensuring text never renders below 11px on desktop viewports. |
| **P1-3** | `src/app/globals.css:65–74` | Contrast failures for Rust & Olive. | Introduce accessible riso tokens: Accessible Rust `#a63a15` (5.67:1 on newsprint) and Accessible Olive `#516439` (5.32:1), updating secondary text `#93998c` -> `#4f5846` (5.52:1). |
| **P1-4** | `src/app/receipts/[id]/page.tsx` | Missing statutory receipt disclosures. | Implement an Indian currency number-to-words utility (`₹5,000` -> *"Rupees Five Thousand Only"*), add society PAN, and include Section 80G non-exemption disclosure. |
| **P1-5** | `src/app/api/workspace/route.ts:455` & `src/lib/demo-data.ts:777` | Non-sequential random UUID receipt hashes. | Replace `randomUUID().slice(0, 8)` with an atomic auto-incrementing serial sequence: `${identity.receiptPrefix}-${year}-${String(nextSerial).padStart(4, "0")}`. |
| **P1-6** | `src/components/login-screen.tsx:243` | Missing direct "Claim Invite Code" button. | Add an explicit button on `mode === "login"`: `<button onClick={() => setMode("claimCode")}>Have an invite code? Claim here</button>`. |
| **P1-7** | `src/components/field-views.tsx:1087` & `src/lib/resources.ts:228` | Guest mode demonstration safety paradox. | Display general fire safety rules, ceramic tile requirements, and spectator clearances to guests, accompanied by a prominent *"Laboratory Supervision Notice"* explaining why chemical mixing ratios are reserved for registered cadres. |
| **P1-8** | `src/components/workspace-modals.tsx:1217` & `src/app/globals.css` | Chemical formula & section formatting breakdown. | Parse numbered section headers (`1. `, `2. `) into styled `<h4>` tags and render stoichiometric equations (`→`, `⇌`) in dedicated monospace formula boxes. |

---

### 6.3 Priority 2: Field Usability, Mobile Ergonomics & Logistics Refinements

| Ref # | Target File & Lines | Defect Summary | Concrete Actionable Remediation |
|---|---|---|---|
| **P2-1** | `src/components/workspace-modals.tsx:882` & `src/components/field-views.tsx:781` | Missing receipt photo capture. | Add `<input type="file" accept="image/*" capture="environment">` to the Purchase modal, save as base64/object URL to `receiptPhotoUrl`, and render a clickable thumbnail on `ProcurementCard`. |
| **P2-2** | `src/components/field-views.tsx:671` & `src/app/globals.css:3148` | Mobile procurement board vertical stacking. | On screens ≤640px, replace stacked columns with a 3-tab segmented switchboard (`[Needed (X)] [Ready for Peer Check (Y)] [Closed (Z)]`). |
| **P2-3** | `src/components/workspace.tsx:616` & `src/lib/offline-queue.ts` | Non-interactive offline queue banner. | Make the topbar `⚡ X queued` badge clickable to open an "Offline Queue Inspector" drawer showing action names, amounts, retry counts, and a "Sync Now" button. |
| **P2-4** | `src/components/workspace-modals.tsx:1326` | Manual member scrolling in dues collection. | Add a camera QR scanner button beside the member dropdown in `DuesCollector` to scan member ID cards (`VirtualIdCard`) and auto-select the member ID. |
| **P2-5** | `src/components/overview.tsx:90–112` | Urgent requisition multi-event occlusion. | Group urgent requisitions by event, display a multi-event summary badge list, and include an "Acknowledge / Snooze" button. |
| **P2-6** | `src/components/people-views.tsx:247` & `src/components/workspace-modals.tsx:615` | Missing WhatsApp share on invite code modal. | Add a `Share on WhatsApp` button that pre-populates a friendly onboarding message containing the 8-character code, expiration date, and portal link. |
| **P2-7** | `src/components/people-views.tsx` | Missing invite codes status ledger. | When `isExecutive` is true, add an "Issued Codes" sub-tab in `MembersView` rendering `data.claimCodes` with issue date, expiry countdown, and claim status. |
| **P2-8** | `src/lib/resources.ts` & `src/lib/i18n.tsx` | Bengali localization void in resources. | Add Bengali fields (`titleBn`, `descriptionBn`, `materialsBn`, `safetyNotesBn`, `contentBn`) to `Resource` and render dynamically when `locale === "bn"`. |
| **P2-9** | `src/components/workspace-modals.tsx:1228` | Plain-text only protocol export. | Add a "Print Field Handout" button triggering a two-column A4 print stylesheet with the unit seal, Article 51A(h) header, and student inquiry questions. |
| **P2-10** | `src/app/globals.css` | Touch targets below 44px × 44px. | Expand tap zones for icon buttons, table action links, and dues matrix cells to 44px using transparent `::after` pseudo-elements. |

---

### 6.4 Priority 3: Polish, Pedagogy & Design System Harmonization

| Ref # | Target File & Lines | Defect Summary | Concrete Actionable Remediation |
|---|---|---|---|
| **P3-1** | `src/lib/resources.ts` | Missing lever-arm rod bending protocol. | Add resource `rod-bending` under category `Demonstrations` explaining class 2/3 lever mechanics, structural rebar buckling loads, and sternal notch anatomy. |
| **P3-2** | `src/components/people-views.tsx:269` | Browser native `confirm()` modal. | Replace `window.confirm()` with a custom `ConfirmationModal` styled with two-ink riso typography and cancel/confirm buttons. |
| **P3-3** | `src/components/overview.tsx:451` | Truncated audit activity stream. | Add a "View full activity log →" button below the Overview activity list that opens a searchable, filterable modal with complete history and CSV export. |
| **P3-4** | `src/components/people-views.tsx:595` | Calendar year vs. Fiscal year matrix. | Add a toggle to switch the 12-month treasury matrix between Calendar Year (Jan–Dec) and Indian Financial Year (Apr–Mar). |
| **P3-5** | `src/components/workspace.tsx:509` & `src/lib/i18n.tsx` | Screen reader language attribute. | In `setLocale`, execute `document.documentElement.lang = locale;` and add `aria-pressed` states to language pills. |
| **P3-6** | `src/components/workspace-modals.tsx:1042` | Missing circular print stylesheet. | Add a "Print Agenda" button in `CircularReader` with `@media print` rules hiding web chrome and rendering unit seal and signature blocks. |
| **P3-7** | `src/components/workspace-modals.tsx:435` | Missing citizen petition form. | Add an interactive petition signing widget on the Clean Mashkalaibari modal to collect community solidarity pledges. |
| **P3-8** | `src/components/workspace.tsx` | Modal back-button navigation. | Synchronize open modal state with `window.history.pushState` so the Android back button closes modals instead of exiting the site. |

---

## 7. Traceability Matrix

| Finding / Requirement Ref | Impacted Area / View / Component | Specific Source File & Line | Reporting Persona(s) | Severity & Priority | Recommended Fix Summary |
|---|---|---|---|---|---|
| **TR-01** | Public Donation Workflow | `src/lib/demo-data.ts:539` | Persona 1, 4 | Critical · **P0** | Add `"addDonation"` to `isPublicAction` array. |
| **TR-02** | Public Digital Receipt Modal | `src/components/workspace-modals.tsx:586, 1432` | Persona 1 | Critical · **P0** | Guard against `undefined` donation in `ReceiptModal`; route to `/receipts/[id]`. |
| **TR-03** | Dues Arrears Loop Scanner | `src/lib/workspace.ts:145–155`, `route.ts:425` | Persona 3 | Critical · **P0** | Remove `break` on paid month; calculate true cumulative unpaid debt. |
| **TR-04** | Dues Collection State Reset | `src/lib/demo-data.ts:750` | Persona 3 | Critical · **P0** | Decrement `unpaidMonths` proportionally; enforce 6-month inactivity threshold. |
| **TR-05** | HelpModal Focus Trap | `src/components/ui.tsx:97`, `workspace-modals.tsx:1250` | Persona 6 | Critical · **P0** | Include `summary` in `querySelectorAll` focusable elements string. |
| **TR-06** | Landing Skip-to-Content Link | `src/components/login-screen.tsx:154`, `layout.tsx:53` | Persona 6 | Critical · **P0** | Add `id="main-content"` to root `<main>` tag on landing page. |
| **TR-07** | Circular Reference Number Mutation | `src/components/field-views.tsx:907` | Persona 2 | High · **P1** | Calculate reference code from immutable index in `data.circulars`. |
| **TR-08** | Orphaned Review Applications Modal | `src/components/workspace-modals.tsx:635`, `overview.tsx` | Persona 2 | High · **P1** | Add executive review button and notification pill in header and Members view. |
| **TR-09** | Desktop Micro-Typography Floor | `src/app/globals.css:3831` | Persona 6 | High · **P1** | Change `--fs-floor: 0px` to `--fs-floor: 11px` in `:root`. |
| **TR-10** | Riso Palette Contrast Deficits | `src/app/globals.css:65–74`, `PROJECT.md:7` | Persona 6 | High · **P1** | Darken Rust to `#a63a15` (5.67:1) and Olive to `#516439` (5.32:1); calibrate secondary text. |
| **TR-11** | Statutory Receipt Disclosures | `src/app/receipts/[id]/page.tsx` | Persona 3 | High · **P1** | Add "Amount in Words", society PAN, and Section 80G disclaimer. |
| **TR-12** | Sequential Receipt Numbering | `src/app/api/workspace/route.ts:455`, `demo-data.ts:777` | Persona 3 | High · **P1** | Replace random UUID slice with auto-incrementing integer sequence. |
| **TR-13** | Direct Invite Code Entry on Login | `src/components/login-screen.tsx:243` | Persona 1 | High · **P1** | Add direct button to switch to `mode === "claimCode"` without Google click. |
| **TR-14** | Demonstration Safety Paradox | `src/lib/resources.ts:228`, `field-views.tsx:1087` | Persona 5 | High · **P1** | Retain general fire safety rules for guests; add explicit supervised lab notice. |
| **TR-15** | Chemical Reaction Formatting | `src/components/workspace-modals.tsx:1217` | Persona 5 | High · **P1** | Parse section headers into `<h4>`; render formulas in monospace callout blocks. |
| **TR-16** | Requisition Voucher Code Collisions | `src/components/field-views.tsx:759` | Persona 3 | High · **P1** | Use persistent voucher ID (`REQ-26-XXXX`) instead of column index. |
| **TR-17** | Member Code Table Collisions | `src/components/people-views.tsx:152` | Persona 3 | High · **P1** | Store permanent member roll number on profile; stop deriving from `page * 12 + index`. |
| **TR-18** | Bazaar Paper Receipt Attachment | `src/components/workspace-modals.tsx:882`, `field-views.tsx` | Persona 4 | Medium · **P2** | Add camera capture input to Purchase modal; store to `receiptPhotoUrl`. |
| **TR-19** | Mobile Procurement Stacking | `src/components/field-views.tsx:671`, `globals.css:3148` | Persona 4 | Medium · **P2** | Replace stacked 1-col grid with 3-tab segmented switchboard on mobile. |
| **TR-20** | Offline Queue Inspector Drawer | `src/components/workspace.tsx:616`, `offline-queue.ts` | Persona 4 | Medium · **P2** | Add visual drawer when tapping `⚡ X queued` to inspect and retry actions. |
| **TR-21** | Member QR Quick Dues Collector | `src/components/workspace-modals.tsx:1326` | Persona 4 | Medium · **P2** | Add camera QR scanner to auto-select member ID in `DuesCollector`. |
| **TR-22** | Multi-Event Urgent Alert Occlusion | `src/components/overview.tsx:90–112` | Persona 2 | Medium · **P2** | Group urgent items across multiple events; add snooze/dismiss button. |
| **TR-23** | 1-Click WhatsApp Invite Code | `src/components/workspace-modals.tsx:615` | Persona 2 | Medium · **P2** | Add WhatsApp button pre-filling onboarding message with code and portal URL. |
| **TR-24** | Invite Code Status Ledger | `src/components/people-views.tsx` | Persona 2 | Medium · **P2** | Render `data.claimCodes` table with issue date, expiry countdown, and claim status. |
| **TR-25** | Bengali Repertoire Localization | `src/lib/resources.ts`, `src/lib/i18n.tsx` | Persona 5 | Medium · **P2** | Provide Bengali titles, descriptions, reagents, and narration scripts. |
| **TR-26** | Printable Demonstration Leaflets | `src/components/workspace-modals.tsx:1228` | Persona 5 | Medium · **P2** | Replace `.txt` download with dual-language printable A4 handout. |
| **TR-27** | Sub-44px Touch Targets | `src/app/globals.css`, `src/components/ui.tsx` | Persona 4, 6 | Medium · **P2** | Enforce 44px × 44px tap zones via CSS `::after` hitboxes. |
| **TR-28** | Premature Cash Balance Deduction | `src/components/overview.tsx:58` | Persona 3 | Medium · **P2** | Deduct costs only after Stage 3 verification and treasurer reimbursement voucher. |
| **TR-29** | Missing Lever-Arm Physics Protocol | `src/lib/resources.ts`, `workspace-modals.tsx:1257` | Persona 5 | Refinement · **P3** | Add `rod-bending` resource covering lever mechanics and sternal anatomy. |
| **TR-30** | Browser Native `confirm()` Calls | `src/components/people-views.tsx:269` | Persona 2 | Refinement · **P3** | Replace with styled riso `ConfirmationModal`. |
| **TR-31** | Truncated Audit Activity Feed | `src/components/overview.tsx:451` | Persona 2 | Refinement · **P3** | Add full activity history page/modal with search and CSV export. |
| **TR-32** | Fiscal Year (Apr–Mar) Matrix | `src/components/people-views.tsx:595` | Persona 3 | Refinement · **P3** | Allow switching treasury matrix between Calendar and Indian Fiscal Year. |
| **TR-33** | Dynamic Screen Reader Lang Tag | `src/lib/i18n.tsx`, `src/components/workspace.tsx` | Persona 6 | Refinement · **P3** | Set `document.documentElement.lang = locale` upon language toggle. |
| **TR-34** | Meeting Agenda Print Stylesheet | `src/components/workspace-modals.tsx:1042` | Persona 2 | Refinement · **P3** | Add "Print Agenda" button with `@media print` seal and signature blocks. |
| **TR-35** | Citizen Petition Endorsement Form | `src/components/workspace-modals.tsx:435` | Persona 1 | Refinement · **P3** | Add interactive petition signing form on Clean Mashkalaibari modal. |
| **TR-36** | Android Back Button in Modals | `src/components/workspace.tsx:58` | Persona 2 | Refinement · **P3** | Sync modal state with `history.pushState` to support hardware back button. |

---

*Report authored and certified by the Autonomous Swarm Synthesis Agent on behalf of Personas 1–6.*  
*Target Environment: Breakthrough Science Society (BSS), Jalpaiguri Unit Management Platform (`http://localhost:3000`).*
