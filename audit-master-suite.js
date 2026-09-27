const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = 'http://localhost:5000';

// Helper for HTTP requests
async function runRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Calculator safe evaluator logic (matching mobile/app/(drawer)/calculator.jsx)
function safeEvaluate(expr) {
  try {
    if (!expr || expr.trim() === '') return '';
    let sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
    const tokens = [];
    let currentNumber = '';

    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i];
      if (/[0-9.]/.test(char)) {
        currentNumber += char;
      } else if (['+', '-', '*', '/', '%'].includes(char)) {
        if (currentNumber !== '') {
          tokens.push(parseFloat(currentNumber));
          currentNumber = '';
        } else if (char === '-' && (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string')) {
          currentNumber = '-';
          continue;
        }
        tokens.push(char);
      }
    }
    if (currentNumber !== '') tokens.push(parseFloat(currentNumber));
    if (tokens.length === 0) return '';

    // Pass 1: Percentages
    const percentageResolved = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '%') {
        if (percentageResolved.length > 0 && typeof percentageResolved[percentageResolved.length - 1] === 'number') {
          const prevNum = percentageResolved.pop();
          percentageResolved.push(prevNum / 100);
        }
      } else {
        percentageResolved.push(tokens[i]);
      }
    }

    // Pass 2: Multiplication and Division
    const mulDivResolved = [];
    let i = 0;
    while (i < percentageResolved.length) {
      const token = percentageResolved[i];
      if (token === '*' || token === '/') {
        const prev = mulDivResolved.pop();
        const next = percentageResolved[i + 1];
        if (typeof prev !== 'number' || typeof next !== 'number') return 'Error';
        if (token === '*') {
          mulDivResolved.push(prev * next);
        } else {
          if (next === 0) return 'Cannot divide by 0';
          mulDivResolved.push(prev / next);
        }
        i += 2;
      } else {
        mulDivResolved.push(token);
        i++;
      }
    }

    // Pass 3: Addition and Subtraction
    if (mulDivResolved.length === 0) return '';
    let finalVal = typeof mulDivResolved[0] === 'number' ? mulDivResolved[0] : 0;
    let j = 1;
    while (j < mulDivResolved.length) {
      const op = mulDivResolved[j];
      const next = mulDivResolved[j + 1];
      if (typeof next !== 'number') break;
      if (op === '+') finalVal += next;
      else if (op === '-') finalVal -= next;
      j += 2;
    }
    return Number.isInteger(finalVal) ? String(finalVal) : String(parseFloat(finalVal.toFixed(6)));
  } catch (e) {
    return 'Error';
  }
}

async function runMasterAudit() {
  console.log('\n=============================================================');
  console.log('  SKILLTRACKER MASTER AUDIT & E2E VERIFICATION SUITE');
  console.log('  Target: Live MongoDB Atlas Cluster');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;
  const auditLog = [];

  function record(module, action, condition, message) {
    if (condition) {
      console.log(`✅ [${module}] PASS: ${action} - ${message}`);
      passed++;
      auditLog.push({ module, action, status: 'PASS', message });
    } else {
      console.error(`❌ [${module}] FAIL: ${action} - ${message}`);
      failed++;
      auditLog.push({ module, action, status: 'FAIL', message });
    }
  }

  try {
    // -------------------------------------------------------------
    // MODULE 1: Health & Database Connection
    // -------------------------------------------------------------
    const healthRes = await runRequest('GET', '/api/health');
    record('Health', 'READ', healthRes.status === 200 && healthRes.body.status === 'ok' && healthRes.body.database === 'connected', 'Server is healthy & connected to MongoDB Atlas');

    // -------------------------------------------------------------
    // MODULE 2: Authentication & Profile (User 1)
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const user1Email = `student1_${timestamp}@college.edu`;
    const user1Pass = 'Pass@12345';
    const regRes = await runRequest('POST', '/api/auth/register', {
      name: 'Priya Raman',
      email: user1Email,
      phone: '+91 9876543210',
      password: user1Pass,
      confirmPassword: user1Pass,
      college: 'Anna University',
      department: 'Computer Science',
      year: '3rd Year',
    });
    record('Auth', 'CREATE (Register)', regRes.status === 201 && regRes.body.token && regRes.body.user.email === user1Email, 'User 1 registered and saved in Atlas');
    let token1 = regRes.body.token;
    let user1Id = regRes.body.user.id;
    let authHeader1 = { Authorization: `Bearer ${token1}` };

    // Login
    const loginRes = await runRequest('POST', '/api/auth/login', {
      email: user1Email,
      password: user1Pass,
    });
    record('Auth', 'READ (Login)', loginRes.status === 200 && loginRes.body.token, 'User 1 logged in successfully');

    // Profile (Me)
    const meRes = await runRequest('GET', '/api/auth/me', null, authHeader1);
    record('Profile', 'READ', meRes.status === 200 && meRes.body.user.name === 'Priya Raman', 'User 1 profile retrieved correctly');

    // Update Profile
    const updateProfRes = await runRequest('PUT', '/api/auth/me', {
      bio: 'Aspiring Full Stack Engineer & Cloud Architect',
      phone: '+91 9123456780',
    }, authHeader1);
    record('Profile', 'UPDATE', updateProfRes.status === 200 && updateProfRes.body.user.bio === 'Aspiring Full Stack Engineer & Cloud Architect', 'User 1 profile bio updated');

    // Change Password
    const newPass = 'NewPass@54321';
    const changePassRes = await runRequest('PUT', '/api/auth/change-password', {
      currentPassword: user1Pass,
      newPassword: newPass,
      confirmPassword: newPass,
    }, authHeader1);
    record('Auth', 'UPDATE (Password)', changePassRes.status === 200 && changePassRes.body.token, 'Password changed successfully');
    token1 = changePassRes.body.token;
    authHeader1.Authorization = `Bearer ${token1}`;

    // Verify login with new password
    const loginNewRes = await runRequest('POST', '/api/auth/login', {
      email: user1Email,
      password: newPass,
    });
    record('Auth', 'VERIFY (New Password)', loginNewRes.status === 200 && loginNewRes.body.token, 'Authenticated with new password');

    // -------------------------------------------------------------
    // MODULE 3: User Isolation Verification (User 2)
    // -------------------------------------------------------------
    const user2Email = `student2_${timestamp}@college.edu`;
    const reg2Res = await runRequest('POST', '/api/auth/register', {
      name: 'Karthik Raja',
      email: user2Email,
      phone: '+91 9876543211',
      password: 'User2Pass@123',
      confirmPassword: 'User2Pass@123',
      college: 'IIT Madras',
      department: 'ECE',
      year: '2nd Year',
    });
    if (reg2Res.status !== 201) console.log('REG2 FAILED:', reg2Res.status, reg2Res.body);
    record('Isolation', 'CREATE (User 2)', reg2Res.status === 201 && reg2Res.body.token, 'User 2 created for multi-tenant isolation tests');
    const token2 = reg2Res.body.token;
    const authHeader2 = { Authorization: `Bearer ${token2}` };

    // -------------------------------------------------------------
    // MODULE 4: Skills CRUD & User Isolation
    // -------------------------------------------------------------
    const skillRes = await runRequest('POST', '/api/skills', {
      name: 'Data Structures & Algorithms',
      category: 'Computer Science',
      description: 'Mastering Trees, Graphs, and DP',
      skillLevel: 'Intermediate',
      progress: 40,
      targetHours: 60,
    }, authHeader1);
    record('Skills', 'CREATE', skillRes.status === 201 && skillRes.body.data._id, 'Skill created for User 1 in Atlas');
    const skillId = skillRes.body.data._id;

    // READ Skills
    const getSkillsRes = await runRequest('GET', '/api/skills', null, authHeader1);
    record('Skills', 'READ', getSkillsRes.status === 200 && getSkillsRes.body.data.some(s => s._id === skillId), 'Skill read for User 1');

    // User Isolation: User 2 must NOT see User 1's skill
    const user2SkillsRes = await runRequest('GET', '/api/skills', null, authHeader2);
    record('Isolation', 'READ Isolation', user2SkillsRes.status === 200 && !user2SkillsRes.body.data.some(s => s._id === skillId), 'User 2 cannot see User 1 skill');

    // UPDATE Skill
    const updateSkillRes = await runRequest('PUT', `/api/skills/${skillId}`, {
      progress: 55,
      skillLevel: 'Advanced',
    }, authHeader1);
    record('Skills', 'UPDATE', updateSkillRes.status === 200 && updateSkillRes.body.data.progress === 55, 'Skill progress updated to 55%');

    // User Isolation: User 2 must NOT be able to update User 1's skill
    const user2UpdateSkill = await runRequest('PUT', `/api/skills/${skillId}`, { progress: 99 }, authHeader2);
    record('Isolation', 'UPDATE Isolation', user2UpdateSkill.status === 404 || user2UpdateSkill.status === 403, 'User 2 rejected when attempting to modify User 1 skill');

    // -------------------------------------------------------------
    // MODULE 5: Practice Sessions CRUD & Skill Auto-Sync
    // -------------------------------------------------------------
    const practiceRes = await runRequest('POST', '/api/practice', {
      skillId: skillId,
      durationMinutes: 90,
      notes: 'Solved 4 LeetCode Graph BFS/DFS problems',
      progressIncrement: 5,
    }, authHeader1);
    record('Practice', 'CREATE', practiceRes.status === 201 && practiceRes.body.data._id, 'Practice session logged in Atlas');
    const practiceId = practiceRes.body.data._id;

    // READ Practice
    const getPracticeRes = await runRequest('GET', '/api/practice', null, authHeader1);
    record('Practice', 'READ', getPracticeRes.status === 200 && getPracticeRes.body.data.some(p => p._id === practiceId), 'Practice sessions listed for User 1');

    // UPDATE Practice
    const updatePracticeRes = await runRequest('PUT', `/api/practice/${practiceId}`, {
      notes: 'Solved 5 LeetCode Graph BFS/DFS & Dijkstra problems',
    }, authHeader1);
    record('Practice', 'UPDATE', updatePracticeRes.status === 200 && updatePracticeRes.body.data.notes.includes('Dijkstra'), 'Practice session notes updated');

    // -------------------------------------------------------------
    // MODULE 6: Weekly Planner CRUD
    // -------------------------------------------------------------
    const todayStr = new Date().toISOString().split('T')[0];
    const taskRes = await runRequest('POST', '/api/planner', {
      task: 'Submit Operating Systems Lab Assignment 4',
      date: todayStr,
      time: '11:00 AM',
      priority: 'High',
      status: 'Pending',
      category: 'Academic',
    }, authHeader1);
    record('Planner', 'CREATE', taskRes.status === 201 && taskRes.body.data._id, 'Planner task created in Atlas');
    const taskId = taskRes.body.data._id;

    // READ Planner
    const getPlannerRes = await runRequest('GET', '/api/planner', null, authHeader1);
    record('Planner', 'READ', getPlannerRes.status === 200 && getPlannerRes.body.data.some(t => t._id === taskId), 'Planner tasks listed');

    // UPDATE Planner (mark complete)
    const updateTaskRes = await runRequest('PUT', `/api/planner/${taskId}`, {
      status: 'Completed',
    }, authHeader1);
    record('Planner', 'UPDATE', updateTaskRes.status === 200 && updateTaskRes.body.data.status === 'Completed', 'Task status updated to Completed');

    // -------------------------------------------------------------
    // MODULE 7: College Timetable CRUD
    // -------------------------------------------------------------
    const timetableRes = await runRequest('POST', '/api/timetable', {
      subject: 'Compiler Design',
      day: 'Tuesday',
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      room: 'CS-Lab 2',
      faculty: 'Dr. Subramanian',
    }, authHeader1);
    record('Timetable', 'CREATE', timetableRes.status === 201 && timetableRes.body.data._id, 'Timetable entry created in Atlas');
    const timetableId = timetableRes.body.data._id;

    // READ Timetable
    const getTimetableRes = await runRequest('GET', '/api/timetable', null, authHeader1);
    record('Timetable', 'READ', getTimetableRes.status === 200 && getTimetableRes.body.data.some(t => t._id === timetableId), 'Timetable entries retrieved');

    // UPDATE Timetable
    const updateTtRes = await runRequest('PUT', `/api/timetable/${timetableId}`, {
      room: 'CS-Auditorium A',
    }, authHeader1);
    record('Timetable', 'UPDATE', updateTtRes.status === 200 && updateTtRes.body.data.room === 'CS-Auditorium A', 'Timetable room updated');

    // -------------------------------------------------------------
    // MODULE 8: Internal Exams CRUD & Validation
    // -------------------------------------------------------------
    // Validation rejection test
    const invalidIntRes = await runRequest('POST', '/api/internal-exams', {
      subject: 'Invalid Time Exam',
      examType: 'Internal Assessment 1',
      examDate: todayStr,
      startTime: '02:00 PM',
      endTime: '01:00 PM', // invalid!
    }, authHeader1);
    record('InternalExams', 'VALIDATE', invalidIntRes.status === 400, 'Rejects internal exam when endTime <= startTime (HTTP 400)');

    // Valid creation
    const intExamRes = await runRequest('POST', '/api/internal-exams', {
      subject: 'Object Oriented Software Engineering',
      examType: 'Internal Assessment 2',
      examDate: todayStr,
      startTime: '09:30 AM',
      endTime: '11:00 AM',
      room: 'Hall 301',
      semester: 'Semester 5',
    }, authHeader1);
    record('InternalExams', 'CREATE', intExamRes.status === 201 && intExamRes.body.data._id, 'Internal exam created in Atlas');
    const intExamId = intExamRes.body.data._id;

    // READ Internal Exams
    const getIntExamsRes = await runRequest('GET', '/api/internal-exams', null, authHeader1);
    record('InternalExams', 'READ', getIntExamsRes.status === 200 && getIntExamsRes.body.data.some(e => e._id === intExamId), 'Internal exams list retrieved with next exam');

    // UPDATE Internal Exam
    const updateIntRes = await runRequest('PUT', `/api/internal-exams/${intExamId}`, {
      room: 'Hall 305 (Updated)',
    }, authHeader1);
    record('InternalExams', 'UPDATE', updateIntRes.status === 200 && updateIntRes.body.data.room === 'Hall 305 (Updated)', 'Internal exam room updated');

    // -------------------------------------------------------------
    // MODULE 9: External Exams CRUD & Validation
    // -------------------------------------------------------------
    // Validation rejection test
    const invalidExtRes = await runRequest('POST', '/api/external-exams', {
      subject: 'Invalid Theory Final',
      examType: 'University Theory',
      examDate: '2026-11-20',
      startTime: '04:00 PM',
      endTime: '02:00 PM', // invalid!
    }, authHeader1);
    record('ExternalExams', 'VALIDATE', invalidExtRes.status === 400, 'Rejects external exam when endTime <= startTime (HTTP 400)');

    // Valid creation
    const extExamRes = await runRequest('POST', '/api/external-exams', {
      subject: 'Microprocessors & Microcontrollers',
      examType: 'University Theory Final',
      examDate: '2026-11-22',
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      room: 'Main Exam Center',
      semester: 'Semester 5',
    }, authHeader1);
    record('ExternalExams', 'CREATE', extExamRes.status === 201 && extExamRes.body.data._id, 'External exam created in Atlas');
    const extExamId = extExamRes.body.data._id;

    // READ External Exams
    const getExtExamsRes = await runRequest('GET', '/api/external-exams', null, authHeader1);
    record('ExternalExams', 'READ', getExtExamsRes.status === 200 && getExtExamsRes.body.data.some(e => e._id === extExamId), 'External exams list retrieved');

    // UPDATE External Exam
    const updateExtRes = await runRequest('PUT', `/api/external-exams/${extExamId}`, {
      notes: 'Calculator allowed for Part B',
    }, authHeader1);
    record('ExternalExams', 'UPDATE', updateExtRes.status === 200 && updateExtRes.body.data.notes.includes('Calculator'), 'External exam notes updated');

    // -------------------------------------------------------------
    // MODULE 10: Expenses CRUD
    // -------------------------------------------------------------
    const expenseRes = await runRequest('POST', '/api/expenses', {
      itemName: 'Compiler Design Textbook & Reference Material',
      amount: 650,
      category: 'Books & Supplies',
      date: todayStr,
      paymentMethod: 'UPI',
    }, authHeader1);
    record('Expenses', 'CREATE', expenseRes.status === 201 && expenseRes.body.data._id && expenseRes.body.data.amount === 650, 'Expense item created in Atlas');
    const expenseId = expenseRes.body.data._id;

    // READ Expenses
    const getExpensesRes = await runRequest('GET', '/api/expenses', null, authHeader1);
    record('Expenses', 'READ', getExpensesRes.status === 200 && getExpensesRes.body.totalAmount >= 650, 'Expenses retrieved with aggregate totalAmount');

    // UPDATE Expense
    const updateExpRes = await runRequest('PUT', `/api/expenses/${expenseId}`, {
      amount: 720,
    }, authHeader1);
    record('Expenses', 'UPDATE', updateExpRes.status === 200 && updateExpRes.body.data.amount === 720, 'Expense amount updated');

    // -------------------------------------------------------------
    // MODULE 11: Progress Dashboard (Aggregated from Real DB Data)
    // -------------------------------------------------------------
    const progressRes = await runRequest('GET', '/api/progress/dashboard', null, authHeader1);
    record('Progress', 'READ', progressRes.status === 200 && progressRes.body.data.skills.total >= 1 && progressRes.body.data.overallProgress > 0, 'Aggregate progress dashboard calculated');

    // -------------------------------------------------------------
    // MODULE 12: Achievements Engine
    // -------------------------------------------------------------
    const achieveRes = await runRequest('GET', '/api/achievements', null, authHeader1);
    record('Achievements', 'READ', achieveRes.status === 200 && Array.isArray(achieveRes.body.data) && achieveRes.body.data.length >= 6, 'Achievements auto-evaluated from user activity');

    // -------------------------------------------------------------
    // MODULE 13: Local Safe Math Calculator Engine
    // -------------------------------------------------------------
    record('Calculator', 'EVALUATE', safeEvaluate('25 + 75') === '100', 'Addition (25 + 75 = 100)');
    record('Calculator', 'EVALUATE', safeEvaluate('100 - 35') === '65', 'Subtraction (100 - 35 = 65)');
    record('Calculator', 'EVALUATE', safeEvaluate('12 × 8') === '96', 'Multiplication (12 × 8 = 96)');
    record('Calculator', 'EVALUATE', safeEvaluate('144 ÷ 12') === '12', 'Division (144 ÷ 12 = 12)');
    record('Calculator', 'EVALUATE', safeEvaluate('10 + 20 × 3') === '70', 'Operator precedence (10 + 20 × 3 = 70)');
    record('Calculator', 'EVALUATE', safeEvaluate('200 × 15%') === '30', 'Percentage calculation (200 × 15% = 30)');
    record('Calculator', 'EVALUATE', safeEvaluate('50 ÷ 0') === 'Cannot divide by 0', 'Divide-by-zero protection handled gracefully');
    record('Calculator', 'EVALUATE', safeEvaluate('-15 + 25') === '10', 'Negative number handling (-15 + 25 = 10)');

    // -------------------------------------------------------------
    // MODULE 14: Offline Queue & Sync Simulation
    // -------------------------------------------------------------
    const tempId = `temp_offline_${Date.now()}`;
    const queuedAction = {
      endpoint: '/api/planner',
      method: 'POST',
      body: {
        task: 'Offline Created Revision Task',
        date: todayStr,
        time: '08:00 PM',
        priority: 'Medium',
        status: 'Pending',
      },
      tempId: tempId,
      collectionKey: 'tasks',
    };

    // Replay queued action to backend
    const syncRes = await runRequest(queuedAction.method, queuedAction.endpoint, queuedAction.body, authHeader1);
    record('Sync', 'REPLAY', syncRes.status === 201 && syncRes.body.data._id, 'Queued offline action successfully replayed & persisted to Atlas');
    const realSyncedId = syncRes.body.data?._id;

    // Verify item exists on server with real ID
    const verifySyncRes = await runRequest('GET', `/api/planner`, null, authHeader1);
    record('Sync', 'RECONCILE', verifySyncRes.status === 200 && verifySyncRes.body.data.some(t => t._id === realSyncedId), 'Real MongoDB _id assigned and verified in collection');

    // -------------------------------------------------------------
    // MODULE 15: DELETE Operations Across All Modules
    // -------------------------------------------------------------
    // 1. Delete Practice Session
    const delPractice = await runRequest('DELETE', `/api/practice/${practiceId}`, null, authHeader1);
    record('Practice', 'DELETE', delPractice.status === 200, 'Practice session deleted from Atlas');

    // 2. Delete Skill
    const delSkill = await runRequest('DELETE', `/api/skills/${skillId}`, null, authHeader1);
    record('Skills', 'DELETE', delSkill.status === 200, 'Skill deleted from Atlas');

    // 3. Delete Planner Task
    const delTask = await runRequest('DELETE', `/api/planner/${taskId}`, null, authHeader1);
    record('Planner', 'DELETE', delTask.status === 200, 'Planner task deleted from Atlas');

    // 4. Delete Timetable Entry
    const delTt = await runRequest('DELETE', `/api/timetable/${timetableId}`, null, authHeader1);
    record('Timetable', 'DELETE', delTt.status === 200, 'Timetable entry deleted from Atlas');

    // 5. Delete Internal Exam
    const delInt = await runRequest('DELETE', `/api/internal-exams/${intExamId}`, null, authHeader1);
    record('InternalExams', 'DELETE', delInt.status === 200, 'Internal exam deleted from Atlas');

    // 6. Delete External Exam
    const delExt = await runRequest('DELETE', `/api/external-exams/${extExamId}`, null, authHeader1);
    record('ExternalExams', 'DELETE', delExt.status === 200, 'External exam deleted from Atlas');

    // 7. Delete Expense Item
    const delExp = await runRequest('DELETE', `/api/expenses/${expenseId}`, null, authHeader1);
    record('Expenses', 'DELETE', delExp.status === 200, 'Expense item deleted from Atlas');

    // Clean up offline-created task
    if (realSyncedId) {
      await runRequest('DELETE', `/api/planner/${realSyncedId}`, null, authHeader1);
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`  MASTER AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed === 0) {
      console.log('🎉 100% OF TESTED MODULES PASSED WITH REAL MONGODB ATLAS PERSISTENCE!\n');
      process.exit(0);
    } else {
      console.error(`⚠️ ${failed} tests failed during master audit.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Master Audit Fatal Error:', err);
    process.exit(1);
  }
}

runMasterAudit();
