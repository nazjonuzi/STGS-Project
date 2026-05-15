// ============================================================
// AuditLog OR-3: logs all system events
// Login attempts, submissions, approvals, rejections,
// cancellations, deletions, role changes
// ============================================================

import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Card, SectionHeader, SearchInput, Select, Table, StatCard, EmptyState } from "../shared/UI";

const ACTION_CONFIG = {
  Login:         { color: "#8B5CF6", bg: "#F5F3FF", label: "Login" },
  Submitted:     { color: "#3B82F6", bg: "#EFF6FF", label: "Submitted" },
  Approved:      { color: "#10B981", bg: "#F0FDF4", label: "Approved" },
  Rejected:      { color: "#EF4444", bg: "#FEF2F2", label: "Rejected" },
  Canceled:      { color: "#6B7280", bg: "#F3F4F6", label: "Canceled" },
  Deleted:       { color: "#DC2626", bg: "#FEF2F2", label: "Deleted" },
  RoleChanged:   { color: "#F59E0B", bg: "#FFFBEB", label: "Role Changed" },
  UserActivated: { color: "#10B981", bg: "#F0FDF4", label: "Activated" },
  UserDeactivated: { color: "#EF4444", bg: "#FEF2F2", label: "Deactivated" },
};

const actionOptions = [
  { value: "", label: "All Actions" },
  ...Object.entries(ACTION_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
];

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || { color: "#6B7280", bg: "#F3F4F6", label: action };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export default function AuditLog() {
  const { state } = useApp();
  const { auditLogs } = state;

  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const filtered = auditLogs.filter((log) => {
    const q = search.toLowerCase();
    const matchSearch =
      log.userName.toLowerCase().includes(q) ||
      (log.targetID && log.targetID.toLowerCase().includes(q)) ||
      log.details.toLowerCase().includes(q) ||
      log.logID.toLowerCase().includes(q);
    const matchAction = !filterAction || log.action === filterAction;
    return matchSearch && matchAction;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Action counts for stat cards
  const actionCounts = auditLogs.reduce((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});

  const columns = [
    {
      key: "logID",
      label: "Log ID",
      width: 80,
      render: (v) => <code style={{ fontSize: 10, color: "var(--text-muted)" }}>{v}</code>,
    },
    {
      key: "timestamp",
      label: "Timestamp",
      width: 150,
      render: (v) => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>
            {new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {new Date(v).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>
      ),
    },
    {
      key: "userName",
      label: "User",
      render: (v, row) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
          <code style={{ fontSize: 10, color: "var(--text-muted)" }}>{row.userID}</code>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      width: 130,
      render: (v) => <ActionBadge action={v} />,
    },
    {
      key: "targetID",
      label: "Target",
      width: 90,
      render: (v) => v
        ? <code style={{ fontSize: 11, color: "var(--navy-muted)", fontWeight: 600 }}>{v}</code>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>None</span>,
    },
    {
      key: "details",
      label: "Details",
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span>,
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Audit Log"
        subtitle="Complete system activity trail logins, submissions, approvals, rejections, cancellations, deletions (OR-3)"
      />

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard icon="" label="Total Events"  value={auditLogs.length} />
        <StatCard icon="" label="Logins"         value={actionCounts.Login || 0} />
        <StatCard icon="" label="Approvals"      value={actionCounts.Approved || 0} />
        <StatCard icon="" label="Rejections"     value={actionCounts.Rejected || 0} />
        <StatCard icon="" label="Deletions"     value={actionCounts.Deleted || 0} />
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 20 }} padding="14px 18px">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by user, target, or details" />
          </div>
          <Select value={filterAction} onChange={(v) => { setFilterAction(v); setPage(1); }} options={actionOptions} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card padding="0">
        {paged.length === 0
          ? <EmptyState icon="" message="No audit events match the current filter." />
          : <Table columns={columns} rows={paged} />
        }

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border-light)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Page {page} of {totalPages} | {filtered.length} total events
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "5px 12px", fontSize: 12, borderRadius: "var(--radius)",
                  border: "1.5px solid var(--border)", background: "var(--white)",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.4 : 1,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: "5px 10px", fontSize: 12, borderRadius: "var(--radius)",
                      border: `1.5px solid ${p === page ? "var(--navy)" : "var(--border)"}`,
                      background: p === page ? "var(--navy)" : "var(--white)",
                      color: p === page ? "#fff" : "var(--text-primary)",
                      cursor: "pointer",
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontWeight: p === page ? 700 : 400,
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "5px 12px", fontSize: 12, borderRadius: "var(--radius)",
                  border: "1.5px solid var(--border)", background: "var(--white)",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  opacity: page === totalPages ? 0.4 : 1,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                Next 
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Compliance note */}
      <div style={{
        marginTop: 16, padding: "12px 16px",
        background: "var(--cream)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius)",
        fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
      }}>
        <strong>OR-3 Audit & Logging Policy:</strong> All login attempts, application submissions,
        approvals, rejections, cancellations, role changes, and record deletions are automatically
        logged with a timestamp and user attribution. Logs are read-only and cannot be modified.
      </div>
    </div>
  );
}
