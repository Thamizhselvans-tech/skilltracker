const express = require('express');
const router = express.Router();
const {
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} = require('../controllers/timetableController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getTimetable).post(createTimetableEntry);
router.route('/:id').put(updateTimetableEntry).delete(deleteTimetableEntry);

module.exports = router;
