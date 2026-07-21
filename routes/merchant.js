const express = require("express");
const router = express.Router();

const {
    getMerchant,
    updateMerchant
} = require("../controllers/merchantController");

// GET /api/merchant/:uid
router.get("/:uid", getMerchant);

// PUT /api/merchant/:uid
router.put("/:uid", updateMerchant);

module.exports = router;
