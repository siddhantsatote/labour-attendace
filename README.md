# Labour Attendance Face App (ReactJS)

React web app for labour attendance tracking with on-device face recognition using face-api.js and Supabase backend.

## Features
- Check In / Check Out modes
- Browser camera scan with live face box preview
- Client-side face descriptor matching (Euclidean distance, threshold 0.5)
- New worker registration (Name + Phone) with face descriptor storage
- Auto check-in after registration
- Admin dashboard for workers and today's attendance
- Attendance edge cases handled:
  - Already checked in: no duplicate check-in
  - Not checked in but tries to check out: blocked with message

## Install
1. Create a `.env` file from `.env.example`
2. Install dependencies
3. Place face-api.js model files in `public/models`
4. Start the Vite dev server

## Commands
- npm install
- npm run dev
- npm run build

## Vercel Deployment
1. Add the face-api.js model files to `public/models`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables.
3. Deploy with the build command from `vercel.json` and serve the generated `dist` folder.

This makes the app hostable on Vercel as a static React web app.
On phones, open the Vercel URL in the browser and allow camera access.

## Required Face Model Files
Put these files in `public/models`:
- ssd_mobilenetv1_model-weights_manifest.json
- ssd_mobilenetv1_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2

## Supabase SQL
```sql
create extension if not exists "pgcrypto";

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  face_descriptor jsonb not null,
  created_at timestamp with time zone default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  check_in_time timestamp with time zone not null,
  check_out_time timestamp with time zone,
  hours_worked numeric,
  date date not null
);

create index if not exists idx_attendance_worker_date on attendance(worker_id, date);
create index if not exists idx_attendance_date on attendance(date);
```

## Notes
- Face detection and matching run on device.
- Supabase stores worker profiles and attendance records.
- Hours worked is computed as decimal hours on checkout.
