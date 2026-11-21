// ==============================================================================
// TOURISM WORKFORCE PLATFORM — SUPABASE CLOUD SYNC
// Cloud PostgreSQL integration with Supabase
// ==============================================================================

const SUPABASE_CONFIG = {
  url: "https://qdzqjgfuekzccppbjrog.supabase.co",
  anonKey: "sb_publishable_KXunb-qpI64zxnMdfXJuFw_rSnojmy8"
};

let sb = null;
try {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    sb = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log("✓ Supabase mijoz ulandi:", SUPABASE_CONFIG.url);
  }
} catch (e) {
  console.warn("Supabase ulanishida ogohlantirish:", e);
}

// ------------------------------------------------------------------------------
// Sync Functions for Tourism Workforce Platform
// ------------------------------------------------------------------------------
window.TWPSupabase = {
  client: sb,

  // 1. Ish e'lonlarini Supabase bilan sinxronlash
  async syncJobs() {
    if (!sb) return;
    try {
      const { data, error } = await sb.from('jobs').select('*');
      if (!error && Array.isArray(data) && data.length) {
        let currentJobs = readJSON('twp_employer_jobs_all', []);
        data.forEach(cloudJob => {
          const idx = currentJobs.findIndex(j => j.id === cloudJob.id);
          const mapped = {
            id: cloudJob.id,
            title: cloudJob.title,
            company: cloudJob.company,
            ownerLogin: cloudJob.owner_login,
            location: cloudJob.location,
            type: cloudJob.type,
            employmentType: cloudJob.employment_type,
            sector: cloudJob.sector,
            level: cloudJob.level,
            deadline: cloudJob.deadline,
            desc: cloudJob.desc,
            logo: cloudJob.logo || ''
          };
          if (idx >= 0) currentJobs[idx] = mapped;
          else currentJobs.push(mapped);
          if (!jobs.some(x => x.id === mapped.id)) jobs.push(mapped);
        });
        localStorage.setItem('twp_employer_jobs_all', JSON.stringify(currentJobs));
        if (typeof renderJobs === 'function') renderJobs();
      }
    } catch (e) {
      console.warn("Jobs sync xatosi:", e);
    }
  },

  async saveJob(job) {
    if (!sb) return;
    try {
      await sb.from('jobs').upsert({
        id: job.id,
        title: job.title,
        company: job.company,
        owner_login: job.ownerLogin || '',
        location: job.location || '',
        type: job.type || 'Full-time',
        employment_type: job.employmentType || '',
        sector: job.sector || 'Tourism',
        level: job.level || '',
        deadline: job.deadline || '',
        desc: job.desc || '',
        logo: job.logo || ''
      });
    } catch (e) {
      console.warn("Supabase job saqlashda xato:", e);
    }
  },

  async deleteJob(jobId) {
    if (!sb) return;
    try {
      await sb.from('jobs').delete().eq('id', jobId);
    } catch (e) {
      console.warn("Supabase job o‘chirishda xato:", e);
    }
  },

  // 2. Kurslar va darslar ma'lumotlarini Supabase bilan sinxronlash
  async syncCoursesAndLessons() {
    if (!sb) return;
    try {
      // Custom kurslar
      const { data: coursesData } = await sb.from('courses').select('*');
      if (coursesData && coursesData.length) {
        let currentCustom = readJSON('twp_custom_courses', []);
        coursesData.forEach(cc => {
          const mapped = {
            id: cc.id,
            title: cc.title,
            category: cc.category,
            level: cc.level,
            duration: cc.duration,
            lessons: cc.lessons_count || 6,
            desc: cc.desc,
            custom: true
          };
          if (!courses.some(x => x.id === mapped.id)) courses.push(mapped);
          if (!currentCustom.some(x => x.id === mapped.id)) currentCustom.push(mapped);
        });
        localStorage.setItem('twp_custom_courses', JSON.stringify(currentCustom));
      }

      // Darslar (video, mavzular va PDF qo'llanmalar)
      const { data: lessonsData } = await sb.from('course_lessons').select('*');
      if (lessonsData && lessonsData.length) {
        let allLessons = readJSON('twp_custom_lessons', {});
        lessonsData.forEach(l => {
          allLessons[l.id] = {
            title: l.title,
            videoUrl: l.video_url || '',
            notes: l.notes || '',
            materialUrl: l.material_url || ''
          };
        });
        localStorage.setItem('twp_custom_lessons', JSON.stringify(allLessons));
        if (typeof renderCourses === 'function') renderCourses();
        if (location.hash.startsWith('#learn/') && typeof renderCourseDetail === 'function') renderCourseDetail();
        if (location.hash.startsWith('#lesson/') && typeof renderLesson === 'function') renderLesson();
      }
    } catch (e) {
      console.warn("Courses/lessons sync xatosi:", e);
    }
  },

  async saveLesson(courseId, lessonIndex, data) {
    if (!sb) return;
    try {
      const lessonKey = `${courseId}-${lessonIndex}`;
      await sb.from('course_lessons').upsert({
        id: lessonKey,
        course_id: courseId,
        lesson_index: lessonIndex,
        title: data.title || '',
        video_url: data.videoUrl || '',
        notes: data.notes || '',
        material_url: data.materialUrl || ''
      });
    } catch (e) {
      console.warn("Supabase darsni saqlashda xato:", e);
    }
  },

  async saveCourseMeta(courseId, data) {
    if (!sb) return;
    try {
      await sb.from('courses').upsert({
        id: courseId,
        title: data.title || courseId,
        video_url: data.videoUrl || '',
        material_url: data.materialUrl || ''
      });
    } catch (e) {
      console.warn("Supabase kurs meta saqlashda xato:", e);
    }
  },

  // 3. Ish arizalari (Job applications) sinxronlash
  async syncApplications() {
    if (!sb) return;
    try {
      const { data, error } = await sb.from('job_applications').select('*');
      if (!error && Array.isArray(data) && data.length) {
        let localApps = readJSON('twp_job_applications', []);
        data.forEach(a => {
          if (!localApps.some(x => x.id === a.id)) {
            localApps.push({
              id: a.id,
              jobId: a.job_id,
              jobTitle: a.job_title,
              company: a.company,
              ownerLogin: a.owner_login,
              studentLogin: a.student_login,
              name: a.name,
              email: a.email,
              university: a.university,
              intro: a.intro,
              cvUrl: a.cv_url,
              cvName: a.cv_name,
              submittedAt: a.submitted_at
            });
          }
        });
        localStorage.setItem('twp_job_applications', JSON.stringify(localApps));
      }
    } catch (e) {
      console.warn("Applications sync xatosi:", e);
    }
  },

  async saveApplication(app) {
    if (!sb) return;
    try {
      await sb.from('job_applications').insert({
        id: app.id,
        job_id: app.jobId,
        job_title: app.jobTitle,
        company: app.company,
        owner_login: app.ownerLogin || '',
        student_login: app.studentLogin || '',
        name: app.name,
        email: app.email,
        university: app.university || '',
        intro: app.intro || '',
        cv_name: app.cvName || '',
        submitted_at: app.submittedAt || new Date().toISOString()
      });
    } catch (e) {
      console.warn("Supabase ariza saqlashda xato:", e);
    }
  },

  // 4. Foydalanuvchi hisoblari (User accounts) sinxronlash
  async syncUserAccounts() {
    if (!sb) return;
    try {
      const { data, error } = await sb.from('user_accounts').select('*');
      if (!error && Array.isArray(data) && data.length) {
        let localAccounts = (typeof getRegisteredAccounts === 'function') ? getRegisteredAccounts() : (JSON.parse(localStorage.getItem('twp_registered_accounts') || '[]'));
        data.forEach(cloudAcc => {
          const idx = localAccounts.findIndex(a => String(a.login) === String(cloudAcc.login));
          const mapped = {
            id: cloudAcc.id,
            login: cloudAcc.login,
            password: cloudAcc.password,
            role: cloudAcc.role,
            name: cloudAcc.name || '',
            email: cloudAcc.email || '',
            phone: cloudAcc.phone || '',
            note: cloudAcc.note || '',
            createdAt: cloudAcc.created_at
          };
          if (idx >= 0) localAccounts[idx] = { ...localAccounts[idx], ...mapped };
          else localAccounts.push(mapped);
        });
        localStorage.setItem('twp_registered_accounts', JSON.stringify(localAccounts));
        if (typeof renderDashboard === 'function' && typeof dashboardRole !== 'undefined' && dashboardRole === 'admin') {
          renderDashboard();
        }
      }
    } catch (e) {
      console.warn("User accounts sync xatosi:", e);
    }
  },

  async saveUserAccount(acc) {
    if (!sb) return;
    try {
      await sb.from('user_accounts').upsert({
        id: acc.id || ('acc-' + acc.login),
        login: String(acc.login),
        password: String(acc.password),
        role: acc.role,
        name: acc.name || '',
        email: acc.email || '',
        phone: acc.phone || '',
        note: acc.note || '',
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Supabase user account saqlashda xato:", e);
    }
  },

  async deleteUserAccount(login) {
    if (!sb) return;
    try {
      await sb.from('user_accounts').delete().eq('login', String(login));
    } catch (e) {
      console.warn("Supabase user account o‘chirishda xato:", e);
    }
  },

  // Boshlang'ich barcha sinxronlashni ishga tushirish
  async initSync() {
    if (!sb) return;
    console.log("⚡ Supabase bilan sinxronlash boshlandi...");
    await Promise.allSettled([
      this.syncJobs(),
      this.syncCoursesAndLessons(),
      this.syncApplications(),
      this.syncUserAccounts()
    ]);
    console.log("✓ Supabase ma’lumotlari yuklandi va sinxronlandi.");
  }
};

// Sahifa yuklanganda avtomatik ishga tushadi
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.TWPSupabase) window.TWPSupabase.initSync();
  }, 1000);
});
