import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AUTH_TOKEN,
  USER_DATA,
  USER_ID,
  CACHE_PREFIX,
  OFFLINE_QUEUE,
  REGISTERED_ACCOUNTS,
  STORAGE_KEYS,
} from '../constants/storageKeys.js';

// Safe key fallbacks in case of circular module evaluation
const SAFE_CACHE_PREFIX = CACHE_PREFIX || '@skilltracker_cache_';
const SAFE_REGISTERED_ACCOUNTS = REGISTERED_ACCOUNTS || '@skilltracker_registered_accounts';
const SAFE_OFFLINE_QUEUE = OFFLINE_QUEUE || '@skilltracker_offline_queue';

// Basic AsyncStorage Helpers
export const saveItem = async (key, value) => {
  try {
    if (!key) return;
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error(`[AsyncStorage Save Error: ${key}]`, e);
  }
};

export const getItem = async (key) => {
  try {
    if (!key) return null;
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
    if (!key) return;
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error(`[AsyncStorage Remove Error: ${key}]`, e);
  }
};

// Data Caching Helpers for Offline Access
export const setCachedData = async (endpoint, data) => {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return await saveItem(`${SAFE_CACHE_PREFIX}${cleanEndpoint}`, {
      timestamp: Date.now(),
      data,
    });
  } catch (e) {
    console.error(`[setCachedData Error: ${endpoint}]`, e);
  }
};

export const getCachedData = async (endpoint) => {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cached = await getItem(`${SAFE_CACHE_PREFIX}${cleanEndpoint}`);
    return cached ? cached.data : null;
  } catch (e) {
    console.error(`[getCachedData Error: ${endpoint}]`, e);
    return null;
  }
};

// Optimistic Cache Manipulation Helpers
export const optimisticCreate = async (endpoint, arrayKey, item) => {
  try {
    const cached = (await getCachedData(endpoint)) || {};
    const existingList = Array.isArray(cached[arrayKey])
      ? cached[arrayKey]
      : Array.isArray(cached.data)
      ? cached.data
      : [];
    const updatedList = [item, ...existingList];
    await setCachedData(endpoint, {
      ...cached,
      [arrayKey]: updatedList,
      data: updatedList,
      count: updatedList.length,
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
    const existingList = Array.isArray(cached[arrayKey])
      ? cached[arrayKey]
      : Array.isArray(cached.data)
      ? cached.data
      : [];
    const updatedList = existingList.map((item) =>
      item._id === itemId || item.id === itemId ? { ...item, ...updatedFields } : item
    );
    await setCachedData(endpoint, {
      ...cached,
      [arrayKey]: updatedList,
      data: updatedList,
    });
    return updatedList.find((i) => i._id === itemId || i.id === itemId);
  } catch (e) {
    console.error('[optimisticUpdate error]', e);
  }
};

export const optimisticDelete = async (endpoint, arrayKey, itemId) => {
  try {
    const cached = (await getCachedData(endpoint)) || {};
    const existingList = Array.isArray(cached[arrayKey])
      ? cached[arrayKey]
      : Array.isArray(cached.data)
      ? cached.data
      : [];
    const updatedList = existingList.filter((item) => item._id !== itemId && item.id !== itemId);
    await setCachedData(endpoint, {
      ...cached,
      [arrayKey]: updatedList,
      data: updatedList,
      count: Math.max(0, updatedList.length),
    });
  } catch (e) {
    console.error('[optimisticDelete error]', e);
  }
};

// Local Registered Accounts for Offline Access
export const saveRegisteredAccount = async (account) => {
  try {
    const existing = (await getItem(SAFE_REGISTERED_ACCOUNTS)) || [];
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
    await saveItem(SAFE_REGISTERED_ACCOUNTS, filtered);
  } catch (e) {
    console.error('[saveRegisteredAccount error]', e);
  }
};

export const findRegisteredAccount = async (email) => {
  try {
    if (!email) return null;
    const existing = (await getItem(SAFE_REGISTERED_ACCOUNTS)) || [];
    const normalizedEmail = email.trim().toLowerCase();
    return existing.find((a) => (a.email || '').trim().toLowerCase() === normalizedEmail) || null;
  } catch (e) {
    console.error('[findRegisteredAccount error]', e);
    return null;
  }
};

export const updateRegisteredAccount = async (email, updatedFields) => {
  try {
    if (!email) return;
    const existing = (await getItem(SAFE_REGISTERED_ACCOUNTS)) || [];
    const normalizedEmail = email.trim().toLowerCase();
    const index = existing.findIndex((a) => (a.email || '').trim().toLowerCase() === normalizedEmail);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updatedFields, updatedAt: Date.now() };
      await saveItem(SAFE_REGISTERED_ACCOUNTS, existing);
    }
  } catch (e) {
    console.error('[updateRegisteredAccount error]', e);
  }
};

// Offline Mutation Queue Helpers (Placed here to break circular dependencies)
export const getOfflineQueue = async () => {
  try {
    const queue = await getItem(SAFE_OFFLINE_QUEUE);
    return Array.isArray(queue) ? queue : [];
  } catch (e) {
    console.error('[getOfflineQueue error]', e);
    return [];
  }
};

export const queueOfflineAction = async (action) => {
  try {
    const queue = await getOfflineQueue();
    const actionItem = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      retries: 0,
      ...action,
    };
    queue.push(actionItem);
    await saveItem(SAFE_OFFLINE_QUEUE, queue);
    return actionItem;
  } catch (e) {
    console.error('[queueOfflineAction error]', e);
    return null;
  }
};

export const removeQueueItem = async (actionId) => {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== actionId);
    await saveItem(SAFE_OFFLINE_QUEUE, filtered);
    return filtered;
  } catch (e) {
    console.error('[removeQueueItem error]', e);
  }
};

export const clearOfflineQueue = async () => {
  await saveItem(SAFE_OFFLINE_QUEUE, []);
};

// Seed High-Fidelity Demo Data matching controller responses
export const seedDemoData = async () => {
  const existingSkills = await getCachedData('/api/skills');
  if (!existingSkills || (!existingSkills.data?.length && !existingSkills.skills?.length)) {
    const demoSkills = [
      { _id: 'demo_s1', name: 'React Native & Mobile App Dev', category: 'Mobile Dev', skillLevel: 'Advanced', targetHours: 60, practicedHours: 45, progress: 75, progressPercent: 75, notes: 'Building full-stack mobile applications' },
      { _id: 'demo_s2', name: 'Node.js & Express REST APIs', category: 'Web Dev', skillLevel: 'Intermediate', targetHours: 50, practicedHours: 35, progress: 70, progressPercent: 70, notes: 'Backend architecture and microservices' },
      { _id: 'demo_s3', name: 'MongoDB Atlas & Database Design', category: 'Data Science', skillLevel: 'Intermediate', targetHours: 40, practicedHours: 30, progress: 75, progressPercent: 75, notes: 'Schema indexing, aggregation pipelines' },
      { _id: 'demo_s4', name: 'UI/UX & Product Design', category: 'Design & UI/UX', skillLevel: 'Advanced', targetHours: 30, practicedHours: 24, progress: 80, progressPercent: 80, notes: 'Design systems, Figma, user flows' },
      { _id: 'demo_s5', name: 'Machine Learning & AI Foundations', category: 'Data Science', skillLevel: 'Intermediate', targetHours: 40, practicedHours: 25, progress: 62, progressPercent: 62, notes: 'Supervised learning, neural networks' },
    ];
    await setCachedData('/api/skills', {
      success: true,
      count: demoSkills.length,
      data: demoSkills,
      skills: demoSkills,
    });

    const demoTasks = [
      { _id: 'demo_t1', task: 'Compile Final Android APK on EAS', title: 'Compile Final Android APK on EAS', day: 'Monday', date: new Date().toISOString().split('T')[0], time: '10:00 AM', priority: 'High', status: 'Completed', deadline: '2026-09-25' },
      { _id: 'demo_t2', task: 'Prepare Internal Exam Practical Review', title: 'Prepare Internal Exam Practical Review', day: 'Wednesday', date: new Date().toISOString().split('T')[0], time: '02:00 PM', priority: 'High', status: 'In Progress', deadline: '2026-09-26' },
      { _id: 'demo_t3', task: 'Review MongoDB Atlas Connection Strings', title: 'Review MongoDB Atlas Connection Strings', day: 'Thursday', date: new Date().toISOString().split('T')[0], time: '04:00 PM', priority: 'Medium', status: 'Completed', deadline: '2026-09-27' },
      { _id: 'demo_t4', task: 'Academic Project Presentation & Seminar', title: 'Academic Project Presentation & Seminar', day: 'Friday', date: new Date().toISOString().split('T')[0], time: '11:30 AM', priority: 'High', status: 'Pending', deadline: '2026-09-28' },
    ];
    await setCachedData('/api/planner', {
      success: true,
      count: demoTasks.length,
      data: demoTasks,
      tasks: demoTasks,
    });

    const demoTimetable = [
      { _id: 'demo_tt1', day: 'Monday', startTime: '09:00 AM', endTime: '10:00 AM', period: 'Period 1 (09:00 - 10:00)', subject: 'Mobile App Architecture', room: 'Lab 3', classroom: 'Lab 3', faculty: 'Dr. Ramesh' },
      { _id: 'demo_tt2', day: 'Monday', startTime: '10:15 AM', endTime: '11:15 AM', period: 'Period 2 (10:15 - 11:15)', subject: 'Database Management Systems', room: 'Hall 204', classroom: 'Hall 204', faculty: 'Prof. Anitha' },
      { _id: 'demo_tt3', day: 'Tuesday', startTime: '09:00 AM', endTime: '10:00 AM', period: 'Period 1 (09:00 - 10:00)', subject: 'Cloud Computing & DevOps', room: 'Lab 1', classroom: 'Lab 1', faculty: 'Dr. Suresh' },
      { _id: 'demo_tt4', day: 'Wednesday', startTime: '11:30 AM', endTime: '12:30 PM', period: 'Period 3 (11:30 - 12:30)', subject: 'Computer Networks & Security', room: 'Seminar Hall', classroom: 'Seminar Hall', faculty: 'Prof. Vignesh' },
    ];
    await setCachedData('/api/timetable', {
      success: true,
      data: demoTimetable,
      timetable: demoTimetable,
    });

    const demoInternals = [
      { _id: 'demo_ie1', subject: 'Mobile App Development', examType: 'Mid-Term Exam', examDate: '2026-10-05', startTime: '09:30 AM', endTime: '11:30 AM', maxMarks: 50, marksObtained: 46, room: 'Exam Hall A', roomNumber: 'Exam Hall A', semester: 'Semester 5', syllabus: 'Units 1 - 3: Components, Navigation, Offline Sync' },
      { _id: 'demo_ie2', subject: 'Database Engineering', examType: 'Unit Test 1', examDate: '2026-10-12', startTime: '02:00 PM', endTime: '03:30 PM', maxMarks: 50, marksObtained: 44, room: 'Exam Hall B', roomNumber: 'Exam Hall B', semester: 'Semester 5', syllabus: 'Relational & NoSQL Schema Design, MongoDB Aggregations' },
    ];
    await setCachedData('/api/internal-exams', {
      success: true,
      count: demoInternals.length,
      data: demoInternals,
      internalExams: demoInternals,
      nextExamId: 'demo_ie1',
    });

    const demoExternals = [
      { _id: 'demo_ee1', subject: 'Cloud & Distributed Systems', examType: 'Semester Final', examDate: '2026-11-20', startTime: '10:00 AM', endTime: '01:00 PM', room: 'Main Campus Exam Center', syllabus: 'Full Syllabus (Modules 1 - 5)', centerName: 'Main Campus Exam Center', hallTicketNumber: 'HT-2026-8891' },
      { _id: 'demo_ee2', subject: 'Advanced Mobile Computing', examType: 'University Theory', examDate: '2026-11-24', startTime: '10:00 AM', endTime: '01:00 PM', room: 'Main Campus Exam Center', syllabus: 'React Native, Hermes, Native Bridges, SQLite & AsyncStorage', centerName: 'Main Campus Exam Center', hallTicketNumber: 'HT-2026-8891' },
    ];
    await setCachedData('/api/external-exams', {
      success: true,
      count: demoExternals.length,
      data: demoExternals,
      externalExams: demoExternals,
      nextExamId: 'demo_ee1',
    });

    const demoExpenses = [
      { _id: 'demo_ex1', itemName: 'Server Hosting & Domain Renewal', title: 'Server Hosting & Domain Renewal', category: 'Software & Tools', amount: 1200, date: '2026-09-15', paymentMethod: 'UPI' },
      { _id: 'demo_ex2', itemName: 'Mobile Dev Reference Handbook', title: 'Mobile Dev Reference Handbook', category: 'Academic & Books', amount: 650, date: '2026-09-10', paymentMethod: 'Card' },
      { _id: 'demo_ex3', itemName: 'Team Strategy Lunch & Coffee', title: 'Team Strategy Lunch & Coffee', category: 'Food & Cafeteria', amount: 480, date: '2026-09-08', paymentMethod: 'UPI' },
    ];
    await setCachedData('/api/expenses', {
      success: true,
      count: demoExpenses.length,
      data: demoExpenses,
      expenses: demoExpenses,
      totalAmount: 2330,
      categoryBreakdown: {
        'Software & Tools': 1200,
        'Academic & Books': 650,
        'Food & Cafeteria': 480,
      },
    });

    const demoSessions = [
      { _id: 'demo_ps1', skillId: 'demo_s1', skillName: 'React Native & Mobile App Dev', durationMinutes: 60, date: new Date().toISOString(), notes: 'Built offline persistence layer & storage helpers' },
      { _id: 'demo_ps2', skillId: 'demo_s2', skillName: 'Node.js & Express REST APIs', durationMinutes: 45, date: new Date(Date.now() - 86400000).toISOString(), notes: 'Implemented JWT auth with MongoDB Atlas' },
      { _id: 'demo_ps3', skillId: 'demo_s3', skillName: 'MongoDB Atlas & Database Design', durationMinutes: 50, date: new Date(Date.now() - 172800000).toISOString(), notes: 'Designed compound indexes and schemas' },
    ];
    await setCachedData('/api/practice', {
      success: true,
      data: demoSessions,
      sessions: demoSessions,
      totalHours: '48.0',
    });

    const demoAchievements = [
      { _id: 'demo_ach1', key: 'FIRST_SKILL', title: 'Skill Pioneer', description: 'Created your first skill tracker profile', isUnlocked: true, unlockedAt: '2026-09-01' },
      { _id: 'demo_ach2', key: 'FIRST_PRACTICE', title: 'Practice Starter', description: 'Logged your first timed practice session', isUnlocked: true, unlockedAt: '2026-09-05' },
      { _id: 'demo_ach3', key: 'TASK_MASTER', title: 'Task Finisher', description: 'Completed 5 weekly tasks', isUnlocked: true, unlockedAt: '2026-09-10' },
      { _id: 'demo_ach4', key: 'STREAK_7', title: '7-Day Streak', description: 'Kept consistent practice for 7 days in a row', isUnlocked: true, unlockedAt: '2026-09-15' },
      { _id: 'demo_ach5', key: 'HOURS_50', title: '50-Hour Master', description: 'Logged 50 cumulative hours of practice', isUnlocked: false },
      { _id: 'demo_ach6', key: 'EXAM_ACE', title: 'Exam Ready', description: 'Added both Internal and External exam schedules', isUnlocked: true, unlockedAt: '2026-09-18' },
      { _id: 'demo_ach7', key: 'ACADEMIC_TOPPER', title: 'Academic Scholar', description: 'Consistently completed all academic planner tasks', isUnlocked: true, unlockedAt: '2026-09-20' },
    ];
    await setCachedData('/api/achievements', {
      success: true,
      data: demoAchievements,
      unlockedCount: 6,
      totalCount: 7,
    });

    const demoDashboard = {
      overallProgress: 75,
      date: new Date().toISOString().split('T')[0],
      skills: {
        total: 5,
        averageProgress: 74,
        list: demoSkills,
      },
      practice: {
        todayMinutes: 60,
        totalHours: '48.0',
      },
      tasks: {
        total: 4,
        completed: 2,
        pending: 2,
      },
      classes: {
        todayCount: 2,
        todayList: [demoTimetable[0], demoTimetable[1]],
      },
      exams: {
        nextInternal: demoInternals[0],
        allUpcomingInternal: demoInternals,
        nextExternal: demoExternals[0],
        allUpcomingExternal: demoExternals,
      },
      expenses: {
        monthTotal: 2330,
        count: 3,
      },
      achievements: {
        unlocked: 6,
        total: 7,
      },
    };

    await setCachedData('/api/progress/dashboard', {
      success: true,
      data: demoDashboard,
      ...demoDashboard,
    });
  }
};

export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(SAFE_CACHE_PREFIX));
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
  updateRegisteredAccount,
  getOfflineQueue,
  queueOfflineAction,
  removeQueueItem,
  clearOfflineQueue,
  seedDemoData,
  clearAllCache,
};
