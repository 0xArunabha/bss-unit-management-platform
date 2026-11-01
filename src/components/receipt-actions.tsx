"use client";

import { Check, Copy, MessageCircle, Printer, Send } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        void document.fonts.ready.then(() => window.print());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const getUrl = () => (typeof window !== "undefined" ? window.location.href.split("?")[0] : "");

  const getShareText = () => {
    const url = getUrl();
    return `Light of Science (Breakthrough Science Society, Jalpaiguri Unit)\nDonation Acknowledgement Slip\nDonor: ${donorName || "Patron"}\nAmount: ${amountFormatted || ""}\nReceipt No: ${receiptNo || ""}\nVerify digital slip: ${url}\nScience for Man. Science for Society. Science in Thinking.`;
  };

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
          try {
            await navigator.clipboard.writeText(getUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            window.prompt("Copy this receipt link", getUrl());
          }
        }}
        title="Copy direct verification link"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Link copied" : "Copy link"}
      </button>

      <button
        className="button button-secondary button-whatsapp"
        onClick={shareWhatsApp}
        title="Share slip via WhatsApp"
      >
        <MessageCircle size={14} />
        WhatsApp
      </button>

      <button
        className="button button-secondary button-telegram"
        onClick={shareTelegram}
        title="Share slip via Telegram"
      >
        <Send size={14} />
        Telegram
      </button>

      <button
        className="button button-primary"
        onClick={() => window.print()}
        title="Print official receipt or save as PDF"
      >
        <Printer size={14} />
        Print / PDF
      </button>
    </div>
  );
}
