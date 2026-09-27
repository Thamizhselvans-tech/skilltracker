const PlannerTask = require('../models/PlannerTask');
const { syncAchievements } = require('../utils/achievementsEngine');

// @desc    Get planner tasks with date / week / priority / status filters
// @route   GET /api/planner
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { date, startDate, endDate, status, priority, search } = req.query;
    const query = { userId: req.user._id };

    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (search) {
      query.task = { $regex: search, $options: 'i' };
    }

    const tasks = await PlannerTask.find(query).sort({ date: 1, time: 1 });
    return res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create planner task
// @route   POST /api/planner
// @access  Private
const createTask = async (req, res) => {
  try {
    const { task, date, time, priority, category, description, status, reminder } = req.body;

    if (!task || !date) {
      return res.status(400).json({ success: false, message: 'Task and date are required' });
    }

    const newTask = await PlannerTask.create({
      userId: req.user._id,
      task,
      date,
      time: time || '',
      priority: priority || 'Medium',
      category: category || 'General',
      description: description || '',
      status: status || 'Pending',
      reminder: Boolean(reminder),
    });

    return res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update planner task
// @route   PUT /api/planner/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const taskItem = await PlannerTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!taskItem) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { task, date, time, priority, category, description, status, reminder } = req.body;

    if (task) taskItem.task = task;
    if (date) taskItem.date = date;
    if (time !== undefined) taskItem.time = time;
    if (priority) taskItem.priority = priority;
    if (category) taskItem.category = category;
    if (description !== undefined) taskItem.description = description;
    if (status) taskItem.status = status;
    if (reminder !== undefined) taskItem.reminder = Boolean(reminder);

    await taskItem.save();

    if (status === 'Completed') {
      syncAchievements(req.user._id).catch((err) => console.error(err));
    }

    return res.json({ success: true, data: taskItem });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete planner task
// @route   DELETE /api/planner/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await PlannerTask.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
