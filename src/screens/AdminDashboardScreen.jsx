import React, { useEffect, useState } from "react";
import { getAllWorkers, getTodayAttendanceWithWorkers } from "../lib/attendanceService";

export default function AdminDashboardScreen({ refreshKey, onBack }) {
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [allWorkers, todayAttendance] = await Promise.all([getAllWorkers(), getTodayAttendanceWithWorkers()]);
        if (!active) {
          return;
        }
        setWorkers(allWorkers);
        setAttendance(todayAttendance);
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

  return (
    <section className="hero">
      <div className="panel panel-pad workspace">
        <p className="kicker">Dashboard</p>
        <h2 className="section-title">Registered Labours</h2>
        <div className="list">
          {loading ? <div className="status">Loading workers...</div> : null}
          {error ? <div className="status" style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}>{error}</div> : null}
          {!loading && !workers.length ? <div className="status">No workers registered yet.</div> : null}
          {workers.map((worker) => (
            <div key={worker.id} className="list-item">
              <h3>{worker.name}</h3>
              <p>{worker.phone}</p>
            </div>
          ))}
        </div>

        <div className="actions">
          <button className="btn ghost" onClick={onBack}>Home</button>
        </div>
      </div>

      <div className="panel panel-pad workspace">
        <h2 className="section-title">Today's Attendance</h2>
        <div className="list">
          {loading ? <div className="status">Loading attendance...</div> : null}
          {!loading && !attendance.length ? <div className="status">No attendance records for today.</div> : null}
          {attendance.map((record) => {
            const workerName = record.workers?.name || "Unknown";
            return (
              <div key={record.id} className="list-item">
                <h3>{workerName}</h3>
                <p>Check-in: {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : "-"}</p>
                <p>Check-out: {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : "-"}</p>
                <p>Hours worked: {record.hours_worked ?? "-"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
