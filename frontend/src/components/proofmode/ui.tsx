import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowUpRight, Check, CircleDot, X } from "lucide-react";
import type { EvidenceItem } from "@/contexts/DemoContext";

type Variant = "primary" | "secondary" | "quiet";
type Tone = "green" | "cyan" | "magenta" | "red" | "muted";

// Legacy tone names map onto verdict meaning: green=pass, red=fail, magenta=pending, the rest neutral.
const BADGE: Record<Tone, { cls: string; icon: typeof Check | null }> = {
  green: { cls: "pm-badge-pass", icon: Check },
  red: { cls: "pm-badge-fail", icon: X },
  magenta: { cls: "pm-badge-pending", icon: CircleDot },
  cyan: { cls: "pm-badge-neutral", icon: null },
  muted: { cls: "pm-badge-neutral", icon: null },
};

export function BrandMark({ small = false }: { small?: boolean }) {
  const size = small ? 22 : 28;
  return <svg className="pm-brand-mark" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
    <rect width="28" height="28" rx="6" fill="var(--pm-ink)" />
    <path d="M7.5 14.5l4.2 4.2 8.8-9.4" fill="none" stroke="var(--pm-paper)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="7" y="21.2" width="14" height="2.4" rx="1.2" fill="var(--pm-mark)" />
  </svg>;
}
export function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: React.ReactNode; variant?: Variant; className?: string }) {
  return <a className={`pm-btn pm-btn-${variant} ${className}`} href={href}>{children}</a>;
}
export function ActionButton({ children, onClick, variant = "primary", disabled = false, className = "", type = "button" }: { children: React.ReactNode; onClick: () => void; variant?: Variant; disabled?: boolean; className?: string; type?: "button" | "submit" }) {
  return <button className={`pm-btn pm-btn-${variant} ${className}`} type={type} onClick={onClick} disabled={disabled}>{children}</button>;
}
export function Panel({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`pm-card ${className}`}>{children}</section>;
}
export function Eyebrow({ children }: { children: React.ReactNode; color?: "green" | "cyan" | "magenta" | "red" }) {
  return <span className="pm-label">{children}</span>;
}
export function StatusBadge({ children, tone = "green" }: { children: React.ReactNode; tone?: Tone }) {
  const { cls, icon: Icon } = BADGE[tone];
  return <span className={`pm-badge ${cls}`}>{Icon && <Icon size={13} aria-hidden="true" />}{children}</span>;
}
export function EvidenceLink({ item, onOpen, compact = false }: { item: EvidenceItem; onOpen: (item: EvidenceItem) => void; compact?: boolean }) {
  return <button className="pm-evlink" onClick={() => onOpen(item)} type="button"><span className="pm-evref">{item.id}</span><span>{compact ? "View evidence" : item.title}</span><ArrowUpRight size={14} aria-hidden="true" /></button>;
}
export function EvidenceDialog({ item, onClose }: { item: EvidenceItem | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!item) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previousFocus.current?.focus();
    };
  }, [item, onClose]);
  if (!item) return null;
  const containTab = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return <div className="pm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="pm-dialog" role="dialog" aria-modal="true" aria-labelledby="evidence-title" tabIndex={-1} ref={dialogRef} onKeyDown={containTab}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span className="pm-label">Evidence record <span className="pm-evref">{item.id}</span></span>
        <button className="pm-btn pm-btn-quiet pm-btn-icon" onClick={onClose} aria-label="Close evidence" type="button"><X size={18} aria-hidden="true" /></button>
      </div>
      <h2 id="evidence-title" className="pm-h3">{item.title}</h2>
      <p className="pm-prose" style={{ margin: 0 }}><span className="pm-mark">{item.detail}</span></p>
      <p className="pm-micro" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}><Check size={14} aria-hidden="true" /> Linked to this task’s recorded evidence</p>
      <ActionButton onClick={onClose} variant="secondary">Close evidence</ActionButton>
    </div>
  </div>;
}
