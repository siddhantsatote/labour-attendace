import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { registerWorkerAndCheckIn } from "../lib/attendanceService";
import FaceBoxOverlay from "../components/FaceBoxOverlay";
import { detectFaceAndDescriptorFromBase64 } from "../lib/faceRecognition";

export default function RegisterScreen({ workerDraft, onBack, onSaved }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => workerDraft || null, [workerDraft]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!preview?.photoSrc) {
      setError("Missing captured photo. Scan again.");
      return;
    }

    if (!name.trim() || !phone.trim()) {
      setError("Enter both name and phone number.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      let descriptorToSave = preview.descriptor;
      if (!descriptorToSave) {
        const fallbackDetection = await detectFaceAndDescriptorFromBase64(preview.photoSrc);
        descriptorToSave = fallbackDetection?.descriptor || null;
      }

      if (!descriptorToSave) {
        throw new Error("Could not extract face descriptor from the photo. Please scan again with a clear face.");
      }

      await registerWorkerAndCheckIn({
        name: name.trim(),
        phone: phone.trim(),
        descriptor: descriptorToSave,
        photoDataUrl: preview.photoSrc
      });
      onSaved?.();
    } catch (currentError) {
      setError(currentError.message || "Unable to register worker.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mobile-screen register-screen">
      <div className="register-topbar">
        <button className="icon-button outline" type="button" onClick={onBack} aria-label="Go back">
          <ArrowLeft className="icon-svg" size={18} strokeWidth={2.2} />
        </button>
        <div>
          <p className="eyebrow">New labour</p>
          <h2 className="screen-title">Register worker</h2>
        </div>
      </div>

      <div className="surface-card register-card">
        <p className="screen-subtitle">After saving, this labour will be checked in automatically.</p>

        {!preview?.descriptor ? (
          <div className="alert-card warning-card">
            Face descriptor unavailable from scan. The app will re-extract descriptor from this photo before saving.
          </div>
        ) : null}

        {error ? <div className="alert-card">{error}</div> : null}

        <div className="register-preview">
          {preview?.photoSrc ? <img src={preview.photoSrc} alt="Detected face preview" /> : null}
          {preview?.box && preview?.sourceSize && preview?.displaySize ? (
            <FaceBoxOverlay box={preview.box} sourceSize={preview.sourceSize} displaySize={preview.displaySize} color="#3D3BF3" />
          ) : null}
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Worker Name</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter full name" />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter mobile number" />
          </div>

          <div className="register-actions">
            <button className="btn primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save and Check In"}</button>
            <button className="btn ghost" type="button" onClick={onBack}>Cancel</button>
          </div>
        </form>
      </div>
    </section>
  );
}
