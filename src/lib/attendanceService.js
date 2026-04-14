import { getSupabaseClient } from "./supabase";

export const MATCH_THRESHOLD = 0.5;

async function uploadWorkerPhoto(workerId, photoDataUrl) {
  if (!photoDataUrl || typeof photoDataUrl !== "string") {
    return null;
  }

  const supabase = getSupabaseClient();
  const response = await fetch(photoDataUrl);
  const blob = await response.blob();
  const path = `${workerId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("worker-photos")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from("worker-photos").getPublicUrl(path);
  return data?.publicUrl || null;
}

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
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("workers")
    .select("id, name, phone, face_descriptor, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function registerWorkerAndCheckIn({ name, phone, descriptor, photoDataUrl }) {
  const supabase = getSupabaseClient();
  const safeDescriptor = Array.isArray(descriptor) && descriptor.length === 128 ? descriptor : null;

  if (!safeDescriptor) {
    throw new Error("Face descriptor missing. Please rescan and keep the face clearly visible.");
  }

  const { data: worker, error: workerError } = await supabase
    .from("workers")
    .insert({
      name,
      phone,
      face_descriptor: safeDescriptor,
      created_at: new Date().toISOString()
    })
    .select("id, name, phone")
    .single();

  if (workerError) {
    throw workerError;
  }

  if (photoDataUrl) {
    const publicUrl = await uploadWorkerPhoto(worker.id, photoDataUrl);

    if (publicUrl) {
      // Update optional column if it exists; ignore when schema doesn't include photo_url yet.
      await supabase.from("workers").update({ photo_url: publicUrl }).eq("id", worker.id);
    }
  }

  await checkInWorker(worker.id);
  return worker;
}

export async function checkInWorker(workerId) {
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
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

export async function getAttendanceHistoryWithWorkers() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("attendance")
    .select("id, worker_id, check_in_time, check_out_time, hours_worked, date, workers(name, phone)")
    .order("check_in_time", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
