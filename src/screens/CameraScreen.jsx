import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Images, RefreshCcw } from "lucide-react";
import Webcam from "react-webcam";
import FaceBoxOverlay from "../components/FaceBoxOverlay";
import { checkInWorker, checkOutWorker, getAllWorkers, MATCH_THRESHOLD } from "../lib/attendanceService";
import { detectFaceAndDescriptorFromBase64, detectFaceAndDescriptorFromVideo, findBestMatch, initializeFaceModels } from "../lib/faceRecognition";

export default function CameraScreen({ mode, onBack, onRegister, onAttendanceSaved }) {
  const webcamRef = useRef(null);
  const liveTimerRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user");
  const [loadingModels, setLoadingModels] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Open the camera and scan a face.");
  const [liveBox, setLiveBox] = useState(null);
  const [liveSize, setLiveSize] = useState({ width: 0, height: 0 });
  const [captureResult, setCaptureResult] = useState(null);

  const title = mode === "check_in" ? "Check In" : "Check Out";
  const modeHint = mode === "check_in" ? "Mark worker arrival" : "Mark worker departure";

  useEffect(() => {
    let active = true;

    initializeFaceModels()
      .then(() => {
        if (active) {
          setLoadingModels(false);
        }
      })
      .catch(() => {
        if (active) {
          setStatus("Unable to load face models. Make sure public/models is available.");
          setLoadingModels(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loadingModels || captureResult) {
      return undefined;
    }

    liveTimerRef.current = window.setInterval(async () => {
      const webcam = webcamRef.current;
      const video = webcam?.video;

      if (!video || video.readyState !== 4) {
        return;
      }

      try {
        const boxResult = await detectFaceAndDescriptorFromVideo(video);
        if (boxResult?.box) {
          const rect = video.getBoundingClientRect();
          setLiveSize({ width: rect.width, height: rect.height });
          setLiveBox(boxResult.box);
          setStatus("Face detected. Capture when ready.");
        } else {
          setLiveBox(null);
          setStatus("Center a face in the frame.");
        }
      } catch (error) {
        setLiveBox(null);
      }
    }, 1300);

    return () => {
      if (liveTimerRef.current) {
        window.clearInterval(liveTimerRef.current);
      }
    };
  }, [loadingModels, captureResult, facingMode]);

  async function handleCapture() {
    const webcam = webcamRef.current;
    const video = webcam?.video;
    const photoSrc = webcam?.getScreenshot();

    if (!photoSrc || !video) {
      setStatus("Camera is not ready yet.");
      return;
    }

    try {
      setBusy(true);
      setStatus("Detecting face and matching worker...");

      const detected = await detectFaceAndDescriptorFromBase64(photoSrc);
      if (!detected) {
        setCaptureResult({
          photoSrc,
          box: null,
          sourceSize: { width: video.videoWidth, height: video.videoHeight },
          displaySize: { width: video.getBoundingClientRect().width, height: video.getBoundingClientRect().height },
          color: "#ef4444",
          matched: false,
          message: "Scan failed to detect a face. Continue with manual new labour registration.",
          descriptor: null,
          record: null
        });
        setStatus("Scan failed. Continue by saving as new labour.");
        return;
      }

      const workers = await getAllWorkers();
      const best = findBestMatch(detected.descriptor, workers, MATCH_THRESHOLD);
      const sourceSize = { width: video.videoWidth, height: video.videoHeight };
      const displaySize = { width: video.getBoundingClientRect().width, height: video.getBoundingClientRect().height };

      if (best) {
        const worker = best.worker;
        const action = mode === "check_in" ? await checkInWorker(worker.id) : await checkOutWorker(worker.id);
        const message =
          mode === "check_in"
            ? action.status === "already_checked_in"
              ? `${worker.name} is already checked in.`
              : `${worker.name} checked in successfully.`
            : action.status === "not_checked_in"
              ? `${worker.name} is not checked in today.`
              : `${worker.name} checked out. Hours worked: ${action.record.hours_worked}`;

        setCaptureResult({
          photoSrc,
          box: detected.box,
          sourceSize,
          displaySize,
          color: "#22c55e",
          matched: true,
          message,
          descriptor: detected.descriptor,
          worker,
          record: action.record || null
        });
        setStatus(message);
        onAttendanceSaved?.();
      } else {
        setCaptureResult({
          photoSrc,
          box: detected.box,
          sourceSize,
          displaySize,
          color: "#ef4444",
          matched: false,
          message: "New face detected. Register this worker.",
          descriptor: detected.descriptor,
          record: null
        });
        setStatus("New face detected. Register this worker.");
      }
    } catch (error) {
      const fallbackPhoto = webcamRef.current?.getScreenshot();
      if (fallbackPhoto && video) {
        setCaptureResult({
          photoSrc: fallbackPhoto,
          box: null,
          sourceSize: { width: video.videoWidth, height: video.videoHeight },
          displaySize: { width: video.getBoundingClientRect().width, height: video.getBoundingClientRect().height },
          color: "#ef4444",
          matched: false,
          message: "Scan failed. Save this labour manually with captured photo.",
          descriptor: null,
          record: null
        });
      }
      setStatus(error.message || "Unable to process this scan. Save as new labour.");
    } finally {
      setBusy(false);
    }
  }

  function handleRegister() {
    if (!captureResult?.photoSrc) {
      return;
    }

    onRegister?.({
      descriptor: captureResult.descriptor || null,
      photoSrc: captureResult.photoSrc,
      box: captureResult.box,
      sourceSize: captureResult.sourceSize,
      displaySize: captureResult.displaySize
    });
  }

  function toggleCamera() {
    setFacingMode((value) => (value === "user" ? "environment" : "user"));
    setCaptureResult(null);
    setLiveBox(null);
    setStatus("Camera switched. Align one face and scan.");
  }

  function handleResetScan() {
    setCaptureResult(null);
    setStatus("Center a face in the frame.");
  }

  const webcamStyle = useMemo(() => ({
    width: "100%",
    height: "100%"
  }), []);

  return (
    <section className="camera-page">
      <div className="camera-stage">
        {!captureResult?.photoSrc ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.9}
              videoConstraints={{ facingMode }}
              className="camera-feed"
              style={webcamStyle}
            />
            {liveBox ? (
              <FaceBoxOverlay box={liveBox} sourceSize={{ width: 640, height: 480 }} displaySize={liveSize} color="#ffffff" />
            ) : null}
          </>
        ) : (
          <>
            <img className="camera-feed" src={captureResult.photoSrc} alt="Captured face" />
            {captureResult.box ? (
              <FaceBoxOverlay box={captureResult.box} sourceSize={captureResult.sourceSize} displaySize={captureResult.displaySize} color={captureResult.color} />
            ) : null}
          </>
        )}

        <div className="camera-overlay-gradient" aria-hidden="true" />

        <div className="camera-topbar">
          <button className="icon-button dark" type="button" onClick={onBack} aria-label="Back">
            <ArrowLeft className="icon-svg" size={18} strokeWidth={2.2} />
          </button>

          <div className="camera-topbar-copy">
            <p className="section-kicker light">Face Recognition</p>
            <h2 className="camera-title">{title}</h2>
            <p className="camera-subtitle">{modeHint}</p>
          </div>

          <button className="icon-button dark" type="button" onClick={toggleCamera} disabled={busy} aria-label="Flip camera">
            <RefreshCcw className="icon-svg" size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="scan-progress-pill">{loadingModels ? "Loading models..." : "Scanning... 50%"}</div>

        <div className="scan-reticle" aria-hidden="true">
          <span className="scan-corner top-left" />
          <span className="scan-corner top-right" />
          <span className="scan-corner bottom-left" />
          <span className="scan-corner bottom-right" />
        </div>

        {!captureResult ? (
          <div className="camera-dock">
            <button className="camera-dock-button" type="button" onClick={toggleCamera} disabled={busy} aria-label="Flip camera">
              <RefreshCcw className="icon-svg" size={18} strokeWidth={2.2} />
            </button>

            <button className="camera-capture-button" type="button" onClick={handleCapture} disabled={busy || loadingModels} aria-label="Capture face">
              <span className="camera-capture-inner" />
            </button>

            <button className="camera-dock-button" type="button" disabled aria-label="Open gallery">
              <Images className="icon-svg" size={18} strokeWidth={2.2} />
            </button>
          </div>
        ) : (
          <div className="scan-sheet">
            <div className="scan-sheet-handle" />
            <div className="scan-result-avatar">
              {captureResult.photoSrc ? <img src={captureResult.photoSrc} alt="Captured worker" /> : null}
            </div>

            <div className="scan-result-copy">
              <p className="section-kicker">{captureResult.matched ? "Worker profile" : "New labour"}</p>
              <h3>{captureResult.worker?.name || "Unknown Worker"}</h3>
              <p className="scan-result-subtitle">{captureResult.message}</p>
            </div>

            <div className="scan-detail-grid">
              <div className="scan-detail-card">
                <span>Worker Name</span>
                <strong>{captureResult.worker?.name || "Unknown"}</strong>
              </div>
              <div className="scan-detail-card">
                <span>Worker ID</span>
                <strong>{captureResult.worker?.id || "Pending"}</strong>
              </div>
              <div className="scan-detail-card">
                <span>Check-in Time</span>
                <strong>{captureResult.record?.check_in_time ? new Date(captureResult.record.check_in_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--"}</strong>
              </div>
              {mode === "check_out" ? (
                <div className="scan-detail-card">
                  <span>Check-out Time</span>
                  <strong>{captureResult.record?.check_out_time ? new Date(captureResult.record.check_out_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--"}</strong>
                </div>
              ) : null}
              {mode === "check_out" ? (
                <div className="scan-detail-card">
                  <span>Hours Worked</span>
                  <strong>{captureResult.record?.hours_worked != null ? `${captureResult.record.hours_worked.toFixed(2)} hrs` : "--"}</strong>
                </div>
              ) : null}
              <div className="scan-detail-card">
                <span>Date</span>
                <strong>{captureResult.record?.date || new Date().toLocaleDateString()}</strong>
              </div>
              <div className="scan-detail-card full-width">
                <span>Status</span>
                <strong className={captureResult.matched ? "status-positive" : "status-warning"}>{captureResult.matched ? (mode === "check_out" ? "Checked Out" : "Active") : "Needs Registration"}</strong>
              </div>
            </div>

            <div className="scan-sheet-actions">
              {captureResult.matched ? (
                <button className="btn primary" type="button" onClick={onBack}>
                  {mode === "check_in" ? "Confirm Check-In" : "Confirm Check-Out"}
                </button>
              ) : (
                <button className="btn primary" type="button" onClick={handleRegister}>
                  Register Labour
                </button>
              )}
              <button className="btn ghost" type="button" onClick={handleResetScan}>
                Re-Scan
              </button>
            </div>
          </div>
        )}

        <div className="camera-status-chip">{status}</div>
      </div>
    </section>
  );
}
