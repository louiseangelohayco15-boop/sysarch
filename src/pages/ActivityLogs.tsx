import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchLogs } from "../services/authService";
import type { ActivityLog } from "../services/authService";
import { useAuth } from "../contexts/useAuth";
import PortalHeader from "../components/PortalHeader";

export default function ActivityLogs() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const dashboardPath = useMemo(() => {
    if (user?.role === "secretary") return "/admin";
    if (user?.role === "staff") return "/staff";
    return "/resident";
  }, [user?.role]);
  const loginPath = useMemo(() => {
    if (user?.role === "secretary") return "/admin-login";
    if (user?.role === "staff") return "/staff-login";
    return "/resident-login";
  }, [user?.role]);

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [log.id, log.action, log.userId, log.details, log.timestamp].some((value) =>
        (value || "").toString().toLowerCase().includes(query)
      )
    );
  }, [logs, searchTerm]);

  useEffect(() => {
    fetchLogs()
      .then((data) => setLogs(data || []))
      .catch(() => setError("Failed to load activity logs"));
  }, []);

  const handleLogout = () => {
    logout();
    navigate(loginPath);
  };

  return (
    <div style={styles.container}>
      <PortalHeader
        rightLabel="Activity Logs"
        actions={
          <>
            <Link to={dashboardPath} style={styles.headerAction}>Dashboard</Link>
            <Link to="/activity-logs" style={styles.headerAction}>Logs</Link>
            <button onClick={handleLogout} style={styles.headerButton}>Logout</button>
          </>
        }
      />

      <div style={styles.content}>
        <h2 style={styles.pageTitle}>System Activity Logs & Audit Trail</h2>
        {error && <p style={styles.errorText}>{error}</p>}
        <div style={styles.toolbar}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by log id, action, user, or timestamp"
            style={styles.searchInput}
          />
          <div style={styles.countPill}>{filteredLogs.length} logs</div>
        </div>

        <table style={styles.table}>
          <thead style={{ background: "#1e3c72", color: "white" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left" }}>Log ID</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Activity</th>
              <th style={{ padding: "12px", textAlign: "left" }}>User ID</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Details</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td style={styles.cell}>{log.id}</td>
                <td style={styles.cell}>{log.action}</td>
                <td style={styles.cell}>{log.userId || "-"}</td>
                <td style={styles.cell}>{log.details || "-"}</td>
                <td style={styles.cell}>{log.timestamp}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "12px", textAlign: "center", color: "#666" }}>
                  No activity logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    display: "flex" as const,
    flexDirection: "column" as const,
    background: "#edf4fb",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    overflowX: "hidden" as const,
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
  content: {
    padding: "24px 50px",
    width: "100%",
    margin: "0",
    flex: 1,
    overflowY: "auto" as const,
  },
  pageTitle: {
    color: "#275173",
    fontSize: "32px",
    margin: "0 0 10px 0",
    fontWeight: "bold" as const,
  },
  errorText: {
    color: "#bc4a38",
    marginBottom: "10px",
  },
  toolbar: {
    display: "flex" as const,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    width: "100%",
    maxWidth: "420px",
    padding: "10px 12px",
    border: "1px solid #c9d9e7",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#f8fbff",
    boxSizing: "border-box" as const,
  },
  countPill: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#edf6ff",
    color: "#2f7fbe",
    fontWeight: 700,
    fontSize: "12px",
    whiteSpace: "nowrap" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginTop: "20px",
    tableLayout: "fixed" as const,
  },
  cell: {
    padding: "10px 12px",
    overflowWrap: "anywhere" as const,
    wordBreak: "break-word" as const,
    verticalAlign: "top" as const,
  },
};
