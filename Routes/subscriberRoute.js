const express = require("express");
const router = express.Router();
const { addSubscriber } = require("../Controllers/subscriber");

// POST request to subscribe
router.post("/", addSubscriber);

module.exports = router;