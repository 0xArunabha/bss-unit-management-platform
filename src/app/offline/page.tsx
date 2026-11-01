import Link from "next/link";
import { WifiOff, ArrowRight } from "lucide-react";
import { identity } from "@/lib/identity";

export default function OfflinePage() {
  return <main className="standalone-page" id="main-content"><div className="offline-card"><img src="/images/bss-logo.svg" alt={identity.organisation} /><div className="offline-identity"><span className="bengali-mark">{identity.bengali}</span><strong>{identity.name}</strong><span>{identity.organisation} · {identity.unit}</span></div><span className="offline-icon"><WifiOff size={30} strokeWidth={1.4} /></span><span className="eyebrow">A LITTLE PAUSE, NOT A FULL STOP.</span><h1>We’ll reconnect with the unit soon.</h1><p>You’re offline right now. New entries are only recorded when the server confirms they have been saved. Reconnect to continue collecting dues, recording donations, or updating checklists.</p><Link href="/" className="button button-primary">Try the workspace again<ArrowRight size={16} /></Link><small>{identity.unit} · Science for Society. Progress, together.</small></div></main>;
}
