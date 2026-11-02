"use client";

import React, { useState } from "react";
import { identity } from "@/lib/identity";
import { type Profile, money } from "@/lib/types";
import { getMemberDesignations } from "@/lib/teams";
import { Avatar, Button } from "@/components/ui";
import { UnitOfficialSeal } from "@/components/unit-seal";
import { shareViaWhatsApp, copyBroadcastText } from "@/lib/whatsapp";
import { useI18n } from "@/lib/i18n";
import { Check, Copy, MessageCircle, Printer, RefreshCw, ShieldCheck, Sparkles, QrCode } from "lucide-react";

interface IdCardProps {
  member: Profile;
  memberCode?: string;
  onClose?: () => void;
}

export function VirtualIdCard({ member, memberCode = "JPG-001", onClose }: IdCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const { locale, t } = useI18n();
  const designations = getMemberDesignations(member.fullName);

  const getShareText = () => {
    return `🪪 *LIGHT OF SCIENCE — OFFICIAL MEMBER CREDENTIAL*
Breakthrough Science Society · Jalpaiguri Unit

👤 *Member:* ${member.fullName}
🆔 *ID Code:* ${memberCode}
🎖️ *Role:* ${member.role.toUpperCase()}
⭐ *Designation:* ${locale === "bn" ? designations.primaryTitleBn : designations.primaryTitleEn}
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
            {/* Lanyard slot */}
            <div className="id-card-lanyard-slot" />
            <div className="id-card-hologram-strip" />

            {/* Header */}
            <div className="id-card-header">
              <div className="id-card-brand">
                <img src="/images/bss-logo.svg" alt="BSS Logo" className="id-card-logo" />
                <div>
                  <h3 className="id-card-society-title">{identity.organisation}</h3>
                  <h2 className="id-card-unit-title">{identity.name} · {identity.city}</h2>
                </div>
              </div>
              <span className="id-card-reg-pill mono">REG: {identity.registrationNo.split(" ")[0]}</span>
            </div>

            {/* Card Body */}
            <div className="id-card-body">
              <div className="id-card-photo-wrapper">
                <div className="id-card-avatar-ring">
                  <Avatar person={member} size="large" />
                </div>
                <div className="id-card-badge-token">
                  <ShieldCheck size={14} />
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
                <p className="id-card-designation">
                  {locale === "bn" ? designations.primaryTitleBn : designations.primaryTitleEn}
                </p>

                {designations.teams.length > 0 && (
                  <div className="id-card-team-pills">
                    {designations.teams.slice(0, 3).map((team) => (
                      <span key={team} className="id-card-team-pill">
                        ★ {team}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Barcode */}
            <div className="id-card-footer">
              <div className="id-card-barcode-sim">
                <span className="barcode-line w-1" />
                <span className="barcode-line w-3" />
                <span className="barcode-line w-2" />
                <span className="barcode-line w-4" />
                <span className="barcode-line w-1" />
                <span className="barcode-line w-2" />
                <span className="barcode-line w-3" />
                <span className="barcode-line w-1" />
                <span className="barcode-line w-4" />
                <span className="barcode-line w-2" />
                <span className="barcode-line w-3" />
                <span className="barcode-line w-1" />
                <span className="barcode-line w-2" />
                <span className="barcode-line w-4" />
                <span className="barcode-line w-1" />
                <span className="barcode-line w-3" />
                <span className="barcode-line w-2" />
                <span className="barcode-line w-1" />
              </div>
              <div className="id-card-meta">
                <span className="mono">SESSION: 2026–27</span>
                <span className="id-card-flip-prompt" onClick={() => setFlipped(!flipped)}>
                  <RefreshCw size={11} className="inline mr-1" />
                  Flip to inspect seal
                </span>
              </div>
            </div>
          </div>

          {/* ===================== BACK SIDE ===================== */}
          <div className="id-card-face id-card-back print-tech-slip">
            <div className="id-card-lanyard-slot" />
            
            <div className="id-card-back-header">
              <span className="id-card-back-watermark">{identity.bengali}</span>
              <p className="id-card-back-motto-bn">“{identity.bengaliMotto}”</p>
              <p className="id-card-back-motto-en">“{identity.motto}”</p>
            </div>

            <div className="id-card-back-details">
              <div className="id-card-back-row">
                <span>Society Head Office:</span>
                <strong>{identity.headquarters}</strong>
              </div>
              <div className="id-card-back-row">
                <span>Unit Chapter:</span>
                <strong>{identity.fullName}</strong>
              </div>
              <div className="id-card-back-row">
                <span>Monthly Pledge:</span>
                <strong>{money(member.monthlyPledge)} / month · Active Cadre</strong>
              </div>
              {member.phone && (
                <div className="id-card-back-row">
                  <span>Registered Contact:</span>
                  <strong>+91 {member.phone}</strong>
                </div>
              )}
            </div>

            <div className="id-card-back-seal-row">
              <div className="id-card-seal-graphic">
                <UnitOfficialSeal size={64} />
              </div>
              <div className="id-card-signatory">
                <div className="id-card-sign-line" />
                <strong>Pritam Sarkar</strong>
                <small>Unit Secretary · Authorized Signatory</small>
                <small className="mono">ID: {identity.receiptPrefix}-{memberCode}</small>
              </div>
            </div>

            <div className="id-card-back-notice">
              This card certifies membership of Light of Science, Breakthrough Science Society (WB Reg. {identity.registrationNo}). If found, kindly return to the unit office or email: {identity.unitContact}
            </div>
          </div>

        </div>
      </div>

      {/* Action Toolbar */}
      <div className="id-card-actions">
        <button className="button button-secondary" onClick={() => setFlipped(!flipped)}>
          <RefreshCw size={15} />
          {flipped ? "Show Front" : "Flip to Back"}
        </button>

        <button className="button button-secondary button-whatsapp" onClick={handleShare}>
          <MessageCircle size={15} />
          WhatsApp
        </button>

        <button className="button button-secondary" onClick={handleCopy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy Info"}
        </button>

        <button className="button button-dark" onClick={handlePrint}>
          <Printer size={15} />
          Print ID
        </button>
      </div>
    </div>
  );
}
