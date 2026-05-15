// ============================================================
// UserManagement FR-8, FR-10
// View all users, assign / change roles, activate / deactivate
// ============================================================

import { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Card, SectionHeader, SearchInput, Select, Button,
  RoleBadge, Table, Modal, Alert, StatCard,
} from "../shared/UI";
import { ALL_ROLES, ROLE_LABELS } from "../../data/mockData";

const roleOptions = [
  { value: "", label: "All Roles" },
  ...ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
];

const roleSelectOptions = ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export default function UserManagement() {
  const { state, dispatch } = useApp();
  const { users } = state;

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = ALL_ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});

  function openEdit(user) {
    setEditUser(user);
    setSelectedRole(user.role);
  }

  function handleRoleChange() {
    if (!editUser || selectedRole === editUser.role) { setEditUser(null); return; }
    dispatch({
      type: "UPDATE_USER_ROLE",
      payload: { userID: editUser.userID, role: selectedRole, userName: editUser.name },
    });
    setSuccessMsg(`Role updated: ${editUser.name} ${ROLE_LABELS[selectedRole]}`);
    setEditUser(null);
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  function handleToggleActive() {
    if (!confirmToggle) return;
    dispatch({ type: "TOGGLE_USER_ACTIVE", payload: { userID: confirmToggle.userID } });
    setSuccessMsg(`User ${confirmToggle.name} ${confirmToggle.active ? "deactivated" : "activated"}.`);
    setConfirmToggle(null);
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  const columns = [
    {
      key: "name",
      label: "User",
      render: (v, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: row.active ? "var(--navy)" : "var(--border)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {v.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "userID",
      label: "ID",
      width: 70,
      render: (v) => <code style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}</code>,
    },
    {
      key: "role",
      label: "Role",
      render: (v) => <RoleBadge role={v} />,
    },
    {
      key: "active",
      label: "Status",
      width: 90,
      render: (v) => (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: v ? "#F0FDF4" : "#F3F4F6",
          color: v ? "#166534" : "#6B7280",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: v ? "#10B981" : "#9CA3AF" }} />
          {v ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "registeredAt",
      label: "Registered",
      width: 100,
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v}</span>,
    },
    {
      key: "_actions",
      label: "Actions",
      width: 160,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Edit Role
          </Button>
          <Button
            size="sm"
            variant={row.active ? "danger" : "secondary"}
            onClick={() => setConfirmToggle(row)}
          >
            {row.active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader
        title="User Management"
        subtitle="Manage registered users and assign roles (FR-8, FR-10)"
      />

      {successMsg && <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg("")} />}

      {/* Role stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard icon="" label="Applicants"        value={roleCounts.Applicant || 0} />
        <StatCard icon="" label="Scientific Council" value={roleCounts.ScientificCouncil || 0} />
        <StatCard icon="" label="Dean's Office"     value={roleCounts.DeansOffice || 0} />
        <StatCard icon="" label="Administrators"    value={roleCounts.Administrator || 0} />
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 20 }} padding="16px 20px">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name or email"
            />
          </div>
          <Select
            value={filterRole}
            onChange={setFilterRole}
            options={roleOptions}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
            {filtered.length} of {users.length} users
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card padding="0">
        <Table columns={columns} rows={filtered} emptyMessage="No users match the filter." />
      </Card>

      {/* Edit Role Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Change User Role">
        {editUser && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px",
              background: "var(--cream)",
              borderRadius: "var(--radius)",
              marginBottom: 20,
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "var(--navy)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>
                {editUser.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{editUser.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{editUser.email}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Assign Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 13, color: "var(--text-primary)",
                  background: "var(--white)", outline: "none",
                }}
              >
                {roleSelectOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {selectedRole !== editUser.role && (
              <Alert
                type="info"
                message={`This will change the user's role from "${ROLE_LABELS[editUser.role]}" to "${ROLE_LABELS[selectedRole]}". The change takes effect immediately.`}
              />
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleRoleChange} disabled={selectedRole === editUser.role}>
                Save Role
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Toggle Active Modal */}
      <Modal
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        title={confirmToggle?.active ? "Deactivate User" : "Activate User"}
      >
        {confirmToggle && (
          <div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
              Are you sure you want to <strong>{confirmToggle.active ? "deactivate" : "activate"}</strong>{" "}
              <strong>{confirmToggle.name}</strong>?{" "}
              {confirmToggle.active
                ? "They will no longer be able to access the system."
                : "They will regain access to the system."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setConfirmToggle(null)}>Cancel</Button>
              <Button
                variant={confirmToggle.active ? "danger" : "primary"}
                onClick={handleToggleActive}
              >
                Confirm {confirmToggle.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}