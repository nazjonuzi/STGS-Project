// ============================================================
// AdminDashboard Overview stats and quick-action cards
// FR-7, FR-8, FR-9, FR-10
// ============================================================

import { useApp } from "../../context/AppContext";
import { StatCard, Card, StatusBadge, Button, ProgressBar } from "../shared/UI";
import { STATUS_CONFIG } from "../../data/mockData";

export default function AdminDashboard({ onNavigate }) {
  const { state, t } = useApp();
  const { applications, users, budget, auditLogs } = state;

  // Quick stats
  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const recentLogs = auditLogs.slice(0, 5);
  const recentApps = [...applications]
    .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))
    .slice(0, 5);

  const budgetPct = Math.round((budget.allocatedFunds / budget.totalFunds) * 100);

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)",
        borderRadius: "var(--radius-lg)",
        padding: "28px 32px",
        marginBottom: 28,
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.14)",
      }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 26, color: "#fff",
          marginBottom: 6,
        }}>
          {t("admin.dashboard")}
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>
          STGS | Academic Year {budget.academicYear} | FCSE, SS. Cyril & Methodius University
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["budget","users","records","auditlog"].map((page) => {
            const labels = {
              budget: t("page.budget.title"),
              users: t("page.users.title"),
              records: t("page.records.title"),
              auditlog: t("page.audit.title"),
            };
            return (
              <button key={page} onClick={() => onNavigate(page)} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 16px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "var(--radius)",
                color: "rgba(255,255,255,0.85)",
                fontSize: 12, fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              >
                {labels[page]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard
          icon=""
          label={t("admin.annualBudget")}
          value={`EUR ${budget.totalFunds.toLocaleString()}`}
          sub={`${budget.academicYear}`}
          accent
        />
        <StatCard
          icon=""
          label={t("admin.totalApplications")}
          value={applications.length}
          sub={`${statusCounts.Submitted || 0} ${t("admin.pendingReview")}`}
        />
        <StatCard
          icon=""
          label={t("admin.registeredUsers")}
          value={users.length}
          sub={`${users.filter(u => u.active).length} ${t("admin.active")}`}
        />
        <StatCard
          icon=""
          label={t("admin.approved")}
          value={statusCounts.Approved || 0}
          sub={`EUR ${budget.allocatedFunds.toLocaleString()} ${t("admin.allocatedLower")}`}
        />
      </div>

      {/* Budget progress + status breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Budget health */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, color: "var(--text-primary)" }}>{t("admin.budgetHealth")}</h3>
            <button onClick={() => onNavigate("budget")} style={{
              fontSize: 12, color: "var(--gold)", background: "none", border: "none",
              cursor: "pointer", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif",
            }}>{t("common.viewFull")}</button>
          </div>
          <ProgressBar value={budget.allocatedFunds} max={budget.totalFunds} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 20 }}>
            {[
              { label: t("common.total"), value: `EUR ${budget.totalFunds.toLocaleString()}`, color: "var(--text-primary)" },
              { label: t("common.allocated"), value: `EUR ${budget.allocatedFunds.toLocaleString()}`, color: "#F59E0B" },
              { label: t("common.available"), value: `EUR ${budget.availableFunds.toLocaleString()}`, color: "#10B981" },
            ].map((item) => (
              <div key={item.label} style={{
                background: "var(--cream)",
                borderRadius: "var(--radius)",
                padding: "12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "'DM Serif Display', serif" }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Application status breakdown */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, color: "var(--text-primary)" }}>{t("admin.applicationStatus")}</h3>
            <button onClick={() => onNavigate("records")} style={{
              fontSize: 12, color: "var(--gold)", background: "none", border: "none",
              cursor: "pointer", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif",
            }}>{t("common.viewAll")}</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = statusCounts[key] || 0;
              const pct = applications.length ? Math.round((count / applications.length) * 100) : 0;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: cfg.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", width: 90, flexShrink: 0 }}>
                    {t(`common.${key === "UnderReview" ? "underReview" : key.toLowerCase()}`)}
                  </span>
                  <div style={{ flex: 1, height: 6, background: "var(--border-light)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", width: 20, textAlign: "right" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent applications + recent activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent applications */}
        <Card padding="0">
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15, color: "var(--text-primary)" }}>Recent Applications</h3>
            <button onClick={() => onNavigate("records")} style={{ fontSize: 12, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {t("common.viewAll")}
            </button>
          </div>
          <div>
            {recentApps.map((app, i) => (
              <div key={app.applicationID} style={{
                padding: "12px 20px",
                borderBottom: i < recentApps.length - 1 ? "1px solid var(--border-light)" : "none",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                    {app.applicationID}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {app.applicantName} | {app.destination}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                  <StatusBadge status={app.status} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{app.requestedAmount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent audit activity */}
        <Card padding="0">
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15, color: "var(--text-primary)" }}>Recent Activity</h3>
            <button onClick={() => onNavigate("auditlog")} style={{ fontSize: 12, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              View log 
            </button>
          </div>
          <div>
            {recentLogs.map((log, i) => {
              const actionColors = {
                Submitted: "#3B82F6", Approved: "#10B981", Rejected: "#EF4444",
                Canceled: "#6B7280", Login: "#8B5CF6", Deleted: "#DC2626",
                RoleChanged: "#F59E0B",
              };
              const color = actionColors[log.action] || "#6B7280";
              return (
                <div key={log.logID} style={{
                  padding: "10px 20px",
                  borderBottom: i < recentLogs.length - 1 ? "1px solid var(--border-light)" : "none",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: color, flexShrink: 0, marginTop: 5,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4 }}>
                      <strong>{log.userName}</strong>
                      {" "}<span style={{ color, fontWeight: 600 }}>{log.action}</span>
                      {log.targetID && <span style={{ color: "var(--text-muted)" }}> | {log.targetID}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {new Date(log.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
