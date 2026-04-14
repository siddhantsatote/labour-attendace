import React, { useMemo, useState } from "react";
import HomeScreen from "./screens/HomeScreen";
import CameraScreen from "./screens/CameraScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("check_in");
  const [pendingWorker, setPendingWorker] = useState(null);
  const [dashboardTick, setDashboardTick] = useState(0);

  const navigation = useMemo(
    () => ({
      openHome: () => setScreen("home"),
      openCamera: (nextMode) => {
        setMode(nextMode);
        setScreen("camera");
      },
      openRegister: (worker) => {
        setPendingWorker(worker);
        setScreen("register");
      },
      openDashboard: () => setScreen("dashboard")
    }),
    []
  );

  function handleRegistrationComplete() {
    setPendingWorker(null);
    setDashboardTick((value) => value + 1);
    setScreen("home");
  }

  function handleAttendanceSaved() {
    setDashboardTick((value) => value + 1);
  }

  return (
    <div className="app-shell">
      <div className="container">
        {screen === "home" ? (
          <HomeScreen
            onOpenCamera={() => navigation.openCamera("check_in")}
            onOpenHistory={navigation.openDashboard}
          />
        ) : null}

        {screen === "camera" ? (
          <CameraScreen
            mode={mode}
            onBack={navigation.openHome}
            onRegister={navigation.openRegister}
            onAttendanceSaved={handleAttendanceSaved}
          />
        ) : null}

        {screen === "register" ? (
          <RegisterScreen workerDraft={pendingWorker} onBack={navigation.openHome} onSaved={handleRegistrationComplete} />
        ) : null}

        {screen === "dashboard" ? (
          <AdminDashboardScreen
            refreshKey={dashboardTick}
            onBack={navigation.openHome}
            onOpenCamera={() => navigation.openCamera("check_in")}
            onOpenHome={navigation.openHome}
          />
        ) : null}
      </div>
    </div>
  );
}
