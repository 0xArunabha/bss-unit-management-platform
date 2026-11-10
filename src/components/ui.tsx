"use client";

import { ArrowUpRight, Check, ChevronDown, Download, LoaderCircle, Search, X, type LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { initials, type Profile } from "@/lib/types";

export function Avatar({ person, size = "normal" }: { person: Pick<Profile, "fullName" | "avatarColor">; size?: "small" | "normal" | "large" }) {
  return <span className={`avatar avatar-${size} avatar-${person.avatarColor}`} title={person.fullName}>{initials(person.fullName)}</span>;
}
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot" />{children}</span>;
}
export function Button({ children, onClick, variant = "primary", icon: Icon, type = "button", disabled = false, className = "", title }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "text" | "dark"; icon?: LucideIcon; type?: "button" | "submit"; disabled?: boolean; className?: string; title?: string }) {
  return <button type={type} className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled} title={title}>{Icon && <Icon size={15} strokeWidth={1.8} />}{children}</button>;
}
export function SectionTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return <div className="section-title"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}</div>;
}
export function EmptyState({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={26} strokeWidth={1.5} /></span><h3>{title}</h3><p>{description}</p>{children}</div>;
}
export function SearchInput({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="search-input"><Search size={16} /><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />{value && <button aria-label="Clear search" onClick={() => onChange("")}><X size={14} /></button>}</div>;
}
export function Select({ children, value, onChange, label }: { children: ReactNode; value: string; onChange: (v: string) => void; label: string }) {
  return <div className="select-wrap"><select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select><ChevronDown size={14} /></div>;
}
/** Length of the modal/sheet exit animation. Keep in sync with `.modal-closing` in globals.css. */
export const MODAL_EXIT_MS = 200;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Wrap whatever renders a <Modal> in this, with `value` true while that modal should play its exit animation. */
const ModalExitContext = createContext(false);
export const ModalExiting = ModalExitContext.Provider;

/**
 * Exit animation for a modal host. `close()` flags the modal as leaving, then calls `remove` once the animation has
 * played (straight away when the person prefers reduced motion). A second `close()` while it is leaving is ignored,
 * so a double tap cannot close twice. `cancel()` abandons a pending exit, e.g. because another modal is taking over.
 * Pass `exiting` to <ModalExiting>.
 */
export function useModalExit(remove: () => void) {
  const [exiting, setExiting] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const removeRef = useRef(remove);
  useEffect(() => { removeRef.current = remove; });
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const close = useCallback(() => {
    if (timer.current !== undefined) return;
    if (prefersReducedMotion()) { removeRef.current(); return; }
    setExiting(true);
    timer.current = window.setTimeout(() => { timer.current = undefined; removeRef.current(); setExiting(false); }, MODAL_EXIT_MS);
  }, []);
  const cancel = useCallback(() => {
    if (timer.current === undefined) return;
    window.clearTimeout(timer.current); timer.current = undefined; setExiting(false);
  }, []);
  return { exiting, close, cancel };
}

// Several modals can be open at once (search over a dialog). A shared counter keeps the page locked until the last one
// goes; if each one saved and restored the previous value itself, closing them together could leave the page locked.
let scrollLocks = 0;
let scrollBefore = "";
function lockPageScroll() {
  if (scrollLocks++ === 0) { scrollBefore = document.body.style.overflow; document.body.style.overflow = "hidden"; }
}
function unlockPageScroll() {
  if (--scrollLocks === 0) document.body.style.overflow = scrollBefore;
}

export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // Parents often pass a fresh function every render; keep the latest in a ref so the effect below runs once per open.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  const didDrag = useRef(false);
  const exiting = useContext(ModalExitContext);
  // A newer modal can take over this element while it is still leaving (a quick tap during the exit animation).
  // Whatever a swipe-to-dismiss left on the sheet would then hide the new modal, so put it back.
  useEffect(() => {
    if (exiting) return;
    const sheet = ref.current, backdrop = sheet?.parentElement;
    if (!sheet || !backdrop) return;
    sheet.classList.remove("sheet-dragged"); sheet.style.transform = ""; sheet.style.transition = ""; backdrop.style.opacity = "";
  }, [exiting]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    lockPageScroll();
    const timer = setTimeout(() => { const el = ref.current?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select") || ref.current?.querySelector<HTMLElement>("button"); el?.focus(); }, 80);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "Tab") {
        const focusable = ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => { clearTimeout(timer); unlockPageScroll(); document.removeEventListener("keydown", handleKey); previous?.focus(); };
  }, []);

  // Bottom-sheet layout (phones): drag the handle or the title area downwards to dismiss.
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const sheet = ref.current;
    const target = event.target as HTMLElement;
    if (!sheet || !window.matchMedia("(max-width: 640px)").matches) return;
    if (!target.closest(".modal-drag-handle, .modal-heading") || target.closest("button")) return;
    const backdrop = sheet.parentElement as HTMLElement;
    const startY = event.clientY;
    let lastY = startY, lastT = event.timeStamp, velocity = 0, active = false;
    didDrag.current = false;
    const move = (e: PointerEvent) => {
      const dy = Math.max(0, e.clientY - startY);
      if (!active) {
        if (dy < 6) return;
        active = true; didDrag.current = true;
        sheet.classList.add("sheet-dragged"); // stops the entrance animation from overriding our transform
        sheet.style.transition = "none";
      }
      const dt = e.timeStamp - lastT;
      if (dt > 0) velocity = (e.clientY - lastY) / dt;
      lastY = e.clientY; lastT = e.timeStamp;
      sheet.style.transform = `translate3d(0, ${dy}px, 0)`;
      backdrop.style.opacity = String(Math.max(0.35, 1 - dy / (sheet.offsetHeight * 1.2)));
    };
    const end = (e: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (!active) return;
      const dy = Math.max(0, e.clientY - startY);
      if (e.timeStamp - lastT > 80) velocity = 0; // the finger rested before lifting, so it was not a flick
      if (e.type === "pointerup" && (dy > 110 || velocity > 0.6)) {
        sheet.style.transition = `transform ${MODAL_EXIT_MS}ms cubic-bezier(0.4, 0, 1, 1)`;
        sheet.style.transform = "translate3d(0, 100%, 0)";
        onCloseRef.current();
      } else {
        sheet.style.transition = "transform 260ms cubic-bezier(0.16, 1, 0.3, 1)";
        sheet.style.transform = "translate3d(0, 0, 0)";
        backdrop.style.opacity = "";
        window.setTimeout(() => { sheet.style.transition = ""; sheet.style.transform = ""; }, 280);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return (
    <div className={`modal-backdrop${exiting ? " modal-closing" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onCloseRef.current(); }}>
      <div ref={ref} className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} onPointerDown={startDrag}>
        <div className="modal-drag-handle" aria-hidden="true" onClick={() => { if (didDrag.current) { didDrag.current = false; return; } onCloseRef.current(); }} />
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={() => onCloseRef.current()} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function FormField({ label, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
  return <label className="form-field"><span>{label}{required && <span className="required"> *</span>}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return <Button type="submit" disabled={busy} icon={busy ? LoaderCircle : Check} className={busy ? "is-loading" : ""}>{busy ? "Saving…" : children}</Button>;
}
export function PageHeading({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading"> <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1><p>{description}</p></div><div className="page-actions">{children}</div></div>;
}
export function ArrowLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button className="arrow-link" onClick={onClick}>{children}<ArrowUpRight size={15} /></button>;
}
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = "\uFEFF" + rows.map((row) => row.map((cell) => { let value = String(cell); if (/^[=+\-@\t\r]/.test(value)) value = "'" + value; return `"${value.replaceAll('"', '""')}"`; }).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
export function ExportButton({ onClick }: { onClick: () => void }) { return <Button variant="secondary" icon={Download} onClick={onClick}>Export</Button>; }
export function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}
