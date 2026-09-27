const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Skill category is required'],
      default: 'General',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    targetDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

skillSchema.index({ userId: 1, name: 1 });
skillSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Skill', skillSchema, 'skills');
