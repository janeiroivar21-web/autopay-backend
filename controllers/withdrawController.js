const axios = require("axios");

const withdrawalService = require("../services/withdrawalService");
const transactionService = require("../services/transactionService");
const walletService = require("../services/walletService");
const { generateReference } = require("../utils/reference");
const { success, error } = require("../utils/response");

const {
    users,
    settings
} = require("../services/firestoreService");

async function withdraw(req, res) {

    try {

        const {
            uid,
            phone,
            amount
        } = req.body;

        if (!uid || !phone || !amount) {

            return error(res, "Missing required fields.", 400);

        }

        const amountNum = Number(amount);

if (amountNum < 50) {
    return error(res, "Minimum withdrawal amount is KES 50.", 400);
}

const withdrawalFee = Number((amountNum * 0.11).toFixed(2));

const payoutAmount = Number(
    (amountNum - withdrawalFee).toFixed(2)
);

// Prevent invalid payout amounts
if (payoutAmount <= 0) {
    return error(
        res,
        "The withdrawal amount is too low after deducting the withdrawal fee.",
        400
    );
}

// Deduct only what the user entered
const totalDeduction = amountNum;

const reference = generateReference("WD");

        /*
=========================================
GLOBAL WITHDRAWAL SETTINGS
=========================================
*/

const settingsDoc = await settings.doc("withdrawals").get();

if (settingsDoc.exists) {

    const config = settingsDoc.data();

    if (config.enabled === false) {

        return error(
            res,
            config.message ||
            "Withdrawals are currently disabled.",
            403
        );

    }

}

/*
=========================================
MERCHANT
=========================================
*/

const userRef = users.doc(uid);

const userSnap = await userRef.get();

if (!userSnap.exists) {
    return error(res, "Merchant not found.", 404);
}

const merchant = userSnap.data();

/*
=========================================
MERCHANT WITHDRAWAL LOCK
=========================================
*/

if (merchant.withdrawalBlocked === true) {

    return error(
        res,
        merchant.withdrawalReason ||
        "Your withdrawal access has been disabled.",
        403
    );

}

const walletBalance = Number(
    merchant.walletBalance || 0
);

if (walletBalance < totalDeduction) {
    return error(
        res,
        `Insufficient Wallet Balance. Required KES ${totalDeduction}.`,
        400
    );
}

const hashback = await axios.post(
    "https://api.hashback.co.ke/V2/processwithdrawal",
    {
        api_key: process.env.HASHBACK_API_KEY,
        msisdn: phone,
        amount: payoutAmount,
        SecurityCredential:
            process.env.HASHBACK_SECURITY_CREDENTIAL
    },
    {
        headers: {
            "Content-Type": "application/json"
        }
    }
);

if (!hashback.data.success) {
    return error(
        res,
        hashback.data.message || "Withdrawal failed.",
        400
    );
}

await walletService.deductWallet(uid, totalDeduction);

await withdrawalService.saveWithdrawal({

    uid,
    merchantId: merchant.merchantId || "",
    phone,
    amount: amountNum,
    fee: withdrawalFee,
    payoutAmount: payoutAmount,
    totalDeduction,
    reference,
    providerReference:
        hashback.data.details?.reference ||
        hashback.data.reference ||
        hashback.data.transactionReference ||
        null,
    status: "Completed"

});

/*
=========================================
SAVE TO TRANSACTIONS
=========================================
*/

await transactionService.saveTransaction({

    uid,

    merchantId: merchant.merchantId || "",

    gateway: "hashback",

    reference,

    checkoutRequestId: reference,

    merchantRequestId:
        hashback.data.details?.reference ||
        hashback.data.reference ||
        hashback.data.transactionReference ||
        null,

    phone,

    amount: amountNum,

    status: "SUCCESS",

    type: "Withdrawal",

    balanceType: "withdrawal",

    fee: withdrawalFee,

    payoutAmount,

    createdAt: new Date()

});

return success(
    res,
    "Withdrawal completed successfully.",
    {
        reference,
        providerReference:
            hashback.data.details?.reference ||
            hashback.data.reference ||
            hashback.data.transactionReference ||
            null,
        status: "Completed",
        amount: amountNum,
        fee: withdrawalFee,
        payoutAmount,
        totalDeduction,
        provider: "HashBack"
    }
);
    } catch (err) {

        console.error(err);

        return error(res, "Withdrawal failed.");

    }

}

module.exports = {
    withdraw
};
