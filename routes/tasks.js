const express = require('express');
const router = express.Router();
const { getTasks } = require('../controllers/taskController');

// GET /api/tasks?q=search&status=todo&page=1&limit=10&sort=-createdAt
router.get('/', getTasks);

module.exports = router;
