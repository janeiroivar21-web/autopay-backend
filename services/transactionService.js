const admin = require("firebase-admin");
const { transactions } = require("./firestoreService");

/*
=========================================
SAVE TRANSACTION
=========================================
*/

async function saveTransaction(data) {

    return await transactions.add({

        ...data,

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()

    });

}

/*
=========================================
GET TRANSACTION BY CHECKOUT REQUEST ID
=========================================
*/

async function getTransaction(checkoutRequestId) {

    const snapshot = await transactions
        .where("checkoutRequestId", "==", checkoutRequestId)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0];

}

/*
=========================================
GET TRANSACTION BY REFERENCE
=========================================
*/

async function getTransactionByReference(reference) {

    const snapshot = await transactions
        .where("reference", "==", reference)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0];

}

/*
=========================================
UPDATE TRANSACTION
=========================================
*/

async function updateTransaction(checkoutRequestId, updates) {

    const transaction = await getTransaction(checkoutRequestId);

    if (!transaction) {
        return false;
    }

    return await admin.firestore().runTransaction(async (t) => {

        const snap = await t.get(transaction.ref);

        if (!snap.exists) {
            return false;
        }

        if (snap.data().status === "SUCCESS") {
            return false;
        }

        t.update(transaction.ref, {
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return true;

    });

}

module.exports = {
    saveTransaction,
    getTransaction,
    getTransactionByReference,
    updateTransaction
};
