const swiftService = require("../services/swiftService");
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

        const result = await swiftService.checkStatus(checkout_request_id);

const transactionData = result.data?.transaction;

if (!transactionData) {
    return error(res, "Transaction not found.", 404);
}

        const transaction =
            await transactionService.getTransaction(checkout_request_id);

        /*
        =========================================
        PAYMENT SUCCESS
        =========================================
        */

        if (transactionData.status === "completed") {

        if (transaction && transaction.data().status !== "SUCCESS") {

        const amount = Number(transactionData.amount);

        await transactionService.updateTransaction(
    checkout_request_id,
    {
    
        amount,
        phone: transactionData.phone_number
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
    transactionData.status === "failed" ||
    transactionData.status === "cancelled"
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
    amount: transactionData.amount,
    phone: transactionData.phone_number,
    data: result
});

    } catch (err) {

        console.error(err);

        return error(res, "Unable to check payment status.");

    }

}

module.exports = {
    checkStatus
};
