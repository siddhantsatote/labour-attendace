import { supabase } from "./supabase";

export const MATCH_THRESHOLD = 0.5;

export function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function calculateHoursWorked(checkInIso, checkOutIso) {
  const checkIn = new Date(checkInIso);
  const checkOut = new Date(checkOutIso);
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Number(hours.toFixed(2));
}

export async function getAllWorkers() {
  const { data, error } = await supabase
    .from("workers")
    .select("id, name, phone, face_descriptor, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function registerWorkerAndCheckIn({ name, phone, descriptor }) {
  const { data: worker, error: workerError } = await supabase
    .from("workers")
    .insert({
      name,
      phone,
      face_descriptor: descriptor,
      created_at: new Date().toISOString()
    })
    .select("id, name, phone")
    .single();

  if (workerError) {
    throw workerError;
  }

  await checkInWorker(worker.id);
  return worker;
}

export async function checkInWorker(workerId) {
  const today = getTodayDateString();

  const { data: existing, error: existingError } = await supabase
    .from("attendance")
    .select("id, check_in_time, check_out_time")
    .eq("worker_id", workerId)
    .eq("date", today)
    .is("check_out_time", null)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return {
      status: "already_checked_in",
      record: existing
    };
  }

  const checkInTime = new Date().toISOString();

  const { data, error } = await supabase
    .from("attendance")
    .insert({
      worker_id: workerId,
      check_in_time: checkInTime,
      date: today
    })
    .select("id, worker_id, check_in_time, check_out_time, hours_worked, date")
    .single();

  if (error) {
    throw error;
  }

  return {
    status: "checked_in",
    record: data
  };
}

export async function checkOutWorker(workerId) {
  const today = getTodayDateString();

  const { data: openAttendance, error: openError } = await supabase
    .from("attendance")
    .select("id, check_in_time")
    .eq("worker_id", workerId)
    .eq("date", today)
    .is("check_out_time", null)
    .order("check_in_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openError) {
    throw openError;
  }

  if (!openAttendance) {
    return {
      status: "not_checked_in"
    };
  }

  const checkOutTime = new Date().toISOString();
  const hoursWorked = calculateHoursWorked(openAttendance.check_in_time, checkOutTime);

  const { data, error } = await supabase
    .from("attendance")
    .update({
      check_out_time: checkOutTime,
      hours_worked: hoursWorked
    })
    .eq("id", openAttendance.id)
    .select("id, worker_id, check_in_time, check_out_time, hours_worked, date")
    .single();

  if (error) {
    throw error;
  }

  return {
    status: "checked_out",
    record: data
  };
}

export async function getTodayAttendanceWithWorkers() {
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("attendance")
    .select("id, worker_id, check_in_time, check_out_time, hours_worked, date, workers(name, phone)")
    .eq("date", today)
    .order("check_in_time", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
