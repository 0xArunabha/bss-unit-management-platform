"use client";

import { identity } from "@/lib/identity";
import { ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays, Check, CheckCheck, ChevronDown, ChevronUp, CircleAlert, CircleCheck, ClipboardCheck, Download, ExternalLink, Eye, FileText, Flame, FlaskConical, HeartHandshake, History, Info, KeyRound, Leaf, Lock, LogOut, MapPin, Megaphone, MessageCircle, Package, Pin, Plus, Presentation, ReceiptText, Search, ShieldAlert, ShieldCheck, Smartphone, Users, X, type LucideIcon } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { type WorkspaceData, type Procurement, type PerformAction, type UnitEvent } from "@/lib/types";
import { Avatar, Badge, Button, EmptyState, PageHeading, SearchInput, Select, relativeTime } from "@/components/ui";
import type { Navigate, OpenModal } from "@/components/overview";
import { resources, type Resource, getSanitizedResources } from "@/lib/resources";
import { isEnvironmentDayText, isMashkalaibari, localizeResource } from "@/lib/localize-content";
import { useI18n } from "@/lib/i18n";
import { authClient } from "@/lib/auth-client";
import { formatCircularBroadcast, formatEventBroadcast, shareViaWhatsApp } from "@/lib/whatsapp";
import { isCampaignEvent, hydrateCampaignEvent } from "@/lib/campaign-data";

type Props = { data: WorkspaceData; open: OpenModal; navigate: Navigate };

function CampaignHeroCard({
  campaign,
  data,
  open,
  expandedRoadmaps,
  setExpandedRoadmaps,
}: {
  campaign: UnitEvent;
  data: WorkspaceData;
  open: OpenModal;
  expandedRoadmaps: Record<string, boolean>;
  setExpandedRoadmaps: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const { locale, t, tx, num, fmtDate } = useI18n();
  const completedMilestones = campaign.milestones?.filter((m) => m.status === "completed").length || 0;
  const totalMilestones = campaign.milestones?.length || 0;
  const currentMilestone = campaign.milestones?.find((m) => m.status === "in_progress") || campaign.milestones?.[0];
  const isExpanded = expandedRoadmaps[campaign.id] ?? campaign.isOngoing;
  const isCompleted = !campaign.isOngoing;
  const date = new Date(campaign.startsAt);
  const displayTitle = campaign.title.replace(/^Campaign:\s*/i, "");

  // Find matching circular report if any
  const titleLower = campaign.title.toLowerCase();
  const matchingCircular = data.circulars.find((c) => {
    const ct = c.title.toLowerCase();
    if (titleLower.includes("mashkalaibari") && isMashkalaibari(c.title)) return true;
    if (titleLower.includes("karala") && (ct.includes("karala") || ct.includes("environment day"))) return true;
    if ((titleLower.includes("prafulla") || titleLower.includes("assam")) && (ct.includes("prafulla") || ct.includes("assam"))) return true;
    return false;
  });

  return (
    <section
      className={`campaign-hero-card panel mb-7 print-tech-slip ${isCompleted ? "campaign-card-concluded border-l-4 border-l-[#2d6a4f]" : ""}`}
      key={campaign.id}
    >
      <div className="campaign-hero-grid">
        <div className="campaign-hero-image-col">
          <div className="campaign-hero-image-wrap">
            <img
              src={campaign.image}
              alt={displayTitle}
              style={{ objectPosition: "center 20%" }}
              onError={(e) => {
                e.currentTarget.src = "/images/field-reports/mashkalaibari/inspection-1.jpg";
              }}
            />
          </div>
          <div className="campaign-location-bar">
            <MapPin size={13} />
            <span>{campaign.location}</span>
          </div>
        </div>

        <div className="campaign-hero-content">
          <div>
            <div className="campaign-meta-row">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`eyebrow ${isCompleted ? "text-[#2d6a4f]" : "text-rust"}`}>
                  {isCompleted ? t("CONCLUDED CAMPAIGN") : t("ACTIVE CAMPAIGN")}
                </span>
                <span className="campaign-meta-bullet text-ink-faint">·</span>
                <span className="campaign-date-tag">
                  <CalendarDays size={12} />
                  {fmtDate(date, { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <span className="campaign-volunteers-tag">
                <Users size={12} />
                {isCompleted
                  ? t("{count} Mobilized Advocates", { count: campaign.volunteers })
                  : t("{count} Active Advocates", { count: campaign.volunteers })}
              </span>
            </div>

            <h2>{t(displayTitle)}</h2>
            <p className="campaign-hero-desc">{t(campaign.description)}</p>
          </div>

          {/* ACTIVE CAMPAIGN: Full Progress Bar Container */}
          {campaign.isOngoing ? (
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

              {/* Expandable Phased Roadmap Accordion */}
              {campaign.milestones && campaign.milestones.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-rule-soft flex items-center justify-between">
                  <button
                    type="button"
                    className="campaign-accordion-toggle"
                    onClick={() =>
                      setExpandedRoadmaps((prev) => ({
                        ...prev,
                        [campaign.id]: !isExpanded,
                      }))
                    }
                    aria-expanded={isExpanded}
                  >
                    <span>
                      {isExpanded
                        ? t("Collapse Roadmap")
                        : t("Inspect {count}-Phase Action Plan", { count: totalMilestones })}
                    </span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <span className="mono text-[10.5px] text-ink-mute">
                    {t("Next Milestone: Municipal Deputation")}
                  </span>
                </div>
              )}

              {isExpanded && campaign.milestones && (
                <div className="mt-3 space-y-2 pt-2 border-t border-rule-soft">
                  {campaign.milestones.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded border text-left text-xs ${
                        m.status === "completed"
                          ? "bg-[#eef4e8] border-[#c8d9be] text-ink"
                          : m.status === "in_progress"
                          ? "bg-[#fdf3ee] border-[#e8c0b0] text-ink"
                          : "bg-paper-card border-rule-soft text-ink-mute opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold mono text-[10.5px]">
                          {t("PHASE 0{phase} · {title}", { phase: num(m.phase), title: m.title })}
                        </span>
                        <span
                          className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mono ${
                            m.status === "completed"
                              ? "bg-olive text-paper-card"
                              : m.status === "in_progress"
                              ? "bg-rust text-paper-card"
                              : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {m.status === "completed" ? t("✓ Done") : m.status === "in_progress" ? t("● Active") : t("○ Planned")}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-2 leading-relaxed">{t(m.description)}</p>
                      {m.completedDate && (
                        <small className="text-[10px] text-ink-faint mono block mt-1">
                          {t("Completed: {date}", { date: m.completedDate })}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* CONCLUDED CAMPAIGN: Single compact metadata line */
            <div className="concluded-phases-wrap">
              <div className="concluded-phases-line">
                <span className="concluded-phases-badge">
                  <Check size={13} className="text-[#2d6a4f]" strokeWidth={2.5} />
                  {t("{done}/{total} phases verified", {
                    done: num(completedMilestones || totalMilestones),
                    total: num(totalMilestones),
                  })}
                </span>
                {campaign.milestones && campaign.milestones.length > 0 && (
                  <button
                    type="button"
                    className="concluded-history-toggle"
                    onClick={() =>
                      setExpandedRoadmaps((prev) => ({
                        ...prev,
                        [campaign.id]: !isExpanded,
                      }))
                    }
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? t("Hide history") : t("View history")}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              {isExpanded && campaign.milestones && (
                <div className="mt-2.5 space-y-2 pt-2 border-t border-rule-soft">
                  {campaign.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded border border-[#c8d9be] bg-[#f4f7f2] text-left text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold mono text-[10.5px] text-[#1b4332]">
                          {t("PHASE 0{phase} · {title}", { phase: num(m.phase), title: m.title })}
                        </span>
                        <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mono bg-olive text-paper-card">
                          {t("✓ Done")}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-2 leading-relaxed">{t(m.description)}</p>
                      {m.completedDate && (
                        <small className="text-[10px] text-ink-faint mono block mt-1">
                          {t("Completed: {date}", { date: m.completedDate })}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Solid primary CTA, Outlined secondary, Ghost icon share */}
          <div className="campaign-hero-actions">
            <Button variant="primary" icon={ArrowUpRight} onClick={() => open("event", campaign)}>
              {isCompleted ? t("View Archive") : t("View Action Plan")}
            </Button>
            {matchingCircular && (
              <Button
                variant="secondary"
                icon={FileText}
                onClick={() => open("circular", matchingCircular)}
              >
                {t("Report & Photos")}
              </Button>
            )}
            <button
              type="button"
              className="campaign-share-ghost-btn"
              onClick={() => shareViaWhatsApp(formatEventBroadcast(campaign, locale))}
              title={isCompleted ? t("Share Victory on WhatsApp") : t("Mobilize on WhatsApp")}
              aria-label={t("Share on WhatsApp")}
            >
              <MessageCircle size={15} />
              <span>{t("Share")}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SingleEventCard({
  event,
  data,
  open,
  locale,
  nowMs,
}: {
  event: UnitEvent;
  data: WorkspaceData;
  open: OpenModal;
  locale: "en" | "bn";
  nowMs: number;
}) {
  const { t, num, fmtDate, fmtTime } = useI18n();
  const date = new Date(event.startsAt);
  const isNear = date.getTime() - nowMs <= 48 * 3600000 && date.getTime() >= nowMs - 86400000;

  return (
    <article className="event-card panel print-tech-slip" key={event.id}>
      <button className="event-card-image" onClick={() => open("event", event)}>
        <img
          src={event.image}
          alt={event.title}
          onError={(e) => {
            e.currentTarget.src = "/images/field-reports/mashkalaibari/inspection-1.jpg";
          }}
        />
        <span className="event-category">{t(event.category)}</span>
        <span className="event-card-date">
          <small>{fmtDate(date, { month: "short" }).toUpperCase()}</small>
          <strong>{num(date.getDate())}</strong>
        </span>
        {isNear && <span className="event-urgent-tag">{t("HAPPENING IN <48H")}</span>}
      </button>

      <div className="event-card-body">
        <span className="event-card-time">
          <CalendarDays size={13} />
          {fmtDate(date, { weekday: "long" })} <span>·</span> {fmtTime(date, { hour: "numeric", minute: "2-digit" })}
        </span>
        <h2><button onClick={() => open("event", event)}>{event.title}</button></h2>
        <p className="event-card-description">{event.description}</p>
        <span className="event-location"><MapPin size={14} />{event.location}</span>

        <div className="event-card-footer">
          <span><Users size={14} />{t("{volunteers} active volunteers", { volunteers: event.volunteers })}</span>
          <span className="badge bg-[#e8f3ea] text-[#1b4332] border border-[#a3c9a8] font-bold text-[9px] uppercase px-1.5 py-0.5 rounded mono">
            {isCampaignEvent(event) ? t("Concluded Campaign") : t("Past Event")}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={() => open("event", event)} className="flex-1">
            {isCampaignEvent(event) ? t("View campaign archive & report") : t("View programme briefing & field photos")}
            <ArrowUpRight size={15} />
          </Button>
          <button
            className="button button-secondary button-whatsapp"
            style={{ padding: "0 12px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => shareViaWhatsApp(formatEventBroadcast(event, locale))}
            title={t("Share on WhatsApp")}
          >
            <MessageCircle size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function CampaignsView({ data, open }: Props) {
  const { t, tx } = useI18n();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Record<string, boolean>>({});
  const user = data.profiles.find((p) => p.id === data.currentUserId);
  const userRole = user?.role || "guest";

  // Strict sorting: Active campaigns always first, then by date descending
  const allCampaigns = data.events
    .filter(isCampaignEvent)
    .map(hydrateCampaignEvent)
    .sort((a, b) => {
      if (a.isOngoing && !b.isOngoing) return -1;
      if (!a.isOngoing && b.isOngoing) return 1;
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });

  const activeCampaigns = allCampaigns.filter((c) => c.isOngoing);
  const concludedCampaigns = allCampaigns.filter((c) => !c.isOngoing);

  const filteredActive = activeCampaigns.filter((e) =>
    `${e.title} ${e.location} ${e.description} ${e.targetGoal || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredConcluded = concludedCampaigns.filter((e) =>
    `${e.title} ${e.location} ${e.description} ${e.targetGoal || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow={t("GRASSROOTS ADVOCACY · UNIT CAMPAIGNS")}
        title={t("Grassroots campaigns & civic movements.")}
        description={t("Active environmental campaigns, municipal interventions, and citizen advocacy for {fullName}.", { fullName: t(identity.fullName) })}
      >
        {["admin", "organizer"].includes(userRole) && <Button icon={Plus} onClick={() => open("createEvent")}>{t("Create campaign")}</Button>}
      </PageHeading>

      {/* Slim Horizontal Tabs & Subtle Local Filter */}
      <div className="events-header-bar mb-6">
        <nav className="events-nav-tabs" role="tablist" aria-label={t("Campaigns navigation")}>
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`events-nav-tab ${tab === "active" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "active"}
          >
            <Flame size={15} />
            <span>{t("Active Campaigns")}</span>
            <span className="events-nav-count">{activeCampaigns.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("archive")}
            className={`events-nav-tab ${tab === "archive" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "archive"}
          >
            <History size={15} />
            <span>{t("Archive")}</span>
            <span className="events-nav-count">{concludedCampaigns.length}</span>
          </button>
        </nav>

        {/* Subtle local filter */}
        <div className="events-subtle-filter">
          <Search size={14} className="filter-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Filter list…")}
            aria-label={t("Filter list")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="filter-clear"
              title={t("Clear filter")}
              aria-label={t("Clear filter")}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 1. ACTIVE CAMPAIGNS TAB */}
      {tab === "active" && (
        <div className="space-y-6">
          {filteredActive.length > 0 ? (
            filteredActive.map((campaign) => (
              <CampaignHeroCard
                key={campaign.id}
                campaign={campaign}
                data={data}
                open={open}
                expandedRoadmaps={expandedRoadmaps}
                setExpandedRoadmaps={setExpandedRoadmaps}
              />
            ))
          ) : (
            <section className="panel p-8 border border-dashed border-rule-soft rounded-lg text-center my-4">
              <div className="w-12 h-12 rounded-full bg-[#f4efdf] text-rust flex items-center justify-center mx-auto mb-3">
                <Flame size={24} />
              </div>
              <h4 className="text-base font-bold text-ink mb-1">
                {search ? t('No campaigns matching "{search}"', { search }) : t("No active campaigns found")}
              </h4>
              <p className="text-xs text-ink-mute max-w-md mx-auto mb-4 leading-relaxed">
                {search
                  ? t("Try clearing your search term or searching by area name.")
                  : t("New civic or environmental campaigns will be featured here.")}
              </p>
              {search && (
                <Button variant="secondary" onClick={() => setSearch("")}>
                  {t("Clear search")}
                </Button>
              )}
            </section>
          )}

          {concludedCampaigns.length > 0 && (
            <div className="p-4 rounded-xl bg-paper-card border border-rule-soft flex items-center justify-between gap-4 mt-8 flex-wrap">
              <div>
                <span className="mono text-[11px] font-bold text-[#2d6a4f] uppercase tracking-wider block mb-0.5">
                  {t("✓ {count} Concluded Campaigns in Archive", { count: concludedCampaigns.length })}
                </span>
                <p className="text-xs text-ink-mute">
                  {t("Verified ecological restorations and humanitarian relief actions are documented in the archive.")}
                </p>
              </div>
              <Button
                variant="secondary"
                icon={ArrowRight}
                onClick={() => setTab("archive")}
              >
                {t("View Concluded Campaigns Archive ({count})", { count: concludedCampaigns.length })}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 2. CONCLUDED CAMPAIGNS ARCHIVE */}
      {tab === "archive" && (
        <div className="space-y-6">
          {filteredConcluded.length > 0 ? (
            filteredConcluded.map((campaign) => (
              <CampaignHeroCard
                key={campaign.id}
                campaign={campaign}
                data={data}
                open={open}
                expandedRoadmaps={expandedRoadmaps}
                setExpandedRoadmaps={setExpandedRoadmaps}
              />
            ))
          ) : (
            <section className="panel p-8 border border-dashed border-rule-soft rounded-lg text-center my-4">
              <div className="w-12 h-12 rounded-full bg-[#f4efdf] text-rust flex items-center justify-center mx-auto mb-3">
                <History size={24} />
              </div>
              <h4 className="text-base font-bold text-ink mb-1">
                {search ? t('No archive records matching "{search}"', { search }) : t("No archive records found")}
              </h4>
              <p className="text-xs text-ink-mute max-w-md mx-auto mb-4 leading-relaxed">
                {search
                  ? t("Try clearing your search term or exploring active campaigns.")
                  : t("Concluded campaigns and past field programmes will appear here.")}
              </p>
              {search && (
                <Button variant="secondary" onClick={() => setSearch("")}>
                  {t("Clear search")}
                </Button>
              )}
            </section>
          )}
        </div>
      )}

      <div className="info-strip">
        <HeartHandshake size={18} />
        <span>
          {tx("<strong>Field coordination protocol:</strong> Unit volunteers arrive one hour before start time for demonstration safety checks, crowd boundaries, and peer procurement verification.")}
        </span>
      </div>
    </div>
  );
}

export function EventsView({ data, open, navigate }: Props) {
  const { locale, t, tx } = useI18n();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [nowMs] = useState(() => Date.now());
  const user = data.profiles.find((p) => p.id === data.currentUserId);
  const userRole = user?.role || "guest";

  const scheduledEvents = data.events.filter((e) => !isCampaignEvent(e));
  const upcomingScheduled = scheduledEvents
    .filter((e) => new Date(e.startsAt).getTime() >= nowMs - 86400000)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const pastEvents = scheduledEvents
    .filter((e) => new Date(e.startsAt).getTime() < nowMs - 86400000 || !upcomingScheduled.some((u) => u.id === e.id))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  const filteredUpcoming = upcomingScheduled.filter((e) =>
    `${e.title} ${e.location} ${e.description}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPast = pastEvents.filter((e) =>
    `${e.title} ${e.location} ${e.description}`.toLowerCase().includes(search.toLowerCase())
  );

  const activeCampaign = data.events.filter(isCampaignEvent).find((c) => c.isOngoing);

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow={t("SCIENCE OUTREACH · FIELD CALENDAR")}
        title={t("Events calendar & outreach programmes.")}
        description={t("Scheduled outreach programmes, demonstration workshops, and single-day rallies for {fullName}.", { fullName: t(identity.fullName) })}
      >
        {["admin", "organizer"].includes(userRole) && <Button icon={Plus} onClick={() => open("createEvent")}>{t("Create event")}</Button>}
      </PageHeading>

      {/* Slim Horizontal Tabs & Subtle Local Filter */}
      <div className="events-header-bar mb-6">
        <nav className="events-nav-tabs" role="tablist" aria-label={t("Events calendar navigation")}>
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`events-nav-tab ${tab === "upcoming" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "upcoming"}
          >
            <CalendarDays size={15} />
            <span>{t("Events Calendar")}</span>
            <span className="events-nav-count">{upcomingScheduled.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("past")}
            className={`events-nav-tab ${tab === "past" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "past"}
          >
            <History size={15} />
            <span>{t("Past Events")}</span>
            <span className="events-nav-count">{pastEvents.length}</span>
          </button>
        </nav>

        {/* Subtle local filter */}
        <div className="events-subtle-filter">
          <Search size={14} className="filter-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Filter list…")}
            aria-label={t("Filter list")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="filter-clear"
              title={t("Clear filter")}
              aria-label={t("Clear filter")}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 1. UPCOMING SCHEDULED PROGRAMMES */}
      {tab === "upcoming" && (
        <div>
          {filteredUpcoming.length > 0 ? (
            <div className="event-cards-grid">
              {filteredUpcoming.map((event) => (
                <SingleEventCard key={event.id} event={event} data={data} open={open} locale={locale} nowMs={nowMs} />
              ))}
            </div>
          ) : (
            <div className="all-hands-card">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-9 h-9 rounded-full bg-rust-tint text-rust flex items-center justify-center font-bold text-base shrink-0">
                  <Flame size={18} />
                </span>
                <div>
                  <span className="eyebrow text-rust text-[10px] block">{t("ACTIVE FIELD PRIORITY")}</span>
                  <h4 className="text-base font-bold text-ink">{t("All Unit Capacity Mobilized for Mashkalaibari")}</h4>
                </div>
              </div>
              <p className="text-xs text-ink-mute leading-relaxed max-w-xl mb-4">
                {tx("Our Jalpaiguri unit is dedicating active volunteer and cadre capacity to the ongoing <strong>Clean Mashkalaibari Campaign</strong>. Single-day conventions and rallies resume following the technical deputation to Jalpaiguri Municipality.")}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {activeCampaign && (
                  <Button variant="primary" icon={ArrowUpRight} onClick={() => open("event", activeCampaign)}>
                    {t("Open Mashkalaibari Campaign Action Plan")}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => navigate("campaigns")}>
                  {t("View Campaigns →")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PAST EVENTS */}
      {tab === "past" && (
        <div>
          {filteredPast.length > 0 ? (
            <div className="event-cards-grid">
              {filteredPast.map((event) => (
                <SingleEventCard key={event.id} event={event} data={data} open={open} locale={locale} nowMs={nowMs} />
              ))}
            </div>
          ) : (
            <section className="panel p-8 border border-dashed border-rule-soft rounded-lg text-center my-4">
              <div className="w-12 h-12 rounded-full bg-[#f4efdf] text-rust flex items-center justify-center mx-auto mb-3">
                <History size={24} />
              </div>
              <h4 className="text-base font-bold text-ink mb-1">
                {search ? t('No past events matching "{search}"', { search }) : t("No past events recorded")}
              </h4>
              <p className="text-xs text-ink-mute max-w-md mx-auto mb-4 leading-relaxed">
                {t("Concluded outreach workshops, telescope camps, and rallies will be catalogued here.")}
              </p>
            </section>
          )}
        </div>
      )}

      <div className="info-strip">
        <HeartHandshake size={18} />
        <span>
          {tx("<strong>Field coordination protocol:</strong> Unit volunteers arrive one hour before start time for demonstration safety checks, crowd boundaries, and peer procurement verification.")}
        </span>
      </div>
    </div>
  );
}

export function ProcurementView({
  data,
  open,
  eventFilter,
  setEventFilter,
}: Props & { eventFilter: string; setEventFilter: (id: string) => void }) {
  const { t, tx, num, money } = useI18n();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [nowMs] = useState(() => Date.now());
  const user = data.profiles.find((p) => p.id === data.currentUserId);
  const canWork = user ? user.role !== "member" : false;

  const allItems = data.procurements.filter(
    (p) => (eventFilter === "all" || p.eventId === eventFilter) && p.itemName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredItems = allItems.filter((p) => {
    if (stageFilter === "urgent") {
      const ev = data.events.find((e) => e.id === p.eventId);
      if (!ev) return false;
      const ms = new Date(ev.startsAt).getTime() - nowMs;
      return p.status === "needed" && ms >= -86400000 && ms <= 48 * 3600000;
    }
    if (stageFilter === "ready") return p.status === "purchased";
    if (stageFilter === "closed") return p.status === "verified";
    return true;
  });

  const spent = allItems.reduce((s, p) => s + (p.actualCost || 0), 0);
  const estimate = allItems.reduce((s, p) => s + p.estimatedCost, 0);
  const urgentCount = allItems.filter((p) => {
    const ev = data.events.find((e) => e.id === p.eventId);
    if (!ev) return false;
    const ms = new Date(ev.startsAt).getTime() - nowMs;
    return p.status === "needed" && ms >= -86400000 && ms <= 48 * 3600000;
  }).length;

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow={t("MODULE C · REAL-TIME PROCUREMENT & DUAL-VERIFICATION CHECKLIST")}
        title={t("Event Requisition Vouchers & Field Spend.")}
        description={t("3-stage state machine: needed → purchased → verified. Out-of-pocket exact spend logging with peer-verification finality. Anti-collusion rule enforced.")}
      >
        {canWork && (
          <Button icon={Plus} onClick={() => open("procurement", { eventId: eventFilter !== "all" ? eventFilter : data.events[0]?.id })}>
            {t("Add requisition item")}
          </Button>
        )}
      </PageHeading>

      <div className="procurement-summary print-tech-slip">
        <div>
          <span className="summary-icon"><Package size={22} /></span>
          <div>
            <small>{t("REQUISITION REGISTER")}</small>
            <strong>
              {t("{allItemsCount} vouchers", { allItemsCount: allItems.length })} <span>{t("across")} {eventFilter === "all" ? new Set(allItems.map((p) => p.eventId)).size : 1} {t("active programmes")}</span>
            </strong>
          </div>
        </div>
        <div>
          <div>
            <small>{t("ESTIMATED REFERENCE BUDGET")}</small>
            <strong className="mono">{money(estimate)}</strong>
          </div>
          <div>
            <small>{t("EXACT OUT-OF-POCKET SPEND")}</small>
            <strong className="mono text-rust">{money(spent)}</strong>
          </div>
          <div>
            <small>{t("CLOSED VIA PEER VERIFICATION")}</small>
            <strong className="green-text mono">
              {num(allItems.filter((p) => p.status === "verified").length)} <span>{t("/ {allItemsCount} complete", { allItemsCount: allItems.length })}</span>
            </strong>
          </div>
        </div>
      </div>

      <div className="standalone-toolbar mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Select label={t("Filter by event")} value={eventFilter} onChange={setEventFilter}>
            <option value="all">{t("All science events ({eventsCount})", { eventsCount: data.events.length })}</option>
            {data.events.map((e) => (
              <option value={e.id} key={e.id}>{e.title}</option>
            ))}
          </Select>
          <div className="tabs tabs-segmented" role="tablist" aria-label={t("Procurement voucher filter")}>
            <button
              type="button"
              role="tab"
              aria-selected={stageFilter === "all"}
              className={`tab-btn ${stageFilter === "all" ? "active" : ""}`}
              onClick={() => setStageFilter("all")}
            >
              <span className="tab-label">{t("All vouchers")}</span>
              <span className="tab-count-badge">{num(allItems.length)}</span>
            </button>
            {urgentCount > 0 && (
              <button
                type="button"
                role="tab"
                aria-selected={stageFilter === "urgent"}
                className={`tab-btn ${stageFilter === "urgent" ? "active" : ""}`}
                onClick={() => setStageFilter("urgent")}
              >
                <span className="tab-label">{t("Urgent (<48h)")}</span>
                <span className="tab-count-badge bg-rust text-white">{num(urgentCount)}</span>
              </button>
            )}
            <button
              type="button"
              role="tab"
              aria-selected={stageFilter === "ready"}
              className={`tab-btn ${stageFilter === "ready" ? "active" : ""}`}
              onClick={() => setStageFilter("ready")}
            >
              <span className="tab-label">{t("Ready for check")}</span>
              <span className="tab-count-badge">{num(allItems.filter((p) => p.status === "purchased").length)}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={stageFilter === "closed"}
              className={`tab-btn ${stageFilter === "closed" ? "active" : ""}`}
              onClick={() => setStageFilter("closed")}
            >
              <span className="tab-label">{t("Verified & closed")}</span>
              <span className="tab-count-badge">{num(allItems.filter((p) => p.status === "verified").length)}</span>
            </button>
          </div>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder={t("Search requisition item…")} />
      </div>

      <div className="procurement-board">
        {(["needed", "purchased", "verified"] as const).map((status) => {
          const colItems = filteredItems.filter((p) => p.status === status);
          return (
            <section className={`board-column board-${status}`} key={status}>
              <div className="board-column-heading">
                <span className="board-status-dot" />
                <h2>
                  {status === "needed" ? t("Stage 1: Requisition Needed") : status === "purchased" ? t("Stage 2: Ready for Peer Check") : t("Stage 3: Peer Verified & Closed")}
                </h2>
                <span className="board-count">{num(colItems.length)}</span>
                {status === "needed" && canWork && (
                  <button
                    className="icon-button"
                    aria-label={t("Add needed item")}
                    onClick={() => open("procurement", { eventId: eventFilter !== "all" ? eventFilter : data.events[0]?.id })}
                  >
                    <Plus size={17} />
                  </button>
                )}
              </div>
              <p className="board-description">
                {status === "needed"
                  ? t("Items posted with estimated reference budget. Volunteers may purchase out of pocket.")
                  : status === "purchased"
                  ? t("Exact spend recorded. A peer volunteer must inspect the item at the venue.")
                  : t("Verified physically at venue. Vouchers closed with finality (no bottleneck).")}
              </p>

              <div className="board-cards">
                {colItems.map((item, idx) => (
                  <ProcurementCard key={item.id} item={item} data={data} open={open} canWork={canWork} index={idx + 1} />
                ))}

                {!colItems.length && (
                  <div className="board-empty">
                    {status === "verified" ? <CheckCheck size={25} /> : <Package size={25} />}
                    <p>
                      {status === "needed"
                        ? t("No requisitions currently needed. Field kit ready!")
                        : status === "purchased"
                        ? t("No purchases pending peer verification.")
                        : t("Verified items will settle here.")}
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div className="info-strip">
        <ShieldCheck size={19} />
        <span>
          {tx("<strong>Anti-Collusion & Verification Finality Rule:</strong> Enforced database constraint <code>CHECK (verified_by != purchased_by)</code>. A volunteer cannot verify their own purchase. Peer verification alone marks procurement complete and closed—no multi-level administrative reimbursement approval bottleneck is required.")}
        </span>
      </div>
    </div>
  );
}

function ProcurementCard({
  item,
  data,
  open,
  canWork,
  index,
}: {
  item: Procurement;
  data: WorkspaceData;
  open: OpenModal;
  canWork: boolean;
  index: number;
}) {
  const { t, tx, money } = useI18n();
  const event = data.events.find((e) => e.id === item.eventId);
  const buyer = data.profiles.find((p) => p.id === item.purchasedBy);
  const creator = data.profiles.find((p) => p.id === item.createdBy);
  const verifier = data.profiles.find((p) => p.id === item.verifiedBy);
  const isOwn = item.purchasedBy === data.currentUserId;

  const [nowMs] = useState(() => Date.now());
  const isUrgent =
    event &&
    new Date(event.startsAt).getTime() - nowMs <= 48 * 3600000 &&
    new Date(event.startsAt).getTime() >= nowMs - 86400000;

  const costDelta = item.actualCost !== null ? item.actualCost - item.estimatedCost : null;
  const voucherCode = `REQ-26-${String(index).padStart(2, "0")}`;

  return (
    <article className={`procurement-card print-tech-slip ${isUrgent && item.status === "needed" ? "procurement-urgent-card" : ""}`}>
      <div className="procurement-card-topbar">
        <span className="voucher-code-tag">{voucherCode}</span>
        {isUrgent && item.status === "needed" && (
          <span className="stamp-needed stamp-urgent">{t("URGENT <48H")}</span>
        )}
      </div>

      <span className="procurement-event">
        <CalendarDays size={12} />
        {event?.title || t("Field programme")}
      </span>

      <h3>{item.itemName}</h3>
      <span className="procurement-quantity">
        <Package size={13} />
        {item.quantity}
      </span>

      <div className="procurement-costs">
        <div>
          <small>{t("REFERENCE ESTIMATE")}</small>
          <strong className="mono">{money(item.estimatedCost)}</strong>
        </div>
        {item.actualCost !== null && (
          <div>
            <small>{t("EXACT SPEND PAID")}</small>
            <strong className="mono text-rust">{money(item.actualCost)}</strong>
          </div>
        )}
      </div>

      {costDelta !== null && (
        <div className="spend-delta-note">
          {costDelta > 0 ? (
            <span className="delta-over">
              {t("+₹{costDelta} over estimate (logged without cap)", { costDelta })}
            </span>
          ) : costDelta < 0 ? (
            <span className="delta-under">
              {t("-₹{abs} under estimate", { abs: Math.abs(costDelta) })}
            </span>
          ) : (
            <span className="delta-exact">{t("Exact match with reference budget")}</span>
          )}
        </div>
      )}

      {item.status === "needed" && creator && (
        <div className="procurement-person">
          <Avatar person={creator} size="small" />
          <span>{tx("Requisitioned by <strong>{name}</strong>", { name: creator.fullName.split(" ")[0] })}</span>
          <small>{relativeTime(item.createdAt, t)}</small>
        </div>
      )}

      {buyer && (
        <div className="procurement-person">
          <Avatar person={buyer} size="small" />
          <span>{tx("Purchased by <strong>{name}</strong>", { name: buyer.fullName.split(" ")[0] })}</span>
          {item.purchasedAt && <small>{relativeTime(item.purchasedAt, t)}</small>}
        </div>
      )}

      {item.receiptPhotoUrl && (
        <div className="procurement-photo-badge" style={{ marginTop: "8px", marginBottom: "4px" }}>
          <a
            href={item.receiptPhotoUrl}
            target="_blank"
            rel="noreferrer"
            className="arrow-link"
            style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--ink-mute)" }}
            title={t("View attached bill photo")}
          >
            <ReceiptText size={13} />
            <span>{t("Cash memo photo attached")}</span>
          </a>
        </div>
      )}

      {item.status === "needed" && canWork && (
        <Button variant="secondary" className="full-width board-action" icon={Plus} onClick={() => open("purchase", item)}>
          {t("Log out-of-pocket purchase")}
        </Button>
      )}

      {item.status === "purchased" && canWork && (
        <>
          {isOwn ? (
            <div className="peer-lock-notice">
              <ShieldAlert size={14} />
              <span>
                {tx("<strong>Buyer self-verification blocked.</strong><br/>Rule: <code>verified_by ≠ purchased_by</code>. Awaiting peer at venue.")}
              </span>
            </div>
          ) : (
            <Button variant="secondary" className="full-width board-action" icon={ClipboardCheck} onClick={() => open("verify", item)}>
              {t("Inspect & peer verify at venue")}
            </Button>
          )}
        </>
      )}

      {item.status === "verified" && verifier && (
        <div className="verified-closed-box">
          <div className="stamp-verified">{t("PEER VERIFIED AT VENUE")}</div>
          <div className="verified-byline">
            <Check size={12} />
            <span>
              {tx("Inspected by <strong>{fullName}</strong> ({role})", { fullName: verifier.fullName, role: verifier.role })}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}

export function CircularsView({ data, open }: Props) {
  const { locale, t, fmtDate, roleName } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All notices");
  const user = data.profiles.find((p) => p.id === data.currentUserId);
  const userRole = user?.role || "guest";
  const notices = data.circulars.filter(
    (c) => (filter !== "Pinned" || c.pinned) && `${c.title} ${c.content}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow={t("MODULE E · UNIT CIRCULARS & ADVOCACY")}
        title={t("Official unit notice board.")}
        description={t("Formal circulars, meeting agendas, and campaign resolutions published by {fullName}.", { fullName: t(identity.fullName) })}
      >
        {["admin", "organizer"].includes(userRole) && <Button icon={Plus} onClick={() => open("publishCircular")}>{t("Publish circular")}</Button>}
      </PageHeading>

      <div className="standalone-toolbar mb-6">
        <div className="tabs tabs-segmented" role="tablist" aria-label={t("Notice board filter")}>
          {["All notices", "Pinned"].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={filter === tab}
              onClick={() => setFilter(tab)}
              className={`tab-btn ${filter === tab ? "active" : ""}`}
            >
              <span className="tab-label">{t(tab)}</span>
              {tab === "Pinned" && <Pin size={13} className="tab-icon text-rust" />}
            </button>
          ))}
        </div>
        <SearchInput placeholder={t("Search unit circulars and agendas…")} value={search} onChange={setSearch} />
      </div>

      <div className="circulars-grid">
        {notices.map((notice, idx) => {
          const author = data.profiles.find((p) => p.id === notice.authorId);
          const circularNum = `LOS/JPG/2026/${String(idx + 1).padStart(2, "0")}`;

          return (
            <article className={`circular-card print-tech-slip ${notice.pinned ? "circular-pinned" : ""}`} key={notice.id}>
              <span className="print-mark print-mark-tl slip-mark" />
              <span className="print-mark print-mark-tr slip-mark" />

              <div className="circular-top">
                <span className="circular-ref-code mono">{circularNum}</span>
                <span className="circular-category">
                  <Megaphone size={13} />
                  {t(notice.category)}
                </span>
                {notice.pinned && <span className="stamp-verified stamp-needed">{t("PINNED")}</span>}
              </div>

              <h2><button onClick={() => open("circular", notice)}>{notice.title}</button></h2>
              <p>{notice.content}</p>

                <div className="circular-card-footer">
                  {author && (
                    <span className="circular-author">
                      <Avatar person={author} size="small" />
                      <span>
                        {author.fullName} ({roleName(author.role)})
                        <small>{fmtDate(notice.createdAt, { day: "numeric", month: "short", year: "numeric" })}</small>
                      </span>
                    </span>
                  )}
                  <div className="circular-actions">
                    <button
                      className="button button-secondary button-whatsapp"
                      onClick={() => shareViaWhatsApp(formatCircularBroadcast(notice, locale))}
                      title={t("Share to WhatsApp group")}
                    >
                      <MessageCircle size={13} />
                      {t("WhatsApp")}
                    </button>
                    <button className="arrow-link" onClick={() => open("circular", notice)}>
                      {t("Read circular")}
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
            </article>
          );
        })}
      </div>

      {!notices.length && (
        <section className="panel">
          <EmptyState icon={Megaphone} title={t("No notices found")} description={t("Try another search or publish a new circular.")} />
        </section>
      )}
    </div>
  );
}

export function ResourcesView({ open, data }: { open: OpenModal; data?: WorkspaceData }) {
  const i18n = useI18n();
  const { t } = i18n;
  const [category, setCategory] = useState("All resources");
  const [search, setSearch] = useState("");
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>("fire-miracle");
  const isAuthenticated = Boolean(data?.currentUserId);
  const allResources = getSanitizedResources(isAuthenticated).map((r) => localizeResource(r, i18n));

  const list = allResources.filter(
    (r) => (category === "All resources" || r.category === category) && `${r.title} ${r.description}`.toLowerCase().includes(search.toLowerCase())
  );

  const demoResources = list.filter((r) => r.category === "Demonstrations");
  const otherResources = list.filter((r) => r.category !== "Demonstrations");

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow={t("MODULE E · RESOURCE ARCHIVE & SCIENCE OUTREACH")}
        title={t("Field Repertoire & Anti-Superstition Lab.")}
        description={t("Curated repository of anti-superstition chemical demonstration scripts, convention presentation templates, and environmental campaign literature for {fullName}.", { fullName: t(identity.fullName) })}
      />

      {/* Editorial Hero Feature: Conference Poster Archive & Constitutional Mandate */}
      <section className="resources-editorial-hero panel print-tech-slip">
        <span className="print-mark print-mark-tl" />
        <span className="print-mark print-mark-tr" />
        <span className="print-mark print-mark-bl" />
        <span className="print-mark print-mark-br" />

        <div className="hero-poster-col">
          <div className="poster-frame">
            <img src="/images/conference-poster.jpg" alt={t("All India Science Conference 2025 Original Poster")} />
            <button className="poster-zoom-btn" onClick={() => open("resource", allResources.find((r) => r.id === "poster-2025") ?? resources.find((r) => r.id === "poster-2025"))}>
              <Eye size={14} /> {t("Inspect High-Res Poster")}
            </button>
          </div>
        </div>

        <div className="hero-manifesto-col">
          <div className="manifesto-eyebrow">
            <span className="bengali-mark text-rust mr-2">{identity.bengali}</span>
            <span>{t("ARTICLE 51A(h) · CONSTITUTION OF INDIA")}</span>
          </div>
          <h2>{t("“To develop the scientific temper, humanism and the spirit of inquiry and reform.”")}</h2>
          <p>
            {t("Breakthrough Science Society was established in 1995 as a voluntary movement to take the method of science directly to the common masses, question entrenched dogmas, and demand equitable public funding for basic research.")}
          </p>

          <div className="manifesto-meta-grid">
            <div>
              <small>{t("PARENT SOCIETY REGD.")}</small>
              <strong className="mono">{identity.registrationNo}</strong>
            </div>
            <div>
              <small>{t("UNIT JURISDICTION")}</small>
              <strong>{t(identity.unit)} ({t(identity.state)})</strong>
            </div>
            <div>
              <small>{t("FOUNDING YEAR")}</small>
              <strong className="mono">{identity.established}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="standalone-toolbar mt-6 mb-6">
        <div className="tabs tabs-segmented resource-tabs" role="tablist" aria-label={t("Science resources category filter")}>
          {["All resources", "Demonstrations", "Advocacy", "Environment", "Publications", "Organising"].map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={`tab-btn ${category === c ? "active" : ""}`}
            >
              <span className="tab-label">{t(c)}</span>
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder={t("Search demonstration protocols or toolkits…")} />
      </div>

      {/* Section 1: Anti-Superstition Demonstration Lab (Interactive Protocols) */}
      {(category === "All resources" || category === "Demonstrations") && demoResources.length > 0 && (
        <section className="resource-section mb-8">
          <div className="section-label-bar">
            <h3>
              <FlaskConical size={18} className="text-rust" />
              {t("Anti-Superstition Demonstration Lab — Chemical & Physical Protocols")}
            </h3>
            <span className="mono text-[length:max(10px,var(--fs-floor,0px))] text-muted">{t("Busting Godmen Tricks with Laboratory Evidence")}</span>
          </div>

          <div className="demo-protocols-list">
            {demoResources.map((r) => {
              const isExpanded = expandedProtocol === r.id;
              return (
                <article className="demo-protocol-card panel print-tech-slip" key={r.id}>
                  <div className="protocol-card-head" onClick={() => setExpandedProtocol(isExpanded ? null : r.id)}>
                    <div className="protocol-title-group">
                      <span className="stamp-verified stamp-needed text-[length:max(7px,var(--fs-floor,0px))]">{t("EXPOSING FRAUD")}</span>
                      <h4>{r.title}</h4>
                      <p>{r.description}</p>
                    </div>
                    <div className="protocol-head-actions">
                      <span className="read-time-pill mono">{r.readTime}</span>
                      <button className="icon-button" aria-label={t("Toggle details")}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="protocol-card-body">
                      {r.keyQuestion && (
                        <div className="protocol-key-q">
                          <strong>{t("INQUIRY PROMPT:")}</strong> <span>{r.keyQuestion}</span>
                        </div>
                      )}

                      <div className="protocol-reagents-grid">
                        {r.materials && (
                          <div className="reagents-checklist">
                            <h5>{t("REAGENTS & PROPS")}</h5>
                            <ul>
                              {r.materials.map((m, i) => (
                                <li key={i}><Check size={12} />{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {r.safetyNotes && (
                          <div className="safety-protocols-box">
                            <h5><ShieldAlert size={14} /> {t("FIELD SAFETY PROTOCOL")}</h5>
                            <ul>
                              {r.safetyNotes.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="protocol-action-bar">
                        <Button variant="secondary" icon={BookOpen} onClick={() => open("resource", r)}>
                          {t("Open complete narration script & explanation")}
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 2: Policy Briefs, Environmental Campaigns & Society Archives */}
      {otherResources.length > 0 && (
        <section className="resource-section">
          <div className="section-label-bar">
            <h3>
              <Leaf size={18} className="text-olive" />
              {t("Campaign Toolkits, Policy Briefs & Journal Archives")}
            </h3>
          </div>

          <div className="resource-grid">
            {otherResources.map((r) => {
              return (
                <article className={`resource-card resource-${r.icon}`} key={r.id}>
                  <div className="resource-card-top">
                    <span className="resource-card-icon">
                      {r.icon === "leaf" ? <Leaf size={24} /> : r.icon === "shield" ? <ShieldCheck size={24} /> : r.icon === "presentation" ? <Presentation size={24} /> : <BookOpen size={24} />}
                    </span>
                    <span>{t(r.category)}</span>
                  </div>
                  <small className="resource-kind">{r.kind}</small>
                  <h2><button onClick={() => open("resource", r)}>{r.title}</button></h2>
                  <p>{r.description}</p>
                  <div className="resource-card-footer">
                    <span>{r.readTime}</span>
                    <button className="arrow-link" onClick={() => open("resource", r)}>
                      {r.url ? t("Explore") : t("Open briefing")}
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!list.length && (
        <EmptyState icon={BookOpen} title={t("No resources found")} description={t("Try selecting 'All resources' or clearing your search term.")} />
      )}

      <div className="resource-attribution mt-8">
        <Info size={14} />
        <p>
          {t("Working demonstration protocols and field guides are curated for Light of Science, Jalpaiguri Unit. Official photographs and conference poster: Breakthrough Science Society.")}
          <a href="https://breakthroughindia.org/" target="_blank" rel="noreferrer">
            {t("Official All-India Portal")} <ExternalLink size={11} />
          </a>
        </p>
      </div>
    </div>
  );
}

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function SettingsView({
  data,
  perform,
  enablePush,
  pushEnabled,
  installApp,
  busy,
  open,
}: {
  data: WorkspaceData;
  perform: PerformAction;
  enablePush: () => void;
  pushEnabled: boolean;
  installApp: () => void;
  busy: boolean;
  open?: OpenModal;
}) {
  const { t, tx, roleName } = useI18n();
  const current = data.profiles.find((p) => p.id === data.currentUserId) || data.profiles[0] || {
    id: "",
    fullName: t("Public Visitor"),
    phone: null,
    role: "guest",
    status: "active",
    monthlyPledge: 0,
    avatarColor: "sand",
    unpaidMonths: 0,
    createdAt: new Date().toISOString(),
    googleEmail: "",
    hasGoogleLinked: false,
  };
  const [soundOverride, setSoundOverride] = useState<boolean | null>(null);
  const [duesReminderOverride, setDuesReminderOverride] = useState<boolean | null>(null);
  const storedSound = useSyncExternalStore(
    subscribeStorage,
    () => localStorage.getItem("bss-sound") === "true",
    () => false
  );
  const storedDuesReminder = useSyncExternalStore(
    subscribeStorage,
    () => localStorage.getItem("bss-dues-reminder") !== "false",
    () => true
  );
  const sound = soundOverride !== null ? soundOverride : storedSound;
  const duesReminder = duesReminderOverride !== null ? duesReminderOverride : storedDuesReminder;

  const handleLogout = async () => {
    if (open) {
      open("confirm", {
        title: t("Log out of workspace"),
        message: t("Log out of the unit workspace on this device?"),
        confirmLabel: t("Log out"),
        tone: "rust",
        onConfirm: async () => {
          await perform("logout", {});
          try {
            await authClient.signOut();
          } catch {}
          window.location.href = "/";
        },
      });
    } else if (confirm(t("Log out of the unit workspace on this device?"))) {
      await perform("logout", {});
      try {
        await authClient.signOut();
      } catch {}
      window.location.href = "/";
    }
  };

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow={t("CONFIGURATION & CADRE PREFERENCES")}
        title={t("Unit workspace settings.")}
        description={`${t(identity.organisation)} · ${t(identity.unit)}, ${t(identity.state)}.`}
      />

      <div className="settings-grid">
        <section className="panel settings-panel">
          <h2><Users size={18} />{t("Your member account & designated role")}</h2>
          <div className="settings-profile">
            <Avatar person={current} size="large" />
            <div>
              <h3>{current.fullName}</h3>
              <span>
                {current.role === "admin" ? t("Unit Executive / Office-Bearer") : roleName(current.role)} · {t(identity.unit)}
              </span>
            </div>
            <Badge tone="green">{current.status === "active" ? t("Active") : t("Dues pending")}</Badge>
          </div>

          <div className="settings-auth-block">
            <h3><ShieldCheck size={17} /> {t("Authentication & Security")}</h3>
            <p className="settings-help-text">
              {t("Your member account is secured with Google OAuth 2.0. PIN authentication has been deprecated and permanently retired.")}
            </p>

            <div className="linked-google-card">
              <div className="linked-google-info">
                <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <strong>{current.googleEmail || t("Your Google account")}</strong>
                  <span className="auth-status-badge">{t("● Linked & Verified Google Account")}</span>
                </div>
              </div>
              <Badge tone="green">{t("Google OAuth Active")}</Badge>
            </div>

            <div className="security-notice-callout">
              <KeyRound size={15} />
              <span>
                {tx("<strong>Zero-PIN Security:</strong> Member accounts are bound to Google credentials. If a Google account is lost or changed, an executive can unlink and issue a single-use Crockford invite code in person.")}
              </span>
            </div>

            <div className="settings-divider" />

            <div className="settings-logout-block">
              <div>
                <strong>{t("Sign Out of Workspace")}</strong>
                <p>{t("Signs out of this device session. You can sign straight back in with your linked Google account.")}</p>
              </div>
              <Button variant="secondary" icon={LogOut} onClick={handleLogout}>
                {t("Log Out")}
              </Button>
            </div>
          </div>
        </section>

        <section className="panel settings-panel">
          <h2><Bell size={18} />{t("Real-time notification engine (PWA & Push)")}</h2>
          <div className="setting-row">
            <div>
              <strong>{t("In-app activity stream")}</strong>
              <p>{t("Real-time audit log of dues collections, exact spend logs, peer verifications, and public donations.")}</p>
            </div>
            <Badge tone="green">{t("Always on")}</Badge>
          </div>

          <div className="setting-row">
            <div>
              <strong>{t("Browser Web Push API")}</strong>
              <p>{t("VAPID service worker background alerts for urgent procurements (<48h) and dues receipts.")}</p>
            </div>
            <Button variant="secondary" icon={pushEnabled ? Check : Bell} onClick={enablePush} disabled={pushEnabled}>
              {pushEnabled ? t("Push enabled") : t("Enable Web Push")}
            </Button>
          </div>

          <div className="setting-row">
            <div>
              <strong>{t("Audible field tone")}</strong>
              <p>{t("A quiet notification chime when new unit activity arrives while the workspace is open.")}</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={sound}
                onChange={(e) => {
                  setSoundOverride(e.target.checked);
                  localStorage.setItem("bss-sound", String(e.target.checked));
                  window.dispatchEvent(new Event("storage"));
                }}
                aria-label={t("Notification sound")}
              />
              <span />
            </label>
          </div>

          <div className="setting-row">
            <div>
              <strong>{t("Membership dues reminder badge")}</strong>
              <p>{t("Highlights monthly dues status if pending on personal profile.")}</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={duesReminder}
                onChange={(e) => {
                  setDuesReminderOverride(e.target.checked);
                  localStorage.setItem("bss-dues-reminder", String(e.target.checked));
                  window.dispatchEvent(new Event("storage"));
                }}
                aria-label={t("Show dues reminder")}
              />
              <span />
            </label>
          </div>
        </section>

        <section className="panel settings-panel">
          <h2><Info size={18} />{t("Application release & system information")}</h2>
          <div className="unit-detail-row">
            <span>{t("Platform Release")}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong className="mono">v{identity.version}</strong>
              <Badge tone="rust">{t(identity.releaseName)}</Badge>
            </div>
          </div>
          <div className="unit-detail-row">
            <span>{t("Build Identification")}</span>
            <strong className="mono">{identity.build}</strong>
          </div>
          <div className="unit-detail-row">
            <span>{t("PWA Offline Cache")}</span>
            <strong className="mono">{t("light-of-science-workspace-v5")}</strong>
          </div>
          <div className="unit-detail-row">
            <span>{t("Database Backend")}</span>
            <strong>{t("PostgreSQL (Neon Serverless · Active)")}</strong>
          </div>
          <div className="unit-detail-row">
            <span>{t("Local Offline Queue")}</span>
            <strong>{t("IndexedDB (Auto-reconnect sync)")}</strong>
          </div>
          <div className="unit-detail-row">
            <span>{t("Target Jurisdiction")}</span>
            <strong>{t(identity.unit)} · {t(identity.state)}</strong>
          </div>
        </section>

        <section className="panel settings-panel">
          <h2><MapPin size={18} />{t("Society legal & unit registration")}</h2>
          <div className="unit-detail-row"><span>{t("Unit Name")}</span><strong>{t(identity.name)}</strong></div>
          <div className="unit-detail-row"><span>{t("Parent Body")}</span><strong>{t(identity.organisation)}</strong></div>
          <div className="unit-detail-row"><span>{t("Society Registration")}</span><strong className="mono">{identity.registrationNo}</strong></div>
          <div className="unit-detail-row"><span>{t("Governing Act")}</span><strong>{t(identity.act)}</strong></div>
          <div className="unit-detail-row"><span>{t("Headquarters")}</span><strong>{t(identity.headquarters)}</strong></div>
          <div className="unit-detail-row"><span>{t("Baseline Monthly Dues")}</span><strong className="mono">{t("₹20 / month (No upper cap)")}</strong></div>
          <a href="https://breakthroughindia.org/" className="arrow-link mt-4" target="_blank" rel="noreferrer">
            {t("Official Breakthrough Science Society Portal")} <ArrowUpRight size={15} />
          </a>
        </section>

        <section className="panel settings-panel">
          <h2><Smartphone size={18} />{t("Progressive Web App (PWA) field install")}</h2>
          <p className="install-description">
            {t("Add Light of Science to your Android or desktop home screen for offline field readiness. Service workers cache critical unit resources, and the offline fallback guarantees no out-of-sync phantom writes.")}
          </p>
          <Button variant="secondary" icon={Download} onClick={installApp}>
            {t("Install PWA on device")}
          </Button>

          <div className="settings-credit">
            <img src="/images/bss-logo.svg" alt={t("BSS emblem")} />
            <p>
              {t("Emblem by Breakthrough Science Society (CC BY-SA). Platform developed for {fullName}.", { fullName: t(identity.fullName) })}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
