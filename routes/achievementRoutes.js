const express = require('express');
const router = express.Router();
const { getAchievements } = require('../controllers/achievementController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getAchievements);

module.exports = router;
