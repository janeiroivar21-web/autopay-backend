const { admin, db } = require("../config/firebase");

async function reverseTransaction(transactionId, adminUid) {

    return db.runTransaction(async (transaction) => {

        const transactionRef = db.collection("transactions").doc(transactionId);

        const transactionSnap = await transaction.get(transactionRef);

        if (!transactionSnap.exists) {
            throw new Error("Transaction not found.");
        }

        const trx = transactionSnap.data();

        if (trx.reversed === true) {
            throw new Error("Transaction has already been reversed.");
        }

        const userRef = db.collection("users").doc(trx.uid);

        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists) {
            throw new Error("Merchant not found.");
        }

        const merchant = userSnap.data();

        const amount = Number(trx.amount || 0);
        const serviceFee = Number(trx.serviceFee || 0);

        const walletBefore = Number(merchant.walletBalance || 0);
        const serviceBefore = Number(merchant.serviceBalance || 0);

        const walletAfter = walletBefore - amount;
        const serviceAfter = serviceBefore + serviceFee;

        transaction.update(userRef, {
            walletBalance: walletAfter,
            serviceBalance: serviceAfter
        });

        transaction.update(transactionRef, {
            reversed: true,
            reversedAt: admin.firestore.FieldValue.serverTimestamp(),
            reversedBy: adminUid
        });
        
        // Create reversal transaction
const reversalRef = db.collection("transactions").doc();

transaction.set(reversalRef, {

    uid: trx.uid,

    merchantId: trx.merchantId,

    amount: -amount,

    balanceType: "wallet",

    type: "REVERSAL",

    status: "SUCCESS",

    reference: "REV-" + (trx.reference || trx.checkoutRequestId),

    checkoutRequestId: "REV-" + (trx.checkoutRequestId || transactionId),

    merchantRequestId: trx.merchantRequestId || "",

    phone: trx.phone || "",

    serviceFee: 0,

    createdAt: admin.firestore.FieldValue.serverTimestamp(),

    updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    reversedTransaction: transactionId

});

        const notificationRef = db.collection("notifications").doc();

        transaction.set(notificationRef, {
            uid: trx.uid,
            title: "Transaction Reversed",
            message: `Your transaction ${trx.reference || trx.checkoutRequestId} of KES ${amount.toLocaleString()} has been reversed by AUTOPAY Admin.`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const logRef = db.collection("reversalLogs").doc();

        transaction.set(logRef, {
            transactionId,
            reference: trx.reference || "",
            merchantUid: trx.uid,
            merchantId: trx.merchantId,
            amount,
            serviceFee,
            walletBefore,
            walletAfter,
            serviceBefore,
            serviceAfter,
            adminUid,
            reversedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true
        };

    });

}

async function sendNotification(uid, title, message) {

    await db.collection("notifications").add({

        uid,

        title,

        message,

        read: false,

        createdAt: admin.firestore.FieldValue.serverTimestamp()

    });

    return {
        success: true
    };

}

module.exports = {
    reverseTransaction,
    sendNotification
};
