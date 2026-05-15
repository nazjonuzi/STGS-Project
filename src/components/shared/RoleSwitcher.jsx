// ============================================================
// RoleSwitcher  Simulated "login" for demo/prototype
// Lets any team member switch between all four user roles
// Visible in the top-right corner of the header at all times
// ============================================================

import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ROLE_LABELS } from "../../data/mockData";

const ROLE_COLORS = {
  Applicant:       { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  ScientificCouncil: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  DeansOffice:     { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
  Administrator:   { bg: "#FDF4FF", text: "#7E22CE", border: "#E9D5FF" },
};

export default function RoleSwitcher() {
  const { state, logout, t } = useApp();
  const [open, setOpen] = useState(false);

  const current = state.currentUser;
  if (!current) return null;
  const colors = ROLE_COLORS[current.role] || ROLE_COLORS.Applicant;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: colors.bg,
          border: `1.5px solid ${colors.border}`,
          borderRadius: "40px",
          padding: "6px 14px 6px 8px",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        <span style={{
          width: 32, height: 32,
          borderRadius: "50%",
          background: colors.text,
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
          fontFamily: "'IBM Plex Sans', sans-serif",
          flexShrink: 0,
        }}>
          {current.name.split(" ").map(w => w[0]).join("").slice(0,2)}
        </span>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: current.role === "Administrator" ? "#7E22CE" : colors.text, lineHeight: 1.2 }}>
            {current.name.split(" ")[0]}
          </div>
          <div style={{ fontSize: 11, color: colors.text, opacity: 0.75, lineHeight: 1.2 }}>
            {ROLE_LABELS[current.role]}
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2" style={{ marginLeft: 2, opacity: 0.7 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "#fff",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            minWidth: 280,
            zIndex: 100,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-light)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}>
              {t("user.signedIn")}
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                {current.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {current.email}
              </div>
              <div style={{
                display: "inline-block",
                marginTop: 8,
                fontSize: 11,
                fontWeight: 700,
                color: colors.text,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 4,
                padding: "2px 8px",
              }}>
                {ROLE_LABELS[current.role]}
              </div>
            </div>

            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => { setOpen(false); logout(); }}
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  borderRadius: "var(--radius)",
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("user.signOut")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
