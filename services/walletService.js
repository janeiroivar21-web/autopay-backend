const {
    users,
    settings,
    transactions,
    db
} = require("./firestoreService");

const admin = require("firebase-admin");

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

await ref.update({
    walletBalance: admin.firestore.FieldValue.increment(Number(amount))
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

await ref.update({
    serviceBalance: admin.firestore.FieldValue.increment(Number(amount))
});

}

/*
=========================================
AUTO SERVICE TOP-UP
=========================================
*/

async function autoServiceTopup(uid) {

    const userRef = users.doc(uid);
    const settingsRef = settings.doc(uid);

    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        throw new Error("Merchant not found");
    }

    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
        return;
    }

    const merchant = userSnap.data();
    const config = settingsSnap.data();

    if (!config.autoTopupEnabled) {
        return;
    }

    const serviceBalance =
        Number(merchant.serviceBalance || 0);

    const walletBalance =
        Number(merchant.walletBalance || 0);

    const threshold =
        Number(config.autoTopupThreshold || 0);

    const topupAmount =
        Number(config.autoTopupAmount || 0);

    if (serviceBalance > threshold) {
        return;
    }

    if (walletBalance < topupAmount) {

        console.log(
            "Auto Top-up skipped: Wallet balance too low."
        );

        return;

    }

    await userRef.update({

        walletBalance:
            walletBalance - topupAmount,

        serviceBalance:
            serviceBalance + topupAmount

    });

    const reference = `AUTO-${Date.now()}`;

await transactions.add({

    uid,

    merchantId: merchant.merchantId || "",

    gateway: "AUTOPAY",

    reference,

    checkoutRequestId: reference,

    merchantRequestId: null,

    phone: merchant.phone || "",

    amount: topupAmount,

    serviceFee: 0,

    status: "SUCCESS",

    type: "Auto Service Top-up",

    balanceType: "service",

    description:
        "Automatic transfer from Wallet Balance to Service Balance.",

    createdAt:
        admin.firestore.FieldValue.serverTimestamp()

});

    console.log(
        `Auto Service Top-up completed for ${uid}`
    );

}

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

// Check whether Auto Service Top-up should run
await autoServiceTopup(uid);

}

/*
=========================================
DEDUCT WALLET BALANCE
=========================================
*/

async function deductWallet(uid, amount) {

    const ref = users.doc(uid);

    await db.runTransaction(async (transaction) => {

        const snap = await transaction.get(ref);

        if (!snap.exists) {
            throw new Error("Merchant not found");
        }

        const balance = Number(snap.data().walletBalance || 0);

        if (balance < Number(amount)) {
            throw new Error("Insufficient wallet balance");
        }

        transaction.update(ref, {
            walletBalance: balance - Number(amount)
        });

    });

}

/*
=========================================
GET MERCHANT
=========================================
*/

async function getMerchant(uid) {

    const ref = users.doc(uid);

    const snap = await ref.get();

    if (!snap.exists) {
        throw new Error("Merchant not found");
    }

    return snap.data();

}

module.exports = {
    topupWallet,
    topupService,
    autoServiceTopup,
    deductServiceBalance,
    deductWallet,
    getMerchant
};
