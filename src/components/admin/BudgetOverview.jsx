// ============================================================
// BudgetOverview FR-7: budget monitoring + per-application breakdown
// Shows total / allocated / available + a breakdown table
// Budget auto-updates whenever applications are approved/canceled
// ============================================================

import { useApp } from "../../context/AppContext";
import { Card, StatCard, ProgressBar, StatusBadge, Table, SectionHeader, Alert } from "../shared/UI";

export default function BudgetOverview() {
  const { state } = useApp();
  const { budget, applications } = state;

  const approved = applications.filter((a) => a.status === "Approved");
  const pending  = applications.filter((a) => ["Submitted", "UnderReview"].includes(a.status));
  const totalPending = pending.reduce((s, a) => s + a.requestedAmount, 0);
  const budgetPct = Math.round((budget.allocatedFunds / budget.totalFunds) * 100);
  const wouldExceed = budget.availableFunds < totalPending;

  const breakdownColumns = [
    { key: "applicationID", label: "App ID", width: 90 },
    { key: "applicantName", label: "Applicant" },
    { key: "destination", label: "Destination" },
    { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
    { key: "requestedAmount", label: "Amount ()", render: (v) => (
      <span style={{ fontWeight: 600, fontFamily: "'DM Serif Display', serif", fontSize: 14 }}>
        {v.toLocaleString()}
      </span>
    )},
    { key: "pct", label: "% of Budget", render: (v) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
        <div style={{ flex: 1, height: 5, background: "var(--border-light)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, v)}%`, background: "var(--gold)", borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{v}%</span>
      </div>
    )},
  ];

  const breakdownRows = approved.map((a) => ({
    ...a,
    pct: Math.round((a.requestedAmount / budget.totalFunds) * 100),
  }));

  const allColumns = [
    { key: "applicationID", label: "App ID", width: 90 },
    { key: "applicantName", label: "Applicant" },
    { key: "destination", label: "Destination" },
    { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
    { key: "requestedAmount", label: "Requested ()", render: (v) => `${v.toLocaleString()}` },
    { key: "budgetImpact", label: "Budget Impact", render: (_, row) => {
      const wouldFit = row.requestedAmount <= budget.availableFunds;
      if (row.status === "Approved") return <span style={{ color: "#10B981", fontWeight: 600, fontSize: 12 }}>Allocated</span>;
      if (row.status === "Rejected" || row.status === "Canceled") return <span style={{ color: "#6B7280", fontSize: 12 }}>No impact</span>;
      return wouldFit
        ? <span style={{ color: "#3B82F6", fontSize: 12, fontWeight: 600 }}>Would fit</span>
        : <span style={{ color: "#EF4444", fontSize: 12, fontWeight: 600 }}>Would exceed</span>;
    }},
  ];

  return (
    <div>
      {/* Header */}
      <SectionHeader
        title="Budget Overview"
        subtitle={`Academic Year ${budget.academicYear} | Total annual travel grant fund`}
      />

      {/* Warning if pending would exceed */}
      {wouldExceed && (
        <Alert
          type="warning"
          message={`The combined pending applications (${totalPending.toLocaleString()}) exceed the available budget (${budget.availableFunds.toLocaleString()}). Not all can be approved.`}
        />
      )}

      {/* Top stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard icon="" label="Total Annual Budget" value={`${budget.totalFunds.toLocaleString()}`} sub={budget.academicYear} accent />
        <StatCard icon="" label="Allocated Funds"  value={`${budget.allocatedFunds.toLocaleString()}`} sub={`${approved.length} approved apps`} />
        <StatCard icon="" label="Available Funds"  value={`${budget.availableFunds.toLocaleString()}`} sub={budget.availableFunds <= 0 ? "Budget exhausted" : "Remaining"} />
        <StatCard icon="" label="Pending Requests" value={`${totalPending.toLocaleString()}`} sub={`${pending.length} under review`} />
      </div>

      {/* Progress bar card */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, color: "var(--text-primary)", marginBottom: 3 }}>Budget Utilisation</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {budgetPct}% of the annual budget has been allocated to approved grants
            </p>
          </div>
          <div style={{
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 13, fontWeight: 700,
            background: budgetPct >= 80 ? "#FEF2F2" : "#F0FDF4",
            color: budgetPct >= 80 ? "#DC2626" : "#166534",
            border: `1px solid ${budgetPct >= 80 ? "#FECACA" : "#BBF7D0"}`,
          }}>
            {budgetPct}% Used
          </div>
        </div>
        <ProgressBar value={budget.allocatedFunds} max={budget.totalFunds} />

        {/* Budget enforcement note */}
        <div style={{
          marginTop: 16, padding: "12px 16px",
          background: "var(--cream)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border-light)",
          fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6,
        }}>
          <strong>Budget Enforcement (FR-5, DC-4):</strong> The system automatically blocks any approval
          that would cause <code>AllocatedFunds + RequestedAmount {">"} TotalFunds</code>. This check
          is enforced transactionally at Stage 2 approval. Canceling an approved application
          immediately restores its amount to the available pool.
        </div>
      </Card>

      {/* Budget breakdown approved only */}
      <Card style={{ marginBottom: 24 }} padding="0">
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-light)" }}>
          <h3 style={{ fontSize: 15, color: "var(--text-primary)" }}>Approved Grant Breakdown</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
            Applications contributing to the allocated funds total
          </p>
        </div>
        <div style={{ padding: "0 0 8px" }}>
          <Table columns={breakdownColumns} rows={breakdownRows} emptyMessage="No approved applications yet." />
        </div>

        {approved.length > 0 && (
          <div style={{
            padding: "12px 24px",
            borderTop: "1px solid var(--border-light)",
            display: "flex", justifyContent: "flex-end", gap: 32,
            background: "var(--cream)",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {approved.length} approved grant{approved.length !== 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Serif Display', serif" }}>
              Total: {budget.allocatedFunds.toLocaleString()}
            </div>
          </div>
        )}
      </Card>

      {/* All applications with budget impact */}
      <Card padding="0">
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-light)" }}>
          <h3 style={{ fontSize: 15, color: "var(--text-primary)" }}>All Applications Budget Impact</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
            Shows whether each pending application would fit within the remaining available budget
          </p>
        </div>
        <div style={{ padding: "0 0 8px" }}>
          <Table columns={allColumns} rows={applications} emptyMessage="No applications found." />
        </div>
      </Card>
    </div>
  );
}
