import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSchedule } from "../hooks/useSchedule.jsx";

const tabs = [
  { path: "/", icon: "📅", label: "Program" },
  { path: "/schedule", icon: "⭐", label: "My Schedule" },
  { path: "/search", icon: "🔍", label: "Search" },
];

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useSchedule();

  const currentPath = location.pathname;

  return (
    <nav style={styles.nav}>
      {tabs.map((tab) => {
        const isActive =
          tab.path === "/"
            ? currentPath === "/" || currentPath.startsWith("/day")
            : currentPath.startsWith(tab.path);

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              ...styles.tab,
              color: isActive ? "var(--primary)" : "var(--text-light)",
            }}
          >
            <span style={styles.icon}>
              {tab.icon}
              {tab.path === "/schedule" && count > 0 && (
                <span style={styles.badge}>{count}</span>
              )}
            </span>
            <span style={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "var(--nav-height)",
    background: "#fff",
    borderTop: "1px solid var(--border)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 100,
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  tab: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 600,
  },
  icon: {
    fontSize: 22,
    position: "relative",
  },
  label: {
    fontSize: 11,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    background: "var(--danger)",
    color: "#fff",
    borderRadius: 10,
    padding: "1px 5px",
    fontSize: 10,
    fontWeight: 700,
    minWidth: 16,
    textAlign: "center",
  },
};
