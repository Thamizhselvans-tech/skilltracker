const express = require('express');
const router = express.Router();
const {
  getInternalExams,
  getInternalExamById,
  createInternalExam,
  updateInternalExam,
  deleteInternalExam,
} = require('../controllers/internalExamController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getInternalExams).post(createInternalExam);
router
  .route('/:id')
  .get(getInternalExamById)
  .put(updateInternalExam)
  .delete(deleteInternalExam);

module.exports = router;
