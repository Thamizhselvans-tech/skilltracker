const mongoose = require('mongoose');

const plannerTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    task: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD format for straightforward daily/weekly aggregation
      required: [true, 'Task date is required'],
      index: true,
    },
    time: {
      type: String, // e.g. "14:30"
      default: '',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    category: {
      type: String,
      default: 'General',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    reminder: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

plannerTaskSchema.index({ userId: 1, date: 1, status: 1 });

module.exports = mongoose.model('PlannerTask', plannerTaskSchema, 'plannerTasks');
