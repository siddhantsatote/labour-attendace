import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Labour Attendance Tracker</Text>
      <Text style={styles.subtitle}>Choose mode and scan worker face</Text>

      <Pressable style={[styles.button, styles.checkIn]} onPress={() => navigation.navigate("Camera", { mode: "check_in" })}>
        <Text style={styles.buttonText}>Check In</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.checkOut]} onPress={() => navigation.navigate("Camera", { mode: "check_out" })}>
        <Text style={styles.buttonText}>Check Out</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.admin]} onPress={() => navigation.navigate("AdminDashboard")}>
        <Text style={styles.buttonText}>Admin Dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f8fafc"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    marginBottom: 28
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14
  },
  checkIn: {
    backgroundColor: "#16a34a"
  },
  checkOut: {
    backgroundColor: "#0284c7"
  },
  admin: {
    backgroundColor: "#334155"
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600"
  }
});
