# Product Requirements Document (PRD)

**Project:** Light of Science (Breakthrough Science Society, Jalpaiguri Unit) — Unified Unit Management & Field Operations Platform

---

## 1. Executive Summary & Platform Strategy

The Light of Science Unit Management Platform is a dedicated cross-platform operations and treasury system built for the Light of Science unit in Jalpaiguri, operating as an active unit under the Breakthrough Science Society (BSS). The platform streamlines local grassroots science advocacy, student convention logistics, unit membership treasury management, public donation collection, and community campaigns.

### Organizational Identity
- **Primary Unit:** Light of Science (Jalpaiguri)
- **Parent Organization:** Breakthrough Science Society (BSS)

### Deployment Model
- **Primary (Phase 1):** Progressive Web App (PWA) built with React, Vite / Next.js, and Tailwind CSS, fully responsive across desktop PCs and mobile devices, supporting Service Worker-based Web Push Notifications.
- **Secondary (Phase 2):** Native Android companion application developed with Kotlin and Jetpack Compose, utilizing Firebase Cloud Messaging (FCM) for system-level notifications and deep hardware integration.
- **Unified Data Layer:** PostgreSQL database hosted on Supabase / PostgreSQL providing real-time subscriptions, Row-Level Security (RLS), and Edge Functions for automated push alerts.

---

## 2. User Personas & Role-Based Access Control (RBAC)

- **Light of Science Unit Executive / Admin:** Full treasury management, membership dues matrix audit, donation slip records, event creation, role delegation, and notification broadcasting for the Light of Science unit.
- **Active Unit Volunteer / Organizer:** Adds procurement checklist items for unit events, records out-of-pocket purchases with exact spend, conducts peer verification of purchases, collects monthly dues during Light of Science unit meetings, and triggers urgent event alerts.
- **General Unit Member / Student Volunteer:** Views Light of Science & BSS event timetables, receives push notifications for upcoming activities, monitors personal dues status, and accesses science outreach literature.

---

## 3. Detailed Functional Specifications

### Module A: Light of Science Membership Dues & Treasury Ledger
- **Dues Structure:**
  - Strict baseline minimum of ₹20 per member per month for the Light of Science unit fund.
  - **No Upper Cap:** Members may voluntarily contribute higher recurring amounts (e.g., ₹50, ₹100, or custom amounts).
- **Advance & Multi-Month Lump-Sum Allocation:**
  - Supports bulk payments (e.g., ₹240 or ₹500 lump sum).
  - The system automatically maps and distributes payments across consecutive upcoming months on the unit ledger matrix.
- **Default / Inactivity Threshold:**
  - An automated status rule flags any member account with 6 consecutive unpaid months as `"Inactive / Dues Pending"` on the Light of Science unit roster.
- **Meeting Quick-Collector:**
  - Fast entry interface for executive members to record cash, UPI, or bank transfer payments during weekly/monthly Light of Science meetings with collector attribution.
- **12-Month Matrix View:** Full tabular grid displaying paid status, amount, collector stamp, and remaining balance per member.

### Module B: Donation Register & Multi-Channel Receipts
- **Public & Patron Contributions:** Records external donations from individuals, schools, and patrons during Light of Science / BSS conventions (e.g., Jalpaiguri City Science Convention) and local environmental drives.
- **Co-Branded Digital Receipts:**
  - Every digital receipt displays the `"Light of Science — Breakthrough Science Society (BSS), Jalpaiguri"` header.
  - **SMS Notification:** Automated SMS confirmation sent to the donor containing amount, date, unit name, and receipt verification link.
  - **Universal Sharing:** Instant shareable link / digital slip optimized for WhatsApp, Telegram, or direct download.
- **Extensible Receipt Architecture:** Structured to incorporate official BSS registration numbers, the Light of Science unit seal, and authorized unit treasurer signature graphics in future phases.

### Module C: Real-Time Event Procurement & Dual-Verification Checklist
- **3-Stage State Machine:**
  1. `needed` (Orange): Item and estimated reference cost posted by a Light of Science organizer for an upcoming or ongoing event.
  2. `purchased` (Yellow): Unit volunteer records purchase.
  3. `verified` (Green): A second volunteer physically inspects and confirms the item at the venue.
- **Verification Finality:**
  - Peer verification alone marks the procurement as complete and closed. No secondary multi-level reimbursement approval bottleneck is required.
- **Exact Expenditure Logging:**
  - The buyer must record the exact amount paid regardless of whether it matches, falls below, or exceeds the initial estimated budget. No pre-approval restriction blocks purchasing or logging.
- **Anti-Collusion Rule:**
  - Enforced database constraint: `CHECK (verified_by != purchased_by)`. A volunteer cannot verify their own purchase.

### Module D: Notification Engine (PWA & Android Native)
- **Core Priority:** Real-time push notifications are a foundational feature of the Light of Science app.
- **Triggers:**
  - **Urgent Event Procurement:** Instant broadcast to all active Light of Science volunteers when items are marked "needed" for events happening today or within 48 hours.
  - **Dual Verification Completed:** Alerts the buyer once a peer has verified their purchased item.
  - **Dues Receipt Confirmation:** Immediate alert/SMS to members when monthly dues are logged.
  - **High-Priority Unit Broadcasts:** Emergency campaign notices, Light of Science meeting schedule adjustments, or venue updates.
- **Technology Implementation:**
  - **Phase 1 (PWA):** Service Workers with Web Push API and VAPID key exchange.
  - **Phase 2 (Android Native):** Firebase Cloud Messaging (FCM) high-priority notification channel.

### Module E: Light of Science Circulars & BSS Science Outreach
- **Unit Notice Board:** Digital circulars, weekly unit meeting agendas, and BSS convention schedules.
- **Resource Archive:** Curated repository of BSS bulletins, Light of Science anti-superstition demo scripts, science convention presentation templates, and local environmental campaign literature.

---

## 4. Technical Architecture & Database Schema

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT CHECK (role IN ('admin', 'organizer', 'volunteer', 'member')) DEFAULT 'member',
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    unpaid_months_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly Membership Dues (Min ₹20, No Cap, Advance Allowed)
CREATE TABLE membership_dues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    dues_month INT NOT NULL CHECK (dues_month BETWEEN 1 AND 12),
    dues_year INT NOT NULL CHECK (dues_year >= 2024),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 20.00),
    payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer')) DEFAULT 'cash',
    collected_by UUID REFERENCES profiles(id),
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_id, dues_month, dues_year)
);

CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name TEXT NOT NULL,
    donor_phone TEXT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer')),
    transaction_ref TEXT,
    sms_sent BOOLEAN DEFAULT false,
    received_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Procurements with Dual Verification & Exact Spend
CREATE TYPE procurement_status AS ENUM ('needed', 'purchased', 'verified');

CREATE TABLE event_procurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    estimated_cost NUMERIC(10, 2),
    actual_cost NUMERIC(10, 2), -- Exact amount recorded by buyer
    status procurement_status DEFAULT 'needed',
    purchased_by UUID REFERENCES profiles(id),
    purchased_at TIMESTAMPTZ,
    receipt_photo_url TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_verifier CHECK (verified_by IS NULL OR verified_by != purchased_by)
);

-- Push Notification Subscriptions (Web Push & FCM)
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT,
    auth TEXT,
    fcm_token TEXT,
    device_type TEXT CHECK (device_type IN ('pwa_desktop', 'pwa_mobile', 'android_native')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);
```

---

## 5. Implementation Roadmap & Milestones

- **Phase 1: Foundation & Data Layer**
  - Supabase project setup for the Light of Science unit, database schema migration, RLS policies, and Auth.
- **Phase 2: Progressive Web App (PWA) Core**
  - React + Vite / Next.js + Tailwind CSS desktop and mobile-responsive frontend branded for Light of Science (BSS).
  - Membership Dues Matrix (with advance multi-month auto-allocation and 6-month inactivity flagging).
  - Real-time Event Procurement Checklist with exact spend recording and peer verification lock.
- **Phase 3: Notifications & Communication Subsystem**
  - Service Worker Web Push notification integration for PWA.
  - SMS API gateway integration for Light of Science donation slips and dues confirmations; universal share triggers.
- **Phase 4: Native Android Development**
  - Kotlin + Jetpack Compose app connecting to the shared Supabase backend.
  - Firebase Cloud Messaging (FCM) integration for background push alerts.
- **Phase 5: Field Testing & Production Rollout**
  - Light of Science volunteer onboarding, live convention testing, and treasury data verification.
