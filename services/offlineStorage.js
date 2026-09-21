import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS as BASE_STORAGE_KEYS } from '../constants/storageKeys';

export const STORAGE_KEYS = BASE_STORAGE_KEYS || {
  AUTH_TOKEN: '@skilltracker_token',
  USER_DATA: '@skilltracker_user',
  API_URL: '@skilltracker_api_url',
  THEME_MODE: '@skilltracker_theme_mode',
  CACHE_PREFIX: '@skilltracker_cache_',
  OFFLINE_QUEUE: '@skilltracker_offline_queue',
  REGISTERED_ACCOUNTS: '@skilltracker_registered_accounts',
};


export const saveItem = async (key, value) => {
  try {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error(`[AsyncStorage Save Error: ${key}]`, e);
  }
};

export const getItem = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (e) {
    console.error(`[AsyncStorage Get Error: ${key}]`, e);
    return null;
  }
};

export const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error(`[AsyncStorage Remove Error: ${key}]`, e);
  }
};

// Data Caching Helpers for Offline Access
export const setCachedData = async (endpoint, data) => {
  return await saveItem(`${STORAGE_KEYS.CACHE_PREFIX}${endpoint}`, {
    timestamp: Date.now(),
    data,
  });
};

export const getCachedData = async (endpoint) => {
  const cached = await getItem(`${STORAGE_KEYS.CACHE_PREFIX}${endpoint}`);
  return cached ? cached.data : null;
};

// Optimistic Cache Manipulation Helpers
export const optimisticCreate = async (endpoint, arrayKey, item) => {
  try {
    const cached = (await getCachedData(endpoint)) || {};
    const existingList = Array.isArray(cached[arrayKey]) ? cached[arrayKey] : [];
    const updatedList = [item, ...existingList];
    await setCachedData(endpoint, {
      ...cached,
      [arrayKey]: updatedList,
      count: (cached.count || existingList.length) + 1,
    });
    return item;
  } catch (e) {
    console.error('[optimisticCreate error]', e);
    return item;
  }
};

export const optimisticUpdate = async (endpoint, arrayKey, itemId, updatedFields) => {
  try {
    const cached = (await getCachedData(endpoint)) || {};
    const existingList = Array.isArray(cached[arrayKey]) ? cached[arrayKey] : [];
    const updatedList = existingList.map((item) =>
      item._id === itemId || item.id === itemId ? { ...item, ...updatedFields } : item
    );
    await setCachedData(endpoint, {
      ...cached,
      [arrayKey]: updatedList,
    });
    return updatedList.find((i) => i._id === itemId || i.id === itemId);
  } catch (e) {
    console.error('[optimisticUpdate error]', e);
  }
};

export const optimisticDelete = async (endpoint, arrayKey, itemId) => {
  try {
    const cached = (await getCachedData(endpoint)) || {};
    const existingList = Array.isArray(cached[arrayKey]) ? cached[arrayKey] : [];
    const updatedList = existingList.filter((item) => item._id !== itemId && item.id !== itemId);
    await setCachedData(endpoint, {
      ...cached,
      [arrayKey]: updatedList,
      count: Math.max(0, (cached.count || existingList.length) - 1),
    });
  } catch (e) {
    console.error('[optimisticDelete error]', e);
  }
};

// Local Registered Accounts for Instant & Offline Authentication
export const saveRegisteredAccount = async (account) => {
  try {
    const existing = (await getItem(STORAGE_KEYS.REGISTERED_ACCOUNTS)) || [];
    const normalizedEmail = (account.email || '').trim().toLowerCase();
    if (!normalizedEmail) return;
    const filtered = existing.filter(
      (a) => (a.email || '').trim().toLowerCase() !== normalizedEmail
    );
    filtered.push({
      ...account,
      email: normalizedEmail,
      updatedAt: Date.now(),
    });
    await saveItem(STORAGE_KEYS.REGISTERED_ACCOUNTS, filtered);
  } catch (e) {
    console.error('[saveRegisteredAccount error]', e);
  }
};

export const findRegisteredAccount = async (email) => {
  try {
    if (!email) return null;
    const existing = (await getItem(STORAGE_KEYS.REGISTERED_ACCOUNTS)) || [];
    const normalizedEmail = email.trim().toLowerCase();
    return existing.find((a) => (a.email || '').trim().toLowerCase() === normalizedEmail) || null;
  } catch (e) {
    console.error('[findRegisteredAccount error]', e);
    return null;
  }
};

export const seedDemoData = async () => {
  const existingSkills = await getCachedData('/api/skills');
  if (!existingSkills || !existingSkills.skills?.length) {
    await setCachedData('/api/skills', {
      skills: [
        { _id: 'demo_s1', name: 'React Native & Mobile App Dev', category: 'Mobile Dev', level: 'Advanced', targetHours: 60, practicedHours: 45, progressPercent: 75, notes: 'Building full-stack mobile applications' },
        { _id: 'demo_s2', name: 'Node.js & Express REST APIs', category: 'Web Dev', level: 'Intermediate', targetHours: 50, practicedHours: 35, progressPercent: 70, notes: 'Backend architecture and microservices' },
        { _id: 'demo_s3', name: 'MongoDB Atlas & Database Design', category: 'Data Science', level: 'Intermediate', targetHours: 40, practicedHours: 30, progressPercent: 75, notes: 'Schema indexing, aggregation pipelines' },
        { _id: 'demo_s4', name: 'UI/UX & Product Design', category: 'Design & UI/UX', level: 'Advanced', targetHours: 30, practicedHours: 24, progressPercent: 80, notes: 'Design systems, Figma, user flows' },
        { _id: 'demo_s5', name: 'Entrepreneurship & Startup Growth', category: 'Business', level: 'Intermediate', targetHours: 40, practicedHours: 25, progressPercent: 62, notes: 'Product-market fit, client pitching' },
      ],
    });

    await setCachedData('/api/planner', {
      tasks: [
        { _id: 'demo_t1', title: 'Compile Final Android APK on EAS', day: 'Monday', priority: 'High', status: 'Completed', deadline: '2026-09-25' },
        { _id: 'demo_t2', title: 'Prepare Internal Exam Practical Review', day: 'Wednesday', priority: 'High', status: 'In Progress', deadline: '2026-09-26' },
        { _id: 'demo_t3', title: 'Review MongoDB Atlas Connection Strings', day: 'Thursday', priority: 'Medium', status: 'Completed', deadline: '2026-09-27' },
        { _id: 'demo_t4', title: 'Client Demo Presentation & Feedback', day: 'Friday', priority: 'High', status: 'Pending', deadline: '2026-09-28' },
      ],
    });

    await setCachedData('/api/timetable', {
      timetable: [
        { _id: 'demo_tt1', day: 'Monday', period: 'Period 1 (09:00 - 10:00)', subject: 'Mobile App Architecture', classroom: 'Lab 3', faculty: 'Dr. Ramesh' },
        { _id: 'demo_tt2', day: 'Monday', period: 'Period 2 (10:00 - 11:00)', subject: 'Database Management Systems', classroom: 'Hall 204', faculty: 'Prof. Anitha' },
        { _id: 'demo_tt3', day: 'Tuesday', period: 'Period 1 (09:00 - 10:00)', subject: 'Cloud Computing & DevOps', classroom: 'Lab 1', faculty: 'Dr. Suresh' },
        { _id: 'demo_tt4', day: 'Wednesday', period: 'Period 3 (11:15 - 12:15)', subject: 'Startup Incubation & Business', classroom: 'Seminar Hall', faculty: 'Mr. Vignesh' },
      ],
    });

    await setCachedData('/api/internal-exams', {
      internalExams: [
        { _id: 'demo_ie1', subject: 'Mobile App Development', examType: 'Mid-Term Exam', examDate: '2026-10-05', maxMarks: 50, marksObtained: 46, syllabus: 'Units 1 - 3: Components, Layouts, Navigation', roomNumber: 'Exam Hall A' },
        { _id: 'demo_ie2', subject: 'Database Engineering', examType: 'Unit Test 1', examDate: '2026-10-12', maxMarks: 50, marksObtained: 44, syllabus: 'Relational & NoSQL Schema Design', roomNumber: 'Exam Hall B' },
      ],
    });

    await setCachedData('/api/external-exams', {
      externalExams: [
        { _id: 'demo_ee1', subject: 'Cloud & Distributed Systems', examType: 'Semester Final', examDate: '2026-11-20', syllabus: 'Full Syllabus (Modules 1 - 5)', centerName: 'Main Campus Exam Center', hallTicketNumber: 'HT-2026-8891' },
        { _id: 'demo_ee2', subject: 'Advanced Mobile Computing', examType: 'University Theory', examDate: '2026-11-24', syllabus: 'React Native, Hermes, Native Bridges', centerName: 'Main Campus Exam Center', hallTicketNumber: 'HT-2026-8891' },
      ],
    });

    await setCachedData('/api/expenses', {
      expenses: [
        { _id: 'demo_ex1', title: 'Server Hosting & Domain Renewal', category: 'Software & Tools', amount: 1200, date: '2026-09-15', paymentMethod: 'UPI' },
        { _id: 'demo_ex2', title: 'Mobile Dev Reference Handbook', category: 'Academic & Books', amount: 650, date: '2026-09-10', paymentMethod: 'Card' },
        { _id: 'demo_ex3', title: 'Team Strategy Lunch & Coffee', category: 'Food & Cafeteria', amount: 480, date: '2026-09-08', paymentMethod: 'UPI' },
      ],
      totalAmount: 2330,
    });

    await setCachedData('/api/progress', {
      totalSkills: 5,
      totalPracticeHours: 48,
      completedTasks: 9,
      totalTasks: 12,
      streakDays: 7,
      examsCount: 4,
      totalExpenses: 2330,
    });

    await setCachedData('/api/progress/dashboard', {
      overallProgress: 72,
      totalSkills: 5,
      totalPracticeHours: 48,
      completedTasks: 9,
      totalTasks: 12,
      upcomingInternalExams: 2,
      upcomingExternalExams: 2,
      totalExpenses: 2330,
      recentSkills: [
        { _id: 'demo_s1', name: 'React Native & Mobile App Dev', progressPercent: 75, category: 'Mobile Dev' },
        { _id: 'demo_s2', name: 'Node.js & Express REST APIs', progressPercent: 70, category: 'Web Dev' },
      ],
      upcomingTasks: [
        { _id: 'demo_t1', title: 'Compile Final Android APK on EAS', day: 'Monday', priority: 'High', status: 'Completed' },
        { _id: 'demo_t4', title: 'Client Demo Presentation & Feedback', day: 'Friday', priority: 'High', status: 'Pending' },
      ],
      nextInternalExam: {
        subject: 'Mobile App Development',
        examType: 'Mid-Term Exam',
        examDate: '2026-10-05',
        roomNumber: 'Exam Hall A',
      },
    });

    await setCachedData('/api/startup', {
      profile: {
        startupName: 'SkillTracker Tech Lab',
        tagline: 'Empowering Student Productivity & Startup Growth',
        stage: 'Early Traction',
        industry: 'EdTech & Productivity',
        website: 'https://skilltracker.app',
      },
      projects: [
        { _id: 'demo_sp1', name: 'SkillTracker Mobile App', status: 'Development', budget: 15000, deadline: '2026-10-30', description: 'Cross-platform productivity app with offline storage' },
      ],
      members: [
        { _id: 'demo_sm1', name: 'Thamil Selvan', role: 'Founder & Full Stack Lead', email: 'thamil@skilltracker.app', joinedDate: '2026-01-10' },
        { _id: 'demo_sm2', name: 'Priya Sharma', role: 'UI/UX Designer', email: 'priya@skilltracker.app', joinedDate: '2026-02-15' },
      ],
      clients: [
        { _id: 'demo_sc1', name: 'Campus Innovation Cell', contactPerson: 'Dean Academic', status: 'Active', value: 25000 },
      ],
    });
  }
};

export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(STORAGE_KEYS.CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (e) {
    console.error('[AsyncStorage Clear Cache Error]', e);
  }
};

export default {
  STORAGE_KEYS,
  saveItem,
  getItem,
  removeItem,
  setCachedData,
  getCachedData,
  optimisticCreate,
  optimisticUpdate,
  optimisticDelete,
  saveRegisteredAccount,
  findRegisteredAccount,
  seedDemoData,
  clearAllCache,
};
