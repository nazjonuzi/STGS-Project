// ============================================================
// Reviewer Module - Scientific Council & Dean's Office
// Combines the submitted reviewer workflow with the existing
// project-wide AppContext so Admin, Applicant, and Reviewer data
// stay in one shared state tree.
// ============================================================

import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { Alert, Button, Card, SectionHeader, StatusBadge } from "../shared/UI";

const MAX_COMMENT_CHARS = 500;

const STAGE_LABELS = {
  1: "Scientific Council",
  2: "Dean's Office",
};

const STAGE_BY_ROLE = {
  ScientificCouncil: 1,
  DeansOffice: 2,
};

const statusColors = {
  Submitted: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  UnderReview: { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" },
  Approved: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  Rejected: { bg: "#FFF1F2", color: "#BE123C", border: "#FECDD3" },
  Canceled: { bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" },
};

const money = (amount) => `EUR ${amount.toLocaleString()}`;

function getStageLabel(status) {
  if (status === "Submitted") return "Awaiting Scientific Council";
  if (status === "UnderReview") return "Awaiting Dean's Office";
  if (status === "Approved") return "Fully Approved";
  if (status === "Rejected") return "Application Rejected";
  return "Canceled";
}

function reviewerName(users, reviewerID) {
  return users.find((u) => u.userID === reviewerID)?.name || reviewerID;
}

function applicationDocuments(application, documents) {
  const ids = new Set(application.documents || []);
  return documents.filter(
    (doc) => doc.applicationID === application.applicationID || ids.has(doc.documentID)
  );
}

function applicationHistory(applicationID, approvals, users) {
  return approvals
    .filter((approval) => approval.applicationID === applicationID)
    .sort((a, b) => a.stage - b.stage)
    .map((approval) => ({
      ...approval,
      stageLabel: STAGE_LABELS[approval.stage] || `Stage ${approval.stage}`,
      reviewerName: reviewerName(users, approval.reviewerID),
    }));
}

function ReviewerCommentBox({ comment, onChange }) {
  const { t } = useApp();
  const [focused, setFocused] = useState(false);
  const remaining = MAX_COMMENT_CHARS - comment.length;
  const isNearLimit = remaining <= 80;
  const isAtLimit = remaining <= 0;

  function handleChange(event) {
    if (event.target.value.length <= MAX_COMMENT_CHARS) {
      onChange(event.target.value);
    }
  }

  return (
    <div style={styles.commentWrapper}>
      <div style={styles.labelRow}>
        <label style={styles.sectionLabel}>
          {t("reviewer.comment")} <span style={styles.optional}>(optional)</span>
        </label>
        {comment.length > 0 && (
          <button onClick={() => onChange("")} style={styles.clearButton}>
            Clear
          </button>
        )}
      </div>

      <div
        style={{
          ...styles.textareaWrapper,
          borderColor: focused ? "#3B82F6" : isAtLimit ? "#EF4444" : "#E5E7EB",
          boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.15)" : "none",
        }}
      >
        <textarea
          value={comment}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Add an optional comment explaining your decision. This will be visible in the approval history."
          rows={4}
          style={styles.textarea}
        />
      </div>

      <div style={styles.commentFooter}>
        <p style={styles.hint}>
          This comment is saved with the decision and visible to admins and reviewers.
        </p>
        <span
          style={{
            ...styles.charCount,
            color: isAtLimit ? "#EF4444" : isNearLimit ? "#F59E0B" : "#9CA3AF",
            fontWeight: isNearLimit ? 700 : 400,
          }}
        >
          {remaining} / {MAX_COMMENT_CHARS}
        </span>
      </div>
    </div>
  );
}

function ApprovalTimeline({ history }) {
  if (!history.length) {
    return (
      <div style={styles.emptyTimeline}>
        <p style={styles.emptyTitle}>No decisions recorded yet</p>
        <p style={styles.emptyText}>This application has not been reviewed at any stage.</p>
      </div>
    );
  }

  return (
    <div style={styles.timelineWrapper}>
      <p style={styles.sectionLabel}>Approval Timeline</p>
      <div style={styles.timeline}>
        {[1, 2].map((stage, index) => {
          const entry = history.find((item) => item.stage === stage);
          const previousComplete = stage === 1 || history.some((item) => item.stage === stage - 1);
          const isWaiting = !entry && previousComplete;
          const isNotReached = !entry && !previousComplete;

          return (
            <div key={stage} style={styles.timelineRow}>
              <div style={styles.connectorCol}>
                <div
                  style={{
                    ...styles.dot,
                    backgroundColor: entry
                      ? entry.decision === "Approved"
                        ? "#16A34A"
                        : "#DC2626"
                      : isWaiting
                        ? "#F59E0B"
                        : "#D1D5DB",
                    border: entry ? "none" : `2px dashed ${isWaiting ? "#F59E0B" : "#D1D5DB"}`,
                    boxShadow: entry
                      ? entry.decision === "Approved"
                        ? "0 0 0 4px rgba(22,163,74,0.15)"
                        : "0 0 0 4px rgba(220,38,38,0.15)"
                      : "none",
                  }}
                >
                  {entry ? (entry.decision === "Approved" ? "A" : "R") : isWaiting ? "P" : ""}
                </div>
                {index < 1 && <div style={styles.line} />}
              </div>

              <div style={styles.stageContent}>
                <div style={styles.stageHeader}>
                  <span style={styles.stageName}>{STAGE_LABELS[stage]}</span>
                  {entry && (
                    <span
                      style={{
                        ...styles.decisionBadge,
                        backgroundColor: entry.decision === "Approved" ? "#F0FDF4" : "#FFF1F2",
                        color: entry.decision === "Approved" ? "#15803D" : "#BE123C",
                        border: `1px solid ${entry.decision === "Approved" ? "#BBF7D0" : "#FECDD3"}`,
                      }}
                    >
                      {entry.decision === "Approved" ? "Approved" : "Rejected"}
                    </span>
                  )}
                  {isWaiting && <span style={styles.pendingBadge}>Awaiting Review</span>}
                  {isNotReached && <span style={styles.notReachedBadge}>Not Yet Reached</span>}
                </div>

                {entry && (
                  <div style={styles.entryCard}>
                    <div style={styles.entryMeta}>
                      <span>{entry.reviewerName}</span>
                      <span>{entry.decisionDate}</span>
                    </div>
                    {entry.comment && <p style={styles.historyComment}>"{entry.comment}"</p>}
                  </div>
                )}

                {isWaiting && (
                  <p style={styles.pendingNote}>Waiting for a reviewer to evaluate this application.</p>
                )}
                {isNotReached && (
                  <p style={styles.notReachedNote}>
                    This stage becomes available after the previous stage is completed.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApplicationReviewCard({ application, documents, history }) {
  if (!application) return null;

  const statusStyle = statusColors[application.status] || statusColors.Submitted;
  const stageLabel = getStageLabel(application.status);

  return (
    <div style={styles.applicationCard}>
      <div style={styles.cardHeader}>
        <div>
          <p style={styles.appId}>{application.applicationID}</p>
          <h2 style={styles.applicantName}>{application.applicantName}</h2>
          {application.applicantEmail && (
            <p style={styles.applicantEmail}>{application.applicantEmail}</p>
          )}
        </div>
        <div style={styles.headerRight}>
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
            }}
          >
            {application.status === "UnderReview" ? "Under Review" : application.status}
          </span>
          <p style={styles.stageLabel}>{stageLabel}</p>
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.detailGrid}>
        <InfoBlock label="Travel Purpose" value={application.purpose} />
        <InfoBlock label="Destination" value={`${application.destination}`} />
        <InfoBlock
          label="Travel Dates"
          value={`${application.travelDates.from} to ${application.travelDates.to}`}
        />
        <InfoBlock
          label="Requested Amount"
          value={money(application.requestedAmount)}
          valueStyle={styles.amount}
        />
        <InfoBlock label="Submission Date" value={`${application.submissionDate}`} />
        <InfoBlock label="Review Stage" value={stageLabel} />
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <p style={styles.sectionLabel}>Uploaded Documents</p>
        {documents.length ? (
          <div style={styles.docList}>
            {documents.map((doc) => (
              <div key={doc.documentID} style={styles.docItem}>
                <span style={styles.docIcon}>{doc.fileType || "FILE"}</span>
                <div>
                  <p style={styles.docName}>{doc.fileName}</p>
                  <p style={styles.docMeta}>
                    {doc.fileType} | {doc.fileSize}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No documents uploaded.</p>
        )}
      </div>

      {!!history.length && (
        <>
          <div style={styles.divider} />
          <div style={styles.section}>
            <p style={styles.sectionLabel}>Previous Reviewer Comments</p>
            {history.map((entry) => (
              <div key={entry.approvalID} style={styles.historyEntry}>
                <div style={styles.historyHeader}>
                  <span
                    style={{
                      ...styles.decisionBadge,
                      backgroundColor: entry.decision === "Approved" ? "#F0FDF4" : "#FFF1F2",
                      color: entry.decision === "Approved" ? "#15803D" : "#BE123C",
                      border: `1px solid ${entry.decision === "Approved" ? "#BBF7D0" : "#FECDD3"}`,
                    }}
                  >
                    {entry.decision}
                  </span>
                  <span style={styles.historyMeta}>
                    {entry.stageLabel} | {entry.reviewerName} | {entry.decisionDate}
                  </span>
                </div>
                {entry.comment && <p style={styles.historyComment}>"{entry.comment}"</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InfoBlock({ label, value, valueStyle = {} }) {
  return (
    <div style={styles.fieldBlock}>
      <p style={styles.fieldLabel}>{label}</p>
      <p style={{ ...styles.fieldValue, ...valueStyle }}>{value}</p>
    </div>
  );
}

export function ReviewerQueue() {
  const { state, dispatch, t } = useApp();
  const { currentUser, applications, approvals, budget, documents, users } = state;

  const stage = STAGE_BY_ROLE[currentUser.role];
  const isCouncil = stage === 1;
  const isDean = stage === 2;

  const assigned = useMemo(() => {
    if (stage === 1) return applications.filter((app) => app.status === "Submitted");
    if (stage === 2) return applications.filter((app) => app.status === "UnderReview");
    return [];
  }, [applications, stage]);

  const [selectedId, setSelectedId] = useState(null);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const selected = assigned.find((app) => app.applicationID === selectedId) || null;
  const selectedDocuments = selected ? applicationDocuments(selected, documents) : [];
  const selectedHistory = selected ? applicationHistory(selected.applicationID, approvals, users) : [];
  const budgetExceeded = !!selected && isDean && selected.requestedAmount > budget.availableFunds;

  if (!stage) {
    return (
      <Card style={{ textAlign: "center", padding: 48 }}>
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>Access Restricted</h3>
        <p style={{ color: "var(--text-muted)" }}>
          This panel is only accessible to Scientific Council and Dean's Office reviewers.
        </p>
      </Card>
    );
  }

  function openApplication(applicationID) {
    setSelectedId(applicationID);
    setComment("");
    setConfirming(null);
    setFeedback(null);
  }

  function handleDecision(decision) {
    if (!selected) return;

    if (decision === "Approved" && budgetExceeded) {
      setFeedback({
        type: "error",
        message: `Approval blocked: ${money(selected.requestedAmount)} requested but only ${money(
          budget.availableFunds
        )} is available.`,
      });
      setConfirming(null);
      return;
    }

    dispatch({
      type: "REVIEW_APPLICATION",
      payload: {
        applicationID: selected.applicationID,
        reviewerID: currentUser.userID,
        stage,
        decision,
        comment: comment.trim() || "No comment provided.",
      },
    });

    setFeedback({
      type: decision === "Approved" ? "success" : "error",
      message:
        decision === "Approved"
          ? isCouncil
            ? `Application ${selected.applicationID} approved by Scientific Council and forwarded to the Dean's Office.`
            : `Application ${selected.applicationID} received final approval. ${money(
                selected.requestedAmount
              )} has been allocated from the budget.`
          : `Application ${selected.applicationID} has been rejected at the ${STAGE_LABELS[stage]} stage.`,
    });
    setSelectedId(null);
    setComment("");
    setConfirming(null);
  }

  return (
    <div style={styles.page}>
      <SectionHeader
        title={isCouncil ? t("reviewer.scientificTitle") : t("reviewer.deanTitle")}
        subtitle={
          isCouncil
            ? `${t("reviewer.stage1")} | ${t("reviewer.loggedInAs")} ${currentUser.name}`
            : `${t("reviewer.stage2")} | ${t("reviewer.loggedInAs")} ${currentUser.name}`
        }
        action={
          <span style={styles.queueBadge}>
            {assigned.length} application{assigned.length !== 1 ? "s" : ""} pending
          </span>
        }
      />

      {isDean && (
        <div style={styles.budgetBar}>
          <BudgetItem label="Total Budget" value={money(budget.totalFunds)} />
          <div style={styles.budgetDivider} />
          <BudgetItem label="Allocated" value={money(budget.allocatedFunds)} color="#B45309" />
          <div style={styles.budgetDivider} />
          <BudgetItem label="Available" value={money(budget.availableFunds)} color="#15803D" />
          <div style={styles.progressWrapper}>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${Math.min((budget.allocatedFunds / budget.totalFunds) * 100, 100)}%`,
                  backgroundColor:
                    budget.allocatedFunds / budget.totalFunds > 0.85
                      ? "#EF4444"
                      : budget.allocatedFunds / budget.totalFunds > 0.65
                        ? "#F59E0B"
                        : "#16A34A",
                }}
              />
            </div>
            <p style={styles.progressLabel}>
              {Math.round((budget.allocatedFunds / budget.totalFunds) * 100)}% used
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <Alert
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div style={styles.layout}>
        <div style={styles.queuePanel}>
          <p style={styles.panelLabel}>{t("reviewer.queue")}</p>
          {assigned.length === 0 ? (
            <div style={styles.emptyQueue}>
              <p style={styles.emptyTitle}>{t("reviewer.allCaughtUp")}</p>
              <p style={styles.emptyText}>
                {t("reviewer.noAwaiting")}
              </p>
            </div>
          ) : (
            <div style={styles.queueList}>
              {assigned.map((app) => {
                const overBudget = isDean && app.requestedAmount > budget.availableFunds;
                const isSelected = selectedId === app.applicationID;
                return (
                  <button
                    key={app.applicationID}
                    onClick={() => openApplication(app.applicationID)}
                    style={{
                      ...styles.queueItem,
                      backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                      borderColor: overBudget ? "#FECDD3" : isSelected ? "#3B82F6" : "#E5E7EB",
                      borderLeft: isSelected
                        ? "4px solid #3B82F6"
                        : overBudget
                          ? "4px solid #EF4444"
                          : "4px solid transparent",
                    }}
                  >
                    <div style={styles.queueItemTop}>
                      <span style={styles.queueItemId}>{app.applicationID}</span>
                      <span style={{ ...styles.queueItemAmount, color: overBudget ? "#DC2626" : "#1D4ED8" }}>
                        {money(app.requestedAmount)}
                      </span>
                    </div>
                    <p style={styles.queueItemName}>{app.applicantName}</p>
                    <p style={styles.queueItemDest}>{app.destination}</p>
                    {overBudget && <p style={styles.queueItemBudgetWarn}>Exceeds available budget</p>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.reviewPanel}>
          {!selected ? (
            <div style={styles.noSelection}>
              <p style={styles.emptyTitle}>{t("reviewer.select")}</p>
              <p style={styles.emptyText}>{t("reviewer.selectHint")}</p>
            </div>
          ) : (
            <div style={styles.reviewContent}>
              {budgetExceeded && (
                <div style={styles.budgetError}>
                  <p style={styles.budgetErrorTitle}>Budget Enforcement - Approval Blocked</p>
                  <p style={styles.budgetErrorText}>
                    This application requests <strong>{money(selected.requestedAmount)}</strong>, but only{" "}
                    <strong>{money(budget.availableFunds)}</strong> is available. Approval is blocked
                    until sufficient funds are available.
                  </p>
                  <p style={styles.budgetErrorNote}>
                    Reference: SRS FR-5, DC-4 - approvals cannot create a budget deficit.
                  </p>
                </div>
              )}

              <ApplicationReviewCard
                application={selected}
                documents={selectedDocuments}
                history={selectedHistory}
              />

              <div style={styles.divider} />
              <ApprovalTimeline history={selectedHistory} />
              <div style={styles.divider} />
              <ReviewerCommentBox comment={comment} onChange={setComment} />
              <div style={styles.divider} />

              {confirming ? (
                <div
                  style={{
                    ...styles.confirmBox,
                    borderColor: confirming === "approve" ? "#BBF7D0" : "#FECDD3",
                    backgroundColor: confirming === "approve" ? "#F0FDF4" : "#FFF1F2",
                  }}
                >
                  <p style={styles.confirmTitle}>
                    {confirming === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                  </p>
                  <p style={styles.confirmText}>
                    {confirming === "approve"
                      ? isDean
                        ? `You are about to grant final approval to ${selected.applicantName}. ${money(
                            selected.requestedAmount
                          )} will be allocated from the annual budget.`
                        : `You are about to approve ${selected.applicantName}'s application and forward it to the Dean's Office.`
                      : `You are about to reject ${selected.applicantName}'s application. The applicant will be notified.`}
                  </p>
                  {comment.trim() === "" && (
                    <p style={styles.confirmWarning}>
                      You have not added a comment. A comment helps explain the decision.
                    </p>
                  )}
                  <div style={styles.confirmActions}>
                    <Button variant="secondary" onClick={() => setConfirming(null)}>
                      Go Back
                    </Button>
                    <Button
                      variant={confirming === "approve" ? "primary" : "danger"}
                      onClick={() => handleDecision(confirming === "approve" ? "Approved" : "Rejected")}
                    >
                      {confirming === "approve" ? (isDean ? "Grant Final Approval" : "Approve") : "Reject"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={styles.actionRow}>
                  <p style={styles.actionInfoText}>
                    {budgetExceeded
                      ? "Approval is blocked due to insufficient budget. You may reject this application."
                      : isDean
                        ? "This is the final approval stage. Approval allocates budget funds."
                        : "Approval forwards this application to the Dean's Office. Rejection closes it immediately."}
                  </p>
                  <div style={styles.actionBtns}>
                    <Button variant="danger" onClick={() => setConfirming("reject")}>
                      {t("reviewer.reject")}
                    </Button>
                    <Button
                      variant="primary"
                      disabled={budgetExceeded}
                      onClick={() => setConfirming("approve")}
                    >
                      {isDean ? t("reviewer.finalApprove") : t("reviewer.approve")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BudgetItem({ label, value, color = "#111827" }) {
  return (
    <div style={styles.budgetItem}>
      <p style={styles.budgetLabel}>{label}</p>
      <p style={{ ...styles.budgetValue, color }}>{value}</p>
    </div>
  );
}

export function ReviewHistory() {
  const { state, t } = useApp();
  const { currentUser, approvals, applications, users } = state;

  const myDecisions = approvals
    .filter((approval) => approval.reviewerID === currentUser.userID)
    .sort((a, b) => new Date(b.decisionDate) - new Date(a.decisionDate));

  return (
    <div>
      <SectionHeader
        title={t("reviewer.historyTitle")}
        subtitle={t("reviewer.historySubtitle")}
      />

      {myDecisions.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--text-muted)" }}>No decisions recorded yet.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myDecisions.map((approval) => {
            const app = applications.find((item) => item.applicationID === approval.applicationID);
            const fullHistory = applicationHistory(approval.applicationID, approvals, users);

            return (
              <Card key={approval.approvalID} padding="18px 20px">
                <div style={styles.historyListHeader}>
                  <div>
                    <div style={styles.historyListTop}>
                      <code style={styles.historyCode}>{approval.applicationID}</code>
                      <span
                        style={{
                          ...styles.decisionBadge,
                          backgroundColor: approval.decision === "Approved" ? "#F0FDF4" : "#FFF1F2",
                          color: approval.decision === "Approved" ? "#15803D" : "#BE123C",
                          border: `1px solid ${approval.decision === "Approved" ? "#BBF7D0" : "#FECDD3"}`,
                        }}
                      >
                        {STAGE_LABELS[approval.stage]} | {approval.decision}
                      </span>
                      {app && <StatusBadge status={app.status} />}
                    </div>
                    <div style={styles.historyPurpose}>{app?.purpose || "Application not found"}</div>
                    <div style={styles.historySmall}>
                      {app?.applicantName || "Unknown applicant"} | {app?.destination || "Unknown destination"} |{" "}
                      {app ? money(app.requestedAmount) : "No amount"}
                    </div>
                    {approval.comment && <p style={styles.historyComment}>"{approval.comment}"</p>}
                  </div>
                  <div style={styles.historyDate}>{approval.decisionDate}</div>
                </div>

                {fullHistory.length > 1 && (
                  <div style={styles.compactTimeline}>
                    {fullHistory.map((item) => (
                      <span key={item.approvalID} style={styles.compactTimelineItem}>
                        {item.stageLabel}: {item.decision}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  queueBadge: {
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #BFDBFE",
    borderRadius: 999,
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  budgetBar: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: "16px 24px",
    flexWrap: "wrap",
  },
  budgetItem: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    margin: 0,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: 800,
    margin: 0,
  },
  budgetDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#E5E7EB",
  },
  progressWrapper: {
    flex: 1,
    minWidth: 160,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginLeft: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.4s ease, background-color 0.3s",
  },
  progressLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    margin: 0,
    textAlign: "right",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "300px minmax(0, 1fr)",
    gap: 20,
    alignItems: "flex-start",
  },
  queuePanel: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    position: "sticky",
    top: 88,
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: 0,
  },
  queueList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  queueItem: {
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  queueItemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  queueItemId: {
    fontSize: 10,
    fontWeight: 700,
    color: "#9CA3AF",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  queueItemAmount: {
    fontSize: 13,
    fontWeight: 700,
  },
  queueItemName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  },
  queueItemDest: {
    fontSize: 12,
    color: "#6B7280",
    margin: 0,
  },
  queueItemBudgetWarn: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: 600,
    margin: 0,
  },
  emptyQueue: {
    textAlign: "center",
    padding: "24px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  emptyIcon: {
    fontSize: 30,
    margin: 0,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#374151",
    margin: 0,
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    margin: 0,
    lineHeight: 1.5,
  },
  reviewPanel: {
    minWidth: 0,
  },
  noSelection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "80px 32px",
    backgroundColor: "#FFFFFF",
    border: "1px dashed #E5E7EB",
    borderRadius: 12,
    textAlign: "center",
  },
  reviewContent: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 28,
  },
  applicationCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 28,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  appId: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9CA3AF",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  applicantName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 2px",
  },
  applicantEmail: {
    fontSize: 13,
    color: "#6B7280",
    margin: 0,
  },
  headerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 999,
    letterSpacing: "0.04em",
  },
  stageLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    margin: 0,
    textAlign: "right",
  },
  divider: {
    borderTop: "1px solid #F3F4F6",
    margin: "24px 0",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  fieldBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    margin: 0,
  },
  fieldValue: {
    fontSize: 14,
    color: "#374151",
    margin: 0,
    lineHeight: 1.5,
  },
  amount: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1D4ED8",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  docList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  docItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: "10px 14px",
  },
  docIcon: {
    fontSize: 20,
  },
  docName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  },
  docMeta: {
    fontSize: 11,
    color: "#9CA3AF",
    margin: 0,
  },
  historyEntry: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  historyHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  decisionBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: 999,
  },
  historyMeta: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  historyComment: {
    fontSize: 13,
    color: "#374151",
    fontStyle: "italic",
    margin: "8px 0 0",
    paddingLeft: 10,
    borderLeft: "3px solid #E5E7EB",
    lineHeight: 1.6,
  },
  timelineWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
  },
  timelineRow: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  connectorCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
    width: 32,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    color: "#FFFFFF",
    flexShrink: 0,
    zIndex: 1,
  },
  line: {
    width: 2,
    flexGrow: 1,
    minHeight: 24,
    margin: "4px 0",
    backgroundColor: "#E5E7EB",
  },
  stageContent: {
    flex: 1,
    paddingBottom: 24,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 4,
  },
  stageHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  stageName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  pendingBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: 999,
    backgroundColor: "#FFFBEB",
    color: "#B45309",
    border: "1px solid #FDE68A",
  },
  notReachedBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: 999,
    backgroundColor: "#F9FAFB",
    color: "#9CA3AF",
    border: "1px solid #E5E7EB",
  },
  entryCard: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  entryMeta: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    fontSize: 12,
    color: "#6B7280",
  },
  pendingNote: {
    fontSize: 13,
    color: "#B45309",
    backgroundColor: "#FFFBEB",
    border: "1px solid #FDE68A",
    borderRadius: 6,
    padding: "8px 12px",
    margin: 0,
  },
  notReachedNote: {
    fontSize: 13,
    color: "#9CA3AF",
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 6,
    padding: "8px 12px",
    margin: 0,
  },
  emptyTimeline: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: 32,
    backgroundColor: "#F9FAFB",
    border: "1px dashed #E5E7EB",
    borderRadius: 10,
    textAlign: "center",
  },
  commentWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  optional: {
    fontWeight: 400,
    color: "#9CA3AF",
    textTransform: "none",
    letterSpacing: "normal",
    fontSize: 12,
  },
  clearButton: {
    fontSize: 12,
    color: "#6B7280",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: 4,
    textDecoration: "underline",
  },
  textareaWrapper: {
    borderRadius: 8,
    border: "1.5px solid #E5E7EB",
    overflow: "hidden",
    transition: "border-color 0.15s, box-shadow 0.15s",
    backgroundColor: "#FFFFFF",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 14,
    color: "#111827",
    border: "none",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.6,
    backgroundColor: "transparent",
    boxSizing: "border-box",
    minHeight: 100,
  },
  commentFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  hint: {
    fontSize: 11,
    color: "#9CA3AF",
    margin: 0,
    lineHeight: 1.5,
  },
  charCount: {
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  budgetError: {
    backgroundColor: "#FFF1F2",
    border: "1.5px solid #FECDD3",
    borderRadius: 10,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 24,
  },
  budgetErrorTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#BE123C",
    margin: 0,
  },
  budgetErrorText: {
    fontSize: 13,
    color: "#9F1239",
    margin: 0,
    lineHeight: 1.6,
  },
  budgetErrorNote: {
    fontSize: 11,
    color: "#FB7185",
    margin: 0,
    fontStyle: "italic",
  },
  confirmBox: {
    border: "1.5px solid",
    borderRadius: 10,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#111827",
    margin: 0,
  },
  confirmText: {
    fontSize: 13,
    color: "#374151",
    margin: 0,
    lineHeight: 1.6,
  },
  confirmWarning: {
    fontSize: 12,
    color: "#B45309",
    backgroundColor: "#FFFBEB",
    border: "1px solid #FDE68A",
    borderRadius: 6,
    padding: "8px 12px",
    margin: 0,
  },
  confirmActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 4,
    flexWrap: "wrap",
  },
  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  actionInfoText: {
    fontSize: 13,
    color: "#6B7280",
    margin: 0,
    lineHeight: 1.5,
    flex: 1,
    minWidth: 240,
  },
  actionBtns: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  historyListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  historyListTop: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  historyCode: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--navy-muted)",
  },
  historyPurpose: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 4,
  },
  historySmall: {
    fontSize: 12,
    color: "#6B7280",
  },
  historyDate: {
    fontSize: 11,
    color: "#9CA3AF",
    flexShrink: 0,
    textAlign: "right",
  },
  compactTimeline: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 12,
    marginTop: 12,
    borderTop: "1px solid #F3F4F6",
  },
  compactTimelineItem: {
    fontSize: 11,
    color: "#6B7280",
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 999,
    padding: "3px 10px",
  },
};
