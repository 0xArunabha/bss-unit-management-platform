"use client";

import { identity } from "@/lib/identity";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Atom, Bell, BookOpen, CalendarDays, Check, CheckCheck, ChevronDown, ChevronRight, CircleCheck, CircleHelp, ClipboardList, CloudLightning, Command, ExternalLink, HeartHandshake, IdCard, KeyRound, LayoutDashboard, LogOut, MapPin, Megaphone, Menu, Package, RefreshCw, Search, Settings, Users, Wallet, WifiOff, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { type WorkspaceData, type View, type ActionResult } from "@/lib/types";
import { enqueueOfflineAction, getPendingOfflineActions, subscribeOfflineQueue, syncOfflineQueue } from "@/lib/offline-queue";
import { Avatar, Badge, Button, Modal, relativeTime } from "@/components/ui";
import { Overview } from "@/components/overview";
import { MembersView, DuesView, DonationsView } from "@/components/people-views";
import { CircularsView, EventsView, ProcurementView, ResourcesView, SettingsView } from "@/components/field-views";
import { WorkspaceModals, type ModalState } from "@/components/workspace-modals";
import { LoginScreen } from "@/components/login-screen";
import { hapticTap, hapticSuccess, hapticWarning } from "@/lib/haptics";
import { I18nProvider, useI18n } from "@/lib/i18n";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function Workspace({ initialData }: { initialData: WorkspaceData }) {
  return (
    <I18nProvider>
      <WorkspaceInner initialData={initialData} />
    </I18nProvider>
  );
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getOnlineServerSnapshot() {
  return true;
}

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function WorkspaceInner({ initialData }: { initialData: WorkspaceData }) {
  const { locale, setLocale, t } = useI18n();
  const identityRef = identity;
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>("overview");
  const [eventFilter, setEventFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [popover, setPopover] = useState<"unit" | "notifications" | "account" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const online = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getOnlineServerSnapshot);
  const duesReminderPref = useSyncExternalStore(subscribeStorage, () => localStorage.getItem("bss-dues-reminder") !== "false", () => true);
  const latestActivityId = data.activities[0]?.id;
  const [dismissedActivityId, setDismissedActivityId] = useState<string | null>(null);
  const isUnreadInStorage = useSyncExternalStore(
    subscribeStorage,
    () => (latestActivityId ? localStorage.getItem("bss-seen-activity") !== latestActivityId : false),
    () => false
  );
  const unread = Boolean(latestActivityId && isUnreadInStorage && dismissedActivityId !== latestActivityId);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const installPrompt = useRef<InstallPrompt | null>(null);
  const lastActivity = useRef(initialData.activities[0]?.id);
  const [guestMode, setGuestMode] = useState(false);
  const isAuthorized = Boolean(data.currentUserId);

  const labels: Record<View, string> = {
    overview: t("overview"),
    members: t("members"),
    dues: t("dues"),
    donations: t("donations"),
    events: t("events"),
    procurement: t("procurement"),
    circulars: t("circulars"),
    resources: t("resources"),
    settings: t("settings"),
  };

  const navItems: { view: View; label: string; icon: LucideIcon }[] = [
    { view: "overview", label: t("overview"), icon: LayoutDashboard },
    { view: "members", label: t("members"), icon: Users },
    { view: "dues", label: t("dues"), icon: Wallet },
    { view: "donations", label: t("donations"), icon: HeartHandshake },
    { view: "events", label: t("events"), icon: CalendarDays },
    { view: "procurement", label: t("procurement"), icon: ClipboardList },
  ];

  const knowledgeItems: { view: View; label: string; icon: LucideIcon }[] = [
    { view: "circulars", label: t("circulars"), icon: Megaphone },
    { view: "resources", label: t("resources"), icon: BookOpen },
  ];
  const user = data.profiles.find((p) => p.id === data.currentUserId) || (guestMode ? {
    id: "",
    fullName: "Public Visitor",
    phone: null,
    role: "member" as const,
    status: "active",
    monthlyPledge: 0,
    avatarColor: "sand",
    unpaidMonths: 0,
    createdAt: new Date().toISOString(),
  } : data.profiles[0]);
  const needed = data.procurements.filter((p) => p.status === "needed").length;
  const notify = useCallback((message: string) => setToast({ message }), []);
  const close = useCallback(() => { setModal(null); setActionError(""); }, []);
  const open = useCallback((type: string, record?: unknown) => { setPopover(null); setActionError(""); setModal({ type, record }); }, []);

  useEffect(() => {
    return subscribeOfflineQueue(setOfflineCount);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      notify("Still offline. Reconnect to network before syncing.");
      return;
    }
    setSyncing(true);
    try {
      const { synced, failed, errors } = await syncOfflineQueue(async (action, payload) => {
        const res = await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...payload }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, status: res.status, error: json.error || "Failed" };
        if (json.data) setData(json.data);
        return { ok: true, status: res.status };
      });
      if (synced > 0) {
        notify(`⚡ Synced ${synced} field ${synced === 1 ? "operation" : "operations"} successfully with unit server.`);
        const fresh = await fetch("/api/workspace").then((r) => r.json()).catch(() => null);
        if (fresh) setData(fresh);
      }
      if (failed > 0) {
        notify(`⚠️ ${failed} queued ${failed === 1 ? "item" : "items"} could not be synced: ${errors[0]}`);
      }
    } finally {
      setSyncing(false);
    }
  }, [notify]);

  const navigate = useCallback((target: View, eventId?: string) => {
    hapticTap(8);
    const update = () => {
      setView(target); setSidebarOpen(false); setPopover(null); setSearchOpen(false);
      if (target === "procurement") setEventFilter(eventId || "all");
      const url = target === "overview" ? "/" : `/?view=${target}${eventId ? `&event=${eventId}` : ""}`;
      window.history.pushState(null, "", url);
      window.scrollTo({ top: 0, behavior: "instant" });
    };

    // On mobile screens or touch devices, bypass View Transitions snapshot freezing for 0ms instant tab response
    const isMobile = typeof window !== "undefined" && (window.innerWidth <= 768 || window.matchMedia("(pointer: coarse)").matches);
    if (!isMobile && typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (fn: () => void) => void }).startViewTransition(update);
    } else {
      update();
    }
  }, []);
  useEffect(() => {
    const readLocation = () => { const params = new URLSearchParams(window.location.search); const target = params.get("view"); setView(target && target in labels ? target as View : "overview"); setEventFilter(params.get("event") || "all"); };
    readLocation();
    window.addEventListener("popstate", readLocation);
    const connected = () => {
      void triggerSync();
    };
    window.addEventListener("online", connected);
    const onInstall = (e: Event) => { e.preventDefault(); installPrompt.current = e as InstallPrompt; };
    window.addEventListener("beforeinstallprompt", onInstall);
    const onSwMessage = (e: MessageEvent) => {
      if (e.data?.type === "BSS_TRIGGER_SYNC") void triggerSync();
    };
    navigator.serviceWorker?.addEventListener("message", onSwMessage);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").then(async (registration) => { const subscription = await registration.pushManager?.getSubscription(); setPushEnabled(Boolean(subscription)); }).catch(() => {});
    return () => {
      window.removeEventListener("popstate", readLocation);
      window.removeEventListener("online", connected);
      window.removeEventListener("beforeinstallprompt", onInstall);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [triggerSync, labels]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((v) => !v); setPopover(null); } if (e.key === "Escape") { setPopover(null); setSidebarOpen(false); } };
    const click = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest("[data-popover]")) setPopover(null); };
    document.addEventListener("keydown", handler); document.addEventListener("click", click);
    return () => { document.removeEventListener("keydown", handler); document.removeEventListener("click", click); };
  }, []);
  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(null), 5800); return () => clearTimeout(id); } }, [toast]);
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState === "hidden" || !navigator.onLine) return;
      try {
        const response = await fetch("/api/workspace", { cache: "no-store" }); if (!response.ok) return;
        const updated: WorkspaceData = await response.json();
        if (!cancelled) {
          // Avoid triggering expensive component tree re-renders if no activities or profiles changed
          if (lastActivity.current !== updated.activities[0]?.id || updated.profiles.length !== data.profiles.length) {
            setData(updated);
            if (lastActivity.current && updated.activities[0]?.id !== lastActivity.current) {
              setDismissedActivityId(null);
              if (localStorage.getItem("bss-sound") === "true") {
                try { const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.connect(gain); gain.connect(context.destination); gain.gain.value = .035; oscillator.frequency.value = 660; oscillator.start(); oscillator.stop(context.currentTime + .12); oscillator.onended = () => void context.close(); } catch { /* Browser may require a user gesture. */ }
              }
            }
            lastActivity.current = updated.activities[0]?.id;
          }
        }
      } catch { /* The offline indicator reflects network availability; saved data remains visible. */ }
    };
    const interval = window.setInterval(() => void refresh(), 45000);
    window.addEventListener("focus", refresh);
    return () => { cancelled = true; clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);
  const perform = useCallback(async (action: string, payload: Record<string, unknown>): Promise<ActionResult | null> => {
    setBusy(true); setActionError("");
    const idempotencyKey = (payload.idempotencyKey as string) ||
      (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    const actionPayload = { ...payload, idempotencyKey };

    // 1. If currently offline, queue directly into IndexedDB without blocking the volunteer
    if (!navigator.onLine) {
      try {
        await enqueueOfflineAction(action, actionPayload);
        const optimisticMsg = "⚡ Recorded in local offline queue. Will auto-sync when network returns.";
        notify(optimisticMsg);
        return { data, message: optimisticMsg };
      } catch {
        const message = "Unable to write to local offline queue.";
        setActionError(message); setToast({ message, error: true }); return null;
      } finally {
        setBusy(false);
      }
    }

    try {
      const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...actionPayload }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save this record.");
      setData(result.data); lastActivity.current = result.data.activities[0]?.id; setDismissedActivityId(null); notify(result.message);
      hapticSuccess();
      return result as ActionResult;
    } catch (error) {
      hapticWarning();
      // 2. If network dropped mid-request, gracefully fallback to IndexedDB queue with same idempotencyKey
      const isNetworkIssue = !navigator.onLine || (error instanceof TypeError && error.message.toLowerCase().includes("fetch"));
      if (isNetworkIssue) {
        try {
          await enqueueOfflineAction(action, actionPayload);
          const fallbackMsg = "⚡ Network connection dropped. Safely saved in local offline queue; will sync when reconnected.";
          notify(fallbackMsg);
          return { data, message: fallbackMsg };
        } catch {
          // ignore
        }
      }
      const message = error instanceof Error ? error.message : "Please try again.";
      setActionError(message); setToast({ message, error: true }); return null;
    } finally { setBusy(false); }
  }, [data, notify]);
  const enablePush = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) { notify("This browser doesn’t support Web Push. In-app alerts are still available."); return; }
    try {
      const config = await fetch("/api/push").then((r) => r.json());
      if (!config.configured) { notify("In-app alerts are active. Browser push needs VAPID credentials configured on the server."); return; }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { notify("Notifications weren’t enabled. You can change this in your browser’s site settings."); return; }
      const registration = await navigator.serviceWorker.ready;
      const key = config.publicKey.replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(key + "=".repeat((4 - key.length % 4) % 4)), (c) => c.charCodeAt(0));
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes.buffer });
      const response = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error("Unable to register push notifications. Please try again.");
      setPushEnabled(true); notify("You’re connected. Important unit updates can now reach this device.");
    } catch (error) { notify(error instanceof Error ? error.message : "Unable to enable browser push."); }
  }, [notify]);
  const installApp = useCallback(async () => {
    if (installPrompt.current) { await installPrompt.current.prompt(); const choice = await installPrompt.current.userChoice; if (choice.outcome === "accepted") notify("The unit workspace has been added to your device."); installPrompt.current = null; }
    else notify("Use your browser menu → Install app or Add to Home Screen. On iPhone, use Share → Add to Home Screen.");
  }, [notify]);
  const markRead = () => {
    if (latestActivityId) {
      setDismissedActivityId(latestActivityId);
      localStorage.setItem("bss-seen-activity", latestActivityId);
      window.dispatchEvent(new Event("storage"));
    }
  };
  const showReminder = duesReminderPref && user.unpaidMonths > 0;
  const renderNavItem = (item: { view: View; label: string; icon: LucideIcon }) => <button key={item.view} className={`nav-item ${view === item.view ? "nav-item-active" : ""}`} aria-current={view === item.view ? "page" : undefined} onClick={() => navigate(item.view)}><item.icon size={18} strokeWidth={1.65} /><span>{item.label}</span>{item.view === "procurement" && needed > 0 && <span className="nav-count">{needed}</span>}{item.view === "members" && <span className="nav-member-count">{data.profiles.length}</span>}{item.view === "circulars" && <span className="nav-new-dot" />}</button>;

  if (!isAuthorized && !guestMode) {
    return <LoginScreen data={data} perform={perform} onContinueAsGuest={() => setGuestMode(true)} />;
  }

  return <div className="workspace-app">
    <button
      className={`sidebar-overlay ${sidebarOpen ? "sidebar-overlay-visible" : ""}`}
      onClick={() => setSidebarOpen(false)}
      aria-label="Close navigation"
      aria-hidden={!sidebarOpen}
      tabIndex={sidebarOpen ? 0 : -1}
    />
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button className="brand" onClick={() => navigate("overview")} aria-label={`${identity.name} home`}><img src="/images/bss-logo.svg" alt="" /><span><strong>{identity.name}<span className="brand-period">.</span></strong><small>{identity.organisation.toUpperCase()}</small></span></button>
      <div className="unit-selector-wrap" data-popover><button className="unit-selector" onClick={() => setPopover(popover === "unit" ? null : "unit")} aria-expanded={popover === "unit"}><span className="unit-symbol"><MapPin size={18} strokeWidth={1.5} /><i /></span><span><strong>{identity.unit}</strong><small>{identity.state}</small></span><ChevronDown size={14} /></button>{popover === "unit" && <div className="small-menu unit-menu"><span className="menu-eyebrow">YOUR UNIT WORKSPACE</span><button onClick={() => setPopover(null)}><span>{identity.unit}<small>{identity.state} chapter</small></span><Check size={15} /></button><button onClick={() => navigate("settings")}><Settings size={14} />Unit settings<ArrowUpRight size={13} /></button></div>}</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="nav-group-label">{locale === "bn" ? "কর্মক্ষেত্র" : "WORKSPACE"}</div>
        {navItems.map(renderNavItem)}
        <div className="nav-group-label knowledge-label">{locale === "bn" ? "জ্ঞান ও প্রচার" : "KNOWLEDGE & OUTREACH"}</div>
        {knowledgeItems.map(renderNavItem)}
        <div className="nav-settings">{renderNavItem({ view: "settings", label: t("settings"), icon: Settings })}</div>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-mission">
          <Atom size={25} strokeWidth={1.2} />
          <p>{locale === "bn" ? "কৌতূহল ও যুক্তির ভিত্তি।" : "Built on curiosity."}<br /><strong>{locale === "bn" ? "জনগণের শক্তিতে পরিচালিত।" : "Powered by people."}</strong></p>
          <span>{locale === "bn" ? "জলপাইগুড়িতে বিজ্ঞানের প্রসার, একসাথে।" : "Taking science to Jalpaiguri, together."}</span>
        </div>
        <button className="sidebar-help" onClick={() => open("help")}><CircleHelp size={17} strokeWidth={1.5} /><span>{locale === "bn" ? "সহায়তা প্রয়োজন?" : "Need a helping hand?"}</span><ArrowUpRight size={13} /></button>
        <div className="sidebar-connection"><span className={`tiny-dot ${online ? "green" : "orange"}`} />{online ? (offlineCount > 0 ? `${offlineCount} to sync` : (locale === "bn" ? "অনলাইন সংযুক্ত" : "Workspace online")) : (locale === "bn" ? "ফিল্ড অফলাইন কিউ" : "Field offline queue")}{offlineCount > 0 ? <span className="demo-pill" style={{ background: "var(--rust, #bf5029)", color: "#fff" }}>⚡ {offlineCount}</span> : <span className="sidebar-version-pill" title={`Release: ${identity.releaseName} · Build ${identity.build}`}>v{identity.version}</span>}</div>
        <button className="sidebar-account" onClick={() => navigate("settings")}><Avatar person={user} /><span><strong>{user.fullName}</strong><small>{user.role === "admin" ? (locale === "bn" ? "কার্যনির্বাহক" : "Unit Executive") : (locale === "bn" ? (user.role === "organizer" ? "সংগঠক" : user.role === "volunteer" ? "স্বেচ্ছাসেবক" : "সদস্য") : (user.role.charAt(0).toUpperCase() + user.role.slice(1)))}</small></span><ChevronRight size={15} /></button>
      </div>
    </aside>
    <div className="main-shell">
      {guestMode && (
        <div className="guest-banner">
          <span>👀 Browsing public announcements & science calendar in <strong>read-only visitor mode</strong>.</span>
          <button onClick={() => setGuestMode(false)} className="guest-login-btn">Log In with Member PIN</button>
        </div>
      )}
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Open main navigation"><Menu size={21} /></button>
          <span className="breadcrumb-root">{identity.name}</span>
          <ChevronRight size={13} className="breadcrumb-chevron" />
          <span className="breadcrumb-current">{labels[view]}</span>
        </div>
        <div className="topbar-right">
          {/* Language Switcher */}
          <div className="lang-toggle-wrap" title="Switch language / ভাষা পরিবর্তন">
            <button
              type="button"
              className={`lang-pill ${locale === "en" ? "lang-pill-active" : ""}`}
              onClick={() => setLocale("en")}
              aria-label="Switch language to English"
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-pill ${locale === "bn" ? "lang-pill-active" : ""}`}
              onClick={() => setLocale("bn")}
              aria-label="Switch language to Bengali"
            >
              বাং
            </button>
          </div>

          <button className="global-search-button" onClick={() => setSearchOpen(true)}>
            <Search size={15} />
            <span>{locale === "bn" ? "অনুসন্ধান করুন…" : "Search the unit…"}</span>
            <kbd><Command size={10} />K</kbd>
          </button>
          <span className="topbar-date">{new Date().toLocaleDateString(locale === "bn" ? "bn-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
          <button className="icon-button help-topbar" aria-label="Workspace help" onClick={() => open("help")}><CircleHelp size={19} strokeWidth={1.5} /></button>
          <div className="notifications-wrap" data-popover>
            <button className={`icon-button notification-button ${popover === "notifications" ? "icon-button-selected" : ""}`} aria-label="Open notifications" aria-expanded={popover === "notifications"} onClick={() => setPopover(popover === "notifications" ? null : "notifications")}><Bell size={19} strokeWidth={1.6} />{unread && <span />}</button>
            {popover === "notifications" && (
              <div className="notifications-popover print-tech-slip">
                <div className="notification-heading">
                  <div>
                    <h2>{locale === "bn" ? "ক্যাডার বিজ্ঞপ্তি ও আপডেট" : "Cadre Alerts & Activity"}</h2>
                    <p>{identity.fullName} · {locale === "bn" ? "রিয়েল-টাইম প্রেরণ" : "Real-time dispatch"}</p>
                  </div>
                  <button className="icon-button" aria-label="Mark all notifications as read" title="Mark all as read" onClick={markRead}><CheckCheck size={18} /></button>
                </div>
                {showReminder && (
                  <button className="dues-reminder" onClick={() => { setPopover(null); navigate("dues"); }}>
                    <Wallet size={17} />
                    <span>{locale === "bn" ? "মাসিক সদস্য চাঁদা বকেয়া রয়েছে।" : "Monthly membership contribution pending."}<small>{locale === "bn" ? "ভিত্তি ₹২০/মাস। সংগঠনকে এগিয়ে নিয়ে চলুন।" : "Baseline ₹20/month. Keep the movement active."}</small></span>
                    <ArrowRight size={14} />
                  </button>
                )}
                <div className="notification-items">
                  {data.activities.slice(0, 6).map((a, i) => (
                    <button className={`notification-item ${unread && i < 2 ? "unread" : ""}`} key={a.id} onClick={() => { markRead(); setPopover(null); navigate(a.type === "dues" ? "dues" : a.type === "donation" ? "donations" : a.type === "circular" ? "circulars" : a.type === "event" ? "events" : "procurement"); }}>
                      <span className={`notification-symbol activity-${a.type}`}>
                        {a.type === "donation" ? <HeartHandshake size={16} /> : a.type === "dues" ? <ArrowDownLeft size={16} /> : a.type === "verified" ? <CircleCheck size={16} /> : <Package size={16} />}
                      </span>
                      <span><strong>{a.title}</strong><small>{a.description}</small><time>{relativeTime(a.createdAt)} · Action: Click to inspect</time></span>
                      {unread && i < 2 && <i />}
                    </button>
                  ))}
                </div>
                <div className="notification-footer">
                  <span className="tiny-dot green" />Service Worker Web Push & In-App Sync Active
                  <button onClick={() => { setPopover(null); navigate("settings"); }}>Push settings<ArrowUpRight size={12} /></button>
                </div>
              </div>
            )}
          </div>
          <span className="topbar-divider" />
          <div className="account-wrap" data-popover>
            <button className="topbar-avatar" onClick={() => setPopover(popover === "account" ? null : "account")} aria-label="Open profile menu"><Avatar person={user} size="small" /><ChevronDown size={12} /></button>
            {popover === "account" && (
              <div className="small-menu account-menu">
                <span className="menu-eyebrow">{guestMode ? "GUEST VISITOR" : (locale === "bn" ? "লগইন আছেন" : "LOGGED IN AS")}</span>
                <strong>{user.fullName}</strong>
                <small>{user.role === "admin" ? (locale === "bn" ? "কার্যনির্বাহক" : "Unit executive") : user.role} · {identity.unit}</small>
                <div className="account-version-note"><span>App Release</span><strong>v{identity.version}</strong></div>
                <button onClick={() => { setPopover(null); open("idCard", { member: user }); }}>
                  <IdCard size={15} />
                  {locale === "bn" ? "আমার পরিচয়পত্র (ID Card)" : "My Member ID Card"}
                  <ArrowUpRight size={13} />
                </button>
                <button onClick={() => navigate("settings")}>
                  <Settings size={15} />
                  {locale === "bn" ? "অ্যাকাউন্ট ও নিরাপত্তা" : "Account & PIN security"}
                  <ArrowUpRight size={13} />
                </button>
                <button onClick={() => guestMode ? setGuestMode(false) : void perform("logout", {})}>
                  <LogOut size={15} />
                  {guestMode ? (locale === "bn" ? "লগ ইন করুন" : "Log In") : (locale === "bn" ? "সাইন আউট" : "Sign Out")}
                  <ArrowUpRight size={13} />
                </button>
                <a href="https://breakthroughindia.org/" target="_blank" rel="noreferrer">
                  <ExternalLink size={15} />
                  {locale === "bn" ? "সংগঠন সম্পর্কে" : "About the society"}
                  <ArrowUpRight size={13} />
                </a>
              </div>
            )}
          </div>
        </div>
      </header>
      {!online && (
        <div className="offline-banner">
          <WifiOff size={15} />
          <span><strong>You’re offline in the field.</strong> Field queue active: dues, procurements, and donations are saved locally in IndexedDB and will auto-sync when network returns.</span>
          {offlineCount > 0 && <span className="demo-pill" style={{ marginLeft: "auto", background: "var(--rust, #bf5029)", color: "#fff" }}>⚡ {offlineCount} queued</span>}
        </div>
      )}
      {online && offlineCount > 0 && (
        <div className="offline-banner" style={{ background: "var(--olive, #6b7f50)", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
          <CloudLightning size={16} />
          <span><strong>{offlineCount} offline field {offlineCount === 1 ? "entry" : "entries"} waiting to sync.</strong> Network connection is active.</span>
          <button
            onClick={() => void triggerSync()}
            disabled={syncing}
            style={{
              marginLeft: "auto",
              padding: "4px 12px",
              background: "#fff",
              color: "var(--charcoal, #1e2418)",
              border: "none",
              borderRadius: "4px",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <RefreshCw size={12} className={syncing ? "spin" : ""} />
            {syncing ? "Syncing..." : "Sync now"}
          </button>
        </div>
      )}
      <main className="workspace-main" id="main-content">
        <div key={view} className="view-stage">
          {view === "overview" && <Overview data={data} navigate={navigate} open={open} />}
          {view === "members" && <MembersView data={data} open={open} perform={perform} />}
          {view === "dues" && <DuesView data={data} open={open} />}
          {view === "donations" && <DonationsView data={data} open={open} />}
          {view === "events" && <EventsView data={data} open={open} navigate={navigate} />}
          {view === "procurement" && <ProcurementView data={data} open={open} navigate={navigate} eventFilter={eventFilter} setEventFilter={setEventFilter} />}
          {view === "circulars" && <CircularsView data={data} open={open} navigate={navigate} />}
          {view === "resources" && <ResourcesView open={open} />}
          {view === "settings" && <SettingsView data={data} perform={perform} enablePush={() => void enablePush()} pushEnabled={pushEnabled} installApp={() => void installApp()} busy={busy} />}
        </div>
      </main>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          className={`bottom-nav-item ${view === "overview" ? "bottom-nav-active" : ""}`}
          onClick={() => navigate("overview")}
          aria-current={view === "overview" ? "page" : undefined}
        >
          <LayoutDashboard size={19} strokeWidth={view === "overview" ? 2.2 : 1.7} />
          <span>{locale === "bn" ? "সারসংক্ষেপ" : "Overview"}</span>
        </button>
        <button
          className={`bottom-nav-item ${view === "members" ? "bottom-nav-active" : ""}`}
          onClick={() => navigate("members")}
          aria-current={view === "members" ? "page" : undefined}
        >
          <Users size={19} strokeWidth={view === "members" ? 2.2 : 1.7} />
          <span>{locale === "bn" ? "সদস্য" : "Members"}</span>
        </button>
        <button
          className={`bottom-nav-item ${view === "dues" ? "bottom-nav-active" : ""}`}
          onClick={() => navigate("dues")}
          aria-current={view === "dues" ? "page" : undefined}
        >
          <Wallet size={19} strokeWidth={view === "dues" ? 2.2 : 1.7} />
          <span>{locale === "bn" ? "চাঁদা" : "Dues"}</span>
          {user.unpaidMonths > 0 && <span className="bottom-nav-dot" />}
        </button>
        <button
          className={`bottom-nav-item ${view === "procurement" ? "bottom-nav-active" : ""}`}
          onClick={() => navigate("procurement")}
          aria-current={view === "procurement" ? "page" : undefined}
        >
          <ClipboardList size={19} strokeWidth={view === "procurement" ? 2.2 : 1.7} />
          <span>{locale === "bn" ? "কেনাকাটা" : "Procure"}</span>
          {needed > 0 && <span className="bottom-nav-badge">{needed}</span>}
        </button>
        <button
          className="bottom-nav-item"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation drawer"
        >
          <Menu size={19} strokeWidth={1.7} />
          <span>{locale === "bn" ? "অন্যান্য" : "More"}</span>
        </button>
      </nav>
    </div>
    <WorkspaceModals modal={modal} data={data} close={close} open={open} perform={perform} busy={busy} error={actionError} navigate={navigate} notify={notify} />
    {searchOpen && <GlobalSearch data={data} close={() => setSearchOpen(false)} open={open} navigate={navigate} />}
    {toast && <div className={`toast ${toast.error ? "toast-error" : ""}`} role="status">{toast.error ? <InfoSymbol /> : <CircleCheck size={19} />}<span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss message"><X size={15} /></button></div>}
  </div>;
}
function GlobalSearch({ data, close, open, navigate }: { data: WorkspaceData; close: () => void; open: (type: string, record?: unknown) => void; navigate: (view: View, eventId?: string) => void }) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase().trim();
  const matches = <T extends { id: string }>(records: T[], value: (record: T) => string) => records.filter((r) => value(r).toLowerCase().includes(q)).slice(0, 4);
  const people = q ? matches(data.profiles, (p) => p.fullName) : [];
  const events = q ? matches(data.events, (e) => e.title) : [];
  const items = q ? matches(data.procurements, (p) => p.itemName) : [];
  const circulars = q ? matches(data.circulars, (c) => c.title) : [];
  const hasResults = people.length + events.length + items.length + circulars.length > 0;
  const choose = (fn: () => void) => { close(); fn(); };
  return <Modal title="Find your way around the unit." subtitle="Members, events, checklist items, and circulars." onClose={close} wide><div className="global-search-field"><Search size={21} /><input placeholder="Start with a name, an event, or an idea…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search workspace" /><kbd>ESC</kbd></div><div className="global-search-results">{!q ? <div className="search-suggestions"><span className="eyebrow">QUICK DIRECTIONS</span>{[{ view: "dues" as View, label: "Membership dues & treasury", icon: Wallet }, { view: "procurement" as View, label: "Event procurement checklist", icon: ClipboardList }, { view: "resources" as View, label: "Science resource archive", icon: BookOpen }].map((item) => <button key={item.view} onClick={() => choose(() => navigate(item.view))}><item.icon size={17} /><span>{item.label}</span><ArrowUpRight size={15} /></button>)}</div> : !hasResults ? <div className="search-no-results"><Search size={27} /><h3>No results for “{query}”</h3><p>Try a member’s name, “science”, or a checklist item.</p></div> : <>{people.length > 0 && <div className="search-result-group"><span>MEMBERS</span>{people.map((p) => <button key={p.id} onClick={() => choose(() => { if (data.profiles.find((p) => p.id === data.currentUserId)?.role !== "member") open("dues", { memberId: p.id }); else navigate("members"); })}><Avatar person={p} size="small" /><span><strong>{p.fullName}</strong><small>{p.role} · {identity.unit}</small></span><ArrowUpRight size={14} /></button>)}</div>}{events.length > 0 && <div className="search-result-group"><span>EVENTS</span>{events.map((e) => <button key={e.id} onClick={() => choose(() => open("event", e))}><CalendarDays size={18} /><span><strong>{e.title}</strong><small>{e.location}</small></span><ArrowUpRight size={14} /></button>)}</div>}{items.length > 0 && <div className="search-result-group"><span>PROCUREMENT</span>{items.map((p) => <button key={p.id} onClick={() => choose(() => navigate("procurement", p.eventId))}><Package size={18} /><span><strong>{p.itemName}</strong><small>{p.quantity} · {p.status}</small></span><ArrowUpRight size={14} /></button>)}</div>}{circulars.length > 0 && <div className="search-result-group"><span>NOTICE BOARD</span>{circulars.map((c) => <button key={c.id} onClick={() => choose(() => open("circular", c))}><Megaphone size={18} /><span><strong>{c.title}</strong><small>{c.category}</small></span><ArrowUpRight size={14} /></button>)}</div>}</>}</div><div className="search-keyboard-hint"><Command size={12} /> K to open search from anywhere<span>Curiosity is a good place to start.</span></div></Modal>;
}
function InfoSymbol() { return <CircleHelp size={19} />; }
