import React, { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "uq26-schedule";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persist(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

const ScheduleContext = createContext(null);

export function ScheduleProvider({ children }) {
  const [savedTalks, setSavedTalks] = useState(loadSaved);

  const toggle = useCallback((talkId) => {
    setSavedTalks((prev) => {
      const next = new Set(prev);
      if (next.has(talkId)) {
        next.delete(talkId);
      } else {
        next.add(talkId);
      }
      persist(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (talkId) => savedTalks.has(talkId),
    [savedTalks]
  );

  const count = savedTalks.size;

  return (
    <ScheduleContext.Provider value={{ savedTalks, toggle, isSaved, count }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be inside ScheduleProvider");
  return ctx;
}
