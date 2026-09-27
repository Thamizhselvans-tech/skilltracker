const ClassTimetable = require('../models/ClassTimetable');

// @desc    Get timetable entries with optional day filter
// @route   GET /api/timetable
// @access  Private
const getTimetable = async (req, res) => {
  try {
    const { day } = req.query;
    const query = { userId: req.user._id };

    if (day && day !== 'All') {
      query.day = day;
    }

    const timetable = await ClassTimetable.find(query).sort({ startTime: 1 });
    return res.json({ success: true, count: timetable.length, data: timetable });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create timetable entry
// @route   POST /api/timetable
// @access  Private
const createTimetableEntry = async (req, res) => {
  try {
    const { subject, day, date, startTime, endTime, faculty, room, notes } = req.body;

    if (!subject || !day || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Subject, Day, Start time, and End time are required',
      });
    }

    const entry = await ClassTimetable.create({
      userId: req.user._id,
      subject,
      day,
      date: date || '',
      startTime,
      endTime,
      faculty: faculty || '',
      room: room || '',
      notes: notes || '',
    });

    return res.status(201).json({ success: true, data: entry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update timetable entry
// @route   PUT /api/timetable/:id
// @access  Private
const updateTimetableEntry = async (req, res) => {
  try {
    const entry = await ClassTimetable.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    const { subject, day, date, startTime, endTime, faculty, room, notes } = req.body;

    if (subject) entry.subject = subject;
    if (day) entry.day = day;
    if (date !== undefined) entry.date = date;
    if (startTime) entry.startTime = startTime;
    if (endTime) entry.endTime = endTime;
    if (faculty !== undefined) entry.faculty = faculty;
    if (room !== undefined) entry.room = room;
    if (notes !== undefined) entry.notes = notes;

    await entry.save();
    return res.json({ success: true, data: entry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete timetable entry
// @route   DELETE /api/timetable/:id
// @access  Private
const deleteTimetableEntry = async (req, res) => {
  try {
    const entry = await ClassTimetable.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }
    return res.json({ success: true, message: 'Timetable entry deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
};
