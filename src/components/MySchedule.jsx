import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "../hooks/useSchedule.jsx";
import { getTalkInfo } from "../utils/data.js";
import TalkDetail from "./TalkDetail.jsx";

export default function MySchedule({ program }) {
  const { savedTalks, toggle, isSaved } = useSchedule();
  const navigate = useNavigate();
  const [expandedTalk, setExpandedTalk] = useState(null);

  // Parse a time string into minutes since midnight
  // Handles "9:30 AM" (12-hour) and "14:30" (24-hour)
  // For bare times like "5:00" without AM/PM, use hintMinutes from the
  // session timeSlot to resolve AM vs PM ambiguity.
  const parseTime = useCallback((str, hintMinutes) => {
    if (!str) return null;
    const match12 = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const mins = parseInt(match12[2], 10);
      const period = match12[3].toUpperCase();
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return hours * 60 + mins;
    }
    const match24 = str.match(/^(\d+):(\d+)$/);
    if (match24) {
      let hours = parseInt(match24[1], 10);
      const mins = parseInt(match24[2], 10);
      let result = hours * 60 + mins;
      // Bare times (e.g. "5:00") are ambiguous — if the session's timeSlot
      // starts in the afternoon/evening and our parsed time is morning,
      // it's almost certainly PM
      if (hintMinutes != null && hours < 12 && result < hintMinutes) {
        result += 12 * 60;
      }
      return result;
    }
    return null;
  }, []);

  // Get the start time in minutes for the session-level timeSlot (always has AM/PM)
  const getTimeSlotMinutes = useCallback((entry) => {
    return parseTime(entry.timeSlot.start) ?? 0;
  }, [parseTime]);

  // Get the start time in minutes for a talk entry
  const getTalkStartMinutes = useCallback((entry) => {
    const tsMinutes = getTimeSlotMinutes(entry);
    if (entry.talk.time) {
      const parts = entry.talk.time.split("-");
      const start = parseTime(parts[0].trim(), tsMinutes);
      if (start !== null) return start;
    }
    return tsMinutes;
  }, [parseTime, getTimeSlotMinutes]);

  // Build sorted schedule grouped by day and time
  const schedule = useMemo(() => {
    const entries = [];
    for (const talkId of savedTalks) {
      const info = getTalkInfo(talkId);
      if (info) entries.push(info);
    }

    // Sort by day then by actual talk start time
    entries.sort((a, b) => {
      const dayCompare = a.day.date.localeCompare(b.day.date);
      if (dayCompare !== 0) return dayCompare;
      return getTalkStartMinutes(a) - getTalkStartMinutes(b);
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
  }, [savedTalks, getTalkStartMinutes]);

  // Detect conflicts (overlapping talks)
  const conflicts = useMemo(() => {
    const set = new Set();

    // Get start/end in minutes for a talk, using individual talk.time if available
    const getTalkRange = (entry) => {
      const tsMinutes = getTimeSlotMinutes(entry);
      if (entry.talk.time) {
        // Individual talk time, e.g. "11:00-11:25"
        const parts = entry.talk.time.split("-");
        if (parts.length === 2) {
          const start = parseTime(parts[0].trim(), tsMinutes);
          const end = parseTime(parts[1].trim(), tsMinutes);
          if (start !== null && end !== null) return { start, end };
        }
        // Single time without end — assume 25 min
        const start = parseTime(entry.talk.time.trim(), tsMinutes);
        return start !== null ? { start, end: start + 25 } : null;
      }
      // Fall back to session-level time slot
      const start = parseTime(entry.timeSlot.start);
      const end = parseTime(entry.timeSlot.end);
      return start !== null && end !== null ? { start, end } : null;
    };

    for (const group of schedule) {
      const talks = group.talks;
      for (let i = 0; i < talks.length; i++) {
        for (let j = i + 1; j < talks.length; j++) {
          const a = talks[i];
          const b = talks[j];
          const rangeA = getTalkRange(a);
          const rangeB = getTalkRange(b);

          if (!rangeA || !rangeB) continue;

          // Two ranges overlap if one starts before the other ends
          if (rangeA.start < rangeB.end && rangeB.start < rangeA.end) {
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
