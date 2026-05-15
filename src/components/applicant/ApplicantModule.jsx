// ============================================================
// Applicant Module
// Adapted from the submitted Applicant team's components to the
// existing STGS AppContext/data model.
// ============================================================

import { useMemo, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_TYPES,
  APPLICATION_STATUSES,
  MAX_FILE_SIZE_BYTES,
  STATUS_CONFIG,
} from "../../data/mockData";
import { Alert, Button, Card, Modal, SectionHeader, StatCard, StatusBadge } from "../shared/UI";

const ALL_STATUSES = [
  "All",
  APPLICATION_STATUSES.SUBMITTED,
  APPLICATION_STATUSES.UNDER_REVIEW,
  APPLICATION_STATUSES.APPROVED,
  APPLICATION_STATUSES.REJECTED,
  APPLICATION_STATUSES.CANCELED,
];

const STATUS_COLORS = {
  Submitted: "#3B82F6",
  UnderReview: "#F59E0B",
  Approved: "#10B981",
  Rejected: "#EF4444",
  Canceled: "#6B7280",
};

const CANCELABLE_STATUSES = [
  APPLICATION_STATUSES.SUBMITTED,
  APPLICATION_STATUSES.UNDER_REVIEW,
];

const EMPTY_FORM = {
  purpose: "",
  destination: "",
  travelDateFrom: "",
  travelDateTo: "",
  requestedAmount: "",
};

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBytes(bytes) {
  if (typeof bytes === "string") return bytes;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status) {
  if (status === "UnderReview") return "underReview";
  return String(status || "").toLowerCase();
}

function translatedStatus(t, status) {
  return t(`common.${statusLabel(status)}`);
}

function interpolate(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template
  );
}

function latestReviewerComment(applicationID, approvals) {
  const latest = approvals
    .filter((approval) => approval.applicationID === applicationID && approval.comment)
    .sort((a, b) => b.stage - a.stage || b.decisionDate.localeCompare(a.decisionDate))[0];
  return latest?.comment || null;
}

function applicationDocuments(application, documents) {
  const ids = new Set(application.documents || []);
  return documents.filter(
    (doc) => doc.applicationID === application.applicationID || ids.has(doc.documentID)
  );
}

function validate(form, documents) {
  const errors = {};
  if (!form.purpose.trim()) errors.purpose = "Travel purpose is required.";
  if (!form.destination.trim()) errors.destination = "Destination is required.";
  if (!form.travelDateFrom) errors.travelDateFrom = "Start date is required.";
  if (!form.travelDateTo) errors.travelDateTo = "End date is required.";
  if (form.travelDateFrom && form.travelDateTo && form.travelDateTo < form.travelDateFrom) {
    errors.travelDateTo = "End date must be after start date.";
  }
  if (!form.requestedAmount) {
    errors.requestedAmount = "Requested amount is required.";
  } else if (Number.isNaN(Number(form.requestedAmount)) || Number(form.requestedAmount) <= 0) {
    errors.requestedAmount = "Please enter a valid positive amount.";
  }
  if (!documents.length) errors.documents = "At least one supporting document is required.";
  return errors;
}

function FileTypeBadge({ type }) {
  const normalized = String(type || "FILE").toLowerCase();
  let label = "FILE";
  if (normalized.includes("pdf")) label = "PDF";
  if (normalized.includes("word") || normalized.includes("docx")) label = "DOCX";
  if (normalized.includes("image") || normalized.includes("jpg") || normalized.includes("png")) label = "IMG";
  return <span style={styles.fileTypeBadge}>{label}</span>;
}

function DocumentUpload({ files, onChange, error, t }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);

  function validateAndAdd(rawFiles) {
    const nextErrors = [];
    const validFiles = [];

    Array.from(rawFiles || []).forEach((file) => {
      const ext = `.${file.name.split(".").pop().toLowerCase()}`;
      const typeOk = ACCEPTED_FILE_TYPES.includes(file.type) || ACCEPTED_FILE_EXTENSIONS.includes(ext);
      const sizeOk = file.size <= MAX_FILE_SIZE_BYTES;
      const duplicate = files.some((existing) => existing.name === file.name);

      if (!typeOk) {
        nextErrors.push(`"${file.name}" has an invalid format. Accepted: PDF, DOCX, JPG, PNG.`);
      } else if (!sizeOk) {
        nextErrors.push(`"${file.name}" is too large (${formatBytes(file.size)}). Maximum allowed: 10 MB.`);
      } else if (duplicate) {
        nextErrors.push(`"${file.name}" is already added.`);
      } else {
        validFiles.push(file);
      }
    });

    setUploadErrors(nextErrors);
    if (validFiles.length) onChange([...files, ...validFiles]);
  }

  function removeFile(name) {
    setUploadErrors([]);
    onChange(files.filter((file) => file.name !== name));
  }

  return (
    <div style={styles.uploadWrapper}>
      <div
        style={{
          ...styles.dropZone,
          borderColor: dragOver ? "var(--navy)" : error ? "#EF4444" : "var(--border)",
          background: dragOver ? "#F8FAFC" : "var(--cream)",
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          validateAndAdd(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
      >
        <span style={styles.dropIcon}>{t("applicant.upload")}</span>
        <p style={styles.dropText}>
          <strong>{t("applicant.drag")}</strong> files here, or <span style={styles.dropLink}>browse</span>
        </p>
        <p style={styles.dropHint}>{t("applicant.accepted")}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
          onChange={(event) => {
            validateAndAdd(event.target.files);
            event.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </div>

      {!!uploadErrors.length && (
        <div style={styles.uploadErrors}>
          {uploadErrors.map((item) => (
            <p key={item} style={styles.uploadErrorText}>{item}</p>
          ))}
        </div>
      )}

      {!!files.length && (
        <ul style={styles.uploadList}>
          {files.map((file) => (
            <li key={file.name} style={styles.uploadItem}>
              <FileTypeBadge type={file.type} />
              <span style={styles.uploadName}>{file.name}</span>
              <span style={styles.uploadSize}>{formatBytes(file.size)}</span>
              <button type="button" style={styles.removeFileButton} onClick={() => removeFile(file.name)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ApplicationForm({ onSuccess }) {
  const { state, dispatch, t } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form, documents);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    dispatch({
      type: "SUBMIT_APPLICATION",
      payload: {
        userID: state.currentUser.userID,
        applicantName: state.currentUser.name,
        purpose: form.purpose.trim(),
        destination: form.destination.trim(),
        travelDates: { from: form.travelDateFrom, to: form.travelDateTo },
        requestedAmount: Number(form.requestedAmount),
        documents,
      },
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm(EMPTY_FORM);
      setDocuments([]);
      onSuccess?.();
    }, 1400);
  }

  if (submitted) {
    return (
      <Card style={styles.successCard}>
        <h3 style={styles.successTitle}>{t("applicant.applicationSubmitted")}</h3>
        <p style={styles.successText}>
          Your travel grant application for <strong>{form.destination}</strong> has been received.
        </p>
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 720 }}>
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div>
          <h2 style={styles.formTitle}>{t("applicant.formTitle")}</h2>
          <p style={styles.formSubtitle}>
            {t("applicant.formSubtitle")}
          </p>
        </div>

        <Field label={t("applicant.purpose")} error={errors.purpose} required>
          <textarea
            name="purpose"
            rows={4}
            placeholder="e.g. Present research paper at ICSE 2026 on distributed systems..."
            value={form.purpose}
            onChange={handleChange}
            style={styles.input}
          />
        </Field>

        <Field label={t("applicant.destination")} error={errors.destination} required>
          <input
            name="destination"
            type="text"
            placeholder="e.g. Vienna, Austria"
            value={form.destination}
            onChange={handleChange}
            style={styles.input}
          />
        </Field>

        <div style={styles.formRow}>
          <Field label={t("applicant.startDate")} error={errors.travelDateFrom} required>
            <input
              name="travelDateFrom"
              type="date"
              value={form.travelDateFrom}
              onChange={handleChange}
              style={styles.input}
            />
          </Field>
          <Field label={t("applicant.endDate")} error={errors.travelDateTo} required>
            <input
              name="travelDateTo"
              type="date"
              min={form.travelDateFrom || undefined}
              value={form.travelDateTo}
              onChange={handleChange}
              style={styles.input}
            />
          </Field>
        </div>

        <Field label={t("applicant.amount")} error={errors.requestedAmount} required>
          <input
            name="requestedAmount"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 850"
            value={form.requestedAmount}
            onChange={handleChange}
            style={styles.input}
          />
        </Field>

        <Field label={t("applicant.supportingDocuments")} error={errors.documents} required>
          <DocumentUpload files={documents} onChange={setDocuments} error={errors.documents} t={t} />
        </Field>

        <div style={styles.budgetHint}>
          Available budget:{" "}
          <strong style={{ color: state.budget.availableFunds > 0 ? "#10B981" : "#EF4444" }}>
            {state.budget.availableFunds.toLocaleString()}
          </strong>{" "}
          of {state.budget.totalFunds.toLocaleString()} total.
        </div>

        <div style={styles.formActions}>
          <Button type="submit" variant="primary" size="lg">
            {t("applicant.submit")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, error, required = false, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} {required && <span style={styles.required}>*</span>}
      </label>
      {children}
      {error && <span style={styles.fieldError}>{error}</span>}
    </div>
  );
}

function NotificationPanel({ applications, approvals }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(() => new Set());

  const notifications = useMemo(() => {
    const items = [];
    applications.forEach((application) => {
      items.push({
        id: `${application.applicationID}-status`,
        type: application.status,
        timestamp: application.submissionDate,
        message: `${application.applicationID} ${interpolate(t("common.isStatusFor"), {
          status: translatedStatus(t, application.status),
          destination: application.destination,
        })}`,
      });
      approvals
        .filter((approval) => approval.applicationID === application.applicationID)
        .forEach((approval) => {
          items.push({
            id: approval.approvalID,
            type: approval.decision,
            timestamp: approval.decisionDate,
            message:
              approval.decision === "Approved"
                ? `${application.applicationID} ${t("common.wasApprovedAtStage")} ${approval.stage}.`
                : `${application.applicationID} ${t("common.wasRejectedAtStage")} ${approval.stage}.`,
          });
        });
    });
    return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);
  }, [applications, approvals]);

  const unreadCount = notifications.filter((item) => !read.has(item.id)).length;

  function markRead(id) {
    setRead((prev) => new Set(prev).add(id));
  }

  function markAllRead() {
    setRead(new Set(notifications.map((item) => item.id)));
  }

  return (
    <div style={styles.notificationWrapper}>
      <button
        style={styles.notificationButton}
        onClick={() => setOpen((value) => !value)}
        aria-label={`${t("applicant.notifications")}, ${unreadCount} ${t("common.unread")}`}
      >
        {t("applicant.notifications")}
        {unreadCount > 0 && <span style={styles.notificationBadge}>{unreadCount}</span>}
      </button>
      {open && (
        <>
          <div style={styles.notificationBackdrop} onClick={() => setOpen(false)} />
          <div style={styles.notificationDropdown}>
            <div style={styles.notificationHeader}>
              <span style={styles.notificationTitle}>{t("applicant.notifications")}</span>
              {unreadCount > 0 && (
                <button style={styles.markAllButton} onClick={markAllRead}>
                  {t("common.markAllRead")}
                </button>
              )}
            </div>
            <div style={styles.notificationList}>
              {!notifications.length ? (
                <p style={styles.notificationEmpty}>No notifications yet.</p>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    style={{
                      ...styles.notificationItem,
                      background: read.has(item.id) ? "#FFFFFF" : "#F0F7FF",
                    }}
                    onClick={() => markRead(item.id)}
                  >
                    <span style={styles.notificationType}>{translatedStatus(t, item.type)}</span>
                    <span style={styles.notificationMessage}>{item.message}</span>
                    {!read.has(item.id) && <span style={styles.unreadDot} />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ApplicationStatusCard({ application, documents, approvals, onCancel }) {
  const { t } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const canCancel = CANCELABLE_STATUSES.includes(application.status);
  const reviewerComment = latestReviewerComment(application.applicationID, approvals);

  return (
    <Card
      padding="20px 22px"
      style={{
        opacity: application.status === APPLICATION_STATUSES.CANCELED ? 0.65 : 1,
        borderLeft: `4px solid ${STATUS_COLORS[application.status] || "var(--border)"}`,
      }}
    >
      <div style={styles.applicationHeader}>
        <div style={styles.applicationMeta}>
          <StatusBadge status={application.status} />
          <code style={styles.applicationId}>#{application.applicationID}</code>
        </div>
        <div style={styles.applicationActions}>
          {canCancel && (
            <Button size="sm" variant="danger" onClick={() => setShowConfirm(true)}>
              {t("common.cancel")}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setExpanded((value) => !value)}>
            {expanded ? t("common.hideDetails") : t("common.viewDetails")}
          </Button>
        </div>
      </div>

      <div>
        <h3 style={styles.destination}>{application.destination}</h3>
        <p style={styles.purpose}>{application.purpose}</p>
        <div style={styles.pills}>
          <span style={styles.pill}>{formatDate(application.travelDates.from)} - {formatDate(application.travelDates.to)}</span>
          <span style={styles.pill}>EUR {application.requestedAmount.toLocaleString()}</span>
          <span style={styles.pill}>{documents.length} document{documents.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {expanded && (
        <div style={styles.details}>
          <DetailRow label={t("common.submittedDate")} value={formatDate(application.submissionDate)} />
          <DetailRow label="Last Updated" value={formatDate(approvals.at(-1)?.decisionDate || application.submissionDate)} />

          {reviewerComment && (
            <div style={styles.reviewerComment}>
              <span style={styles.detailLabel}>Reviewer Note</span>
              <p style={styles.commentText}>"{reviewerComment}"</p>
            </div>
          )}

          {!!approvals.length && (
            <div style={styles.stagePills}>
              {[1, 2].map((stage) => {
                const approval = approvals.find((item) => item.stage === stage);
                return (
                  <span
                    key={stage}
                    style={{
                      ...styles.stagePill,
                      background: !approval ? "var(--cream)" : approval.decision === "Approved" ? "#F0FDF4" : "#FEF2F2",
                      color: !approval ? "var(--text-muted)" : approval.decision === "Approved" ? "#166534" : "#DC2626",
                    }}
                  >
                    Stage {stage}: {!approval ? "Pending" : approval.decision}
                  </span>
                );
              })}
            </div>
          )}

          {!!documents.length && (
            <div style={styles.documentRows}>
              <span style={styles.detailLabel}>Attached Documents</span>
              {documents.map((doc) => (
                <div key={doc.documentID} style={styles.documentRow}>
                  <FileTypeBadge type={doc.fileType} />
                  <span style={styles.documentName}>{doc.fileName}</span>
                  <span style={styles.documentSize}>{doc.fileSize}</span>
                  <span style={styles.documentSize}>{formatDate(doc.uploadDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title={t("common.cancelApplication")}>
        <p style={styles.modalText}>
          Are you sure you want to cancel your application for <strong>{application.destination}</strong>?
          This action cannot be undone, but the record will be kept for audit purposes.
        </p>
        <div style={styles.modalActions}>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            {t("common.keepApplication")}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onCancel(application);
              setShowConfirm(false);
            }}
          >
            {t("common.yesCancel")}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

export function ApplicantDashboard() {
  const { state, dispatch, t } = useApp();
  const [filter, setFilter] = useState("All");
  const [success, setSuccess] = useState("");

  const myApps = state.applications.filter((app) => app.userID === state.currentUser.userID);
  const filtered = filter === "All" ? myApps : myApps.filter((app) => app.status === filter);

  const stats = {
    total: myApps.length,
    approved: myApps.filter((app) => app.status === APPLICATION_STATUSES.APPROVED).length,
    pending: myApps.filter((app) =>
      [APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW].includes(app.status)
    ).length,
    requested: myApps
      .filter((app) => app.status !== APPLICATION_STATUSES.CANCELED)
      .reduce((sum, app) => sum + app.requestedAmount, 0),
  };

  function handleCancel(application) {
    dispatch({
      type: "CANCEL_APPLICATION",
      payload: { applicationID: application.applicationID, canceledBy: "Applicant" },
    });
    setSuccess(`Application ${application.applicationID} canceled.`);
    setTimeout(() => setSuccess(""), 4000);
  }

  return (
    <div>
      <SectionHeader
        title={`${t("applicant.welcome")}, ${state.currentUser.name.split(" ")[0]}`}
        subtitle={t("applicant.track")}
        action={
          <NotificationPanel
            applications={myApps}
            approvals={state.approvals}
          />
        }
      />

      {success && <Alert type="success" message={success} onDismiss={() => setSuccess("")} />}

      <div style={styles.statsRow}>
        <StatCard icon="" label={t("applicant.total")} value={stats.total} />
        <StatCard icon="" label={t("applicant.approved")} value={stats.approved} accent />
        <StatCard icon="" label={t("applicant.pending")} value={stats.pending} />
        <StatCard icon="" label={t("applicant.requested")} value={`EUR ${stats.requested.toLocaleString()}`} />
      </div>

      <div style={styles.filterTabs}>
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            style={{
              ...styles.filterTab,
              ...(filter === status ? styles.activeFilterTab : {}),
              ...(filter === status && status !== "All"
                ? { borderColor: STATUS_COLORS[status], color: STATUS_COLORS[status] }
                : {}),
            }}
            onClick={() => setFilter(status)}
          >
            {status === "All" ? t("common.all") : translatedStatus(t, status)}
            {status !== "All" && (
              <span style={styles.tabCount}>
                {myApps.filter((app) => app.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={styles.applicationList}>
        {!filtered.length ? (
          <Card style={styles.emptyState}>
            <p style={styles.emptyTitle}>{t("applicant.noApplications")}</p>
            <p style={styles.emptySub}>
              {filter === "All"
                ? t("applicant.submitHint")
                : `${t("applicant.noApplicationsWithStatus")} "${translatedStatus(t, filter)}".`}
            </p>
          </Card>
        ) : (
          filtered.map((application) => (
            <ApplicationStatusCard
              key={application.applicationID}
              application={application}
              documents={applicationDocuments(application, state.documents)}
              approvals={state.approvals.filter((approval) => approval.applicationID === application.applicationID)}
              onCancel={handleCancel}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function SubmitApplication() {
  const { t } = useApp();
  const [success, setSuccess] = useState("");

  return (
    <div>
      <SectionHeader
        title={t("page.submit.title")}
        subtitle={t("page.submit.subtitle")}
      />
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess("")} />}
      <ApplicationForm onSuccess={() => setSuccess("Application submitted successfully!")} />
    </div>
  );
}

export function ApplicantDocuments() {
  const { state, t } = useApp();
  const myApplications = state.applications.filter((app) => app.userID === state.currentUser.userID);
  const appIds = new Set(myApplications.map((app) => app.applicationID));
  const myDocs = state.documents.filter((doc) => appIds.has(doc.applicationID));

  return (
    <div>
      <SectionHeader title={t("page.documents.title")} subtitle={t("applicant.documentsSubtitle")} />
      <Card padding="0">
        {!myDocs.length ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>{t("applicant.noDocuments")}</p>
            <p style={styles.emptySub}>{t("applicant.documentsHint")}</p>
          </div>
        ) : (
          <div style={styles.documentsTable}>
            {myDocs.map((doc) => (
              <div key={doc.documentID} style={styles.documentsTableRow}>
                <div style={styles.documentsTableName}>
                  <FileTypeBadge type={doc.fileType} />
                  <div>
                    <div style={styles.documentName}>{doc.fileName}</div>
                    <div style={styles.documentSize}>{doc.fileType} | Uploaded {formatDate(doc.uploadDate)}</div>
                  </div>
                </div>
                <span style={styles.documentSize}>{doc.applicationID}</span>
                <span style={styles.documentSize}>{doc.fileSize}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

const styles = {
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
    marginBottom: 24,
  },
  filterTabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 20,
    borderBottom: "1.5px solid var(--border-light)",
    paddingBottom: 12,
  },
  filterTab: {
    padding: "6px 14px",
    borderRadius: 20,
    border: "1.5px solid var(--border)",
    background: "var(--white)",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  activeFilterTab: {
    background: "#FFFFFF",
    borderColor: "var(--navy)",
    color: "var(--navy)",
  },
  tabCount: {
    background: "rgba(15,30,60,0.08)",
    borderRadius: 10,
    padding: "1px 7px",
    fontSize: 11,
  },
  applicationList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  applicationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  applicationMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  applicationId: {
    fontSize: 12,
    color: "var(--text-muted)",
    fontWeight: 700,
  },
  applicationActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  destination: {
    fontSize: 20,
    color: "var(--text-primary)",
    marginBottom: 4,
  },
  purpose: {
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 12,
    lineHeight: 1.6,
  },
  pills: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    background: "var(--cream)",
    border: "1px solid var(--border-light)",
    borderRadius: 20,
    padding: "4px 10px",
    fontSize: 12,
    color: "var(--text-secondary)",
    fontWeight: 500,
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1.5px dashed var(--border-light)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  detailRow: {
    display: "flex",
    gap: 12,
    alignItems: "baseline",
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    minWidth: 110,
  },
  detailValue: {
    fontSize: 13,
    color: "var(--text-primary)",
  },
  reviewerComment: {
    background: "#FFFBEB",
    border: "1px solid #FDE68A",
    borderRadius: "var(--radius)",
    padding: "10px 14px",
  },
  commentText: {
    fontSize: 13,
    color: "#92400E",
    fontStyle: "italic",
    marginTop: 4,
  },
  stagePills: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  stagePill: {
    border: "1px solid var(--border-light)",
    borderRadius: "var(--radius)",
    padding: "5px 12px",
    fontSize: 11,
    fontWeight: 600,
  },
  documentRows: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  documentRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--cream)",
    padding: "8px 10px",
    borderRadius: "var(--radius)",
    fontSize: 13,
  },
  documentName: {
    flex: 1,
    color: "var(--text-primary)",
    fontWeight: 600,
    fontSize: 13,
  },
  documentSize: {
    color: "var(--text-muted)",
    fontSize: 12,
  },
  fileTypeBadge: {
    minWidth: 44,
    display: "inline-flex",
    justifyContent: "center",
    padding: "3px 8px",
    borderRadius: 4,
    background: "#E8F1F7",
    color: "var(--navy)",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.04em",
  },
  modalText: {
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 20,
    lineHeight: 1.6,
  },
  modalActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  emptyState: {
    textAlign: "center",
    padding: 48,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  emptySub: {
    fontSize: 13,
    color: "var(--text-muted)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  formTitle: {
    fontSize: 24,
    color: "var(--text-primary)",
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: "var(--text-muted)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text-secondary)",
  },
  required: {
    color: "#EF4444",
  },
  input: {
    width: "100%",
    padding: "10px 13px",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: 14,
    color: "var(--text-primary)",
    background: "var(--white)",
    outline: "none",
    resize: "vertical",
  },
  fieldError: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: 600,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  budgetHint: {
    padding: "10px 14px",
    background: "var(--cream)",
    borderRadius: "var(--radius)",
    fontSize: 12,
    color: "var(--text-muted)",
    lineHeight: 1.6,
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 6,
    borderTop: "1.5px solid var(--border-light)",
  },
  successCard: {
    maxWidth: 520,
    textAlign: "center",
    padding: 42,
  },
  successTitle: {
    fontSize: 22,
    color: "#166534",
    marginTop: 10,
  },
  successText: {
    fontSize: 14,
    color: "var(--text-muted)",
    marginTop: 8,
  },
  uploadWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  dropZone: {
    border: "2px dashed var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "28px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  dropIcon: {
    display: "block",
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 800,
    color: "var(--navy)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  dropText: {
    fontSize: 14,
    color: "var(--text-secondary)",
    margin: 0,
  },
  dropLink: {
    color: "#1D4ED8",
    fontWeight: 700,
    textDecoration: "underline",
  },
  dropHint: {
    fontSize: 12,
    color: "var(--text-muted)",
    marginTop: 4,
  },
  uploadErrors: {
    background: "#FFF1F2",
    border: "1.5px solid #FECDD3",
    borderRadius: "var(--radius)",
    padding: "10px 14px",
  },
  uploadErrorText: {
    fontSize: 12,
    color: "#BE123C",
    margin: 0,
  },
  uploadList: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  uploadItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--white)",
    border: "1.5px solid var(--border-light)",
    borderRadius: "var(--radius)",
    padding: "8px 12px",
  },
  uploadName: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  uploadSize: {
    fontSize: 12,
    color: "var(--text-muted)",
  },
  removeFileButton: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontSize: 13,
    cursor: "pointer",
    padding: "2px 5px",
    borderRadius: 4,
  },
  notificationWrapper: {
    position: "relative",
  },
  notificationButton: {
    position: "relative",
    background: "var(--white)",
    border: "1.5px solid var(--border-light)",
    borderRadius: "var(--radius)",
    padding: "8px 13px",
    boxShadow: "var(--shadow-sm)",
    color: "var(--navy)",
    fontSize: 12,
    fontWeight: 700,
  },
  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    background: "var(--gold)",
    color: "var(--navy)",
    fontSize: 10,
    fontWeight: 800,
    minWidth: 18,
    height: 18,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 140,
  },
  notificationDropdown: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: 340,
    background: "var(--white)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    border: "1.5px solid var(--border-light)",
    zIndex: 150,
    overflow: "hidden",
  },
  notificationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1.5px solid var(--border-light)",
  },
  notificationTitle: {
    fontWeight: 700,
    fontSize: 14,
    color: "var(--text-primary)",
  },
  markAllButton: {
    background: "none",
    border: "none",
    fontSize: 12,
    fontWeight: 700,
    color: "#1D4ED8",
    cursor: "pointer",
  },
  notificationList: {
    maxHeight: 320,
    overflowY: "auto",
  },
  notificationItem: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid var(--border-light)",
    textAlign: "left",
  },
  notificationMessage: {
    flex: 1,
    fontSize: 13,
    color: "var(--text-primary)",
    lineHeight: 1.45,
  },
  notificationType: {
    minWidth: 72,
    fontSize: 10,
    fontWeight: 800,
    color: "var(--navy)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#3B82F6",
    flexShrink: 0,
    marginTop: 6,
  },
  notificationEmpty: {
    padding: "24px 16px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: 13,
  },
  documentsTable: {
    display: "flex",
    flexDirection: "column",
  },
  documentsTableRow: {
    display: "grid",
    gridTemplateColumns: "1fr 110px 90px",
    gap: 14,
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid var(--border-light)",
  },
  documentsTableName: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
};
