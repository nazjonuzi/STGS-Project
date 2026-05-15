# STGS – Science Travel Grant System
**Faculty of Computer Science and Engineering · SS. Cyril & Methodius University**  
Version 1.0 · May 2026 · Team: Naz Jonuzi, Erdi Shahini, Dea Hoxha

---

## Quick Start

```bash
# 1. Enter the project folder
cd stgs

# 2. Install dependencies (only needed once)
npm install

# 3. Start the dev server
npm run dev

# 4. Open in browser
# → http://localhost:5173
```

No backend, no database, no real authentication required. Everything runs in-memory.

---

## Project Structure

```
stgs/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                        ← React entry point
    ├── App.jsx                         ← Root router (role → page)
    ├── styles/
    │   └── global.css                  ← CSS variables, base styles
    ├── data/
    │   └── mockData.js                 ← ALL mock data (single source of truth)
    ├── context/
    │   └── AppContext.jsx              ← Shared state (useReducer)
    ├── components/
    │   ├── shared/
    │   │   ├── AppShell.jsx            ← Sidebar + Header layout
    │   │   ├── RoleSwitcher.jsx        ← Demo login switcher
    │   │   └── UI.jsx                  ← Reusable primitives
    │   ├── admin/
    │   │   ├── AdminDashboard.jsx      ← Overview + stats
    │   │   ├── BudgetOverview.jsx      ← FR-7: budget monitoring
    │   │   ├── UserManagement.jsx      ← FR-8: role management
    │   │   ├── RecordManagement.jsx    ← FR-9, FR-10: cancel/delete
    │   │   └── AuditLog.jsx            ← OR-3: audit trail
    │   ├── applicant/
    │   │   └── ApplicantModule.jsx     ← FR-2, FR-3, FR-6, FR-9
    │   └── reviewer/
    │       └── ReviewerModule.jsx      ← FR-4, FR-5
```

---

## Testing the Admin Module

After `npm run dev`, open http://localhost:5173.

The app defaults to the **Administrator** user. Use the **role-switcher** in the top-right corner to switch between all user types.

### Admin features to test:

| Feature | Where | SRS Ref |
|---|---|---|
| Budget overview + progress bar | Budget Overview page | FR-7 |
| Budget enforcement (block over-limit approvals) | Switch to Council → Review Queue → try approving when budget would be exceeded | FR-5, DC-4 |
| Per-application budget breakdown | Budget Overview → Approved Grant Breakdown | FR-7 |
| User list + role assignment | User Management | FR-8 |
| Activate / deactivate users | User Management → Deactivate button | FR-8 |
| Cancel an approved application | Record Management → Approved apps → Cancel | FR-9 |
| Delete a record (blocked if has approvals) | Record Management → Canceled/Rejected → Delete | FR-10 |
| Delete confirmation dialog | Record Management → Delete → Confirm | FR-10 |
| Audit log | Audit Log page | OR-3 |
| Role-based navigation | Switch roles via top-right switcher | FR-8 |

### Testing budget enforcement:
1. Switch to **Scientific Council** → approve APP-002 (Stage 1 → moves to UnderReview)  
2. Switch to **Dean's Office** → try to approve an application that would exceed the budget  
3. The system will show a red error and block the approval  

---

## Merging with Other Branches

### Git workflow for 3-person team:

```bash
# Admin branch (yours):
git checkout -b feature/admin-module

# Applicant team creates:
git checkout -b feature/applicant-module

# Reviewer team creates:
git checkout -b feature/reviewer-module
```

### Integration points (no conflicts expected):

Each module only touches its own folder:

| Team | Files to edit | Context actions to use |
|---|---|---|
| Applicant | `src/components/applicant/ApplicantModule.jsx` | `SUBMIT_APPLICATION`, `CANCEL_APPLICATION` |
| Reviewer | `src/components/reviewer/ReviewerModule.jsx` | `REVIEW_APPLICATION` |
| Admin | `src/components/admin/*.jsx` | `UPDATE_USER_ROLE`, `CANCEL_APPLICATION`, `DELETE_APPLICATION` |

**Shared files** (edit with care, coordinate with team):
- `src/data/mockData.js` – add new mock data here, don't rename existing fields
- `src/context/AppContext.jsx` – add new reducer cases at the bottom, don't change existing ones
- `src/components/shared/UI.jsx` – add new UI primitives, don't rename existing exports
- `src/App.jsx` – add new routes in the `renderPage()` function

### To merge:
```bash
git checkout main
git merge feature/admin-module
git merge feature/applicant-module   # resolve any conflicts in App.jsx only
git merge feature/reviewer-module
```

---

## Mock Data Reference

All data lives in `src/data/mockData.js`:

- **Users**: 6 users across all 4 roles  
- **Applications**: 6 applications in various statuses  
- **Documents**: 7 documents  
- **Approvals**: 5 approval records  
- **Audit Logs**: 10 seed events  
- **Budget**: €50,000 total for 2025/2026  

To add more mock data, edit the arrays in `mockData.js`. The budget is automatically recalculated from approved applications on startup.

---

## SRS Requirements Coverage

| Requirement | Component | Status |
|---|---|---|
| FR-1 Authentication | RoleSwitcher (mock) | ✅ |
| FR-2 Application Submission | ApplicantModule → SubmitApplication | ✅ |
| FR-3 Document Upload | ApplicantModule → ApplicantDocuments (mock) | ✅ |
| FR-4 Multi-Stage Approval | ReviewerModule → ReviewerQueue | ✅ |
| FR-5 Budget Enforcement | AppContext reducer + ReviewerQueue | ✅ |
| FR-6 Status Tracking | ApplicantModule → ApplicantDashboard | ✅ |
| FR-7 Budget Monitoring | BudgetOverview | ✅ |
| FR-8 Role-Based Access Control | AppShell + App.jsx routing | ✅ |
| FR-9 Application Cancellation | RecordManagement + ApplicantModule | ✅ |
| FR-10 Record Management | RecordManagement | ✅ |
| OR-3 Audit Logging | AuditLog + AppContext (all mutations log) | ✅ |
| DC-4 Budget Enforcement Constraint | AppContext REVIEW_APPLICATION reducer | ✅ |