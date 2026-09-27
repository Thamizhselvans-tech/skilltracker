const Achievement = require('../models/Achievement');
const Skill = require('../models/Skill');
const PracticeSession = require('../models/PracticeSession');
const PlannerTask = require('../models/PlannerTask');

const ACHIEVEMENT_DEFINITIONS = [
  {
    key: 'FIRST_SKILL',
    title: 'First Step',
    description: 'Add your very first skill to track',
    icon: 'star',
    category: 'Skill',
    target: 1,
    calculateProgress: async (userId) => {
      const count = await Skill.countDocuments({ userId });
      return count;
    },
  },
  {
    key: 'SKILL_BUILDER',
    title: 'Skill Builder',
    description: 'Track 5 or more active skills',
    icon: 'layers',
    category: 'Skill',
    target: 5,
    calculateProgress: async (userId) => {
      const count = await Skill.countDocuments({ userId });
      return count;
    },
  },
  {
    key: 'FIRST_PRACTICE',
    title: 'First Practice',
    description: 'Complete your first practice session with timer',
    icon: 'clock',
    category: 'Practice',
    target: 1,
    calculateProgress: async (userId) => {
      const count = await PracticeSession.countDocuments({ userId });
      return count;
    },
  },
  {
    key: 'PRACTICE_CHAMPION',
    title: 'Practice Champion',
    description: 'Log at least 10 practice sessions',
    icon: 'zap',
    category: 'Practice',
    target: 10,
    calculateProgress: async (userId) => {
      const count = await PracticeSession.countDocuments({ userId });
      return count;
    },
  },
  {
    key: 'TASK_MASTER',
    title: 'Task Master',
    description: 'Complete 5 tasks in your weekly planner',
    icon: 'check-circle',
    category: 'Productivity',
    target: 5,
    calculateProgress: async (userId) => {
      const count = await PlannerTask.countDocuments({ userId, status: 'Completed' });
      return count;
    },
  },
  {
    key: 'STREAK_7_DAYS',
    title: '7-Day Streak',
    description: 'Log activity across 7 distinct practice sessions',
    icon: 'flame',
    category: 'Consistency',
    target: 7,
    calculateProgress: async (userId) => {
      const sessions = await PracticeSession.find({ userId }).select('date');
      const uniqueDays = new Set(
        sessions.map((s) => new Date(s.date).toISOString().split('T')[0])
      );
      return uniqueDays.size;
    },
  },
  {
    key: 'CONSISTENT_LEARNER',
    title: 'Consistent Learner',
    description: 'Accumulate at least 5 total hours (300 mins) of practice',
    icon: 'award',
    category: 'Mastery',
    target: 300,
    calculateProgress: async (userId) => {
      const sessions = await PracticeSession.find({ userId }).select('durationMinutes');
      const totalMinutes = sessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
      return totalMinutes;
    },
  },
];

const syncAchievements = async (userId) => {
  try {
    const results = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const progress = await def.calculateProgress(userId);
      const isUnlocked = progress >= def.target;

      let achievement = await Achievement.findOne({ userId, key: def.key });

      if (!achievement) {
        achievement = new Achievement({
          userId,
          key: def.key,
          title: def.title,
          description: def.description,
          icon: def.icon,
          category: def.category,
          target: def.target,
          progress: Math.min(progress, def.target),
          isUnlocked,
          unlockedAt: isUnlocked ? new Date() : null,
        });
      } else {
        achievement.progress = Math.min(progress, def.target);
        if (isUnlocked && !achievement.isUnlocked) {
          achievement.isUnlocked = true;
          achievement.unlockedAt = new Date();
        }
      }

      await achievement.save();
      results.push(achievement);
    }

    return results;
  } catch (error) {
    console.error('[Achievements Sync Error]', error.message);
    return [];
  }
};

module.exports = { syncAchievements, ACHIEVEMENT_DEFINITIONS };
