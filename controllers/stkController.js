const optimaService = require("../services/optimaService");
const transactionService = require("../services/transactionService");
const { success, error } = require("../utils/response");

async function stkPush(req, res) {

    try {

        const {
            uid,
            phone,
            amount,
            balanceType = "wallet"
        } = req.body;

        if (!uid || !phone || !amount) {

            return error(
                res,
                "UID, phone and amount are required.",
                400
            );

        }

        const result = await optimaService.stkPush(
            phone,
            amount
        );

        const checkoutRequestId =
            result.checkout_request_id ||
            result.CheckoutRequestID ||
            result.checkoutRequestId;

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
            phone,
            amount: Number(amount),

            checkoutRequestId: checkoutRequestId,

            merchantRequestId: merchantRequestId,

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

        console.error(err);

        return error(

            res,

            err.response?.data?.message ||

            "Failed to send STK Push."

        );

    }

}

module.exports = {
    stkPush
};
