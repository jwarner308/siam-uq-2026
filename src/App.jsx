import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import DayView from "./components/DayView.jsx";
import SessionDetail from "./components/SessionDetail.jsx";
import MySchedule from "./components/MySchedule.jsx";
import SearchPage from "./components/SearchPage.jsx";
import { loadProgram } from "./utils/data.js";
import { ScheduleProvider } from "./hooks/useSchedule.jsx";

export default function App() {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgram().then((data) => {
      setProgram(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>Loading...</div>
          <div style={{ color: "#888" }}>SIAM UQ 2026 Conference</div>
        </div>
      </div>
    );
  }

  return (
    <ScheduleProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<DayView program={program} />} />
          <Route path="/day/:date" element={<DayView program={program} />} />
          <Route path="/session/:code" element={<SessionDetail program={program} />} />
          <Route path="/schedule" element={<MySchedule program={program} />} />
          <Route path="/search" element={<SearchPage program={program} />} />
        </Routes>
        <NavBar />
      </HashRouter>
    </ScheduleProvider>
  );
}
