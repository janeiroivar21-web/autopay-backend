const express = require("express");
const router = express.Router();

const { stkPush } = require("../controllers/stkController");

// POST /api/stk-push
router.post("/", stkPush);

module.exports = router;
