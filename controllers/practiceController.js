const PracticeSession = require('../models/PracticeSession');
const Skill = require('../models/Skill');
const { syncAchievements } = require('../utils/achievementsEngine');

// @desc    Get practice session history
// @route   GET /api/practice
// @access  Private
const getPracticeSessions = async (req, res) => {
  try {
    const { skillId, limit = 50 } = req.query;
    const query = { userId: req.user._id };

    if (skillId) {
      query.skillId = skillId;
    }

    const sessions = await PracticeSession.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(Number(limit));

    // Calculate total hours
    const totalMinutes = sessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return res.json({
      success: true,
      count: sessions.length,
      totalMinutes,
      totalHours,
      data: sessions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log a completed practice session
// @route   POST /api/practice
// @access  Private
const createPracticeSession = async (req, res) => {
  try {
    const { skillId, durationMinutes, notes, progressIncrement, newProgress } = req.body;

    if (!skillId || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'Skill and duration are required' });
    }

    const skill = await Skill.findOne({ _id: skillId, userId: req.user._id });
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    const session = await PracticeSession.create({
      userId: req.user._id,
      skillId: skill._id,
      skillName: skill.name,
      durationMinutes: Number(durationMinutes),
      notes: notes || '',
      progressIncrement: Number(progressIncrement || 0),
      date: new Date(),
    });

    // Optionally update skill progress percentage
    if (newProgress !== undefined && newProgress !== null) {
      skill.progress = Math.min(100, Math.max(0, Number(newProgress)));
      await skill.save();
    } else if (progressIncrement && Number(progressIncrement) > 0) {
      skill.progress = Math.min(100, (skill.progress || 0) + Number(progressIncrement));
      await skill.save();
    }

    // Sync achievements
    syncAchievements(req.user._id).catch((err) => console.error(err));

    return res.status(201).json({
      success: true,
      data: session,
      updatedSkill: skill,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a practice session
// @route   PUT /api/practice/:id
// @access  Private
const updatePracticeSession = async (req, res) => {
  try {
    const { durationMinutes, notes, progressIncrement } = req.body;
    const session = await PracticeSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Practice session not found' });
    }

    if (durationMinutes !== undefined) session.durationMinutes = Number(durationMinutes);
    if (notes !== undefined) session.notes = notes;
    if (progressIncrement !== undefined) session.progressIncrement = Number(progressIncrement);

    await session.save();

    return res.json({
      success: true,
      message: 'Practice session updated successfully',
      data: session,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a practice session
// @route   DELETE /api/practice/:id
// @access  Private
const deletePracticeSession = async (req, res) => {
  try {
    const session = await PracticeSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Practice session not found' });
    }
    return res.json({ success: true, message: 'Practice session deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPracticeSessions,
  createPracticeSession,
  updatePracticeSession,
  deletePracticeSession,
};
