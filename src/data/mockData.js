// ============================================================
// STGS  Shared Mock Data
// Single source of truth for all modules (Applicant, Reviewer, Admin)
// No backend, no database  all state lives in AppContext
// ============================================================

export const BUDGET = {
  budgetID: "B-2026",
  academicYear: "2025/2026",
  totalFunds: 50000,        // EUR
  currency: "EUR",
};

export const INITIAL_USERS = [
  {
    userID: "U001",
    name: "Ana Petrovska",
    email: "ana.petrovska@fcse.edu.mk",
    role: "Applicant",
    registeredAt: "2026-01-10",
    active: true,
  },
  {
    userID: "U002",
    name: "Marko Ilievski",
    email: "marko.ilievski@fcse.edu.mk",
    role: "Applicant",
    registeredAt: "2026-01-15",
    active: true,
  },
  {
    userID: "U003",
    name: "Prof. Dr. Stefan Jovanov",
    email: "stefan.jovanov@fcse.edu.mk",
    role: "ScientificCouncil",
    registeredAt: "2025-09-01",
    active: true,
  },
  {
    userID: "U004",
    name: "Prof. Dr. Elena Ristova",
    email: "elena.ristova@fcse.edu.mk",
    role: "ScientificCouncil",
    registeredAt: "2025-09-01",
    active: true,
  },
  {
    userID: "U005",
    name: "Biljana Kostovska",
    email: "biljana.kostovska@fcse.edu.mk",
    role: "DeansOffice",
    registeredAt: "2025-09-01",
    active: true,
  },
  {
    userID: "U006",
    name: "Naz Jonuzi",
    email: "naz.jonuzi@fcse.edu.mk",
    role: "Administrator",
    registeredAt: "2025-08-15",
    active: true,
  },
];

export const INITIAL_APPLICATIONS = [
  {
    applicationID: "APP-001",
    userID: "U001",
    applicantName: "Ana Petrovska",
    purpose: "Present research paper on distributed systems at ICDS 2026",
    destination: "Vienna, Austria",
    travelDates: { from: "2026-06-10", to: "2026-06-14" },
    requestedAmount: 1800,
    status: "Approved",
    submissionDate: "2026-03-01",
    documents: ["DOC-001", "DOC-002"],
  },
  {
    applicationID: "APP-002",
    userID: "U002",
    applicantName: "Marko Ilievski",
    purpose: "Attend IEEE INFOCOM 2026 workshop on network security",
    destination: "Amsterdam, Netherlands",
    travelDates: { from: "2026-07-05", to: "2026-07-09" },
    requestedAmount: 2400,
    status: "UnderReview",
    submissionDate: "2026-03-10",
    documents: ["DOC-003"],
  },
  {
    applicationID: "APP-003",
    userID: "U001",
    applicantName: "Ana Petrovska",
    purpose: "Machine Learning summer school  ETH Zurich",
    destination: "Zurich, Switzerland",
    travelDates: { from: "2026-08-01", to: "2026-08-07" },
    requestedAmount: 3200,
    status: "Submitted",
    submissionDate: "2026-03-20",
    documents: ["DOC-004"],
  },
  {
    applicationID: "APP-004",
    userID: "U002",
    applicantName: "Marko Ilievski",
    purpose: "ACM CCS 2026  cybersecurity paper presentation",
    destination: "Dallas, USA",
    travelDates: { from: "2026-10-14", to: "2026-10-18" },
    requestedAmount: 4500,
    status: "Rejected",
    submissionDate: "2026-02-15",
    documents: ["DOC-005", "DOC-006"],
  },
  {
    applicationID: "APP-005",
    userID: "U001",
    applicantName: "Ana Petrovska",
    purpose: "CVPR 2026  computer vision research",
    destination: "Seattle, USA",
    travelDates: { from: "2026-06-17", to: "2026-06-21" },
    requestedAmount: 5200,
    status: "Approved",
    submissionDate: "2026-02-28",
    documents: ["DOC-007"],
  },
  {
    applicationID: "APP-006",
    userID: "U002",
    applicantName: "Marko Ilievski",
    purpose: "NeurIPS 2026  deep learning workshop",
    destination: "Vancouver, Canada",
    travelDates: { from: "2026-12-08", to: "2026-12-13" },
    requestedAmount: 3800,
    status: "Canceled",
    submissionDate: "2026-03-05",
    documents: [],
  },
];

export const INITIAL_DOCUMENTS = [
  { documentID: "DOC-001", applicationID: "APP-001", fileName: "conference_invitation.pdf", fileType: "PDF", fileSize: "1.2 MB", uploadDate: "2026-03-01" },
  { documentID: "DOC-002", applicationID: "APP-001", fileName: "abstract_icds.pdf", fileType: "PDF", fileSize: "0.8 MB", uploadDate: "2026-03-01" },
  { documentID: "DOC-003", applicationID: "APP-002", fileName: "ieee_infocom_invite.pdf", fileType: "PDF", fileSize: "1.5 MB", uploadDate: "2026-03-10" },
  { documentID: "DOC-004", applicationID: "APP-003", fileName: "eth_acceptance.pdf", fileType: "PDF", fileSize: "0.6 MB", uploadDate: "2026-03-20" },
  { documentID: "DOC-005", applicationID: "APP-004", fileName: "acm_invitation.pdf", fileType: "PDF", fileSize: "1.1 MB", uploadDate: "2026-02-15" },
  { documentID: "DOC-006", applicationID: "APP-004", fileName: "paper_abstract.docx", fileType: "DOCX", fileSize: "0.3 MB", uploadDate: "2026-02-15" },
  { documentID: "DOC-007", applicationID: "APP-005", fileName: "cvpr_acceptance.pdf", fileType: "PDF", fileSize: "0.9 MB", uploadDate: "2026-02-28" },
];

export const INITIAL_APPROVALS = [
  { approvalID: "APR-001", applicationID: "APP-001", reviewerID: "U003", stage: 1, decision: "Approved", comment: "Strong academic merit. Accepted for international conference.", decisionDate: "2026-03-08" },
  { approvalID: "APR-002", applicationID: "APP-001", reviewerID: "U005", stage: 2, decision: "Approved", comment: "Within budget. Institutionally validated.", decisionDate: "2026-03-12" },
  { approvalID: "APR-003", applicationID: "APP-004", reviewerID: "U003", stage: 1, decision: "Rejected", comment: "Budget constraints for international long-haul travel at this stage.", decisionDate: "2026-02-22" },
  { approvalID: "APR-004", applicationID: "APP-005", reviewerID: "U003", stage: 1, decision: "Approved", comment: "Top-tier venue. Publication confirmed.", decisionDate: "2026-03-05" },
  { approvalID: "APR-005", applicationID: "APP-005", reviewerID: "U005", stage: 2, decision: "Approved", comment: "Approved. Funds reserved.", decisionDate: "2026-03-09" },
];

export const INITIAL_AUDIT_LOGS = [
  { logID: "LOG-001", timestamp: "2026-03-01T09:15:00", userID: "U001", userName: "Ana Petrovska", action: "Submitted", targetID: "APP-001", details: "Application APP-001 submitted" },
  { logID: "LOG-002", timestamp: "2026-03-05T11:30:00", userID: "U005", userName: "Biljana Kostovska", action: "Login", targetID: null, details: "User login successful" },
  { logID: "LOG-003", timestamp: "2026-03-08T14:00:00", userID: "U003", userName: "Prof. Dr. Stefan Jovanov", action: "Approved", targetID: "APP-001", details: "Stage 1 approved for APP-001" },
  { logID: "LOG-004", timestamp: "2026-03-09T10:20:00", userID: "U003", userName: "Prof. Dr. Stefan Jovanov", action: "Approved", targetID: "APP-005", details: "Stage 1 approved for APP-005" },
  { logID: "LOG-005", timestamp: "2026-03-09T10:45:00", userID: "U005", userName: "Biljana Kostovska", action: "Approved", targetID: "APP-005", details: "Stage 2 approved for APP-005" },
  { logID: "LOG-006", timestamp: "2026-03-10T08:55:00", userID: "U002", userName: "Marko Ilievski", action: "Submitted", targetID: "APP-002", details: "Application APP-002 submitted" },
  { logID: "LOG-007", timestamp: "2026-03-12T09:00:00", userID: "U005", userName: "Biljana Kostovska", action: "Approved", targetID: "APP-001", details: "Stage 2 approved for APP-001" },
  { logID: "LOG-008", timestamp: "2026-02-22T15:10:00", userID: "U003", userName: "Prof. Dr. Stefan Jovanov", action: "Rejected", targetID: "APP-004", details: "Stage 1 rejected for APP-004" },
  { logID: "LOG-009", timestamp: "2026-03-05T13:00:00", userID: "U002", userName: "Marko Ilievski", action: "Canceled", targetID: "APP-006", details: "Application APP-006 canceled by applicant" },
  { logID: "LOG-010", timestamp: "2026-03-20T10:00:00", userID: "U001", userName: "Ana Petrovska", action: "Submitted", targetID: "APP-003", details: "Application APP-003 submitted" },
];

// Role display labels
export const ROLE_LABELS = {
  Applicant: "Applicant",
  ScientificCouncil: "Scientific Council",
  DeansOffice: "Dean's Office",
  Administrator: "Administrator",
};

// Application status display config
export const STATUS_CONFIG = {
  Submitted:    { label: "Submitted",     color: "#3B82F6" },
  UnderReview:  { label: "Under Review",  color: "#F59E0B" },
  Approved:     { label: "Approved",      color: "#10B981" },
  Rejected:     { label: "Rejected",      color: "#EF4444" },
  Canceled:     { label: "Canceled",      color: "#6B7280" },
};

export const ALL_ROLES = ["Applicant", "ScientificCouncil", "DeansOffice", "Administrator"];

export const APPLICATION_STATUSES = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "UnderReview",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELED: "Canceled",
};

export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

export const ACCEPTED_FILE_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
