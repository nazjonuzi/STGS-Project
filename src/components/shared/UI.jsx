// ============================================================
// Shared UI Primitives  used across all modules
// ============================================================

import { useState } from "react";
import { STATUS_CONFIG, ROLE_LABELS } from "../../data/mockData";
import { useApp } from "../../context/AppContext";

//  Card 
export function Card({ children, style = {}, padding = "24px" }) {
  return (
    <div style={{
      background: "var(--white)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-light)",
      boxShadow: "var(--shadow-sm)",
      padding,
      ...style,
    }}>
      {children}
    </div>
  );
}

//  StatCard 
export function StatCard({ label, value, sub, accent = false, icon }) {
  return (
    <div style={{
      background: "var(--white)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-light)",
      borderTop: `3px solid ${accent ? "var(--gold)" : "var(--navy-muted)"}`,
      boxShadow: "var(--shadow-sm)",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
    }}>
      {icon && <div style={{ display: "none" }}>{icon}</div>}
      <div style={{
        fontSize: 28, fontWeight: 700,
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: "var(--text-primary)",
        letterSpacing: 0,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

//  StatusBadge 
export function StatusBadge({ status }) {
  const { t } = useApp();
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#6B7280" };
  const labelKey = status === "UnderReview" ? "underReview" : String(status).toLowerCase();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: `${cfg.color}18`,
      color: cfg.color,
      border: `1px solid ${cfg.color}40`,
      letterSpacing: "0.02em",
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: cfg.color, flexShrink: 0,
      }} />
      {t(`common.${labelKey}`) || cfg.label}
    </span>
  );
}

//  RoleBadge 
const ROLE_BADGE_COLORS = {
  Applicant:       { bg: "#EFF6FF", text: "#1D4ED8" },
  ScientificCouncil: { bg: "#F0FDF4", text: "#166534" },
  DeansOffice:     { bg: "#FFF7ED", text: "#9A3412" },
  Administrator:   { bg: "#FDF4FF", text: "#7E22CE" },
};

export function RoleBadge({ role }) {
  const c = ROLE_BADGE_COLORS[role] || { bg: "#F3F4F6", text: "#374151" };
  return (
    <span style={{
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.text,
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

//  Button 
export function Button({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }) {
  const variants = {
    primary:   { bg: "var(--navy)", color: "#fff", border: "var(--navy)" },
    secondary: { bg: "transparent", color: "var(--navy)", border: "var(--border)" },
    danger:    { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    gold:      { bg: "var(--gold)", color: "#fff", border: "var(--gold)" },
    ghost:     { bg: "transparent", color: "var(--text-secondary)", border: "transparent" },
  };
  const sizes = {
    sm: { padding: "5px 12px", fontSize: 12 },
    md: { padding: "8px 18px", fontSize: 13 },
    lg: { padding: "11px 24px", fontSize: 14 },
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: "var(--radius)",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
        letterSpacing: 0,
        ...s,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

//  Modal 
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,30,60,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--white)",
        borderRadius: "var(--radius-lg)",
        width: "100%", maxWidth: width,
        boxShadow: "var(--shadow-lg)",
        animation: "slideIn 0.2s ease",
        overflow: "hidden",
      }}>
        <style>{`@keyframes slideIn { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-light)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: 20, lineHeight: 1, padding: 4,
          }}></button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}

//  Alert 
export function Alert({ type = "error", message, onDismiss }) {
  if (!message) return null;
  const config = {
    error:   { bg: "#FEF2F2", border: "#FECACA", color: "#B91C1C", label: "Error" },
    success: { bg: "#F0FDF4", border: "#BBF7D0", color: "#166534", label: "Success" },
    info:    { bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8", label: "Info" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#B45309", label: "Warning" },
  };
  const c = config[type];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: "var(--radius)", padding: "12px 16px",
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
      <span style={{ fontSize: 13, color: c.color, flex: 1, fontWeight: 500 }}>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          background: "none", border: "none", cursor: "pointer",
          color: c.color, fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0,
        }}></button>
      )}
    </div>
  );
}

//  SectionHeader 
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      marginBottom: 20,
    }}>
      <div>
        <h2 style={{ fontSize: 20, color: "var(--text-primary)", marginBottom: 3 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

//  EmptyState 
export function EmptyState({ icon = "", message = "No data found." }) {
  return (
    <div style={{
      textAlign: "center", padding: "48px 24px",
      color: "var(--text-muted)",
    }}>
      {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  );
}

//  SearchInput 
export function SearchInput({ value, onChange, placeholder = "Search" }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{
        position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
        color: "var(--text-muted)", fontSize: 14, pointerEvents: "none",
      }}>Search</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "8px 12px 8px 34px",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius)",
          fontSize: 13, color: "var(--text-primary)",
          background: "var(--white)",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "var(--navy-muted)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

//  Select 
export function Select({ value, onChange, options, style = {} }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 28px 7px 10px",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)",
        fontSize: 13,
        color: "var(--text-primary)",
        background: "var(--white)",
        outline: "none",
        cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238896A8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

//  Table 
export function Table({ columns, rows, emptyMessage = "No records found." }) {
  if (!rows || rows.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding: "10px 14px",
                textAlign: "left",
                fontSize: 11, fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                borderBottom: "1.5px solid var(--border-light)",
                background: "var(--cream)",
                whiteSpace: "nowrap",
                width: col.width,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{
              borderBottom: "1px solid var(--border-light)",
              transition: "background 0.1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--cream)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {columns.map((col) => (
                <td key={col.key} style={{
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "var(--text-primary)",
                  verticalAlign: "middle",
                }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

//  ProgressBar 
export function ProgressBar({ value, max, color = "var(--gold)" }) {
  const { t } = useApp();
  const pct = Math.min(100, Math.round((value / max) * 100)) || 0;
  const isOver80 = pct >= 80;
  return (
    <div>
      <div style={{
        height: 8, background: "var(--border-light)",
        borderRadius: 4, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: isOver80 ? "#EF4444" : color,
          borderRadius: 4,
          transition: "width 0.4s ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{pct}% {t("admin.allocatedPercent")}</span>
        <span style={{ fontSize: 11, color: isOver80 ? "#EF4444" : "var(--text-muted)" }}>
          {max - value > 0 ? `EUR ${(max - value).toLocaleString()} ${t("admin.remaining")}` : "Budget full"}
        </span>
      </div>
    </div>
  );
}
