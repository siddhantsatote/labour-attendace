import React, { useEffect, useMemo, useState } from "react";
import { getAllWorkers, getTodayAttendanceWithWorkers } from "../lib/attendanceService";

export default function HomeScreen({ onCheckIn, onCheckOut, onDashboard }) {
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHomeDashboard() {
      try {
        setLoading(true);
        setError("");
        const [workerRows, attendanceRows] = await Promise.all([
          getAllWorkers(),
          getTodayAttendanceWithWorkers()
        ]);

        if (!active) {
          return;
        }

        setWorkers(workerRows);
        setAttendance(attendanceRows);
      } catch (currentError) {
        if (active) {
          setError(currentError.message || "Unable to load dashboard data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHomeDashboard();
    return () => {
      active = false;
    };
  }, []);

  const todayCheckedIn = useMemo(() => {
    return attendance.filter((entry) => entry.check_in_time).length;
  }, [attendance]);

  return (
    <section className="hero">
      <div className="panel panel-pad home-hero-card">
        <p className="kicker">Daily attendance</p>
        <h1>Track labour attendance in a clean mobile flow.</h1>
        <p className="lead">
          Tap a mode, scan the face, and the system saves time automatically. New labour can be registered from the captured photo.
        </p>

        <div className="home-quick-actions">
          <button className="btn success" onClick={onCheckIn}>Check In</button>
          <button className="btn primary" onClick={onCheckOut}>Check Out</button>
          <button className="btn ghost" onClick={onDashboard}>Dashboard</button>
        </div>

        <div className="home-summary-grid">
          <div className="stat-card">
            <div className="stat-label">Registered Labours</div>
            <div className="stat-value">{loading ? "--" : workers.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Checked In Today</div>
            <div className="stat-value">{loading ? "--" : todayCheckedIn}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Attendance Records</div>
            <div className="stat-value">{loading ? "--" : attendance.length}</div>
          </div>
        </div>
      </div>

      <div className="panel panel-pad workspace">
        <div className="status status-soft">
          <strong>How it works</strong>
          <p className="small">Select a mode, scan the face, then save attendance in seconds.</p>
        </div>
        <div className="status status-soft">
          <strong>Built for phone</strong>
          <p className="small">Large buttons, soft cards, and short steps for quick site use.</p>
        </div>

        {error ? (
          <div className="status error-box">
            <strong>Dashboard error</strong>
            <p className="small">{error}</p>
          </div>
        ) : null}

        <div className="home-list-grid">
          <div className="list-item list-item-compact">
            <h3>Latest Labours</h3>
            {loading ? <p className="small">Loading...</p> : null}
            {!loading && !workers.length ? <p className="small">No labours registered yet.</p> : null}
            {!loading ? workers.slice(0, 3).map((worker) => (
              <div key={worker.id} className="home-list-row">
                <span>{worker.name}</span>
                <span>{worker.phone}</span>
              </div>
            )) : null}
          </div>

          <div className="list-item list-item-compact">
            <h3>Today's Attendance</h3>
            {loading ? <p className="small">Loading...</p> : null}
            {!loading && !attendance.length ? <p className="small">No attendance records today.</p> : null}
            {!loading ? attendance.slice(0, 3).map((record) => (
              <div key={record.id} className="home-list-row">
                <span>{record.workers?.name || "Unknown"}</span>
                <span>{record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : "-"}</span>
              </div>
            )) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
