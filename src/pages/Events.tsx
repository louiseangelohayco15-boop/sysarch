import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PortalHeader from "../components/PortalHeader";
import { useAuth } from "../contexts/useAuth";
import { fetchEvents, type EventRecord } from "../services/authService";

export default function Events() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const data = await fetchEvents();
        if (active) setEvents(data || []);
      } catch {
        if (active) setError("Failed to load events.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvents();
    return () => {
      active = false;
    };
  }, []);

  const orderedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const homePath = user?.role === "secretary" ? "/admin" : user?.role === "staff" ? "/staff" : "/resident";
  const loginPath = user?.role === "resident" ? "/resident-login" : user?.role === "secretary" ? "/admin-login" : "/staff-login";

  function handleLogout() {
    logout();
    navigate(loginPath);
  }

  return (
    <div style={styles.container}>
      <PortalHeader
        rightLabel="Events"
        actions={
          <>
            <Link to={homePath} style={styles.headerAction}>Dashboard</Link>
            <Link to="/events" style={styles.headerAction}>Events</Link>
            <button onClick={handleLogout} style={styles.headerButton}>Logout</button>
          </>
        }
      />

      <div style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Community calendar</p>
          <h2 style={styles.pageTitle}>Shared events for staff, residents, and admin monitoring</h2>
          <p style={styles.pageText}>This page now reads from the same backend event feed used by the staff dashboard and resident view.</p>
        </div>
      </div>

      <div style={styles.content}>
        {loading ? <div style={styles.infoBox}>Loading events...</div> : null}
        {error ? <div style={styles.errorBox}>{error}</div> : null}

        <div style={styles.eventsContainer}>
          {orderedEvents.map((event) => (
            <article key={event.id} style={styles.eventCard}>
              <img src={event.imageUrl || FALLBACK_IMAGE} alt={event.title} style={styles.eventImage} />
              <div style={styles.eventBody}>
                <h3 style={styles.eventTitle}>{event.title}</h3>
                <p style={styles.eventMeta}><strong>Date:</strong> {formatDate(event.date)}</p>
                <p style={styles.eventMeta}><strong>Location:</strong> {event.location}</p>
                <p style={styles.eventDescription}>{event.description || "More event details will be posted here soon."}</p>
              </div>
            </article>
          ))}
          {!loading && orderedEvents.length === 0 ? <div style={styles.infoBox}>No events available yet.</div> : null}
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80";

const styles = {
  container: { width: "100vw", minHeight: "100vh", display: "flex" as const, flexDirection: "column" as const, background: "#edf4fb" },
  headerAction: { padding: "7px 10px", borderRadius: "999px", background: "#eef6ff", color: "#2f7fbe", fontSize: "12px", fontWeight: 700, textDecoration: "none" },
  headerButton: { padding: "7px 10px", borderRadius: "999px", background: "#eef6ff", color: "#2f7fbe", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer" },
  hero: { padding: "28px 36px 0" },
  eyebrow: { margin: 0, color: "#607489", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" as const },
  pageTitle: { color: "#1e3c72", fontSize: "32px", margin: "8px 0 10px", fontWeight: "bold" as const, maxWidth: 860 },
  pageText: { margin: 0, color: "#466178", lineHeight: 1.6, maxWidth: 780 },
  content: { padding: "28px 36px 40px", flex: 1 },
  infoBox: { background: "#edf6ff", color: "#2f7fbe", padding: 14, borderRadius: 14, border: "1px solid #cfe4f7" },
  errorBox: { background: "#fff3f2", color: "#bc4a38", padding: 14, borderRadius: 14, border: "1px solid #f1b4ac" },
  eventsContainer: { display: "grid" as const, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22, marginTop: 20 },
  eventCard: { background: "rgba(255,255,255,0.96)", borderRadius: 20, boxShadow: "0 18px 36px rgba(58, 95, 130, 0.12)", border: "1px solid rgba(145, 180, 210, 0.24)", overflow: "hidden" as const },
  eventImage: { width: "100%", height: 200, objectFit: "cover" as const, display: "block" as const },
  eventBody: { padding: 20, display: "grid", gap: 10 },
  eventTitle: { color: "#275173", margin: 0, fontSize: "20px" },
  eventMeta: { color: "#444", margin: 0, fontSize: "15px" },
  eventDescription: { margin: 0, color: "#52677b", lineHeight: 1.6 },
} as const;
