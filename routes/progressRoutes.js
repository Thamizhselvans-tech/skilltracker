const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardData);

module.exports = router;
