const fetch = require("node-fetch");

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

        console.log("========== OPTIMAPAY WEBHOOK ==========");
        console.log(JSON.stringify(data, null, 2));

        if (!data.reference) {
            return error(res, "Missing transaction reference.", 400);
        }

        const transaction =
            await transactionService.getTransactionByReference(
                data.reference
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

        /*
        =========================================
        PAYMENT FAILED
        =========================================
        */

        if (
            data.status !== "success" &&
            data.status !== "completed"
        ) {

            await transaction.ref.update({
                status: "FAILED"
            });

            return success(res, "Payment failed.");
        }

        /*
        =========================================
        UPDATE TRANSACTION
        =========================================
        */

        await transaction.ref.update({

            status: "SUCCESS",

            amount: Number(data.amount),

            phone: data.phone,

            transactionId: data.transaction_id,

            mpesaReceipt: data.mpesa_receipt || null,

            updatedAt: new Date()

        });

        /*
        =========================================
        CREDIT BALANCES
        =========================================
        */

        if (balanceType === "wallet") {

            await walletService.topupWallet(
                uid,
                Number(data.amount)
            );

            await walletService.deductServiceBalance(
                uid,
                serviceFee
            );

        } else if (balanceType === "service") {

            await walletService.topupService(
                uid,
                Number(data.amount)
            );

        }

        /*
        =========================================
        FORWARD TO MERCHANT WEBHOOK
        =========================================
        */

        try {

            const merchant =
                await walletService.getMerchant(uid);

            if (merchant?.webhookUrl) {

                await fetch(merchant.webhookUrl, {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        success: true,

                        status: "SUCCESS",

                        amount: Number(data.amount),

                        phone: data.phone,

                        transaction_id: data.transaction_id,

                        mpesa_receipt: data.mpesa_receipt,

                        reference: data.reference,

                        merchant_id: merchant.merchantId,

                        currency: merchant.currency || "KES"

                    })

                });

                console.log("Merchant webhook sent.");

            }

        } catch (err) {

            console.error(
                "Merchant webhook failed:",
                err.message
            );

        }

        return success(
            res,
            "Webhook processed successfully."
        );

    } catch (err) {

        console.error(err);

        return error(
            res,
            "Webhook processing failed."
        );

    }

}

module.exports = {
    webhook
};
