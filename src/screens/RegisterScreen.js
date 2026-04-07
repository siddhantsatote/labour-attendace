import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { registerWorkerAndCheckIn } from "../lib/attendanceService";

export default function RegisterScreen({ route, navigation }) {
  const { descriptor } = route.params || {};
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    if (!descriptor || !Array.isArray(descriptor)) {
      Alert.alert("Missing face data", "Face descriptor not found. Please scan again.");
      return;
    }

    if (!name.trim() || !phone.trim()) {
      Alert.alert("Required fields", "Please enter both Name and Phone Number.");
      return;
    }

    try {
      setSaving(true);
      await registerWorkerAndCheckIn({
        name: name.trim(),
        phone: phone.trim(),
        descriptor
      });

      Alert.alert("Registered", "Worker registered and checked in successfully.");
      navigation.popToTop();
    } catch (error) {
      Alert.alert("Registration failed", error.message || "Unable to save worker.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Worker Registration</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        placeholder="Enter full name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        editable={!saving}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        editable={!saving}
      />

      <Pressable style={[styles.submitButton, saving && styles.disabled]} onPress={onSubmit} disabled={saving}>
        <Text style={styles.submitText}>{saving ? "Saving..." : "Save and Check In"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff"
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 20
  },
  label: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 6,
    marginTop: 10
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center"
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600"
  },
  disabled: {
    opacity: 0.6
  }
});
