import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../hooks/useSchedule.jsx";
import { getTalkInfo } from "../utils/data.js";
import TalkDetail from "./TalkDetail.jsx";

export default function MySchedule({ program }) {
  const { savedTalks, toggle, isSaved } = useSchedule();
  const navigate = useNavigate();
  const [expandedTalk, setExpandedTalk] = useState(null);

  // Build sorted schedule grouped by day and time
  const schedule = useMemo(() => {
    const entries = [];
    for (const talkId of savedTalks) {
      const info = getTalkInfo(talkId);
      if (info) entries.push(info);
    }

    // Sort by day then time
    entries.sort((a, b) => {
      const dayCompare = a.day.date.localeCompare(b.day.date);
      if (dayCompare !== 0) return dayCompare;
      return a.timeSlot.start.localeCompare(b.timeSlot.start);
    });

    // Group by day
    const grouped = {};
    for (const entry of entries) {
      const key = entry.day.date;
      if (!grouped[key]) {
        grouped[key] = { day: entry.day, talks: [] };
      }
      grouped[key].talks.push(entry);
    }

    return Object.values(grouped);
  }, [savedTalks]);

  // Detect conflicts (overlapping talks)
  const conflicts = useMemo(() => {
    const set = new Set();
    for (const group of schedule) {
      const talks = group.talks;
      for (let i = 0; i < talks.length; i++) {
        for (let j = i + 1; j < talks.length; j++) {
          const a = talks[i];
          const b = talks[j];
          // Simple overlap check: same time slot
          if (
            a.timeSlot.start === b.timeSlot.start &&
            a.timeSlot.end === b.timeSlot.end
          ) {
            set.add(a.talk.id);
            set.add(b.talk.id);
          }
        }
      }
    }
    return set;
  }, [schedule]);

  if (savedTalks.size === 0) {
    return (
      <div>
        <div style={styles.header}>
          <div style={styles.headerTitle}>My Schedule</div>
        </div>
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>No talks saved yet</p>
          <p>Browse the program and tap ☆ to add talks to your schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          My Schedule ({savedTalks.size} talk{savedTalks.size !== 1 ? "s" : ""})
        </div>
      </div>
      <div className="page-content">
        {schedule.map((group) => (
          <div key={group.day.date} style={styles.dayGroup}>
            <h3 style={styles.dayLabel}>{group.day.label}</h3>
            {group.talks.map(({ talk, session, day, timeSlot }) => {
              const isExpanded = expandedTalk === talk.id;
              const hasConflict = conflicts.has(talk.id);

              return (
                <div key={talk.id} style={styles.talkCard}>
                  <div style={styles.talkTop}>
                    <button
                      className="star-btn active"
                      onClick={() => toggle(talk.id)}
                      title="Remove from schedule"
                    >
                      ★
                    </button>
                    <div
                      style={styles.talkInfo}
                      onClick={() =>
                        setExpandedTalk(isExpanded ? null : talk.id)
                      }
                    >
                      <div style={styles.talkMeta}>
                        <span style={styles.talkTime}>
                          {talk.time || `${timeSlot.start} – ${timeSlot.end}`}
                        </span>
                        <span
                          style={styles.sessionLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/session/${session.code}`);
                          }}
                        >
                          {session.id}
                        </span>
                      </div>
                      <div style={styles.talkTitle}>{talk.title}</div>
                      <div style={styles.talkSpeaker}>
                        {talk.speakers?.[0]?.name}
                      </div>
                      <div style={styles.talkLocation}>{session.location}</div>
                      {hasConflict && (
                        <div className="conflict-warning">
                          ⚠ Time conflict with another saved talk
                        </div>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <TalkDetail
                      talk={talk}
                      session={session}
                      day={day}
                      timeSlot={timeSlot}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  header: {
    background: "var(--primary)",
    color: "#fff",
    padding: "14px 16px",
    textAlign: "center",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  dayGroup: {
    marginBottom: 20,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: "var(--primary)",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "2px solid var(--primary)",
  },
  talkCard: {
    background: "var(--card-bg)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    boxShadow: "var(--shadow)",
    marginBottom: 8,
    borderLeft: "3px solid var(--accent)",
  },
  talkTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },
  talkInfo: {
    flex: 1,
    cursor: "pointer",
  },
  talkMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  talkTime: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--primary)",
  },
  sessionLink: {
    fontSize: 11,
    color: "var(--primary-light)",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
  },
  talkTitle: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: 3,
  },
  talkSpeaker: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginBottom: 2,
  },
  talkLocation: {
    fontSize: 11,
    color: "var(--text-light)",
  },
};
