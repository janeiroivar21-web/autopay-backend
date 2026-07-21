/*
=================================
AUTOPAY FEES
=================================
*/

const TRANSACTION_FEE = 0.08;
const WITHDRAW_FEE = 0.10;

function calculateTransactionFee(amount) {

    amount = Number(amount);

    const fee = amount * TRANSACTION_FEE;

    return {
        amount,
        fee,
        merchantReceives: amount - fee
    };
}

function calculateWithdrawFee(amount) {

    amount = Number(amount);

    const fee = amount * WITHDRAW_FEE;

    return {
        amount,
        fee,
        merchantReceives: amount - fee
    };
}

module.exports = {
    calculateTransactionFee,
    calculateWithdrawFee
};
