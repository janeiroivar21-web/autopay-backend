const optimaService = require("../services/optimaService");
const transactionService = require("../services/transactionService");
const { error } = require("../utils/response");

async function checkStatus(req, res) {

    try {

        let {
    checkout_request_id,
    uid,
    balanceType
} = req.body;

if (!checkout_request_id) {
    return error(
        res,
        "checkout_request_id is required.",
        400
    );
}

// If uid is missing, identify merchant from API Key
if (!uid) {

    const admin = require("firebase-admin");
    const db = admin.firestore();

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

    if (keyData.uid) {

        uid = keyData.uid;

    } else {

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

        uid = userSnap.docs[0].id;

        await keyDoc.ref.update({
            uid
        });

    }

    }

        const result = await optimaService.checkStatus(checkout_request_id);

if (!result.success) {
    return error(
        res,
        result.message || "Transaction not found.",
        404
    );
}

const transactionData = {
    status: result.status,
    amount: result.amount,
    phone_number: result.phone,
    transaction_code: result.transaction_code
};

        const transaction =
            await transactionService.getTransaction(checkout_request_id);

        /*
        =========================================
        PAYMENT SUCCESS
        =========================================
        */
        if (transactionData.status === "completed") {

    // Don't update the transaction or wallet here.
    // The webhook will handle the wallet credit and transaction update.

        }

        /*
=========================================
PAYMENT FAILED / CANCELLED
=========================================
*/

if (
    transactionData.status === "failed" ||
    transactionData.status === "cancelled" ||
    transactionData.status === "cancelled_by_user"
) {

    await transactionService.updateTransaction(
        checkout_request_id,
        {
            status: "failed"
        }
    );

    }

        return res.json({
    success: true,
    status: transactionData.status,
    checkout_request_id,
    amount: transactionData.amount,
    phone: transactionData.phone_number,
    transaction
});

    } catch (err) {

        console.error(err);

        return error(res, "Unable to check payment status.");

    }

}

module.exports = {
    checkStatus
};
