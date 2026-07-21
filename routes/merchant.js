const express = require("express");
const router = express.Router();

const {
    getMerchant,
    updateMerchant,
    createPaymentAccount,
    getPaymentAccounts
} = require("../controllers/merchantController");

/*
=========================================
MERCHANT PROFILE
=========================================
*/

// GET /api/merchant/:uid
router.get("/:uid", getMerchant);

// PUT /api/merchant/:uid
router.put("/:uid", updateMerchant);

/*
=========================================
PAYMENT ACCOUNTS
=========================================
*/

// POST /api/merchant/account
router.post("/account", createPaymentAccount);

// GET /api/merchant/accounts/:uid
router.get("/accounts/:uid", getPaymentAccounts);

module.exports = router;
