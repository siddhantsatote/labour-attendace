import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAllWorkers, getTodayAttendanceWithWorkers } from "../lib/attendanceService";

function WorkerRow({ item }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{item.name}</Text>
      <Text style={styles.rowSub}>{item.phone}</Text>
    </View>
  );
}

function AttendanceRow({ item }) {
  const name = item.workers?.name || "Unknown";
  const checkIn = item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString() : "-";
  const checkOut = item.check_out_time ? new Date(item.check_out_time).toLocaleTimeString() : "-";
  const hours = item.hours_worked ?? "-";

  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{name}</Text>
      <Text style={styles.rowSub}>In: {checkIn} | Out: {checkOut} | Hours: {hours}</Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allWorkers, todayAttendance] = await Promise.all([getAllWorkers(), getTodayAttendanceWithWorkers()]);
      setWorkers(allWorkers);
      setAttendance(todayAttendance);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Workers</Text>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WorkerRow item={item} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No workers registered yet.</Text>}
        style={styles.list}
      />

      <Text style={styles.header}>Today's Attendance</Text>
      <FlatList
        data={attendance}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AttendanceRow item={item} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No attendance records for today.</Text>}
      />

      <Pressable style={styles.refreshButton} onPress={loadData}>
        <Text style={styles.refreshText}>Refresh</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    marginTop: 8
  },
  list: {
    maxHeight: 220,
    marginBottom: 10
  },
  row: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a"
  },
  rowSub: {
    fontSize: 14,
    color: "#334155",
    marginTop: 4
  },
  emptyText: {
    color: "#64748b",
    marginBottom: 12
  },
  refreshButton: {
    marginTop: 12,
    backgroundColor: "#0ea5e9",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12
  },
  refreshText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16
  }
});
