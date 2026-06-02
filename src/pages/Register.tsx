import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerUser } from "../services/authService";
import type { RegisterPayload } from "../services/authService";
import type { Role } from "../services/authService";
import PortalHeader from "../components/PortalHeader";

type RegisterMode = "resident" | "staffAdmin";

type RegisterProps = {
  mode?: RegisterMode;
};

export default function Register({ mode = "resident" }: RegisterProps) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(mode === "staffAdmin" ? "secretary" : "resident");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const isStaffAdminMode = mode === "staffAdmin";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const cleanFirstName = firstName.trim();
    const cleanMiddleName = middleName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanContactNumber = contactNumber.trim();
    const cleanAddress = address.trim();
    const cleanPassword = password.trim();

    if (!cleanFirstName || !cleanLastName) {
      setError("First name and last name are required");
      setLoading(false);
      return;
    }

    const username = [cleanFirstName, cleanMiddleName, cleanLastName].filter(Boolean).join(" ");
    const targetRole = isStaffAdminMode ? role : "resident";
    const payload: RegisterPayload = {
      username,
      firstName: cleanFirstName,
      middleName: cleanMiddleName || undefined,
      lastName: cleanLastName,
      email: cleanEmail,
      contactNumber: cleanContactNumber || undefined,
      address: cleanAddress || undefined,
      password: cleanPassword,
      role: targetRole,
    };

    try {
      const result = await registerUser(payload, isStaffAdminMode ? "staff" : "resident");
      if (result.success) {
        setSuccess(isStaffAdminMode ? "Account created successfully! Returning to admin dashboard..." : "Account created successfully! Redirecting to login...");
        setTimeout(() => {
          navigate(isStaffAdminMode ? "/admin" : "/resident-login");
        }, 1500);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch {
      setError("Registration failed");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}></div>
      <div style={styles.mainContent}>
        <PortalHeader rightLabel={isStaffAdminMode ? "Admin Registration" : "Resident Registration"} />

        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>{isStaffAdminMode ? "Create staff or admin account." : "Resident registration"}</h2>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form style={styles.form} onSubmit={handleRegister}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name:</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="First"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                  disabled={loading}
                  required
                />
                <input
                  type="text"
                  placeholder="Middle"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                  disabled={loading}
                />
                <input
                  type="text"
                  placeholder="Last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={loading}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Contact number:</label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Address:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={styles.input}
                disabled={loading}
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

            {isStaffAdminMode ? (
              <div style={styles.formGroup}>
                <label style={styles.label}>ROLES</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  style={styles.select}
                  disabled={loading}
                >
                  <option value="secretary">Admin / Secretary</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            ) : null}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "CREATING..." : "SUBMIT"}
            </button>
          </form>

          {isStaffAdminMode ? (
            <p style={styles.link}>
              Finished? <a href="/admin" style={styles.linkText}>Back to admin dashboard</a>
            </p>
          ) : (
            <p style={styles.link}>
              Already have an account? <a href="/resident-login" style={styles.linkText}>Click here</a>
            </p>
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
    fontSize: "16px",
    fontWeight: "bold" as const,
    marginBottom: "24px",
    color: "#243b53",
    maxWidth: "500px",
    textAlign: "center" as const,
  },
  form: {
    background: "rgba(255, 255, 255, 0.96)",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 18px 36px rgba(58, 95, 130, 0.14)",
    border: "1px solid rgba(145, 180, 210, 0.28)",
    width: "100%",
    maxWidth: "500px",
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
  select: {
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
  successBox: {
    background: "#eef9f1",
    color: "#2f7d56",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "13px",
    border: "1px solid #b7dec2",
  },
};
