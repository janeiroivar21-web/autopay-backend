const express = require("express");
const router = express.Router();

const {
    webhook
} = require("../controllers/webhookController");

// POST /api/webhook
router.post("/", webhook);

module.exports = router;
