"use client";

import { identity } from "@/lib/identity";
import { authClient } from "@/lib/auth-client";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Atom, Bell, BookOpen, CalendarDays, Check, CheckCheck, ChevronDown, ChevronRight, ChevronsUpDown, CircleCheck, CircleHelp, ClipboardList, CloudLightning, Command, ExternalLink, Flame, HeartHandshake, IdCard, KeyRound, LayoutDashboard, LogIn, LogOut, MapPin, Megaphone, Menu, Package, RefreshCw, Search, Settings, User, Users, Wallet, WifiOff, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type TouchEvent as ReactTouchEvent } from "react";
import { type WorkspaceData, type View, type ActionResult, type Role } from "@/lib/types";
import { enqueueOfflineAction, getPendingOfflineActions, subscribeOfflineQueue, syncOfflineQueue } from "@/lib/offline-queue";
import { Avatar, Badge, Button, Modal, ModalExiting, relativeTime, useModalExit } from "@/components/ui";
import { Overview } from "@/components/overview";
import { MembersView, DuesView, DonationsView } from "@/components/people-views";
import { CircularsView, CampaignsView, EventsView, ProcurementView, ResourcesView, SettingsView } from "@/components/field-views";
import { WorkspaceModals, type ModalState } from "@/components/workspace-modals";
import { LoginScreen } from "@/components/login-screen";
import { hapticTap, hapticSuccess, hapticWarning } from "@/lib/haptics";
import { I18nProvider, useI18n, type Locale } from "@/lib/i18n";
import { localizeData } from "@/lib/localize-content";
import { isCampaignEvent, hydrateCampaignEvent } from "@/lib/campaign-data";
import { useFirstFlush, FirstFlushLeaves } from "@/components/first-flush-easter-egg";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function Workspace({ initialData, initialGoogleEmail, initialLocale }: { initialData: WorkspaceData; initialGoogleEmail?: string | null; initialLocale?: Locale }) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <WorkspaceInner initialData={initialData} initialGoogleEmail={initialGoogleEmail} />
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

function WorkspaceInner({ initialData, initialGoogleEmail }: { initialData: WorkspaceData; initialGoogleEmail?: string | null }) {
  const { locale, setLocale, t, tx, ts, tc, num, fmtDate, roleName } = useI18n();
  const identityRef = identity;
  const [data, setData] = useState(initialData);
  // What the screens show: the same data, with the app's own sample content and activity lines in the chosen language.
  const shown = useMemo(() => localizeData(data, { locale, t, tc, ts }), [data, locale, t, tc, ts]);
  const [view, setView] = useState<View>("overview");
  const [eventFilter, setEventFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [popover, setPopover] = useState<"notifications" | "account" | "sidebarAccount" | null>(null);
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
    overview: t("Overview"),
    members: t("Members"),
    dues: t("Membership dues"),
    donations: t("Donations"),
    campaigns: t("Campaigns"),
    events: t("Events calendar"),
    procurement: t("Procurement"),
    circulars: t("Circulars & notices"),
    resources: t("Science resources"),
    settings: t("Unit settings"),
  };

  const currentUser = data.profiles.find((p) => p.id === data.currentUserId);
  const userRole: Role = (data.currentUserRole || currentUser?.role || (guestMode ? "guest" : (data.currentUserId ? "member" : "guest"))) as Role;
  const isGuest = userRole === "guest" || guestMode;
  const isExecutive = userRole === "admin";
  const isVolunteerOrOrganizer = userRole === "volunteer" || userRole === "organizer";

  const user = (isGuest || !currentUser)
    ? {
        id: "",
        fullName: t("Public Visitor"),
        phone: null,
        role: "guest" as Role,
        status: "active",
        monthlyPledge: 0,
        avatarColor: "sand",
        unpaidMonths: 0,
        createdAt: new Date().toISOString(),
      }
    : currentUser;

  const navItems: { view: View; label: string; icon: LucideIcon }[] = isGuest
    ? [
        { view: "overview", label: t("Overview"), icon: LayoutDashboard },
        { view: "campaigns", label: t("Campaigns"), icon: Flame },
        { view: "events", label: t("Events calendar"), icon: CalendarDays },
      ]
    : userRole === "member"
    ? [
        { view: "overview", label: t("Overview"), icon: LayoutDashboard },
        { view: "campaigns", label: t("Campaigns"), icon: Flame },
        { view: "events", label: t("Events calendar"), icon: CalendarDays },
        { view: "members", label: t("Members"), icon: Users },
        { view: "dues", label: t("Membership dues"), icon: Wallet },
      ]
    : [
        { view: "overview", label: t("Overview"), icon: LayoutDashboard },
        { view: "campaigns", label: t("Campaigns"), icon: Flame },
        { view: "events", label: t("Events calendar"), icon: CalendarDays },
        { view: "members", label: t("Members"), icon: Users },
        { view: "dues", label: t("Membership dues"), icon: Wallet },
        { view: "donations", label: t("Donations"), icon: HeartHandshake },
        { view: "procurement", label: t("Procurement"), icon: ClipboardList },
      ];

  const knowledgeItems: { view: View; label: string; icon: LucideIcon }[] = isGuest
    ? [
        { view: "resources", label: t("Science resources"), icon: BookOpen },
      ]
    : [
        { view: "circulars", label: t("Circulars & notices"), icon: Megaphone },
        { view: "resources", label: t("Science resources"), icon: BookOpen },
      ];
  const needed = data.procurements.filter((p) => p.status === "needed").length;
  // Five tabs and a top bar share ~390px, so the long sidebar names ("Membership dues") get short forms on phones.
  const shortLabels: Partial<Record<View, string>> = { members: t("Members"), dues: t("Dues"), campaigns: t("Campaigns"), events: t("Calendar"), circulars: t("Circulars"), resources: t("Resources"), settings: t("Settings") };
  const notify = useCallback((message: string) => setToast({ message }), []);
  const { leaves, triggerFirstFlush } = useFirstFlush(notify, locale);
  // Closing plays an exit animation first. Opening another modal while one is still leaving cancels that exit.
  const { exiting: modalExiting, close, cancel: cancelModalExit } = useModalExit(() => { setModal(null); setActionError(""); });
  const open = useCallback((type: string, record?: unknown) => { cancelModalExit(); setPopover(null); setActionError(""); setModal({ type, record }); }, [cancelModalExit]);

  // Phones: stop the page scrolling behind the open drawer, and let the drawer be swiped shut.
  // (A class on <html> rather than an inline body style, because Modal manages body.style.overflow itself.)
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    document.documentElement.classList.toggle("nav-locked", sidebarOpen);
    return () => document.documentElement.classList.remove("nav-locked");
  }, [sidebarOpen]);

  useEffect(() => {
    const viewTitles: Record<View, string> = {
      overview: t("Overview"),
      members: t("Unit Roster"),
      dues: t("Membership Dues"),
      donations: t("Donations Register"),
      campaigns: t("Campaigns"),
      events: t("Events calendar"),
      procurement: t("Procurement Board"),
      circulars: t("Unit Circulars"),
      resources: t("Field Resources"),
      settings: t("Unit Settings"),
    };
    const title = viewTitles[view] || t("Workspace");
    document.title = `${title} · ${t(identity.name)} · ${t(identity.unit)}`;
  }, [view, locale, t]);

  useEffect(() => {
    const h1 = document.querySelector<HTMLElement>("main h1, .workspace-main h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    }
  }, [view]);
  const drawerTouch = useRef<{ x: number; y: number; dx: number; horizontal: boolean | null } | null>(null);
  const onDrawerTouchStart = (e: ReactTouchEvent<HTMLElement>) => {
    const touch = e.touches[0];
    drawerTouch.current = { x: touch.clientX, y: touch.clientY, dx: 0, horizontal: null };
  };
  const onDrawerTouchMove = (e: ReactTouchEvent<HTMLElement>) => {
    const d = drawerTouch.current, el = sidebarRef.current;
    if (!d || !el) return;
    const touch = e.touches[0];
    const dx = touch.clientX - d.x, dy = touch.clientY - d.y;
    // Decide once whether this is a leftward swipe (close) or a vertical scroll of the menu.
    if (d.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) d.horizontal = Math.abs(dx) > Math.abs(dy) && dx < 0;
    if (!d.horizontal) return;
    d.dx = Math.min(0, dx);
    el.classList.add("sidebar-dragging");
    el.style.setProperty("--drawer-drag", `${d.dx}px`);
  };
  const onDrawerTouchEnd = () => {
    const d = drawerTouch.current, el = sidebarRef.current;
    drawerTouch.current = null;
    if (!el) return;
    el.classList.remove("sidebar-dragging");
    el.style.removeProperty("--drawer-drag");
    if (d?.horizontal && d.dx < -70) setSidebarOpen(false);
  };

  useEffect(() => {
    return subscribeOfflineQueue(setOfflineCount);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      notify(t("Still offline. Reconnect to network before syncing."));
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
        notify(t(synced === 1 ? "⚡ Synced {count} field operation successfully with unit server." : "⚡ Synced {count} field operations successfully with unit server.", { count: synced }));
        const fresh = await fetch("/api/workspace").then((r) => r.json()).catch(() => null);
        if (fresh) setData(fresh);
      }
      if (failed > 0) {
        notify(t(failed === 1 ? "⚠️ {count} queued item could not be synced: {reason}" : "⚠️ {count} queued items could not be synced: {reason}", { count: failed, reason: ts(String(errors[0])) }));
      }
    } finally {
      setSyncing(false);
    }
  }, [notify, t, ts]);

  const navigate = useCallback((target: View, eventId?: string) => {
    hapticTap(8);
    let resolvedTarget = target;
    if (isGuest && !["overview", "campaigns", "events", "resources"].includes(target)) {
      resolvedTarget = "overview";
    }
    if (userRole === "member" && ["procurement", "donations"].includes(target)) {
      resolvedTarget = "overview";
    }
    const update = () => {
      setView(resolvedTarget); setSidebarOpen(false); setPopover(null); setSearchOpen(false);
      if (resolvedTarget === "procurement") setEventFilter(eventId || "all");
      const url = resolvedTarget === "overview" ? "/" : `/?view=${resolvedTarget}${eventId ? `&event=${eventId}` : ""}`;
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
  }, [isGuest, userRole]);
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
        const optimisticMsg = t("⚡ Recorded in local offline queue. Will auto-sync when network returns.");
        notify(optimisticMsg);
        return { data, message: optimisticMsg };
      } catch {
        const message = t("Unable to write to local offline queue.");
        setActionError(message); setToast({ message, error: true }); return null;
      } finally {
        setBusy(false);
      }
    }

    try {
      const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...actionPayload }) });
      const result = await response.json();
      if (!response.ok) throw new Error(ts(result.error) || t("Unable to save this record."));
      setData(result.data); lastActivity.current = result.data.activities[0]?.id; setDismissedActivityId(null); notify(ts(result.message));
      hapticSuccess();
      return result as ActionResult;
    } catch (error) {
      hapticWarning();
      // 2. If network dropped mid-request, gracefully fallback to IndexedDB queue with same idempotencyKey
      const isNetworkIssue = !navigator.onLine || (error instanceof TypeError && error.message.toLowerCase().includes("fetch"));
      if (isNetworkIssue) {
        try {
          await enqueueOfflineAction(action, actionPayload);
          const fallbackMsg = t("⚡ Network connection dropped. Safely saved in local offline queue; will sync when reconnected.");
          notify(fallbackMsg);
          return { data, message: fallbackMsg };
        } catch {
          // ignore
        }
      }
      const message = error instanceof Error ? ts(error.message) : t("Please try again.");
      setActionError(message); setToast({ message, error: true }); return null;
    } finally { setBusy(false); }
  }, [data, notify, t, ts]);
  const enablePush = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) { notify(t("This browser doesn’t support Web Push. In-app alerts are still available.")); return; }
    try {
      const config = await fetch("/api/push").then((r) => r.json());
      if (!config.configured) { notify(t("In-app alerts are active. Browser push needs VAPID credentials configured on the server.")); return; }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { notify(t("Notifications weren’t enabled. You can change this in your browser’s site settings.")); return; }
      const registration = await navigator.serviceWorker.ready;
      const key = config.publicKey.replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(key + "=".repeat((4 - key.length % 4) % 4)), (c) => c.charCodeAt(0));
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes.buffer });
      const response = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error(t("Unable to register push notifications. Please try again."));
      setPushEnabled(true); notify(t("You’re connected. Important unit updates can now reach this device."));
    } catch (error) { notify(error instanceof Error ? ts(error.message) : t("Unable to enable browser push.")); }
  }, [notify, t, ts]);
  const installApp = useCallback(async () => {
    if (installPrompt.current) { await installPrompt.current.prompt(); const choice = await installPrompt.current.userChoice; if (choice.outcome === "accepted") notify(t("The unit workspace has been added to your device.")); installPrompt.current = null; }
    else notify(t("Use your browser menu → Install app or Add to Home Screen. On iPhone, use Share → Add to Home Screen."));
  }, [notify, t]);
  const markRead = () => {
    if (latestActivityId) {
      setDismissedActivityId(latestActivityId);
      localStorage.setItem("bss-seen-activity", latestActivityId);
      window.dispatchEvent(new Event("storage"));
    }
  };
  const showReminder = duesReminderPref && (user?.unpaidMonths || 0) > 0;
  const hasActiveCampaign = data.events.some(isCampaignEvent);
  const renderNavItem = (item: { view: View; label: string; icon: LucideIcon }) => (
    <button
      key={item.view}
      className={`nav-item ${view === item.view ? "nav-item-active" : ""}`}
      aria-current={view === item.view ? "page" : undefined}
      onClick={() => navigate(item.view)}
    >
      <item.icon size={18} strokeWidth={1.65} />
      <span>{item.label}</span>
      {item.view === "campaigns" && hasActiveCampaign && (
        <span className="nav-campaign-pill">{t("Live")}</span>
      )}
      {item.view === "procurement" && needed > 0 && <span className="nav-count">{num(needed)}</span>}
      {item.view === "members" && <span className="nav-member-count">{num(data.profiles.length)}</span>}
      {item.view === "circulars" && <span className="nav-new-dot" />}
    </button>
  );

  if (!isAuthorized && !guestMode) {
    return <LoginScreen data={data} perform={perform} onContinueAsGuest={() => setGuestMode(true)} initialGoogleEmail={initialGoogleEmail} />;
  }

  return <div className="workspace-app">
    <button
      className={`sidebar-overlay ${sidebarOpen ? "sidebar-overlay-visible" : ""}`}
      onClick={() => setSidebarOpen(false)}
      aria-label={t("Close navigation")}
      aria-hidden={!sidebarOpen}
      tabIndex={sidebarOpen ? 0 : -1}
    />
    <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`} onTouchStart={onDrawerTouchStart} onTouchMove={onDrawerTouchMove} onTouchEnd={onDrawerTouchEnd} onTouchCancel={onDrawerTouchEnd}>
      <button className="brand" onClick={() => navigate("overview")} aria-label={t("{name} home", { name: t(identity.name) })}>
        <img src="/images/bss-logo.svg" alt="" />
        <span>
          <strong>
            {t(identity.name)}
            <span
              className="brand-period"
              onClick={(e) => {
                e.stopPropagation();
                triggerFirstFlush(e);
              }}
              title={t("Dooars First Flush 🍃")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  triggerFirstFlush();
                }
              }}
            >
              .
            </span>
          </strong>
          <small>{t(`A unit of ${identity.organisation}`)}</small>
        </span>
      </button>
      <div className="unit-selector-wrap">
        <div className="unit-selector unit-badge" title={`${t(identity.unit)} · ${t(identity.state)}`}>
          <span className="unit-symbol">
            <MapPin size={18} strokeWidth={1.5} />
            <i />
          </span>
          <span>
            <strong>{t(identity.unit)}</strong>
            <small>{t(identity.state)}</small>
          </span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label={t("Main navigation")}>
        <div className="nav-group-label">{t("WORKSPACE")}</div>
        {navItems.map(renderNavItem)}
        <div className="nav-group-label knowledge-label">{t("KNOWLEDGE & OUTREACH")}</div>
        {knowledgeItems.map(renderNavItem)}
        {!isGuest && <div className="nav-settings">{renderNavItem({ view: "settings", label: t("Unit settings"), icon: Settings })}</div>}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-mission">
          <Atom size={25} strokeWidth={1.2} />
          <p>{t("Built on curiosity.")}<br /><strong>{t("Powered by people.")}</strong></p>
          <span>{t("Taking science to Jalpaiguri, together.")}</span>
        </div>
        <div className="sidebar-connection">
          <span className={`tiny-dot ${online ? "green" : "orange"}`} />
          {online ? (offlineCount > 0 ? t("{count} to sync", { count: offlineCount }) : t("Workspace online")) : t("Field offline queue")}
          {offlineCount > 0 ? (
            <span className="demo-pill" style={{ background: "var(--rust, #1b4332)", color: "#fff" }}>⚡ {num(offlineCount)}</span>
          ) : (
            <span className="sidebar-version-pill" title={t("Release: {releaseName} · Build {build}", { releaseName: t(identity.releaseName), build: identity.build })}>v{identity.version}</span>
          )}
        </div>
        <div className="sidebar-account-wrap" data-popover>
          <button
            className={`sidebar-account ${popover === "sidebarAccount" ? "sidebar-account-active" : ""}`}
            onClick={isGuest ? () => setGuestMode(false) : () => setPopover(popover === "sidebarAccount" ? null : "sidebarAccount")}
            title={isGuest ? t("Public Access · Click to Sign In") : t("Account menu")}
            aria-expanded={popover === "sidebarAccount"}
            type="button"
          >
            <Avatar person={user} />
            <span>
              <strong>{user.fullName}</strong>
              <small>{isGuest ? t("Public Access · Click to Sign In") : (user.role === "admin" ? t("Unit Executive") : roleName(user.role))}</small>
            </span>
            {isGuest ? <LogIn size={15} /> : <ChevronsUpDown size={15} />}
          </button>
          {!isGuest && popover === "sidebarAccount" && (
            <div className="small-menu sidebar-account-menu">
              <span className="menu-eyebrow">{t("LOGGED IN AS")}</span>
              <strong>{user.fullName}</strong>
              <small>{user.role === "admin" ? t("Unit executive") : roleName(user.role)} · {t(identity.unit)}</small>
              <div className="account-version-note">
                <span>{t("App Release")}</span>
                <strong>v{identity.version}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPopover(null);
                  open("idCard", { member: user });
                }}
              >
                <IdCard size={15} />
                <span>{t("My Member ID Card")}</span>
                <ArrowUpRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPopover(null);
                  navigate("settings");
                }}
              >
                <Settings size={15} />
                <span>{t("Account & Security")}</span>
                <ArrowUpRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPopover(null);
                  open("help");
                }}
              >
                <CircleHelp size={15} />
                <span>{t("Help & Shortcuts")}</span>
                <ArrowUpRight size={13} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  setPopover(null);
                  await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {});
                  window.location.href = "/";
                }}
              >
                <LogOut size={15} />
                <span>{t("Sign Out")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
    <div className="main-shell">
      {guestMode && view !== "overview" && (
        <div className="guest-banner">
          <div className="guest-banner-lead">
            <span className="guest-banner-badge">{t("🚨 ACTIVE CIVIC CAMPAIGN")}</span>
            <span className="guest-banner-text">
              {tx("<strong>Clean Mashkalaibari:</strong> Ending toxic crematorium furnace smoke & river dumping (Phase 2 · 20% Reached)")}
            </span>
          </div>
          <div className="guest-banner-actions">
            <button
              onClick={() => {
                const rawCampaign = shown.events.find(isCampaignEvent);
                const campaign = rawCampaign ? hydrateCampaignEvent(rawCampaign) : undefined;
                if (campaign) open("event", campaign);
                else navigate("campaigns");
              }}
              className="guest-banner-cta"
            >
              {t("View Campaign Action Plan →")}
            </button>
          </div>
        </div>
      )}
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={t("Open main navigation")}><Menu size={21} /></button>
          <span className="breadcrumb-root">
            {t(identity.name)}
            <span
              className="brand-period"
              onClick={(e) => {
                e.stopPropagation();
                triggerFirstFlush(e);
              }}
              title={t("Dooars First Flush 🍃")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  triggerFirstFlush();
                }
              }}
            >
              .
            </span>
          </span>
          <ChevronRight size={13} className="breadcrumb-chevron" />
          <span className="breadcrumb-current"><span className="bc-full">{labels[view]}</span><span className="bc-short">{shortLabels[view] ?? labels[view]}</span></span>
        </div>
        <div className="topbar-right">
          {/* Language Switcher */}
          <div className="lang-toggle-wrap" title="Switch language / ভাষা পরিবর্তন">
            <button
              type="button"
              className={`lang-pill ${locale === "en" ? "lang-pill-active" : ""}`}
              onClick={() => setLocale("en")}
              aria-label={t("Switch language to English")}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-pill ${locale === "bn" ? "lang-pill-active" : ""}`}
              onClick={() => setLocale("bn")}
              aria-label={t("Switch language to Bengali")}
            >
              বাং
            </button>
          </div>

          <button className="global-search-button" onClick={() => setSearchOpen(true)}>
            <Search size={15} />
            <span>{t("Search the unit…")}</span>
            <kbd><Command size={10} />K</kbd>
          </button>
          <span className="topbar-date" suppressHydrationWarning>{fmtDate(new Date(), { weekday: "short", day: "numeric", month: "short" })}</span>
          <button className="icon-button help-topbar" aria-label={t("Workspace help")} title={t("Workspace help")} onClick={() => open("help")}><CircleHelp size={19} strokeWidth={1.5} /></button>
          {isGuest ? (
            <button
              type="button"
              className="topbar-login-btn"
              onClick={() => setGuestMode(false)}
            >
              <LogIn size={14} strokeWidth={2} />
              <span>{t("Member Login")}</span>
            </button>
          ) : (
            <>
              <div className="notifications-wrap" data-popover>
                <button className={`icon-button notification-button ${popover === "notifications" ? "icon-button-selected" : ""}`} aria-label={t("Open notifications")} aria-expanded={popover === "notifications"} onClick={() => setPopover(popover === "notifications" ? null : "notifications")}><Bell size={19} strokeWidth={1.6} />{unread && <span />}</button>
                {popover === "notifications" && (
                  <div className="notifications-popover print-tech-slip">
                    <div className="notification-heading">
                      <div>
                        <h2>{t("Cadre Alerts & Activity")}</h2>
                        <p>{t(identity.fullName)} · {t("Real-time dispatch")}</p>
                      </div>
                      <button className="icon-button" aria-label={t("Mark all notifications as read")} title={t("Mark all as read")} onClick={markRead}><CheckCheck size={18} /></button>
                    </div>
                    {showReminder && (
                      <button className="dues-reminder" onClick={() => { setPopover(null); navigate("dues"); }}>
                        <Wallet size={17} />
                        <span>{t("Monthly membership contribution pending.")}<small>{t("Baseline ₹20/month. Keep the movement active.")}</small></span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                    <div className="notification-items">
                      {shown.activities.slice(0, 6).map((a, i) => (
                        <button className={`notification-item ${unread && i < 2 ? "unread" : ""}`} key={a.id} onClick={() => { markRead(); setPopover(null); navigate(a.type === "dues" ? "dues" : a.type === "donation" ? "donations" : a.type === "circular" ? "circulars" : a.type === "event" ? "events" : "procurement"); }}>
                          <span className={`notification-symbol activity-${a.type}`}>
                            {a.type === "donation" ? <HeartHandshake size={16} /> : a.type === "dues" ? <ArrowDownLeft size={16} /> : a.type === "verified" ? <CircleCheck size={16} /> : <Package size={16} />}
                          </span>
                          <span><strong>{a.title}</strong><small>{a.description}</small><time suppressHydrationWarning>{t("{time} · Action: Click to inspect", { time: relativeTime(a.createdAt, t) })}</time></span>
                          {unread && i < 2 && <i />}
                        </button>
                      ))}
                    </div>
                    <div className="notification-footer">
                      <span className="tiny-dot green" />{t("Service Worker Web Push & In-App Sync Active")}
                      <button onClick={() => { setPopover(null); navigate("settings"); }}>{t("Push settings")}<ArrowUpRight size={12} /></button>
                    </div>
                  </div>
                )}
              </div>
              <span className="topbar-divider" />
              <div className="account-wrap" data-popover>
                <button className="topbar-avatar" onClick={() => setPopover(popover === "account" ? null : "account")} aria-label={t("Open profile menu")}><Avatar person={user} size="small" /><ChevronDown size={12} /></button>
                {popover === "account" && (
                  <div className="small-menu account-menu">
                    <span className="menu-eyebrow">{guestMode ? t("GUEST VISITOR") : (t("LOGGED IN AS"))}</span>
                    <strong>{user.fullName}</strong>
                    <small>{user.role === "admin" ? t("Unit executive") : roleName(user.role)} · {t(identity.unit)}</small>
                    <div className="account-version-note"><span>{t("App Release")}</span><strong>v{identity.version}</strong></div>
                    <button onClick={() => { setPopover(null); open("idCard", { member: user }); }}>
                      <IdCard size={15} />
                      {t("My Member ID Card")}
                      <ArrowUpRight size={13} />
                    </button>
                    <button onClick={() => navigate("settings")}>
                      <Settings size={15} />
                      {t("Account & Security")}
                      <ArrowUpRight size={13} />
                    </button>
                    <button onClick={() => { setPopover(null); open("help"); }}>
                      <CircleHelp size={15} />
                      {t("Help & Shortcuts")}
                      <ArrowUpRight size={13} />
                    </button>
                    <button onClick={async () => {
                      setPopover(null);
                      if (guestMode) {
                        setGuestMode(false);
                      } else {
                        await perform("logout", {});
                        try {
                          await authClient.signOut();
                        } catch {}
                        window.location.href = "/";
                      }
                    }}>
                      <LogOut size={15} />
                      {guestMode ? t("Log In") : t("Sign Out")}
                      <ArrowUpRight size={13} />
                    </button>
                    <a href="https://breakthroughindia.org/" target="_blank" rel="noreferrer">
                      <ExternalLink size={15} />
                      {t("About the society")}
                      <ArrowUpRight size={13} />
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>
      {!online && (
        <div className="offline-banner">
          <WifiOff size={15} />
          <span>{tx("<strong>You’re offline in the field.</strong> Field queue active: dues, procurements, and donations are saved locally in IndexedDB and will auto-sync when network returns.")}</span>
          {offlineCount > 0 && <span className="demo-pill" style={{ marginLeft: "auto", background: "var(--rust, #1b4332)", color: "#fff" }}>{t("⚡ {count} queued", { count: offlineCount })}</span>}
        </div>
      )}
      {online && offlineCount > 0 && (
        <div className="offline-banner" style={{ background: "var(--olive, #6b7f50)", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
          <CloudLightning size={16} />
          <span>{tx(offlineCount === 1 ? "<strong>{count} offline field entry waiting to sync.</strong> Network connection is active." : "<strong>{count} offline field entries waiting to sync.</strong> Network connection is active.", { count: offlineCount })}</span>
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
            {syncing ? t("Syncing...") : t("Sync now")}
          </button>
        </div>
      )}
      <main className="workspace-main" id="main-content">
        <div key={view} className="view-stage">
          {view === "overview" && <Overview data={shown} navigate={navigate} open={open} />}
          {view === "members" && <MembersView data={shown} open={open} perform={perform} />}
          {view === "dues" && <DuesView data={shown} open={open} />}
          {view === "donations" && <DonationsView data={shown} open={open} />}
          {view === "campaigns" && <CampaignsView data={shown} open={open} navigate={navigate} />}
          {view === "events" && <EventsView data={shown} open={open} navigate={navigate} />}
          {view === "procurement" && <ProcurementView data={shown} open={open} navigate={navigate} eventFilter={eventFilter} setEventFilter={setEventFilter} />}
          {view === "circulars" && <CircularsView data={shown} open={open} navigate={navigate} />}
          {view === "resources" && <ResourcesView open={open} data={shown} />}
          {view === "settings" && <SettingsView data={shown} perform={perform} enablePush={() => void enablePush()} pushEnabled={pushEnabled} installApp={() => void installApp()} busy={busy} open={open} />}
        </div>
      </main>
      <nav className="mobile-bottom-nav" aria-label={t("Mobile navigation")}>
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.view}
            className={`bottom-nav-item ${view === item.view ? "bottom-nav-active" : ""}`}
            onClick={() => navigate(item.view)}
            aria-label={item.label}
            aria-current={view === item.view ? "page" : undefined}
          >
            <item.icon size={19} strokeWidth={view === item.view ? 2.2 : 1.7} />
            <span>{shortLabels[item.view] ?? item.label}</span>
            {item.view === "dues" && (user?.unpaidMonths || 0) > 0 && <span className="bottom-nav-dot" />}
            {item.view === "procurement" && needed > 0 && <span className="bottom-nav-badge">{num(needed)}</span>}
          </button>
        ))}
        <button
          className="bottom-nav-item"
          onClick={() => setSidebarOpen(true)}
          aria-label={t("Open navigation drawer")}
        >
          <Menu size={19} strokeWidth={1.7} />
          <span>{t("More")}</span>
        </button>
      </nav>
    </div>
    <ModalExiting value={modalExiting}><WorkspaceModals modal={modal} data={shown} close={close} open={open} perform={perform} busy={busy} error={actionError} navigate={navigate} notify={notify} /></ModalExiting>
    {searchOpen && <GlobalSearch data={shown} close={() => setSearchOpen(false)} open={open} navigate={navigate} />}
    {/* Permanent live region ensuring screen readers announce toasts */}
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {toast?.message || ""}
    </div>
    {toast && <div className={`toast ${toast.error ? "toast-error" : ""}`} role="status">{toast.error ? <InfoSymbol /> : <CircleCheck size={19} />}<span>{toast.message}</span><button onClick={() => setToast(null)} aria-label={t("Dismiss message")}><X size={15} /></button></div>}
    <FirstFlushLeaves leaves={leaves} />
  </div>;
}
function GlobalSearch({ data, close: removeSearch, open, navigate }: { data: WorkspaceData; close: () => void; open: (type: string, record?: unknown) => void; navigate: (view: View, eventId?: string) => void }) {
  const { t, tx, roleName } = useI18n();
  const { exiting, close } = useModalExit(removeSearch);
  const [query, setQuery] = useState("");
  const q = query.toLowerCase().trim();
  const matches = <T extends { id: string }>(records: T[], value: (record: T) => string) => records.filter((r) => value(r).toLowerCase().includes(q)).slice(0, 4);
  const people = q ? matches(data.profiles, (p) => p.fullName) : [];
  const events = q ? matches(data.events, (e) => e.title) : [];
  const items = q ? matches(data.procurements, (p) => p.itemName) : [];
  const circulars = q ? matches(data.circulars, (c) => c.title) : [];
  const hasResults = people.length + events.length + items.length + circulars.length > 0;
  const choose = (fn: () => void) => { close(); fn(); };
  return <ModalExiting value={exiting}><Modal title={t("Find your way around the unit.")} subtitle={t("Members, events, checklist items, and circulars.")} onClose={close} wide><div className="global-search-field"><Search size={21} /><input placeholder={t("Start with a name, an event, or an idea…")} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t("Search workspace")} /><kbd>ESC</kbd></div><div className="global-search-results">{!q ? <div className="search-suggestions"><span className="eyebrow">{t("QUICK DIRECTIONS")}</span>{[{ view: "dues" as View, label: t("Membership dues & treasury"), icon: Wallet }, { view: "procurement" as View, label: t("Event procurement checklist"), icon: ClipboardList }, { view: "resources" as View, label: t("Science resource archive"), icon: BookOpen }].map((item) => <button key={item.view} onClick={() => choose(() => navigate(item.view))}><item.icon size={17} /><span>{item.label}</span><ArrowUpRight size={15} /></button>)}</div> : !hasResults ? <div className="search-no-results"><Search size={27} /><h3>{t("No results for “{query}”", { query })}</h3><p>{t("Try a member’s name, “science”, or a checklist item.")}</p></div> : <>{people.length > 0 && <div className="search-result-group"><span>{t("MEMBERS")}</span>{people.map((p) => <button key={p.id} onClick={() => choose(() => { if (data.profiles.find((p) => p.id === data.currentUserId)?.role !== "member") open("dues", { memberId: p.id }); else navigate("members"); })}><Avatar person={p} size="small" /><span><strong>{p.fullName}</strong><small>{roleName(p.role)} · {t(identity.unit)}</small></span><ArrowUpRight size={14} /></button>)}</div>}{events.length > 0 && <div className="search-result-group"><span>{t("EVENTS")}</span>{events.map((e) => <button key={e.id} onClick={() => choose(() => open("event", e))}><CalendarDays size={18} /><span><strong>{e.title}</strong><small>{e.location}</small></span><ArrowUpRight size={14} /></button>)}</div>}{items.length > 0 && <div className="search-result-group"><span>{t("PROCUREMENT")}</span>{items.map((p) => <button key={p.id} onClick={() => choose(() => navigate("procurement", p.eventId))}><Package size={18} /><span><strong>{p.itemName}</strong><small>{p.quantity} · {t(p.status)}</small></span><ArrowUpRight size={14} /></button>)}</div>}{circulars.length > 0 && <div className="search-result-group"><span>{t("NOTICE BOARD")}</span>{circulars.map((c) => <button key={c.id} onClick={() => choose(() => open("circular", c))}><Megaphone size={18} /><span><strong>{c.title}</strong><small>{c.category}</small></span><ArrowUpRight size={14} /></button>)}</div>}</>}</div><div className="search-keyboard-hint">{tx("{key} to open search from anywhere", { key: <b className="search-hint-key"><Command size={12} />K</b> })}<span>{t("Curiosity is a good place to start.")}</span></div></Modal></ModalExiting>;
}
function InfoSymbol() { return <CircleHelp size={19} />; }
