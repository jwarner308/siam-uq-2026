import React from "react";
import SessionCard from "./SessionCard.jsx";

export default function TimeSlot({ timeSlot }) {
  const { start, end, sessions } = timeSlot;

  return (
    <div style={styles.container}>
      <div style={styles.timeHeader}>
        <div style={styles.timeBadge}>
          {start}{end ? ` – ${end}` : ""}
        </div>
        <div style={styles.sessionCount}>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </div>
      </div>
      <div style={styles.sessions}>
        {sessions.map((session) => (
          <SessionCard key={session.code} session={session} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: 20,
  },
  timeHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    position: "sticky",
    top: 70,
    background: "var(--bg)",
    padding: "8px 0 4px",
    zIndex: 10,
  },
  timeBadge: {
    background: "var(--primary)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
  },
  sessionCount: {
    fontSize: 12,
    color: "var(--text-light)",
  },
  sessions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
};
