import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WorkspaceShell from "../components/WorkspaceShell";
import { useAuth } from "../contexts/useAuth";
import {
  fetchDashboardOverview,
  fetchEvents,
  fetchMyResident,
  saveMyResident,
  type DashboardOverview,
  type EventRecord,
  type HouseholdMember,
  type Resident,
} from "../services/authService";

type ResidentSection = "overview" | "events" | "census";
type ResidentForm = Omit<Resident, "id">;

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

const EMPTY_MEMBER = (): HouseholdMember => ({
  id: crypto.randomUUID(),
  fullName: "",
  relationship: "",
  age: 0,
  gender: "",
  occupation: "",
  civilStatus: "",
});

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [section, setSection] = useState<ResidentSection>("overview");
  const [form, setForm] = useState<ResidentForm>({
    ...INITIAL_FORM,
    userId: user?.id || "",
    name: user?.username || "",
    email: user?.email || "",
    householdMembers: [EMPTY_MEMBER()],
  });
  const [recordId, setRecordId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      userId: user.id,
      name: current.name || user.username || "",
      email: current.email || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [resident, eventData, overviewData] = await Promise.all([
          fetchMyResident(),
          fetchEvents(),
          fetchDashboardOverview(),
        ]);
        if (!active) return;
        if (resident) {
          setRecordId(resident.id);
          setForm({
            ...INITIAL_FORM,
            ...resident,
            userId: resident.userId || user?.id || "",
            name: resident.name || user?.username || "",
            email: resident.email || user?.email || "",
            householdMembers: resident.householdMembers?.length ? resident.householdMembers : [EMPTY_MEMBER()],
          });
        }
        setEvents(eventData || []);
        setOverview(overviewData);
      } catch {
        if (active) setError("Failed to load your dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [user?.email, user?.id, user?.username]);

  const upcomingEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const nextEvent = upcomingEvents[0] ?? null;
  const familyMembers = form.householdMembers?.length ? form.householdMembers : [EMPTY_MEMBER()];

  function updateForm<K extends keyof ResidentForm>(key: K, value: ResidentForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateMember(memberId: string, key: keyof HouseholdMember, value: string | number) {
    setForm((current) => ({
      ...current,
      householdMembers: (current.householdMembers || []).map((member) =>
        member.id === memberId ? { ...member, [key]: value } : member
      ),
    }));
  }

  function addMemberRow() {
    setForm((current) => ({
      ...current,
      householdMembers: [...(current.householdMembers || []), EMPTY_MEMBER()],
      membersCount: (current.householdMembers || []).length + 1,
    }));
  }

  function removeMemberRow(memberId: string) {
    setForm((current) => {
      const nextMembers = (current.householdMembers || []).filter((member) => member.id !== memberId);
      const safeMembers = nextMembers.length ? nextMembers : [EMPTY_MEMBER()];
      return {
        ...current,
        householdMembers: safeMembers,
        membersCount: safeMembers.length,
      };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const cleanMembers = familyMembers
        .filter((member) => member.fullName.trim() || member.relationship.trim() || Number(member.age) > 0)
        .map((member) => ({
          ...member,
          fullName: member.fullName.trim(),
          relationship: member.relationship.trim(),
          age: Number(member.age) || 0,
          gender: member.gender?.trim() || "",
          occupation: member.occupation?.trim() || "",
          civilStatus: member.civilStatus?.trim() || "",
        }));

      const payload: ResidentForm = {
        ...form,
        userId: user?.id || form.userId,
        name: form.name.trim(),
        email: form.email?.trim() || user?.email || "",
        age: form.birthDate ? getAgeFromBirthDate(form.birthDate) : Number(form.age),
        membersCount: cleanMembers.length || Number(form.membersCount) || 1,
        householdMembers: cleanMembers,
      };
      const saved = await saveMyResident(payload);
      setRecordId(saved.id);
      setForm({
        ...INITIAL_FORM,
        ...saved,
        householdMembers: saved.householdMembers?.length ? saved.householdMembers : [EMPTY_MEMBER()],
      });
      setSuccess("Census form saved successfully.");
      setSection("overview");
    } catch {
      setError("Failed to save census form.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/resident-login");
  }

  const navItems = [
    { key: "overview", label: "Dashboard", caption: "Summary of your profile and events" },
    { key: "events", label: "Resident Events", caption: "Published by staff", badge: String(upcomingEvents.length) },
    { key: "census", label: "Census Form", caption: "Update your household details" },
  ];

  return (
    <WorkspaceShell
      rightLabel="Resident"
      title="Resident Portal"
      subtitle="Track barangay events, manage your census profile, and stay updated with staff announcements."
      navItems={navItems}
      activeKey={section}
      onSelect={(value) => setSection(value as ResidentSection)}
      actions={
        <>
          <Link to="/beneficiaries" style={styles.headerLink}>Beneficiaries</Link>
          <button onClick={handleLogout} style={styles.headerButton}>Logout</button>
        </>
      }
      hero={section === "overview" ? (
        <div style={styles.heroCard}>
          <div>
            <p style={styles.heroEyebrow}>Resident dashboard</p>
            <h2 style={styles.heroTitle}>{nextEvent ? nextEvent.title : "Welcome to the barangay portal"}</h2>
            <p style={styles.heroText}>
              {nextEvent
                ? `Your next visible community event is on ${formatDate(nextEvent.date)} at ${nextEvent.location}.`
                : "Staff-posted events will appear here once they are published."}
            </p>
          </div>
          <div style={styles.heroStats}>
            <div style={styles.metricCard}>
              <strong>{recordId ? "Saved" : "New"}</strong>
              <span>Census record status</span>
            </div>
            <div style={styles.metricCard}>
              <strong>{form.status || "Pending"}</strong>
              <span>Beneficiary status</span>
            </div>
            <div style={styles.metricCard}>
              <strong>{overview?.publishedEvents ?? upcomingEvents.length}</strong>
              <span>Barangay events posted</span>
            </div>
          </div>
        </div>
      ) : undefined}
    >
      {loading ? <div style={styles.infoBox}>Loading resident dashboard...</div> : null}
      {error ? <div style={styles.errorBox}>{error}</div> : null}
      {success ? <div style={styles.successBox}>{success}</div> : null}

      {section === "overview" ? (
        <div style={styles.overviewGrid}>
          <section style={{ ...styles.panel, ...styles.widePanel }}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.panelTitle}>Barangay 420 full information and statistics</h3>
                <p style={styles.muted}>A full resident-facing overview of Barangay 420, Zone 43, District IV, Sampaloc, Manila, including local context, service focus, and current household statistics.</p>
              </div>
            </div>

            <div style={styles.barangayHero}>
              <div style={styles.infoCard}>
                <p style={styles.infoLabel}>Barangay profile</p>
                <strong>{overview?.barangayName || "Barangay 420 Zone 43"}</strong>
                <span>{overview?.district || "District IV, Sampaloc"}</span>
                <span>{overview?.city || "City of Manila"}</span>
                <p style={styles.infoParagraph}>
                  Barangay 420 serves as a local community records and service hub for households in its coverage area,
                  helping residents stay connected to census services, beneficiary monitoring, and barangay announcements.
                </p>
              </div>
              <div style={styles.infoCard}>
                <p style={styles.infoLabel}>Public services</p>
                <strong>Core community support</strong>
                <span>Resident census and household profiling</span>
                <span>Beneficiary validation and release tracking</span>
                <span>Community event publication and reminders</span>
                <span>Barangay-level record visibility for residents</span>
              </div>
              <div style={styles.infoCard}>
                <p style={styles.infoLabel}>Resident notes</p>
                <strong>What this portal helps with</strong>
                <span>Updating your household census information</span>
                <span>Checking published barangay events</span>
                <span>Viewing eligibility-related beneficiary updates</span>
                <span>Keeping family member records complete and review-ready</span>
              </div>
            </div>

            <div style={styles.snapshotGrid}>
              <div style={styles.snapshotItem}><span>Total residents recorded</span><strong>{overview?.totalResidents ?? 0}</strong></div>
              <div style={styles.snapshotItem}><span>Senior residents</span><strong>{overview?.seniorResidents ?? 0}</strong></div>
              <div style={styles.snapshotItem}><span>PWD residents</span><strong>{overview?.pwdResidents ?? 0}</strong></div>
              <div style={styles.snapshotItem}><span>Pending beneficiaries</span><strong>{overview?.pendingBeneficiaries ?? 0}</strong></div>
              <div style={styles.snapshotItem}><span>Claimed beneficiaries</span><strong>{overview?.claimedBeneficiaries ?? 0}</strong></div>
              <div style={styles.snapshotItem}><span>Published events</span><strong>{overview?.publishedEvents ?? upcomingEvents.length}</strong></div>
            </div>
          </section>

          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Profile snapshot</h3>
            <div style={styles.snapshotGrid}>
              <div style={styles.snapshotItem}><span>Name</span><strong>{form.name || user?.username || "-"}</strong></div>
              <div style={styles.snapshotItem}><span>Household</span><strong>{form.household || "-"}</strong></div>
              <div style={styles.snapshotItem}><span>Address</span><strong>{form.address || "-"}</strong></div>
              <div style={styles.snapshotItem}><span>Contact</span><strong>{form.contactNumber || "-"}</strong></div>
            </div>
          </section>

          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Next events</h3>
            <div style={styles.eventList}>
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} style={styles.eventListItem}>
                  <strong>{event.title}</strong>
                  <span>{formatDate(event.date)} | {event.location}</span>
                </div>
              ))}
              {upcomingEvents.length === 0 ? <p style={styles.muted}>No staff-published events yet.</p> : null}
            </div>
          </section>
        </div>
      ) : null}

      {section === "events" ? (
        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.panelTitle}>Resident event feed</h3>
              <p style={styles.muted}>These events are connected directly to what staff publishes in their panel.</p>
            </div>
          </div>
          <div style={styles.eventGrid}>
            {upcomingEvents.map((event) => (
              <article key={event.id} style={styles.eventCard}>
                <img src={event.imageUrl || FALLBACK_IMAGE} alt={event.title} style={styles.eventImage} />
                <div style={styles.eventBody}>
                  <h4 style={styles.eventTitle}>{event.title}</h4>
                  <p style={styles.eventMeta}>{formatDate(event.date)} | {event.location}</p>
                  <p style={styles.eventDescription}>{event.description || "No description added yet."}</p>
                </div>
              </article>
            ))}
            {upcomingEvents.length === 0 ? <p style={styles.muted}>No events to display yet.</p> : null}
          </div>
        </section>
      ) : null}

      {section === "census" ? (
        <form style={styles.censusLayout} onSubmit={handleSubmit}>
          <section style={{ ...styles.panel, ...styles.censusSheet }}>
            <div style={styles.censusHeader}>
              <div>
                <p style={styles.censusEyebrow}>Barangay 420 Zone 43, District IV</p>
                <h3 style={styles.censusTitle}>Resident Census and Household Profile</h3>
                <p style={styles.muted}>{recordId ? "Update your existing household record." : "Complete your household record so the secretary can review it."}</p>
              </div>
              <div style={styles.censusMeta}>
                <div style={styles.statusChip}>{recordId ? "Saved Record" : "New Record"}</div>
                <span style={styles.censusMetaText}>City of Manila</span>
                <span style={styles.censusMetaText}>Resident copy</span>
              </div>
            </div>

            <div style={styles.formSection}>
              <h4 style={styles.formSectionTitle}>Primary resident information</h4>
              <div style={styles.formGrid}>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Full name</span>
                  <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Enter full name" style={styles.input} required />
                </label>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Email</span>
                  <input value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="Enter email" style={styles.input} />
                </label>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Contact number</span>
                  <input value={form.contactNumber} onChange={(event) => updateForm("contactNumber", event.target.value)} placeholder="Enter contact number" style={styles.input} />
                </label>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Household number</span>
                  <input value={form.household} onChange={(event) => updateForm("household", event.target.value)} placeholder="Enter household number" style={styles.input} required />
                </label>
                <label style={{ ...styles.fieldBlock, gridColumn: "1 / -1" }}>
                  <span style={styles.fieldLabel}>Address</span>
                  <input value={form.address} onChange={(event) => updateForm("address", event.target.value)} placeholder="Enter complete address" style={styles.input} required />
                </label>
              </div>
            </div>

            <div style={styles.formSection}>
              <h4 style={styles.formSectionTitle}>Personal details</h4>
              <div style={styles.formGrid}>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Birth date</span>
                  <input type="date" value={form.birthDate} onChange={(event) => { updateForm("birthDate", event.target.value); updateForm("age", getAgeFromBirthDate(event.target.value)); }} style={styles.input} />
                </label>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Age</span>
                  <input type="number" min="0" value={form.age} onChange={(event) => updateForm("age", Number(event.target.value))} placeholder="Enter age" style={styles.input} />
                </label>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Gender</span>
                  <select value={form.gender} onChange={(event) => updateForm("gender", event.target.value)} style={styles.input}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Civil status</span>
                  <select value={form.civilStatus} onChange={(event) => updateForm("civilStatus", event.target.value)} style={styles.input}>
                    <option value="">Select civil status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </label>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Occupation</span>
                  <input value={form.occupation} onChange={(event) => updateForm("occupation", event.target.value)} placeholder="Enter occupation" style={styles.input} />
                </label>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Citizenship</span>
                  <input value={form.citizenship} onChange={(event) => updateForm("citizenship", event.target.value)} placeholder="Enter citizenship" style={styles.input} />
                </label>
              </div>
            </div>

            <div style={styles.formSection}>
              <h4 style={styles.formSectionTitle}>Household status</h4>
              <div style={styles.formGrid}>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Total household members</span>
                  <input type="number" min="1" value={form.membersCount} onChange={(event) => updateForm("membersCount", Number(event.target.value))} placeholder="Enter total members" style={styles.input} />
                </label>
                <div style={{ ...styles.fieldBlock, ...styles.statusField }}>
                  <span style={styles.fieldLabel}>Beneficiary status</span>
                  <input value={form.status || "Pending"} readOnly style={styles.input} />
                  <p style={styles.helperText}>Only the secretary can change your beneficiary status.</p>
                </div>
                <label style={{ ...styles.fieldBlock, ...styles.checkboxCard }}>
                  <span style={styles.fieldLabel}>Special tag</span>
                  <span style={styles.checkboxLabel}>
                    <input type="checkbox" checked={form.is_pwd} onChange={(event) => updateForm("is_pwd", event.target.checked)} />
                    Person with disability (PWD)
                  </span>
                </label>
                <label style={{ ...styles.fieldBlock, gridColumn: "1 / -1" }}>
                  <span style={styles.fieldLabel}>Remarks</span>
                  <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Add household remarks or important notes" style={{ ...styles.input, ...styles.textarea }} />
                </label>
              </div>
            </div>
          </section>

          <section style={{ ...styles.panel, ...styles.tablePanel }}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.panelTitle}>Household member roster</h3>
                <p style={styles.muted}>List every family member in the home. This table is formatted like a household census sheet for easier review.</p>
              </div>
              <button type="button" style={styles.secondaryButton} onClick={addMemberRow}>Add Member</button>
            </div>

            <div style={styles.tableFrame}>
              <table style={styles.memberTable}>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Relationship</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Occupation</th>
                    <th>Civil Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {familyMembers.map((member) => (
                    <tr key={member.id} style={styles.memberRow}>
                      <td><input value={member.fullName} onChange={(event) => updateMember(member.id, "fullName", event.target.value)} style={styles.tableInput} placeholder="Full name" /></td>
                      <td><input value={member.relationship} onChange={(event) => updateMember(member.id, "relationship", event.target.value)} style={styles.tableInput} placeholder="Relationship" /></td>
                      <td><input type="number" min="0" value={member.age} onChange={(event) => updateMember(member.id, "age", Number(event.target.value))} style={styles.tableInput} placeholder="Age" /></td>
                      <td><input value={member.gender || ""} onChange={(event) => updateMember(member.id, "gender", event.target.value)} style={styles.tableInput} placeholder="Gender" /></td>
                      <td><input value={member.occupation || ""} onChange={(event) => updateMember(member.id, "occupation", event.target.value)} style={styles.tableInput} placeholder="Occupation" /></td>
                      <td><input value={member.civilStatus || ""} onChange={(event) => updateMember(member.id, "civilStatus", event.target.value)} style={styles.tableInput} placeholder="Civil status" /></td>
                      <td><button type="button" style={styles.smallDanger} onClick={() => removeMemberRow(member.id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.actionsRow}>
              <button type="submit" style={styles.primaryButton} disabled={saving || loading}>
                {saving ? "Saving..." : "Save Census Form"}
              </button>
            </div>
          </section>
        </form>
      ) : null}
    </WorkspaceShell>
  );
}

function getAgeFromBirthDate(birthDate: string) {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return Math.max(age, 0);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80";

const styles = {
  headerLink: { padding: "8px 14px", borderRadius: 999, border: "none", background: "#eef6ff", color: "#2f7fbe", fontWeight: 700, cursor: "pointer", textDecoration: "none" },
  headerButton: { padding: "8px 14px", borderRadius: 999, border: "none", background: "#eef6ff", color: "#2f7fbe", fontWeight: 700, cursor: "pointer" },
  heroCard: {
    borderRadius: 28,
    padding: "24px 28px",
    background: "linear-gradient(135deg, #214567 0%, #2e7096 58%, #f0b16a 100%)",
    color: "#fffdf8",
    display: "flex" as const,
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap" as const,
  },
  heroEyebrow: { margin: 0, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.14em", opacity: 0.8 },
  heroTitle: { margin: "10px 0 8px", fontSize: 30 },
  heroText: { margin: 0, lineHeight: 1.6, maxWidth: 640 },
  heroStats: { display: "grid", gridTemplateColumns: "repeat(3, minmax(140px, 1fr))", gap: 12 },
  metricCard: { padding: "18px 16px", borderRadius: 18, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)", display: "grid", gap: 6 },
  infoBox: { background: "#edf6ff", color: "#2f7fbe", padding: 14, borderRadius: 14, border: "1px solid #cfe4f7" },
  errorBox: { background: "#fff3f2", color: "#bc4a38", padding: 14, borderRadius: 14, border: "1px solid #f1b4ac" },
  successBox: { background: "#eefbf1", color: "#257942", padding: 14, borderRadius: 14, border: "1px solid #bfe3c9" },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 },
  widePanel: { gridColumn: "1 / -1" },
  censusLayout: { display: "grid", gap: 20 },
  panel: { background: "rgba(255,255,255,0.98)", borderRadius: 24, padding: 24, border: "1px solid rgba(145, 180, 210, 0.22)", boxShadow: "0 18px 40px rgba(39, 66, 89, 0.08)" },
  censusSheet: { padding: 0, overflow: "hidden" as const },
  censusHeader: { display: "flex" as const, justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" as const, padding: "24px 24px 18px", background: "linear-gradient(180deg, #fff8ed 0%, #f8fbff 100%)", borderBottom: "1px solid #e5edf5" },
  censusEyebrow: { margin: 0, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.14em", color: "#8a6337", fontWeight: 700 },
  censusTitle: { margin: "10px 0 8px", fontSize: 28, color: "#1f3b55", lineHeight: 1.1 },
  censusMeta: { display: "grid", gap: 8, justifyItems: "end" as const },
  censusMetaText: { fontSize: 12, color: "#607489", fontWeight: 600 },
  panelTitle: { margin: "0 0 10px", fontSize: 22, color: "#24425c" },
  formSectionTitle: { margin: "0 0 14px", fontSize: 16, color: "#35546d" },
  muted: { margin: 0, color: "#607489", lineHeight: 1.6 },
  barangayHero: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 18 },
  barangayGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 16 },
  infoCard: { padding: "18px 20px", borderRadius: 18, background: "linear-gradient(180deg, #f7fbff 0%, #edf5fb 100%)", border: "1px solid #d8e8f4", display: "grid", gap: 6, color: "#34536d" },
  infoLabel: { margin: 0, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#688095" },
  infoParagraph: { margin: "8px 0 0", color: "#4f6578", lineHeight: 1.6, fontSize: 13 },
  snapshotGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  snapshotItem: { padding: "16px 18px", borderRadius: 18, background: "#f6fbff", border: "1px solid #dceaf5", display: "grid", gap: 8, color: "#34536d" },
  eventList: { display: "grid", gap: 12 },
  eventListItem: { padding: "14px 0", borderBottom: "1px solid #e8eef5", display: "grid", gap: 4, color: "#34536d" },
  sectionHeader: { display: "flex" as const, justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" as const },
  statusChip: { padding: "8px 12px", borderRadius: 999, background: "#edf6ff", color: "#2f7fbe", fontWeight: 700, fontSize: 12 },
  eventGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 },
  eventCard: { borderRadius: 20, overflow: "hidden" as const, background: "#fff", border: "1px solid #e3edf6", boxShadow: "0 16px 32px rgba(39, 66, 89, 0.08)" },
  eventImage: { width: "100%", height: 180, objectFit: "cover" as const, display: "block" as const },
  eventBody: { padding: 18, display: "grid", gap: 10 },
  eventTitle: { margin: 0, fontSize: 18, color: "#24425c" },
  eventMeta: { margin: 0, color: "#607489", fontSize: 13 },
  eventDescription: { margin: 0, color: "#3f586e", lineHeight: 1.6 },
  formSection: { display: "grid", gap: 14, padding: "0 24px 24px", borderTop: "1px solid #edf2f7" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 },
  fieldBlock: { display: "grid", gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "#5c7388" },
  input: { width: "100%", border: "1px solid #d4e1ee", borderRadius: 16, padding: "14px 16px", background: "#f9fcff", boxSizing: "border-box" as const, fontSize: 14 },
  textarea: { minHeight: 120, gridColumn: "1 / -1", resize: "vertical" as const },
  statusField: { display: "grid", gap: 6 },
  helperText: { margin: 0, color: "#607489", fontSize: 12 },
  checkboxLabel: { display: "flex" as const, alignItems: "center", gap: 10, color: "#34536d", fontWeight: 600 },
  checkboxCard: { alignContent: "start" as const },
  tablePanel: { paddingTop: 22 },
  tableFrame: { overflowX: "auto" as const, border: "1px solid #d9e6f1", borderRadius: 18, background: "#fbfdff" },
  memberTable: { width: "100%", borderCollapse: "collapse" as const, minWidth: 980 },
  memberRow: { background: "#ffffff" },
  tableInput: { width: "100%", border: "1px solid #d4e1ee", borderRadius: 10, padding: "10px 12px", background: "#ffffff", boxSizing: "border-box" as const, fontSize: 13 },
  actionsRow: { display: "flex" as const, gap: 10, alignItems: "center", flexWrap: "wrap" as const, marginTop: 16 },
  primaryButton: { border: "none", borderRadius: 14, padding: "12px 18px", background: "#2f7fbe", color: "#fff", fontWeight: 700, cursor: "pointer" },
  secondaryButton: { border: "none", borderRadius: 14, padding: "12px 18px", background: "#edf1f6", color: "#34536d", fontWeight: 700, cursor: "pointer" },
  smallDanger: { border: "none", borderRadius: 12, padding: "10px 12px", background: "#d66b5b", color: "#fff", fontWeight: 700, cursor: "pointer" },
} as const;
