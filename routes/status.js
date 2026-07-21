const express = require("express");
const router = express.Router();

const { checkStatus } = require("../controllers/statusController");

// POST /api/check-status
router.post("/", checkStatus);

module.exports = router;
