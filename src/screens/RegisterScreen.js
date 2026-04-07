import React, { useMemo, useState } from "react";
import { registerWorkerAndCheckIn } from "../lib/attendanceService";
import FaceBoxOverlay from "../components/FaceBoxOverlay";

export default function RegisterScreen({ workerDraft, onBack, onSaved }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => workerDraft || null, [workerDraft]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!preview?.descriptor) {
      setError("Missing face descriptor. Scan again.");
      return;
    }

    if (!name.trim() || !phone.trim()) {
      setError("Enter both name and phone number.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await registerWorkerAndCheckIn({
        name: name.trim(),
        phone: phone.trim(),
        descriptor: preview.descriptor
      });
      onSaved?.();
    } catch (currentError) {
      setError(currentError.message || "Unable to register worker.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="hero">
      <div className="panel panel-pad workspace">
        <p className="kicker">New worker</p>
        <h2 className="section-title">Register the new face</h2>
        <p className="small">Saving this worker also creates a check-in record automatically.</p>

        {error ? <div className="status" style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}>{error}</div> : null}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Worker name" />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" />
          </div>

          <div className="actions">
            <button className="btn primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save and Check In"}</button>
            <button className="btn ghost" type="button" onClick={onBack}>Back</button>
          </div>
        </form>
      </div>

      <div className="panel panel-pad workspace">
        <p className="kicker">Preview</p>
        <div className="preview-photo">
          {preview?.photoSrc ? <img src={preview.photoSrc} alt="Detected face preview" /> : null}
          {preview?.box && preview?.sourceSize && preview?.displaySize ? (
            <FaceBoxOverlay box={preview.box} sourceSize={preview.sourceSize} displaySize={preview.displaySize} color="#ef4444" />
          ) : null}
        </div>
      </div>
    </section>
  );
}
