const Achievement = require('../models/Achievement');
const { syncAchievements } = require('../utils/achievementsEngine');

// @desc    Get all achievements for user, re-evaluating real activity
// @route   GET /api/achievements
// @access  Private
const getAchievements = async (req, res) => {
  try {
    // Synchronize latest activity-based achievements
    await syncAchievements(req.user._id);

    const achievements = await Achievement.find({ userId: req.user._id }).sort({ isUnlocked: -1, progress: -1 });

    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
    const totalCount = achievements.length;

    return res.json({
      success: true,
      totalCount,
      unlockedCount,
      completionRate: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0,
      data: achievements,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAchievements };
