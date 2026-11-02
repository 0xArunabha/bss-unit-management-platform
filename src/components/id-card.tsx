"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { identity } from "@/lib/identity";
import { type Profile, money } from "@/lib/types";
import { getMemberDesignations } from "@/lib/teams";
import { Avatar } from "@/components/ui";
import { UnitOfficialSeal } from "@/components/unit-seal";
import { shareViaWhatsApp, copyBroadcastText } from "@/lib/whatsapp";
import { useI18n } from "@/lib/i18n";
import {
  Check,
  Copy,
  MessageCircle,
  Printer,
  RefreshCw,
  ShieldCheck,
  MapPin,
  Phone,
  CalendarDays,
} from "lucide-react";

interface IdCardProps {
  member: Profile;
  memberCode?: string;
  onClose?: () => void;
}

/* Tiny SVG guilloche pattern for security background */
function GuillochePattern() {
  return (
    <svg
      className="id-card-guilloche"
      viewBox="0 0 440 270"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="guilloche-dots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="currentColor" opacity="0.08" />
        </pattern>
        <linearGradient id="card-accent-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b83d16" stopOpacity="0.06" />
          <stop offset="50%" stopColor="#4d6632" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#b83d16" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect width="440" height="270" fill="url(#guilloche-dots)" />
      <rect width="440" height="270" fill="url(#card-accent-gradient)" />
      {[120, 145, 170, 195, 220].map((r, i) => (
        <circle key={i} cx="420" cy="-20" r={r} stroke="currentColor" strokeWidth="0.5" opacity={0.04 + i * 0.01} />
      ))}
      {[80, 105, 130, 155].map((r, i) => (
        <circle key={`bl${i}`} cx="20" cy="290" r={r} stroke="currentColor" strokeWidth="0.5" opacity={0.03 + i * 0.01} />
      ))}
    </svg>
  );
}

/* Large branded QR with Bengali mark overlaid in center */
function BrandedQR({
  member,
  memberCode,
  designation,
}: {
  member: Profile;
  memberCode: string;
  designation: string;
}) {
  const [svgMarkup, setSvgMarkup] = useState<string>("");

  const payload = [
    `BSS MEMBER CREDENTIAL`,
    `${member.fullName}`,
    `ID: ${memberCode}`,
    `Role: ${member.role.toUpperCase()}`,
    `${designation}`,
    `Reg: ${identity.registrationNo}`,
    `Unit: ${identity.city}`,
    member.phone ? `Ph: +91 ${member.phone}` : ``,
    `Session: 2026-27`,
    `${identity.unitContact}`,
  ]
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    let active = true;
    QRCode.toString(
      payload,
      {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "H", // High — allows 30% logo overlay
        color: {
          dark: "#11170d",
          light: "#ffffff00",
        },
      },
      (err, svg) => {
        if (!err && svg && active) {
          setSvgMarkup(svg);
        }
      }
    );
    return () => { active = false; };
  }, [payload]);

  return (
    <div className="branded-qr-wrap">
      <div className="branded-qr-frame">
        {svgMarkup ? (
          <div
            className="branded-qr-svg"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : (
          <div className="branded-qr-loading" />
        )}
        {/* Bengali mark overlay — sits in the center "quiet zone" */}
        <div className="branded-qr-center-mark">
          <span>{identity.bengali}</span>
        </div>
      </div>
      <div className="branded-qr-caption">
        <span className="branded-qr-scan-label mono">SCAN WITH PHONE CAMERA TO VERIFY CREDENTIAL</span>
        <span className="branded-qr-id mono">{identity.receiptPrefix}-{memberCode}</span>
      </div>
    </div>
  );
}

export function VirtualIdCard({ member, memberCode = "JPG-001", onClose }: IdCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const { locale, t } = useI18n();
  const designations = getMemberDesignations(member.fullName);
  const joinDate = new Date(member.createdAt);
  const validThrough = "March 2027";
  const designationText = locale === "bn" ? designations.primaryTitleBn : designations.primaryTitleEn;

  const getShareText = () => {
    return `🪪 *LIGHT OF SCIENCE — OFFICIAL MEMBER CREDENTIAL*
Breakthrough Science Society · Jalpaiguri Unit

👤 *Member:* ${member.fullName}
🆔 *ID Code:* ${memberCode}
🎖️ *Role:* ${member.role.toUpperCase()}
⭐ *Designation:* ${designationText}
🏛️ *Reg No:* ${identity.registrationNo}
✊ *Motto:* ${identity.bengaliMotto}
📍 *Unit:* ${identity.city}, ${identity.state}`;
  };

  const handleShare = () => {
    shareViaWhatsApp(getShareText());
  };

  const handleCopy = async () => {
    const success = await copyBroadcastText(getShareText());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="id-card-modal-content">
      <div className="id-card-perspective-wrapper">
        <div className={`id-card-container ${flipped ? "id-card-is-flipped" : ""}`}>

          {/* ===================== FRONT SIDE ===================== */}
          <div className="id-card-face id-card-front print-tech-slip">
            <GuillochePattern />
            <div className="id-card-lanyard-slot" />
            <div className="id-card-accent-stripe" />

            {/* Header */}
            <div className="id-card-header">
              <div className="id-card-brand">
                <img src="/images/bss-logo.svg" alt="BSS Logo" className="id-card-logo" />
                <div>
                  <h3 className="id-card-society-title">{identity.organisation}</h3>
                  <h2 className="id-card-unit-title">{identity.name} · {identity.city}</h2>
                </div>
              </div>
              <div className="id-card-header-right">
                <span className="id-card-credential-label">MEMBER CREDENTIAL</span>
                <span className="id-card-reg-pill mono">REG {identity.registrationNo.split(" ")[0]}</span>
              </div>
            </div>

            {/* Card Body — 2 columns: avatar + info (QR moved to back) */}
            <div className="id-card-body">
              <div className="id-card-photo-column">
                <div className="id-card-avatar-ring">
                  <Avatar person={member} size="large" />
                </div>
                <div className="id-card-badge-token">
                  <ShieldCheck size={10} strokeWidth={2.5} />
                  <span>VERIFIED</span>
                </div>
              </div>

              <div className="id-card-info">
                <div className="id-card-code-row">
                  <span className="id-card-code mono">{memberCode}</span>
                  <span className={`id-card-role-tag role-${member.role}`}>
                    {member.role.toUpperCase()}
                  </span>
                </div>

                <h1 className="id-card-name">{member.fullName}</h1>
                <p className="id-card-designation">{designationText}</p>

                {designations.teams.length > 0 && (
                  <div className="id-card-team-pills">
                    {designations.teams.slice(0, 3).map((team) => (
                      <span key={team} className="id-card-team-pill">
                        {team}
                      </span>
                    ))}
                  </div>
                )}

                <div className="id-card-meta-grid">
                  {member.phone && (
                    <span><Phone size={9} strokeWidth={2} /> +91 {member.phone}</span>
                  )}
                  <span><CalendarDays size={9} strokeWidth={2} /> Joined {joinDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                  <span><MapPin size={9} strokeWidth={2} /> {identity.city}, {identity.state}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="id-card-footer">
              <div className="id-card-footer-left">
                <div className="id-card-barcode-sim">
                  {[1,3,2,4,1,2,3,1,4,2,3,1,2,4,1,3,2,1,2,3].map((w, i) => (
                    <span key={i} className={`barcode-line w-${w}`} />
                  ))}
                </div>
                <span className="mono id-card-session">SESSION 2026–27 · VALID THROUGH {validThrough.toUpperCase()}</span>
              </div>
              <span className="id-card-flip-prompt" onClick={() => setFlipped(!flipped)}>
                <RefreshCw size={10} />
                Flip to scan QR
              </span>
            </div>
          </div>

          {/* ===================== BACK SIDE ===================== */}
          <div className="id-card-face id-card-back print-tech-slip">
            <GuillochePattern />
            <div className="id-card-lanyard-slot" />
            <div className="id-card-accent-stripe id-card-accent-stripe-back" />

            {/* Back: 2-column layout — QR hero left, details + seal right */}
            <div className="id-card-back-body">
              {/* Left: Big branded QR */}
              <BrandedQR
                member={member}
                memberCode={memberCode}
                designation={designationText}
              />

              {/* Right: Details + Seal + Signature */}
              <div className="id-card-back-right">
                {/* Motto */}
                <div className="id-card-back-motto">
                  <p className="id-card-back-motto-bn">"{identity.bengaliMotto}"</p>
                  <p className="id-card-back-motto-en">"{identity.motto}"</p>
                </div>

                {/* Compact detail rows */}
                <div className="id-card-back-details">
                  <div className="id-card-back-row">
                    <span>HQ</span>
                    <strong>{identity.headquarters}</strong>
                  </div>
                  <div className="id-card-back-row">
                    <span>Pledge</span>
                    <strong>{money(member.monthlyPledge)}/mo</strong>
                  </div>
                  <div className="id-card-back-row">
                    <span>Valid</span>
                    <strong>Through {validThrough}</strong>
                  </div>
                </div>

                {/* Seal + Signature compact */}
                <div className="id-card-back-seal-row">
                  <div className="id-card-seal-graphic">
                    <UnitOfficialSeal size={42} />
                  </div>
                  <div className="id-card-signatory">
                    <div className="id-card-sign-line" />
                    <strong>Pritam Sarkar</strong>
                    <small>Secretary · Signatory</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Notice footer */}
            <div className="id-card-back-notice">
              This card certifies membership of {identity.name}, {identity.organisation} (WB Reg. {identity.registrationNo}).
              If found, return to unit office or email {identity.unitContact}.
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="id-card-actions">
        <button className="id-action-btn" onClick={() => setFlipped(!flipped)}>
          <RefreshCw size={14} />
          {flipped ? "Show Front" : "Flip Card"}
        </button>

        <button className="id-action-btn id-action-whatsapp" onClick={handleShare}>
          <MessageCircle size={14} />
          Share
        </button>

        <button className="id-action-btn" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>

        <button className="id-action-btn id-action-print" onClick={handlePrint}>
          <Printer size={14} />
          Print
        </button>
      </div>
    </div>
  );
}
