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
    topupService
};
