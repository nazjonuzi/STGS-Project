// ============================================================
// STGS  AppContext
// Centralised state for all three modules (Applicant, Reviewer, Admin)
// Using React Context + useReducer for predictable state management
// No backend  all mutations happen here in memory
// ============================================================

import { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import {
  BUDGET,
  INITIAL_USERS,
  INITIAL_APPLICATIONS,
  INITIAL_DOCUMENTS,
  INITIAL_APPROVALS,
  INITIAL_AUDIT_LOGS,
} from "../data/mockData";
import { translate } from "../i18n";
import { supabase } from "../lib/supabase";

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

const REAL_DEMO_PASSWORD = "demo1234";

const logSupabaseError = (operation, error, context = {}) => {
  if (!error) return;
  console.error(`[Supabase:${operation}]`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    context,
  });
};

const mapSupabaseRole = (role) => {
  if (role === "Scientific Council") return "ScientificCouncil";
  if (role === "Deans Office" || role === "Dean's Office") return "DeansOffice";
  if (role === "Administrator") return "Administrator";
  return "Applicant";
};

const mapDbStatus = (status) => (status === "Under Review" ? "UnderReview" : status);

const mapDbApplication = (app) => ({
  applicationID: app.id,
  userID: app.applicant_id,
  applicantName: app.applicant_name,
  applicantEmail: app.applicant_email,
  purpose: app.purpose,
  destination: app.destination,
  travelDates: {
    from: app.travel_date_from,
    to: app.travel_date_to,
  },
  requestedAmount: Number(app.requested_amount || 0),
  status: mapDbStatus(app.status),
  submissionDate: (app.submission_date || app.created_at || "").split("T")[0],
  documents: [],
  source: "supabase",
});

const mapDbApproval = (approval) => ({
  approvalID: approval.id,
  applicationID: approval.application_id,
  reviewerID: approval.reviewer_id,
  reviewerName: approval.reviewer_name,
  stage: approval.stage === "Scientific Council" ? 1 : 2,
  decision: approval.decision,
  comment: approval.comment,
  decisionDate: (
    approval.created_at ||
    approval.decision_date ||
    approval.date ||
    new Date().toISOString()
  ).split("T")[0],
});

const mapProfileToCurrentUser = (profile) => ({
  userID: profile.id,
  name: profile.name,
  email: profile.email,
  role: mapSupabaseRole(profile.role),
  active: true,
  source: "supabase",
});

//  initial state 
const buildInitial = () => ({
  currentUser: null,
  authMode: "mock",
  supabaseUser: null,
  profile: null,
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

    case "SET_SUPABASE_SESSION":
      return {
        ...state,
        authMode: "supabase",
        currentUser: action.payload.currentUser,
        supabaseUser: action.payload.supabaseUser,
        profile: action.payload.profile,
      };

    case "LOAD_SUPABASE_DATA":
      return {
        ...state,
        applications: action.payload.applications,
        approvals: action.payload.approvals,
        budget: action.payload.budget,
      };

    case "LOGOUT":
      return {
        ...state,
        currentUser: null,
        authMode: "mock",
        supabaseUser: null,
        profile: null,
        applications: INITIAL_APPLICATIONS,
        documents: INITIAL_DOCUMENTS,
        approvals: INITIAL_APPROVALS,
        budget: makeBudgetState(INITIAL_APPLICATIONS),
      };

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

  const loadSupabaseData = useCallback(async () => {
    if (!supabase) return;

    const [
      { data: applicationsData, error: applicationsError },
      { data: approvalsData, error: approvalsError },
      { data: budgetData, error: budgetError },
    ] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .order("submission_date", { ascending: false }),
      supabase
        .from("approval_history")
        .select("*"),
      supabase
        .from("budget")
        .select("*")
        .single(),
    ]);

    if (applicationsError) {
      logSupabaseError("load applications", applicationsError);
      return;
    }
    logSupabaseError("load approval history", approvalsError);
    logSupabaseError("load budget", budgetError);

    const approvals = (approvalsData || [])
      .map(mapDbApproval)
      .sort((a, b) => a.stage - b.stage || a.decisionDate.localeCompare(b.decisionDate));

    dispatch({
      type: "LOAD_SUPABASE_DATA",
      payload: {
        applications: (applicationsData || []).map(mapDbApplication),
        approvals,
        budget: budgetData
          ? {
              budgetID: budgetData.id,
              academicYear: budgetData.academic_year,
              totalFunds: Number(budgetData.total_funds || 0),
              allocatedFunds: Number(budgetData.allocated_funds || 0),
              availableFunds: Number(budgetData.available_funds || 0),
            }
          : makeBudgetState([]),
      },
    });
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();
      logSupabaseError("restore session", error);
      const sessionUser = data?.session?.user;
      if (!sessionUser || cancelled) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .single();
      logSupabaseError("restore profile", profileError, { userID: sessionUser.id });

      if (!profile || cancelled) return;

      dispatch({
        type: "SET_SUPABASE_SESSION",
        payload: {
          currentUser: mapProfileToCurrentUser(profile),
          supabaseUser: sessionUser,
          profile,
        },
      });
      await loadSupabaseData();
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [loadSupabaseData]);

  const login = useCallback(
    async ({ username, password, role }) => {
      const normalized = username.trim().toLowerCase();

      if (supabase && password === REAL_DEMO_PASSWORD) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });
        logSupabaseError("login", error, { email: normalized });

        if (!error && data.user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();
          logSupabaseError("load profile after login", profileError, {
            userID: data.user.id,
          });

          if (!profileError && profile) {
            const mappedRole = mapSupabaseRole(profile.role);
            if (role && mappedRole !== role) {
              return {
                success: false,
                message: "This demo account does not match the selected role.",
              };
            }

            dispatch({
              type: "SET_SUPABASE_SESSION",
              payload: {
                currentUser: mapProfileToCurrentUser(profile),
                supabaseUser: data.user,
                profile,
              },
            });
            await loadSupabaseData();
            return { success: true, message: "" };
          }
        }
      }

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
    [state.users, t, loadSupabaseData]
  );

  const logout = useCallback(async () => {
    if (state.authMode === "supabase" && supabase) {
      await supabase.auth.signOut();
    }
    dispatch({ type: "LOGOUT" });
  }, [state.authMode]);

  useEffect(() => {
    if (state.authMode !== "supabase" || !supabase) return undefined;

    const channel = supabase
      .channel("stgs-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        loadSupabaseData
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approval_history" },
        loadSupabaseData
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budget" },
        loadSupabaseData
      )
      .subscribe();

    const fallbackRefresh = window.setInterval(loadSupabaseData, 5000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(fallbackRefresh);
    };
  }, [state.authMode, loadSupabaseData]);

  const submitApplication = useCallback(async (payload) => {
    if (state.authMode === "supabase" && supabase && state.profile) {
      const { error } = await supabase.from("applications").insert({
        applicant_id: state.profile.id,
        applicant_name: state.profile.name,
        applicant_email: state.profile.email,
        purpose: payload.purpose,
        destination: payload.destination,
        travel_date_from: payload.travelDates.from,
        travel_date_to: payload.travelDates.to,
        requested_amount: payload.requestedAmount,
        status: "Submitted",
        submission_date: new Date().toISOString().split("T")[0],
      });
      logSupabaseError("submit application", error, {
        userID: state.profile.id,
        status: "Submitted",
      });
      if (error) return { success: false, message: error.message };
      await loadSupabaseData();
      return { success: true, message: "" };
    }

    dispatch({ type: "SUBMIT_APPLICATION", payload });
    return { success: true, message: "" };
  }, [state.authMode, state.profile, loadSupabaseData]);

  const cancelApplication = useCallback(async (applicationID, canceledBy = "Applicant") => {
    if (state.authMode === "supabase" && supabase) {
      const { error } = await supabase
        .from("applications")
        .update({ status: "Canceled" })
        .eq("id", applicationID);
      logSupabaseError("cancel application", error, { applicationID });
      if (error) return { success: false, message: error.message };
      await loadSupabaseData();
      return { success: true, message: "" };
    }

    dispatch({ type: "CANCEL_APPLICATION", payload: { applicationID, canceledBy } });
    return { success: true, message: "" };
  }, [state.authMode, loadSupabaseData]);

  const reviewApplication = useCallback(async (payload) => {
    if (state.authMode === "supabase" && supabase && state.profile) {
      const app = state.applications.find((item) => item.applicationID === payload.applicationID);
      if (!app) return { success: false, message: "Application not found." };

      const isFinalApproval = payload.stage === 2 && payload.decision === "Approved";
      if (isFinalApproval && app.requestedAmount > state.budget.availableFunds) {
        return { success: false, message: "Approval blocked: insufficient available budget." };
      }

      const stageName = payload.stage === 1 ? "Scientific Council" : "Deans Office";
      const nextStatus =
        payload.decision === "Rejected"
          ? "Rejected"
          : payload.stage === 1
            ? "Under Review"
            : "Approved";

      const { error: historyError } = await supabase.from("approval_history").insert({
        application_id: payload.applicationID,
        stage: stageName,
        decision: payload.decision,
        reviewer_id: state.profile.id,
        reviewer_name: state.profile.name,
        comment: payload.comment || "No comment provided.",
      });
      logSupabaseError("insert approval history", historyError, {
        applicationID: payload.applicationID,
        stage: stageName,
        decision: payload.decision,
      });
      if (historyError) return { success: false, message: historyError.message };

      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: nextStatus })
        .eq("id", payload.applicationID);
      logSupabaseError("update application status", updateError, {
        applicationID: payload.applicationID,
        nextStatus,
      });
      if (updateError) return { success: false, message: updateError.message };

      if (isFinalApproval) {
        const { error: budgetError } = await supabase
          .from("budget")
          .update({
            allocated_funds: state.budget.allocatedFunds + app.requestedAmount,
            available_funds: state.budget.availableFunds - app.requestedAmount,
          })
          .eq("id", state.budget.budgetID);
        logSupabaseError("update budget", budgetError, {
          budgetID: state.budget.budgetID,
          applicationID: payload.applicationID,
        });
        if (budgetError) return { success: false, message: budgetError.message };
      }

      await loadSupabaseData();
      return { success: true, message: "" };
    }

    dispatch({ type: "REVIEW_APPLICATION", payload });
    return { success: true, message: "" };
  }, [state.authMode, state.profile, state.applications, state.budget, loadSupabaseData]);

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
    <AppContext.Provider
      value={{
        state,
        dispatch,
        login,
        logout,
        switchUser,
        t,
        setLanguage,
        loadSupabaseData,
        submitApplication,
        cancelApplication,
        reviewApplication,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
