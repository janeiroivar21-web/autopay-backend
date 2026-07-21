const express = require("express");
const router = express.Router();

const { withdraw } = require("../controllers/withdrawController");

// POST /api/withdraw
router.post("/", withdraw);

module.exports = router;
