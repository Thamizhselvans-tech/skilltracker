const mongoose = require('mongoose');

const externalExamSchema = new mongoose.Schema(
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
    examType: {
      type: String,
      required: [true, 'Exam type is required (e.g. University Theory, Practical Lab, Viva)'],
      trim: true,
    },
    examDate: {
      type: String, // YYYY-MM-DD
      required: [true, 'Exam date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    room: {
      type: String,
      default: '',
      trim: true,
    },
    semester: {
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

externalExamSchema.index({ userId: 1, examDate: 1 });
externalExamSchema.index({ userId: 1, semester: 1 });

module.exports = mongoose.model('ExternalExam', externalExamSchema, 'externalExams');
