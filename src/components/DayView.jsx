import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TimeSlot from "./TimeSlot.jsx";

const DAY_TABS = [
  { date: "2026-03-21", short: "Sat", label: "Mar 21" },
  { date: "2026-03-22", short: "Sun", label: "Mar 22" },
  { date: "2026-03-23", short: "Mon", label: "Mar 23" },
  { date: "2026-03-24", short: "Tue", label: "Mar 24" },
  { date: "2026-03-25", short: "Wed", label: "Mar 25" },
];

export default function DayView({ program }) {
  const { date } = useParams();
  const navigate = useNavigate();

  // Default to Sunday (first full day)
  const activeDate = date || "2026-03-22";
  const day = program.days.find((d) => d.date === activeDate);

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>SIAM UQ 2026</div>
      </div>

      {/* Day tabs */}
      <div style={styles.tabBar}>
        {DAY_TABS.map((tab) => (
          <button
            key={tab.date}
            onClick={() => navigate(`/day/${tab.date}`)}
            style={{
              ...styles.tab,
              ...(tab.date === activeDate ? styles.tabActive : {}),
            }}
          >
            <div style={styles.tabDay}>{tab.short}</div>
            <div style={styles.tabDate}>{tab.label}</div>
          </button>
        ))}
      </div>

      {/* Time slots */}
      <div className="page-content">
        {day ? (
          day.timeSlots.map((ts, i) => (
            <TimeSlot key={i} timeSlot={ts} />
          ))
        ) : (
          <div className="empty-state">
            <p>No sessions for this day.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    background: "var(--primary)",
    color: "#fff",
    padding: "14px 16px 8px",
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  tabBar: {
    display: "flex",
    background: "var(--primary)",
    padding: "0 4px 8px",
    gap: 4,
    overflowX: "auto",
    justifyContent: "center",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  tab: {
    padding: "6px 12px",
    borderRadius: 8,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    minWidth: 56,
    transition: "all 0.15s",
  },
  tabActive: {
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
  },
  tabDay: {
    fontSize: 13,
    fontWeight: 700,
  },
  tabDate: {
    fontSize: 10,
  },
};
