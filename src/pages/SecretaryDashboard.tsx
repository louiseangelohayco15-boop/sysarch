import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WorkspaceShell from "../components/WorkspaceShell";
import { useAuth } from "../contexts/useAuth";
import {
  createResident,
  deleteResident,
  exportBackup,
  fetchEvents,
  fetchResidents,
  fetchUsers,
  recordBeneficiarySelection,
  updateResident,
  type EventRecord,
  type HouseholdMember,
  type Resident,
  type UserAccount,
} from "../services/authService";

type ResidentForm = Omit<Resident, "id">;
type SecretarySection = "overview" | "residents" | "beneficiaries" | "accounts" | "system";

const INITIAL_FORM: ResidentForm = {
  userId: "",
  name: "",
  email: "",
  contactNumber: "",
  address: "",
  household: "",
  membersCount: 1,
  age: 0,
  birthDate: "",
  gender: "",
  civilStatus: "",
  occupation: "",
  is_pwd: false,
  citizenship: "Filipino",
  notes: "",
  status: "Pending",
  householdMembers: [],
  createdAt: "",
  updatedAt: "",
};

function matchesQuery(values: Array<string | number | undefined>, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return values.some((value) => (value || "").toString().toLowerCase().includes(normalized));
}

function getQualification(resident: Resident) {
  if (resident.age >= 60 && resident.is_pwd) return "Senior & PWD";
  if (resident.age >= 60) return "Senior Citizen";
  return "PWD";
}

function formatRole(role: UserAccount["role"]) {
  if (role === "secretary") return "Admin / Secretary";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function SecretaryDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [section, setSection] = useState<SecretarySection>("overview");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Resident | null>(null);
  const [form, setForm] = useState<ResidentForm>(INITIAL_FORM);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [beneficiaryStatusFilter, setBeneficiaryStatusFilter] = useState("all");
  const [beneficiaryQualificationFilter, setBeneficiaryQualificationFilter] = useState("all");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showResidentForm, setShowResidentForm] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [residentData, userData, eventData] = await Promise.all([fetchResidents(), fetchUsers(), fetchEvents()]);
      setResidents(residentData || []);
      setUsers(userData || []);
      setEvents(eventData || []);
    } catch (err) {
      const nextError = err && typeof err === "object" && "error" in err ? String((err as { error: unknown }).error) : "Failed to load admin data";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!selectedBeneficiary) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeBeneficiaryModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedBeneficiary]);

  useEffect(() => {
    if (!selectedUser) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeUserModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedUser]);

  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      const statusMatches = statusFilter === "all" || resident.status === statusFilter;
      const searchMatches = matchesQuery(
        [resident.name, resident.email, resident.address, resident.household, resident.contactNumber, resident.notes, resident.status],
        searchTerm
      );
      return statusMatches && searchMatches;
    });
  }, [residents, searchTerm, statusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleMatches = roleFilter === "all" || user.role === roleFilter;
      const searchMatches = matchesQuery(
        [user.username, user.email, user.firstName, user.middleName, user.lastName, user.contactNumber, user.address, user.role],
        searchTerm
      );
      return roleMatches && searchMatches;
    });
  }, [users, searchTerm, roleFilter]);

  const beneficiaries = useMemo(() => {
    return residents.filter((resident) => resident.age >= 60 || resident.is_pwd);
  }, [residents]);

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((resident) => {
      const matchesSearch = matchesQuery(
        [resident.name, resident.address, resident.household, resident.contactNumber, resident.email, resident.notes],
        beneficiarySearch
      );
      const qualification = getQualification(resident);
      const matchesQualification =
        beneficiaryQualificationFilter === "all" ||
        (beneficiaryQualificationFilter === "senior" && resident.age >= 60) ||
        (beneficiaryQualificationFilter === "pwd" && resident.is_pwd) ||
        (beneficiaryQualificationFilter === "both" && qualification === "Senior & PWD");
      const matchesStatus = beneficiaryStatusFilter === "all" || resident.status === beneficiaryStatusFilter;
      return matchesSearch && matchesQualification && matchesStatus;
    });
  }, [beneficiaries, beneficiaryQualificationFilter, beneficiarySearch, beneficiaryStatusFilter]);

  const summary = useMemo(
    () => ({
      totalResidents: residents.length,
      pendingResidents: residents.filter((resident) => resident.status === "Pending").length,
      claimedResidents: residents.filter((resident) => resident.status === "Claimed").length,
      pwdResidents: residents.filter((resident) => resident.is_pwd).length,
      totalBeneficiaries: beneficiaries.length,
      residentAccounts: users.filter((user) => user.role === "resident").length,
      staffAccounts: users.filter((user) => user.role === "staff").length,
      publishedEvents: events.length,
    }),
    [beneficiaries.length, events.length, residents, users]
  );

  function updateFormValue<K extends keyof ResidentForm>(key: K, value: ResidentForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditing(null);
    setForm(INITIAL_FORM);
    setShowResidentForm(false);
  }

  function backToResidentList() {
    setSelectedResident(null);
    resetForm();
  }

  function startEdit(resident: Resident) {
    setEditing(resident);
    setForm({ ...INITIAL_FORM, ...resident });
    setShowResidentForm(true);
    setSelectedResident(null);
    setSection("residents");
  }

  function startAdd() {
    resetForm();
    setShowResidentForm(true);
    setSection("residents");
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setSaving(true);

    const cleanForm = {
      ...form,
      name: form.name.trim(),
      email: form.email?.trim() || "",
      address: form.address.trim(),
      household: form.household.trim(),
      contactNumber: form.contactNumber?.trim() || "",
      occupation: form.occupation?.trim() || "",
      citizenship: form.citizenship?.trim() || "",
      notes: form.notes?.trim() || "",
    };

    if (!cleanForm.name || !cleanForm.address || !cleanForm.household) {
      setError("Name, address, and household number are required.");
      setSaving(false);
      return;
    }

    const duplicateResident = residents.find(
      (resident) =>
        resident.id !== editing?.id &&
        ((cleanForm.email && resident.email?.toLowerCase() === cleanForm.email.toLowerCase()) ||
          resident.household.trim().toLowerCase() === cleanForm.household.toLowerCase())
    );

    if (duplicateResident) {
      setError("Duplicate resident email or household number detected.");
      setSaving(false);
      return;
    }

    try {
      let savedResident: Resident;
      if (editing) {
        savedResident = await updateResident(editing.id, cleanForm);
        setResidents((current) => current.map((resident) => (resident.id === savedResident.id ? savedResident : resident)));
        setInfo("Resident record updated successfully.");
      } else {
        savedResident = await createResident(cleanForm);
        setResidents((current) => [savedResident, ...current]);
        setInfo("Resident record added successfully.");
      }
      setSelectedResident(null);
      resetForm();
      await loadDashboardData();
    } catch (err) {
      const nextError = err && typeof err === "object" && "error" in err ? String((err as { error: unknown }).error) : "Save failed";
      setError(nextError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this census record?")) return;
    setError("");
    setInfo("");
    try {
      await deleteResident(id);
      if (selectedResident?.id === id) setSelectedResident(null);
      setInfo("Resident record deleted.");
      await loadDashboardData();
    } catch (err) {
      const nextError = err && typeof err === "object" && "error" in err ? String((err as { error: unknown }).error) : "Delete failed";
      setError(nextError);
    }
  }

  async function handleExportBackup() {
    setExporting(true);
    setError("");
    setInfo("");
    try {
      const payload = await exportBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `barangay-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setInfo("Backup exported successfully.");
    } catch (err) {
      const nextError = err && typeof err === "object" && "error" in err ? String((err as { error: unknown }).error) : "Backup export failed";
      setError(nextError);
    } finally {
      setExporting(false);
    }
  }

  function handleDownloadBeneficiaries() {
    const csvContent = [
      ["Name", "Qualification", "Age", "Household", "Address", "Contact", "Email", "Status", "Remarks"],
      ...filteredBeneficiaries.map((resident) => [
        resident.name,
        getQualification(resident),
        resident.age.toString(),
        resident.household || "",
        resident.address || "",
        resident.contactNumber || "",
        resident.email || "",
        resident.status,
        resident.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `beneficiaries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSelectBeneficiary(resident: Resident) {
    setError("");
    try {
      const updatedResident = await recordBeneficiarySelection(resident.id);
      setResidents((current) => current.map((item) => (item.id === updatedResident.id ? updatedResident : item)));
      setSelectedBeneficiary(updatedResident);
      setInfo(`${updatedResident.name} selection count updated.`);
    } catch (err) {
      const nextError = err && typeof err === "object" && "error" in err ? String((err as { error: unknown }).error) : "Failed to update beneficiary selection";
      setError(nextError);
    }
  }

  function closeBeneficiaryModal() {
    setSelectedBeneficiary(null);
  }

  function closeUserModal() {
    setSelectedUser(null);
  }

  function handleLogout() {
    logout();
    navigate("/admin-login");
  }

  const navItems = [
    { key: "overview", label: "Dashboard", caption: "Project-wide overview", badge: String(summary.totalResidents) },
    { key: "residents", label: "Residents", caption: "Census records and details", badge: String(filteredResidents.length) },
    { key: "beneficiaries", label: "Beneficiaries", caption: "Finder and download", badge: String(filteredBeneficiaries.length) },
    { key: "accounts", label: "Accounts", caption: "User accounts and access", badge: String(filteredUsers.length) },
    { key: "system", label: "System", caption: "Exports and operations", badge: String(summary.publishedEvents) },
  ];

  const latestEvents = [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const totalBeneficiarySelections = beneficiaries.reduce((sum, resident) => sum + (resident.beneficiarySelectionCount || 0), 0);

  return (
    <WorkspaceShell
      rightLabel="Admin"
      title="Admin Dashboard"
      subtitle=""
      navItems={navItems}
      activeKey={section}
      onSelect={(value) => {
        const nextSection = value as SecretarySection;
        setSection(nextSection);
        setSelectedBeneficiary(null);
        setSelectedUser(null);
        if (nextSection === "residents") {
          setSelectedResident(null);
          setEditing(null);
          setShowResidentForm(false);
        }
      }}
      actions={
        <>
          <Link to="/activity-logs" style={styles.headerLink}>Logs</Link>
          <button onClick={handleLogout} style={styles.headerButton}>Logout</button>
        </>
      }
      hero={section === "overview" ? (
        <div style={styles.heroCard}>
          <div>
            <p style={styles.heroEyebrow}>Overview</p>
            <h2 style={styles.heroTitle}>Admin panel overview</h2>
            <p style={styles.heroText}>Residents, accounts, events, and beneficiaries.</p>
          </div>
          <div style={styles.metricGrid}>
            <div style={styles.metricCard}><strong>{summary.totalResidents}</strong><span>Total residents</span></div>
            <div style={styles.metricCard}><strong>{summary.residentAccounts}</strong><span>Resident accounts</span></div>
            <div style={styles.metricCard}><strong>{summary.publishedEvents}</strong><span>Published events</span></div>
            <div style={styles.metricCard}><strong>{summary.pendingResidents}</strong><span>Pending beneficiaries</span></div>
          </div>
        </div>
      ) : undefined}
    >
      {loading ? <div style={styles.infoBox}>Loading admin dashboard...</div> : null}
      {error ? <div style={styles.errorBox}>{error}</div> : null}
      {info ? <div style={styles.infoBox}>{info}</div> : null}

      {section === "overview" ? (
        <div style={styles.overviewGrid}>
          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Overview</h3>
            <div style={styles.statGrid}>
              <div style={styles.statCard}><span>Claimed</span><strong>{summary.claimedResidents}</strong></div>
              <div style={styles.statCard}><span>PWD tagged</span><strong>{summary.pwdResidents}</strong></div>
              <div style={styles.statCard}><span>Total beneficiaries</span><strong>{summary.totalBeneficiaries}</strong></div>
              <div style={styles.statCard}><span>Staff accounts</span><strong>{summary.staffAccounts}</strong></div>
              <div style={styles.statCard}><span>Events visible to residents</span><strong>{summary.publishedEvents}</strong></div>
            </div>
          </section>

          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Recent events</h3>
            <div style={styles.list}>
              {latestEvents.map((event) => (
                <div key={event.id} style={styles.listItem}>
                  <strong>{event.title}</strong>
                  <span>On {formatDate(event.date)} at {event.location}</span>
                </div>
              ))}
              {latestEvents.length === 0 ? <p style={styles.muted}>No recent events yet.</p> : null}
            </div>
          </section>
        </div>
      ) : null}

      {section === "beneficiaries" ? (
        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.panelTitle}>Beneficiary finder and download</h3>
              <p style={styles.muted}>Search eligible residents, filter by qualification or status, and download the beneficiary list.</p>
            </div>
            <div style={styles.countBadge}>{filteredBeneficiaries.length} matched beneficiaries</div>
          </div>

          <div style={styles.beneficiaryStatGrid}>
            <div style={styles.statCard}><span>Total eligible</span><strong>{beneficiaries.length}</strong></div>
            <div style={styles.statCard}><span>Senior citizens</span><strong>{beneficiaries.filter((resident) => resident.age >= 60).length}</strong></div>
            <div style={styles.statCard}><span>PWD residents</span><strong>{beneficiaries.filter((resident) => resident.is_pwd).length}</strong></div>
            <div style={styles.statCard}><span>Claimed</span><strong>{beneficiaries.filter((resident) => resident.status === "Claimed").length}</strong></div>
          </div>

          <div style={styles.beneficiaryToolbar}>
            <input
              placeholder="Search name, household, address, contact, email, or remarks"
              value={beneficiarySearch}
              onChange={(event) => setBeneficiarySearch(event.target.value)}
              style={styles.input}
            />
            <select value={beneficiaryQualificationFilter} onChange={(event) => setBeneficiaryQualificationFilter(event.target.value)} style={styles.input}>
              <option value="all">All qualifications</option>
              <option value="senior">Senior only</option>
              <option value="pwd">PWD only</option>
              <option value="both">Senior & PWD</option>
            </select>
            <select value={beneficiaryStatusFilter} onChange={(event) => setBeneficiaryStatusFilter(event.target.value)} style={styles.input}>
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Claimed">Claimed</option>
            </select>
            <button type="button" style={styles.primaryButton} onClick={handleDownloadBeneficiaries} disabled={exporting}>
              {exporting ? "Downloading..." : "Download List"}
            </button>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Qualification</th>
                  <th>Age</th>
                  <th>Household</th>
                  <th>Selections</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map((resident) => (
                  <tr key={resident.id}>
                    <td>{resident.name}</td>
                    <td>{getQualification(resident)}</td>
                    <td>{resident.age}</td>
                    <td>{resident.household || "-"}</td>
                    <td>{resident.beneficiarySelectionCount || 0}</td>
                    <td>{resident.status}</td>
                    <td>
                      <button type="button" style={styles.smallButton} onClick={() => handleSelectBeneficiary(resident)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBeneficiaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.emptyCell}>No beneficiaries matched the current finder filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {selectedBeneficiary ? (
        <div style={styles.modalBackdrop} onClick={closeBeneficiaryModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="beneficiary-modal-title"
            style={styles.modalCard}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.modalEyebrow}>Beneficiary details</p>
                <h3 id="beneficiary-modal-title" style={styles.modalTitle}>{selectedBeneficiary.name}</h3>
                <p style={styles.modalSubtitle}>{getQualification(selectedBeneficiary)} | {selectedBeneficiary.status}</p>
              </div>
              <button type="button" style={styles.modalCloseButton} onClick={closeBeneficiaryModal}>
                Close
              </button>
            </div>

            <div style={styles.detailList}>
              <p><strong>Age:</strong> {selectedBeneficiary.age}</p>
              <p><strong>PWD:</strong> {selectedBeneficiary.is_pwd ? "Yes" : "No"}</p>
              <p><strong>Times selected:</strong> {selectedBeneficiary.beneficiarySelectionCount || 0}</p>
              <p><strong>Last selected:</strong> {selectedBeneficiary.lastBeneficiarySelectedAt ? formatDate(selectedBeneficiary.lastBeneficiarySelectedAt) : "-"}</p>
              <p><strong>Household:</strong> {selectedBeneficiary.household || "-"}</p>
              <p><strong>Address:</strong> {selectedBeneficiary.address || "-"}</p>
              <p><strong>Contact:</strong> {selectedBeneficiary.contactNumber || "-"}</p>
              <p><strong>Email:</strong> {selectedBeneficiary.email || "-"}</p>
              <p><strong>Remarks:</strong> {selectedBeneficiary.notes || "-"}</p>
            </div>
          </div>
        </div>
      ) : null}

      {section === "residents" ? (
        <section style={styles.panel}>
          {selectedResident ? (
            <div style={styles.residentDetailShell}>
              <div style={styles.sectionHeader}>
                <div>
                  <h3 style={styles.panelTitle}>Resident details</h3>
                  <p style={styles.muted}>Full record for {selectedResident.name}</p>
                </div>
                <div style={styles.actionsRow}>
                  <button type="button" style={styles.secondaryButton} onClick={backToResidentList}>Back to List</button>
                  <button type="button" style={styles.primaryButton} onClick={() => startEdit(selectedResident)}>Edit</button>
                </div>
              </div>
              <div style={styles.detailGrid}>
                <section style={styles.detailCard}>
                  <h4 style={styles.detailCardTitle}>Personal information</h4>
                  <div style={styles.detailList}>
                    <p><strong>Name:</strong> {selectedResident.name}</p>
                    <p><strong>Email:</strong> {selectedResident.email || "-"}</p>
                    <p><strong>Contact:</strong> {selectedResident.contactNumber || "-"}</p>
                    <p><strong>Birth Date:</strong> {selectedResident.birthDate || "-"}</p>
                    <p><strong>Age:</strong> {selectedResident.age}</p>
                    <p><strong>Gender:</strong> {selectedResident.gender || "-"}</p>
                    <p><strong>Civil Status:</strong> {selectedResident.civilStatus || "-"}</p>
                    <p><strong>Citizenship:</strong> {selectedResident.citizenship || "-"}</p>
                  </div>
                </section>
                <section style={styles.detailCard}>
                  <h4 style={styles.detailCardTitle}>Household information</h4>
                  <div style={styles.detailList}>
                    <p><strong>Household:</strong> {selectedResident.household || "-"}</p>
                    <p><strong>Address:</strong> {selectedResident.address || "-"}</p>
                    <p><strong>Members:</strong> {selectedResident.membersCount}</p>
                    <p><strong>Occupation:</strong> {selectedResident.occupation || "-"}</p>
                    <p><strong>PWD:</strong> {selectedResident.is_pwd ? "Yes" : "No"}</p>
                    <p><strong>Status:</strong> {selectedResident.status}</p>
                    <p><strong>Remarks:</strong> {selectedResident.notes || "-"}</p>
                  </div>
                </section>
              </div>
              {selectedResident.householdMembers?.length ? (
                <section style={styles.detailCard}>
                  <h4 style={styles.detailCardTitle}>Family members</h4>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead style={styles.tableHead}>
                        <tr>
                          <th style={styles.tableHeaderCell}>Name</th>
                          <th style={styles.tableHeaderCell}>Relationship</th>
                          <th style={styles.tableHeaderCell}>Age</th>
                          <th style={styles.tableHeaderCell}>Gender</th>
                          <th style={styles.tableHeaderCell}>Occupation</th>
                          <th style={styles.tableHeaderCell}>Civil Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResident.householdMembers.map((member: HouseholdMember) => (
                          <tr key={member.id} style={styles.tableRow}>
                            <td style={styles.tableCell}>{member.fullName}</td>
                            <td style={styles.tableCell}>{member.relationship || "-"}</td>
                            <td style={styles.tableCell}>{member.age}</td>
                            <td style={styles.tableCell}>{member.gender || "-"}</td>
                            <td style={styles.tableCell}>{member.occupation || "-"}</td>
                            <td style={styles.tableCell}>{member.civilStatus || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div>
              <div style={styles.sectionHeader}>
                <div>
                  <h3 style={styles.panelTitle}>Resident records</h3>
                  <p style={styles.muted}>Resident list with search, filters, and direct census form access.</p>
                </div>
              </div>

              <div style={styles.residentToolbar}>
                <input
                  placeholder="Search by name, email, household, address, or remarks"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  style={styles.input}
                />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={styles.input}>
                  <option value="all">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Claimed">Claimed</option>
                </select>
                <button type="button" style={styles.primaryButton} onClick={startAdd}>
                  {showResidentForm ? "Open Census Form" : "Add Resident"}
                </button>
              </div>

              {showResidentForm ? (
                <section style={styles.formPanel}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <h4 style={styles.formTitle}>{editing ? "Edit resident census form" : "Add resident census form"}</h4>
                      <p style={styles.muted}>Complete the resident details before saving.</p>
                    </div>
                  </div>
                  <form onSubmit={handleSave} style={styles.formGrid}>
                    <input value={form.name} onChange={(event) => updateFormValue("name", event.target.value)} placeholder="Full name" style={styles.input} required />
                    <input value={form.email} onChange={(event) => updateFormValue("email", event.target.value)} placeholder="Email" style={styles.input} />
                    <input value={form.contactNumber} onChange={(event) => updateFormValue("contactNumber", event.target.value)} placeholder="Contact number" style={styles.input} />
                    <input value={form.household} onChange={(event) => updateFormValue("household", event.target.value)} placeholder="Household number" style={styles.input} required />
                    <input value={form.address} onChange={(event) => updateFormValue("address", event.target.value)} placeholder="Address" style={{ ...styles.input, gridColumn: "1 / -1" }} required />
                    <input type="number" min="1" value={form.membersCount} onChange={(event) => updateFormValue("membersCount", Number(event.target.value))} placeholder="Household members" style={styles.input} />
                    <input type="date" value={form.birthDate} onChange={(event) => updateFormValue("birthDate", event.target.value)} style={styles.input} />
                    <input type="number" min="0" value={form.age} onChange={(event) => updateFormValue("age", Number(event.target.value))} placeholder="Age" style={styles.input} />
                    <select value={form.gender} onChange={(event) => updateFormValue("gender", event.target.value)} style={styles.input}>
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    <select value={form.civilStatus} onChange={(event) => updateFormValue("civilStatus", event.target.value)} style={styles.input}>
                      <option value="">Civil status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                    <input value={form.occupation} onChange={(event) => updateFormValue("occupation", event.target.value)} placeholder="Occupation" style={styles.input} />
                    <input value={form.citizenship} onChange={(event) => updateFormValue("citizenship", event.target.value)} placeholder="Citizenship" style={styles.input} />
                    <select value={form.status} onChange={(event) => updateFormValue("status", event.target.value)} style={styles.input}>
                      <option value="Pending">Pending</option>
                      <option value="Claimed">Claimed</option>
                    </select>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" checked={form.is_pwd} onChange={(event) => updateFormValue("is_pwd", event.target.checked)} />
                      PWD tagged resident
                    </label>
                    <textarea value={form.notes} onChange={(event) => updateFormValue("notes", event.target.value)} placeholder="Remarks" style={{ ...styles.input, ...styles.textarea }} />
                    <div style={styles.actionsRow}>
                      <button type="submit" style={styles.primaryButton} disabled={saving}>
                        {saving ? "Saving..." : editing ? "Update Record" : "Add Record"}
                      </button>
                      <button type="button" style={styles.secondaryButton} onClick={resetForm}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead style={styles.tableHead}>
                    <tr>
                      <th style={styles.tableHeaderCell}>Name</th>
                      <th style={styles.tableHeaderCell}>Contact</th>
                      <th style={styles.tableHeaderCell}>Household</th>
                      <th style={styles.tableHeaderCell}>Address</th>
                      <th style={styles.tableHeaderCell}>Age</th>
                      <th style={styles.tableHeaderCell}>Status</th>
                      <th style={styles.tableHeaderCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map((resident) => (
                      <tr key={resident.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{resident.name}</td>
                        <td style={styles.tableCell}>{resident.contactNumber || "-"}</td>
                        <td style={styles.tableCell}>{resident.household}</td>
                        <td style={styles.tableCell}>{resident.address}</td>
                        <td style={styles.tableCell}>{resident.age}</td>
                        <td style={styles.tableCell}>
                          <span style={{ ...styles.statusPill, ...(resident.status === "Claimed" ? styles.statusClaimed : styles.statusPending) }}>
                            {resident.status}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.actionCell}>
                            <button type="button" style={styles.smallButton} onClick={() => setSelectedResident(resident)}>View</button>
                            <button type="button" style={styles.smallEdit} onClick={() => startEdit(resident)}>Edit</button>
                            <button type="button" style={styles.smallDanger} onClick={() => handleDelete(resident.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredResidents.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={styles.emptyCell}>No resident records found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {section === "accounts" ? (
        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.panelTitle}>User accounts</h3>
              <p style={styles.muted}>Review registered users, roles, and account access.</p>
            </div>
            <Link to="/admin/register" style={styles.primaryLink}>Create Staff/Admin</Link>
          </div>

          <div style={styles.filterRow}>
            <input
              placeholder="Search username, name, email, contact, or address"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={styles.input}
            />
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} style={styles.input}>
              <option value="all">All roles</option>
              <option value="resident">Resident</option>
              <option value="staff">Staff</option>
              <option value="secretary">Admin / Secretary</option>
            </select>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{formatRole(user.role)}</td>
                    <td>{user.contactNumber || "-"}</td>
                    <td>{user.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      <button type="button" style={styles.smallButton} onClick={() => setSelectedUser(user)}>View</button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={styles.emptyCell}>No user accounts found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {selectedUser ? (
        <div style={styles.modalBackdrop} onClick={closeUserModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
            style={styles.modalCard}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.modalEyebrow}>Account details</p>
                <h3 id="account-modal-title" style={styles.modalTitle}>{selectedUser.username}</h3>
                <p style={styles.modalSubtitle}>{formatRole(selectedUser.role)} | {selectedUser.isActive ? "Active" : "Inactive"}</p>
              </div>
              <button type="button" style={styles.modalCloseButton} onClick={closeUserModal}>
                Close
              </button>
            </div>

            <div style={styles.detailList}>
              <p><strong>Name:</strong> {[selectedUser.firstName, selectedUser.middleName, selectedUser.lastName].filter(Boolean).join(" ") || "-"}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Contact:</strong> {selectedUser.contactNumber || "-"}</p>
              <p><strong>Address:</strong> {selectedUser.address || "-"}</p>
              <p><strong>Status:</strong> {selectedUser.isActive ? "Active" : "Inactive"}</p>
              <p><strong>Role:</strong> {formatRole(selectedUser.role)}</p>
            </div>
          </div>
        </div>
      ) : null}

      {section === "system" ? (
        <div style={styles.systemStack}>
          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>System backup</h3>
            <p style={styles.muted}>Export a JSON snapshot including residents, events, and account-linked activity data.</p>
            <div style={styles.actionsRow}>
              <button type="button" style={styles.primaryButton} onClick={handleExportBackup} disabled={exporting}>
                {exporting ? "Exporting..." : "Export JSON Backup"}
              </button>
            </div>
          </section>

          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Beneficiary summary</h3>
            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <strong>{beneficiaries.length}</strong>
                <span>Eligible residents tracked</span>
              </div>
              <div style={styles.statCard}>
                <strong>{totalBeneficiarySelections}</strong>
                <span>Total selections recorded</span>
              </div>
            </div>
            <p style={{ ...styles.muted, marginTop: 12 }}>Selection counts are used in the beneficiaries workspace only.</p>
          </section>
        </div>
      ) : null}
    </WorkspaceShell>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

const styles = {
  headerLink: { padding: "8px 14px", borderRadius: 999, background: "#eef6ff", color: "#2f7fbe", fontWeight: 700, textDecoration: "none" },
  headerButton: { padding: "8px 14px", borderRadius: 999, border: "none", background: "#eef6ff", color: "#2f7fbe", fontWeight: 700, cursor: "pointer" },
  heroCard: {
    borderRadius: 28,
    padding: "24px 28px",
    background: "linear-gradient(135deg, #1d314c 0%, #2e5f86 56%, #efab6a 100%)",
    color: "#fffdf8",
    display: "flex" as const,
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap" as const,
  },
  heroEyebrow: { margin: 0, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.14em", opacity: 0.8 },
  heroTitle: { margin: "10px 0 8px", fontSize: 30, lineHeight: 1.15, maxWidth: 720 },
  heroText: { margin: 0, lineHeight: 1.6, maxWidth: 720 },
  metricGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(150px, 1fr))", gap: 12, flex: "1 1 320px" },
  metricCard: { padding: "18px 16px", borderRadius: 18, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)", display: "grid", gap: 6 },
  errorBox: { background: "#fff3f2", color: "#bc4a38", padding: 14, borderRadius: 14, border: "1px solid #f1b4ac" },
  infoBox: { background: "#edf6ff", color: "#2f7fbe", padding: 14, borderRadius: 14, border: "1px solid #cfe4f7" },
  residentDetailShell: { display: "grid", gap: 20 },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 },
  systemStack: { display: "grid", gap: 16, maxWidth: 760 },
  panel: { background: "rgba(255,255,255,0.98)", borderRadius: 18, padding: 20, border: "1px solid #dce7f1", boxShadow: "0 10px 24px rgba(39, 66, 89, 0.06)" },
  panelTitle: { margin: "0 0 10px", fontSize: 22, color: "#24425c" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  detailCard: { padding: 20, borderRadius: 20, background: "#f7fbff", border: "1px solid #dceaf5" },
  detailCardTitle: { margin: "0 0 12px", fontSize: 16, color: "#24425c" },
  muted: { margin: 0, color: "#607489", lineHeight: 1.6 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 },
  statCard: { padding: "16px 18px", borderRadius: 18, background: "#f6fbff", border: "1px solid #dceaf5", display: "grid", gap: 8, color: "#34536d" },
  list: { display: "grid", gap: 12 },
  listItem: { padding: "14px 0", borderBottom: "1px solid #e8eef5", display: "grid", gap: 4, color: "#34536d" },
  sectionHeader: { display: "flex" as const, justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" as const },
  filterRow: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px", gap: 12, marginBottom: 16 },
  residentToolbar: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px 180px", gap: 12, marginBottom: 16, alignItems: "center" },
  beneficiaryToolbar: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 200px 200px auto", gap: 12, marginBottom: 16 },
  beneficiaryStatGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 },
  formPanel: { marginBottom: 18, padding: 18, borderRadius: 18, background: "#f7fbff", border: "1px solid #dceaf5" },
  formTitle: { margin: "0 0 6px", fontSize: 18, color: "#24425c" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginBottom: 20 },
  input: { width: "100%", border: "1px solid #d4e1ee", borderRadius: 16, padding: "14px 16px", background: "#f9fcff", boxSizing: "border-box" as const, fontSize: 14 },
  textarea: { minHeight: 120, gridColumn: "1 / -1", resize: "vertical" as const },
  checkboxLabel: { display: "flex" as const, alignItems: "center", gap: 10, color: "#34536d", fontWeight: 600 },
  actionsRow: { display: "flex" as const, gap: 10, alignItems: "center", flexWrap: "wrap" as const, gridColumn: "1 / -1" },
  primaryButton: { border: "none", borderRadius: 14, padding: "12px 18px", background: "#2f7fbe", color: "#fff", fontWeight: 700, cursor: "pointer" },
  primaryLink: { borderRadius: 14, padding: "12px 18px", background: "#2f7fbe", color: "#fff", fontWeight: 700, textDecoration: "none" },
  secondaryButton: { border: "none", borderRadius: 14, padding: "12px 18px", background: "#edf1f6", color: "#34536d", fontWeight: 700, cursor: "pointer" },
  tableWrap: { overflowX: "auto" as const },
  table: { width: "100%", borderCollapse: "collapse" as const },
  tableHead: { background: "#f3f8fd" },
  tableHeaderCell: { padding: "14px 16px", textAlign: "left" as const, fontSize: 12, color: "#5f7489", textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid #dceaf5" },
  tableRow: { borderBottom: "1px solid #ebf1f6" },
  tableCell: { padding: "16px", verticalAlign: "top" as const, color: "#34536d" },
  countBadge: { padding: "7px 12px", borderRadius: 999, background: "#edf6ff", color: "#2f7fbe", fontWeight: 700, fontSize: 12 },
  actionCell: { display: "flex", gap: 8, flexWrap: "wrap" as const },
  modalBackdrop: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 1000,
    background: "rgba(15, 23, 42, 0.48)",
    backdropFilter: "blur(4px)",
    display: "flex" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "88vh",
    overflowY: "auto" as const,
    background: "#fff",
    borderRadius: 22,
    padding: 24,
    border: "1px solid #dce7f1",
    boxShadow: "0 30px 70px rgba(15, 23, 42, 0.28)",
  },
  modalHeader: {
    display: "flex" as const,
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 18,
  },
  modalEyebrow: {
    margin: 0,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "#607489",
  },
  modalTitle: {
    margin: "6px 0 4px",
    fontSize: 24,
    color: "#24425c",
  },
  modalSubtitle: {
    margin: 0,
    color: "#607489",
    fontSize: 13,
  },
  modalCloseButton: {
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    background: "#edf1f6",
    color: "#34536d",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
  smallButton: { padding: "8px 10px", background: "#2f7fbe", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  smallEdit: { padding: "8px 10px", background: "#edf6ff", color: "#2f7fbe", border: "1px solid #cfe4f7", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  smallDanger: { padding: "8px 10px", background: "#d66b5b", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  statusPill: { display: "inline-flex", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  statusPending: { background: "#fff3df", color: "#9c6319" },
  statusClaimed: { background: "#e8f7ef", color: "#24724a" },
  emptyCell: { padding: 16, textAlign: "center" as const, color: "#607489" },
  detailList: { display: "grid", gap: 10, color: "#34536d", lineHeight: 1.5 },
  memberPreview: { display: "grid", gap: 6, paddingTop: 8, borderTop: "1px solid #e8eef5" },
} as const;

