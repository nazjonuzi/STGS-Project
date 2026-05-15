// ============================================================
// AppShell  Main layout wrapper used by all dashboard pages
// Sidebar navigation changes based on current user's role
// ============================================================

import { useState } from "react";
import { useApp } from "../../context/AppContext";
import RoleSwitcher from "./RoleSwitcher";

//  Nav config per role 
const NAV_ITEMS = {
  Applicant: [
    { id: "dashboard", label: "nav.myApplications" },
    { id: "submit",    label: "nav.newApplication" },
    { id: "documents", label: "nav.myDocuments" },
  ],
  ScientificCouncil: [
    { id: "review",    label: "nav.reviewQueue" },
    { id: "history",   label: "nav.reviewHistory" },
  ],
  DeansOffice: [
    { id: "review",    label: "nav.finalApproval" },
    { id: "history",   label: "nav.decisionHistory" },
  ],
  Administrator: [
    { id: "admin",        label: "nav.dashboard" },
    { id: "budget",       label: "nav.budget" },
    { id: "users",        label: "nav.users" },
    { id: "records",      label: "nav.records" },
    { id: "auditlog",     label: "nav.audit" },
  ],
};

//  Sidebar 
function Sidebar({ activePage, onNavigate }) {
  const { state, t } = useApp();
  const role = state.currentUser?.role || "Applicant";
  const items = NAV_ITEMS[role] || NAV_ITEMS.Applicant;

  return (
    <aside style={{
      width: "var(--sidebar-width)",
      minHeight: "100vh",
      background: "linear-gradient(180deg, #003B5C 0%, #002F49 100%)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      position: "sticky",
      top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 20,
          color: "var(--gold-light)",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
        }}>
          STGS
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Science Travel Grants
        </div>
        <div style={{
          fontSize: 10, color: "rgba(255,255,255,0.32)",
          marginTop: 2, letterSpacing: "0.04em",
        }}>
          FCSE / UKIM
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 0", flex: 1 }}>
        {items.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                width: "100%",
                padding: "10px 20px",
                background: isActive ? "rgba(255,255,255,0.09)" : "transparent",
                border: "none",
                borderLeft: isActive ? "3px solid var(--gold)" : "3px solid transparent",
                color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.68)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.background = "transparent"; } }}
            >
              <span>{t(item.label)}</span>
            </button>
          );
        })}
      </nav>

      {/* Role badge at bottom */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        fontSize: 11,
        color: "rgba(255,255,255,0.35)",
        lineHeight: 1.5,
      }}>
        <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
          Logged in as
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
          {state.currentUser?.name}
        </div>
        <div style={{
          display: "inline-block",
          marginTop: 4,
          padding: "2px 8px",
          background: "rgba(200,151,42,0.2)",
          color: "var(--gold-light)",
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.05em",
        }}>
          {role.replace(/([A-Z])/g, " $1").trim()}
        </div>
      </div>
    </aside>
  );
}

//  Header 
function Header({ title, subtitle }) {
  const { state, setLanguage } = useApp();
  return (
    <header style={{
      height: "var(--header-height)",
      background: "var(--white)",
      borderBottom: "1.5px solid var(--border-light)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "var(--shadow-sm)",
    }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{subtitle}</p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <select
          value={state.language}
          onChange={(event) => setLanguage(event.target.value)}
          style={{
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius)",
            padding: "7px 10px",
            fontSize: 12,
            color: "var(--text-secondary)",
            background: "var(--white)",
          }}
        >
          <option value="en">EN</option>
          <option value="sq">SQ</option>
          <option value="mk">MK</option>
        </select>
        <RoleSwitcher />
      </div>
    </header>
  );
}

//  AppShell 
export default function AppShell({ activePage, onNavigate, pageTitle, pageSubtitle, children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header title={pageTitle} subtitle={pageSubtitle} />
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
