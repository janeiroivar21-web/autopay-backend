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
const apiKeys = db.collection("apiKeys");
const webhooks = db.collection("webhooks");
const settings = db.collection("settings");
const activityLogs = db.collection("activityLogs");

module.exports = {
    db,
    users,
    transactions,
    withdrawals,
    paymentAccounts,
    paymentLinks,
    apiKeys,
    webhooks,
    settings,
    activityLogs
};
