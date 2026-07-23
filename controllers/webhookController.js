const walletService = require("../services/walletService");
const transactionService = require("../services/transactionService");
const { success, error } = require("../utils/response");

/*
=========================================
SWIFTWALLET WEBHOOK
=========================================
*/
async function webhook(req, res) {

    try {

        const data = req.body;

        console.log("Webhook Received:", data);

        /*
        Expected payload example:

        {
            uid: "merchant_uid",
            phone: "254712345678",
            amount: 1000,
            balanceType: "wallet",
            status: "SUCCESS",
            transactionId: "TXN12345"
        }

        */

        const transaction = await transactionService.getTransaction(
    data.checkout_request_id
);

if (!transaction) {
    return error(res, "Transaction not found.", 404);
}

const transactionData = transaction.data();

// Prevent duplicate processing
if (transactionData.status === "SUCCESS") {
    return success(res, "Transaction already processed.");
}

const uid = transactionData.uid;
const balanceType = transactionData.balanceType;
const serviceFee = transactionData.serviceFee || 0;

if (data.result?.ResultCode !== 0) {

    await transactionService.updateTransaction(
        data.checkout_request_id,
        {
            status: "FAILED"
        }
    );

    return success(res, "Payment failed.");
}
        
if (balanceType === "wallet") {

    await walletService.topupWallet(
        uid,
        Number(data.result.Amount)
    );

    await walletService.deductServiceBalance(
        uid,
        serviceFee
    );

} else if (balanceType === "service") {

    await walletService.topupService(
        uid,
        Number(data.result.Amount)
    );

    }

        await transactionService.updateTransaction(
    data.checkout_request_id,
    {
        status: "SUCCESS",
        amount: Number(data.result.Amount),
        phone: data.result.Phone,
        serviceFee,
        transactionId: data.transaction_id,
        merchantRequestId: data.merchant_request_id
    }
);

        return success(res, "Webhook processed successfully.");

    } catch (err) {

        console.error(err);

        return error(res, "Webhook processing failed.");

    }

}

module.exports = {
    webhook
};
