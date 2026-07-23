const { users } = require("./firestoreService");

/*
=========================================
TOP UP WALLET
=========================================
*/

async function topupWallet(uid, amount) {

    const ref = users.doc(uid);

    const snap = await ref.get();

    if (!snap.exists) {
        throw new Error("Merchant not found");
    }

    const balance = Number(snap.data().walletBalance || 0);

    await ref.update({
        walletBalance: balance + Number(amount)
    });

}

/*
=========================================
TOP UP SERVICE BALANCE
=========================================
*/

async function topupService(uid, amount) {

    const ref = users.doc(uid);

    const snap = await ref.get();

    if (!snap.exists) {
        throw new Error("Merchant not found");
    }

    const balance = Number(snap.data().serviceBalance || 0);

    await ref.update({
        serviceBalance: balance + Number(amount)
    });

}

module.exports = {
    topupWallet,
    topupService,
    deductServiceBalance,
    deductWallet
};

/*
=========================================
DEDUCT SERVICE BALANCE
=========================================
*/

async function deductServiceBalance(uid, amount) {

    const ref = users.doc(uid);

    const snap = await ref.get();

    if (!snap.exists) {
        throw new Error("Merchant not found");
    }

    const balance = Number(snap.data().serviceBalance || 0);

    if (balance < Number(amount)) {
        throw new Error("Insufficient service balance");
    }

    await ref.update({
        serviceBalance: balance - Number(amount)
    });

}

/*
=========================================
DEDUCT WALLET BALANCE
=========================================
*/

async function deductWallet(uid, amount) {

    const ref = users.doc(uid);

    const snap = await ref.get();

    if (!snap.exists) {
        throw new Error("Merchant not found");
    }

    const balance = Number(snap.data().walletBalance || 0);

    if (balance < Number(amount)) {
        throw new Error("Insufficient wallet balance");
    }

    await ref.update({
        walletBalance: balance - Number(amount)
    });

}
