-- ==============================================================================
-- TOURISM WORKFORCE PLATFORM — SUPABASE DATABASE SCHEMA
-- Supabase SQL Editor bo'limiga nusxalab qo'yib, "Run" tugmasini bosing.
-- ==============================================================================

-- 1. PROFILES (Talaba, Universitet, Tashkilot va Admin profillari)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL, -- 'student', 'university', 'company', 'admin'
  fullname TEXT,
  email TEXT,
  phone TEXT,
  university TEXT,
  specialty TEXT,
  skills TEXT,
  languages TEXT,
  experience TEXT,
  photo TEXT,
  logo TEXT,
  location TEXT,
  desc_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JOBS (Tashkilotlar tomonidan joylangan ish va amaliyot e'lonlari)
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  owner_login TEXT,
  location TEXT,
  type TEXT, -- 'Full-time', 'Part-time', 'Internship'
  employment_type TEXT,
  sector TEXT,
  level TEXT,
  deadline TEXT,
  "desc" TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JOB APPLICATIONS (Talabalar tomonidan yuborilgan ish/amaliyot arizalari)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  job_title TEXT,
  company TEXT,
  owner_login TEXT,
  student_login TEXT,
  name TEXT,
  email TEXT,
  university TEXT,
  intro TEXT,
  cv_url TEXT,
  cv_name TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COURSES (Kurslar va ta'lim modullari)
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  level TEXT,
  duration TEXT,
  lessons_count INTEGER DEFAULT 6,
  "desc" TEXT,
  video_url TEXT,
  material_url TEXT,
  custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COURSE LESSONS (Har bir darsning sarlavhasi, video linki, konspekti va PDF qo'llanmasi)
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id TEXT PRIMARY KEY, -- masalan: 'hospitality-basics-0'
  course_id TEXT NOT NULL,
  lesson_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  notes TEXT,
  material_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STUDENT PROGRESS (Talabalarning kurs va darslarni o'tish progressi)
CREATE TABLE IF NOT EXISTS public.student_progress (
  id TEXT PRIMARY KEY, -- masalan: '10293847_hospitality-basics'
  student_login TEXT NOT NULL,
  course_id TEXT NOT NULL,
  completed_lessons JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_date TEXT
);

-- 7. UNIVERSITY POSTS (Universitetlar e'lonlari va yangiliklari)
CREATE TABLE IF NOT EXISTS public.university_posts (
  id TEXT PRIMARY KEY,
  owner_login TEXT,
  title TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  deadline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRACTICE SCHEDULES (Amaliyot vaqti va arizalari)
CREATE TABLE IF NOT EXISTS public.practice_schedules (
  id TEXT PRIMARY KEY,
  student_login TEXT,
  name TEXT,
  email TEXT,
  organization TEXT,
  organization_email TEXT,
  date TEXT,
  time TEXT,
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. USER ACCOUNTS (Foydalanuvchilar login va parollari)
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id TEXT PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL, -- 'student', 'university', 'company', 'admin'
  name TEXT,
  email TEXT,
  phone TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) Yoqish va ochiq kirish ruxsatnomalarini berish
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Barcha jadvallar uchun umumiy o'qish va yozish siyosatlari (Anonim va ro'yxatdan o'tgan foydalanuvchilar uchun)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
    'profiles', 'jobs', 'job_applications', 'courses', 'course_lessons', 'student_progress', 'university_posts', 'practice_schedules', 'user_accounts'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access for %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public access for %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;
