import { useState, type ReactNode } from "react";
import PortalHeader from "./PortalHeader";

type NavItem = {
  key: string;
  label: string;
  caption?: string;
  badge?: string;
};

type WorkspaceShellProps = {
  rightLabel: string;
  title: string;
  subtitle: string;
  navItems: NavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  actions?: ReactNode;
  hero?: ReactNode;
  children: ReactNode;
};

export default function WorkspaceShell({
  rightLabel,
  title,
  subtitle,
  navItems,
  activeKey,
  onSelect,
  actions,
  hero,
  children,
}: WorkspaceShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        ...styles.page,
        gridTemplateColumns: collapsed ? "84px minmax(0, 1fr)" : "248px minmax(0, 1fr)",
      }}
    >
      <aside style={{ ...styles.sidebar, ...(collapsed ? styles.sidebarCollapsed : {}) }}>
        <div style={styles.sidebarTop}>
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            style={styles.toggleButton}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? ">>" : "<<"}
          </button>
        </div>

        <div style={{ ...styles.brandCard, ...(collapsed ? styles.brandCardCollapsed : {}) }}>
          <div style={styles.brandEyebrow}>Barangay 420</div>
          {!collapsed ? <h1 style={styles.brandTitle}>{title}</h1> : null}
          {!collapsed ? <p style={styles.brandSubtitle}>{subtitle}</p> : null}
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                style={{
                  ...styles.navButton,
                  ...(collapsed ? styles.navButtonCollapsed : {}),
                  ...(active ? styles.navButtonActive : {}),
                }}
              >
                <span style={styles.navLabelRow}>
                  <span>{collapsed ? item.label.slice(0, 1) : item.label}</span>
                  {!collapsed && item.badge ? <span style={styles.badge}>{item.badge}</span> : null}
                </span>
                {!collapsed && item.caption ? <span style={styles.navCaption}>{item.caption}</span> : null}
              </button>
            );
          })}
        </nav>
      </aside>

      <main style={styles.main}>
        <PortalHeader rightLabel={rightLabel} actions={actions} />
        {hero ? <div style={styles.hero}>{hero}</div> : null}
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "248px minmax(0, 1fr)",
    background: "#eef4f9",
    color: "#1f3347",
  },
  sidebar: {
    padding: "18px 14px",
    background: "#18314f",
    color: "#f5f9ff",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 16,
    boxShadow: "10px 0 24px rgba(21, 37, 53, 0.14)",
  },
  sidebarCollapsed: {
    padding: "16px 10px",
  },
  sidebarTop: {
    display: "flex" as const,
    justifyContent: "flex-end",
  },
  toggleButton: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#f5f9ff",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 12,
  },
  brandCard: {
    padding: "18px 16px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  brandCardCollapsed: {
    padding: "14px 10px",
    textAlign: "center" as const,
  },
  brandEyebrow: {
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    opacity: 0.76,
    marginBottom: 8,
  },
  brandTitle: {
    margin: "0 0 10px",
    fontSize: 21,
    lineHeight: 1.2,
  },
  brandSubtitle: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(245,249,255,0.84)",
  },
  nav: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 10,
  },
  navButton: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#f5f9ff",
    borderRadius: 14,
    padding: "12px 14px",
    textAlign: "left" as const,
    cursor: "pointer",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 4,
  },
  navButtonCollapsed: {
    padding: "12px 10px",
    alignItems: "center" as const,
    textAlign: "center" as const,
  },
  navButtonActive: {
    background: "#f4f8fc",
    color: "#18314f",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "none",
  },
  navLabelRow: {
    display: "flex" as const,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    fontWeight: 700,
    fontSize: 14,
  },
  navCaption: {
    fontSize: 12,
    lineHeight: 1.4,
    opacity: 0.72,
  },
  badge: {
    minWidth: 26,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.82)",
    textAlign: "center" as const,
    fontSize: 11,
    fontWeight: 800,
  },
  main: {
    display: "flex" as const,
    flexDirection: "column" as const,
    minWidth: 0,
  },
  hero: {
    padding: "18px 20px 0",
  },
  content: {
    padding: 20,
    display: "grid",
    gap: 18,
  },
} as const;
