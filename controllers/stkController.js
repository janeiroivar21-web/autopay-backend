const swiftService = require("../services/swiftService");
const transactionService = require("../services/transactionService");
const { success, error } = require("../utils/response");
const admin = require("firebase-admin");
const db = admin.firestore();

async function stkPush(req, res) {

    console.log("===== STK REQUEST START =====");
    console.log("Request Body:", req.body);

    try {
        const {
    uid,
    phone,
    amount,
    balanceType
} = req.body;

    console.log("STEP 1: Fields received");
console.log({
    uid,
    phone,
    amount,
    balanceType
});

if (!uid || !phone || !amount || !balanceType) {
    return error(res, "Missing required fields.", 400);
}

/*
=========================================
CALCULATE SERVICE FEE
(Till Number - No Wallet API Check)
=========================================
*/

console.log("STEP 2: Skipping Wallet API Check");

const requiredFee = Number(amount) * 0.08;

console.log("STEP 3: Loading Merchant");

const userDoc = await db.collection("users").doc(uid).get();

console.log("Merchant Exists:", userDoc.exists);

if (!userDoc.exists) {
    return error(res, "Merchant not found.", 404);
}

const merchant = userDoc.data();

if (!merchant.merchantId) {
    return error(res, "Merchant ID not found.", 400);
}

console.log("STEP 4: Sending STK Push");
        
const result = await swiftService.stkPush(
    phone,
    amount,
    null,
    merchant.fullName || "AUTOPAY Customer"
);
        
        const checkoutRequestId =
            result.checkout_request_id ||
            result.CheckoutRequestID ||
            result.checkoutRequestId;

        if (!checkoutRequestId) {
    return error(
        res,
        "SwiftWallet did not return Checkout Request ID.",
        500
    );
    }

        const merchantRequestId =
            result.merchant_request_id ||
            result.MerchantRequestID ||
            result.merchantRequestId;

        /*
        =========================================
        CREATE PENDING TRANSACTION
        =========================================
        */

        await transactionService.saveTransaction({

    uid,

    merchantId: merchant.merchantId,

    phone,

    amount: Number(amount),

    serviceFee: requiredFee,

    checkoutRequestId,

    merchantRequestId,

    status: "PENDING",

    type: "Deposit",

    balanceType

});

        return success(
            res,
            "STK Push sent successfully.",
            {

                checkout_request_id:
                    checkoutRequestId,

                merchant_request_id:
                    merchantRequestId,

                status: "PENDING",

                data: result

            }

        );

    } catch (err) {

    console.error("STK Controller Error:");
    console.error(err.response?.data || err.stack || err);

    return res.status(500).json({
        success: false,
        message: err.message,
        swift_error: err.response?.data || null
    });

}

}

module.exports = {
    stkPush
};
