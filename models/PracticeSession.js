const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    skillName: {
      type: String,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    progressIncrement: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

practiceSessionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('PracticeSession', practiceSessionSchema, 'practiceSessions');
