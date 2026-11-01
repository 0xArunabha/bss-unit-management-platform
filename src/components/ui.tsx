"use client";

import { ArrowUpRight, Check, ChevronDown, Download, LoaderCircle, Search, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
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
export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => { const el = ref.current?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select") || ref.current?.querySelector<HTMLElement>("button"); el?.focus(); }, 80);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => { clearTimeout(timer); document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", handleKey); previous?.focus(); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-drag-handle" aria-hidden="true" onClick={onClose} />
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
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
