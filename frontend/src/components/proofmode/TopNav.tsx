import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "./ui";

export default function TopNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const inDemo = location !== "/";
  const close = () => setOpen(false);
  return <header className="pm-nav-wrap"><nav className="pm-nav" aria-label="Main navigation">
    <Link href="/" className="pm-wordmark" onClick={close}><BrandMark /><span>ProofMode</span></Link>
    <button className="pm-btn pm-btn-quiet pm-btn-icon pm-nav-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} type="button">{open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}</button>
    <div className={`pm-nav-links${open ? " pm-nav-open" : ""}`}>
      <a href="/#how" onClick={close}>How it works</a>
      <Link href="/reviewer" onClick={close}>Reviewer report</Link>
      <a href="/#about" onClick={close}>About</a>
      <Link href="/orientation" className="pm-btn pm-btn-secondary" onClick={close}>{inDemo ? "Demo start" : "Try the demo"}</Link>
    </div>
  </nav></header>;
}
