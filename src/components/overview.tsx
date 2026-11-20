"use client";

import { identity } from "@/lib/identity";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleCheck, ClipboardList, FileText, HeartHandshake, MapPin, Megaphone, MessageCircle, Package, Pin, Plus, ShieldAlert, Users, Wallet, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { type WorkspaceData, type View, type UnitEvent, type Circular, type Procurement } from "@/lib/types";
import { Avatar, Badge, Button, PageHeading, SectionTitle, ArrowLink, relativeTime } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { isMashkalaibari } from "@/lib/localize-content";
import { formatEventBroadcast, shareViaWhatsApp } from "@/lib/whatsapp";
import { isCampaignEvent, hydrateCampaignEvent } from "@/lib/campaign-data";

export type OpenModal = (type: string, record?: unknown) => void;
export type Navigate = (view: View, eventId?: string) => void;

export function Overview({ data, navigate, open }: { data: WorkspaceData; navigate: Navigate; open: OpenModal }) {
  const { t, tx, num, money } = useI18n();
  const [period, setPeriod] = useState("This month");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"all" | "dues" | "procurement" | "donation">("all");
  const { locale } = useI18n();
  const [currentTime] = useState(() => Date.now());
  const now = new Date(currentTime);
  const currentUser = data.profiles.find((p) => p.id === data.currentUserId);
  const userRole = data.currentUserRole || currentUser?.role || "guest";
  const isGuest = userRole === "guest";
  const isExecutive = userRole === "admin";
  const isVolunteerOrOrganizer = userRole === "volunteer" || userRole === "organizer";
  const canCollect = ["admin", "organizer", "volunteer"].includes(userRole);
  const active = data.profiles.filter((p) => p.status === "active").length;
  const ongoingCampaign = data.events.filter(isCampaignEvent).map(hydrateCampaignEvent).find((c) => c.isOngoing);
  const [urgentAlertDismissed, setUrgentAlertDismissed] = useState(false);
  const pendingAppsCount = (data.applications || []).filter((a) => a.status === "pending").length;

  const inPeriod = (date: string) =>
    period === "All time" ||
    (new Date(date).getFullYear() === now.getFullYear() && (period === "This year" || new Date(date).getMonth() === now.getMonth()));

  const duesTotal = data.dues.filter((d) => inPeriod(d.paidAt)).reduce((sum, d) => sum + d.amount, 0);
  const donationsTotal = data.donations.filter((d) => inPeriod(d.createdAt)).reduce((sum, d) => sum + d.amount, 0);
  const balance =
    data.openingBalance +
    data.dues.reduce((s, d) => s + d.amount, 0) +
    data.donations.reduce((s, d) => s + d.amount, 0) -
    data.procurements.reduce((s, d) => s + (d.actualCost || 0), 0);

  const paidCount = data.dues.filter((d) => d.month === now.getMonth() + 1 && d.year === now.getFullYear()).length;
  const paidPercent = data.profiles.length > 0 ? Math.round((paidCount / data.profiles.length) * 100) : 0;
  const needed = data.procurements.filter((p) => p.status === "needed").length;
  const items = [...data.procurements]
    .sort((a, b) => ({ needed: 0, purchased: 1, verified: 2 }[a.status] - { needed: 0, purchased: 1, verified: 2 }[b.status]))
    .slice(0, 4);

  const upcoming = data.events.filter((e) => !isCampaignEvent(e) && new Date(e.startsAt).getTime() >= currentTime - 86400000).slice(0, 3);

  const urgentItems = data.procurements.filter((p) => {
    if (p.status !== "needed") return false;
    const ev = data.events.find((e) => e.id === p.eventId);
    if (!ev) return false;
    const ms = new Date(ev.startsAt).getTime() - currentTime;
    return ms >= -86400000 && ms <= 48 * 3600000;
  });

  const filteredActivities = data.activities.filter((a) => {
    if (activityFilter === "all") return true;
    if (activityFilter === "dues") return a.type === "dues";
    if (activityFilter === "procurement") return ["procurement", "purchase", "verified"].includes(a.type);
    if (activityFilter === "donation") return a.type === "donation";
    return true;
  });

  return (
    <div className="view-enter">
      <PageHeading title={t("Unit overview")} description={t("{name} · {organisation}, {unit}.", { name: t(identity.name), organisation: t(identity.organisation), unit: t(identity.unit) })}>
        {!isGuest && isExecutive && (
          <div className="period-container">
            <button className="button button-secondary period-button" onClick={() => setPeriodOpen(!periodOpen)}>
              <CalendarDays size={15} />
              {t(period)}
              <ChevronDown size={14} />
            </button>
            {periodOpen && (
              <div className="small-menu period-menu">
                {["This month", "This year", "All time"].map((p) => (
                  <button key={p} onClick={() => { setPeriod(p); setPeriodOpen(false); }}>
                    {t(p)}
                    {p === period && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {isExecutive && pendingAppsCount > 0 && (
          <Button
            variant="secondary"
            icon={ClipboardList}
            onClick={() => open("reviewApplications")}
          >
            {t("Review applications")}
            <span className="badge badge-orange ml-1.5" style={{ fontSize: "10px", padding: "1px 6px" }}>{pendingAppsCount}</span>
          </Button>
        )}
        {canCollect && <Button icon={Plus} onClick={() => open("dues")}>{t("Quick collect")}</Button>}
      </PageHeading>

      {/* Urgent Field Requisition Broadcast Alert if any items needed within 48h */}
      {urgentItems.length > 0 && !urgentAlertDismissed && (() => {
        const urgentEvents = Array.from(new Set(urgentItems.map((p) => p.eventId)))
          .map((id) => data.events.find((e) => e.id === id))
          .filter(Boolean);
        const urgentEventTitles = urgentEvents.map((e) => e?.title).join(" · ");
        return (
          <div className="urgent-dispatch-banner print-tech-slip mb-5">
            <span className="print-mark print-mark-tl slip-mark" />
            <span className="print-mark print-mark-tr slip-mark" />
            <div className="urgent-dispatch-left">
              <span className="stamp-needed text-[length:max(7.5px,var(--fs-floor,0px))] font-bold">
                <ShieldAlert size={12} className="inline mr-1" />
                {t("URGENT FIELD DISPATCH <48H")}
              </span>
              <p>
                {urgentEvents.length > 1
                  ? tx("<strong>{count} requisitions urgently needed</strong> across {eventsCount} programmes: <em>{titles}</em>. Volunteers may log out-of-pocket purchases.", { count: urgentItems.length, eventsCount: urgentEvents.length, titles: urgentEventTitles })
                  : tx("<strong>{count} requisitions urgently needed</strong> for upcoming programme: <em>{title}</em>. Volunteers may log out-of-pocket purchases.", { count: urgentItems.length, title: urgentEventTitles })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="button button-dark text-xs whitespace-nowrap"
                onClick={() => navigate("procurement", urgentItems[0]?.eventId)}
              >
                {t("Open requisition board")} <ArrowRight size={13} />
              </button>
              <button
                className="icon-button"
                onClick={() => setUrgentAlertDismissed(true)}
                aria-label={t("Dismiss urgent alert")}
                title={t("Dismiss alert")}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Actionable items hoisted above decorative hero for logged-in members & organizers */}
      {(isExecutive || isVolunteerOrOrganizer) && items.length > 0 && (
        <section className="panel procurement-panel mb-6">
          <SectionTitle title={t("A few things need a hand")} subtitle={t("Requisitions pending out-of-pocket purchase or peer check.")}>
            <ArrowLink onClick={() => navigate("procurement")}>{t("View checklist")}</ArrowLink>
          </SectionTitle>
          <div className="attention-table">
            <div className="attention-table-head">
              <span>{t("ITEM & EVENT")}</span>
              <span>{t("STAGE")}</span>
              <span>{t("EST. COST")}</span>
              <span />
            </div>
            {items.map((item, idx) => (
              <AttentionRow
                key={item.id}
                item={item}
                data={data}
                index={idx + 1}
                onClick={() =>
                  item.status === "needed"
                    ? open("purchase", item)
                    : item.status === "purchased"
                    ? open("verify", item)
                    : navigate("procurement", item.eventId)
                }
              />
            ))}
          </div>
          <button className="panel-footer attention-footer" onClick={() => navigate("procurement")}>
            <span>
              <span className="attention-dot" />{t("{count} items still needed", { count: needed })}
              <span className="footer-divider">·</span>{t("Every helping hand counts.")}
            </span>
            <ArrowRight size={15} />
          </button>
        </section>
      )}

      {/* Two-ink poster banner */}
      <section className="campaign-banner" aria-label={t("{name}: science for society", { name: t(identity.name) })}>
        <div className="campaign-content">
          <div className="campaign-eyebrow"><span />{t(identity.volumeLine)}</div>
          <h2>{tx("Science for society.<br/>Progress, <em>together.</em>")}</h2>
          <p>{tx("Rooted in {city}. Open to everyone.<br/>A community that turns questions into action.", { city: t(identity.city) })}</p>
          <button className="campaign-link" onClick={() => navigate("campaigns")}>
            {t("Let’s make a difference")}<ArrowUpRight size={16} />
          </button>
        </div>
        <div className="campaign-image">
          <div className="campaign-image-fallback" aria-hidden="true">
            <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="campaign-vector-art">
              <circle cx="280" cy="120" r="90" stroke="rgba(224,113,63,0.25)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="280" cy="120" r="140" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <circle cx="280" cy="120" r="45" stroke="rgba(224,113,63,0.4)" strokeWidth="1.5" />
              <circle cx="280" cy="120" r="5" fill="#e0713f" />
              <circle cx="345" cy="75" r="4" fill="#a8b691" />
              <circle cx="190" cy="150" r="3.5" fill="#f4efdf" opacity="0.6" />
              <path d="M160 200 L280 120 L380 180" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <path d="M220 50 L280 120 L350 40" stroke="rgba(224,113,63,0.22)" strokeWidth="1" />
            </svg>
          </div>
          <img
            src="/images/science-march.jpg"
            alt={t("BSS members and scientists taking part in the All India Science Conference science march")}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
          <div className="photo-caption">
            <span className="live-dot" />{t("ON THE GROUND")}
            <span className="caption-divider" />{t("All India Science Conference, 2025")}
          </div>
        </div>
        <span className="campaign-bengali" aria-hidden="true">{identity.bengali}</span>
      </section>

      {/* Role-tailored stats grid: strictly no money figures for public visitors */}
      {userRole === "guest" ? (
        <div className="stats-grid">
          <Stat
            icon={CalendarDays}
            tone="orange"
            title={t("Active campaigns")}
            value={ongoingCampaign ? t("1 Ongoing") : num(data.events.length)}
            onClick={() => (ongoingCampaign ? open("event", ongoingCampaign) : navigate("campaigns"))}
          >
            <span className="stat-footnote">
              <span className="tiny-dot green" />
              {ongoingCampaign ? t("{percent}% target reached · Mashkalaibari", { percent: ongoingCampaign.progressPercent || 20 }) : t("Scheduled outreach across Jalpaiguri")}
            </span>
            {ongoingCampaign && (
              <div className="stat-progress-track">
                <div
                  className="stat-progress-fill"
                  style={{ width: `${ongoingCampaign.progressPercent || 20}%` }}
                />
              </div>
            )}
          </Stat>
          <Stat icon={Megaphone} tone="blue" title={t("Demonstration toolkits")} value={t("Available")} onClick={() => navigate("resources")}>
            <span className="stat-footnote">{t("Anti-superstition chemical & physics scripts")}</span>
          </Stat>
          <Stat icon={Users} tone="sage" title={t("Citizen advocacy")} value={t("Open")} onClick={() => navigate("campaigns")}>
            <div className="dues-stat-bottom">
              <span>{t("No fees · Students and citizens welcome")}</span>
            </div>
          </Stat>
          <Stat icon={HeartHandshake} tone="lavender" title={t("Public movement")} value={t("Support")} onClick={() => open("donation")}>
            <span className="stat-footnote">
              <span className="tiny-dot purple" />
              {t("100% voluntary · Powered by people")}
            </span>
          </Stat>
        </div>
      ) : isExecutive ? (
        <div className="stats-grid">
          <Stat icon={Wallet} tone="orange" title={t("Unit balance")} value={money(balance)} onClick={() => navigate("dues")}>
            <span className="stat-footnote"><span className="tiny-dot green" />{t("Net treasury available")}</span>
          </Stat>
          <Stat icon={Users} tone="blue" title={t("Unit members")} value={num(data.profiles.length)} onClick={() => navigate("members")}>
            <span className="stat-footnote">
              <strong>{t("{count} active", { count: active })}</strong>
              <span className="text-dot">·</span>
              {t("{count} flagged dues pending", { count: data.profiles.length - active })}
            </span>
          </Stat>
          <Stat icon={ArrowDownLeft} tone="sage" title={t("Membership dues")} value={money(duesTotal)} onClick={() => navigate("dues")}>
            <div className="dues-stat-bottom">
              <span>{tx("{paid} of {total} paid this month <b>{percent}%</b>", { paid: paidCount, total: data.profiles.length, percent: paidPercent })}</span>
              <div className="progress-track"><span style={{ width: `${paidPercent}%` }} /></div>
            </div>
          </Stat>
          <Stat icon={HeartHandshake} tone="lavender" title={t("Donations received")} value={money(donationsTotal)} onClick={() => navigate("donations")}>
            <span className="stat-footnote">
              <span className="tiny-dot purple" />
              {t("{count} contributions · {period}", { count: data.donations.filter((d) => inPeriod(d.createdAt)).length, period: t(period.toLowerCase()) })}
            </span>
          </Stat>
        </div>
      ) : (
        <div className="stats-grid">
          <Stat
            icon={CalendarDays}
            tone="orange"
            title={t("Active campaigns")}
            value={ongoingCampaign ? t("1 Ongoing") : num(data.events.length)}
            onClick={() => (ongoingCampaign ? open("event", ongoingCampaign) : navigate("campaigns"))}
          >
            <span className="stat-footnote">
              <span className="tiny-dot green" />
              {ongoingCampaign ? t("{percent}% reached · Mashkalaibari", { percent: ongoingCampaign.progressPercent || 20 }) : t("Unit programmes & conventions")}
            </span>
            {ongoingCampaign && (
              <div className="stat-progress-track">
                <div
                  className="stat-progress-fill"
                  style={{ width: `${ongoingCampaign.progressPercent || 20}%` }}
                />
              </div>
            )}
          </Stat>
          <Stat icon={Users} tone="blue" title={t("Unit advocates")} value={num(data.profiles.length)} onClick={() => navigate("members")}>
            <span className="stat-footnote">{t("Active advocates in Jalpaiguri")}</span>
          </Stat>
          <Stat icon={Wallet} tone="sage" title={t("My monthly pledge")} value={money(currentUser?.monthlyPledge || 20)} onClick={() => navigate("dues")}>
            <div className="dues-stat-bottom">
              <span>{currentUser?.unpaidMonths ? t("{unpaidMonths} mo in arrears", { unpaidMonths: currentUser.unpaidMonths }) : t("Up to date")}</span>
            </div>
          </Stat>
          <Stat icon={HeartHandshake} tone="lavender" title={t("Working Guides")} value={t("Repertoire")} onClick={() => navigate("resources")}>
            <span className="stat-footnote">{t("Miracle-busting & advocacy manuals")}</span>
          </Stat>
        </div>
      )}

      {/* Ongoing Civic Campaigns Spotlight on Homepage */}
      {data.events.filter(isCampaignEvent).map(hydrateCampaignEvent).map((campaign) => {
        const completedMilestones = campaign.milestones?.filter((m) => m.status === "completed").length || 0;
        const totalMilestones = campaign.milestones?.length || 0;
        const currentMilestone = campaign.milestones?.find((m) => m.status === "in_progress") || campaign.milestones?.[0];

        return (
          <section className="campaign-hero-card panel mb-7 print-tech-slip" key={campaign.id}>
            <div className="campaign-hero-grid">
              <div className="campaign-hero-image-wrap">
                <img
                  src={campaign.image}
                  alt={campaign.title}
                  style={{ objectPosition: "center 42%" }}
                  onError={(e) => {
                    e.currentTarget.src = "/images/field-reports/mashkalaibari/inspection-1.jpg";
                  }}
                />
                <span className="campaign-live-tag">
                  <span className="live-dot" />
                  {t("ACTIVE CAMPAIGN")}
                </span>
                <span className="campaign-location-pill">
                  <MapPin size={12} />
                  {campaign.location}
                </span>
              </div>

              <div className="campaign-hero-content">
                <div>
                  <div className="campaign-meta-row">
                    <span className="eyebrow text-rust">{t("ACTIVE CAMPAIGN")}</span>
                    <span className="campaign-volunteers-tag">
                      <Users size={13} />
                      {t("{count} Active Advocates", { count: campaign.volunteers })}
                    </span>
                  </div>

                  <h2>{campaign.title}</h2>
                  <p className="campaign-hero-desc">{campaign.description}</p>
                </div>

                {/* Progress Bar Container */}
                <div className="campaign-progress-box">
                  <div className="campaign-progress-header">
                    <span className="campaign-progress-label mono">
                      {tx("CAMPAIGN TARGET: <strong>{percent}% REACHED</strong>", { percent: campaign.progressPercent || 20 })}
                    </span>
                    <span className="campaign-phase-badge">
                      {t("PHASE {phase}: {title}", { phase: currentMilestone?.phase || 2, title: currentMilestone?.title || t("In Progress") })}
                    </span>
                  </div>
                  <div className="campaign-progress-track">
                    <div
                      className="campaign-progress-fill"
                      style={{ width: `${campaign.progressPercent || 20}%` }}
                    />
                  </div>
                  <div className="campaign-progress-footer">
                    <span>
                      {t("✓ {done} of {total} milestones achieved", { done: completedMilestones, total: totalMilestones })}
                    </span>
                    {campaign.targetGoal && (
                      <span className="campaign-target-goal" title={campaign.targetGoal}>
                        {t("Goal: {goal}", { goal: campaign.targetGoal })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="campaign-hero-actions">
                  <Button variant="primary" icon={ArrowUpRight} onClick={() => open("event", campaign)}>
                    {t("View Campaign Gallery & Plan")}
                  </Button>
                  <Button
                    variant="secondary"
                    icon={FileText}
                    onClick={() => {
                      const mashCircular = data.circulars.find((c) => isMashkalaibari(c.title));
                      if (mashCircular) open("circular", mashCircular);
                    }}
                  >
                    {t("Read Investigation Report & Photos")}
                  </Button>
                  <button
                    className="button button-secondary button-whatsapp"
                    onClick={() => shareViaWhatsApp(formatEventBroadcast(campaign, locale))}
                    title={t("Mobilize on WhatsApp")}
                  >
                    <MessageCircle size={15} />
                    {t("Share Campaign")}
                  </button>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <div className="dashboard-grid">
        {/* Public Action Hub if Guest or Member without procurement */}
        {!isExecutive && !isVolunteerOrOrganizer && (
          <section className="panel public-hub-panel" style={{ padding: "24px" }}>
            <SectionTitle title={t("Public Science Advocacy Hub")} subtitle={t("Explore campaign literature and take part in scientific inquiry.")} />
            <div className="public-actions-cluster" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <div className="cluster-item" style={{ border: "1px solid var(--rule-soft, #e2e8f0)", padding: "14px", borderRadius: "8px", background: "var(--card-bg, #fff)" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>{t("Anti-Superstition Demonstration Repertoire")}</strong>
                <p style={{ fontSize: "13px", color: "var(--muted, #64748b)", margin: 0 }}>{t("Discover chemical debunking of common ‘miracles’ like spontaneous combustion and bleeding lemons.")}</p>
                <Button variant="secondary" className="mt-2.5" onClick={() => navigate("resources")}>{t("Browse Demo Scripts")}</Button>
              </div>

              <div className="cluster-item" style={{ border: "1px solid var(--rule-soft, #e2e8f0)", padding: "14px", borderRadius: "8px", background: "var(--card-bg, #fff)" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>{t("Public Donation & Receipt Verification")}</strong>
                <p style={{ fontSize: "13px", color: "var(--muted, #64748b)", margin: 0 }}>{t("Support student science exhibitions. Every contribution generates an official verified digital receipt.")}</p>
                <Button className="mt-2.5" onClick={() => open("donation")}>{t("Make a Contribution")}</Button>
              </div>
            </div>
          </section>
        )}

        <section className="panel events-panel">
          <SectionTitle title={t("Coming up")} subtitle={t("Upcoming outreach and convention schedule.")}>
            <ArrowLink onClick={() => navigate("events")}>{t("Events calendar")}</ArrowLink>
          </SectionTitle>
          <div className="upcoming-events">
            {upcoming.length ? (
              upcoming.map((event) => <EventRow key={event.id} event={event} open={() => open("event", event)} data={data} />)
            ) : ongoingCampaign ? (
              <div className="p-3.5 bg-paper border border-rule-soft rounded flex items-center justify-between gap-3">
                <div>
                  <span className="eyebrow text-rust text-[10px] block">{t("ACTIVE CIVIC MOVEMENT")}</span>
                  <strong className="text-ink text-xs block mt-0.5">{ongoingCampaign.title}</strong>
                  <span className="text-ink-mute text-[11px] block mt-0.5">{t("Phase 2 In Progress · {percent}% Target Reached", { percent: ongoingCampaign.progressPercent || 20 })}</span>
                </div>
                <Button variant="secondary" onClick={() => open("event", ongoingCampaign)}>{t("View Plan")}</Button>
              </div>
            ) : (
              <p className="inline-empty">{t("No upcoming events scheduled.")}</p>
            )}
          </div>
          <button className="panel-footer calendar-footer" onClick={() => navigate("events")}>
            <CalendarDays size={14} />{t("Schedule unit programmes & conventions")}<ArrowRight size={15} />
          </button>
        </section>

        {isExecutive && filteredActivities.length > 0 && (
          <section className="panel activity-panel">
            <SectionTitle title={t("Our unit, in motion")} subtitle={t("Real-time audit stream of treasury, purchases, and verifications.")}>
              <div className="activity-tabs-mini">
                {(["all", "dues", "procurement", "donation"] as const).map((kind) => (
                  <button
                    key={kind}
                    className={`mini-tab-btn ${activityFilter === kind ? "active" : ""}`}
                    onClick={() => setActivityFilter(kind)}
                  >
                    {kind === "all" ? t("All") : kind === "dues" ? t("Dues") : kind === "procurement" ? t("Procure") : t("Donations")}
                  </button>
                ))}
              </div>
            </SectionTitle>

          <div className="activity-list">
            {filteredActivities.slice(0, 4).map((a) => {
              const actor = data.profiles.find((p) => p.id === a.actorId);
              return (
                <div className="activity-row" key={a.id}>
                  <span className={`activity-symbol activity-${a.type}`}>
                    {a.type === "verified" ? (
                      <CircleCheck size={17} />
                    ) : a.type === "donation" ? (
                      <HeartHandshake size={17} />
                    ) : a.type === "dues" ? (
                      <ArrowDownLeft size={17} />
                    ) : (
                      <Package size={17} />
                    )}
                  </span>
                  <div className="activity-text">
                    <p>{a.title}</p>
                    <span>{a.description}</span>
                    <small>
                      {relativeTime(a.createdAt, t)}
                      {actor && <> <span className="text-dot">·</span> {actor.fullName}</>}
                    </small>
                  </div>
                  {a.amount != null && (
                    <span className={`activity-amount ${["dues", "donation"].includes(a.type) ? "income" : ""}`}>
                      {["dues", "donation"].includes(a.type) ? "+" : ""}{money(a.amount)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        )}

        <div className="dashboard-right-stack">
          <section className="notice-card">
            <div className="notice-top">
              <span><Megaphone size={15} />{t("FROM THE NOTICE BOARD")}</span>
              <Pin size={16} className="notice-pin" />
            </div>
            {data.circulars.slice(0, 1).map((notice) => (
              <NoticeFeature key={notice.id} notice={notice} open={() => open("circular", notice)} />
            ))}
            <button className="notice-all" onClick={() => navigate("circulars")}>
              {t("Visit the notice board")}<ArrowRight size={15} />
            </button>
          </section>

          <button className="resource-teaser" onClick={() => navigate("resources")}>
            <span className="resource-teaser-icon">
              <ClipboardList size={21} strokeWidth={1.5} />
            </span>
            <span>
              <strong>{t("Field Repertoire & Anti-Superstition Lab.")}</strong>
              <small>{t("Explore chemistry demonstration scripts & toolkits")}</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>

      <div className="dashboard-footnote">
        <img src="/images/bss-logo.svg" alt="" />
        <span className="bengali-mark">{identity.bengali}</span>
        <span>{t(identity.motto)}</span>
        <span className="footnote-right">{t(identity.name)} · {t(identity.unit)}</span>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, title, tone, value, children, onClick }: { icon: LucideIcon; title: string; tone: string; value: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button className="stat-card" onClick={onClick}>
      <div className="stat-top">
        <span className={`stat-icon stat-icon-${tone}`}>
          <Icon size={17} strokeWidth={1.7} />
        </span>
        <span>{title}</span>
        <ArrowUpRight size={14} className="stat-arrow" />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-bottom">{children}</div>
    </button>
  );
}

function AttentionRow({ item, data, index, onClick }: { item: Procurement; data: WorkspaceData; index: number; onClick: () => void }) {
  const { t, money } = useI18n();
  const event = data.events.find((e) => e.id === item.eventId);
  const voucherCode = `REQ-26-${String(index).padStart(2, "0")}`;

  return (
    <button className="attention-row" onClick={onClick}>
      <div className="attention-item">
        <span className="voucher-mini-tag mono">{voucherCode}</span>
        <span>
          <strong>{item.itemName}</strong>
          <small>{item.quantity} <span className="text-dot">·</span> {event?.title || t("Field programme")}</small>
        </span>
      </div>
      {item.status === "verified" ? (
        <span className="stamp-verified text-[length:max(7px,var(--fs-floor,0px))]">{t("VERIFIED")}</span>
      ) : (
        <Badge tone={item.status === "needed" ? "orange" : "yellow"}>
          {item.status === "needed" ? t("Needed") : t("To verify")}
        </Badge>
      )}
      <span className="attention-cost mono">{money(item.estimatedCost)}</span>
      <ArrowUpRight size={14} className="row-arrow" />
    </button>
  );
}

export function EventRow({ event, open, data }: { event: UnitEvent; open: () => void; data: WorkspaceData }) {
  const { t, num, fmtDate, fmtTime, monthShort } = useI18n();
  const date = new Date(event.startsAt);
  const daysAway = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) /
      86400000
  );

  return (
    <button className="upcoming-event" onClick={open}>
      <div className={`event-date ${daysAway <= 1 ? "event-date-near" : ""}`}>
        <span>{monthShort(date.getMonth()).toUpperCase()}</span>
        <strong>{num(date.getDate())}</strong>
      </div>
      <div className="event-row-content">
        <h3>{event.title}</h3>
        <p><MapPin size={11} />{event.location}</p>
        <div className="event-row-meta">
          <span>
            {daysAway === 0 ? t("Today") : daysAway === 1 ? t("Tomorrow") : fmtDate(date, { weekday: "short" })},{" "}
            {fmtTime(date, { hour: "numeric", minute: "2-digit", hour12: true })}
          </span>
          <span className="mini-avatar-group">
            {data.profiles.slice(1, 4).map((p) => (
              <Avatar key={p.id} person={p} size="small" />
            ))}
            <span>+{num(Math.max(0, event.volunteers - 3))}</span>
          </span>
        </div>
      </div>
    </button>
  );
}

function NoticeFeature({ notice, open }: { notice: Circular; open: () => void }) {
  const { t } = useI18n();
  return (
    <button className="notice-feature" onClick={open}>
      <span className="notice-label">{t(notice.category)}<span>·</span>{relativeTime(notice.createdAt, t)}</span>
      <h3>{notice.title}</h3>
      <p>{notice.content.split("\n")[0]}</p>
      <span className="notice-read">{t("Read the circular")}<ArrowUpRight size={14} /></span>
    </button>
  );
}
