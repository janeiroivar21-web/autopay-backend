const optimaService = require("../services/optimaService");
const { success, error } = require("../utils/response");

async function stkPush(req, res) {

    try {

        const { phone, amount } = req.body;

        if (!phone || !amount) {
            return error(res, "Phone and amount are required.", 400);
        }

        const result = await optimaService.stkPush(phone, amount);

        return success(res, "STK Push sent successfully.", {

            checkout_request_id:
                result.checkout_request_id ||
                result.CheckoutRequestID ||
                result.checkoutRequestId,

            merchant_request_id:
                result.merchant_request_id ||
                result.MerchantRequestID ||
                result.merchantRequestId,

            data: result

        });

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
