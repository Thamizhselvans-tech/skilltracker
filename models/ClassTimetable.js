const mongoose = require('mongoose');

const classTimetableSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      index: true,
    },
    date: {
      type: String, // Optional specific date if not recurring
      default: '',
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    faculty: {
      type: String,
      default: '',
      trim: true,
    },
    room: {
      type: String,
      default: '',
      trim: true,
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

classTimetableSchema.index({ userId: 1, day: 1 });

module.exports = mongoose.model('ClassTimetable', classTimetableSchema, 'classTimetables');
