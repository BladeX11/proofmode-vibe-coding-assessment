import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowUpRight, Check, X } from "lucide-react";
import type { EvidenceItem } from "@/contexts/DemoContext";

export function BrandMark({ small = false }: { small?: boolean }) {
  return <span className={`brand-mark${small ? " brand-mark-small" : ""}`} aria-hidden="true"><b>⟨</b><i>•</i><b>⟩</b></span>;
}
export function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "quiet"; className?: string }) {
  return <a className={`button button-${variant} ${className}`} href={href}>{children}</a>;
}
export function ActionButton({ children, onClick, variant = "primary", disabled = false, className = "", type = "button" }: { children: React.ReactNode; onClick: () => void; variant?: "primary" | "secondary" | "quiet"; disabled?: boolean; className?: string; type?: "button" | "submit" }) {
  return <button className={`button button-${variant} ${className}`} type={type} onClick={onClick} disabled={disabled}>{children}</button>;
}
export function Panel({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`panel ${className}`}>{children}</section>;
}
export function Eyebrow({ children, color = "green" }: { children: React.ReactNode; color?: "green" | "cyan" | "magenta" | "red" }) {
  return <span className={`eyebrow eyebrow-${color}`}>{children}</span>;
}
export function StatusBadge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "cyan" | "magenta" | "red" | "muted" }) {
  return <span className={`status-badge status-${tone}`}><span className="status-dot" aria-hidden="true" />{children}</span>;
}
export function SectionHeading({ label, title, description, tone = "green" }: { label: string; title: string; description?: string; tone?: "green" | "cyan" | "magenta" }) {
  return <div className="section-heading"><Eyebrow color={tone}>{label}</Eyebrow><h2>{title}</h2>{description && <p>{description}</p>}</div>;
}
export function EvidenceLink({ item, onOpen, compact = false }: { item: EvidenceItem; onOpen: (item: EvidenceItem) => void; compact?: boolean }) {
  return <button className={`evidence-link${compact ? " evidence-link-compact" : ""}`} onClick={() => onOpen(item)} type="button"><span className="evidence-id">{item.id}</span><span>{compact ? "View evidence" : item.title}</span><ArrowUpRight size={14} aria-hidden="true" /></button>;
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
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="evidence-dialog" role="dialog" aria-modal="true" aria-labelledby="evidence-title" tabIndex={-1} ref={dialogRef} onKeyDown={containTab}>
      <div className="dialog-top"><Eyebrow color="cyan">Evidence record / {item.id}</Eyebrow><button className="icon-button" onClick={onClose} aria-label="Close evidence"><X size={18} /></button></div>
      <h2 id="evidence-title">{item.title}</h2><p className="dialog-detail">{item.detail}</p>
      <div className="dialog-source"><Check size={15} /> Linked to this task’s recorded evidence</div>
      <ActionButton onClick={onClose} variant="secondary">Close evidence</ActionButton>
    </div>
  </div>;
}
