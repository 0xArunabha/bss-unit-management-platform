"use client";

import { identity } from "@/lib/identity";
import { ArrowDownLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Clock3, HeartHandshake, IdCard, IndianRupee, KeyRound, MessageCircle, MessageSquare, Plus, ReceiptText, Search, Send, ShieldCheck, UserPlus, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { type WorkspaceData, type DuesRecord, type Donation, type PerformAction, money, months } from "@/lib/types";
import { Badge, Button, EmptyState, ExportButton, PageHeading, SearchInput, Select, downloadCsv } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { getMemberDesignations } from "@/lib/teams";
import { formatDuesReminderBroadcast, shareViaWhatsApp } from "@/lib/whatsapp";
import type { OpenModal } from "@/components/overview";

type Props = { data: WorkspaceData; open: OpenModal; perform?: PerformAction };
const roleName: Record<string, string> = { admin: "Executive", organizer: "Organizer", volunteer: "Volunteer", member: "Member" };

function getDonorBadge(d: Donation): { label: string; tone: string } {
  const name = d.donorName.toLowerCase();
  if (name.includes("supporters") || name.includes("school") || name.includes("friends") || name.includes("vidyapith") || name.includes("society")) {
    return { label: "INSTITUTION", tone: "blue" };
  }
  if (name.includes("collection") || name.includes("community")) {
    return { label: "COMMUNITY", tone: "yellow" };
  }
  if (d.amount >= 5000) {
    return { label: "PATRON", tone: "orange" };
  }
  return { label: "CITIZEN", tone: "sage" };
}

export function MembersView({ data, open, perform }: Props) {
  const { locale, t } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const current = data.profiles.find((p) => p.id === data.currentUserId) || data.profiles[0];
  const isExecutive = current.role === "admin";
  const canCollect = current.role !== "member";

  const roleNameDisplay: Record<string, string> = {
    admin: t("roleAdmin", "Executive"),
    organizer: t("roleOrganizer", "Organizer"),
    volunteer: t("roleVolunteer", "Volunteer"),
    member: t("roleMember", "Member"),
  };

  const people = data.profiles.filter((p) => {
    const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase()) || (p.phone && p.phone.includes(search));
    if (!matchesSearch) return false;
    if (filter === "inactive") return p.status === "inactive" || p.unpaidMonths >= 6;
    if (filter === "active") return p.status === "active" && p.unpaidMonths < 6;
    if (filter === "volunteers") return ["volunteer", "organizer", "admin"].includes(p.role);
    return true;
  });

  const shown = people.slice(page * 12, page * 12 + 12);
  const inactiveCount = data.profiles.filter((p) => p.status === "inactive" || p.unpaidMonths >= 6).length;
  const volunteerCount = data.profiles.filter((p) => ["volunteer", "organizer", "admin"].includes(p.role)).length;

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow="UNIT ROSTER · THE PEOPLE BEHIND SCIENCE ADVOCACY"
        title="Active members & volunteer organizers."
        description={`Unit membership roster for ${identity.fullName}. Baseline pledge ₹20/month with voluntary higher contributions.`}
      >
        {isExecutive && <Button icon={UserPlus} onClick={() => open("member")}>{t("addMember", "Add member")}</Button>}
      </PageHeading>

      <div className="mini-stats-grid">
        <MiniStat icon={Users} title="Unit members" value={String(data.profiles.length)} detail="Enrolled advocates & volunteers across Jalpaiguri" />
        <MiniStat icon={ShieldCheck} title="Active field organizers" value={String(volunteerCount)} detail="Empowered for procurement verification & dues collection" tone="sage" />
        <MiniStat
          icon={Clock3}
          title="Flagged dues pending (6+ mo)"
          value={String(inactiveCount)}
          detail="Automatic threshold: 6 consecutive unpaid months flags inactive"
          tone="orange"
        />
      </div>

      <section className="panel register-panel">
        <div className="register-toolbar">
          <div className="tabs">
            {[
              ["all", t("allMembersTab", "All members"), data.profiles.length],
              ["active", t("activeRosterTab", "Active roster"), data.profiles.length - inactiveCount],
              ["inactive", t("duesPendingTab", "Dues pending (6+ mo)"), inactiveCount],
              ["volunteers", t("organizersCadreTab", "Organizers & cadre"), volunteerCount],
            ].map(([v, label, count]) => (
              <button
                className={filter === v ? "active" : ""}
                key={String(v)}
                onClick={() => { setFilter(String(v)); setPage(0); }}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder={t("searchPlaceholder", "Search member name or phone…")} />
            <ExportButton
              onClick={() =>
                downloadCsv(
                  `${identity.filePrefix}-members.csv`,
                  [
                    isExecutive
                      ? ["Member Code", "Name", "Role", "Status", "Monthly pledge", "Unpaid months", "Joined", "Access PIN"]
                      : ["Member Code", "Name", "Role", "Status", "Monthly pledge", "Unpaid months", "Joined"],
                    ...people.map((p, idx) => [
                      `JPG-${String(idx + 1).padStart(3, "0")}`,
                      p.fullName,
                      roleNameDisplay[p.role] || p.role,
                      p.status,
                      p.monthlyPledge,
                      p.unpaidMonths,
                      new Date(p.createdAt).toLocaleDateString("en-IN"),
                      ...(isExecutive ? [p.assignedPin || "—"] : []),
                    ]),
                  ]
                )
              }
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table member-table">
            <thead>
              <tr>
                <th>{t("memberCodeCol", "CODE & MEMBER")}</th>
                <th>{t("roleCol", "ROLE")}</th>
                <th>{t("monthlyPledgeCol", "MONTHLY PLEDGE")}</th>
                <th>{t("duesAuditStatusCol", "DUES AUDIT STATUS")}</th>
                <th>{t("enrolledCol", "ENROLLED")}</th>
                <th>{t("actionCol", "ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p, index) => {
                const memberCode = `JPG-${String(page * 12 + index + 1).padStart(3, "0")}`;
                const isOverdue = p.status === "inactive" || p.unpaidMonths >= 6;
                const designations = getMemberDesignations(p.fullName);

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="person-cell">
                        <button
                          type="button"
                          className="member-code-tag cursor-pointer"
                          style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
                          onClick={() => open("idCard", { member: p, memberCode })}
                          title="Click to view Official ID Card"
                        >
                          {memberCode}
                        </button>
                        <span>
                          <strong>{p.fullName}</strong>
                          {designations.primaryTitleEn !== "Unit Member & Field Advocate" && (
                            <span className="id-card-team-pill" style={{ display: "inline-block", marginTop: "3px" }}>
                              {locale === "bn" ? designations.primaryTitleBn : designations.primaryTitleEn}
                            </span>
                          )}
                          <small>
                            {p.phone ? `+91 ${p.phone}` : `${identity.city} Unit`}
                            {isExecutive && p.assignedPin && (
                              <span className="admin-pin-chip" title="Unique Member PIN">
                                PIN: <code>{p.assignedPin}</code>
                              </span>
                            )}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-label role-${p.role}`}>
                        {roleNameDisplay[p.role] || p.role}
                      </span>
                    </td>
                    <td>
                      <strong className="table-money">{money(p.monthlyPledge)}</strong>
                      <span className="muted-small"> / mo</span>
                    </td>
                    <td>
                      {isOverdue ? (
                        <span className="status-stamp-pending">
                          <CircleAlert size={12} />
                          {t("flaggedInactive", "FLAGGED INACTIVE")} ({p.unpaidMonths} MO UNPAID)
                        </span>
                      ) : p.unpaidMonths > 0 ? (
                        <Badge tone="yellow">{p.unpaidMonths} {t("monthsPending", "mo pending")}</Badge>
                      ) : (
                        <span className="status-stamp-ok">
                          <Check size={12} />
                          {t("upToDate", "UP TO DATE")}
                        </span>
                      )}
                    </td>
                    <td className="muted-cell">
                      {new Date(p.createdAt).toLocaleDateString(locale === "bn" ? "bn-IN" : "en-IN", { month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div className="table-actions-cluster">
                        <button
                          className="table-action"
                          onClick={() => open("idCard", { member: p, memberCode })}
                          title="View & print official digital member ID card"
                        >
                          <IdCard size={14} />
                          {t("viewIdCard", "ID Card")}
                        </button>
                        <button
                          className="table-action"
                          style={{ color: "#1fa851" }}
                          onClick={() => shareViaWhatsApp(formatDuesReminderBroadcast(p, locale))}
                          title="Share member contribution status via WhatsApp"
                        >
                          <MessageCircle size={14} />
                          WhatsApp
                        </button>
                        {canCollect && (
                          <button className="table-action" onClick={() => open("dues", { memberId: p.id })}>
                            {t("collectDues", "Collect dues")}
                            <ArrowUpRight size={14} />
                          </button>
                        )}
                        {isExecutive && (
                          <button
                            className="table-action table-action-muted"
                            title="Generate a new unique 4-digit PIN for this member"
                            onClick={async () => {
                              if (confirm(`Generate a new unique 4-digit PIN for ${p.fullName}?`)) {
                                if (perform) await perform("adminResetPin", { memberId: p.id });
                              }
                            }}
                          >
                            <KeyRound size={14} />
                            New PIN
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!people.length && (
          <EmptyState icon={Search} title="No members match this filter" description="Try clearing your search query or switching tabs." />
        )}
        <Pagination page={page} total={people.length} size={12} setPage={setPage} />
      </section>

      <div className="info-strip">
        <CircleCheck size={17} />
        <span>
          <strong>Strict baseline minimum: ₹20 per member per month.</strong> Members may contribute higher recurring amounts with no upper cap. An automated rule flags any account with 6 consecutive unpaid months as Inactive / Dues Pending on unit rosters.
        </span>
      </div>
    </div>
  );
}

export function DuesView({ data, open }: Props) {
  const { locale } = useI18n();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const user = data.profiles.find((p) => p.id === data.currentUserId)!;
  const canCollect = user.role !== "member";

  const payments = data.dues.filter((d) => d.year === Number(year));
  const lookup = new Map(payments.map((p) => [`${p.memberId}-${p.month}`, p]));

  const people = data.profiles.filter((p) => {
    if (!canCollect && p.id !== user.id) return false;
    const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "pending") return !lookup.has(`${p.id}-${now.getMonth() + 1}`);
    if (filter === "inactive") return p.status === "inactive" || p.unpaidMonths >= 6;
    if (filter === "advance") {
      return data.dues.some((d) => d.memberId === p.id && (d.year > now.getFullYear() || (d.year === now.getFullYear() && d.month > now.getMonth() + 1)));
    }
    return true;
  });

  const shown = people.slice(page * 10, page * 10 + 10);
  const paidCurrentMonth = payments.filter((p) => p.month === now.getMonth() + 1);
  const advancePayments = data.dues.filter((p) => p.year > now.getFullYear() || (p.year === now.getFullYear() && p.month > now.getMonth() + 1));
  const yearTotal = payments.reduce((s, p) => s + p.amount, 0);
  const advanceTotal = advancePayments.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow="MODULE A · MEMBERSHIP DUES & TREASURY LEDGER"
        title="12-Month Treasury Matrix."
        description={`Full tabular ledger grid displaying dues payment status, collector attribution, advance lump-sum mapping, and remaining balances for ${identity.fullName}.`}
      >
        <ExportButton onClick={() => downloadCsv(`${identity.filePrefix}-dues-${year}.csv`, [["Member Code", "Member Name", ...months, "Year Total"], ...people.map((p, idx) => [`JPG-${String(idx + 1).padStart(3, "0")}`, p.fullName, ...months.map((_, m) => lookup.get(`${p.id}-${m + 1}`)?.amount || ""), payments.filter((d) => d.memberId === p.id).reduce((s, d) => s + d.amount, 0)])])} />
        {canCollect && <Button icon={Plus} onClick={() => open("dues")}>Quick collect</Button>}
      </PageHeading>

      <div className="mini-stats-grid">
        <MiniStat icon={Wallet} title={`Ledger collected in ${year}`} value={money(yearTotal)} detail="Cash, UPI & Bank transfers audited by unit executives" />
        <MiniStat
          icon={CircleCheck}
          title={`${months[now.getMonth()]} ${now.getFullYear()} collected`}
          value={`${paidCurrentMonth.length} / ${data.profiles.length}`}
          detail={`${Math.round((paidCurrentMonth.length / data.profiles.length) * 100)}% of members up-to-date this month`}
          tone="sage"
        />
        <MiniStat
          icon={ArrowDownLeft}
          title="Advance dues allocated"
          value={money(advanceTotal)}
          detail={`${advancePayments.length} future months covered via multi-month lump sums`}
          tone="blue"
        />
      </div>

      <section className="panel register-panel">
        <div className="register-toolbar">
          <div className="toolbar-left">
            <Select label="Dues year" value={year} onChange={(v) => { setYear(v); setPage(0); }}>
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y} Annual Ledger</option>
              ))}
            </Select>
            <div className="tabs">
              <button className={filter === "all" ? "active" : ""} onClick={() => { setFilter("all"); setPage(0); }}>
                All members <span>{data.profiles.length}</span>
              </button>
              <button className={filter === "pending" ? "active" : ""} onClick={() => { setFilter("pending"); setPage(0); }}>
                Pending this month
              </button>
              <button className={filter === "advance" ? "active" : ""} onClick={() => { setFilter("advance"); setPage(0); }}>
                Advance paid
              </button>
              <button className={filter === "inactive" ? "active" : ""} onClick={() => { setFilter("inactive"); setPage(0); }}>
                Inactive (6+ mo)
              </button>
            </div>
          </div>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Find member in matrix…" />
        </div>

        <div className="table-scroll matrix-scroll">
          <table className="data-table dues-matrix print-ruled-ledger">
            <thead>
              <tr>
                <th>MEMBER & PLEDGE</th>
                {months.map((m, index) => (
                  <th key={m} className={index === now.getMonth() && Number(year) === now.getFullYear() ? "current-month" : ""}>
                    {m.toUpperCase()}
                    {index === now.getMonth() && Number(year) === now.getFullYear() && <span className="month-indicator" />}
                  </th>
                ))}
                <th>YEAR TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p, pIdx) => {
                const memberCode = `JPG-${String(page * 10 + pIdx + 1).padStart(3, "0")}`;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="person-cell">
                        <span className="member-code-tag">{memberCode}</span>
                        <span>
                          <strong>{p.fullName}</strong>
                          <small>
                            {money(p.monthlyPledge)} / mo
                            <button
                              type="button"
                              style={{ marginLeft: "7px", color: "#20ba59", cursor: "pointer", display: "inline-flex", verticalAlign: "middle" }}
                              onClick={() => shareViaWhatsApp(formatDuesReminderBroadcast(p, locale))}
                              title="Send dues statement via WhatsApp"
                            >
                              <MessageCircle size={12} />
                            </button>
                          </small>
                        </span>
                      </div>
                    </td>
                    {months.map((m, index) => {
                      const payment = lookup.get(`${p.id}-${index + 1}`);
                      const collector = payment && data.profiles.find((col) => col.id === payment.collectedBy);
                      const isFuture = Number(year) > now.getFullYear() || (Number(year) === now.getFullYear() && index > now.getMonth());
                      const isAdvance = Boolean(payment && isFuture);

                      return (
                        <td key={m} className={index === now.getMonth() && Number(year) === now.getFullYear() ? "current-month" : ""}>
                          <button
                            className={`dues-cell ${payment ? (isAdvance ? "dues-advance" : "dues-paid") : isFuture ? "dues-future" : "dues-unpaid"}`}
                            disabled={!payment && !canCollect}
                            title={
                              payment
                                ? `${money(payment.amount)} · ${payment.paymentMode.toUpperCase()} · Collector: ${collector?.fullName || "Unit Executive"} · ${new Date(payment.paidAt).toLocaleDateString("en-IN")}`
                                : `${m} ${year} · Unpaid${canCollect ? " · Click to record payment" : ""}`
                            }
                            onClick={() =>
                              payment
                                ? open("duesDetail", payment)
                                : open("dues", { memberId: p.id, month: index + 1, year: Number(year) })
                            }
                          >
                            {payment ? (isAdvance ? `ADV ${payment.amount}` : `₹${payment.amount}`) : isFuture ? "·" : "—"}
                          </button>
                        </td>
                      );
                    })}
                    <td className="year-total">
                      {money(payments.filter((d) => d.memberId === p.id).reduce((s, d) => s + d.amount, 0))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!people.length && (
          <EmptyState icon={CircleCheck} title="No entries found" description="All members are clear or no records match this search." />
        )}

        <div className="matrix-legend">
          <span><i className="legend-square paid" />Paid regular month</span>
          <span><i className="legend-square advance" />Paid in advance (Lump sum mapped)</span>
          <span><i className="legend-square unpaid" />Unpaid month</span>
          <span className="legend-hint">Select any cell to inspect collector stamp or quickly enter cash/UPI payment</span>
        </div>
        <Pagination page={page} total={people.length} size={10} setPage={setPage} />
      </section>

      <div className="info-strip">
        <IndianRupee size={17} />
        <span>
          <strong>Advance & multi-month lump-sum auto-allocation:</strong> Bulk contributions (e.g. ₹240, ₹500) automatically distribute across upcoming consecutive unpaid months on the ledger matrix.
        </span>
      </div>
    </div>
  );
}

export function DonationsView({ data, open }: Props) {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");
  const [page, setPage] = useState(0);
  const user = data.profiles.find((p) => p.id === data.currentUserId)!;
  const canManage = user.role !== "member";
  const now = new Date();

  const total = data.donations.reduce((s, d) => s + d.amount, 0);
  const monthly = data.donations
    .filter((d) => new Date(d.createdAt).getMonth() === now.getMonth() && new Date(d.createdAt).getFullYear() === now.getFullYear())
    .reduce((s, d) => s + d.amount, 0);

  const list = data.donations.filter(
    (d) => d.donorName.toLowerCase().includes(search.toLowerCase()) && (method === "all" || d.paymentMode === method)
  );

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow="MODULE B · DONATION REGISTER & MULTI-CHANNEL RECEIPTS"
        title="Public & patron contribution register."
        description={`Audit record of public contributions, convention donations, and patron support with multi-channel digital receipts and automated SMS notification tracking.`}
      >
        {canManage && <Button icon={Plus} onClick={() => open("donation")}>Record donation</Button>}
      </PageHeading>

      <div className="mini-stats-grid">
        <MiniStat icon={HeartHandshake} title="Total donation fund" value={money(total)} detail="External contributions powering public science conventions" tone="lavender" />
        <MiniStat icon={Wallet} title={`${months[now.getMonth()]} ${now.getFullYear()} contributions`} value={money(monthly)} detail="Audited cash, UPI, and bank transfers" tone="sage" />
        <MiniStat icon={ReceiptText} title="Digital slips issued" value={String(data.donations.length)} detail="Universal sharing enabled via WhatsApp, Telegram & PDF" />
      </div>

      <section className="panel register-panel">
        <div className="register-toolbar">
          <div className="toolbar-left">
            <h2 className="toolbar-title">
              Donation register <span>{data.donations.length} records</span>
            </h2>
            <Select label="Payment method" value={method} onChange={(v) => { setMethod(v); setPage(0); }}>
              <option value="all">All payment instruments</option>
              <option value="cash">Cash receipt</option>
              <option value="upi">UPI instant</option>
              <option value="bank_transfer">Bank transfer / NEFT</option>
            </Select>
          </div>
          <div className="toolbar-right">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Find donor, school, or patron…" />
            <ExportButton onClick={() => downloadCsv(`${identity.filePrefix}-donations.csv`, [["Receipt No.", "Date", "Donor Name", "Amount (INR)", "Payment Mode", "Ref", "Event Purpose", "SMS Sent"], ...list.map((d) => [d.receiptNo, new Date(d.createdAt).toLocaleDateString("en-IN"), d.donorName, d.amount, d.paymentMode, d.transactionRef || "", data.events.find((e) => e.id === d.eventId)?.title || "General unit fund", d.smsSent ? "YES" : "NO"])])} />
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table donation-table">
            <thead>
              <tr>
                <th>DONOR & TYPE</th>
                <th>DATE</th>
                <th>CONTRIBUTION</th>
                <th>INSTRUMENT</th>
                <th>ALLOCATION PURPOSE</th>
                <th>SMS CONFIRMATION</th>
                <th>DIGITAL SLIP</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(page * 10, page * 10 + 10).map((d) => {
                const badge = getDonorBadge(d);
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="donor-cell">
                        <span className={`donor-category-pill badge-${badge.tone}`}>{badge.label}</span>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <strong className="block leading-tight">{d.donorName}</strong>
                          <small className="mono text-muted block text-[10px] leading-tight">{d.receiptNo}</small>
                        </div>
                      </div>
                    </td>
                    <td className="muted-cell">
                      {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="donation-amount">{money(d.amount)}</td>
                    <td>
                      <span className="payment-label">
                        {d.paymentMode === "bank_transfer" ? "Bank Transfer" : d.paymentMode === "upi" ? "UPI" : "Cash"}
                      </span>
                    </td>
                    <td className="event-support-cell">
                      {data.events.find((e) => e.id === d.eventId)?.title || "General Science Outreach"}
                    </td>
                    <td>
                      <button
                        className={`sms-status-btn ${d.smsSent ? "sms-dispatched" : "sms-pending"}`}
                        onClick={() => open("smsPreview", d)}
                        title="View SMS notification gateway copy"
                      >
                        <MessageSquare size={12} />
                        {d.smsSent ? "SMS Dispatched" : "SMS Ready (View)"}
                      </button>
                    </td>
                    <td>
                      <button className="table-action font-semibold" onClick={() => open("receipt", d)}>
                        <ReceiptText size={14} />
                        View slip
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!list.length && (
          <EmptyState icon={HeartHandshake} title="No contributions recorded" description="Record a donation to generate an official digital slip." />
        )}
        <Pagination page={page} total={list.length} size={10} setPage={setPage} />
      </section>

      <div className="donation-note">
        <HeartHandshake size={23} strokeWidth={1.5} />
        <div>
          <h3>Multi-Channel Receipt Architecture & Official Society Registration</h3>
          <p>
            Each donation slip carries the official society registration number ({identity.registrationNo} under {identity.act}), authorized treasurer signature, and official seal. Universal sharing is formatted for WhatsApp, Telegram, or direct A4 print.
          </p>
        </div>
      </div>
    </div>
  );
}

export function MiniStat({ icon: Icon, title, value, detail, tone = "orange" }: { icon: typeof Users; title: string; value: string; detail: string; tone?: string }) {
  return (
    <div className={`mini-stat ${tone === "orange" ? "tone-orange" : ""}`}>
      <span className={`stat-icon stat-icon-${tone}`}>
        <Icon size={20} strokeWidth={1.6} />
      </span>
      <div>
        <span className="mini-stat-title">{title}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function Pagination({ page, total, size, setPage }: { page: number; total: number; size: number; setPage: (p: number) => void }) {
  return (
    <div className="pagination">
      <span>
        Showing {total ? page * size + 1 : 0}–{Math.min((page + 1) * size, total)} of {total} records
      </span>
      <div>
        <button className="icon-button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span>
          {page + 1} <span className="muted-small">/ {Math.max(1, Math.ceil(total / size))}</span>
        </span>
        <button className="icon-button" aria-label="Next page" disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
