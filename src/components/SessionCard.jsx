import React from "react";
import { useNavigate } from "react-router-dom";

export default function SessionCard({ session }) {
  const navigate = useNavigate();
  const { id, code, title, type, location, cancelled, talks } = session;

  return (
    <div
      onClick={() => navigate(`/session/${code}`)}
      style={styles.card}
      className={cancelled ? "cancelled" : ""}
    >
      <div style={styles.topRow}>
        <span className={`badge badge-${type}`}>{type}</span>
        <span style={styles.id}>{id}</span>
        {cancelled && <span style={styles.cancelledBadge}>CANCELLED</span>}
      </div>
      <div style={styles.title}>{title}</div>
      <div style={styles.meta}>
        <span style={styles.location}>{location}</span>
        {talks.length > 0 && (
          <span style={styles.talkCount}>
            {talks.length} talk{talks.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "var(--card-bg)",
    borderRadius: "var(--radius)",
    padding: "12px 14px",
    boxShadow: "var(--shadow)",
    cursor: "pointer",
    transition: "box-shadow 0.15s",
    borderLeft: "4px solid var(--primary)",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  id: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--text-secondary)",
  },
  cancelledBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "var(--danger)",
    marginLeft: "auto",
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: 6,
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  location: {
    fontSize: 11,
    color: "var(--text-light)",
  },
  talkCount: {
    fontSize: 11,
    color: "var(--text-light)",
  },
};
