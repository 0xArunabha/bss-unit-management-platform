"use client";

import { identity } from "@/lib/identity";
import { ArrowDownLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Clock3, HeartHandshake, IdCard, IndianRupee, KeyRound, MessageCircle, MessageSquare, Plus, ReceiptText, Search, Send, ShieldCheck, Unlink, UserPlus, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { type WorkspaceData, type DuesRecord, type Donation, type PerformAction, type Role, months } from "@/lib/types";
import { Badge, Button, EmptyState, ExportButton, PageHeading, SearchInput, Select, downloadCsv } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { getMemberDesignations } from "@/lib/teams";
import { formatDuesReminderBroadcast, shareViaWhatsApp } from "@/lib/whatsapp";
import { hapticTap } from "@/lib/haptics";
import type { OpenModal } from "@/components/overview";

type Props = { data: WorkspaceData; open: OpenModal; perform?: PerformAction };
/** Role names as written in CSV exports, which stay in English whatever the app language. */
const ROLE_EN: Record<string, string> = { admin: "Executive", organizer: "Organizer", volunteer: "Volunteer", member: "Member" };

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
  const { locale, t, tx, num, money, fmtDate, roleName } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const current = data.profiles.find((p) => p.id === data.currentUserId) || data.profiles[0] || {
    id: "",
    fullName: t("Public Visitor"),
    phone: null,
    role: "guest" as Role,
    status: "active",
    monthlyPledge: 0,
    avatarColor: "sand",
    unpaidMonths: 0,
    createdAt: new Date().toISOString(),
  };
  const isExecutive = current.role === "admin";
  const canCollect = current.role !== "member" && current.role !== "guest";

  const people = data.profiles.filter((p) => {
    const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase()) || (p.phone && p.phone.includes(search));
    if (!matchesSearch) return false;
    if (filter === "inactive") return p.status === "inactive" || (p.unpaidMonths || 0) >= 6;
    if (filter === "active") return p.status === "active" && (p.unpaidMonths || 0) < 6;
    if (filter === "volunteers") return ["volunteer", "organizer", "admin"].includes(p.role);
    return true;
  });

  const shown = people.slice(page * 12, page * 12 + 12);
  const inactiveCount = data.profiles.filter((p) => p.status === "inactive" || (p.unpaidMonths || 0) >= 6).length;
  const volunteerCount = data.profiles.filter((p) => ["volunteer", "organizer", "admin"].includes(p.role)).length;

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow={t("UNIT ROSTER · THE PEOPLE BEHIND SCIENCE ADVOCACY")}
        title={t("Active members & volunteer organizers.")}
        description={t("Unit membership roster for {fullName}. Baseline pledge ₹20/month with voluntary higher contributions.", { fullName: t(identity.fullName) })}
      >
        {isExecutive && <Button icon={UserPlus} onClick={() => open("member")}>{t("Add member")}</Button>}
      </PageHeading>

      <div className="mini-stats-grid">
        <MiniStat icon={Users} title={t("Unit members")} value={String(data.profiles.length)} detail={t("Enrolled advocates & volunteers across Jalpaiguri")} />
        <MiniStat icon={ShieldCheck} title={t("Active field organizers")} value={String(volunteerCount)} detail={t("Empowered for procurement verification & dues collection")} tone="sage" />
        <MiniStat
          icon={Clock3}
          title={t("Flagged dues pending (6+ mo)")}
          value={String(inactiveCount)}
          detail={t("Automatic threshold: 6 consecutive unpaid months flags inactive")}
          tone="orange"
        />
      </div>

      <section className="panel register-panel">
        <div className="register-toolbar">
          <div className="tabs">
            {[
              ["all", t("All members"), data.profiles.length],
              ["active", t("Active roster"), data.profiles.length - inactiveCount],
              ["inactive", t("Dues pending (6+ mo)"), inactiveCount],
              ["volunteers", t("Organizers & cadre"), volunteerCount],
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
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder={t("Search the unit…")} />
            <ExportButton
              onClick={() =>
                downloadCsv(
                  `${identity.filePrefix}-members.csv`,
                  [
                    isExecutive
                      ? ["Member Code", "Name", "Role", "Status", "Monthly pledge", "Unpaid months", "Joined", "Google Account"]
                      : ["Member Code", "Name", "Role", "Status", "Monthly pledge", "Unpaid months", "Joined"],
                    ...people.map((p, idx) => [
                      `JPG-${String(idx + 1).padStart(3, "0")}`,
                      p.fullName,
                      ROLE_EN[p.role] || p.role,
                      p.status,
                      p.monthlyPledge,
                      p.unpaidMonths || 0,
                      new Date(p.createdAt).toLocaleDateString("en-IN"),
                      ...(isExecutive ? [p.googleEmail || "Not linked"] : []),
                    ]),
                  ]
                )
              }
            />
          </div>
        </div>

        <div className="table-scroll desktop-only-table">
          <table className="data-table member-table">
            <thead>
              <tr>
                <th>{t("CODE & MEMBER")}</th>
                <th>{t("ROLE")}</th>
                <th>{t("MONTHLY PLEDGE")}</th>
                <th>{t("DUES AUDIT STATUS")}</th>
                <th>{t("ENROLLED")}</th>
                <th>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p, index) => {
                const memberCode = `JPG-${String(page * 12 + index + 1).padStart(3, "0")}`;
                const isOverdue = p.status === "inactive" || (p.unpaidMonths || 0) >= 6;
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
                          title={t("Click to view Official ID Card")}
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
                            {p.phone ? `+91 ${p.phone}` : t("{city} Unit", { city: t(identity.city) })}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-label role-${p.role}`}>
                        {roleName(p.role)}
                      </span>
                    </td>
                    <td>
                      <strong className="table-money">
                        {isExecutive || p.id === data.currentUserId ? money(p.monthlyPledge) : "—"}
                      </strong>
                      {(isExecutive || p.id === data.currentUserId) && <span className="muted-small"> {t("/ mo")}</span>}
                    </td>
                    <td>
                      {isExecutive || p.id === data.currentUserId ? (
                        isOverdue ? (
                          <span className="status-stamp-pending">
                            <CircleAlert size={12} />
                            {t("FLAGGED INACTIVE")} ({num(p.unpaidMonths || 0)} {t("MO UNPAID)")}
                          </span>
                        ) : (p.unpaidMonths || 0) > 0 ? (
                          <Badge tone="yellow">{num(p.unpaidMonths || 0)} {t("mo pending")}</Badge>
                        ) : (
                          <span className="status-stamp-ok">
                            <Check size={12} />
                            {t("UP TO DATE")}
                          </span>
                        )
                      ) : (
                        <span className="status-stamp-ok">
                          <Check size={12} />
                          {t("Active")}
                        </span>
                      )}
                    </td>
                    <td className="muted-cell">
                      {fmtDate(p.createdAt, { month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div className="table-actions-cluster">
                        {(isExecutive || p.id === data.currentUserId) && (
                          <button
                            className="table-action"
                            onClick={() => open("idCard", { member: p, memberCode })}
                            title={t("View & print official digital member ID card")}
                          >
                            <IdCard size={14} />
                            {t("ID Card")}
                          </button>
                        )}
                        {isExecutive && (
                          <button
                            className="table-action"
                            style={{ color: "#1fa851" }}
                            onClick={() => shareViaWhatsApp(formatDuesReminderBroadcast(p, locale))}
                            title={t("Share member contribution status via WhatsApp")}
                          >
                            <MessageCircle size={14} />
                            {t("WhatsApp")}
                          </button>
                        )}
                        {canCollect && (
                          <button className="table-action" onClick={() => open("dues", { memberId: p.id })}>
                            {t("Collect dues")}
                            <ArrowUpRight size={14} />
                          </button>
                        )}
                        {isExecutive && !p.hasGoogleLinked && (
                          <button
                            className="table-action table-action-muted"
                            title={t("Issue single-use invite code for this member")}
                            onClick={async () => {
                              if (perform) {
                                const res = await perform("issueClaimCode", { memberId: p.id });
                                if (res && res.claimCode) {
                                  open("showInviteCode", { code: res.claimCode, message: res.message });
                                }
                              }
                            }}
                          >
                            <KeyRound size={14} />
                            {t("Issue Code")}
                          </button>
                        )}
                        {isExecutive && p.hasGoogleLinked && (
                          <button
                            className="table-action table-action-muted"
                            title={t("Unlink Google account so member can re-claim")}
                            onClick={async () => {
                              if (confirm(t("Unlink Google account for {fullName}? They will require a new invite code to log in.", { fullName: p.fullName }))) {
                                if (perform) await perform("unlinkGoogle", { memberId: p.id });
                              }
                            }}
                          >
                            <Unlink size={14} />
                            {t("Unlink")}
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

        <div className="mobile-member-cards">
          {shown.map((p, index) => {
            const memberCode = `JPG-${String(page * 12 + index + 1).padStart(3, "0")}`;
            const isOverdue = p.status === "inactive" || (p.unpaidMonths || 0) >= 6;
            const designations = getMemberDesignations(p.fullName);

            return (
              <article className="mobile-member-card" key={p.id}>
                <div className="mobile-member-card-header">
                  <div className="mobile-member-identity">
                    <button
                      type="button"
                      className="member-code-tag cursor-pointer"
                      onClick={() => open("idCard", { member: p, memberCode })}
                      title={t("Click to view Official ID Card")}
                    >
                      {memberCode}
                    </button>
                    <div className="mobile-member-name-block">
                      <strong>{p.fullName}</strong>
                      {designations.primaryTitleEn !== "Unit Member & Field Advocate" && (
                        <span className="id-card-team-pill">
                          {locale === "bn" ? designations.primaryTitleBn : designations.primaryTitleEn}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`role-label role-${p.role}`}>
                    {roleName(p.role)}
                  </span>
                </div>

                <div className="mobile-member-meta-grid">
                  <div className="mobile-member-meta-item">
                    <span className="mobile-meta-label">{t("MONTHLY PLEDGE")}</span>
                    <strong className="mobile-meta-value">
                      {isExecutive || p.id === data.currentUserId ? t("{amount}/mo", { amount: money(p.monthlyPledge) }) : "—"}
                    </strong>
                  </div>
                  <div className="mobile-member-meta-item">
                    <span className="mobile-meta-label">{t("DUES AUDIT STATUS")}</span>
                    <div className="mobile-meta-value">
                      {isExecutive || p.id === data.currentUserId ? (
                        isOverdue ? (
                          <span className="status-stamp-pending">
                            <CircleAlert size={11} />
                            {t("FLAGGED INACTIVE")}
                          </span>
                        ) : (p.unpaidMonths || 0) > 0 ? (
                          <Badge tone="yellow">{num(p.unpaidMonths || 0)} {t("mo")}</Badge>
                        ) : (
                          <span className="status-stamp-ok">
                            <Check size={11} />
                            {t("UP TO DATE")}
                          </span>
                        )
                      ) : (
                        <span className="status-stamp-ok">
                          <Check size={11} />
                          {t("Active")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mobile-member-meta-item">
                    <span className="mobile-meta-label">{t("PHONE")}</span>
                    <span className="mobile-meta-value mono text-xs">
                      {p.phone ? `+91 ${p.phone}` : t("{city} Unit", { city: t(identity.city) })}
                    </span>
                  </div>
                  <div className="mobile-member-meta-item">
                    <span className="mobile-meta-label">{t("ENROLLED")}</span>
                    <span className="mobile-meta-value text-xs muted-cell">
                      {fmtDate(p.createdAt, { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="mobile-member-card-actions">
                  {canCollect && (
                    <button className="mobile-card-action-btn primary" onClick={() => { hapticTap(); open("dues", { memberId: p.id }); }}>
                      <IndianRupee size={13} />
                      {t("Collect dues")}
                    </button>
                  )}
                  {isExecutive && (
                    <button
                      className="mobile-card-action-btn whatsapp"
                      onClick={() => { hapticTap(); shareViaWhatsApp(formatDuesReminderBroadcast(p, locale)); }}
                      title={t("Share member contribution status via WhatsApp")}
                    >
                      <MessageCircle size={13} />
                      {t("WhatsApp")}
                    </button>
                  )}
                  {(isExecutive || p.id === data.currentUserId) && (
                    <button
                      className="mobile-card-action-btn"
                      onClick={() => { hapticTap(); open("idCard", { member: p, memberCode }); }}
                      title={t("View & print official digital member ID card")}
                    >
                      <IdCard size={13} />
                      {t("ID Card")}
                    </button>
                  )}
                  {isExecutive && !p.hasGoogleLinked && (
                    <button
                      className="mobile-card-action-btn primary"
                      title={t("Issue single-use invite code for this member")}
                      onClick={async () => {
                        if (perform) {
                          const res = await perform("issueClaimCode", { memberId: p.id });
                          if (res && res.claimCode) {
                            open("showInviteCode", { code: res.claimCode, message: res.message });
                          }
                        }
                      }}
                    >
                      <KeyRound size={13} />
                      {t("Issue Code")}
                    </button>
                  )}
                  {isExecutive && p.hasGoogleLinked && (
                    <button
                      className="mobile-card-action-btn muted"
                      title={t("Unlink Google account")}
                      onClick={async () => {
                        if (confirm(t("Unlink Google account for {fullName}?", { fullName: p.fullName }))) {
                          if (perform) await perform("unlinkGoogle", { memberId: p.id });
                        }
                      }}
                    >
                      <Unlink size={13} />
                      {t("Unlink")}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {!people.length && (
          <EmptyState icon={Search} title={t("No members match this filter")} description={t("Try clearing your search query or switching tabs.")} />
        )}
        <Pagination page={page} total={people.length} size={12} setPage={setPage} />
      </section>

      <div className="info-strip">
        <CircleCheck size={17} />
        <span>
          {tx("<strong>Strict baseline minimum: ₹20 per member per month.</strong> Members may contribute higher recurring amounts with no upper cap. An automated rule flags any account with 6 consecutive unpaid months as Inactive / Dues Pending on unit rosters.")}
        </span>
      </div>
    </div>
  );
}

export function DuesView({ data, open }: Props) {
  const { locale, t, tx, num, money, fmtDate, monthShort } = useI18n();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const user = data.profiles.find((p) => p.id === data.currentUserId);
  const isExecutive = user ? user.role === "admin" : false;
  const canCollect = user ? user.role !== "member" : false;

  // Non-executives only view their own personal dues history card
  if (!isExecutive) {
    const isLapsed = (user?.unpaidMonths || 0) >= 6;
    return (
      <div className="view-enter">
        <PageHeading
          eyebrow={t("MODULE A · PERSONAL DUES & TREASURY SLIPS")}
          title={t("My Membership Contributions.")}
          description={t("Official digital contribution record for {name}.", { name: user?.fullName || t("Member") })}
        >
          {canCollect && <Button icon={Plus} onClick={() => open("dues")}>{t("Record dues payment")}</Button>}
        </PageHeading>

        {isLapsed && (
          <div className="warning-banner mb-5" role="alert" style={{ background: "#fff3cd", color: "#856404", border: "1px solid #ffeeba", padding: "14px", borderRadius: "8px" }}>
            <CircleAlert size={16} className="inline mr-2" />
            {tx("<strong>Membership Notice:</strong> Your account is currently {unpaidMonths} months pending. You retain uninterrupted access to all unit activities, circulars, and meetings. Please contact unit secretary Arunabha Ghosh to reconcile contributions.", { unpaidMonths: user?.unpaidMonths })}
          </div>
        )}

        <div className="mini-stats-grid">
          <MiniStat icon={Wallet} title={t("My Monthly Pledge")} value={t("{amount}/mo", { amount: money(user?.monthlyPledge || 20) })} detail={t("Grassroots contribution to science movement")} tone="orange" />
          <MiniStat
            icon={CircleCheck}
            title={t("Dues Status")}
            value={user?.unpaidMonths ? t("{count} mo pending", { count: user.unpaidMonths }) : t("Up to date")}
            detail={user?.unpaidMonths ? t("Contribution due for recent months") : t("All monthly pledges cleared")}
            tone={user?.unpaidMonths ? "yellow" : "sage"}
          />
          <MiniStat icon={ReceiptText} title={t("Verified Slips")} value={String(data.dues.length)} detail={t("Official digital treasury receipts")} tone="blue" />
        </div>

        <section className="panel register-panel">
          <div className="section-title" style={{ padding: "16px 20px" }}>
            <h3>{t("Recorded Payment Ledger")}</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted, #666)" }}>{t("Audited dues receipts acknowledged by unit executive.")}</p>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("MONTH & YEAR")}</th>
                  <th>{t("CONTRIBUTION")}</th>
                  <th>{t("PAYMENT MODE")}</th>
                  <th>{t("DATE RECORDED")}</th>
                  <th>{t("DIGITAL SLIP")}</th>
                </tr>
              </thead>
              <tbody>
                {data.dues.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{monthShort(d.month - 1)} {num(d.year)}</strong></td>
                    <td><strong>{money(d.amount)}</strong></td>
                    <td><span className="capitalize">{t(d.paymentMode.replace("_", " "))}</span></td>
                    <td>{fmtDate(d.paidAt, { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td><Button variant="secondary" onClick={() => open("duesDetail", d)}>{t("View Slip")}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!data.dues.length && (
            <EmptyState icon={Wallet} title={t("No dues recorded yet")} description={t("When you make your monthly contribution, your official digital receipts will be listed here.")} />
          )}
        </section>

        {canCollect && (
          <section className="panel" style={{ padding: "24px", marginTop: "24px", textAlign: "center" }}>
            <div style={{ maxWidth: "560px", margin: "0 auto" }}>
              <IndianRupee size={36} style={{ color: "var(--brand, #0066cc)", margin: "0 auto 12px" }} />
              <h3 style={{ margin: "0 0 8px 0" }}>{t("Field Dues Collection Workbench")}</h3>
              <p style={{ color: "var(--muted, #666)", lineHeight: 1.5, marginBottom: "20px" }}>
                {t("As an organizer or volunteer, you are authorized to collect cash or UPI dues from fellow unit members during conventions and meetings. Member status updates instantly.")}
              </p>
              <Button icon={Plus} onClick={() => open("dues")}>
                {t("Record Member Dues Payment")}
              </Button>
            </div>
          </section>
        )}
      </div>
    );
  }

  const payments = data.dues.filter((d) => d.year === Number(year));
  const lookup = new Map(payments.map((p) => [`${p.memberId}-${p.month}`, p]));

  const people = data.profiles.filter((p) => {
    if (!canCollect && p.id !== user?.id) return false;
    const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "pending") return !lookup.has(`${p.id}-${now.getMonth() + 1}`);
    if (filter === "inactive") return p.status === "inactive" || (p.unpaidMonths || 0) >= 6;
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
        eyebrow={t("MODULE A · MEMBERSHIP DUES & TREASURY LEDGER")}
        title={t("12-Month Treasury Matrix.")}
        description={t("Full tabular ledger grid displaying dues payment status, collector attribution, advance lump-sum mapping, and remaining balances for {fullName}.", { fullName: t(identity.fullName) })}
      >
        <ExportButton onClick={() => downloadCsv(`${identity.filePrefix}-dues-${year}.csv`, [["Member Code", "Member Name", ...months, "Year Total"], ...people.map((p, idx) => [`JPG-${String(idx + 1).padStart(3, "0")}`, p.fullName, ...months.map((_, m) => lookup.get(`${p.id}-${m + 1}`)?.amount || ""), payments.filter((d) => d.memberId === p.id).reduce((s, d) => s + d.amount, 0)])])} />
        {canCollect && <Button icon={Plus} onClick={() => open("dues")}>{t("Quick collect")}</Button>}
      </PageHeading>

      <div className="mini-stats-grid">
        <MiniStat icon={Wallet} title={t("Ledger collected in {year}", { year })} value={money(yearTotal)} detail={t("Cash, UPI & Bank transfers audited by unit executives")} />
        <MiniStat
          icon={CircleCheck}
          title={t("{month} {year} collected", { month: monthShort(now.getMonth()), year: now.getFullYear() })}
          value={`${paidCurrentMonth.length} / ${data.profiles.length}`}
          detail={t("{percent}% of members up-to-date this month", { percent: Math.round((paidCurrentMonth.length / data.profiles.length) * 100) })}
          tone="sage"
        />
        <MiniStat
          icon={ArrowDownLeft}
          title={t("Advance dues allocated")}
          value={money(advanceTotal)}
          detail={t("{advancePaymentsCount} future months covered via multi-month lump sums", { advancePaymentsCount: advancePayments.length })}
          tone="blue"
        />
      </div>

      <section className="panel register-panel">
        <div className="register-toolbar">
          <div className="toolbar-left">
            <Select label={t("Dues year")} value={year} onChange={(v) => { setYear(v); setPage(0); }}>
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{t("{y} Annual Ledger", { y })}</option>
              ))}
            </Select>
            <div className="tabs">
              <button className={filter === "all" ? "active" : ""} onClick={() => { setFilter("all"); setPage(0); }}>
                {t("All members")} <span>{num(data.profiles.length)}</span>
              </button>
              <button className={filter === "pending" ? "active" : ""} onClick={() => { setFilter("pending"); setPage(0); }}>
                {t("Pending this month")}
              </button>
              <button className={filter === "advance" ? "active" : ""} onClick={() => { setFilter("advance"); setPage(0); }}>
                {t("Advance paid")}
              </button>
              <button className={filter === "inactive" ? "active" : ""} onClick={() => { setFilter("inactive"); setPage(0); }}>
                {t("Inactive (6+ mo)")}
              </button>
            </div>
          </div>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder={t("Find member in matrix…")} />
        </div>

        <div className="table-scroll matrix-scroll">
          <table className="data-table dues-matrix print-ruled-ledger">
            <thead>
              <tr>
                <th>{t("MEMBER & PLEDGE")}</th>
                {months.map((m, index) => (
                  <th key={m} className={index === now.getMonth() && Number(year) === now.getFullYear() ? "current-month" : ""}>
                    {monthShort(index).toUpperCase()}
                    {index === now.getMonth() && Number(year) === now.getFullYear() && <span className="month-indicator" />}
                  </th>
                ))}
                <th>{t("YEAR TOTAL")}</th>
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
                            {t("{amount} / mo", { amount: money(p.monthlyPledge) })}
                            <button
                              type="button"
                              style={{ marginLeft: "7px", color: "#20ba59", cursor: "pointer", display: "inline-flex", verticalAlign: "middle" }}
                              onClick={() => shareViaWhatsApp(formatDuesReminderBroadcast(p, locale))}
                              title={t("Send dues statement via WhatsApp")}
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
                                ? t("{amount} · {mode} · Collector: {collector} · {date}", { amount: money(payment.amount), mode: t(payment.paymentMode).toUpperCase(), collector: collector?.fullName || t("Unit Executive"), date: fmtDate(payment.paidAt) })
                                : canCollect
                                  ? t("{month} {year} · Unpaid · Click to record payment", { month: monthShort(index), year: Number(year) })
                                  : t("{month} {year} · Unpaid", { month: monthShort(index), year: Number(year) })
                            }
                            onClick={() =>
                              payment
                                ? open("duesDetail", payment)
                                : open("dues", { memberId: p.id, month: index + 1, year: Number(year) })
                            }
                          >
                            {payment ? (isAdvance ? t("ADV {amount}", { amount: payment.amount }) : `₹${payment.amount}`) : isFuture ? "·" : "—"}
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
          <EmptyState icon={CircleCheck} title={t("No entries found")} description={t("All members are clear or no records match this search.")} />
        )}

        <div className="matrix-legend">
          <span><i className="legend-square paid" />{t("Paid regular month")}</span>
          <span><i className="legend-square advance" />{t("Paid in advance (Lump sum mapped)")}</span>
          <span><i className="legend-square unpaid" />{t("Unpaid month")}</span>
          <span className="legend-hint">{t("Select any cell to inspect collector stamp or quickly enter cash/UPI payment")}</span>
        </div>
        <Pagination page={page} total={people.length} size={10} setPage={setPage} />
      </section>

      <div className="info-strip">
        <IndianRupee size={17} />
        <span>
          {tx("<strong>Advance & multi-month lump-sum auto-allocation:</strong> Bulk contributions (e.g. ₹240, ₹500) automatically distribute across upcoming consecutive unpaid months on the ledger matrix.")}
        </span>
      </div>
    </div>
  );
}

export function DonationsView({ data, open }: Props) {
  const { t, money, fmtDate, monthShort } = useI18n();
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");
  const [page, setPage] = useState(0);
  const user = data.profiles.find((p) => p.id === data.currentUserId);
  const isExecutive = user ? user.role === "admin" : false;
  const canRecord = user ? user.role !== "member" : false;
  const now = new Date();

  // Non-executives get the Record-Only workbench or contribution card
  if (!isExecutive) {
    return (
      <div className="view-enter">
        <PageHeading
          eyebrow={t("MODULE B · PUBLIC SCIENCE ADVOCACY FUND")}
          title={t("Public & Patron Science Fund.")}
          description={t("Support student science exhibitions, telescope observation camps, and anti-superstition campaigns.")}
        >
          {canRecord ? (
            <Button icon={Plus} onClick={() => open("donation")}>{t("Record donation")}</Button>
          ) : (
            <Button icon={HeartHandshake} onClick={() => open("donation")}>{t("Contribute to fund")}</Button>
          )}
        </PageHeading>

        <section className="panel record-only-panel" style={{ padding: "36px", textAlign: "center" }}>
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <HeartHandshake size={48} style={{ color: "var(--brand, #0066cc)", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "8px" }}>
              {canRecord ? t("Field Donation Workbench (Record Only)") : t("Grassroots Science Movement Solidarity")}
            </h2>
            <p style={{ color: "var(--muted, #666)", lineHeight: 1.6, marginBottom: "24px" }}>
              {canRecord
                ? t("Volunteers and organizers hold verified donation entry privileges. When you record a public contribution, an official cryptographic digital receipt is generated instantly with universal sharing (WhatsApp/SMS) and verified by Unit Executive Arunabha Ghosh.")
                : t("Contributions power anti-superstition demonstration kits, school science workshops, and public sky-watching sessions across Jalpaiguri. Every contribution receives an official digital receipt verified by unit executives.")}
            </p>
            {canRecord ? (
              <Button icon={Plus} onClick={() => open("donation")}>
                {t("Record Public Contribution Now")}
              </Button>
            ) : (
              <Button icon={HeartHandshake} onClick={() => open("donation")}>
                {t("Contribute to Science Fund")}
              </Button>
            )}
          </div>
        </section>
      </div>
    );
  }

  const canManage = user ? user.role !== "member" : false;

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
        eyebrow={t("MODULE B · DONATION REGISTER & MULTI-CHANNEL RECEIPTS")}
        title={t("Public & patron contribution register.")}
        description={t("Audit record of public contributions, convention donations, and patron support with multi-channel digital receipts and automated SMS notification tracking.")}
      >
        {canManage && <Button icon={Plus} onClick={() => open("donation")}>{t("Record donation")}</Button>}
      </PageHeading>

      <div className="mini-stats-grid">
        <MiniStat icon={HeartHandshake} title={t("Total donation fund")} value={money(total)} detail={t("External contributions powering public science conventions")} tone="lavender" />
        <MiniStat icon={Wallet} title={t("{month} {year} contributions", { month: monthShort(now.getMonth()), year: now.getFullYear() })} value={money(monthly)} detail={t("Audited cash, UPI, and bank transfers")} tone="sage" />
        <MiniStat icon={ReceiptText} title={t("Digital slips issued")} value={String(data.donations.length)} detail={t("Universal sharing enabled via WhatsApp, Telegram & PDF")} />
      </div>

      <section className="panel register-panel">
        <div className="register-toolbar">
          <div className="toolbar-left">
            <h2 className="toolbar-title">
              {t("Donation register")} <span>{t("{donationsCount} records", { donationsCount: data.donations.length })}</span>
            </h2>
            <Select label={t("Payment method")} value={method} onChange={(v) => { setMethod(v); setPage(0); }}>
              <option value="all">{t("All payment instruments")}</option>
              <option value="cash">{t("Cash receipt")}</option>
              <option value="upi">{t("UPI instant")}</option>
              <option value="bank_transfer">{t("Bank transfer / NEFT")}</option>
            </Select>
          </div>
          <div className="toolbar-right">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder={t("Find donor, school, or patron…")} />
            <ExportButton onClick={() => downloadCsv(`${identity.filePrefix}-donations.csv`, [["Receipt No.", "Date", "Donor Name", "Amount (INR)", "Payment Mode", "Ref", "Event Purpose", "SMS Sent"], ...list.map((d) => [d.receiptNo, new Date(d.createdAt).toLocaleDateString("en-IN"), d.donorName, d.amount, d.paymentMode, d.transactionRef || "", data.events.find((e) => e.id === d.eventId)?.title || "General unit fund", d.smsSent ? "YES" : "NO"])])} />
          </div>
        </div>

        <div className="table-scroll desktop-only-table">
          <table className="data-table donation-table">
            <thead>
              <tr>
                <th>{t("DONOR & TYPE")}</th>
                <th>{t("DATE")}</th>
                <th>{t("CONTRIBUTION")}</th>
                <th>{t("INSTRUMENT")}</th>
                <th>{t("ALLOCATION PURPOSE")}</th>
                <th>{t("SMS CONFIRMATION")}</th>
                <th>{t("DIGITAL SLIP")}</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(page * 10, page * 10 + 10).map((d) => {
                const badge = getDonorBadge(d);
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="donor-cell">
                        <span className={`donor-category-pill badge-${badge.tone}`}>{t(badge.label)}</span>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <strong className="block leading-tight">{d.donorName}</strong>
                          <small className="mono text-muted block text-[length:max(10px,var(--fs-floor,0px))] leading-tight">{d.receiptNo}</small>
                        </div>
                      </div>
                    </td>
                    <td className="muted-cell">
                      {fmtDate(d.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="donation-amount">{money(d.amount)}</td>
                    <td>
                      <span className="payment-label">
                        {d.paymentMode === "bank_transfer" ? t("Bank Transfer") : d.paymentMode === "upi" ? t("UPI") : t("Cash")}
                      </span>
                    </td>
                    <td className="event-support-cell">
                      {data.events.find((e) => e.id === d.eventId)?.title || t("General Science Outreach")}
                    </td>
                    <td>
                      <button
                        className={`sms-status-btn ${d.smsSent ? "sms-dispatched" : "sms-pending"}`}
                        onClick={() => open("smsPreview", d)}
                        title={t("View SMS notification gateway copy")}
                      >
                        <MessageSquare size={12} />
                        {d.smsSent ? t("SMS Dispatched") : t("SMS Ready (View)")}
                      </button>
                    </td>
                    <td>
                      <button className="table-action font-semibold" onClick={() => open("receipt", d)}>
                        <ReceiptText size={14} />
                        {t("View slip")}
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mobile-donation-cards">
          {list.slice(page * 10, page * 10 + 10).map((d) => {
            const badge = getDonorBadge(d);
            return (
              <article className="mobile-donation-card" key={d.id}>
                <div className="mobile-donation-card-header">
                  <div className="mobile-donor-identity">
                    <span className={`donor-category-pill badge-${badge.tone}`}>{t(badge.label)}</span>
                    <div className="mobile-donor-name-block">
                      <strong>{d.donorName}</strong>
                      <small className="mono text-muted block text-[length:max(10.5px,var(--fs-floor,0px))] leading-tight">{d.receiptNo}</small>
                    </div>
                  </div>
                  <strong className="mobile-donation-amount">{money(d.amount)}</strong>
                </div>

                <div className="mobile-donation-meta-grid">
                  <div className="mobile-donation-meta-item">
                    <span className="mobile-meta-label">{t("DATE & INSTRUMENT")}</span>
                    <span className="mobile-meta-value">
                      {fmtDate(d.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      <span className="payment-label">{d.paymentMode === "bank_transfer" ? t("Bank Transfer") : d.paymentMode === "upi" ? t("UPI") : t("Cash")}</span>
                    </span>
                  </div>
                  <div className="mobile-donation-meta-item">
                    <span className="mobile-meta-label">{t("ALLOCATION PURPOSE")}</span>
                    <span className="mobile-meta-value text-muted truncate">
                      {data.events.find((e) => e.id === d.eventId)?.title || t("General Science Outreach")}
                    </span>
                  </div>
                </div>

                <div className="mobile-donation-card-actions">
                  <button className="mobile-card-action-btn primary" onClick={() => { hapticTap(); open("receipt", d); }}>
                    <ReceiptText size={13} />
                    {t("View digital slip")}
                    <ArrowUpRight size={13} />
                  </button>
                  <button
                    className={`mobile-card-action-btn ${d.smsSent ? "whatsapp" : ""}`}
                    onClick={() => { hapticTap(); open("smsPreview", d); }}
                    title={t("View SMS notification gateway copy")}
                  >
                    <MessageSquare size={13} />
                    {d.smsSent ? t("SMS Dispatched") : t("SMS Ready (View)")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {!list.length && (
          <EmptyState icon={HeartHandshake} title={t("No contributions recorded")} description={t("Record a donation to generate an official digital slip.")} />
        )}
        <Pagination page={page} total={list.length} size={10} setPage={setPage} />
      </section>

      <div className="donation-note">
        <HeartHandshake size={23} strokeWidth={1.5} />
        <div>
          <h3>{t("Multi-Channel Receipt Architecture & Official Society Registration")}</h3>
          <p>
            {t("Each donation slip carries the official society registration number ({registrationNo} under {act}), authorized treasurer signature, and official seal. Universal sharing is formatted for WhatsApp, Telegram, or direct A4 print.", { registrationNo: identity.registrationNo, act: t(identity.act) })}
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
  const { t, num } = useI18n();
  return (
    <div className="pagination">
      <span>
        {t("Showing")} {total ? page * size + 1 : 0}{t("–{min} of {total} records", { min: Math.min((page + 1) * size, total), total })}
      </span>
      <div>
        <button className="icon-button" aria-label={t("Previous page")} disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span>
          {num(page + 1)} <span className="muted-small">/ {num(Math.max(1, Math.ceil(total / size)))}</span>
        </span>
        <button className="icon-button" aria-label={t("Next page")} disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
