"use client";

import { identity } from "@/lib/identity";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Copy, Download, ExternalLink, HeartHandshake, Info, MapPin, MessageCircle, MessageSquare, Package, Printer, ReceiptText, Send, ShieldAlert, ShieldCheck, Users, Wallet } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { type WorkspaceData, type Donation, type UnitEvent, type Procurement, type Circular, type DuesRecord, type PerformAction, months } from "@/lib/types";
import { type Resource } from "@/lib/resources";
import { Avatar, Badge, Button, FormField, Modal, SubmitButton } from "@/components/ui";
import { TreasurerSignatureBlock, UnitOfficialSeal } from "@/components/unit-seal";
import { VirtualIdCard } from "@/components/id-card";
import { formatCircularBroadcast, formatEventBroadcast, shareViaWhatsApp } from "@/lib/whatsapp";
import type { Profile } from "@/lib/types";
import type { Navigate, OpenModal } from "@/components/overview";
import { useI18n } from "@/lib/i18n";
import { isDhimanSessionText, isEnvironmentDayText, isMashkalaibari, isPrafullaRayText } from "@/lib/localize-content";
import { isCampaignEvent, hydrateCampaignEvent } from "@/lib/campaign-data";

export type ModalState = { type: string; record?: unknown } | null;
type Props = { modal: ModalState; data: WorkspaceData; close: () => void; open: OpenModal; perform: PerformAction; busy: boolean; error: string; navigate: Navigate; notify: (message: string) => void };

function SmsPreviewModal({
  donation,
  close,
  notify,
  save,
  busy,
}: {
  donation: Donation;
  close: () => void;
  notify: (msg: string) => void;
  save: (action: string, values: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const { t, tx, fmtTime } = useI18n();
  const [recipientPhone, setRecipientPhone] = useState(donation.donorPhone || "");
  const receiptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/receipts/${donation.id}`;
  const smsMessage = `[${identity.name.toUpperCase()} · ${identity.organisationShort}] Received with thanks ₹${donation.amount.toLocaleString("en-IN")} from ${donation.donorName} on ${new Date(donation.createdAt).toLocaleDateString("en-IN")}. Official Receipt No: ${donation.receiptNo}. Digital verification slip: ${receiptUrl} — Breakthrough Science Society, ${identity.unit}.`;

  const copySms = async () => {
    try {
      await navigator.clipboard.writeText(smsMessage);
      notify(t("SMS text copied to clipboard."));
    } catch {
      notify(t("Please copy the text manually from the screen."));
    }
  };

  return (
    <Modal title={t("SMS Notification Gateway")} subtitle={t("DLT-compliant automated SMS receipt dispatched to donor mobile")} onClose={close}>
      <div className="sms-handset-preview">
        <div className="sms-header">
          <MessageSquare size={16} />
          <span>{t("OUTBOUND CARRIER GATEWAY (FAST2SMS / MSG91)")}</span>
          <Badge tone={donation.smsSent ? "green" : "yellow"}>
            {donation.smsSent ? t("Dispatched") : t("Ready to Send")}
          </Badge>
        </div>

        <div className="sms-recipient-line" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span>{t("To (Indian Mobile):")}</span>
          <input
            type="tel"
            placeholder={t("+91 98320 XXXXX")}
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            disabled={donation.smsSent}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: "bold",
              padding: "4px 8px",
              border: "1px solid var(--rule-soft, #ddd)",
              borderRadius: "4px",
              fontSize: "13px",
              minWidth: "180px",
            }}
          />
          <small>{tx("· DLT Header: <strong>BSSJPG</strong>")}</small>
        </div>

        <div className="sms-bubble">
          <p>{smsMessage}</p>
          <time className="sms-timestamp">
            {fmtTime(donation.createdAt, { hour: "numeric", minute: "2-digit" })}
          </time>
        </div>

        <div className="sms-meta-strip">
          <ShieldCheck size={14} />
          <span>{tx("Sender ID: <strong>BSSJPG</strong> · Length: {smsMessageCount} chars · DLT Transactional Route", { smsMessageCount: smsMessage.length })}</span>
        </div>
      </div>

      <div className="modal-actions">
        <Button variant="secondary" icon={Copy} onClick={() => void copySms()}>{t("Copy SMS text")}</Button>
        {!donation.smsSent && (
          <Button
            icon={Send}
            onClick={() => {
              void save("sendSms", { id: donation.id, phone: recipientPhone });
            }}
            disabled={busy}
          >
            {t("Dispatch SMS receipt")}
          </Button>
        )}
        <Button variant="secondary" onClick={close}>{t("Close")}</Button>
      </div>
    </Modal>
  );
}

const MASHKALAIBARI_PHOTOS = [
  {
    src: "/images/field-reports/mashkalaibari/inspection-1.jpg",
    caption: "Light of Science President & BSS State Executive Kunal Roy alongside a local resident in front of Mashkalaibari crematorium and the emission chimney stack",
    fig: "FIG 01",
    tag: "President · Kunal Roy",
  },
  {
    src: "/images/field-reports/mashkalaibari/inspection-2.jpg",
    caption: "Plastic waste, beverage bottles, and uncollected refuse scattered on the dirt pathway near surrounding thickets",
    fig: "FIG 02",
    tag: "Plastic & Refuse Litter",
  },
  {
    src: "/images/field-reports/mashkalaibari/inspection-3.jpg",
    caption: "Furnace building with arrow highlighting the emission chimney stack base, exhaust ducting, and blower motor assembly",
    fig: "FIG 03",
    tag: "Chimney & Furnace Fault",
  },
  {
    src: "/images/field-reports/mashkalaibari/inspection-4.jpg",
    caption: "Kunal Roy inspecting dense jungle overgrowth and lack of maintenance in the rear premises and adjoining burial ground (kabrastan)",
    fig: "FIG 04",
    tag: "Rear Jungle Overgrowth",
  },
  {
    src: "/images/field-reports/mashkalaibari/inspection-5.jpg",
    caption: "Riverbed contamination: discarded ritual clothes, umbrellas, and funeral remnants polluting the stream",
    fig: "FIG 05",
    tag: "Riverbed Contamination",
  },
  {
    src: "/images/field-reports/mashkalaibari/inspection-6.jpg",
    caption: "Roadside dumping of funeral ritual clothes and solid waste with stray goats scavenging along the access path",
    fig: "FIG 06",
    tag: "Roadside Ritual Dumping",
  },
];

const ENVIRONMENT_DAY_PHOTOS = [
  {
    src: "/images/field-reports/environment-day-2026/karala-rally-march.jpg",
    caption: "Joint environmental rally march proceeding from Kotwali Thana More to Kadamtala with Light of Science Club and Relief & Public Welfare Society banners",
    fig: "FIG 01",
    tag: "Civic Demonstration March",
  },
  {
    src: "/images/field-reports/environment-day-2026/karala-rally-placards.jpg",
    caption: "Volunteers and local citizens carrying scientific placards demanding Karala river desiltation and anti-dumping measures",
    fig: "FIG 02",
    tag: "Citizen Demands & Placards",
  },
  {
    src: "/images/field-reports/environment-day-2026/karala-rally-delegation.jpg",
    caption: "Joint coordination delegation including Relief & Public Welfare Society and Light of Science leadership",
    fig: "FIG 03",
    tag: "Joint Leadership Delegation",
  },
  {
    src: "/images/field-reports/environment-day-2026/karala-rally-speech.jpg",
    caption: "Open-air street corner address at Kadamtala on ecological restoration of River Karala and removal of hazardous municipal dumpsite",
    fig: "FIG 04",
    tag: "Street Address & Speeches",
  },
  {
    src: "/images/field-reports/environment-day-2026/karala-rally-youth.jpg",
    caption: "Student and youth cadres advocating for clean water bodies and scientific waste management in Jalpaiguri town",
    fig: "FIG 05",
    tag: "Youth & Science Cadres",
  },
  {
    src: "/images/field-reports/environment-day-2026/karala-rally-banner.jpg",
    caption: "Official front banner of the World Environment Day Rally held on June 5, 2026 across Jalpaiguri town",
    fig: "FIG 06",
    tag: "World Environment Day Banner",
  },
];

const DHIMAN_SESSION_PHOTOS = [
  {
    src: "/images/field-reports/club-room-dhiman-session/session-dhiman-sarkar-1.jpg",
    caption: "Sri Dhiman Sarkar (Associate Curator, National Science Museum & BSS State Executive Member) discussing contemporary science movements with President Kunal Roy, Secretary Pritam Sarkar, and unit leaders",
    fig: "FIG 01",
    tag: "Deliberation & Policy Session",
  },
  {
    src: "/images/field-reports/club-room-dhiman-session/session-dhiman-sarkar-2.jpg",
    caption: "Club room assembly: Sri Dhiman Sarkar interacting with executive members on upcoming AI, Emotional Quotient, and tea garden outreach initiatives",
    fig: "FIG 02",
    tag: "Club Room Assembly",
  },
];

const PRAFULLA_RAY_PHOTOS = [
  {
    src: "/images/field-reports/prafulla-ray/prafulla-birth-anniversary-1.jpg",
    caption: "Volunteers collecting humanitarian donations from citizens in an e-rickshaw across Jalpaiguri town for Assam flood victims",
    fig: "FIG 01",
    tag: "Town Relief Collection Drive",
  },
  {
    src: "/images/field-reports/prafulla-ray/prafulla-flood-relief-2.jpg",
    caption: "Observance of Acharya Prafulla Chandra Ray's birth anniversary with framed portrait, Breakthrough Science Society banner, and joint Students' Action Front Assam Flood Relief appeal at Kadamtala",
    fig: "FIG 02",
    tag: "Birth Anniversary & Relief Desk",
  },
  {
    src: "/images/field-reports/prafulla-ray/prafulla-meeting-3.jpg",
    caption: "Youth and student organizers including President Kunal Roy, Secretary Pritam Sarkar, Joint Secretaries Deepta Pal and Avash Rajak coordinating the relief collection drive at Kadamtala",
    fig: "FIG 03",
    tag: "Unit Leadership & Cadre Mobilization",
  },
];

function EventDetailModal({
  event: rawEvent,
  data,
  close,
  open,
  notify,
  navigate,
}: {
  event: UnitEvent;
  data: WorkspaceData;
  close: () => void;
  open: OpenModal;
  notify: (msg: string) => void;
  navigate: Navigate;
}) {
  const { t, tx, num, fmtDate, fmtDateTime } = useI18n();
  const event = hydrateCampaignEvent(rawEvent);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isCampaign = isCampaignEvent(event);
  const isEnvironmentDay = event.id === "20000000-0000-4000-8000-000000000006" || isEnvironmentDayText(event.title);
  const isDhimanSession = event.id === "20000000-0000-4000-8000-000000000007" || isDhimanSessionText(event.title);
  const isPrafulla = event.id === "20000000-0000-4000-8000-000000000008" || isPrafullaRayText(event.title);
  const isMash = isMashkalaibari(event.title);
  const galleryPhotos = isDhimanSession
    ? DHIMAN_SESSION_PHOTOS
    : isEnvironmentDay
    ? ENVIRONMENT_DAY_PHOTOS
    : isPrafulla
    ? PRAFULLA_RAY_PHOTOS
    : isMash
    ? MASHKALAIBARI_PHOTOS
    : null;
  const eventItems = data.procurements.filter((p) => p.eventId === event.id);
  const date = new Date(event.startsAt);
  const currentPhoto = galleryPhotos ? galleryPhotos[activePhotoIdx] : null;
  const totalPhotos = galleryPhotos?.length || 0;
  const openReport = () => {
    let c = null;
    if (isPrafulla) {
      c = data.circulars.find((cir) => cir.id === "50000000-0000-4000-8000-000000000008" || isPrafullaRayText(cir.title));
    } else if (isEnvironmentDay) {
      c = data.circulars.find((cir) => cir.id === "50000000-0000-4000-8000-000000000006" || isEnvironmentDayText(cir.title));
    } else {
      c = data.circulars.find((cir) => isMashkalaibari(cir.title));
    }
    close();
    if (c) open("circular", c);
  };
  const openEnvironmentReport = () => {
    const c = data.circulars.find((cir) => cir.id === "50000000-0000-4000-8000-000000000006" || isEnvironmentDayText(cir.title));
    if (c) {
      close();
      open("circular", c);
    }
  };

  // Keyboard navigation for photo gallery
  useEffect(() => {
    if (!galleryPhotos || totalPhotos <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActivePhotoIdx((idx) => (idx > 0 ? idx - 1 : totalPhotos - 1));
      } else if (e.key === "ArrowRight") {
        setActivePhotoIdx((idx) => (idx < totalPhotos - 1 ? idx + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryPhotos, totalPhotos]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !galleryPhotos || totalPhotos <= 1) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        setActivePhotoIdx((idx) => (idx > 0 ? idx - 1 : totalPhotos - 1));
      } else {
        setActivePhotoIdx((idx) => (idx < totalPhotos - 1 ? idx + 1 : 0));
      }
    }
    touchStartX.current = null;
  };

  return (
    <Modal
      title={event.title.replace(/^Campaign:\s*/i, "")}
      subtitle={`${event.isOngoing ? t("Ongoing Civic Campaign") : isCampaign ? t("Concluded Civic Campaign · Victory") : t(event.category)} · ${t(identity.unit)}`}
      onClose={close}
      wide
    >
      {/* 1. PHOTOGRAPHIC EVIDENCE SECTION */}
      {galleryPhotos ? (
        <div className="campaign-gallery-container px-4 sm:px-6 pt-3">
          {/* Main Photo Viewer Stage */}
          <div
            className="relative bg-[#0d120a] rounded-lg overflow-hidden border border-rule-soft shadow-md touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative flex items-center justify-center min-h-[280px] sm:min-h-[400px] max-h-[500px] bg-black/50">
              <img
                src={currentPhoto?.src || event.image}
                alt={currentPhoto ? t(currentPhoto.caption) : event.title}
                onError={(e) => {
                  e.currentTarget.src = "/images/field-reports/mashkalaibari/inspection-1.jpg";
                }}
                className="max-h-[400px] sm:max-h-[480px] w-full object-contain mx-auto select-none transition-opacity duration-200"
              />

              {/* Prev / Next Navigation Arrows */}
              <button
                type="button"
                onClick={() =>
                  setActivePhotoIdx((idx) => (idx > 0 ? idx - 1 : totalPhotos - 1))
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center transition-all hover:scale-105 shadow-xl border border-white/20"
                aria-label={t("Previous photograph (or press Left Arrow)")}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActivePhotoIdx((idx) => (idx < totalPhotos - 1 ? idx + 1 : 0))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center transition-all hover:scale-105 shadow-xl border border-white/20"
                aria-label={t("Next photograph (or press Right Arrow)")}
              >
                <ChevronRight size={22} />
              </button>

              {/* Photo Counter Pill */}
              <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded font-mono font-bold tracking-wider border border-white/15">
                {t("PHOTO 0{n} OF 0{total} · {tag}", { n: activePhotoIdx + 1, total: totalPhotos, tag: currentPhoto ? t(currentPhoto.tag) : "" })}
              </span>

              {/* Full-Res Link */}
              <a
                href={currentPhoto?.src}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white text-[11px] px-2.5 py-1 rounded font-mono font-medium flex items-center gap-1.5 border border-white/15 transition-colors"
                title={t("Open uncompressed photograph in new browser tab")}
              >
                <ExternalLink size={12} />
                <span>{t("Full-Res")}</span>
              </a>
            </div>

            {/* Photo Caption Strip */}
            <div className="p-3 bg-[#151c10] border-t border-white/10 text-xs text-[#ece6d8] flex items-center justify-between gap-3">
              <span className="leading-relaxed">
                <strong className="text-rust-tint font-bold font-mono mr-1.5">{t("FIG 0{n}", { n: activePhotoIdx + 1 })}:</strong>
                {currentPhoto ? t(currentPhoto.caption) : null}
              </span>
              <span className="mono text-[10px] text-ink-mute shrink-0 hidden sm:inline">{t("Use ← / → keys or swipe")}</span>
            </div>
          </div>

          {/* 6-Photo Thumbnail Navigation Strip (Responsive horizontal scroll on mobile, 6-col on desktop) */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="mono text-[11px] font-bold uppercase text-rust tracking-wider">
                {isEnvironmentDay
                  ? t("All 6 World Environment Day Rally Photographs")
                  : t("All 6 Field Inspection Photographs")}
              </span>
              <span className="mono text-[10.5px] text-ink-mute">{t("Click thumbnail or swipe")}</span>
            </div>
            <div className="campaign-thumb-strip">
              {galleryPhotos.map((photo, idx) => (
                <button
                  key={photo.src}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`group relative rounded overflow-hidden aspect-[4/3] border-2 transition-all ${
                    activePhotoIdx === idx
                      ? "border-rust ring-2 ring-rust/50 scale-[1.03]"
                      : "border-rule-soft opacity-75 hover:opacity-100 hover:border-ink-mute"
                  }`}
                  title={t(photo.caption)}
                >
                  <img src={photo.src} alt={t(photo.caption)} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-white text-center py-0.5 mono font-bold">
                    {num(0)}{num(idx + 1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 pt-3">
          <div className="bg-[#12180d] rounded-lg overflow-hidden border border-rule-soft flex items-center justify-center min-h-[240px]">
            <img
              className="max-h-[380px] w-full object-contain mx-auto block"
              src={event.image}
              alt={event.title}
            />
          </div>
        </div>
      )}

      {/* 2. BODY CONTENT */}
      <div className="event-detail-body">
        <div className="event-detail-meta">
          <span>
            <CalendarDays size={17} />
            {event.isOngoing
              ? t("Initiated: {date} · Active Campaign", { date: fmtDate(date, { day: "numeric", month: "short", year: "numeric" }) })
              : fmtDateTime(date, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}
          </span>
          <span><MapPin size={17} />{event.location}</span>
          <span><Users size={17} />{event.isOngoing ? t("{volunteers} active advocates mobilizing", { volunteers: event.volunteers }) : t("{volunteers} active volunteers assigned", { volunteers: event.volunteers })}</span>
        </div>

        <p className="event-detail-description">{event.description}</p>

        {/* Campaign Progress Bar */}
        {(event.isOngoing || isCampaign || (event.milestones && event.milestones.length > 0)) && (
          <div className="campaign-progress-box my-4">
            <div className="campaign-progress-header">
              <span className="campaign-progress-label mono">
                {event.isOngoing ? (
                  tx("CAMPAIGN TARGET: <strong>{percent}% REACHED</strong>", { percent: event.progressPercent || 20 })
                ) : (
                  <strong className="text-[#2d6a4f]">{t("CAMPAIGN TARGET: 100% ACHIEVED & DELIVERED")}</strong>
                )}
              </span>
              <span className={`campaign-phase-badge ${!event.isOngoing ? "bg-[#e8f3ea] text-[#1b4332] border border-[#a3c9a8]" : ""}`}>
                {event.isOngoing
                  ? t("PHASE {phase} IN PROGRESS", { phase: event.milestones?.find((m) => m.status === "in_progress")?.phase || 2 })
                  : t("ALL PHASES COMPLETED")}
              </span>
            </div>
            <div className="campaign-progress-track">
              <div
                className={`campaign-progress-fill ${!event.isOngoing ? "bg-[#2d6a4f]" : ""}`}
                style={{ width: `${event.progressPercent || (event.isOngoing ? 20 : 100)}%` }}
              />
            </div>
            {event.targetGoal && (
              <div className="campaign-progress-footer">
                <span>{event.isOngoing ? t("Goal: {goal}", { goal: event.targetGoal }) : t("Delivered: {goal}", { goal: event.targetGoal })}</span>
              </div>
            )}
          </div>
        )}

        {/* Phased Action Plan & Milestones Roadmap */}
        {(event.isOngoing || isCampaign) && event.milestones && event.milestones.length > 0 && (
          <div className="campaign-milestones-section my-5 pt-4 border-t border-rule-soft">
            <div className="flex items-center justify-between mb-3">
              <h4 className="mono text-xs font-bold text-rust uppercase tracking-wider">
                {event.isOngoing ? t("Campaign Action Plan & Milestone Roadmap") : t("Delivered Milestones & Verification History")}
              </h4>
              <span className="text-[11px] text-ink-faint mono">
                {t("{done} of {total} Completed", { done: event.milestones.filter((m) => m.status === "completed").length, total: event.milestones.length })}
              </span>
            </div>
            <div className="space-y-2.5">
              {event.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded border text-left transition-colors ${
                    m.status === "completed"
                      ? "bg-[#eef4e8] border-[#c8d9be] text-ink"
                      : m.status === "in_progress"
                      ? "bg-[#fdf3ee] border-[#e8c0b0] text-ink"
                      : "bg-paper-card border-rule-soft text-ink-mute opacity-85"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="mono text-[11px] font-bold">
                      {t("PHASE 0{phase} · {title}", { phase: num(m.phase), title: m.title })}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mono ${
                        m.status === "completed"
                          ? "bg-olive text-paper-card"
                          : m.status === "in_progress"
                          ? "bg-rust text-paper-card"
                          : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {m.status === "completed" ? t("✓ Completed") : m.status === "in_progress" ? t("● In Progress") : t("○ Planned")}
                    </span>
                  </div>
                  <p className="text-xs text-ink-2 leading-relaxed">{m.description}</p>
                  {m.completedDate && (
                    <small className="text-[10px] text-ink-faint mono block mt-1">
                      {t("Completed: {date}", { date: m.completedDate })}
                    </small>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic circular / report link for any campaign */}
        {(() => {
          const titleLower = event.title.toLowerCase();
          const matchedCircular = data.circulars.find((cir) => {
            const ct = cir.title.toLowerCase();
            if (titleLower.includes("mashkalaibari") && isMashkalaibari(cir.title)) return true;
            if (titleLower.includes("karala") && (ct.includes("karala") || ct.includes("environment day"))) return true;
            return false;
          });
          if (!matchedCircular) return null;
          return (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg my-4 flex items-center justify-between gap-3">
              <div>
                <strong className="text-xs text-ink block font-semibold">{t("Official Field Report & Resolution on Record")}</strong>
                <span className="text-[11px] text-ink-mute">{matchedCircular.title}</span>
              </div>
              <Button
                variant="secondary"
                icon={ArrowUpRight}
                onClick={() => {
                  close();
                  open("circular", matchedCircular);
                }}
              >
                {t("Read Full Report")}
              </Button>
            </div>
          );
        })()}

        {!event.isOngoing && eventItems.length > 0 && (
          <div className="event-checklist-summary">
            <Package size={20} />
            <div>
              <strong>{t("Field Requisition Status")}</strong>
              <p>{t("{total} items logged · {needed} needed · {verified} verified", { total: eventItems.length, needed: eventItems.filter((p) => p.status === "needed").length, verified: eventItems.filter((p) => p.status === "verified").length })}</p>
            </div>
            <ArrowRight size={17} />
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button className="button button-secondary button-whatsapp" onClick={() => shareViaWhatsApp(formatEventBroadcast(event))}>
          <MessageCircle size={15} />
          {t("Mobilize on WhatsApp")}
        </button>
        {event.isOngoing ? (
          <Button variant="primary" onClick={openReport}>
            {t("Read Investigation Report")}
          </Button>
        ) : isCampaign ? (
          <Button variant="primary" onClick={openReport}>
            {t("Read Field Action Report")}
          </Button>
        ) : (
          <>
            <Button variant="secondary" icon={Download} onClick={() => { downloadCalendar(event); notify(t("iCal event file downloaded.")); }}>
              {t("Add to calendar")}
            </Button>
            <Button icon={Package} onClick={() => { close(); navigate("procurement", event.id); }}>
              {t("Open procurement checklist")}
            </Button>
          </>
        )}
        <Button variant="secondary" onClick={close}>{t("Close")}</Button>
      </div>
    </Modal>
  );
}

function PurchaseModal({
  item,
  data,
  save,
  close,
  formProps,
}: {
  item: Procurement;
  data: WorkspaceData;
  save: (action: string, values: Record<string, unknown>) => Promise<void>;
  close: () => void;
  formProps: { busy: boolean; error: string; close: () => void };
}) {
  const { t, money } = useI18n();
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string | null>(item.receiptPhotoUrl || null);

  return (
    <Modal title={t("Log Out-of-Pocket Purchase")} subtitle={t("Record exact spend paid by buyer. No pre-approval ceiling blocks procurement.")} onClose={close}>
      <ActionForm action="purchase" save={save} {...formProps} submit={t("Log exact purchase")}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="receiptPhotoUrl" value={receiptPhotoUrl || ""} />
        <div className="item-detail-summary">
          <span className="stat-icon stat-icon-orange"><Package size={22} /></span>
          <div>
            <h3>{item.itemName}</h3>
            <p>{item.quantity} · {data.events.find((e) => e.id === item.eventId)?.title}</p>
          </div>
        </div>
        <div className="reference-line">
          <span>{t("Reference Estimated Cost")}</span>
          <strong className="mono">{money(item.estimatedCost)}</strong>
        </div>
        <FormField
          label={t("Exact amount paid by buyer")}
          required
          hint={t("Record the real amount spent, whether below, matching, or exceeding the estimated budget. No pre-approval restriction blocks logging.")}
        >
          <div className="currency-input large-input">
            <span>₹</span>
            <input name="actualCost" type="number" min="0" step="0.01" placeholder="0.00" inputMode="decimal" required />
          </div>
        </FormField>
        <FormField
          label={t("Bazaar Bill / Paper Receipt Photo")}
          hint={t("Optional. Capture photo of cash memo or attach image for venue verification.")}
        >
          <div className="bill-photo-input">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setReceiptPhotoUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
            {receiptPhotoUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img src={receiptPhotoUrl} alt={t("Receipt preview")} style={{ maxHeight: "72px", borderRadius: "4px", border: "1px solid var(--rule-soft)" }} />
                <Button variant="secondary" onClick={() => setReceiptPhotoUrl(null)}>{t("Remove photo")}</Button>
              </div>
            )}
          </div>
        </FormField>
        <div className="soft-info">
          <Users size={17} />
          <span>{t("Status changes to 'Ready to verify'. A second volunteer must physically inspect the item at the venue to close it.")}</span>
        </div>
      </ActionForm>
    </Modal>
  );
}

export function WorkspaceModals(props: Props) {
  const { t, tx, num, money, fmtDate, fmtDateTime, monthShort, roleName } = useI18n();
  const { modal, data, close, open, perform, busy, error, navigate, notify } = props;
  if (!modal) return null;
  const formProps = { busy, error, close };

  const save = async (action: string, values: Record<string, unknown>) => {
    const result = await perform(action, values);
    if (result) {
      if (result.receiptId) {
        const match = result.data?.donations?.find((d) => d.id === result.receiptId);
        if (match) {
          open("receipt", match);
        } else {
          open("receipt", {
            id: result.receiptId,
            donorName: (values.donorName as string) || "Supporter",
            donorPhone: (values.donorPhone as string) || null,
            amount: Number(values.amount) || 0,
            eventId: (values.eventId as string) || null,
            paymentMode: (values.paymentMode as string) || "cash",
            transactionRef: (values.transactionRef as string) || null,
            receiptNo: `${identity.receiptPrefix}-${new Date().getFullYear()}-${result.receiptId.slice(0, 8).toUpperCase()}`,
            smsSent: false,
            receivedBy: null,
            createdAt: new Date().toISOString(),
          });
        }
      } else if (result.claimCode) {
        open("showInviteCode", { code: result.claimCode, message: result.message });
      } else {
        close();
      }
    }
  };

  if (modal.type === "confirm") {
    const record = (modal.record || {}) as {
      title?: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
      tone?: "orange" | "rust" | "olive";
      onConfirm: () => void | Promise<void>;
    };
    return (
      <Modal title={record.title || t("Please confirm")} onClose={close}>
        <div className="confirm-modal-content" style={{ padding: "8px 0 16px" }}>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--ink-2)", margin: "8px 0 24px" }}>
            {record.message}
          </p>
          <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Button variant="secondary" onClick={close}>
              {record.cancelLabel || t("Cancel")}
            </Button>
            <Button
              variant={record.tone === "rust" ? "dark" : "primary"}
              onClick={async () => {
                close();
                await record.onConfirm();
              }}
            >
              {record.confirmLabel || t("Confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (modal.type === "showInviteCode") {
    const record = modal.record as { code: string; message?: string };
    const code = record?.code || "";
    return (
      <Modal title={t("Single-Use Member Invite Code")} subtitle={t("Hand over in person or via direct WhatsApp")} onClose={close}>
        <div className="invite-code-modal-content">
          <div className="invite-code-box">
            <span className="invite-code-eyebrow">{t("8-CHARACTER CROCKFORD BASE32 CODE")}</span>
            <div className="invite-code-digits">{code}</div>
            <span className="invite-code-validity">{t("Single-use · Expires in 14 days · Stored hashed")}</span>
          </div>

          <div className="invite-handover-card">
            <h4>{t("In-Person Handover Checklist:")}</h4>
            <ul>
              <li>{t("Give this code directly to the member in person or via verified WhatsApp.")}</li>
              <li>{tx("Member taps <strong>Member Login with Google</strong> on their device.")}</li>
              <li>{tx("They enter <strong>{code}</strong> to link their permanent Google ID.", { code })}</li>
              <li>{t("Once linked, this code permanently stops working. No recovery flow to attack!")}</li>
            </ul>
          </div>

          <div className="modal-actions">
            <Button
              icon={Copy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  notify(t("Code copied to clipboard!"));
                } catch {
                  notify(t("Please copy the code manually."));
                }
              }}
            >
              {t("Copy Code")}
            </Button>
            <Button variant="secondary" onClick={close}>{t("Done")}</Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (modal.type === "reviewApplications") {
    const apps = data.applications || [];
    const pending = apps.filter((a) => a.status === "pending");
    return (
      <Modal title={t("Pending Membership Applications")} subtitle={t("Review and approve public applicants")} onClose={close}>
        <div className="applications-modal-content">
          {pending.length === 0 ? (
            <p className="empty-text">{t("No pending membership applications at this time.")}</p>
          ) : (
            pending.map((app) => (
              <div key={app.id} className="application-item-card">
                <div className="app-item-top">
                  <div>
                    <strong>{app.fullName}</strong>
                    <span className="app-sub-meta">📱 +91 {app.phone} · 📧 {app.googleEmail}</span>
                  </div>
                  <Badge tone={app.isMinor ? "orange" : "blue"}>{app.isMinor ? t("Under 18 (Minor)") : t("18+ Adult")}</Badge>
                </div>
                {app.isMinor && app.guardianName && (
                  <div className="guardian-notice">
                    <span>{tx("Parent/Guardian: <strong>{guardianName}</strong> (DPDP Act Verified)", { guardianName: app.guardianName })}</span>
                  </div>
                )}
                <div className="app-reason-box">
                  <small>{t("STATEMENT OF INTEREST:")}</small>
                  <p>&ldquo;{app.reason}&rdquo;</p>
                </div>
                <div className="app-item-buttons">
                  <Button
                    onClick={async () => {
                      await perform("reviewApplication", { applicationId: app.id, status: "approved" });
                      notify(t("Enrolled {fullName} as unit member!", { fullName: app.fullName }));
                    }}
                  >
                    {t("Approve & Enroll")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await perform("reviewApplication", { applicationId: app.id, status: "rejected" });
                      notify(t("Declined application for {fullName}.", { fullName: app.fullName }));
                    }}
                  >
                    {t("Decline")}
                  </Button>
                </div>
              </div>
            ))
          )}
          <div className="modal-actions">
            <Button variant="secondary" onClick={close}>{t("Close")}</Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (modal.type === "idCard") {
    const raw = modal.record as Profile | { member: Profile; memberCode?: string };
    const member = raw && typeof raw === "object" && "member" in raw ? raw.member : (raw as Profile);
    const memberCode = raw && typeof raw === "object" && "memberCode" in raw && raw.memberCode ? raw.memberCode : `JPG-${String(Math.max(1, data.profiles.findIndex((p) => p.id === member.id) + 1)).padStart(3, "0")}`;
    return (
      <Modal title={t("Member Credential Card")} subtitle={t("Official Light of Science Digital ID Badge")} onClose={close}>
        <VirtualIdCard member={member} memberCode={memberCode} onClose={close} />
      </Modal>
    );
  }

  if (modal.type === "dues") return <DuesCollector data={data} record={modal.record as { memberId?: string; month?: number; year?: number } | undefined} save={save} {...formProps} />;

  if (modal.type === "duesDetail") {
    const payment = modal.record as DuesRecord;
    const member = data.profiles.find((p) => p.id === payment.memberId)!;
    const collector = data.profiles.find((p) => p.id === payment.collectedBy);
    const dateFormatted = fmtDateTime(payment.paidAt, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

    return (
      <Modal title={t("Treasury Receipt Audit Slip")} subtitle={t("{month} {year} · Member Contribution", { month: monthShort(payment.month - 1), year: payment.year })} onClose={close}>
        <div className="payment-detail print-tech-slip">
          <span className="print-mark print-mark-tl slip-mark" />
          <span className="print-mark print-mark-tr slip-mark" />
          <span className="print-mark print-mark-bl slip-mark" />
          <span className="print-mark print-mark-br slip-mark" />

          <div className="payment-brand-row">
            <span className="stamp-verified">{t("AUDITED ENTRY")}</span>
            <span className="mono text-[length:max(10px,var(--fs-floor,0px))] text-muted">{t(identity.unit)}</span>
          </div>

          <h3 className="mono">{money(payment.amount)}</h3>
          <p>{t("{month} {year} Membership Contribution", { month: monthShort(payment.month - 1), year: payment.year })}</p>

          <div className="receipt-details">
            <div><span>{t("Member Name")}</span><strong>{member.fullName}</strong></div>
            <div><span>{t("Pledge Rate")}</span><strong>{t("{amount} / month", { amount: money(member.monthlyPledge) })}</strong></div>
            <div><span>{t("Payment Mode")}</span><strong className="uppercase">{t(payment.paymentMode === "bank_transfer" ? "Bank Transfer" : payment.paymentMode)}</strong></div>
            <div><span>{t("Collector Stamp")}</span><strong>{collector?.fullName || t("Unit Executive")} ({collector?.role || t("Admin")})</strong></div>
            <div><span>{t("Logged In Ledger")}</span><strong className="mono">{dateFormatted}</strong></div>
            <div><span>{t("Unit Treasury")}</span><strong>{t(identity.fullName)}</strong></div>
          </div>

          <div className="soft-info mt-4">
            <ShieldCheck size={16} />
            <span>{t("This contribution is locked in the unit's persistent ledger. Minimum ₹20 baseline with voluntary higher pledges.")}</span>
          </div>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>{t("Close audit slip")}</Button>
        </div>
      </Modal>
    );
  }

  if (modal.type === "donation") {
    return (
      <Modal title={t("Record Public / Patron Donation")} subtitle={t("Enter contribution details and issue an official verifiable receipt slip.")} onClose={close}>
        <ActionForm action="addDonation" save={save} {...formProps} submit={t("Record & generate receipt")}>
          <FormField label={t("Donor, school, or organization name")} required>
            <input name="donorName" autoComplete="name" placeholder={t("e.g. Jalpaiguri Science Patron / Town High School")} maxLength={150} required />
          </FormField>
          <div className="form-columns">
            <FormField label={t("Contribution amount (INR)")} required>
              <div className="currency-input large-input">
                <span>₹</span>
                <input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" required />
              </div>
            </FormField>
            <FormField label={t("Payment instrument")} required>
              <select name="paymentMode">
                <option value="upi">{t("UPI instant transfer")}</option>
                <option value="cash">{t("Cash in hand")}</option>
                <option value="bank_transfer">{t("Bank Transfer / NEFT")}</option>
              </select>
            </FormField>
          </div>
          <FormField label={t("Donor mobile number (for SMS receipt gateway)")} hint={t("Optional. Format: +91 94340 XXXXX. Automated SMS alert dispatched upon entry.")}>
            <input type="tel" name="donorPhone" inputMode="tel" autoComplete="tel" placeholder="+91" maxLength={16} />
          </FormField>
          <FormField label={t("Allocated outreach purpose")}>
            <select name="eventId">
              <option value="">{t("General Science Outreach & Unit Fund")}</option>
              {data.events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t("Transaction / cheque reference")} hint={t("UPI Transaction ID, bank UTR, or physical receipt serial.")}>
            <input name="transactionRef" placeholder={t("e.g. UPI/2026/918237")} maxLength={100} />
          </FormField>
          <div className="soft-info">
            <ReceiptText size={17} />
            <span>{t("Digital slip is signed with the official society registration ({registrationNo}) and optimized for WhatsApp, Telegram & print.", { registrationNo: identity.registrationNo })}</span>
          </div>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "smsPreview") {
    return (
      <SmsPreviewModal
        donation={modal.record as Donation}
        close={close}
        notify={notify}
        save={save}
        busy={busy}
      />
    );
  }

  if (modal.type === "receipt") {
    return <ReceiptModal donation={modal.record as Donation} data={data} close={close} notify={notify} save={save} busy={busy} open={open} />;
  }

  if (modal.type === "member") {
    return (
      <Modal title={t("Enroll New Member")} subtitle={t("Add advocate or volunteer organizer to {fullName}", { fullName: t(identity.fullName) })} onClose={close}>
        <ActionForm action="addMember" save={save} {...formProps} submit={t("Enroll member")}>
          <FormField label={t("Full name")} required>
            <input name="fullName" autoComplete="name" placeholder={t("Member’s full legal name")} required maxLength={150} />
          </FormField>
          <FormField label={t("Mobile number (optional)")}>
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={t("10-digit mobile number")} maxLength={30} />
          </FormField>
          <div className="form-columns">
            <FormField label={t("Designated role")}>
              <select name="role">
                <option value="member">{t("General Member / Student")}</option>
                <option value="volunteer">{t("Active Volunteer")}</option>
                <option value="organizer">{t("Field Organizer")}</option>
                <option value="admin">{t("Unit Executive / Office-Bearer")}</option>
              </select>
            </FormField>
            <FormField label={t("Monthly contribution pledge")} hint={t("Strict baseline minimum: ₹20/month. No upper cap.")} required>
              <div className="currency-input">
                <span>₹</span>
                <input name="monthlyPledge" type="number" min="20" step="0.01" inputMode="numeric" defaultValue="20" required />
              </div>
            </FormField>
          </div>
          <div className="soft-info">
            <HeartHandshake size={17} />
            <span>{t("Members may contribute monthly or via multi-month advance lump-sums. 6 consecutive unpaid months flags Inactive on rosters.")}</span>
          </div>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "procurement") {
    const record = modal.record as { eventId?: string } | undefined;
    return (
      <Modal title={t("New Requisition Voucher")} subtitle={t("Post an item needed for an upcoming science programme")} onClose={close}>
        <ActionForm action="addProcurement" save={save} {...formProps} submit={t("Post requisition voucher")}>
          <FormField label={t("Associated science event")} required>
            <select name="eventId" defaultValue={record?.eventId || data.events[0]?.id || ""}>
              {data.events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
              {!data.events.length && (
                <option value="" disabled>{t("No events scheduled — create an event first")}</option>
              )}
            </select>
          </FormField>
          <FormField label={t("Item description")} required>
            <input name="itemName" placeholder={t("e.g. Potassium permanganate reagent & dropper bottles")} maxLength={150} required />
          </FormField>
          <div className="form-columns">
            <FormField label={t("Quantity required")} required>
              <input name="quantity" placeholder={t("e.g. 4 bottles / 500 leaflets")} required maxLength={80} />
            </FormField>
            <FormField label={t("Estimated reference cost")} required hint={t("Reference estimate only. Exact spend will be logged by buyer.")}>
              <div className="currency-input">
                <span>₹</span>
                <input name="estimatedCost" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" required />
              </div>
            </FormField>
          </div>
          <div className="soft-info">
            <Info size={17} />
            <span>{t("If the event is within 48 hours, an urgent field alert is broadcast immediately to all active cadre.")}</span>
          </div>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "purchase") {
    return (
      <PurchaseModal
        item={modal.record as Procurement}
        data={data}
        save={save}
        close={close}
        formProps={formProps}
      />
    );
  }

  if (modal.type === "verify") {
    const item = modal.record as Procurement;
    const own = item.purchasedBy === data.currentUserId;
    const buyer = data.profiles.find((p) => p.id === item.purchasedBy);

    return (
      <Modal title={t("Peer Physical Inspection & Verification")} subtitle={t("Dual-verification protocol: peer confirmation alone closes the voucher")} onClose={close}>
        <ActionForm action="verify" save={save} {...formProps} submit={t("Confirm peer verification & close voucher")} disabled={own || item.status !== "purchased"}>
          <input type="hidden" name="id" value={item.id} />
          <div className="item-detail-summary">
            <span className="stat-icon stat-icon-sage"><ShieldCheck size={22} /></span>
            <div>
              <h3>{item.itemName}</h3>
              <p>{t("{quantity} · Buyer:", { quantity: item.quantity })} <strong>{buyer?.fullName || t("Volunteer")}</strong></p>
            </div>
          </div>
          <div className="reference-line">
            <span>{t("Exact Out-of-Pocket Spend Recorded")}</span>
            <strong className="mono text-rust">{money(item.actualCost || 0)}</strong>
          </div>

          {item.receiptPhotoUrl && (
            <div className="bill-photo-inspection" style={{ margin: "14px 0", padding: "10px", background: "var(--paper-warm, #ece5d3)", borderRadius: "4px", border: "1px solid var(--rule-soft, #d5cbba)" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", display: "block", marginBottom: "6px", color: "var(--ink-2)" }}>{t("Attached Cash Memo / Paper Receipt:")}</span>
              <a href={item.receiptPhotoUrl} target="_blank" rel="noreferrer" title={t("Click to view full receipt")}>
                <img src={item.receiptPhotoUrl} alt={t("Cash memo photo")} style={{ maxHeight: "110px", borderRadius: "3px", objectFit: "contain", border: "1px solid #d0c8b6" }} />
              </a>
            </div>
          )}

          {own ? (
            <div className="form-warning">
              <ShieldAlert size={22} />
              <div>
                <strong>{t("Anti-Collusion Enforcement: Self-verification blocked.")}</strong>
                <p>
                  {tx("Database constraint <code>CHECK (verified_by != purchased_by)</code> is strictly enforced. You logged this purchase, so another active volunteer must physically inspect it at the venue.")}
                </p>
              </div>
            </div>
          ) : item.status !== "purchased" ? (
            <div className="form-warning">{t("Only purchased items can be verified by a peer.")}</div>
          ) : (
            <>
              <label className="confirmation-check">
                <input type="checkbox" required />
                <span>
                  {t("I have physically examined this item at the venue, checked its quantity, condition, and confirm it is ready for the programme.")}
                </span>
              </label>
              <div className="soft-info">
                <CircleCheck size={17} />
                <span>{t("Verification finality: peer confirmation marks the voucher complete and closed. No multi-level approval bottleneck required.")}</span>
              </div>
            </>
          )}
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "createEvent") {
    return (
      <Modal title={t("Schedule Unit Programme / Convention")} subtitle={t("Publish field activity, school camp, or public convention to calendar")} onClose={close}>
        <ActionForm action="createEvent" save={save} {...formProps} submit={t("Publish to unit calendar")}>
          <FormField label={t("Programme title")} required>
            <input name="title" placeholder={t("e.g. Anti-Superstition Demonstration Camp")} maxLength={150} required />
          </FormField>
          <div className="form-columns">
            <FormField label={t("Date & start time")} required>
              <input name="startsAt" type="datetime-local" required />
            </FormField>
            <FormField label={t("Programme category")}>
              <select name="category">
                <option value="Outreach">{t("Outreach")}</option>
                <option value="Unit meeting">{t("Unit meeting")}</option>
                <option value="Campaign">{t("Campaign")}</option>
                <option value="Workshop">{t("Workshop")}</option>
                <option value="Convention">{t("Convention")}</option>
              </select>
            </FormField>
          </div>
          <FormField label={t("Venue / field location")} required>
            <input name="location" placeholder={t("e.g. Jalpaiguri Town Club Ground")} maxLength={200} required />
          </FormField>
          <FormField label={t("Programme agenda & briefing for cadre")} required>
            <textarea name="description" placeholder={t("Briefing notes, objectives, volunteer arrival time...")} rows={4} maxLength={4000} required />
          </FormField>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "event") {
    return (
      <EventDetailModal
        event={modal.record as UnitEvent}
        data={data}
        close={close}
        open={open}
        notify={notify}
        navigate={navigate}
      />
    );
  }
  if (modal.type === "publishCircular") {
    return (
      <Modal title={t("Publish Digital Circular")} subtitle={t("Issue official unit notice, meeting agenda, or urgent campaign circular")} onClose={close}>
        <ActionForm action="publishCircular" save={save} {...formProps} submit={t("Publish circular")}>
          <FormField label={t("Circular title")} required>
            <input name="title" placeholder={t("e.g. Call for Volunteers: World Environment Day Rally")} maxLength={150} required />
          </FormField>
          <FormField label={t("Classification")}>
            <select name="category">
              <option value="Unit circular">{t("Unit circular")}</option>
              <option value="Meeting agenda">{t("Meeting agenda")}</option>
              <option value="Resource update">{t("Resource update")}</option>
              <option value="Urgent update">{t("Urgent update")}</option>
            </select>
          </FormField>
          <FormField label={t("Circular text")} required>
            <textarea name="content" rows={7} placeholder={t("Text of the resolution or notice...")} maxLength={10000} required />
          </FormField>
          <label className="confirmation-check">
            <input name="pinned" type="checkbox" />
            <span>{t("Pin this circular to the top of the unit notice board.")}</span>
          </label>
        </ActionForm>
      </Modal>
    );
  }

  if (modal.type === "circular") {
    const notice = modal.record as Circular;
    const author = data.profiles.find((p) => p.id === notice.authorId);

    return (
      <Modal title={notice.title} subtitle={t("{category} · Official Circular", { category: t(notice.category) })} onClose={close} wide>
        <article className="circular-reader print-tech-slip">
          {author && (
            <div className="reader-byline">
              <Avatar person={author} size="small" />
              <span>
                {author.fullName} ({roleName(author.role)})
                <small>{fmtDate(notice.createdAt, { day: "numeric", month: "long", year: "numeric" })}</small>
              </span>
              {notice.pinned && <span className="stamp-verified stamp-needed">{t("PINNED")}</span>}
            </div>
          )}
          <div className="reader-content">{notice.content}</div>
          {isMashkalaibari(notice.title) && (
            <div className="field-photo-gallery my-5 pt-4 border-t border-[#d5cbba]">
              <div className="flex items-center justify-between mb-2">
                <span className="mono text-xs font-bold text-rust uppercase tracking-wider">
                  {t("On-Site Photographic Evidence (03/11/2026)")}
                </span>
                <span className="text-[11px] text-ink-faint">{t("6 Photographic Records")}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const p = MASHKALAIBARI_PHOTOS[n - 1];
                  return (
                    <a
                      key={n}
                      href={`/images/field-reports/mashkalaibari/inspection-${n}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded border border-rule-soft overflow-hidden bg-ink-2 relative group aspect-[4/3]"
                      title={p ? `${t("FIG 0{n}", { n })}: ${t(p.caption)}` : t("Inspection Photo {n}", { n })}
                    >
                      <img
                        src={`/images/field-reports/mashkalaibari/inspection-${n}.jpg`}
                        alt={p ? t(p.caption) : t("Mashkalaibari Crematorium Inspection Photo {n}", { n })}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/75 text-paper-card text-[9px] px-1.5 py-0.5 rounded mono">
                        {t("FIG. 0{n}", { n })}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {isEnvironmentDayText(notice.title) && (
            <div className="field-photo-gallery my-5 pt-4 border-t border-[#d5cbba]">
              <div className="flex items-center justify-between mb-2">
                <span className="mono text-xs font-bold text-rust uppercase tracking-wider">
                  {t("World Environment Day Rally Records (05/06/2026)")}
                </span>
                <span className="text-[11px] text-ink-faint">{t("6 Photographic Records")}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ENVIRONMENT_DAY_PHOTOS.map((p, idx) => (
                  <a
                    key={p.src}
                    href={p.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded border border-rule-soft overflow-hidden bg-ink-2 relative group aspect-[4/3]"
                    title={`${t("FIG 0{n}", { n: idx + 1 })}: ${t(p.caption)}`}
                  >
                    <img
                      src={p.src}
                      alt={t(p.caption)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/75 text-paper-card text-[9px] px-1.5 py-0.5 rounded mono">
                      {t("FIG. 0{n}", { n: idx + 1 })}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {isDhimanSessionText(notice.title) && (
            <div className="field-photo-gallery my-5 pt-4 border-t border-[#d5cbba]">
              <div className="flex items-center justify-between mb-2">
                <span className="mono text-xs font-bold text-rust uppercase tracking-wider">
                  {t("Club Room Deliberation Records (01/05/2026)")}
                </span>
                <span className="text-[11px] text-ink-faint">{t("2 Photographic Records")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DHIMAN_SESSION_PHOTOS.map((p, idx) => (
                  <a
                    key={p.src}
                    href={p.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded border border-rule-soft overflow-hidden bg-ink-2 relative group aspect-[4/3]"
                    title={`${t("FIG 0{n}", { n: idx + 1 })}: ${t(p.caption)}`}
                  >
                    <img
                      src={p.src}
                      alt={t(p.caption)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/75 text-paper-card text-[9px] px-1.5 py-0.5 rounded mono">
                      {t("FIG. 0{n}", { n: idx + 1 })}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {isPrafullaRayText(notice.title) && (
            <div className="field-photo-gallery my-5 pt-4 border-t border-[#d5cbba]">
              <div className="flex items-center justify-between mb-2">
                <span className="mono text-xs font-bold text-rust uppercase tracking-wider">
                  {t("Acharya P. C. Ray Observance & Relief Records (02/08/2024)")}
                </span>
                <span className="text-[11px] text-ink-faint">{t("3 Photographic Records")}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRAFULLA_RAY_PHOTOS.map((p, idx) => (
                  <a
                    key={p.src}
                    href={p.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded border border-rule-soft overflow-hidden bg-ink-2 relative group aspect-[4/3]"
                    title={`${t("FIG 0{n}", { n: idx + 1 })}: ${t(p.caption)}`}
                  >
                    <img
                      src={p.src}
                      alt={t(p.caption)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/75 text-paper-card text-[9px] px-1.5 py-0.5 rounded mono">
                      {t("FIG. 0{n}", { n: idx + 1 })}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="reader-signoff">
            {tx("In the cause of scientific temper and humanism,<br/><strong>{name}<br/>{organisation} · {unit}</strong>", { name: t(identity.name), organisation: t(identity.organisation), unit: t(identity.unit) })}
          </div>
        </article>
        <div className="modal-actions">
          <button className="button button-secondary button-whatsapp" onClick={() => shareViaWhatsApp(formatCircularBroadcast(notice))}>
            <MessageCircle size={15} />
            {t("Share to WhatsApp Group")}
          </button>
          <Button variant="secondary" onClick={close}>{t("Back to board")}</Button>
        </div>
      </Modal>
    );
  }

  if (modal.type === "resource") {
    const r = modal.record as Resource;

    return (
      <Modal title={r.title} subtitle={`${t(r.kind)} · ${t(r.category)}`} onClose={close} wide>
        {r.image ? (
          <div className="poster-view">
            <img src={r.image} alt={t("Official Breakthrough Science Society Conference Poster")} />
            <p>{t("Original Poster Archive · Breakthrough Science Society")}</p>
          </div>
        ) : (
          <article className="resource-reader">
            {r.keyQuestion && (
              <div className="resource-key-question">
                <strong>{t("CORE SCIENTIFIC QUESTION:")}</strong>
                <p>{r.keyQuestion}</p>
              </div>
            )}

            {r.materials && r.materials.length > 0 && (
              <div className="resource-materials-box">
                <h4>{t("REAGENTS & MATERIALS CHECKLIST")}</h4>
                <ul>
                  {r.materials.map((m, idx) => (
                    <li key={idx}>
                      <span className="mono">✓</span> {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {r.safetyNotes && r.safetyNotes.length > 0 && (
              <div className="resource-safety-box">
                <h4><ShieldAlert size={15} /> {t("MANDATORY FIELD SAFETY PROTOCOLS")}</h4>
                <ul>
                  {r.safetyNotes.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="resource-body-text">
              {r.content?.split("\n\n").map((para, i) =>
                i === 0 ? <h3 key={i}>{para}</h3> : <p key={i}>{para}</p>
              )}
            </div>
          </article>
        )}

        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>{t("Close")}</Button>
          {r.content ? (
            <Button icon={Download} onClick={() => { downloadText(`${identity.filePrefix}-${r.id}-protocol.txt`, r.content!); notify(t("Field protocol downloaded.")); }}>
              {t("Download protocol")}
            </Button>
          ) : (
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="button button-primary"
              {...(r.image ? { download: "BSS-Conference-Poster.jpg" } : {})}
            >
              {r.image ? <Download size={15} /> : <ExternalLink size={15} />}
              {r.image ? t("Download high-res poster") : t("Visit official portal")}
            </a>
          )}
        </div>
      </Modal>
    );
  }

  if (modal.type === "help") {
    return (
      <Modal title={t("Platform Architecture & Field Workflows")} subtitle={t("Light of Science · Breakthrough Science Society, Jalpaiguri Unit")} onClose={close} wide>
        <div className="help-content">
          {[
            [t("Module A: Membership Dues & Treasury Ledger"), t("Baseline minimum of ₹20/month with no upper cap. Advance lump-sum allocations automatically distribute across consecutive upcoming unpaid months. Members with 6+ consecutive unpaid months are flagged as Inactive / Dues Pending on rosters.")],
            [t("Module B: Donation Register & Extensible Receipts"), t("External patron contributions generate signed digital slips carrying the official society registration (S/86180 of 1996-97), unit seal, and authorized treasurer signature. Universal sharing is formatted for WhatsApp, Telegram, or A4 PDF print. Carrier SMS notification tracking is integrated.")],
            [t("Module C: Real-Time Event Procurement & Dual Verification"), t("3-stage lifecycle: needed → purchased → verified. Buyers log exact out-of-pocket spend without pre-approval caps. Dual verification rule (CHECK verified_by != purchased_by) prevents self-verification. Peer physical inspection closes the item.")],
            [t("Module D: Real-Time Notifications & Broadcasts"), t("Triggers include urgent procurements within 48 hours, peer verification confirmations to buyers, dues receipts, and high-priority broadcast circulars. Web Push API is integrated with service worker background delivery.")],
            [t("Module E: Science Outreach & Miracle-Busting Lab"), t("Interactive repertoire of anti-superstition chemical demonstrations (spontaneous combustion, bleeding lemon, thermal conductivity of fire-walking, lever-arm rod bending) plus legislative policy drafts and astronomy manuals.")],
          ].map(([title, desc], i) => (
            <details key={title} open={i === 0}>
              <summary>{title}<span className="help-plus">+</span></summary>
              <p>{desc}</p>
            </details>
          ))}
          <div className="soft-info mt-3">
            <Info size={17} />
            <span>{t("Light of Science, Jalpaiguri Unit, West Bengal. Registered under West Bengal Societies Registration Act, 1961.")}</span>
          </div>
        </div>
      </Modal>
    );
  }

  return null;
}

function ActionForm({ action, save, children, busy, error, close, submit, disabled = false }: { action: string; save: (action: string, values: Record<string, unknown>) => Promise<void>; children: ReactNode; busy: boolean; error: string; close: () => void; submit: string; disabled?: boolean }) {
  const { t } = useI18n();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values: Record<string, unknown> = Object.fromEntries(new FormData(e.currentTarget));
    if (action === "createEvent" && values.startsAt) values.startsAt = new Date(String(values.startsAt)).toISOString();
    void save(action, values);
  };
  return (
    <form onSubmit={onSubmit}>
      <div className="form-body">
        {children}
        {error && <div className="form-error" role="alert">{error}</div>}
      </div>
      <div className="modal-actions">
        <Button variant="secondary" onClick={close} disabled={busy}>{t("Cancel")}</Button>
        {disabled ? <Button disabled>{submit}</Button> : <SubmitButton busy={busy}>{submit}</SubmitButton>}
      </div>
    </form>
  );
}

function DuesCollector({ data, record, save, busy, error, close }: { data: WorkspaceData; record?: { memberId?: string; month?: number; year?: number }; save: (action: string, values: Record<string, unknown>) => Promise<void>; busy: boolean; error: string; close: () => void }) {
  const { t, tx, num, money, monthShort, roleName } = useI18n();
  const now = new Date();
  const [memberId, setMemberId] = useState(record?.memberId || data.profiles[0]?.id || "");
  const selected = data.profiles.find((p) => p.id === memberId) || data.profiles[0];
  const [amount, setAmount] = useState(String(selected?.monthlyPledge || 50));
  const [monthly, setMonthly] = useState(String(selected?.monthlyPledge || 50));
  const [month, setMonth] = useState(record?.month || now.getMonth() + 1);
  const [year, setYear] = useState(record?.year || now.getFullYear());

  const allocations: { month: number; year: number; amount: number }[] = [];
  let remaining = Number(amount), m = month, y = year, guard = 0;
  if (Number(monthly) >= 20 && remaining >= 20 && year >= 2024) {
    const paid = new Set(data.dues.filter((d) => d.memberId === memberId).map((d) => `${d.year}-${d.month}`));
    while (remaining >= 19.999 && guard < 1200) {
      guard++;
      if (!paid.has(`${y}-${m}`)) {
        let value = Math.min(Number(monthly), remaining);
        if (remaining - value > 0 && remaining - value < 20) value = remaining;
        allocations.push({ month: m, year: y, amount: value });
        remaining = Math.round((remaining - value) * 100) / 100;
      }
      m = m === 12 ? 1 : m + 1;
      if (m === 1) y++;
    }
  }

  const collector = data.profiles.find((p) => p.id === data.currentUserId);

  return (
    <Modal title={t("Meeting Quick-Collector")} subtitle={t("Record dues during unit meeting with automatic multi-month allocation")} onClose={close}>
      <ActionForm action="collectDues" save={save} busy={busy} error={error} close={close} submit={t("Record & map to ledger")}>
        <FormField label={t("Member name")} required>
          <select
            name="memberId"
            value={memberId}
            onChange={(e) => {
              const p = data.profiles.find((pr) => pr.id === e.target.value)!;
              setMemberId(p.id);
              setMonthly(String(p.monthlyPledge));
              setAmount(String(p.monthlyPledge));
            }}
          >
            {data.profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {t("{name} ({role}) — Pledge: ₹{pledge}/mo", { name: p.fullName, role: roleName(p.role), pledge: p.monthlyPledge })}
              </option>
            ))}
          </select>
        </FormField>

        <div className="form-columns">
          <FormField label={t("Total received (lump-sum allowed)")} required>
            <div className="currency-input large-input">
              <span>₹</span>
              <input type="number" name="amount" value={amount} min="20" step="0.01" inputMode="decimal" onChange={(e) => setAmount(e.target.value)} required />
            </div>
          </FormField>
          <FormField label={t("Monthly dues rate")} required hint={t("Strict baseline: min ₹20. Custom higher recurring pledge allowed.")}>
            <div className="currency-input large-input">
              <span>₹</span>
              <input type="number" name="monthlyAmount" value={monthly} min="20" step="0.01" inputMode="decimal" onChange={(e) => setMonthly(e.target.value)} required />
            </div>
          </FormField>
        </div>

        <div className="form-columns three-columns">
          <FormField label={t("Start month")}>
            <select name="month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {months.map((mon, i) => (
                <option value={i + 1} key={mon}>{monthShort(i)}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t("Ledger year")}>
            <input name="year" type="number" min="2024" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
          </FormField>
          <FormField label={t("Payment mode")}>
            <select name="paymentMode">
              <option value="cash">{t("Cash in meeting")}</option>
              <option value="upi">{t("UPI transfer")}</option>
              <option value="bank_transfer">{t("Bank transfer")}</option>
            </select>
          </FormField>
        </div>

        <div className="allocation-preview">
          <div>
            <span><Wallet size={15} />{t("ADVANCE MULTI-MONTH ALLOCATION")}</span>
            <strong>{t(allocations.length === 1 ? "{count} month mapped" : "{count} months mapped", { count: allocations.length })}</strong>
          </div>
          {allocations.length ? (
            <>
              <div className="allocation-months">
                {allocations.slice(0, 8).map((a) => (
                  <span key={`${a.year}-${a.month}`}>
                    <small>{monthShort(a.month - 1)} {num(a.year)}</small>
                    <strong>{money(a.amount)}</strong>
                    <Check size={11} />
                  </span>
                ))}
                {allocations.length > 8 && <span className="allocation-more">{t("+{count} more", { count: allocations.length - 8 })}</span>}
              </div>
              <p>{t("Consecutive upcoming months are automatically occupied on the ledger matrix, skipping any previously settled months.")}</p>
            </>
          ) : (
            <p>{t("Enter at least ₹20 to preview how this payment distributes across consecutive months.")}</p>
          )}
        </div>

        <p className="collector-stamp">
          <ShieldCheck size={14} />
          {tx("Collector attribution stamp: <strong>{fullName}</strong> ({role})", { fullName: collector?.fullName, role: collector?.role })}
        </p>
      </ActionForm>
    </Modal>
  );
}

function ReceiptModal({
  donation,
  data,
  close,
  notify,
  save,
  busy,
  open,
}: {
  donation: Donation;
  data: WorkspaceData;
  close: () => void;
  notify: (message: string) => void;
  save: (action: string, values: Record<string, unknown>) => Promise<void>;
  busy: boolean;
  open: OpenModal;
}) {
  const { t, tx, money, fmtDate, locale } = useI18n();
  if (!donation) return null;
  // A link shared from a Bengali session opens the receipt in Bengali for whoever receives it.
  const receiptUrl = () => `${typeof window !== "undefined" ? window.location.origin : ""}/receipts/${donation.id}${locale === "bn" ? "?lang=bn" : ""}`;

  const shareText = () =>
    t("Light of Science (Breakthrough Science Society, Jalpaiguri Unit)\nDonation Acknowledgement\nDonor: {donor}\nAmount: {amount}\nReceipt No: {receipt}\nVerification slip: {url}\nScience for Man. Science for Society. Science in Thinking.", { donor: donation.donorName, amount: money(donation.amount), receipt: donation.receiptNo, url: receiptUrl() });

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: t("{name} · donation receipt", { name: t(identity.name) }),
          text: shareText(),
          url: receiptUrl(),
        });
      } else {
        await navigator.clipboard.writeText(receiptUrl());
        notify(t("Receipt link copied. Ready for WhatsApp, Telegram, or email."));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") notify(t("Open the receipt below to share its link from your browser."));
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(shareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const shareTelegram = () => {
    const url = encodeURIComponent(receiptUrl());
    const text = encodeURIComponent(shareText());
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
  };

  const collector = data.profiles.find((p) => p.id === donation.receivedBy);
  const dateFormatted = fmtDate(donation.createdAt, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Modal title={t("Official Donation Digital Slip")} subtitle={t("Multi-channel receipt with official society registration & unit seal")} onClose={close}>
      <div className="receipt-slip-wrap">
        <div className="receipt-slip print-tech-slip">
          <span className="print-mark print-mark-tl slip-mark" />
          <span className="print-mark print-mark-tr slip-mark" />
          <span className="print-mark print-mark-bl slip-mark" />
          <span className="print-mark print-mark-br slip-mark" />

          {/* Letterhead */}
          <div className="receipt-brand">
            <img src="/images/bss-logo.svg" alt={t("BSS emblem")} />
            <div>
              <strong>{t(identity.name)}</strong>
              <span>{t(identity.organisation)}</span>
              <span>{t(identity.unit)} · {t(identity.state)}</span>
              <small className="mono text-[length:max(8.5px,var(--fs-floor,0px))] text-muted block mt-0.5">{t("Regd. No. {registrationNo}", { registrationNo: identity.registrationNo })}</small>
            </div>
          </div>

          <div className="receipt-slip-title">
            <span>{t("OFFICIAL DONATION ACKNOWLEDGEMENT")}</span>
            <span className="stamp-verified">{t("RECORDED")}</span>
          </div>

          <div className="receipt-amount-row my-2">
            <div>
              <span className="mono text-[length:max(8px,var(--fs-floor,0px))] text-muted block">{t("CONTRIBUTION AMOUNT")}</span>
              <div className="receipt-amount mono">{money(donation.amount)}</div>
            </div>
            <UnitOfficialSeal size={84} />
          </div>

          <p className="receipt-thanks">
            {tx("Received with thanks from <strong>{donorName}</strong> for grassroots science advocacy.", { donorName: donation.donorName })}
          </p>

          <div className="receipt-details">
            <div><span>{t("Receipt Serial")}</span><strong className="mono text-rust">{donation.receiptNo}</strong></div>
            <div><span>{t("Date Issued")}</span><strong>{dateFormatted}</strong></div>
            <div><span>{t("Payment Mode")}</span><strong className="uppercase">{t(donation.paymentMode === "bank_transfer" ? "Bank Transfer" : donation.paymentMode)}</strong></div>
            <div><span>{t("Supporting Event")}</span><strong>{data.events.find((e) => e.id === donation.eventId)?.title || t("General Science Fund")}</strong></div>
            <div><span>{t("Authorized Receiver")}</span><strong>{collector?.fullName || t("Unit Treasurer")}</strong></div>
          </div>

          <div className="my-2 border-t border-dashed border-rule-soft pt-2">
            <TreasurerSignatureBlock officerName={collector?.fullName || t("Arunabha Ghosh")} date={dateFormatted} />
          </div>

          <div className="receipt-bottom">
            <HeartHandshake size={18} />
            <span>{t("Science for Man. Science for Society. Science in Thinking.")}</span>
          </div>

          <div className="receipt-carbon">
            {t("{unit} · {organisation} — ARCHIVE COPY", { unit: t(identity.unit), organisation: t(identity.organisation) })}
          </div>
        </div>
      </div>

      {/* Sharing and SMS Channel Action Bar */}
      <div className="receipt-sharing">
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(receiptUrl());
              notify(t("Receipt link copied."));
            } catch {
              notify(t("Copy URL from browser address bar."));
            }
          }}
        >
          <Copy size={15} />{t("Copy link")}
        </button>

        <button onClick={shareWhatsApp} className="text-[#25D366]">
          <MessageCircle size={15} />{t("WhatsApp")}
        </button>

        <button onClick={shareTelegram} className="text-[#0088cc]">
          <Send size={15} />{t("Telegram")}
        </button>

        <button onClick={() => open("smsPreview", donation)}>
          <MessageSquare size={15} />{t("SMS Gateway")}
        </button>

        <a href={`/receipts/${donation.id}?print=1${locale === "bn" ? "&lang=bn" : ""}`} target="_blank" rel="noreferrer">
          <Printer size={15} />{t("Print A4")}
        </a>
      </div>

      <div className="modal-actions">
        <Button variant="secondary" onClick={close}>{t("Done")}</Button>
        <Button icon={ArrowUpRight} onClick={() => void share()}>{t("Share digital slip")}</Button>
      </div>
    </Modal>
  );
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadCalendar(event: UnitEvent) {
  const escape = (v: string) => v.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;").replaceAll("\r", "");
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + 2 * 3600000);
  downloadText(
    `${identity.filePrefix}-event.ics`,
    `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Light of Science//BSS Jalpaiguri Unit//EN\r\nBEGIN:VEVENT\r\nUID:${event.id}@light-of-science-workspace\r\nDTSTAMP:${stamp(new Date())}\r\nDTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:${escape(event.title)}\r\nLOCATION:${escape(event.location)}\r\nDESCRIPTION:${escape(event.description)}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`,
    "text/calendar;charset=utf-8"
  );
}
