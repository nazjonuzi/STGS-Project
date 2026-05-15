// ============================================================
// STGS  AppContext
// Centralised state for all three modules (Applicant, Reviewer, Admin)
// Using React Context + useReducer for predictable state management
// No backend  all mutations happen here in memory
// ============================================================

import { createContext, useContext, useReducer, useCallback } from "react";
import {
  BUDGET,
  INITIAL_USERS,
  INITIAL_APPLICATIONS,
  INITIAL_DOCUMENTS,
  INITIAL_APPROVALS,
  INITIAL_AUDIT_LOGS,
} from "../data/mockData";
import { translate } from "../i18n";

//  helpers 
const calcAllocated = (applications) =>
  applications
    .filter((a) => a.status === "Approved")
    .reduce((sum, a) => sum + a.requestedAmount, 0);

const makeBudgetState = (applications) => {
  const allocated = calcAllocated(applications);
  return {
    ...BUDGET,
    allocatedFunds: allocated,
    availableFunds: BUDGET.totalFunds - allocated,
  };
};

const newLogID = (logs) => `LOG-${String(logs.length + 1).padStart(3, "0")}`;
const DEMO_PASSWORD = "password";

//  initial state 
const buildInitial = () => ({
  currentUser: null,
  language: "en",
  users: INITIAL_USERS,
  applications: INITIAL_APPLICATIONS,
  documents: INITIAL_DOCUMENTS,
  approvals: INITIAL_APPROVALS,
  auditLogs: INITIAL_AUDIT_LOGS,
  budget: makeBudgetState(INITIAL_APPLICATIONS),
});

//  reducer 
function reducer(state, action) {
  switch (action.type) {

    // Auth / role switching
    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload };

    case "SET_LANGUAGE":
      return { ...state, language: action.payload };

    //  User management 
    case "UPDATE_USER_ROLE": {
      const users = state.users.map((u) =>
        u.userID === action.payload.userID ? { ...u, role: action.payload.role } : u
      );
      const log = {
        logID: newLogID(state.auditLogs),
        timestamp: new Date().toISOString(),
        userID: state.currentUser.userID,
        userName: state.currentUser.name,
        action: "RoleChanged",
        targetID: action.payload.userID,
        details: `Role of ${action.payload.userName} changed to ${action.payload.role}`,
      };
      return { ...state, users, auditLogs: [log, ...state.auditLogs] };
    }

    case "TOGGLE_USER_ACTIVE": {
      const users = state.users.map((u) =>
        u.userID === action.payload.userID ? { ...u, active: !u.active } : u
      );
      const target = state.users.find((u) => u.userID === action.payload.userID);
      const log = {
        logID: newLogID(state.auditLogs),
        timestamp: new Date().toISOString(),
        userID: state.currentUser.userID,
        userName: state.currentUser.name,
        action: target?.active ? "UserDeactivated" : "UserActivated",
        targetID: action.payload.userID,
        details: `User ${target?.name} ${target?.active ? "deactivated" : "activated"}`,
      };
      return { ...state, users, auditLogs: [log, ...state.auditLogs] };
    }

    //  Application actions 
    case "SUBMIT_APPLICATION": {
      const nextNumber = state.applications.length + 1;
      const applicationID = `APP-${String(nextNumber).padStart(3, "0")}`;
      const submittedDocuments = action.payload.documents || [];
      const newDocuments = submittedDocuments.map((doc, index) => ({
        documentID: `DOC-${String(state.documents.length + index + 1).padStart(3, "0")}`,
        applicationID,
        fileName: doc.fileName || doc.name,
        fileType: doc.fileType || doc.type || "FILE",
        fileSize: doc.fileSize || doc.sizeLabel || `${doc.size || 0} B`,
        uploadDate: new Date().toISOString().split("T")[0],
      }));
      const app = {
        ...action.payload,
        applicationID,
        status: "Submitted",
        submissionDate: new Date().toISOString().split("T")[0],
        documents: newDocuments.map((doc) => doc.documentID),
      };
      const log = {
        logID: newLogID(state.auditLogs),
        timestamp: new Date().toISOString(),
        userID: state.currentUser.userID,
        userName: state.currentUser.name,
        action: "Submitted",
        targetID: app.applicationID,
        details: `Application ${app.applicationID} submitted`,
      };
      return {
        ...state,
        applications: [...state.applications, app],
        documents: [...state.documents, ...newDocuments],
        auditLogs: [log, ...state.auditLogs],
      };
    }

    case "CANCEL_APPLICATION": {
      const { applicationID, canceledBy } = action.payload;
      const applications = state.applications.map((a) =>
        a.applicationID === applicationID ? { ...a, status: "Canceled" } : a
      );
      const log = {
        logID: newLogID(state.auditLogs),
        timestamp: new Date().toISOString(),
        userID: state.currentUser.userID,
        userName: state.currentUser.name,
        action: "Canceled",
        targetID: applicationID,
        details: `Application ${applicationID} canceled by ${canceledBy}`,
      };
      return {
        ...state,
        applications,
        budget: makeBudgetState(applications),
        auditLogs: [log, ...state.auditLogs],
      };
    }

    case "DELETE_APPLICATION": {
      const { applicationID } = action.payload;
      // Block if referenced by active approvals (non-canceled/rejected)
      const hasActiveApprovals = state.approvals.some(
        (apr) => apr.applicationID === applicationID
      );
      if (hasActiveApprovals) {
        return { ...state, _error: "Cannot delete: application has linked approval records." };
      }
      const applications = state.applications.filter(
        (a) => a.applicationID !== applicationID
      );
      const documents = state.documents.filter(
        (d) => d.applicationID !== applicationID
      );
      const log = {
        logID: newLogID(state.auditLogs),
        timestamp: new Date().toISOString(),
        userID: state.currentUser.userID,
        userName: state.currentUser.name,
        action: "Deleted",
        targetID: applicationID,
        details: `Application ${applicationID} permanently deleted`,
      };
      return {
        ...state,
        applications,
        documents,
        budget: makeBudgetState(applications),
        auditLogs: [log, ...state.auditLogs],
        _error: null,
      };
    }

    //  Review actions 
    case "REVIEW_APPLICATION": {
      const { applicationID, reviewerID, stage, decision, comment } = action.payload;

      // Budget enforcement on approval at stage 2
      if (decision === "Approved" && stage === 2) {
        const app = state.applications.find((a) => a.applicationID === applicationID);
        if (app && state.budget.availableFunds < app.requestedAmount) {
          return {
            ...state,
            _error: `Insufficient budget. Requested: ${app.requestedAmount.toLocaleString()}, Available: ${state.budget.availableFunds.toLocaleString()}`,
          };
        }
      }

      const newApproval = {
        approvalID: `APR-${String(state.approvals.length + 1).padStart(3, "0")}`,
        applicationID,
        reviewerID,
        stage,
        decision,
        comment,
        decisionDate: new Date().toISOString().split("T")[0],
      };

      let newStatus = stage === 1
        ? (decision === "Approved" ? "UnderReview" : "Rejected")
        : (decision === "Approved" ? "Approved" : "Rejected");

      const applications = state.applications.map((a) =>
        a.applicationID === applicationID ? { ...a, status: newStatus } : a
      );

      const log = {
        logID: newLogID(state.auditLogs),
        timestamp: new Date().toISOString(),
        userID: reviewerID,
        userName: state.users.find((u) => u.userID === reviewerID)?.name || reviewerID,
        action: decision,
        targetID: applicationID,
        details: `Stage ${stage} ${decision} for ${applicationID}. ${comment || ""}`,
      };

      return {
        ...state,
        approvals: [...state.approvals, newApproval],
        applications,
        budget: makeBudgetState(applications),
        auditLogs: [log, ...state.auditLogs],
        _error: null,
      };
    }

    case "CLEAR_ERROR":
      return { ...state, _error: null };

    case "ADD_AUDIT_LOG": {
      const log = {
        logID: newLogID(state.auditLogs),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      return { ...state, auditLogs: [log, ...state.auditLogs] };
    }

    default:
      return state;
  }
}

//  Context 
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, buildInitial);
  const t = useCallback((key) => translate(state.language, key), [state.language]);

  const login = useCallback(
    ({ username, password, role }) => {
      const normalized = username.trim().toLowerCase();
      const user = state.users.find(
        (u) =>
          u.active &&
          u.role === role &&
          (u.email.toLowerCase() === normalized ||
            u.userID.toLowerCase() === normalized ||
            u.name.toLowerCase() === normalized)
      );

      if (!user || password !== DEMO_PASSWORD) {
        return {
          success: false,
          message: t("login.invalid"),
        };
      }

      dispatch({
        type: "ADD_AUDIT_LOG",
        payload: {
          userID: user.userID,
          userName: user.name,
          action: "Login",
          targetID: null,
          details: `${user.name} logged in as ${user.role}`,
        },
      });
      dispatch({ type: "SET_CURRENT_USER", payload: user });
      return { success: true, message: "" };
    },
    [state.users, t]
  );

  const logout = useCallback(() => {
    dispatch({ type: "SET_CURRENT_USER", payload: null });
  }, []);

  const setLanguage = useCallback((language) => {
    dispatch({ type: "SET_LANGUAGE", payload: language });
  }, []);

  const switchUser = useCallback(
    (userID) => {
      const user = state.users.find((u) => u.userID === userID);
      if (user) {
        dispatch({ type: "ADD_AUDIT_LOG", payload: {
          userID: user.userID,
          userName: user.name,
          action: "Login",
          targetID: null,
          details: `${user.name} logged in as ${user.role}`,
        }});
        dispatch({ type: "SET_CURRENT_USER", payload: user });
      }
    },
    [state.users]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout, switchUser, t, setLanguage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
