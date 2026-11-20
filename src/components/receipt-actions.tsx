"use client";

import { Check, Copy, MessageCircle, Printer, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function ReceiptActions({
  autoPrint,
  donorName,
  amountFormatted,
  receiptNo,
}: {
  autoPrint: boolean;
  donorName?: string;
  amountFormatted?: string;
  receiptNo?: string;
}) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        void document.fonts.ready.then(() => window.print());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  // A link shared from a Bengali session opens in Bengali for whoever receives it.
  const getUrl = () => {
    if (typeof window === "undefined") return "";
    const base = window.location.href.split("?")[0];
    return locale === "bn" ? `${base}?lang=bn` : base;
  };

  const getShareText = () =>
    t("Light of Science (Breakthrough Science Society, Jalpaiguri Unit)\nDonation Acknowledgement Slip\nDonor: {donor}\nAmount: {amount}\nReceipt No: {receipt}\nVerify digital slip: {url}\nScience for Man. Science for Society. Science in Thinking.", {
      donor: donorName || t("Patron"),
      amount: amountFormatted || "",
      receipt: receiptNo || "",
      url: getUrl(),
    });

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const shareTelegram = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(getShareText());
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="public-receipt-actions">
      <button
        className="button button-secondary"
        onClick={async () => {
          const url = getUrl();
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            const textarea = document.createElement("textarea");
            textarea.value = url;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            try {
              document.execCommand("copy");
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              // Fallback silent failure if permissions completely restricted
            } finally {
              document.body.removeChild(textarea);
            }
          }
        }}
        title={t("Copy direct verification link")}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? t("Link copied") : t("Copy link")}
      </button>

      <button
        className="button button-secondary button-whatsapp"
        onClick={shareWhatsApp}
        title={t("Share slip via WhatsApp")}
      >
        <MessageCircle size={14} />
        {t("WhatsApp")}
      </button>

      <button
        className="button button-secondary button-telegram"
        onClick={shareTelegram}
        title={t("Share slip via Telegram")}
      >
        <Send size={14} />
        {t("Telegram")}
      </button>

      <button
        className="button button-primary"
        onClick={() => window.print()}
        title={t("Print official receipt or save as PDF")}
      >
        <Printer size={14} />
        {t("Print / PDF")}
      </button>
    </div>
  );
}
