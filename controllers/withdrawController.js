const swiftService = require("../services/swiftService");
const walletService = require("../services/walletService");
const withdrawalService = require("../services/withdrawalService");
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

        const { users } = require("../services/firestoreService");

const userRef = users.doc(uid);
const userSnap = await userRef.get();

if (!userSnap.exists) {
    return error(res, "Merchant not found.", 404);
}

const walletBalance = Number(userSnap.data().walletBalance || 0);

if (walletBalance < Number(amount)) {
    return error(res, "Insufficient Wallet Balance.", 400);
}

await walletService.deductWallet(uid, amount);

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
