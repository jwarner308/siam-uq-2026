import React from "react";

export default function TalkDetail({ talk, session, day, timeSlot }) {
  return (
    <div style={styles.container}>
      <div style={styles.divider} />

      {/* Context */}
      <div style={styles.context}>
        <span>{day.label}</span>
        <span> · </span>
        <span>{talk.time || `${timeSlot.start} – ${timeSlot.end}`}</span>
        <span> · </span>
        <span>{session.location}</span>
      </div>

      {/* Abstract */}
      {talk.abstract ? (
        <div style={styles.abstract}>
          <div style={styles.abstractLabel}>Abstract</div>
          <p style={styles.abstractText}>{talk.abstract}</p>
        </div>
      ) : (
        <div style={styles.noAbstract}>No abstract available.</div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    background: "var(--border)",
    marginBottom: 10,
  },
  context: {
    fontSize: 12,
    color: "var(--text-light)",
    marginBottom: 10,
  },
  abstract: {
    marginBottom: 4,
  },
  abstractLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--text-secondary)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  abstractText: {
    fontSize: 13,
    lineHeight: 1.55,
    color: "var(--text)",
  },
  noAbstract: {
    fontSize: 13,
    color: "var(--text-light)",
    fontStyle: "italic",
  },
};
