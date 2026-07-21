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
GET TRANSACTION
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
UPDATE TRANSACTION
=========================================
*/

async function updateTransaction(checkoutRequestId, updates) {

    const transaction = await getTransaction(checkoutRequestId);

    if (!transaction) {
        return null;
    }

    await transaction.ref.update({

        ...updates,

        updatedAt: admin.firestore.FieldValue.serverTimestamp()

    });

    return transaction.id;

}

module.exports = {
    saveTransaction,
    getTransaction,
    updateTransaction
};
