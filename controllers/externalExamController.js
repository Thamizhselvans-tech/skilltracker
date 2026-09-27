const ExternalExam = require('../models/ExternalExam');

// @desc    Get all external exams with search and filters
// @route   GET /api/external-exams
// @access  Private
const getExternalExams = async (req, res) => {
  try {
    const { search, semester, examType, date } = req.query;
    const query = { userId: req.user._id };

    if (search) {
      query.subject = { $regex: search, $options: 'i' };
    }
    if (semester && semester !== 'All') {
      query.semester = semester;
    }
    if (examType && examType !== 'All') {
      query.examType = examType;
    }
    if (date) {
      query.examDate = date;
    }

    const exams = await ExternalExam.find(query).sort({ examDate: 1, startTime: 1 });

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingExams = exams.filter((e) => e.examDate >= todayStr);
    const nextExam = upcomingExams.length > 0 ? upcomingExams[0] : null;

    return res.json({
      success: true,
      count: exams.length,
      nextExamId: nextExam ? nextExam._id : null,
      data: exams,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single external exam
// @route   GET /api/external-exams/:id
// @access  Private
const getExternalExamById = async (req, res) => {
  try {
    const exam = await ExternalExam.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'External exam not found' });
    }
    return res.json({ success: true, data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const cleaned = timeStr.trim();
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const modifier = match12[3] ? match12[3].toUpperCase() : null;
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return null;
};

// @desc    Create new external exam
// @route   POST /api/external-exams
// @access  Private
const createExternalExam = async (req, res) => {
  try {
    const { subject, examType, examDate, startTime, endTime, room, semester, notes } = req.body;

    if (!subject || !examType || !examDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Subject, exam type, exam date, start time, and end time are required',
      });
    }

    const startMins = parseTimeToMinutes(startTime);
    const endMins = parseTimeToMinutes(endTime);
    if (startMins !== null && endMins !== null && endMins <= startMins) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    const exam = await ExternalExam.create({
      userId: req.user._id,
      subject,
      examType,
      examDate,
      startTime,
      endTime,
      room: room || '',
      semester: semester || '',
      notes: notes || '',
    });

    return res.status(201).json({ success: true, data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update external exam
// @route   PUT /api/external-exams/:id
// @access  Private
const updateExternalExam = async (req, res) => {
  try {
    const exam = await ExternalExam.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'External exam not found or unauthorized' });
    }

    const { subject, examType, examDate, startTime, endTime, room, semester, notes } = req.body;

    const checkStart = startTime || exam.startTime;
    const checkEnd = endTime || exam.endTime;
    const startMins = parseTimeToMinutes(checkStart);
    const endMins = parseTimeToMinutes(checkEnd);
    if (startMins !== null && endMins !== null && endMins <= startMins) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    if (subject) exam.subject = subject;
    if (examType) exam.examType = examType;
    if (examDate) exam.examDate = examDate;
    if (startTime) exam.startTime = startTime;
    if (endTime) exam.endTime = endTime;
    if (room !== undefined) exam.room = room;
    if (semester !== undefined) exam.semester = semester;
    if (notes !== undefined) exam.notes = notes;

    await exam.save();
    return res.json({ success: true, data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete external exam
// @route   DELETE /api/external-exams/:id
// @access  Private
const deleteExternalExam = async (req, res) => {
  try {
    const exam = await ExternalExam.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'External exam not found or unauthorized' });
    }
    return res.json({ success: true, message: 'External exam deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExternalExams,
  getExternalExamById,
  createExternalExam,
  updateExternalExam,
  deleteExternalExam,
};
