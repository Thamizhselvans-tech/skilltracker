const express = require('express');
const router = express.Router();
const {
  getExternalExams,
  getExternalExamById,
  createExternalExam,
  updateExternalExam,
  deleteExternalExam,
} = require('../controllers/externalExamController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getExternalExams).post(createExternalExam);
router
  .route('/:id')
  .get(getExternalExamById)
  .put(updateExternalExam)
  .delete(deleteExternalExam);

module.exports = router;
