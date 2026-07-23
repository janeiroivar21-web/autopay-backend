const swiftService = require("../services/swiftService");
const walletService = require("../services/walletService");
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

        const withdrawalFee = Number(amount) * 0.10;

const payoutAmount = Number(amount) - withdrawalFee;

        const reference = generateReference("WD");

        const payout = await swiftService.payout(
    phone,
    payoutAmount,
    reference
);

        await withdrawalService.saveWithdrawal({

            uid,
            phone,
            amount,
            fee: withdrawalFee,
            paid: payoutAmount,
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
