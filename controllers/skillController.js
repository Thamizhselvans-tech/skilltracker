const Skill = require('../models/Skill');
const { syncAchievements } = require('../utils/achievementsEngine');

// @desc    Get all skills for user with search and category filter
// @route   GET /api/skills
// @access  Private
const getSkills = async (req, res) => {
  try {
    const { search, category, skillLevel } = req.query;
    const query = { userId: req.user._id };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (skillLevel && skillLevel !== 'All') {
      query.skillLevel = skillLevel;
    }

    const skills = await Skill.find(query).sort({ updatedAt: -1 });
    return res.json({ success: true, count: skills.length, data: skills });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single skill
// @route   GET /api/skills/:id
// @access  Private
const getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, userId: req.user._id });
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    return res.json({ success: true, data: skill });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new skill
// @route   POST /api/skills
// @access  Private
const createSkill = async (req, res) => {
  try {
    const { name, category, description, skillLevel, progress, targetDate, notes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const skill = await Skill.create({
      userId: req.user._id,
      name,
      category: category || 'General',
      description: description || '',
      skillLevel: skillLevel || 'Beginner',
      progress: progress !== undefined ? Number(progress) : 0,
      targetDate: targetDate || null,
      notes: notes || '',
    });

    // Check & trigger achievements update
    syncAchievements(req.user._id).catch((err) => console.error(err));

    return res.status(201).json({ success: true, data: skill });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update skill
// @route   PUT /api/skills/:id
// @access  Private
const updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, userId: req.user._id });
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    const { name, category, description, skillLevel, progress, targetDate, notes } = req.body;

    if (name) skill.name = name;
    if (category) skill.category = category;
    if (description !== undefined) skill.description = description;
    if (skillLevel) skill.skillLevel = skillLevel;
    if (progress !== undefined) skill.progress = Number(progress);
    if (targetDate !== undefined) skill.targetDate = targetDate;
    if (notes !== undefined) skill.notes = notes;

    await skill.save();
    return res.json({ success: true, data: skill });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete skill
// @route   DELETE /api/skills/:id
// @access  Private
const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found or unauthorized' });
    }
    return res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
};
