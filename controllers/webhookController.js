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

        if (!data.success || data.status !== "completed") {

    return success(res, "Webhook received.");

        }


        const serviceFee = Number(data.result.Amount) * 0.08;
        
        if (data.balanceType === "wallet") {

            await walletService.topupWallet(
    data.uid,
    Number(data.result.Amount)
);

           await walletService.deductServiceBalance(
    data.uid,
    serviceFee
);

        } else if (data.balanceType === "service") {

            await walletService.topupService(
                data.uid,
                data.amount
            );

        }

        await transactionService.saveTransaction({

            uid: data.uid,

            phone: data.result.Phone,

            amount: Number(data.result.Amount),
serviceFee,

            transactionId: data.transaction_id,
            checkoutRequestId: data.checkout_request_id,
            merchantRequestId: data.merchant_request_id,

            status: "SUCCESS",

            type: "Deposit",

            balanceType: data.balanceType

        });

        return success(res, "Webhook processed successfully.");

    } catch (err) {

        console.error(err);

        return error(res, "Webhook processing failed.");

    }

}

module.exports = {
    webhook
};
