// ============================================================
// App.jsx Root router
// Reads currentUser.role from AppContext and renders the
// correct dashboard. All navigation state lives here.
// ============================================================

import { useState, useEffect } from "react";
import { useApp } from "./context/AppContext";
import AppShell from "./components/shared/AppShell";

// Admin
import AdminDashboard   from "./components/admin/AdminDashboard";
import BudgetOverview   from "./components/admin/BudgetOverview";
import UserManagement   from "./components/admin/UserManagement";
import RecordManagement from "./components/admin/RecordManagement";
import AuditLog         from "./components/admin/AuditLog";

// Applicant
import {
  ApplicantDashboard,
  SubmitApplication,
  ApplicantDocuments,
} from "./components/applicant/ApplicantModule";

// Reviewer
import { ReviewerQueue, ReviewHistory } from "./components/reviewer/ReviewerModule";
import { ROLE_LABELS } from "./data/mockData";
import { LANGUAGES } from "./i18n";

// Default landing page per role
const DEFAULT_PAGE = {
  Administrator:   "admin",
  Applicant:       "dashboard",
  ScientificCouncil: "review",
  DeansOffice:     "review",
};

const REAL_DEMO_USERS = [
  {
    userID: "real-applicant",
    name: "Real Applicant Demo",
    email: "applicant@stgs.mk",
    role: "Applicant",
    active: true,
    password: "demo1234",
  },
  {
    userID: "real-council",
    name: "Scientific Council Demo",
    email: "council@stgs.mk",
    role: "ScientificCouncil",
    active: true,
    password: "demo1234",
  },
  {
    userID: "real-deans",
    name: "Dean's Office Demo",
    email: "deans@stgs.mk",
    role: "DeansOffice",
    active: true,
    password: "demo1234",
  },
];

// Page metadata
const PAGE_META = {
  admin:    { title: "page.admin.title",        subtitle: "page.admin.subtitle" },
  budget:   { title: "page.budget.title",       subtitle: "page.budget.subtitle" },
  users:    { title: "page.users.title",        subtitle: "page.users.subtitle" },
  records:  { title: "page.records.title",      subtitle: "page.records.subtitle" },
  auditlog: { title: "page.audit.title",        subtitle: "page.audit.subtitle" },
  dashboard:{ title: "page.applications.title", subtitle: "page.applications.subtitle" },
  submit:   { title: "page.submit.title",       subtitle: "page.submit.subtitle" },
  documents:{ title: "page.documents.title",    subtitle: "page.documents.subtitle" },
  review:   { title: "page.review.title",       subtitle: "page.review.subtitle" },
  history:  { title: "page.history.title",      subtitle: "page.history.subtitle" },
};

export default function App() {
  const { state, login, t, setLanguage } = useApp();
  const role = state.currentUser?.role;

  const [page, setPage] = useState(DEFAULT_PAGE[role] || "dashboard");

  // When the user switches role via RoleSwitcher, reset to that role's home page
  useEffect(() => {
    setPage(DEFAULT_PAGE[role] || "dashboard");
  }, [role]);

  const meta = PAGE_META[page] || { title: page, subtitle: "" };

  if (!state.currentUser) {
    return (
      <LoginPage
        users={state.users}
        onLogin={login}
        language={state.language}
        setLanguage={setLanguage}
        t={t}
      />
    );
  }

  function renderPage() {
    // Admin pages
    if (role === "Administrator") {
      if (page === "admin")    return <AdminDashboard onNavigate={setPage} />;
      if (page === "budget")   return <BudgetOverview />;
      if (page === "users")    return <UserManagement />;
      if (page === "records")  return <RecordManagement />;
      if (page === "auditlog") return <AuditLog />;
    }

    // Applicant pages
    if (role === "Applicant") {
      if (page === "dashboard") return <ApplicantDashboard />;
      if (page === "submit")    return <SubmitApplication />;
      if (page === "documents") return <ApplicantDocuments />;
    }

    // Reviewer pages (Scientific Council + Dean's Office)
    if (role === "ScientificCouncil" || role === "DeansOffice") {
      if (page === "review")  return <ReviewerQueue />;
      if (page === "history") return <ReviewHistory />;
    }

    // Fallback
    return (
      <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Page not found</h2>
        <p>This page doesn't exist for your current role.</p>
      </div>
    );
  }

  return (
    <AppShell
      activePage={page}
      onNavigate={setPage}
      pageTitle={t(meta.title)}
      pageSubtitle={t(meta.subtitle)}
    >
      {renderPage()}
    </AppShell>
  );
}

function LoginPage({ users, onLogin, language, setLanguage, t }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "Applicant",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRoleUsers = [
    ...REAL_DEMO_USERS.filter((user) => user.role === form.role && user.active),
    ...users.filter((user) => user.role === form.role && user.active),
  ];

  function setField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setError("");
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const result = await onLogin(form);
    setLoading(false);
    if (!result.success) setError(result.message);
  }

  function useDemo(user) {
    setForm({
      username: user.email,
      password: user.password || "password",
      role: user.role,
    });
    setError("");
  }

  return (
    <div style={loginStyles.screen}>
      <form style={loginStyles.card} onSubmit={handleSubmit}>
        <div style={loginStyles.brand}>
          <div style={loginStyles.logo}>STGS</div>
          <h1 style={loginStyles.title}>{t("app.title")}</h1>
          <p style={loginStyles.subtitle}>{t("app.institution")}</p>
        </div>

        <div style={loginStyles.field}>
          <label style={loginStyles.label}>{t("login.username")}</label>
          <input
            value={form.username}
            onChange={setField("username")}
            placeholder="ana.petrovska@fcse.edu.mk"
            style={loginStyles.input}
            autoComplete="username"
          />
        </div>

        <div style={loginStyles.field}>
          <label style={loginStyles.label}>{t("login.password")}</label>
          <input
            value={form.password}
            onChange={setField("password")}
            placeholder="password"
            type="password"
            style={loginStyles.input}
            autoComplete="current-password"
          />
        </div>

        <div style={loginStyles.formGrid}>
          <div style={loginStyles.field}>
            <label style={loginStyles.label}>{t("login.role")}</label>
            <select value={form.role} onChange={setField("role")} style={loginStyles.input}>
              {["Applicant", "ScientificCouncil", "DeansOffice", "Administrator"].map((roleName) => (
                <option key={roleName} value={roleName}>
                  {ROLE_LABELS[roleName]}
                </option>
              ))}
            </select>
          </div>

          <div style={loginStyles.field}>
            <label style={loginStyles.label}>{t("login.language")}</label>
            <select value={language} onChange={(event) => setLanguage(event.target.value)} style={loginStyles.input}>
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div style={loginStyles.error}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...loginStyles.loginButton,
            opacity: loading ? 0.72 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? t("login.signingIn") : t("login.enter")}
        </button>

        <div style={loginStyles.demoBlock}>
          <p style={loginStyles.demoTitle}>{t("login.demoUsers")}</p>
          <div style={loginStyles.demoList}>
            {selectedRoleUsers.map((user) => (
              <button
                key={user.userID}
                type="button"
                style={loginStyles.demoUser}
                onClick={() => useDemo(user)}
              >
                <span style={loginStyles.avatar}>
                  {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                </span>
                <span style={loginStyles.demoUserText}>
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}

const loginStyles = {
  screen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background:
      "linear-gradient(135deg, #0F1E3C 0%, #1A2F56 54%, #263F6F 100%)",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#FFFFFF",
    borderRadius: 16,
    padding: "36px 34px",
    boxShadow: "0 18px 60px rgba(0,0,0,0.24)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  brand: {
    textAlign: "center",
    marginBottom: 8,
  },
  logo: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 34,
    color: "#0F1E3C",
  },
  title: {
    fontSize: 19,
    color: "#0F1E3C",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#8896A8",
    marginTop: 4,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#4A5568",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  input: {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 8,
    border: "1.5px solid #D8D0C4",
    fontSize: 14,
    color: "#0F1E3C",
    background: "#FFFFFF",
    outline: "none",
  },
  error: {
    background: "#FFF1F2",
    border: "1px solid #FECDD3",
    color: "#BE123C",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.4,
  },
  loginButton: {
    background: "#0F1E3C",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 2,
  },
  demoBlock: {
    borderTop: "1px solid #EDE8E0",
    paddingTop: 16,
    marginTop: 4,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#8896A8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 8,
  },
  demoList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  demoUser: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    textAlign: "left",
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #EDE8E0",
    background: "#F8F5EF",
    cursor: "pointer",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#C8972A",
    color: "#0F1E3C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },
  demoUserText: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    color: "#0F1E3C",
    fontSize: 13,
  },
};
