"use client";

import { identity } from "@/lib/identity";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleCheck, ClipboardList, HeartHandshake, MapPin, Megaphone, Package, Pin, Plus, ShieldAlert, Users, Wallet, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { type WorkspaceData, type View, type UnitEvent, type Circular, type Procurement, money, months } from "@/lib/types";
import { Avatar, Badge, Button, PageHeading, SectionTitle, ArrowLink, relativeTime } from "@/components/ui";

export type OpenModal = (type: string, record?: unknown) => void;
export type Navigate = (view: View, eventId?: string) => void;

export function Overview({ data, navigate, open }: { data: WorkspaceData; navigate: Navigate; open: OpenModal }) {
  const [period, setPeriod] = useState("This month");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"all" | "dues" | "procurement" | "donation">("all");
  const now = new Date();
  const currentUser = data.profiles.find((p) => p.id === data.currentUserId)!;
  const canCollect = ["admin", "organizer", "volunteer"].includes(currentUser.role);
  const active = data.profiles.filter((p) => p.status === "active").length;

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
  const paidPercent = Math.round((paidCount / data.profiles.length) * 100);
  const needed = data.procurements.filter((p) => p.status === "needed").length;
  const items = [...data.procurements]
    .sort((a, b) => ({ needed: 0, purchased: 1, verified: 2 }[a.status] - { needed: 0, purchased: 1, verified: 2 }[b.status]))
    .slice(0, 4);

  const upcoming = data.events.filter((e) => new Date(e.startsAt).getTime() >= Date.now() - 86400000).slice(0, 3);

  const urgentItems = data.procurements.filter((p) => {
    if (p.status !== "needed") return false;
    const ev = data.events.find((e) => e.id === p.eventId);
    if (!ev) return false;
    const ms = new Date(ev.startsAt).getTime() - Date.now();
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
      <PageHeading title="Unit overview" description={`${identity.name} · ${identity.organisation}, ${identity.unit}.`}>
        <div className="period-container">
          <button className="button button-secondary period-button" onClick={() => setPeriodOpen(!periodOpen)}>
            <CalendarDays size={15} />
            {period}
            <ChevronDown size={14} />
          </button>
          {periodOpen && (
            <div className="small-menu period-menu">
              {["This month", "This year", "All time"].map((p) => (
                <button key={p} onClick={() => { setPeriod(p); setPeriodOpen(false); }}>
                  {p}
                  {p === period && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
        {canCollect && <Button icon={Plus} onClick={() => open("dues")}>Quick collect</Button>}
      </PageHeading>

      {/* Urgent Field Requisition Broadcast Alert if any items needed within 48h */}
      {urgentItems.length > 0 && (
        <div className="urgent-dispatch-banner print-tech-slip mb-5">
          <span className="print-mark print-mark-tl slip-mark" />
          <span className="print-mark print-mark-tr slip-mark" />
          <div className="urgent-dispatch-left">
            <span className="stamp-needed text-[7.5px] font-bold">
              <ShieldAlert size={12} className="inline mr-1" />
              URGENT FIELD DISPATCH &lt;48H
            </span>
            <p>
              <strong>{urgentItems.length} requisitions urgently needed</strong> for upcoming programme:{" "}
              <em>{data.events.find((e) => e.id === urgentItems[0]?.eventId)?.title}</em>. Volunteers may log out-of-pocket purchases.
            </p>
          </div>
          <button
            className="button button-dark text-xs whitespace-nowrap"
            onClick={() => navigate("procurement", urgentItems[0]?.eventId)}
          >
            Open requisition board <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Two-ink poster banner */}
      <section className="campaign-banner" aria-label={`${identity.name}: science for society`}>
        <span className="print-mark print-mark-tl" />
        <span className="print-mark print-mark-tr" />
        <span className="print-mark print-mark-bl" />
        <span className="print-mark print-mark-br" />
        <div className="campaign-content">
          <div className="campaign-eyebrow"><span />{identity.volumeLine}</div>
          <h2>Science for society.<br />Progress, <em>together.</em></h2>
          <p>Rooted in {identity.city}. Open to everyone.<br />A community that turns questions into action.</p>
          <button className="campaign-link" onClick={() => navigate("events")}>
            Let’s make a difference<ArrowUpRight size={16} />
          </button>
        </div>
        <div className="campaign-image">
          <img src="/images/science-march.jpg" alt="BSS members and scientists taking part in the All India Science Conference science march" />
          <div className="photo-caption">
            <span className="live-dot" />ON THE GROUND
            <span className="caption-divider" />All India Science Conference, 2025
          </div>
        </div>
        <span className="campaign-bengali" aria-hidden="true">{identity.bengali}</span>
      </section>

      <div className="stats-grid">
        <Stat icon={Wallet} tone="orange" title="Unit balance" value={money(balance)} onClick={() => navigate("dues")}>
          <span className="stat-footnote"><span className="tiny-dot green" />Net treasury available</span>
        </Stat>
        <Stat icon={Users} tone="blue" title="Unit members" value={String(data.profiles.length)} onClick={() => navigate("members")}>
          <span className="stat-footnote">
            <strong>{active} active</strong>
            <span className="text-dot">·</span>
            {data.profiles.length - active} flagged dues pending
          </span>
        </Stat>
        <Stat icon={ArrowDownLeft} tone="sage" title="Membership dues" value={money(duesTotal)} onClick={() => navigate("dues")}>
          <div className="dues-stat-bottom">
            <span>{paidCount} of {data.profiles.length} paid this month <b>{paidPercent}%</b></span>
            <div className="progress-track"><span style={{ width: `${paidPercent}%` }} /></div>
          </div>
        </Stat>
        <Stat icon={HeartHandshake} tone="lavender" title="Donations received" value={money(donationsTotal)} onClick={() => navigate("donations")}>
          <span className="stat-footnote">
            <span className="tiny-dot purple" />
            {data.donations.filter((d) => inPeriod(d.createdAt)).length} contributions · {period.toLowerCase()}
          </span>
        </Stat>
      </div>

      <div className="dashboard-grid">
        <section className="panel procurement-panel">
          <SectionTitle title="A few things need a hand" subtitle="Requisitions pending out-of-pocket purchase or peer check.">
            <ArrowLink onClick={() => navigate("procurement")}>View checklist</ArrowLink>
          </SectionTitle>
          <div className="attention-table">
            <div className="attention-table-head">
              <span>ITEM & EVENT</span>
              <span>STAGE</span>
              <span>EST. COST</span>
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
              <span className="attention-dot" />{needed} items still needed
              <span className="footer-divider">·</span>Every helping hand counts.
            </span>
            <ArrowRight size={15} />
          </button>
        </section>

        <section className="panel events-panel">
          <SectionTitle title="Coming up" subtitle="Upcoming outreach and convention schedule.">
            <ArrowLink onClick={() => navigate("events")}>All events</ArrowLink>
          </SectionTitle>
          <div className="upcoming-events">
            {upcoming.length ? (
              upcoming.map((event) => <EventRow key={event.id} event={event} open={() => open("event", event)} data={data} />)
            ) : (
              <p className="inline-empty">No upcoming events scheduled.</p>
            )}
          </div>
          <button className="panel-footer calendar-footer" onClick={() => navigate("events")}>
            <CalendarDays size={14} />Schedule unit programmes & conventions<ArrowRight size={15} />
          </button>
        </section>

        <section className="panel activity-panel">
          <SectionTitle title="Our unit, in motion" subtitle="Real-time audit stream of treasury, purchases, and verifications.">
            <div className="activity-tabs-mini">
              {(["all", "dues", "procurement", "donation"] as const).map((t) => (
                <button
                  key={t}
                  className={`mini-tab-btn ${activityFilter === t ? "active" : ""}`}
                  onClick={() => setActivityFilter(t)}
                >
                  {t === "all" ? "All" : t === "dues" ? "Dues" : t === "procurement" ? "Procure" : "Donations"}
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
                      {relativeTime(a.createdAt)}
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

        <div className="dashboard-right-stack">
          <section className="notice-card">
            <div className="notice-top">
              <span><Megaphone size={15} />FROM THE NOTICE BOARD</span>
              <Pin size={16} className="notice-pin" />
            </div>
            {data.circulars.slice(0, 1).map((notice) => (
              <NoticeFeature key={notice.id} notice={notice} open={() => open("circular", notice)} />
            ))}
            <button className="notice-all" onClick={() => navigate("circulars")}>
              Visit the notice board<ArrowRight size={15} />
            </button>
          </section>

          <button className="resource-teaser" onClick={() => navigate("resources")}>
            <span className="resource-teaser-icon">
              <ClipboardList size={21} strokeWidth={1.5} />
            </span>
            <span>
              <strong>Field Repertoire & Anti-Superstition Lab.</strong>
              <small>Explore chemistry demonstration scripts & toolkits</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>

      <div className="dashboard-footnote">
        <img src="/images/bss-logo.svg" alt="" />
        <span className="bengali-mark">{identity.bengali}</span>
        <span>{identity.motto}</span>
        <span className="footnote-right">{identity.name} · {identity.unit}</span>
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
  const event = data.events.find((e) => e.id === item.eventId);
  const voucherCode = `REQ-26-${String(index).padStart(2, "0")}`;

  return (
    <button className="attention-row" onClick={onClick}>
      <div className="attention-item">
        <span className="voucher-mini-tag mono">{voucherCode}</span>
        <span>
          <strong>{item.itemName}</strong>
          <small>{item.quantity} <span className="text-dot">·</span> {event?.title || "Field programme"}</small>
        </span>
      </div>
      {item.status === "verified" ? (
        <span className="stamp-verified text-[7px]">VERIFIED</span>
      ) : (
        <Badge tone={item.status === "needed" ? "orange" : "yellow"}>
          {item.status === "needed" ? "Needed" : "To verify"}
        </Badge>
      )}
      <span className="attention-cost mono">{money(item.estimatedCost)}</span>
      <ArrowUpRight size={14} className="row-arrow" />
    </button>
  );
}

export function EventRow({ event, open, data }: { event: UnitEvent; open: () => void; data: WorkspaceData }) {
  const date = new Date(event.startsAt);
  const daysAway = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) /
      86400000
  );

  return (
    <button className="upcoming-event" onClick={open}>
      <div className={`event-date ${daysAway <= 1 ? "event-date-near" : ""}`}>
        <span>{months[date.getMonth()].toUpperCase()}</span>
        <strong>{date.getDate()}</strong>
      </div>
      <div className="event-row-content">
        <h3>{event.title}</h3>
        <p><MapPin size={11} />{event.location}</p>
        <div className="event-row-meta">
          <span>
            {daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : date.toLocaleDateString("en-IN", { weekday: "short" })},{" "}
            {date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
          </span>
          <span className="mini-avatar-group">
            {data.profiles.slice(1, 4).map((p) => (
              <Avatar key={p.id} person={p} size="small" />
            ))}
            <span>+{Math.max(0, event.volunteers - 3)}</span>
          </span>
        </div>
      </div>
    </button>
  );
}

function NoticeFeature({ notice, open }: { notice: Circular; open: () => void }) {
  return (
    <button className="notice-feature" onClick={open}>
      <span className="notice-label">{notice.category}<span>·</span>{relativeTime(notice.createdAt)}</span>
      <h3>{notice.title}</h3>
      <p>{notice.content.split("\n")[0]}</p>
      <span className="notice-read">Read the circular<ArrowUpRight size={14} /></span>
    </button>
  );
}
