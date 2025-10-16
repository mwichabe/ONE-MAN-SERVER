const express = require( 'express');
const { sendContactEmail } = require('../Controllers/contactController');

const router = express.Router();

// Public route to handle contact form submission
router.route('/').post(sendContactEmail);

module.exports = router;