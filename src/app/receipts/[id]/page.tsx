import { identity } from "@/lib/identity";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db, isDatabaseConfigured } from "@/db";
import { donations, events, profiles } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { eq } from "drizzle-orm";
import { CircleCheck, HeartHandshake, ShieldCheck } from "lucide-react";
import { createI18n } from "@/lib/i18n-core";
import { I18nProvider } from "@/lib/i18n";
import { LOCALE_COOKIE, parseLocale } from "@/lib/locale";
import ReceiptActions from "@/components/receipt-actions";
import { TreasurerSignatureBlock, UnitOfficialSeal } from "@/components/unit-seal";
import { getInMemoryState } from "@/lib/demo-data";
import { isProductionRuntime } from "@/lib/runtime";

export const dynamic = "force-dynamic";

/**
 * A receipt opens in Bengali when the link says so (?lang=bn, which the app adds when it shares from a Bengali
 * session, so the donor sees what the sender saw) or when this browser has chosen Bengali. Otherwise English.
 */
async function receiptLanguage(searchParams: Promise<{ lang?: string }>) {
  const query = await searchParams;
  const requested = parseLocale(query.lang) ?? parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { requested, locale: requested ?? "en" };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { t } = createI18n((await receiptLanguage(searchParams)).locale, () => {});
  return { title: t("Donation receipt · {name} · {unit}", { name: t(identity.name), unit: t(identity.unit) }) };
}

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string; lang?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { requested, locale } = await receiptLanguage(searchParams);
  const { t, money, fmtDate } = createI18n(locale, () => {});
  // Capitals read well in Latin script; Bengali has none, so names are shown as they are there.
  const upper = (value: string) => (locale === "bn" ? t(value) : value.toUpperCase());
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  // Demo receipts exist only in development. A production server without a database must not show one.
  if (!isDatabaseConfigured && isProductionRuntime()) notFound();

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

  const dateFormatted = fmtDate(donation.createdAt, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const paymentMode = donation.paymentMode === "bank_transfer" ? "Bank Transfer" : donation.paymentMode === "upi" ? "UPI" : "Cash";

  return (
    <I18nProvider initialLocale={requested}>
    <main className="public-receipt-page" id="main-content" lang={locale}>
      <Link href="/" className="receipt-home-link">
        <img src="/images/bss-logo.svg" alt="" />
        {t("{name} · UNIT WORKSPACE", { name: upper(identity.name) })}
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
            <img src="/images/bss-logo.svg" alt={t("Breakthrough Science Society emblem")} />
            <div>
              <h1>{t(identity.name)}</h1>
              <p className="receipt-org-sub">{t(identity.organisation)}</p>
              <p className="receipt-unit-sub">{t(identity.unit)} · {t(identity.state)}</p>
            </div>
          </div>
          <div className="receipt-reg-badge">
            <small>{t("SOCIETY REGISTRATION")}</small>
            <strong>{identity.registrationNo}</strong>
            <span>{t(identity.act)}</span>
          </div>
        </header>

        <div className="receipt-divider double-rule" />

        <div className="public-receipt-label">
          <span>{t("OFFICIAL DONATION ACKNOWLEDGEMENT SLIP")}</span>
          <span className="receipt-status-stamp">
            <CircleCheck size={14} />
            {t("Verified & Entered in Ledger")}
          </span>
        </div>

        <div className="receipt-amount-row">
          <div>
            <span className="receipt-amount-label">{t("AMOUNT RECEIVED WITH THANKS")}</span>
            <div className="public-receipt-amount">{money(donation.amount)}</div>
          </div>
          <div className="receipt-seal-slot">
            <UnitOfficialSeal size={104} />
          </div>
        </div>

        <h2>{t("Received from: {donorName}", { donorName: donation.donorName })}</h2>
        <p className="public-receipt-intro">
          {t("Contribution acknowledged with heartfelt gratitude towards grassroots scientific temper, anti-superstition advocacy, and science education.")}
        </p>

        <dl>
          <div>
            <dt>{t("Official Receipt No.")}</dt>
            <dd className="mono font-bold text-rust">{donation.receiptNo}</dd>
          </div>
          <div>
            <dt>{t("Contribution Date")}</dt>
            <dd>{dateFormatted}</dd>
          </div>
          <div>
            <dt>{t("Payment Instrument")}</dt>
            <dd className="uppercase font-semibold">
              {t(paymentMode)}
              {donation.transactionRef && <span className="block text-[length:max(10px,var(--fs-floor,0px))] text-muted font-mono mt-1">{t("Ref: {ref}", { ref: donation.transactionRef })}</span>}
            </dd>
          </div>
          <div>
            <dt>{t("Allocated Purpose")}</dt>
            <dd>{event?.title || t("General Science Outreach & Unit Fund")}</dd>
          </div>
          <div>
            <dt>{t("Authorized Receiver")}</dt>
            <dd>{collector?.fullName || t("Unit Executive / Treasurer")}</dd>
          </div>
        </dl>

        {/* Signatures & Seal Section */}
        <div className="receipt-sign-row">
          <TreasurerSignatureBlock
            officerName={collector?.fullName || t("Arunabha Ghosh")}
            roleTitle={collector?.role === "admin" ? t("Unit Executive / Convener") : t("Authorized Collector / Organizer")}
            date={dateFormatted}
          />
          <div className="receipt-motto-seal">
            <HeartHandshake size={24} strokeWidth={1.4} />
            <p>
              {t("Science for Man. Science for Society.")}<br />
              <strong>{t("Science in Thinking.")}</strong>
            </p>
          </div>
        </div>

        {/* Perforated tear-off section */}
        <div className="perforated-tear-line">
          <span>✄ ----------------- {t("UNIT ARCHIVE COPY / TEAR-OFF SLIP")} ----------------- ✄</span>
        </div>

        <div className="public-receipt-disclaimer">
          <strong>{t("OFFICIAL CONTRIBUTION RECEIPT · BREAKTHROUGH SCIENCE SOCIETY · {unit}", { unit: upper(identity.unit) })}</strong>
          <p>
            {t("This digital slip acknowledges a recorded entry in the Light of Science unit ledger. Headquarters: {headquarters}. Registered under {act}.", { headquarters: t(identity.headquarters), act: t(identity.act) })}
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
        {t("A transparent public ledger. Powered by grassroots solidarity.")}
      </p>
    </main>
    </I18nProvider>
  );
}
