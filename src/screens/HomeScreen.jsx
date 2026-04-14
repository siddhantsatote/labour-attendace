import React from "react";

export default function HomeScreen({ onCheckIn, onCheckOut, onDashboard }) {
  return (
    <section className="hero">
      <div className="panel panel-pad">
        <p className="kicker">Daily attendance</p>
        <h1>Track labour attendance in 3 quick taps.</h1>
        <p className="lead">
          Select check-in or check-out, scan the worker face, and the app stores time automatically. If a worker is new, register instantly from captured photo.
        </p>

        <div className="actions">
          <button className="btn success" onClick={onCheckIn}>Check In</button>
          <button className="btn primary" onClick={onCheckOut}>Check Out</button>
          <button className="btn ghost" onClick={onDashboard}>View Dashboard</button>
        </div>

        <div className="card-grid">
          <div className="stat-card">
            <div className="stat-label">Step 1</div>
            <div className="stat-value">Choose mode</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Step 2</div>
            <div className="stat-value">Scan face</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Step 3</div>
            <div className="stat-value">Save record</div>
          </div>
        </div>
      </div>

      <div className="panel panel-pad workspace">
        <div className="status">
          <strong>Quick Tip</strong>
          <p className="small">Keep one face in frame and hold device steady while scanning.</p>
        </div>
        <div className="status">
          <strong>For Site Use</strong>
          <p className="small">Use dashboard to review today's check-ins, check-outs, and working hours.</p>
        </div>
      </div>
    </section>
  );
}
