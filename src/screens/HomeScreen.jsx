import React, { useEffect, useMemo, useState } from "react";
import { Camera, LogOut, Menu, MoreHorizontal } from "lucide-react";
import MobileBottomNav from "../components/MobileBottomNav";
import { getAllWorkers, getTodayAttendanceWithWorkers } from "../lib/attendanceService";

function formatTime(value) {
  if (!value) {
    return "--:--";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getInitials(name) {
  return String(name || "Labour")
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function HomeScreen({ onOpenCheckIn, onOpenCheckOut, onOpenHistory }) {
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

  const recentCheckIns = useMemo(() => attendance.slice(0, 3), [attendance]);

  return (
    <section className="mobile-screen home-screen">
      <div className="home-topbar">
        <button className="icon-button outline" type="button" aria-label="Open menu">
          <Menu className="icon-svg" size={18} strokeWidth={2.2} />
        </button>

        <div className="home-topbar-copy">
          <p className="eyebrow">Labour Attendance</p>
          <h1 className="screen-title">Home Dashboard</h1>
          <p className="screen-subtitle">Fast scan flow for workers and supervisors</p>
        </div>

        <div className="home-topbar-actions">
          <button className="icon-button outline" type="button" onClick={onOpenCheckIn} aria-label="Open check in camera">
            <Camera className="icon-svg" size={18} strokeWidth={2.2} />
          </button>
          <button className="icon-button outline" type="button" onClick={onOpenCheckOut} aria-label="Open check out camera">
            <LogOut className="icon-svg" size={18} strokeWidth={2.2} />
          </button>
          <button className="icon-button outline" type="button" onClick={onOpenHistory} aria-label="Open attendance history">
            <MoreHorizontal className="icon-svg" size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="home-mode-actions">
        <button className="mode-action mode-action-check-in" type="button" onClick={onOpenCheckIn}>
          Check In
        </button>
        <button className="mode-action mode-action-check-out" type="button" onClick={onOpenCheckOut}>
          Check Out
        </button>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span className="stat-label">Registered Workers</span>
          <strong className="stat-value">{loading ? "--" : workers.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Checked In Today</span>
          <strong className="stat-value">{loading ? "--" : todayCheckedIn}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Total Records</span>
          <strong className="stat-value">{loading ? "--" : attendance.length}</strong>
        </article>
      </div>

      <section className="surface-card section-card">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Live activity</p>
            <h2 className="section-title">Recent Check-ins</h2>
          </div>
          <button className="text-button" type="button" onClick={onOpenHistory}>
            View all
          </button>
        </div>

        {error ? <div className="alert-card">{error}</div> : null}

        <div className="recent-list">
          {loading ? <div className="muted-empty">Loading attendance...</div> : null}
          {!loading && !recentCheckIns.length ? <div className="muted-empty">No attendance records yet.</div> : null}
          {!loading
            ? recentCheckIns.map((record) => {
                const workerName = record.workers?.name || "Unknown labour";
                const isActive = !record.check_out_time;

                return (
                  <article key={record.id} className="recent-row">
                    <div className="avatar-circle">{getInitials(workerName)}</div>
                    <div className="recent-copy">
                      <strong>{workerName}</strong>
                      <span>{record.workers?.phone || "No phone saved"}</span>
                    </div>
                    <div className={`time-badge ${isActive ? "success" : "danger"}`}>
                      <span>{isActive ? "Checked In" : "Checked Out"}</span>
                      <strong>{formatTime(record.check_in_time || record.check_out_time)}</strong>
                    </div>
                  </article>
                );
              })
            : null}
        </div>
      </section>

      <MobileBottomNav onCamera={onOpenCheckIn} onScan={onOpenCheckIn} onPerson={onOpenHistory} />
    </section>
  );
}
