const express = require('express');
const { body } = require('express-validator');
const queryController = require('../controllers/queryController');
const router = express.Router();

// Define the query route with validation
router.post(
  '/query',
  [
    body('bucket').notEmpty().withMessage('Bucket is required'),
    body('measurement').notEmpty().withMessage('Measurement is required'),
    body('field').notEmpty().withMessage('Field is required'),
    body('timeRange.start').isISO8601().withMessage('Valid start time is required'),
    body('timeRange.stop').isISO8601().withMessage('Valid stop time is required')
  ],
  queryController.executeQuery
);

module.exports = router;
