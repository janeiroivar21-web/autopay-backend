const { db } = require("../config/firebase");

/*
=========================================
FIRESTORE COLLECTIONS
=========================================
*/

const users = db.collection("users");
const transactions = db.collection("transactions");
const withdrawals = db.collection("withdrawals");
const paymentAccounts = db.collection("paymentAccounts");
const paymentLinks = db.collection("paymentLinks");

module.exports = {
    db,
    users,
    transactions,
    withdrawals,
    paymentAccounts,
    paymentLinks
};
