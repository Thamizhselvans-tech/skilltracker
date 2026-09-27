const Skill = require('../models/Skill');
const PracticeSession = require('../models/PracticeSession');
const PlannerTask = require('../models/PlannerTask');
const ClassTimetable = require('../models/ClassTimetable');
const InternalExam = require('../models/InternalExam');
const ExternalExam = require('../models/ExternalExam');
const Expense = require('../models/Expense');
const Achievement = require('../models/Achievement');
const { syncAchievements } = require('../utils/achievementsEngine');

// @desc    Get aggregated dashboard & progress data
// @route   GET /api/progress/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = daysOfWeek[today.getDay()];
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

    // 1. Skills
    const skills = await Skill.find({ userId });
    const totalSkills = skills.length;
    const avgSkillProgress =
      totalSkills > 0
        ? Math.round(skills.reduce((acc, s) => acc + (s.progress || 0), 0) / totalSkills)
        : 0;

    // 2. Practice
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const todaySessions = await PracticeSession.find({
      userId,
      date: { $gte: startOfToday },
    });
    const todayPracticeMinutes = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    const allSessions = await PracticeSession.find({ userId }).select('durationMinutes');
    const totalPracticeHours = (
      allSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60
    ).toFixed(1);

    // 3. Weekly Planner
    const tasks = await PlannerTask.find({ userId });
    const completedTasksCount = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasksCount = tasks.filter((t) => t.status !== 'Completed').length;

    // 4. Upcoming Classes (for today)
    const todayClasses = await ClassTimetable.find({
      userId,
      day: currentDayName,
    }).sort({ startTime: 1 });

    // 5. Internal & External Exams
    const upcomingInternal = await InternalExam.find({
      userId,
      examDate: { $gte: todayStr },
    })
      .sort({ examDate: 1, startTime: 1 })
      .limit(3);

    const upcomingExternal = await ExternalExam.find({
      userId,
      examDate: { $gte: todayStr },
    })
      .sort({ examDate: 1, startTime: 1 })
      .limit(3);

    // 6. Expenses this month
    const monthlyExpenses = await Expense.find({
      userId,
      date: { $regex: `^${currentMonthPrefix}` },
    });
    const monthlyExpenseTotal = monthlyExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    // 7. Achievements
    await syncAchievements(userId);
    const achievements = await Achievement.find({ userId });
    const unlockedAchievements = achievements.filter((a) => a.isUnlocked).length;

    // 8. Overall Progress Score (composite 0-100)
    const taskScore = tasks.length > 0 ? (completedTasksCount / tasks.length) * 30 : 15;
    const skillScore = (avgSkillProgress / 100) * 40;
    const achievementScore = achievements.length > 0 ? (unlockedAchievements / achievements.length) * 30 : 15;
    const overallProgress = Math.min(100, Math.round(taskScore + skillScore + achievementScore));

    return res.json({
      success: true,
      data: {
        date: todayStr,
        day: currentDayName,
        skills: {
          total: totalSkills,
          averageProgress: avgSkillProgress,
          list: skills.slice(0, 5),
        },
        practice: {
          todayMinutes: todayPracticeMinutes,
          totalHours: totalPracticeHours,
        },
        tasks: {
          total: tasks.length,
          completed: completedTasksCount,
          pending: pendingTasksCount,
          todayPending: tasks.filter((t) => t.date === todayStr && t.status !== 'Completed'),
        },
        classes: {
          todayCount: todayClasses.length,
          todayList: todayClasses,
        },
        exams: {
          nextInternal: upcomingInternal[0] || null,
          allUpcomingInternal: upcomingInternal,
          nextExternal: upcomingExternal[0] || null,
          allUpcomingExternal: upcomingExternal,
        },
        expenses: {
          monthTotal: monthlyExpenseTotal,
          count: monthlyExpenses.length,
        },
        achievements: {
          unlocked: unlockedAchievements,
          total: achievements.length,
        },
        overallProgress,
      },
    });
  } catch (error) {
    console.error('[Dashboard Progress Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardData };
