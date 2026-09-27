const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: 'award',
    },
    category: {
      type: String,
      default: 'General',
    },
    isUnlocked: {
      type: Boolean,
      default: false,
    },
    unlockedAt: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
    },
    target: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

achievementSchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema, 'achievements');
