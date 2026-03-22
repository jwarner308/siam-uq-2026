import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { searchProgram } from "../utils/data.js";
import { useSchedule } from "../hooks/useSchedule.jsx";

export default function SearchPage({ program }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { toggle, isSaved } = useSchedule();

  const results = useMemo(() => searchProgram(query), [query]);

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.headerTitle}>Search</div>
      </div>
      <div className="page-content">
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Search talks, speakers, abstracts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.input}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} style={styles.clearBtn}>
              ✕
            </button>
          )}
        </div>

        {query.length >= 2 && (
          <div style={styles.resultCount}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
        )}

        {query.length < 2 && (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p>Search by talk title, speaker name, keyword, or topic.</p>
          </div>
        )}

        <div style={styles.results}>
          {results.slice(0, 50).map(({ talk, session, day, timeSlot }) => {
            const saved = isSaved(talk.id);
            return (
              <div key={talk.id} style={styles.resultCard}>
                <div style={styles.resultTop}>
                  <button
                    className={`star-btn ${saved ? "active" : ""}`}
                    onClick={() => toggle(talk.id)}
                  >
                    {saved ? "★" : "☆"}
                  </button>
                  <div style={styles.resultInfo}>
                    <div style={styles.resultMeta}>
                      <span style={styles.resultTime}>
                        {day.label.split(",")[0]} · {talk.time || timeSlot.start}
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
                    <div
                      style={styles.resultTitle}
                      onClick={() => navigate(`/session/${session.code}`)}
                    >
                      {talk.title}
                    </div>
                    <div style={styles.resultSpeaker}>
                      {talk.speakers?.map((s) => s.name).join(", ")}
                    </div>
                    <div style={styles.resultLocation}>{session.location}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {results.length > 50 && (
            <div style={{ textAlign: "center", color: "var(--text-light)", padding: 12, fontSize: 13 }}>
              Showing first 50 of {results.length} results. Refine your search.
            </div>
          )}
        </div>
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
  searchBox: {
    position: "relative",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: "12px 40px 12px 14px",
    fontSize: 15,
    border: "2px solid var(--border)",
    borderRadius: "var(--radius)",
    outline: "none",
    background: "var(--card-bg)",
    fontFamily: "inherit",
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 16,
    color: "var(--text-light)",
    padding: 4,
  },
  resultCount: {
    fontSize: 12,
    color: "var(--text-light)",
    marginBottom: 8,
  },
  results: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  resultCard: {
    background: "var(--card-bg)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    boxShadow: "var(--shadow)",
    borderLeft: "3px solid var(--primary)",
  },
  resultTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultMeta: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  resultTime: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--primary)",
  },
  sessionLink: {
    fontSize: 11,
    color: "var(--primary-light)",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: 3,
    cursor: "pointer",
  },
  resultSpeaker: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginBottom: 2,
  },
  resultLocation: {
    fontSize: 11,
    color: "var(--text-light)",
  },
};
