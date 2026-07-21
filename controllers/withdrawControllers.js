const optimaService = require("../services/optimaService");
const withdrawalService = require("../services/withdrawalService");
const { calculateWithdrawFee } = require("../utils/fees");
const { generateReference } = require("../utils/reference");
const { success, error } = require("../utils/response");

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

        const fee = calculateWithdrawFee(amount);

        const reference = generateReference("WD");

        const payout = await optimaService.payout(

            phone,
            fee.merchantReceives,
            reference

        );

        await withdrawalService.saveWithdrawal({

            uid,
            phone,
            amount,
            fee: fee.fee,
            paid: fee.merchantReceives,
            reference,
            status: "Pending"

        });

        return success(res, "Withdrawal initiated successfully.", {

            payout

        });

    } catch (err) {

        console.error(err);

        return error(res, "Withdrawal failed.");

    }

}

module.exports = {
    withdraw
};
