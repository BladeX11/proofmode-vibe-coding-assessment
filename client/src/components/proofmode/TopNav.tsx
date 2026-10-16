import { Link, useLocation } from "wouter";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "./ui";

export default function TopNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const inDemo = location !== "/";
  const close = () => setOpen(false);
  return <header className="topnav-wrap"><nav className="topnav" aria-label="Main navigation">
    <Link href="/" className="wordmark" onClick={close}><BrandMark /><span>ProofMode</span><span className="wordmark-dot">®</span></Link>
    <button className="menu-toggle icon-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    <div className={`nav-links${open ? " nav-open" : ""}`}>
      <a href="/#how" onClick={close}>How it works</a>
      <Link href="/reviewer" onClick={close}>For reviewers</Link>
      <a href="/#about" onClick={close}>About</a>
      {inDemo ? <Link href="/orientation" className="nav-launch" onClick={close}>Demo hub <ArrowUpRight size={14} /></Link> : <Link href="/orientation" className="nav-launch" onClick={close}>Launch demo <ArrowUpRight size={14} /></Link>}
    </div>
  </nav></header>;
}
