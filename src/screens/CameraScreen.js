import React, { useEffect, useRef, useState } from "react";
import { Alert, Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import FaceBoxOverlay from "../components/FaceBoxOverlay";
import { checkInWorker, checkOutWorker, getAllWorkers, MATCH_THRESHOLD } from "../lib/attendanceService";
import { detectFaceAndDescriptorFromBase64, findBestMatch, initializeFaceModels } from "../lib/faceRecognition";

const PREVIEW_WIDTH = Dimensions.get("window").width - 24;
const PREVIEW_HEIGHT = 420;

export default function CameraScreen({ route, navigation }) {
  const mode = route.params?.mode || "check_in";
  const cameraRef = useRef(null);
  const liveTimerRef = useRef(null);
  const isLiveBusyRef = useRef(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [liveBox, setLiveBox] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [statusText, setStatusText] = useState("Center face in frame and capture");

  useEffect(() => {
    (async () => {
      await requestPermission();
      try {
        await initializeFaceModels();
        setIsReady(true);
      } catch (error) {
        Alert.alert("Model load failed", "Unable to load face-api.js models from assets/models.");
      }
    })();
  }, [requestPermission]);

  useEffect(() => {
    if (!permission?.granted || !isReady || captured) {
      return;
    }

    liveTimerRef.current = setInterval(async () => {
      if (!cameraRef.current || isLiveBusyRef.current || busy) {
        return;
      }

      try {
        isLiveBusyRef.current = true;
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.25,
          skipProcessing: true
        });

        const detected = await detectFaceAndDescriptorFromBase64(photo.base64);
        if (detected?.box) {
          setLiveBox(detected.box);
        } else {
          setLiveBox(null);
        }
      } catch (error) {
        setLiveBox(null);
      } finally {
        isLiveBusyRef.current = false;
      }
    }, 1500);

    return () => {
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current);
      }
    };
  }, [permission?.granted, isReady, captured, busy]);

  async function onCapture() {
    if (!cameraRef.current || busy) {
      return;
    }

    try {
      setBusy(true);
      setStatusText("Detecting face...");

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        skipProcessing: false
      });

      const detected = await detectFaceAndDescriptorFromBase64(photo.base64);

      if (!detected) {
        setCaptured({
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          box: null,
          matched: false,
          descriptor: null,
          worker: null,
          color: "#ef4444"
        });
        setStatusText("No face detected. Try again.");
        return;
      }

      const workers = await getAllWorkers();
      const best = findBestMatch(detected.descriptor, workers, MATCH_THRESHOLD);

      if (best) {
        const worker = best.worker;
        const actionResult = mode === "check_in" ? await checkInWorker(worker.id) : await checkOutWorker(worker.id);

        let actionMessage = "";
        if (mode === "check_in") {
          actionMessage =
            actionResult.status === "already_checked_in"
              ? `${worker.name} is already checked in.`
              : `${worker.name} checked in successfully.`;
        } else {
          actionMessage =
            actionResult.status === "not_checked_in"
              ? `${worker.name} is not checked in today.`
              : `${worker.name} checked out. Hours: ${actionResult.record.hours_worked}`;
        }

        setCaptured({
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          box: detected.box,
          matched: true,
          descriptor: detected.descriptor,
          worker,
          color: "#22c55e"
        });
        setStatusText(actionMessage);
      } else {
        setCaptured({
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          box: detected.box,
          matched: false,
          descriptor: detected.descriptor,
          worker: null,
          color: "#ef4444"
        });
        setStatusText("New face detected. Register worker to continue.");
      }
    } catch (error) {
      Alert.alert("Scan failed", error.message || "Unable to process this scan.");
      setStatusText("Scan failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setCaptured(null);
    setStatusText("Center face in frame and capture");
  }

  if (!permission) {
    return <View style={styles.centered}><Text>Checking camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.info}>Camera access is required.</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.modeLabel}>Mode: {mode === "check_in" ? "Check In" : "Check Out"}</Text>

      {!captured ? (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="front" />
          {liveBox ? (
            <FaceBoxOverlay
              box={liveBox}
              imageSize={{ width: 480, height: 640 }}
              viewSize={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
              color="#22c55e"
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.previewWrap}>
          <Image source={{ uri: captured.uri }} style={styles.previewImage} resizeMode="cover" />
          {captured.box ? (
            <FaceBoxOverlay
              box={captured.box}
              imageSize={{ width: captured.width, height: captured.height }}
              viewSize={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
              color={captured.color}
            />
          ) : null}
        </View>
      )}

      <Text style={styles.status}>{statusText}</Text>

      {!captured ? (
        <Pressable style={[styles.primaryButton, busy && styles.disabled]} onPress={onCapture} disabled={busy || !isReady}>
          <Text style={styles.primaryText}>{busy ? "Processing..." : "Scan"}</Text>
        </Pressable>
      ) : (
        <>
          {!captured.matched && captured.descriptor ? (
            <Pressable
              style={styles.registerButton}
              onPress={() => navigation.navigate("Register", { descriptor: captured.descriptor })}
            >
              <Text style={styles.primaryText}>Register New Worker</Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.secondaryButton} onPress={reset}>
            <Text style={styles.secondaryText}>Scan Another</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8fafc"
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  info: {
    marginBottom: 12,
    color: "#334155"
  },
  modeLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10
  },
  cameraWrap: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: "#0f172a"
  },
  camera: {
    width: "100%",
    height: "100%"
  },
  previewWrap: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: "#0f172a"
  },
  previewImage: {
    width: "100%",
    height: "100%"
  },
  status: {
    textAlign: "center",
    marginVertical: 14,
    fontSize: 16,
    color: "#0f172a"
  },
  primaryButton: {
    alignSelf: "center",
    minWidth: 180,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center"
  },
  registerButton: {
    alignSelf: "center",
    minWidth: 220,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8
  },
  secondaryButton: {
    alignSelf: "center",
    minWidth: 180,
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16
  },
  secondaryText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 16
  },
  disabled: {
    opacity: 0.6
  }
});
