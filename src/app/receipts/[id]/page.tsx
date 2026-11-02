import { identity } from "@/lib/identity";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, isDatabaseConfigured } from "@/db";
import { donations, events, profiles } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { eq } from "drizzle-orm";
import { CircleCheck, HeartHandshake, ShieldCheck } from "lucide-react";
import { money } from "@/lib/types";
import ReceiptActions from "@/components/receipt-actions";
import { TreasurerSignatureBlock, UnitOfficialSeal } from "@/components/unit-seal";
import { getInMemoryState } from "@/lib/demo-data";

export const dynamic = "force-dynamic";
export const metadata = { title: `Donation receipt · ${identity.name} · ${identity.unit}` };

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  let donation: any;
  let event: { title: string } | undefined;
  let collector: { fullName: string; role: string } | undefined;

  if (isDatabaseConfigured) {
    await ensureSeed();
    const [d] = await db.select().from(donations).where(eq(donations.id, id));
    if (!d) notFound();
    donation = d;
    if (donation.eventId) {
      const [e] = await db.select({ title: events.title }).from(events).where(eq(events.id, donation.eventId));
      event = e;
    }
    if (donation.receivedBy) {
      const [c] = await db.select({ fullName: profiles.fullName, role: profiles.role }).from(profiles).where(eq(profiles.id, donation.receivedBy));
      collector = c;
    }
  } else {
    const state = getInMemoryState();
    const d = state.donations.find((item) => item.id === id);
    if (!d) notFound();
    donation = d;
    if (donation.eventId) {
      const e = state.events.find((item) => item.id === donation.eventId);
      if (e) event = { title: e.title };
    }
    if (donation.receivedBy) {
      const c = state.profiles.find((item) => item.id === donation.receivedBy);
      if (c) collector = { fullName: c.fullName, role: c.role };
    }
  }

  const dateFormatted = new Date(donation.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="public-receipt-page" id="main-content">
      <Link href="/" className="receipt-home-link">
        <img src="/images/bss-logo.svg" alt="" />
        {identity.name.toUpperCase()} · UNIT WORKSPACE
      </Link>

      <article className="public-receipt print-tech-slip">
        {/* Registration marks at 4 corners */}
        <span className="print-mark print-mark-tl" />
        <span className="print-mark print-mark-tr" />
        <span className="print-mark print-mark-bl" />
        <span className="print-mark print-mark-br" />

        {/* Official Society Header & Registration */}
        <header className="public-receipt-header">
          <div className="public-receipt-brand">
            <img src="/images/bss-logo.svg" alt="Breakthrough Science Society emblem" />
            <div>
              <h1>{identity.name}</h1>
              <p className="receipt-org-sub">{identity.organisation}</p>
              <p className="receipt-unit-sub">{identity.unit} · {identity.state}</p>
            </div>
          </div>
          <div className="receipt-reg-badge">
            <small>SOCIETY REGISTRATION</small>
            <strong>{identity.registrationNo}</strong>
            <span>{identity.act}</span>
          </div>
        </header>

        <div className="receipt-divider double-rule" />

        <div className="public-receipt-label">
          <span>OFFICIAL DONATION ACKNOWLEDGEMENT SLIP</span>
          <span className="receipt-status-stamp">
            <CircleCheck size={14} />
            Verified & Entered in Ledger
          </span>
        </div>

        <div className="receipt-amount-row">
          <div>
            <span className="receipt-amount-label">AMOUNT RECEIVED WITH THANKS</span>
            <div className="public-receipt-amount">{money(donation.amount)}</div>
          </div>
          <div className="receipt-seal-slot">
            <UnitOfficialSeal size={104} />
          </div>
        </div>

        <h2>Received from: {donation.donorName}</h2>
        <p className="public-receipt-intro">
          Contribution acknowledged with heartfelt gratitude towards grassroots scientific temper, anti-superstition advocacy, and science education.
        </p>

        <dl>
          <div>
            <dt>Official Receipt No.</dt>
            <dd className="mono font-bold text-rust">{donation.receiptNo}</dd>
          </div>
          <div>
            <dt>Contribution Date</dt>
            <dd>{dateFormatted}</dd>
          </div>
          <div>
            <dt>Payment Instrument</dt>
            <dd className="uppercase font-semibold">
              {donation.paymentMode === "bank_transfer"
                ? "Bank Transfer"
                : donation.paymentMode === "upi"
                ? "UPI"
                : "Cash"}
              {donation.transactionRef && <span className="block text-[10px] text-muted font-mono mt-1">Ref: {donation.transactionRef}</span>}
            </dd>
          </div>
          <div>
            <dt>Allocated Purpose</dt>
            <dd>{event?.title || "General Science Outreach & Unit Fund"}</dd>
          </div>
          <div>
            <dt>Authorized Receiver</dt>
            <dd>{collector?.fullName || "Unit Executive / Treasurer"}</dd>
          </div>
        </dl>

        {/* Signatures & Seal Section */}
        <div className="receipt-sign-row">
          <TreasurerSignatureBlock
            officerName={collector?.fullName || "Anirban Sen"}
            roleTitle={collector?.role === "admin" ? "Unit Executive / Convener" : "Authorized Collector / Organizer"}
            date={dateFormatted}
          />
          <div className="receipt-motto-seal">
            <HeartHandshake size={24} strokeWidth={1.4} />
            <p>
              Science for Man. Science for Society.<br />
              <strong>Science in Thinking.</strong>
            </p>
          </div>
        </div>

        {/* Perforated tear-off section */}
        <div className="perforated-tear-line">
          <span>✄ ----------------- UNIT ARCHIVE COPY / TEAR-OFF SLIP ----------------- ✄</span>
        </div>

        <div className="public-receipt-disclaimer">
          <strong>DEMONSTRATION RECORD · SAMPLE WORKSPACE · {identity.unit.toUpperCase()}</strong>
          <p>
            This digital slip acknowledges a recorded entry in the Light of Science unit ledger. Headquarters: {identity.headquarters}. Registered under {identity.act}.
          </p>
        </div>
      </article>

      <ReceiptActions
        autoPrint={query.print === "1"}
        donorName={donation.donorName}
        amountFormatted={money(donation.amount)}
        receiptNo={donation.receiptNo}
      />

      <p className="public-receipt-footer">
        A transparent public ledger. Powered by grassroots solidarity.
      </p>
    </main>
  );
}
