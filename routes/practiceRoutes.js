const express = require('express');
const router = express.Router();
const {
  getPracticeSessions,
  createPracticeSession,
  updatePracticeSession,
  deletePracticeSession,
} = require('../controllers/practiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getPracticeSessions).post(createPracticeSession);
router.route('/:id').put(updatePracticeSession).delete(deletePracticeSession);

module.exports = router;
