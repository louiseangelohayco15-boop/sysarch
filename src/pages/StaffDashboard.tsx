import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceShell from "../components/WorkspaceShell";
import { useAuth } from "../contexts/useAuth";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
  type EventRecord,
} from "../services/authService";

type StaffSection = "overview" | "manage" | "events";

type EventForm = Omit<EventRecord, "id">;

const INITIAL_FORM: EventForm = {
  title: "",
  date: "",
  location: "Barangay Hall",
  description: "",
  imageUrl: "",
  createdBy: "",
  createdAt: "",
  updatedAt: "",
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [section, setSection] = useState<StaffSection>("overview");
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [form, setForm] = useState<EventForm>(INITIAL_FORM);
  const [editing, setEditing] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function loadEvents() {
    try {
      const data = await fetchEvents();
      setEvents(data || []);
    } catch (err) {
      const nextError = err && typeof err === "object" && "error" in err ? String((err as { error: unknown }).error) : "Failed to load events";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const upcomingEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const nextEvent = upcomingEvents[0] ?? null;
  const thisMonthCount = upcomingEvents.filter((event) => {
    const date = new Date(event.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  function updateFormValue<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(event: EventRecord) {
    setEditing(event);
    setForm({ ...INITIAL_FORM, ...event });
    setSection("manage");
  }

  function resetForm() {
    setEditing(null);
    setForm({ ...INITIAL_FORM, createdBy: user?.id || "" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");

    const payload: EventForm = {
      ...form,
      title: form.title.trim(),
      date: form.date,
      location: form.location.trim(),
      description: form.description?.trim() || "",
      imageUrl: form.imageUrl?.trim() || "",
      createdBy: user?.id || form.createdBy || "",
      createdAt: form.createdAt || "",
      updatedAt: form.updatedAt || "",
    };

    if (!payload.title || !payload.date || !payload.location) {
      setError("Title, date, and location are required.");
      setSaving(false);
      return;
    }

    try {
      if (editing) {
        await updateEvent(editing.id, payload);
        setInfo("Event updated successfully.");
      } else {
        await createEvent(payload);
        setInfo("Event saved successfully.");
      }
      resetForm();
      await loadEvents();
      setSection("events");
    } catch (err) {
      const nextError = err && typeof err === "object" && "error" in err ? String((err as { error: unknown }).error) : "Unable to save event";
      setError(nextError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    setError("");
    setInfo("");

    try {
      await deleteEvent(id);
      setInfo("Event removed.");
      await loadEvents();
    } catch (err) {
      const nextError = err && typeof err === "object" && "error" in err ? String((err as { error: unknown }).error) : "Unable to delete event";
      setError(nextError);
    }
  }

  function handleLogout() {
    logout();
    navigate("/staff-login");
  }

  const navItems = [
    { key: "overview", label: "Dashboard", caption: "Quick event snapshot", badge: String(upcomingEvents.length) },
    { key: "manage", label: "Create Event", caption: "Draft or edit announcements" },
    { key: "events", label: "Events", caption: "Review resident-visible events", badge: String(upcomingEvents.length) },
  ];

  return (
    <WorkspaceShell
      rightLabel="Staff"
      title="Staff Event Desk"
      subtitle="Plan activities and keep resident-facing event information fresh."
      navItems={navItems}
      activeKey={section}
      onSelect={(value) => setSection(value as StaffSection)}
      actions={<button onClick={handleLogout} style={styles.headerButton}>Logout</button>}
      hero={section === "overview" ? (
        <div style={styles.heroCard}>
          <div>
            <p style={styles.heroEyebrow}>Operations overview</p>
            <h2 style={styles.heroTitle}>{nextEvent ? nextEvent.title : "No events scheduled yet"}</h2>
            <p style={styles.heroText}>
              {nextEvent
                ? `Next event is on ${formatDate(nextEvent.date)} at ${nextEvent.location}.`
                : "Start by creating a new event so residents can see it in their dashboard."}
            </p>
          </div>
          <div style={styles.heroStats}>
            <div style={styles.metricCard}>
              <strong>{upcomingEvents.length}</strong>
              <span>Total events</span>
            </div>
            <div style={styles.metricCard}>
              <strong>{thisMonthCount}</strong>
              <span>Scheduled this month</span>
            </div>
          </div>
        </div>
      ) : undefined}
    >
      {error ? <div style={styles.errorBox}>{error}</div> : null}
      {info ? <div style={styles.infoBox}>{info}</div> : null}
      {loading ? <div style={styles.infoBox}>Loading staff dashboard...</div> : null}

      {section === "overview" ? (
        <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Upcoming events</h3>
            <div style={styles.list}>
              {upcomingEvents.slice(0, 4).map((event) => (
                <div key={event.id} style={styles.listItem}>
                  <strong>{event.title}</strong>
                  <span>{formatDate(event.date)} • {event.location}</span>
                </div>
              ))}
              {upcomingEvents.length === 0 ? <p style={styles.muted}>No events available yet.</p> : null}
            </div>
        </section>
      ) : null}

      {section === "manage" ? (
        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.panelTitle}>{editing ? "Edit event" : "Create a new event"}</h3>
              <p style={styles.muted}>Residents will see this on their dashboard and on the events page.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.formGrid}>
            <input
              value={form.title}
              onChange={(event) => updateFormValue("title", event.target.value)}
              placeholder="Event title"
              style={styles.input}
              required
            />
            <input
              type="date"
              value={form.date}
              onChange={(event) => updateFormValue("date", event.target.value)}
              style={styles.input}
              required
            />
            <input
              value={form.location}
              onChange={(event) => updateFormValue("location", event.target.value)}
              placeholder="Location"
              style={styles.input}
              required
            />
            <input
              value={form.imageUrl}
              onChange={(event) => updateFormValue("imageUrl", event.target.value)}
              placeholder="Image URL"
              style={styles.input}
            />
            <textarea
              value={form.description}
              onChange={(event) => updateFormValue("description", event.target.value)}
              placeholder="Short description for residents"
              style={{ ...styles.input, ...styles.textarea }}
            />
            <div style={styles.actionsRow}>
              <button type="submit" style={styles.primaryButton} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Event" : "Save Event"}
              </button>
              <button type="button" style={styles.secondaryButton} onClick={resetForm}>
                Clear Form
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {section === "events" ? (
        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.panelTitle}>Events</h3>
              <p style={styles.muted}>Everything here is visible to residents.</p>
            </div>
          </div>
          <div style={styles.eventGrid}>
            {upcomingEvents.map((event) => (
              <article key={event.id} style={styles.eventCard}>
                <img
                  src={event.imageUrl || FALLBACK_IMAGE}
                  alt={event.title}
                  style={styles.eventImage}
                />
                <div style={styles.eventBody}>
                  <h4 style={styles.eventTitle}>{event.title}</h4>
                  <p style={styles.eventMeta}>{formatDate(event.date)} • {event.location}</p>
                  <p style={styles.eventDescription}>{event.description || "No description added yet."}</p>
                  <div style={styles.actionsRow}>
                    <button type="button" style={styles.primaryButton} onClick={() => startEdit(event)}>
                      Edit
                    </button>
                    <button type="button" style={styles.dangerButton} onClick={() => handleDelete(event.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {upcomingEvents.length === 0 ? <p style={styles.muted}>No events yet.</p> : null}
          </div>
        </section>
      ) : null}
    </WorkspaceShell>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80";

const styles = {
  headerButton: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "none",
    background: "#eef6ff",
    color: "#2f7fbe",
    fontWeight: 700,
    cursor: "pointer",
  },
  heroCard: {
    borderRadius: 28,
    padding: "24px 28px",
    background: "linear-gradient(135deg, #18314f 0%, #315f87 55%, #f0a261 100%)",
    color: "#fffdf8",
    display: "flex" as const,
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: 20,
    flexWrap: "wrap" as const,
  },
  heroEyebrow: { margin: 0, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.14em", opacity: 0.8 },
  heroTitle: { margin: "10px 0 8px", fontSize: 30, lineHeight: 1.1 },
  heroText: { margin: 0, maxWidth: 620, lineHeight: 1.6, color: "rgba(255,253,248,0.88)" },
  heroStats: { display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 12, flex: "1 1 280px" },
  metricCard: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 18,
    padding: "18px 16px",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 6,
  },
  errorBox: { background: "#fff3f2", color: "#bc4a38", padding: 14, borderRadius: 14, border: "1px solid #f1b4ac" },
  infoBox: { background: "#edf6ff", color: "#2f7fbe", padding: 14, borderRadius: 14, border: "1px solid #cfe4f7" },
  panel: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    padding: 24,
    border: "1px solid rgba(145, 180, 210, 0.22)",
    boxShadow: "0 18px 40px rgba(39, 66, 89, 0.08)",
  },
  panelTitle: { margin: "0 0 10px", fontSize: 22, color: "#24425c" },
  muted: { margin: 0, color: "#607489", lineHeight: 1.6 },
  list: { display: "grid", gap: 12 },
  listItem: { display: "grid", gap: 4, padding: "12px 0", borderBottom: "1px solid #e8eef5", color: "#34536d" },
  sectionHeader: { display: "flex" as const, justifyContent: "space-between", gap: 14, alignItems: "flex-start" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 },
  input: {
    width: "100%",
    border: "1px solid #d4e1ee",
    borderRadius: 16,
    padding: "14px 16px",
    background: "#f9fcff",
    boxSizing: "border-box" as const,
    fontSize: 14,
  },
  textarea: { minHeight: 140, gridColumn: "1 / -1", resize: "vertical" as const },
  actionsRow: { display: "flex" as const, gap: 10, alignItems: "center", flexWrap: "wrap" as const },
  primaryButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 18px",
    background: "#2f7fbe",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 18px",
    background: "#edf1f6",
    color: "#34536d",
    fontWeight: 700,
    cursor: "pointer",
  },
  dangerButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 18px",
    background: "#d66b5b",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  eventGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 },
  eventCard: {
    borderRadius: 20,
    overflow: "hidden" as const,
    background: "#fff",
    border: "1px solid #e3edf6",
    boxShadow: "0 16px 32px rgba(39, 66, 89, 0.08)",
  },
  eventImage: { width: "100%", height: 180, objectFit: "cover" as const, display: "block" as const },
  eventBody: { padding: 18, display: "grid", gap: 10 },
  eventTitle: { margin: 0, fontSize: 18, color: "#24425c" },
  eventMeta: { margin: 0, color: "#607489", fontSize: 13 },
  eventDescription: { margin: 0, color: "#3f586e", lineHeight: 1.6 },
} as const;
