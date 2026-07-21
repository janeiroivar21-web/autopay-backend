const walletService = require("../services/walletService");
const transactionService = require("../services/transactionService");
const { success, error } = require("../utils/response");

/*
=========================================
OPTIMAPAY WEBHOOK
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

        if (data.status !== "SUCCESS") {

            return success(res, "Webhook received.");

        }

        if (data.balanceType === "wallet") {

            await walletService.topupWallet(
                data.uid,
                data.amount
            );

        } else if (data.balanceType === "service") {

            await walletService.topupService(
                data.uid,
                data.amount
            );

        }

        await transactionService.saveTransaction({

            uid: data.uid,

            phone: data.phone,

            amount: data.amount,

            transactionId: data.transactionId,

            status: data.status,

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
