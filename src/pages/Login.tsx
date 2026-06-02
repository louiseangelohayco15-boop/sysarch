import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../services/authService";
import { useAuth } from "../contexts/useAuth";
import PortalHeader from "../components/PortalHeader";

type LoginPortal = "resident" | "staff" | "admin";

type LoginProps = {
  portal?: LoginPortal;
};

export default function Login({ portal = "resident" }: LoginProps) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const isResidentPortal = portal === "resident";
  const isAdminPortal = portal === "admin";
  const isStaffPortal = portal !== "resident";
  const backendPortal = isResidentPortal ? "resident" : "staff";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const username = identifier.trim().replace(/\s+/g, " ");
    try {
      const result = await loginUser(username, password, backendPortal);
      if (result.success && result.user) {
        setUser(result.user);
        const userRole = result.user.role;
        if (userRole === "resident") navigate("/resident");
        else if (userRole === "staff") navigate("/staff");
        else if (userRole === "secretary") navigate("/admin");
      } else {
        setError(result.error || "Login failed");
      }
    } catch {
      setError("Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}></div>
      <div style={styles.mainContent}>
        <PortalHeader rightLabel={isResidentPortal ? "Resident Login" : isAdminPortal ? "Admin Login" : "Staff/Admin Login"} />

        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>{isResidentPortal ? "RESIDENT LOGIN" : isAdminPortal ? "ADMIN LOGIN" : "STAFF / ADMIN LOGIN"}</h2>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form style={styles.form} onSubmit={handleLogin}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username or Email:</label>
              <input
                type="text"
                placeholder="e.g. jane@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={styles.input}
                disabled={loading}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>

          {isStaffPortal ? (
            <>
              <p style={styles.link}>
                Resident account? <a href="/resident-login" style={styles.linkText}>Use resident login</a>
              </p>
              <p style={styles.link}>Staff and admin accounts are created by the admin panel.</p>
            </>
          ) : (
            <>
              <p style={styles.link}>
                Don't have an account? <a href="/resident-register" style={styles.linkText}>Register here</a>
              </p>
              <p style={styles.link}>
                Staff or admin? <a href="/staff-login" style={styles.linkText}>Use staff/admin login</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex" as const,
    width: "100vw",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: "linear-gradient(135deg, #eef7ff 0%, #e3eef8 100%)",
  },
  sidebar: {
    width: "60px",
    background: "linear-gradient(180deg, #ff885b 0%, #f06a3b 100%)",
    minHeight: "100vh",
  },
  mainContent: {
    flex: 1,
    display: "flex" as const,
    flexDirection: "column" as const,
    background: "linear-gradient(135deg, #eef7ff 0%, #e3eef8 100%)",
  },
  formContainer: {
    flex: 1,
    display: "flex" as const,
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: "bold" as const,
    marginBottom: "24px",
    color: "#243b53",
  },
  form: {
    background: "rgba(255, 255, 255, 0.96)",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 18px 36px rgba(58, 95, 130, 0.14)",
    border: "1px solid rgba(145, 180, 210, 0.28)",
    width: "100%",
    maxWidth: "400px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block" as const,
    fontSize: "13px",
    fontWeight: "600" as const,
    marginBottom: "6px",
    color: "#29445d",
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #c9d9e7",
    borderRadius: "8px",
    fontSize: "13px",
    boxSizing: "border-box" as const,
    background: "#f7fbff",
    color: "#1f2937",
  },
  button: {
    width: "100%",
    padding: "11px",
    background: "linear-gradient(135deg, #4d9fda 0%, #2f7fbe 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold" as const,
    cursor: "pointer",
    marginTop: "12px",
    boxShadow: "0 10px 18px rgba(47, 127, 190, 0.2)",
  },
  link: {
    textAlign: "center" as const,
    fontSize: "12px",
    marginTop: "12px",
    color: "#607489",
  },
  linkText: {
    color: "#2f7fbe",
    textDecoration: "underline",
  },
  errorBox: {
    background: "#fff3f2",
    color: "#bc4a38",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "13px",
    border: "1px solid #f1b4ac",
  },
};
