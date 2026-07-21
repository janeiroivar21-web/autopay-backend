const optimaService = require("../services/optimaService");
const walletService = require("../services/walletService");
const transactionService = require("../services/transactionService");
const { error } = require("../utils/response");

async function checkStatus(req, res) {

    try {

        const {
            checkout_request_id,
            uid,
            balanceType
        } = req.body;

        if (!checkout_request_id || !uid || !balanceType) {
            return error(res, "Missing required fields.", 400);
        }

        const status = await optimaService.checkStatus(checkout_request_id);

        const transaction =
            await transactionService.getTransaction(checkout_request_id);

        /*
        =========================================
        PAYMENT SUCCESS
        =========================================
        */

        if (status.status === "SUCCESS") {

            // Only process once
            if (transaction && transaction.data().status !== "SUCCESS") {

                const amount = Number(status.amount);

                if (balanceType === "wallet") {

                    await walletService.topupWallet(uid, amount);

                } else if (balanceType === "service") {

                    await walletService.topupService(uid, amount);

                }

                await transactionService.updateTransaction(
                    checkout_request_id,
                    {
                        status: "SUCCESS",
                        amount,
                        phone: status.phone
                    }
                );

            }

        }

        /*
        =========================================
        PAYMENT FAILED / CANCELLED
        =========================================
        */

        if (
            status.status === "FAILED" ||
            status.status === "CANCELLED"
        ) {

            await transactionService.updateTransaction(
                checkout_request_id,
                {
                    status: "FAILED"
                }
            );

        }

        return res.json({
            success: true,
            status: status.status,
            amount: status.amount,
            phone: status.phone,
            data: status
        });

    } catch (err) {

        console.error(err);

        return error(res, "Unable to check payment status.");

    }

}

module.exports = {
    checkStatus
};
