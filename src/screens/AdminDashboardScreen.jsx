import React, { useEffect, useMemo, useState } from "react";
import MobileBottomNav from "../components/MobileBottomNav";
import { getAttendanceHistoryWithWorkers } from "../lib/attendanceService";

function formatTime(value) {
  if (!value) {
    return "--:--";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getRangeStart(tab) {
  const now = new Date();

  if (tab === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (tab === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return null;
}

export default function AdminDashboardScreen({ refreshKey, onBack, onOpenCamera, onOpenHome }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("today");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const allAttendance = await getAttendanceHistoryWithWorkers();
        if (!active) {
          return;
        }
        setAttendance(allAttendance);
      } catch (currentError) {
        if (active) {
          setError(currentError.message || "Unable to load dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const filteredAttendance = useMemo(() => {
    const rangeStart = getRangeStart(activeTab);

    if (!rangeStart) {
      return attendance;
    }

    return attendance.filter((record) => {
      const checkIn = record.check_in_time || (record.date ? `${record.date}T00:00:00` : null);

      if (!checkIn) {
        return false;
      }

      return new Date(checkIn) >= rangeStart;
    });
  }, [activeTab, attendance]);

  return (
    <section className="mobile-screen history-screen">
      <div className="history-topbar">
        <button className="icon-button outline" type="button" onClick={onBack} aria-label="Go back">
          ←
        </button>
        <h2 className="history-title">Attendance History</h2>
        <button className="icon-button outline" type="button" aria-label="Open menu">
          ⋯
        </button>
      </div>

      <div className="history-tabs" role="tablist" aria-label="Attendance filters">
        <button className={`history-tab ${activeTab === "today" ? "active" : ""}`} type="button" onClick={() => setActiveTab("today")}>Today</button>
        <button className={`history-tab ${activeTab === "week" ? "active" : ""}`} type="button" onClick={() => setActiveTab("week")}>This Week</button>
        <button className={`history-tab ${activeTab === "all" ? "active" : ""}`} type="button" onClick={() => setActiveTab("all")}>All</button>
      </div>

      {error ? <div className="alert-card">{error}</div> : null}

      <div className="history-list">
        {loading ? <div className="muted-empty">Loading attendance history...</div> : null}
        {!loading && !filteredAttendance.length ? <div className="muted-empty">No records found for this period.</div> : null}
        {filteredAttendance.map((record) => {
          const workerName = record.workers?.name || "Unknown labour";

          return (
            <article key={record.id} className="history-row">
              <div className="history-icon">◧</div>
              <div className="history-copy">
                <strong>{workerName}</strong>
                <span>{formatTime(record.check_in_time)} · {record.date || ""}</span>
              </div>
              <button className="history-trash" type="button" aria-label={`Delete ${workerName}`}>
                🗑
              </button>
            </article>
          );
        })}
      </div>

      <MobileBottomNav onCamera={onOpenCamera} onScan={onOpenCamera} onPerson={onOpenHome} />
    </section>
  );
}
