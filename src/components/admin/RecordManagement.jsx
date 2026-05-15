// ============================================================
// RecordManagement FR-9, FR-10
// Admin can: view all applications, cancel approved apps,
// delete records (blocked if referenced by approvals),
// confirmation required before deletion
// ============================================================

import { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Card, SectionHeader, SearchInput, Select, Button,
  StatusBadge, Table, Modal, Alert, StatCard,
} from "../shared/UI";
import { STATUS_CONFIG } from "../../data/mockData";

const statusFilterOptions = [
  { value: "", label: "All Statuses" },
  ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
];

export default function RecordManagement() {
  const { state, dispatch } = useApp();
  const { applications, approvals, documents } = state;

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.applicationID.toLowerCase().includes(q) ||
      a.applicantName.toLowerCase().includes(q) ||
      a.destination.toLowerCase().includes(q) ||
      a.purpose.toLowerCase().includes(q);
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function handleCancel() {
    if (!cancelTarget) return;
    dispatch({
      type: "CANCEL_APPLICATION",
      payload: { applicationID: cancelTarget.applicationID, canceledBy: "Administrator" },
    });
    setSuccessMsg(`Application ${cancelTarget.applicationID} has been canceled. Budget restored.`);
    setCancelTarget(null);
    setTimeout(() => setSuccessMsg(""), 5000);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    // Check if referenced by approvals
    const hasApprovals = approvals.some((a) => a.applicationID === deleteTarget.applicationID);
    if (hasApprovals) {
      setError(
        `Cannot delete ${deleteTarget.applicationID}: it has ${
          approvals.filter((a) => a.applicationID === deleteTarget.applicationID).length
        } linked approval record(s). Per FR-10, deletion of referenced records is blocked.`
      );
      setDeleteTarget(null);
      setTimeout(() => setError(""), 6000);
      return;
    }
    dispatch({
      type: "DELETE_APPLICATION",
      payload: { applicationID: deleteTarget.applicationID },
    });
    setSuccessMsg(`Application ${deleteTarget.applicationID} permanently deleted.`);
    setDeleteTarget(null);
    setTimeout(() => setSuccessMsg(""), 5000);
  }

  const getAppApprovals = (appID) => approvals.filter((a) => a.applicationID === appID);
  const getAppDocuments = (appID) => documents.filter((d) => d.applicationID === appID);

  const columns = [
    {
      key: "applicationID",
      label: "ID",
      width: 90,
      render: (v) => <code style={{ fontSize: 11, fontWeight: 700, color: "var(--navy-muted)" }}>{v}</code>,
    },
    {
      key: "applicantName",
      label: "Applicant",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.submissionDate}</div>
        </div>
      ),
    },
    {
      key: "destination",
      label: "Destination",
      render: (v, row) => (
        <div>
          <div style={{ fontSize: 13 }}>{v}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.travelDates.from} {row.travelDates.to}</div>
        </div>
      ),
    },
    {
      key: "requestedAmount",
      label: "Amount",
      width: 90,
      render: (v) => <span style={{ fontWeight: 700, fontSize: 13 }}>{v.toLocaleString()}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: 120,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: "_docs",
      label: "Docs",
      width: 50,
      render: (_, row) => {
        const count = getAppDocuments(row.applicationID).length;
        return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{count}</span>;
      },
    },
    {
      key: "_actions",
      label: "Actions",
      width: 220,
      render: (_, row) => {
        const appApprovals = getAppApprovals(row.applicationID);
        const canDelete = row.status === "Canceled" || row.status === "Rejected";
        const canCancel = row.status === "Approved";
        return (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Button size="sm" variant="secondary" onClick={() => setDetailTarget(row)}>
              View
            </Button>
            {canCancel && (
              <Button size="sm" variant="danger" onClick={() => setCancelTarget(row)}>
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              onClick={() => setDeleteTarget(row)}
              disabled={!canDelete}
              style={{ opacity: canDelete ? 1 : 0.35 }}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = applications.filter((a) => a.status === k).length;
    return acc;
  }, {});

  return (
    <div>
      <SectionHeader
        title="Record Management"
        subtitle="Cancel approved applications, delete records, view full application details (FR-9, FR-10)"
      />

      {successMsg && <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg("")} />}
      {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
          <div key={k} style={{
            background: "var(--white)",
            border: "1.5px solid var(--border-light)",
            borderRadius: "var(--radius)",
            padding: "14px 16px",
            borderTop: `3px solid ${cfg.color}`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'DM Serif Display', serif", color: cfg.color }}>
              {statusCounts[k] || 0}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Policy note */}
      <div style={{
        background: "#FFFBEB",
        border: "1px solid #FDE68A",
        borderRadius: "var(--radius)",
        padding: "12px 16px",
        fontSize: 12, color: "#92400E",
        marginBottom: 20, lineHeight: 1.6,
      }}>
        <strong>FR-10 Policy:</strong> Records can only be permanently deleted if they are in <strong>Canceled</strong> or <strong>Rejected</strong> status
        and have <strong>no linked approval records</strong>. All deletions require explicit confirmation.
        Approved applications can only be canceled by an Administrator.
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 20 }} padding="14px 18px">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by ID, applicant, destination" />
          </div>
          <Select value={filterStatus} onChange={setFilterStatus} options={statusFilterOptions} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
            {filtered.length} of {applications.length} records
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card padding="0">
        <Table columns={columns} rows={filtered} emptyMessage="No applications found." />
      </Card>

      {/*  Detail Modal  */}
      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title={`Application Details ${detailTarget?.applicationID}`} width={580}>
        {detailTarget && (() => {
          const appDocs = getAppDocuments(detailTarget.applicationID);
          const appApprovals = getAppApprovals(detailTarget.applicationID);
          return (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  ["Applicant", detailTarget.applicantName],
                  ["Status", <StatusBadge key="s" status={detailTarget.status} />],
                  ["Destination", detailTarget.destination],
                  ["Amount", `${detailTarget.requestedAmount.toLocaleString()}`],
                  ["From", detailTarget.travelDates.from],
                  ["To", detailTarget.travelDates.to],
                  ["Submitted", detailTarget.submissionDate],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: "var(--cream)", borderRadius: "var(--radius)", padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 12, padding: "10px 12px", background: "var(--cream)", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>Purpose</div>
                <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{detailTarget.purpose}</div>
              </div>

              {appApprovals.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Approval Records ({appApprovals.length})
                  </div>
                  {appApprovals.map((apr) => (
                    <div key={apr.approvalID} style={{
                      padding: "10px 12px", marginBottom: 6,
                      background: apr.decision === "Approved" ? "#F0FDF4" : "#FEF2F2",
                      border: `1px solid ${apr.decision === "Approved" ? "#BBF7D0" : "#FECACA"}`,
                      borderRadius: "var(--radius)", fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 600, color: apr.decision === "Approved" ? "#166534" : "#DC2626" }}>
                        Stage {apr.stage} {apr.decision}
                      </div>
                      {apr.comment && <div style={{ color: "var(--text-secondary)", marginTop: 3 }}>{apr.comment}</div>}
                      <div style={{ color: "var(--text-muted)", marginTop: 3 }}>{apr.decisionDate}</div>
                    </div>
                  ))}
                </div>
              )}

              {appDocs.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Documents ({appDocs.length})
                  </div>
                  {appDocs.map((doc) => (
                    <div key={doc.documentID} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "8px 12px", marginBottom: 4,
                      background: "var(--cream)",
                      borderRadius: "var(--radius)", fontSize: 12,
                    }}>
                      <span>{doc.fileName}</span>
                      <span style={{ color: "var(--text-muted)" }}>{doc.fileSize}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/*  Cancel Confirm Modal  */}
      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel Approved Application">
        {cancelTarget && (
          <div>
            <Alert
              type="warning"
              message={`Canceling ${cancelTarget.applicationID} will restore ${cancelTarget.requestedAmount.toLocaleString()} to the available budget. The record is retained for audit purposes (status Canceled).`}
            />
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Application <strong>{cancelTarget.applicationID}</strong> by <strong>{cancelTarget.applicantName}</strong> for{" "}
                <strong>{cancelTarget.destination}</strong> ({cancelTarget.requestedAmount.toLocaleString()}) will be canceled.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setCancelTarget(null)}>Back</Button>
              <Button variant="danger" onClick={handleCancel}>Confirm Cancellation</Button>
            </div>
          </div>
        )}
      </Modal>

      {/*  Delete Confirm Modal  */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Permanently Delete Record">
        {deleteTarget && (() => {
          const hasApprovals = approvals.some((a) => a.applicationID === deleteTarget.applicationID);
          return (
            <div>
              {hasApprovals ? (
                <Alert
                  type="error"
                  message={`Cannot delete: ${deleteTarget.applicationID} has linked approval records. Deletion of referenced records is blocked (FR-10).`}
                />
              ) : (
                <Alert
                  type="error"
                  message="This action is irreversible. The record and all linked documents will be permanently removed."
                />
              )}
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
                Delete application <strong>{deleteTarget.applicationID}</strong> by{" "}
                <strong>{deleteTarget.applicantName}</strong>?
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete} disabled={hasApprovals}>
                  {hasApprovals ? "Blocked Cannot Delete" : "Confirm Delete"}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}