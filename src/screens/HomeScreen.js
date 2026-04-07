import React from "react";

export default function HomeScreen({ onCheckIn, onCheckOut, onDashboard }) {
  return (
    <section className="hero">
      <div className="panel panel-pad">
        <p className="kicker">Attendance system</p>
        <h1>ReactJS labour attendance with face recognition.</h1>
        <p className="lead">
          Open the camera, scan a worker, and store attendance in Supabase. Unknown faces can be registered in place and checked in automatically.
        </p>

        <div className="actions">
          <button className="btn success" onClick={onCheckIn}>Check In</button>
          <button className="btn primary" onClick={onCheckOut}>Check Out</button>
          <button className="btn ghost" onClick={onDashboard}>Admin Dashboard</button>
        </div>

        <div className="card-grid">
          <div className="stat-card">
            <div className="stat-label">Mode</div>
            <div className="stat-value">Web</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Face matching</div>
            <div className="stat-value">Client-side</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Backend</div>
            <div className="stat-value">Supabase</div>
          </div>
        </div>
      </div>

      <div className="panel panel-pad workspace">
        <div className="status">
          <strong>Phone test ready</strong>
          <p className="small">Open the deployed Vercel URL in your phone browser and allow camera access.</p>
        </div>
        <div className="status">
          <strong>Models</strong>
          <p className="small">Place face-api.js model files in public/models.</p>
        </div>
      </div>
    </section>
  );
}
