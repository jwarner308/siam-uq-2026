import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSessionInfo } from "../utils/data.js";
import { useSchedule } from "../hooks/useSchedule.jsx";
import TalkDetail from "./TalkDetail.jsx";

export default function SessionDetail({ program }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toggle, isSaved } = useSchedule();
  const [expandedTalk, setExpandedTalk] = useState(null);

  const info = getSessionInfo(code);
  if (!info) {
    return (
      <div className="page-content">
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back
        </button>
        <div className="empty-state">Session not found.</div>
      </div>
    );
  }

  const { session, day, timeSlot } = info;

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtnWhite}>
          ← Back
        </button>
        <span className={`badge badge-${session.type}`}>{session.type}</span>
        <span style={styles.sessionId}>{session.id}</span>
        {session.cancelled && (
          <span style={styles.cancelledBadge}>CANCELLED</span>
        )}
      </div>

      <div className="page-content">
        <h2 style={styles.title}>{session.title}</h2>

        <div style={styles.metaBlock}>
          <div style={styles.metaRow}>
            <span style={styles.metaIcon}>📅</span>
            <span>{day.label}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaIcon}>🕐</span>
            <span>{timeSlot.start} – {timeSlot.end}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaIcon}>📍</span>
            <span>{session.location}</span>
          </div>
          {session.organizers?.length > 0 && (
            <div style={styles.metaRow}>
              <span style={styles.metaIcon}>👤</span>
              <span>Organized by: {session.organizers.join(", ")}</span>
            </div>
          )}
          {session.chair && (
            <div style={styles.metaRow}>
              <span style={styles.metaIcon}>🎤</span>
              <span>Chair: {session.chair}</span>
            </div>
          )}
        </div>

        {/* Talks */}
        {session.talks.length === 0 ? (
          <div style={styles.noTalks}>No individual talks listed for this session.</div>
        ) : (
          <div style={styles.talksList}>
            <h3 style={styles.talksHeader}>
              Talks ({session.talks.length})
            </h3>
            {session.talks.map((talk) => {
              const saved = isSaved(talk.id);
              const isExpanded = expandedTalk === talk.id;

              return (
                <div key={talk.id} style={styles.talkCard}>
                  <div style={styles.talkTop}>
                    <button
                      className={`star-btn ${saved ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(talk.id);
                      }}
                      title={saved ? "Remove from schedule" : "Add to schedule"}
                    >
                      {saved ? "★" : "☆"}
                    </button>
                    <div
                      style={styles.talkInfo}
                      onClick={() =>
                        setExpandedTalk(isExpanded ? null : talk.id)
                      }
                    >
                      {talk.time && (
                        <span style={styles.talkTime}>{talk.time}</span>
                      )}
                      <div style={styles.talkTitle}>{talk.title}</div>
                      <div style={styles.talkSpeakers}>
                        {talk.speakers?.map((s, i) => (
                          <div key={i} style={styles.speaker}>
                            <strong>{s.name}</strong>
                            {s.affiliation && (
                              <span style={styles.affiliation}>
                                , {s.affiliation}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {isExpanded && <TalkDetail talk={talk} session={session} day={day} timeSlot={timeSlot} />}
                </div>
              );
            })}
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
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  backBtnWhite: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    marginRight: 4,
  },
  backBtn: {
    color: "var(--primary)",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
  },
  sessionId: {
    fontSize: 14,
    fontWeight: 700,
  },
  cancelledBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: "#ff6b6b",
    marginLeft: "auto",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: 16,
    marginTop: 8,
  },
  metaBlock: {
    background: "var(--primary-lighter)",
    borderRadius: "var(--radius)",
    padding: "12px 14px",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  metaRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: 13,
  },
  metaIcon: {
    flexShrink: 0,
    width: 20,
  },
  noTalks: {
    textAlign: "center",
    color: "var(--text-light)",
    padding: 20,
  },
  talksList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  talksHeader: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 4,
    color: "var(--text-secondary)",
  },
  talkCard: {
    background: "var(--card-bg)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    boxShadow: "var(--shadow)",
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
  talkTime: {
    fontSize: 11,
    color: "var(--text-light)",
    fontWeight: 600,
    display: "inline-block",
    marginBottom: 2,
  },
  talkTitle: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: 4,
  },
  talkSpeakers: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  speaker: {
    marginBottom: 1,
  },
  affiliation: {
    color: "var(--text-light)",
    fontSize: 11,
  },
};
