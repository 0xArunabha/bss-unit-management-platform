"use client";

import { identity } from "@/lib/identity";
import { ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays, Check, CheckCheck, ChevronDown, ChevronUp, CircleAlert, CircleCheck, ClipboardCheck, Download, ExternalLink, Eye, FlaskConical, HeartHandshake, Info, KeyRound, Leaf, Lock, LogOut, MapPin, Megaphone, MessageCircle, Package, Pin, Plus, Presentation, Search, ShieldAlert, ShieldCheck, Smartphone, Users, type LucideIcon } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { type WorkspaceData, type Procurement, type PerformAction, money } from "@/lib/types";
import { Avatar, Badge, Button, EmptyState, PageHeading, SearchInput, Select, relativeTime } from "@/components/ui";
import type { Navigate, OpenModal } from "@/components/overview";
import { resources, type Resource, getSanitizedResources } from "@/lib/resources";
import { useI18n } from "@/lib/i18n";
import { authClient } from "@/lib/auth-client";
import { formatCircularBroadcast, formatEventBroadcast, shareViaWhatsApp } from "@/lib/whatsapp";

type Props = { data: WorkspaceData; open: OpenModal; navigate: Navigate };

export function EventsView({ data, open }: Props) {
  const { locale } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Upcoming");
  const [nowMs] = useState(() => Date.now());
  const user = data.profiles.find((p) => p.id === data.currentUserId);
  const userRole = user?.role || "guest";
  const list = data.events.filter(
    (e) => (filter === "All events" || new Date(e.startsAt).getTime() >= nowMs - 86400000) && `${e.title} ${e.location}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow="GRASSROOTS ADVOCACY · UNIT CALENDAR"
        title="Field programmes & science conventions."
        description={`Scheduled outreach programmes, school demonstration camps, and cadre meetings for ${identity.fullName}.`}
      >
        {["admin", "organizer"].includes(userRole) && <Button icon={Plus} onClick={() => open("createEvent")}>Create event</Button>}
      </PageHeading>

      <div className="standalone-toolbar">
        <div className="tabs">
          {["Upcoming", "All events"].map((t) => (
            <button key={t} className={t === filter ? "active" : ""} onClick={() => setFilter(t)}>
              {t}
              <span>{t === "All events" ? data.events.length : data.events.filter((e) => new Date(e.startsAt).getTime() >= nowMs - 86400000).length}</span>
            </button>
          ))}
        </div>
        <SearchInput placeholder="Find an outreach programme or venue…" value={search} onChange={setSearch} />
      </div>

      <div className="event-cards-grid">
        {list.map((event) => {
          const date = new Date(event.startsAt);
          const needed = data.procurements.filter((p) => p.eventId === event.id && p.status === "needed").length;
          const verified = data.procurements.filter((p) => p.eventId === event.id && p.status === "verified").length;
          const isNear = date.getTime() - nowMs <= 48 * 3600000 && date.getTime() >= nowMs - 86400000;

          return (
            <article className="event-card panel print-tech-slip" key={event.id}>
              <span className="print-mark print-mark-tl slip-mark" />
              <span className="print-mark print-mark-tr slip-mark" />

              <button className="event-card-image" onClick={() => open("event", event)}>
                <img src={event.image} alt={event.title} />
                <span className="event-category">{event.category}</span>
                <span className="event-card-date">
                  <small>{date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}</small>
                  <strong>{date.getDate()}</strong>
                </span>
                {isNear && <span className="event-urgent-tag">HAPPENING IN &lt;48H</span>}
              </button>

              <div className="event-card-body">
                <span className="event-card-time">
                  <CalendarDays size={13} />
                  {date.toLocaleDateString("en-IN", { weekday: "long" })} <span>·</span> {date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                </span>
                <h2><button onClick={() => open("event", event)}>{event.title}</button></h2>
                <p className="event-card-description">{event.description}</p>
                <span className="event-location"><MapPin size={14} />{event.location}</span>

                <div className="event-card-footer">
                  <span><Users size={14} />{event.volunteers} active volunteers</span>
                  {needed > 0 ? (
                    <span className="stamp-needed font-bold text-[8px]">{needed} REQUISITIONS NEEDED</span>
                  ) : (
                    <span className="stamp-verified font-bold text-[8px]">{verified} ITEMS PEER-VERIFIED</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <Button variant="secondary" onClick={() => open("event", event)} className="flex-1">
                    View programme briefing & checklist
                    <ArrowUpRight size={15} />
                  </Button>
                  <button
                    className="button button-secondary button-whatsapp"
                    style={{ padding: "0 12px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => shareViaWhatsApp(formatEventBroadcast(event, locale))}
                    title="Mobilize volunteers on WhatsApp"
                  >
                    <MessageCircle size={15} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!list.length && (
        <section className="panel">
          <EmptyState icon={CalendarDays} title="No programmes scheduled" description="Clear search filters or schedule a new science outreach programme." />
        </section>
      )}

      <div className="info-strip">
        <HeartHandshake size={18} />
        <span>
          <strong>Field coordination protocol:</strong> Unit volunteers arrive one hour before start time for demonstration safety checks, crowd boundaries, and peer procurement verification.
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
        eyebrow="MODULE C · REAL-TIME PROCUREMENT & DUAL-VERIFICATION CHECKLIST"
        title="Event Requisition Vouchers & Field Spend."
        description="3-stage state machine: needed → purchased → verified. Out-of-pocket exact spend logging with peer-verification finality. Anti-collusion rule enforced."
      >
        {canWork && (
          <Button icon={Plus} onClick={() => open("procurement", { eventId: eventFilter !== "all" ? eventFilter : data.events[0]?.id })}>
            Add requisition item
          </Button>
        )}
      </PageHeading>

      <div className="procurement-summary print-tech-slip">
        <div>
          <span className="summary-icon"><Package size={22} /></span>
          <div>
            <small>REQUISITION REGISTER</small>
            <strong>
              {allItems.length} vouchers <span>across {eventFilter === "all" ? new Set(allItems.map((p) => p.eventId)).size : 1} active programmes</span>
            </strong>
          </div>
        </div>
        <div>
          <div>
            <small>ESTIMATED REFERENCE BUDGET</small>
            <strong className="mono">{money(estimate)}</strong>
          </div>
          <div>
            <small>EXACT OUT-OF-POCKET SPEND</small>
            <strong className="mono text-rust">{money(spent)}</strong>
          </div>
          <div>
            <small>CLOSED VIA PEER VERIFICATION</small>
            <strong className="green-text mono">
              {allItems.filter((p) => p.status === "verified").length} <span>/ {allItems.length} complete</span>
            </strong>
          </div>
        </div>
      </div>

      <div className="standalone-toolbar">
        <div className="flex flex-wrap items-center gap-2">
          <Select label="Filter by event" value={eventFilter} onChange={setEventFilter}>
            <option value="all">All science events ({data.events.length})</option>
            {data.events.map((e) => (
              <option value={e.id} key={e.id}>{e.title}</option>
            ))}
          </Select>
          <div className="tabs">
            <button className={stageFilter === "all" ? "active" : ""} onClick={() => setStageFilter("all")}>
              All vouchers <span>{allItems.length}</span>
            </button>
            {urgentCount > 0 && (
              <button className={stageFilter === "urgent" ? "active" : ""} onClick={() => setStageFilter("urgent")}>
                Urgent (&lt;48h) <span className="bg-rust text-white">{urgentCount}</span>
              </button>
            )}
            <button className={stageFilter === "ready" ? "active" : ""} onClick={() => setStageFilter("ready")}>
              Ready for peer check <span>{allItems.filter((p) => p.status === "purchased").length}</span>
            </button>
            <button className={stageFilter === "closed" ? "active" : ""} onClick={() => setStageFilter("closed")}>
              Verified & closed <span>{allItems.filter((p) => p.status === "verified").length}</span>
            </button>
          </div>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search requisition item…" />
      </div>

      <div className="procurement-board">
        {(["needed", "purchased", "verified"] as const).map((status) => {
          const colItems = filteredItems.filter((p) => p.status === status);
          return (
            <section className={`board-column board-${status}`} key={status}>
              <div className="board-column-heading">
                <span className="board-status-dot" />
                <h2>
                  {status === "needed" ? "Stage 1: Requisition Needed" : status === "purchased" ? "Stage 2: Ready for Peer Check" : "Stage 3: Peer Verified & Closed"}
                </h2>
                <span className="board-count">{colItems.length}</span>
                {status === "needed" && canWork && (
                  <button
                    className="icon-button"
                    aria-label="Add needed item"
                    onClick={() => open("procurement", { eventId: eventFilter !== "all" ? eventFilter : data.events[0]?.id })}
                  >
                    <Plus size={17} />
                  </button>
                )}
              </div>
              <p className="board-description">
                {status === "needed"
                  ? "Items posted with estimated reference budget. Volunteers may purchase out of pocket."
                  : status === "purchased"
                  ? "Exact spend recorded. A peer volunteer must inspect the item at the venue."
                  : "Verified physically at venue. Vouchers closed with finality (no bottleneck)."}
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
                        ? "No requisitions currently needed. Field kit ready!"
                        : status === "purchased"
                        ? "No purchases pending peer verification."
                        : "Verified items will settle here."}
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
          <strong>Anti-Collusion & Verification Finality Rule:</strong> Enforced database constraint <code>CHECK (verified_by != purchased_by)</code>. A volunteer cannot verify their own purchase. Peer verification alone marks procurement complete and closed—no multi-level administrative reimbursement approval bottleneck is required.
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
          <span className="stamp-needed stamp-urgent">URGENT &lt;48H</span>
        )}
      </div>

      <span className="procurement-event">
        <CalendarDays size={12} />
        {event?.title || "Field programme"}
      </span>

      <h3>{item.itemName}</h3>
      <span className="procurement-quantity">
        <Package size={13} />
        {item.quantity}
      </span>

      <div className="procurement-costs">
        <div>
          <small>REFERENCE ESTIMATE</small>
          <strong className="mono">{money(item.estimatedCost)}</strong>
        </div>
        {item.actualCost !== null && (
          <div>
            <small>EXACT SPEND PAID</small>
            <strong className="mono text-rust">{money(item.actualCost)}</strong>
          </div>
        )}
      </div>

      {costDelta !== null && (
        <div className="spend-delta-note">
          {costDelta > 0 ? (
            <span className="delta-over">
              +₹{costDelta} over estimate (logged without cap)
            </span>
          ) : costDelta < 0 ? (
            <span className="delta-under">
              -₹{Math.abs(costDelta)} under estimate
            </span>
          ) : (
            <span className="delta-exact">Exact match with reference budget</span>
          )}
        </div>
      )}

      {item.status === "needed" && creator && (
        <div className="procurement-person">
          <Avatar person={creator} size="small" />
          <span>Requisitioned by <strong>{creator.fullName.split(" ")[0]}</strong></span>
          <small>{relativeTime(item.createdAt)}</small>
        </div>
      )}

      {buyer && (
        <div className="procurement-person">
          <Avatar person={buyer} size="small" />
          <span>Purchased by <strong>{buyer.fullName.split(" ")[0]}</strong></span>
          {item.purchasedAt && <small>{relativeTime(item.purchasedAt)}</small>}
        </div>
      )}

      {item.status === "needed" && canWork && (
        <Button variant="secondary" className="full-width board-action" icon={Plus} onClick={() => open("purchase", item)}>
          Log out-of-pocket purchase
        </Button>
      )}

      {item.status === "purchased" && canWork && (
        <>
          {isOwn ? (
            <div className="peer-lock-notice">
              <ShieldAlert size={14} />
              <span>
                <strong>Buyer self-verification blocked.</strong><br />
                Rule: <code>verified_by ≠ purchased_by</code>. Awaiting peer at venue.
              </span>
            </div>
          ) : (
            <Button variant="secondary" className="full-width board-action" icon={ClipboardCheck} onClick={() => open("verify", item)}>
              Inspect & peer verify at venue
            </Button>
          )}
        </>
      )}

      {item.status === "verified" && verifier && (
        <div className="verified-closed-box">
          <div className="stamp-verified">PEER VERIFIED AT VENUE</div>
          <div className="verified-byline">
            <Check size={12} />
            <span>
              Inspected by <strong>{verifier.fullName}</strong> ({verifier.role})
            </span>
          </div>
        </div>
      )}
    </article>
  );
}

export function CircularsView({ data, open }: Props) {
  const { locale } = useI18n();
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
        eyebrow="MODULE E · UNIT CIRCULARS & ADVOCACY"
        title="Official unit notice board."
        description={`Formal circulars, meeting agendas, and campaign resolutions published by ${identity.fullName}.`}
      >
        {["admin", "organizer"].includes(userRole) && <Button icon={Plus} onClick={() => open("publishCircular")}>Publish circular</Button>}
      </PageHeading>

      <div className="standalone-toolbar">
        <div className="tabs">
          {["All notices", "Pinned"].map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={filter === t ? "active" : ""}>
              {t}
              {t === "Pinned" && <Pin size={12} />}
            </button>
          ))}
        </div>
        <SearchInput placeholder="Search unit circulars and agendas…" value={search} onChange={setSearch} />
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
                  {notice.category}
                </span>
                {notice.pinned && <span className="stamp-verified stamp-needed">PINNED</span>}
              </div>

              <h2><button onClick={() => open("circular", notice)}>{notice.title}</button></h2>
              <p>{notice.content}</p>

                <div className="circular-card-footer">
                  {author && (
                    <span className="circular-author">
                      <Avatar person={author} size="small" />
                      <span>
                        {author.fullName} ({author.role})
                        <small>{new Date(notice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small>
                      </span>
                    </span>
                  )}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
                    <button
                      className="button button-secondary button-whatsapp"
                      style={{ fontSize: "11px", padding: "4px 9px", height: "27px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      onClick={() => shareViaWhatsApp(formatCircularBroadcast(notice, locale))}
                      title="Share to WhatsApp group"
                    >
                      <MessageCircle size={13} />
                      WhatsApp
                    </button>
                    <button className="arrow-link" onClick={() => open("circular", notice)}>
                      Read circular
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
          <EmptyState icon={Megaphone} title="No notices found" description="Try another search or publish a new circular." />
        </section>
      )}
    </div>
  );
}

export function ResourcesView({ open, data }: { open: OpenModal; data?: WorkspaceData }) {
  const [category, setCategory] = useState("All resources");
  const [search, setSearch] = useState("");
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>("fire-miracle");
  const isAuthenticated = Boolean(data?.currentUserId);
  const allResources = getSanitizedResources(isAuthenticated);

  const list = allResources.filter(
    (r) => (category === "All resources" || r.category === category) && `${r.title} ${r.description}`.toLowerCase().includes(search.toLowerCase())
  );

  const demoResources = list.filter((r) => r.category === "Demonstrations");
  const otherResources = list.filter((r) => r.category !== "Demonstrations");

  return (
    <div className="view-enter">
      <PageHeading
        eyebrow="MODULE E · RESOURCE ARCHIVE & SCIENCE OUTREACH"
        title="Field Repertoire & Anti-Superstition Lab."
        description={`Curated repository of anti-superstition chemical demonstration scripts, convention presentation templates, and environmental campaign literature for ${identity.fullName}.`}
      />

      {/* Editorial Hero Feature: Conference Poster Archive & Constitutional Mandate */}
      <section className="resources-editorial-hero panel print-tech-slip">
        <span className="print-mark print-mark-tl" />
        <span className="print-mark print-mark-tr" />
        <span className="print-mark print-mark-bl" />
        <span className="print-mark print-mark-br" />

        <div className="hero-poster-col">
          <div className="poster-frame">
            <img src="/images/conference-poster.jpg" alt="All India Science Conference 2025 Original Poster" />
            <button className="poster-zoom-btn" onClick={() => open("resource", resources.find((r) => r.id === "poster-2025"))}>
              <Eye size={14} /> Inspect High-Res Poster
            </button>
          </div>
        </div>

        <div className="hero-manifesto-col">
          <div className="manifesto-eyebrow">
            <span className="bengali-mark text-rust mr-2">{identity.bengali}</span>
            <span>ARTICLE 51A(h) · CONSTITUTION OF INDIA</span>
          </div>
          <h2>&ldquo;To develop the scientific temper, humanism and the spirit of inquiry and reform.&rdquo;</h2>
          <p>
            Breakthrough Science Society was established in 1995 as a voluntary movement to take the method of science directly to the common masses, question entrenched dogmas, and demand equitable public funding for basic research.
          </p>

          <div className="manifesto-meta-grid">
            <div>
              <small>PARENT SOCIETY REGD.</small>
              <strong className="mono">{identity.registrationNo}</strong>
            </div>
            <div>
              <small>UNIT JURISDICTION</small>
              <strong>{identity.unit} ({identity.state})</strong>
            </div>
            <div>
              <small>FOUNDING YEAR</small>
              <strong className="mono">{identity.established}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="standalone-toolbar mt-6">
        <div className="tabs resource-tabs">
          {["All resources", "Demonstrations", "Advocacy", "Environment", "Publications", "Organising"].map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={category === c ? "active" : ""}>
              {c}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search demonstration protocols or toolkits…" />
      </div>

      {/* Section 1: Anti-Superstition Demonstration Lab (Interactive Protocols) */}
      {(category === "All resources" || category === "Demonstrations") && demoResources.length > 0 && (
        <section className="resource-section mb-8">
          <div className="section-label-bar">
            <h3>
              <FlaskConical size={18} className="text-rust" />
              Anti-Superstition Demonstration Lab — Chemical & Physical Protocols
            </h3>
            <span className="mono text-[10px] text-muted">Busting Godmen Tricks with Laboratory Evidence</span>
          </div>

          <div className="demo-protocols-list">
            {demoResources.map((r) => {
              const isExpanded = expandedProtocol === r.id;
              return (
                <article className="demo-protocol-card panel print-tech-slip" key={r.id}>
                  <div className="protocol-card-head" onClick={() => setExpandedProtocol(isExpanded ? null : r.id)}>
                    <div className="protocol-title-group">
                      <span className="stamp-verified stamp-needed text-[7px]">EXPOSING FRAUD</span>
                      <h4>{r.title}</h4>
                      <p>{r.description}</p>
                    </div>
                    <div className="protocol-head-actions">
                      <span className="read-time-pill mono">{r.readTime}</span>
                      <button className="icon-button" aria-label="Toggle details">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="protocol-card-body">
                      {r.keyQuestion && (
                        <div className="protocol-key-q">
                          <strong>INQUIRY PROMPT:</strong> <span>{r.keyQuestion}</span>
                        </div>
                      )}

                      <div className="protocol-reagents-grid">
                        {r.materials && (
                          <div className="reagents-checklist">
                            <h5>REAGENTS & PROPS</h5>
                            <ul>
                              {r.materials.map((m, i) => (
                                <li key={i}><Check size={12} />{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {r.safetyNotes && (
                          <div className="safety-protocols-box">
                            <h5><ShieldAlert size={14} /> FIELD SAFETY PROTOCOL</h5>
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
                          Open complete narration script & explanation
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
              Campaign Toolkits, Policy Briefs & Journal Archives
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
                    <span>{r.category}</span>
                  </div>
                  <small className="resource-kind">{r.kind}</small>
                  <h2><button onClick={() => open("resource", r)}>{r.title}</button></h2>
                  <p>{r.description}</p>
                  <div className="resource-card-footer">
                    <span>{r.readTime}</span>
                    <button className="arrow-link" onClick={() => open("resource", r)}>
                      {r.url ? "Explore" : "Open briefing"}
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
        <EmptyState icon={BookOpen} title="No resources found" description="Try selecting 'All resources' or clearing your search term." />
      )}

      <div className="resource-attribution mt-8">
        <Info size={14} />
        <p>
          Working demonstration protocols and field guides are curated for Light of Science, Jalpaiguri Unit. Official photographs and conference poster: Breakthrough Science Society.{" "}
          <a href="https://breakthroughindia.org/" target="_blank" rel="noreferrer">
            Official All-India Portal <ExternalLink size={11} />
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
}: {
  data: WorkspaceData;
  perform: PerformAction;
  enablePush: () => void;
  pushEnabled: boolean;
  installApp: () => void;
  busy: boolean;
}) {
  const current = data.profiles.find((p) => p.id === data.currentUserId) || data.profiles[0] || {
    id: "",
    fullName: "Public Visitor",
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
    if (confirm("Log out of the unit workspace on this device?")) {
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
        eyebrow="CONFIGURATION & CADRE PREFERENCES"
        title="Unit workspace settings."
        description={`${identity.organisation} · ${identity.unit}, ${identity.state}.`}
      />

      <div className="settings-grid">
        <section className="panel settings-panel">
          <h2><Users size={18} />Your member account & designated role</h2>
          <div className="settings-profile">
            <Avatar person={current} size="large" />
            <div>
              <h3>{current.fullName}</h3>
              <span>
                {current.role === "admin" ? "Unit Executive / Office-Bearer" : current.role.charAt(0).toUpperCase() + current.role.slice(1)} · {identity.unit}
              </span>
            </div>
            <Badge tone="green">{current.status === "active" ? "Active" : "Dues pending"}</Badge>
          </div>

          <div className="settings-auth-block">
            <h3><ShieldCheck size={17} /> Authentication & Security</h3>
            <p className="settings-help-text">
              Your member account is secured with Google OAuth 2.0. PIN authentication has been deprecated and permanently retired.
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
                  <strong>{current.googleEmail || "Your Google account"}</strong>
                  <span className="auth-status-badge">● Linked & Verified Google Account</span>
                </div>
              </div>
              <Badge tone="green">Google OAuth Active</Badge>
            </div>

            <div className="security-notice-callout">
              <KeyRound size={15} />
              <span>
                <strong>Zero-PIN Security:</strong> Member accounts are bound to Google credentials. If a Google account is lost or changed, an executive can unlink and issue a single-use Crockford invite code in person.
              </span>
            </div>

            <div className="settings-divider" />

            <div className="settings-logout-block">
              <div>
                <strong>Sign Out of Workspace</strong>
                <p>Signs out of this device session. You can sign straight back in with your linked Google account.</p>
              </div>
              <Button variant="secondary" icon={LogOut} onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </div>
        </section>

        <section className="panel settings-panel">
          <h2><Bell size={18} />Real-time notification engine (PWA & Push)</h2>
          <div className="setting-row">
            <div>
              <strong>In-app activity stream</strong>
              <p>Real-time audit log of dues collections, exact spend logs, peer verifications, and public donations.</p>
            </div>
            <Badge tone="green">Always on</Badge>
          </div>

          <div className="setting-row">
            <div>
              <strong>Browser Web Push API</strong>
              <p>VAPID service worker background alerts for urgent procurements (&lt;48h) and dues receipts.</p>
            </div>
            <Button variant="secondary" icon={pushEnabled ? Check : Bell} onClick={enablePush} disabled={pushEnabled}>
              {pushEnabled ? "Push enabled" : "Enable Web Push"}
            </Button>
          </div>

          <div className="setting-row">
            <div>
              <strong>Audible field tone</strong>
              <p>A quiet notification chime when new unit activity arrives while the workspace is open.</p>
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
                aria-label="Notification sound"
              />
              <span />
            </label>
          </div>

          <div className="setting-row">
            <div>
              <strong>Membership dues reminder badge</strong>
              <p>Highlights monthly dues status if pending on personal profile.</p>
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
                aria-label="Show dues reminder"
              />
              <span />
            </label>
          </div>
        </section>

        <section className="panel settings-panel">
          <h2><Info size={18} />Application release & system information</h2>
          <div className="unit-detail-row">
            <span>Platform Release</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong className="mono">v{identity.version}</strong>
              <Badge tone="rust">{identity.releaseName}</Badge>
            </div>
          </div>
          <div className="unit-detail-row">
            <span>Build Identification</span>
            <strong className="mono">{identity.build}</strong>
          </div>
          <div className="unit-detail-row">
            <span>PWA Offline Cache</span>
            <strong className="mono">light-of-science-workspace-v5</strong>
          </div>
          <div className="unit-detail-row">
            <span>Database Backend</span>
            <strong>PostgreSQL (Neon Serverless · Active)</strong>
          </div>
          <div className="unit-detail-row">
            <span>Local Offline Queue</span>
            <strong>IndexedDB (Auto-reconnect sync)</strong>
          </div>
          <div className="unit-detail-row">
            <span>Target Jurisdiction</span>
            <strong>{identity.unit} · {identity.state}</strong>
          </div>
        </section>

        <section className="panel settings-panel">
          <h2><MapPin size={18} />Society legal & unit registration</h2>
          <div className="unit-detail-row"><span>Unit Name</span><strong>{identity.name}</strong></div>
          <div className="unit-detail-row"><span>Parent Body</span><strong>{identity.organisation}</strong></div>
          <div className="unit-detail-row"><span>Society Registration</span><strong className="mono">{identity.registrationNo}</strong></div>
          <div className="unit-detail-row"><span>Governing Act</span><strong>{identity.act}</strong></div>
          <div className="unit-detail-row"><span>Headquarters</span><strong>{identity.headquarters}</strong></div>
          <div className="unit-detail-row"><span>Baseline Monthly Dues</span><strong className="mono">₹20 / month (No upper cap)</strong></div>
          <a href="https://breakthroughindia.org/" className="arrow-link mt-4" target="_blank" rel="noreferrer">
            Official Breakthrough Science Society Portal <ArrowUpRight size={15} />
          </a>
        </section>

        <section className="panel settings-panel">
          <h2><Smartphone size={18} />Progressive Web App (PWA) field install</h2>
          <p className="install-description">
            Add Light of Science to your Android or desktop home screen for offline field readiness. Service workers cache critical unit resources, and the offline fallback guarantees no out-of-sync phantom writes.
          </p>
          <Button variant="secondary" icon={Download} onClick={installApp}>
            Install PWA on device
          </Button>

          <div className="settings-credit">
            <img src="/images/bss-logo.svg" alt="BSS emblem" />
            <p>
              Emblem by Breakthrough Science Society (CC BY-SA). Platform developed for {identity.fullName}.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
