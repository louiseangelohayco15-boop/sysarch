import type { ReactNode } from "react";

type PortalHeaderProps = {
  rightLabel?: string;
  actions?: ReactNode;
};

export default function PortalHeader({ rightLabel = "Barangay Portal", actions }: PortalHeaderProps) {
  return (
    <div style={styles.header}>
      <div style={styles.headerContent}>
        <div style={styles.brandBlock}>
          <div style={styles.logoFrame}>
            <img src="/assets/manila-seal.png" alt="City of Manila seal" style={styles.logo} />
          </div>
          <div>
            <p style={styles.sideLabel}>Barangay 420</p>
            <p style={styles.sideSubLabel}>City of Manila</p>
          </div>
        </div>

        <div style={styles.headerText}>
          <p style={styles.headerTitle}>Barangay 420 Zone 43, District IV</p>
          <p style={styles.headerSubtitle}>Sampaloc, Manila</p>
        </div>

        <div style={styles.brandBlockRight}>
          <div style={styles.rightText}>
            <p style={styles.rightLabel}>{rightLabel}</p>
            {actions ? <div style={styles.actions}>{actions}</div> : <p style={styles.sideSubLabel}>Community Records Portal</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    background: "rgba(255,255,255,0.96)",
    padding: "16px 20px",
    borderBottom: "1px solid #d9e6f1",
    boxShadow: "0 8px 20px rgba(61, 95, 128, 0.06)",
  },
  headerContent: {
    display: "flex" as const,
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap" as const,
  },
  brandBlock: {
    display: "flex" as const,
    alignItems: "center",
    gap: "12px",
    minWidth: "190px",
  },
  brandBlockRight: {
    display: "flex" as const,
    alignItems: "flex-end",
    flexDirection: "column" as const,
    justifyContent: "flex-end",
    gap: "6px",
    minWidth: "180px",
    marginLeft: "auto",
  },
  logoFrame: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    background: "linear-gradient(180deg, #ffffff 0%, #ecf4fa 100%)",
    boxShadow: "0 8px 18px rgba(61, 95, 128, 0.14)",
    border: "1px solid rgba(145, 180, 210, 0.3)",
    display: "flex" as const,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logo: {
    width: "48px",
    height: "48px",
    objectFit: "contain" as const,
  },
  headerText: {
    textAlign: "center" as const,
    flex: 1,
    minWidth: "220px",
  },
  headerTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold" as const,
    color: "#243b53",
  },
  headerSubtitle: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#31485d",
  },
  rightLabel: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 800 as const,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#275173",
  },
  sideLabel: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700 as const,
    color: "#275173",
  },
  sideSubLabel: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#607489",
  },
  rightText: {
    textAlign: "right" as const,
  },
  actions: {
    display: "flex" as const,
    gap: "8px",
    justifyContent: "flex-end",
    flexWrap: "wrap" as const,
    marginTop: "4px",
  },
} as const;
