import React, { useEffect, useMemo, useRef, useState } from "react";
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
          descriptor: null
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
          worker
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
          descriptor: detected.descriptor
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
          descriptor: null
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

  const webcamStyle = useMemo(() => ({
    width: "100%",
    height: "100%"
  }), []);

  return (
    <section className="hero">
      <div className="panel panel-pad workspace">
        <p className="kicker">Face scan</p>
        <h2 className="section-title">{title}</h2>
        <p className="small">{modeHint}</p>
        <div className="status">{loadingModels ? "Loading face models..." : status}</div>
        <div className="tag-row">
          <span className="tag good">Green box: matched labour</span>
          <span className="tag bad">Red box: new labour</span>
        </div>

        {captureResult?.matched ? (
          <div className="status">
            <strong>Matched labour</strong>
            <p className="small">{captureResult.message}</p>
          </div>
        ) : null}

        {captureResult && !captureResult.matched ? (
          <div className="actions">
            <button className="btn success" onClick={handleRegister}>Register New Labour</button>
          </div>
        ) : null}
      </div>

      <div className="panel panel-pad workspace">
        <div className="camera-lens-shell">
          {!captureResult?.photoSrc ? (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.9}
                videoConstraints={{ facingMode }}
                style={webcamStyle}
              />
              {liveBox ? (
                <FaceBoxOverlay box={liveBox} sourceSize={{ width: 640, height: 480 }} displaySize={liveSize} color="#22c55e" />
              ) : null}
            </>
          ) : (
            <>
              <img src={captureResult.photoSrc} alt="Captured face" />
              {captureResult.box ? (
                <FaceBoxOverlay box={captureResult.box} sourceSize={captureResult.sourceSize} displaySize={captureResult.displaySize} color={captureResult.color} />
              ) : null}
            </>
          )}

          <div className="lens-top-bar">
            <button className="lens-icon-btn" onClick={onBack} aria-label="Back to home">←</button>
            <div className="lens-title">Attendance Scan</div>
            <button className="lens-icon-btn" onClick={toggleCamera} disabled={busy} aria-label="Switch camera">
              ↺
            </button>
          </div>

          <div className="lens-reticle" aria-hidden="true">
            <span className="corner top-left" />
            <span className="corner top-right" />
            <span className="corner bottom-left" />
            <span className="corner bottom-right" />
          </div>

          <div className="lens-bottom-dock">
            <div className="lens-status-chip">
              {captureResult ? "Result ready" : `Mode: ${title}`}
            </div>

            <button className="lens-capture-btn" onClick={handleCapture} disabled={busy || loadingModels}>
              <span className="lens-capture-inner" />
            </button>

            {captureResult ? (
              <button className="lens-text-btn" onClick={() => setCaptureResult(null)}>Rescan</button>
            ) : (
              <span className="lens-text-placeholder" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
