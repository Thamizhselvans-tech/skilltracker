const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const http = require('http');

let token = '';
let testUserId = '';
let testSkillId = '';
let testInternalExamId = '';
let testExternalExamId = '';
let testClientId = '';
let testMemberId = '';
let testProjectId = '';

const BASE_URL = 'http://localhost:5000';

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

async function runTests() {
  console.log('\n--- STARTING SKILL TRACKER API INTEGRATION TESTS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Wait briefly for server to be ready
    await new Promise((r) => setTimeout(r, 1500));

    // 1. Health check
    const health = await runRequest('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'Health Check');

    // 2. Auth: Register
    const randomEmail = `student_${Date.now()}@college.edu`;
    const regRes = await runRequest('POST', '/api/auth/register', {
      name: 'Alex Johnson',
      email: randomEmail,
      phone: '+1 555-0199',
      password: 'password123',
      confirmPassword: 'password123',
      college: 'MIT Institute of Technology',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
    });
    assert(regRes.status === 201 && regRes.body.token, 'Register new user');
    token = regRes.body.token;
    testUserId = regRes.body.user.id;

    const authHeader = { Authorization: `Bearer ${token}` };

    // 3. Auth: Login
    const loginRes = await runRequest('POST', '/api/auth/login', {
      email: randomEmail,
      password: 'password123',
    });
    assert(loginRes.status === 200 && loginRes.body.token, 'Login existing user');

    // 4. Auth: Me
    const meRes = await runRequest('GET', '/api/auth/me', null, authHeader);
    assert(meRes.status === 200 && meRes.body.user.name === 'Alex Johnson', 'Get current user profile');

    // 4b. Auth: Change Password
    const changePassRes = await runRequest('PUT', '/api/auth/change-password', {
      currentPassword: 'password123',
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123',
    }, authHeader);
    assert(changePassRes.status === 200 && changePassRes.body.token, 'Change password successfully');
    token = changePassRes.body.token;
    authHeader.Authorization = `Bearer ${token}`;

    // Verify login with new password
    const loginNewRes = await runRequest('POST', '/api/auth/login', {
      email: randomEmail,
      password: 'NewPassword@123',
    });
    assert(loginNewRes.status === 200 && loginNewRes.body.token, 'Login with newly changed password');

    // 5. Skills: Create Skill
    const skillRes = await runRequest(
      'POST',
      '/api/skills',
      {
        name: 'React Native & Mobile App Dev',
        category: 'Mobile Dev',
        description: 'Building mobile applications with React Native and Expo SDK 54',
        skillLevel: 'Intermediate',
        progress: 35,
        targetDate: '2026-12-31',
        notes: 'Targeting app store release by end of semester',
      },
      authHeader
    );
    assert(skillRes.status === 201 && skillRes.body.data._id, 'Create new skill');
    testSkillId = skillRes.body.data._id;

    // 6. Skills: Get skills
    const getSkillsRes = await runRequest('GET', '/api/skills', null, authHeader);
    assert(getSkillsRes.status === 200 && getSkillsRes.body.count >= 1, 'Get user skills');

    // 7. Practice Sessions: Create
    const practiceRes = await runRequest(
      'POST',
      '/api/practice',
      {
        skillId: testSkillId,
        durationMinutes: 45,
        notes: 'Implemented Drawer Navigation and Hamburger Menu in Expo Router',
        progressIncrement: 5,
      },
      authHeader
    );
    assert(practiceRes.status === 201 && practiceRes.body.data.durationMinutes === 45, 'Log practice session');
    const testPracticeId = practiceRes.body.data._id;

    // 7b. Practice Sessions: Update
    const updatePracticeRes = await runRequest(
      'PUT',
      `/api/practice/${testPracticeId}`,
      {
        durationMinutes: 60,
        notes: 'Updated: Implemented complete responsive drawer navigation',
      },
      authHeader
    );
    assert(
      updatePracticeRes.status === 200 && updatePracticeRes.body.data.durationMinutes === 60,
      'Update practice session (PUT /api/practice/:id)'
    );

    // 8. Weekly Planner: Create Task
    const todayStr = new Date().toISOString().split('T')[0];
    const taskRes = await runRequest(
      'POST',
      '/api/planner',
      {
        task: 'Complete Database Systems Assignment 3',
        date: todayStr,
        time: '14:00',
        priority: 'High',
        category: 'Academic',
        description: 'Write B+ tree index questions and SQL query optimization',
        status: 'Pending',
        reminder: true,
      },
      authHeader
    );
    assert(taskRes.status === 201 && taskRes.body.data._id, 'Create planner task');

    // 9. College Timetable: Create Entry
    const timetableRes = await runRequest(
      'POST',
      '/api/timetable',
      {
        subject: 'Distributed Systems',
        day: 'Monday',
        startTime: '10:00 AM',
        endTime: '11:30 AM',
        faculty: 'Dr. Sarah Connor',
        room: 'Hall B-204',
        notes: 'Bring laptop with Docker installed',
      },
      authHeader
    );
    assert(timetableRes.status === 201 && timetableRes.body.data.subject === 'Distributed Systems', 'Create timetable entry');

    // 10. Internal Exams: CRUD
    const intExamRes = await runRequest(
      'POST',
      '/api/internal-exams',
      {
        subject: 'Algorithms & Data Structures',
        examType: 'Mid-Term 1',
        examDate: todayStr,
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        room: 'LH-101',
        semester: 'Semester 5',
        notes: 'Covers Graphs, Dynamic Programming, and Greedy Algorithms',
      },
      authHeader
    );
    assert(intExamRes.status === 201 && intExamRes.body.data._id, 'Create internal exam');
    testInternalExamId = intExamRes.body.data._id;

    const getIntExamRes = await runRequest('GET', '/api/internal-exams', null, authHeader);
    assert(
      getIntExamRes.status === 200 && getIntExamRes.body.data.length >= 1,
      'Get internal exams with next exam highlighted'
    );

    const updateIntRes = await runRequest(
      'PUT',
      `/api/internal-exams/${testInternalExamId}`,
      { room: 'LH-102 (Changed)' },
      authHeader
    );
    assert(updateIntRes.status === 200 && updateIntRes.body.data.room === 'LH-102 (Changed)', 'Update internal exam');

    // 10b. Internal Exam Time Validation (Reject endTime <= startTime)
    const invalidIntRes = await runRequest(
      'POST',
      '/api/internal-exams',
      {
        subject: 'Invalid Time Exam',
        examType: 'Mid-Term 1',
        examDate: todayStr,
        startTime: '11:00 AM',
        endTime: '09:00 AM',
      },
      authHeader
    );
    assert(invalidIntRes.status === 400, 'Internal exam rejects endTime before startTime (400)');

    // 11. External Exams: CRUD
    const extExamRes = await runRequest(
      'POST',
      '/api/external-exams',
      {
        subject: 'Operating Systems University Final',
        examType: 'University Theory',
        examDate: '2026-11-15',
        startTime: '02:00 PM',
        endTime: '05:00 PM',
        room: 'Exam Center Hall 3',
        semester: 'Semester 5',
        notes: 'Carry university hall ticket and photo ID',
      },
      authHeader
    );
    assert(extExamRes.status === 201 && extExamRes.body.data._id, 'Create external exam');
    testExternalExamId = extExamRes.body.data._id;

    // 11b. External Exam Time Validation (Reject endTime <= startTime)
    const invalidExtRes = await runRequest(
      'POST',
      '/api/external-exams',
      {
        subject: 'Invalid Time Exam',
        examType: 'University Theory',
        examDate: '2026-11-15',
        startTime: '05:00 PM',
        endTime: '02:00 PM',
      },
      authHeader
    );
    assert(invalidExtRes.status === 400, 'External exam rejects endTime before startTime (400)');

    const getExtExamRes = await runRequest('GET', '/api/external-exams', null, authHeader);
    assert(getExtExamRes.status === 200 && getExtExamRes.body.data.length >= 1, 'Get external exams');

    // 12. Expenses: CRUD
    const expenseRes = await runRequest(
      'POST',
      '/api/expenses',
      {
        itemName: 'Cloud Hosting Subscription (MongoDB Atlas & AWS)',
        amount: 24.99,
        category: 'Software',
        date: todayStr,
        paymentMethod: 'Credit Card',
        notes: 'Monthly backend cluster staging tier',
      },
      authHeader
    );
    assert(expenseRes.status === 201 && expenseRes.body.data.amount === 24.99, 'Create expense item');

    const getExpensesRes = await runRequest('GET', '/api/expenses', null, authHeader);
    assert(getExpensesRes.status === 200 && getExpensesRes.body.totalAmount > 0, 'Get expenses with category breakdown');

    // 13. Progress Dashboard: Aggregate real metrics
    const progDashRes = await runRequest('GET', '/api/progress/dashboard', null, authHeader);
    assert(
      progDashRes.status === 200 &&
        progDashRes.body.data.skills.total >= 1 &&
        progDashRes.body.data.overallProgress > 0,
      'Get aggregate progress dashboard data'
    );

    // 15. Achievements: Synced and evaluated
    const achieveRes = await runRequest('GET', '/api/achievements', null, authHeader);
    assert(
      achieveRes.status === 200 && achieveRes.body.data.length >= 7,
      'Calculate and retrieve user achievements'
    );

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed === 0) {
      console.log('🎉 ALL BACKEND APIs TESTED AND WORKING PERFECTLY!\n');
      process.exit(0);
    } else {
      console.error('⚠️ Some tests failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
