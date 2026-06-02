import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PortalHeader from "../components/PortalHeader";
import { useAuth } from "../contexts/useAuth";
import { fetchBeneficiaries, type Resident } from "../services/authService";

export default function Beneficiaries() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [qualificationFilter, setQualificationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBeneficiaries() {
      try {
        const data = await fetchBeneficiaries();
        if (!active) return;
        setBeneficiaries(data || []);
        setSelectedResident((data || [])[0] || null);
      } catch {
        if (active) setError("Failed to load beneficiary list.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBeneficiaries();
    return () => {
      active = false;
    };
  }, []);

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((resident) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesQuery =
        !query ||
        [resident.name, resident.address, resident.household, resident.contactNumber, resident.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const qualification = getQualification(resident);
      const matchesQualification =
        qualificationFilter === "all" ||
        (qualificationFilter === "senior" && resident.age >= 60) ||
        (qualificationFilter === "pwd" && resident.is_pwd) ||
        (qualificationFilter === "both" && qualification === "Senior & PWD");

      const matchesStatus = statusFilter === "all" || resident.status === statusFilter;
      return matchesQuery && matchesQualification && matchesStatus;
    });
  }, [beneficiaries, qualificationFilter, searchTerm, statusFilter]);

  useEffect(() => {
    if (filteredBeneficiaries.length === 0) {
      setSelectedResident(null);
      return;
    }

    setSelectedResident((current) => {
      if (current && filteredBeneficiaries.some((resident) => resident.id === current.id)) {
        return current;
      }
      return filteredBeneficiaries[0];
    });
  }, [filteredBeneficiaries]);

  const stats = useMemo(
    () => ({
      total: beneficiaries.length,
      seniors: beneficiaries.filter((resident) => resident.age >= 60).length,
      pwd: beneficiaries.filter((resident) => resident.is_pwd).length,
      claimed: beneficiaries.filter((resident) => resident.status === "Claimed").length,
    }),
    [beneficiaries]
  );

  const dashboardPath = user?.role === "secretary" ? "/admin" : user?.role === "staff" ? "/staff" : "/resident";
  const loginPath = user?.role === "resident" ? "/resident-login" : user?.role === "secretary" ? "/admin-login" : "/staff-login";

  function handleLogout() {
    logout();
    navigate(loginPath);
  }

  return (
    <div style={styles.container}>
      <PortalHeader
        rightLabel="Beneficiaries"
        actions={
          <>
            <Link to={dashboardPath} style={styles.headerAction}>Dashboard</Link>
            <Link to="/events" style={styles.headerAction}>Events</Link>
            <button onClick={handleLogout} style={styles.headerButton}>Logout</button>
          </>
        }
      />

      <div style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Beneficiary finder</p>
          <h2 style={styles.pageTitle}>Eligible beneficiary lists for Barangay 420</h2>
          <p style={styles.subtitle}>Search real resident records by name, address, household, qualification, or claim status.</p>
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}><strong>{stats.total}</strong><span>Total eligible</span></div>
          <div style={styles.statCard}><strong>{stats.seniors}</strong><span>Senior citizens</span></div>
          <div style={styles.statCard}><strong>{stats.pwd}</strong><span>PWD residents</span></div>
          <div style={styles.statCard}><strong>{stats.claimed}</strong><span>Claimed</span></div>
        </div>
      </div>

      <div style={styles.content}>
        {loading ? <div style={styles.infoBox}>Loading beneficiary list...</div> : null}
        {error ? <div style={styles.errorBox}>{error}</div> : null}

        <div style={styles.toolbar}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Find by name, address, household, contact, or email"
            style={styles.input}
          />
          <select value={qualificationFilter} onChange={(event) => setQualificationFilter(event.target.value)} style={styles.select}>
            <option value="all">All qualifications</option>
            <option value="senior">Senior only</option>
            <option value="pwd">PWD only</option>
            <option value="both">Senior & PWD</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={styles.select}>
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Claimed">Claimed</option>
          </select>
        </div>

        <div style={styles.layout}>
          <section style={styles.tablePanel}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>PWD</th>
                  <th>Qualification</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map((resident) => (
                  <tr key={resident.id}>
                    <td>{resident.name}</td>
                    <td style={{ textAlign: "center" }}>{resident.age}</td>
                    <td style={{ textAlign: "center" }}>{resident.is_pwd ? "Yes" : "-"}</td>
                    <td>{getQualification(resident)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ ...styles.statusPill, ...(resident.status === "Claimed" ? styles.statusClaimed : styles.statusPending) }}>
                        {resident.status}
                      </span>
                    </td>
                    <td>
                      <button type="button" style={styles.smallButton} onClick={() => setSelectedResident(resident)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredBeneficiaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={styles.emptyCell}>No beneficiaries matched your search.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>

          <aside style={styles.detailPanel}>
            <h3 style={styles.detailTitle}>Beneficiary details</h3>
            {selectedResident ? (
              <div style={styles.detailList}>
                <p><strong>Name:</strong> {selectedResident.name}</p>
                <p><strong>Qualification:</strong> {getQualification(selectedResident)}</p>
                <p><strong>Age:</strong> {selectedResident.age}</p>
                <p><strong>PWD:</strong> {selectedResident.is_pwd ? "Yes" : "No"}</p>
                <p><strong>Status:</strong> {selectedResident.status}</p>
                <p><strong>Household:</strong> {selectedResident.household || "-"}</p>
                <p><strong>Address:</strong> {selectedResident.address || "-"}</p>
                <p><strong>Contact:</strong> {selectedResident.contactNumber || "-"}</p>
                <p><strong>Email:</strong> {selectedResident.email || "-"}</p>
                <p><strong>Remarks:</strong> {selectedResident.notes || "No remarks."}</p>
              </div>
            ) : (
              <p style={styles.emptyDetail}>No beneficiary matches the current filters.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function getQualification(resident: Resident) {
  if (resident.age >= 60 && resident.is_pwd) return "Senior & PWD";
  if (resident.age >= 60) return "Senior Citizen";
  return "PWD";
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex" as const,
    flexDirection: "column" as const,
    background: "linear-gradient(135deg, #eef4fb 0%, #f7fbff 100%)",
  },
  headerAction: {
    padding: "7px 10px",
    borderRadius: "999px",
    background: "#eef6ff",
    color: "#2f7fbe",
    fontSize: "12px",
    fontWeight: 700,
    textDecoration: "none",
  },
  headerButton: {
    padding: "7px 10px",
    borderRadius: "999px",
    background: "#eef6ff",
    color: "#2f7fbe",
    fontSize: "12px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
  hero: {
    padding: "28px 36px 0",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 420px",
    gap: 20,
    alignItems: "start",
  },
  eyebrow: { margin: 0, color: "#607489", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" as const },
  pageTitle: { color: "#1e3c72", fontSize: "32px", margin: "8px 0 10px", fontWeight: "bold" as const, maxWidth: 720 },
  subtitle: { margin: 0, color: "#466178", lineHeight: 1.6, maxWidth: 720 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  statCard: {
    background: "rgba(255,255,255,0.94)",
    border: "1px solid #d8e6f3",
    borderRadius: 18,
    padding: "18px 16px",
    display: "grid",
    gap: 6,
    color: "#34536d",
    boxShadow: "0 12px 24px rgba(58, 95, 130, 0.08)",
  },
  content: { padding: "28px 36px 40px", display: "grid", gap: 18 },
  infoBox: { background: "#edf6ff", color: "#2f7fbe", padding: 14, borderRadius: 14, border: "1px solid #cfe4f7" },
  errorBox: { background: "#fff3f2", color: "#bc4a38", padding: 14, borderRadius: 14, border: "1px solid #f1b4ac" },
  toolbar: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px 180px", gap: 12 },
  input: { width: "100%", border: "1px solid #d4e1ee", borderRadius: 16, padding: "14px 16px", background: "#fff", boxSizing: "border-box" as const, fontSize: 14 },
  select: { width: "100%", border: "1px solid #d4e1ee", borderRadius: 16, padding: "14px 16px", background: "#fff", boxSizing: "border-box" as const, fontSize: 14 },
  layout: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 18 },
  tablePanel: { background: "#fff", border: "1px solid #d9e6f1", borderRadius: 20, overflow: "hidden" as const, boxShadow: "0 18px 36px rgba(58, 95, 130, 0.1)" },
  detailPanel: { background: "#fff", border: "1px solid #d9e6f1", borderRadius: 20, padding: 20, boxShadow: "0 18px 36px rgba(58, 95, 130, 0.1)" },
  detailTitle: { margin: "0 0 14px", color: "#24425c", fontSize: 20 },
  detailList: { display: "grid", gap: 10, color: "#35546d", lineHeight: 1.5 },
  emptyDetail: { margin: 0, color: "#607489", lineHeight: 1.6 },
  table: { width: "100%", borderCollapse: "collapse" as const },
  statusPill: { display: "inline-block", padding: "7px 12px", borderRadius: 999, color: "#fff", fontWeight: 700, fontSize: 12 },
  statusClaimed: { background: "#3ea86b" },
  statusPending: { background: "#f08b4f" },
  smallButton: { padding: "8px 14px", background: "#2f7fbe", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  emptyCell: { padding: 18, textAlign: "center" as const, color: "#607489" },
} as const;
