const optimaService = require("../services/optimaService");
const transactionService = require("../services/transactionService");
const { success, error } = require("../utils/response");
const admin = require("firebase-admin");
const db = admin.firestore();

async function stkPush(req, res) {

    console.log("===== STK REQUEST START =====");
    console.log("Request Body:", req.body);

    try {
        let {
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

if (!phone || !amount || !balanceType) {
    return error(
        res,
        "phone, amount and balanceType are required.",
        400
    );
}

// If uid is missing, identify merchant from API Key
if (!uid) {

    const authHeader = req.headers.authorization;

if (!authHeader) {
    return error(
        res,
        "Authorization header is required.",
        401
    );
}

const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : authHeader.trim();
    const keySnap = await db
    .collection("apiKeys")
    .where("secretKey", "==", apiKey)
    .limit(1)
    .get();

if (keySnap.empty) {
    return error(
        res,
        "Invalid API key.",
        401
    );
}

const keyDoc = keySnap.docs[0];
const keyData = keyDoc.data();

if (keyData.status !== "Active") {
    return error(
        res,
        "API key is inactive.",
        401
    );
}

// New API keys already contain uid
if (keyData.uid) {

    uid = keyData.uid;

} else {

    // Old API keys: locate merchant using merchantId
    const userSnap = await db
        .collection("users")
        .where("merchantId", "==", keyData.merchantId)
        .limit(1)
        .get();

    if (userSnap.empty) {
        return error(
            res,
            "Merchant not found.",
            404
        );
    }

    // Firebase document ID is the uid
    uid = userSnap.docs[0].id;

    // Upgrade old API key automatically
    await keyDoc.ref.update({
        uid
    });

    console.log("API Key upgraded with uid:", uid);

}
    
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

/*
=========================================
SEND STK PUSH (OPTIMAPAY ONLY)
=========================================
*/

console.log("Gateway: OptimaPay");

const result = await optimaService.stkPush(
    phone,
    amount,
    null,
    merchant.fullName || "AUTOPAY Customer"
);

        /*
        =========================================
        CREATE PENDING TRANSACTION
        =========================================
        */

        await transactionService.saveTransaction({

    uid,

    merchantId: merchant.merchantId,

    gateway: "optimapay",

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
        gateway_error: err.response?.data || null
    });

}

}

module.exports = {
    stkPush
};
