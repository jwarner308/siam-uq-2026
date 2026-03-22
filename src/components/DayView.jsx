import React, { useRef, useState, useEffect, useCallback } from "react";
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
  const [activeDate, setActiveDate] = useState(date || "2026-03-22");
  const sectionRefs = useRef({});
  const tabBarRef = useRef(null);
  const isScrollingTo = useRef(false);
  const restoringScroll = useRef(false);

  // Disable browser's automatic scroll restoration
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // On mount or when navigating with a date param, scroll to that day
  // (but restore saved scroll position if returning from a detail page)
  useEffect(() => {
    const savedY = sessionStorage.getItem("programScrollY");
    if (savedY !== null) {
      sessionStorage.removeItem("programScrollY");
      restoringScroll.current = true;
      isScrollingTo.current = true;
      const targetY = Number(savedY);
      // Use requestAnimationFrame + retry to ensure DOM is ready
      const tryRestore = () => {
        // Page must be tall enough to scroll to the saved position
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll >= targetY) {
          window.scrollTo(0, targetY);
          setTimeout(() => {
            isScrollingTo.current = false;
            restoringScroll.current = false;
          }, 200);
        } else {
          // DOM not fully laid out yet, retry next frame
          requestAnimationFrame(tryRestore);
        }
      };
      requestAnimationFrame(tryRestore);
      return;
    }

    const target = date || "2026-03-22";
    setActiveDate(target);
    const el = sectionRefs.current[target];
    if (el) {
      // Small delay to let layout settle
      setTimeout(() => {
        const tabBarHeight = tabBarRef.current
          ? tabBarRef.current.getBoundingClientRect().bottom
          : 70;
        const y = el.getBoundingClientRect().top + window.scrollY - tabBarHeight;
        window.scrollTo({ top: y, behavior: "smooth" });
      }, 50);
    }
  }, [date]);

  // Scroll-based tracking of which day section is visible
  useEffect(() => {
    const detectActiveDay = () => {
      if (isScrollingTo.current) return;

      const tabBarBottom = tabBarRef.current
        ? tabBarRef.current.getBoundingClientRect().bottom
        : 70;

      // Find the last section whose top has scrolled past (or near) the tab bar
      let best = null;
      for (const tab of DAY_TABS) {
        const el = sectionRefs.current[tab.date];
        if (!el) continue;
        const dist = el.getBoundingClientRect().top - tabBarBottom;
        if (dist <= 40) {
          best = tab.date;
        }
      }

      // If nothing has scrolled past yet, use the first available day
      if (!best) {
        for (const tab of DAY_TABS) {
          if (sectionRefs.current[tab.date]) {
            best = tab.date;
            break;
          }
        }
      }

      if (best) {
        setActiveDate((prev) => {
          if (prev !== best) {
            window.history.replaceState(null, "", `#/day/${best}`);
          }
          return best;
        });
      }
    };

    // Run once on mount to set the correct initial active date
    detectActiveDay();

    window.addEventListener("scroll", detectActiveDay, { passive: true });
    return () => window.removeEventListener("scroll", detectActiveDay);
  }, []);

  const scrollToDay = useCallback(
    (targetDate) => {
      setActiveDate(targetDate);
      navigate(`/day/${targetDate}`, { replace: true });

      const el = sectionRefs.current[targetDate];
      if (el) {
        isScrollingTo.current = true;
        const tabBarHeight = tabBarRef.current
          ? tabBarRef.current.getBoundingClientRect().bottom -
            tabBarRef.current.getBoundingClientRect().top
          : 70;

        const y =
          el.getBoundingClientRect().top + window.scrollY - tabBarHeight;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });

        // Re-enable scroll-based updates after the scroll animation settles
        setTimeout(() => {
          isScrollingTo.current = false;
        }, 800);
      }
    },
    [navigate]
  );

  return (
    <div>
      {/* Sticky header + tabs */}
      <div ref={tabBarRef} style={styles.stickyTop}>
        <div style={styles.header}>
          <div style={styles.title}>SIAM UQ 2026</div>
        </div>
        <div style={styles.tabBar}>
          {DAY_TABS.map((tab) => (
            <button
              key={tab.date}
              onClick={() => scrollToDay(tab.date)}
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
      </div>

      {/* All days rendered in one scrollable list */}
      <div className="page-content">
        {program.days.map((day) => (
          <div
            key={day.date}
            ref={(el) => (sectionRefs.current[day.date] = el)}
          >
            {/* Day divider */}
            <div style={styles.dayDivider}>
              <div style={styles.dayDividerLine} />
              <div style={styles.dayDividerLabel}>
                {DAY_TABS.find((t) => t.date === day.date)?.short || ""}{" "}
                {DAY_TABS.find((t) => t.date === day.date)?.label || day.date}
              </div>
              <div style={styles.dayDividerLine} />
            </div>

            {day.timeSlots.map((ts, i) => (
              <TimeSlot key={i} timeSlot={ts} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  stickyTop: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "var(--primary)",
  },
  header: {
    color: "#fff",
    padding: "14px 16px 4px",
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  tabBar: {
    display: "flex",
    padding: "0 4px 8px",
    gap: 4,
    overflowX: "auto",
    justifyContent: "center",
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
  dayDivider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 0 12px",
  },
  dayDividerLine: {
    flex: 1,
    height: 1,
    background: "var(--border)",
  },
  dayDividerLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--primary)",
    textTransform: "uppercase",
    letterSpacing: 1,
    whiteSpace: "nowrap",
  },
};
