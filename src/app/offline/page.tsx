import Link from "next/link";
import { WifiOff, ArrowRight } from "lucide-react";
import { identity } from "@/lib/identity";
import { BN } from "@/lib/i18n-bn";

/*
 * This page is served from the service-worker cache when the phone is offline, where scripts may not be
 * available. So it carries both languages in the HTML and the stylesheet shows the one that matches
 * <html lang> (set before first paint by the boot script in layout.tsx). The Bengali comes from the same
 * dictionary as the rest of the app.
 */
function Bi({ en }: { en: string }) {
  return (
    <>
      <span className="lang-en">{en}</span>
      <span className="lang-bn">{BN[en] ?? en}</span>
    </>
  );
}

export default function OfflinePage() {
  return (
    <main className="standalone-page" id="main-content">
      <div className="offline-card">
        <img src="/images/bss-logo.svg" alt="" />
        <div className="offline-identity">
          <span className="bengali-mark">{identity.bengali}</span>
          <strong><Bi en={identity.name} /></strong>
          <span><Bi en={`A Unit of ${identity.organisation}`} /> · <Bi en={identity.unit} /></span>
        </div>
        <span className="offline-icon"><WifiOff size={30} strokeWidth={1.4} /></span>
        <span className="eyebrow"><Bi en="A LITTLE PAUSE, NOT A FULL STOP." /></span>
        <h1><Bi en="We’ll reconnect with the unit soon." /></h1>
        <p><Bi en="You’re offline right now. New entries are only recorded when the server confirms they have been saved. Reconnect to continue collecting dues, recording donations, or updating checklists." /></p>
        <Link href="/" className="button button-primary"><Bi en="Try the workspace again" /><ArrowRight size={16} /></Link>
        <small><Bi en={identity.unit} /> · <Bi en="Science for Society. Progress, together." /></small>
      </div>
    </main>
  );
}
