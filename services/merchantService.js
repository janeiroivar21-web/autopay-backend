const {
    users,
    paymentAccounts
} = require("./firestoreService");

/*
=========================================
GET MERCHANT
=========================================
*/

async function getMerchant(uid) {

    const doc = await users.doc(uid).get();

    if (!doc.exists) {
        return null;
    }

    return {
        id: doc.id,
        ...doc.data()
    };

}

/*
=========================================
CHECK MERCHANT EXISTS
=========================================
*/

async function merchantExists(uid) {

    const doc = await users.doc(uid).get();

    return doc.exists;

}

/*
=========================================
CREATE MERCHANT
=========================================
*/

async function createMerchant(uid, data) {

    await users.doc(uid).set(data);

    return true;

}

/*
=========================================
UPDATE MERCHANT
=========================================
*/

async function updateMerchant(uid, data) {

    await users.doc(uid).update(data);

    return true;

}

/*
=========================================
DELETE MERCHANT
=========================================
*/

async function deleteMerchant(uid) {

    await users.doc(uid).delete();

    return true;

}

/*
=========================================
CREATE PAYMENT ACCOUNT
=========================================
*/

async function createPaymentAccount(data) {

    const ref = paymentAccounts.doc();

    await ref.set({
        id: ref.id,
        ...data,
        createdAt: new Date()
    });

    return ref.id;

}

/*
=========================================
GET PAYMENT ACCOUNTS
=========================================
*/

async function getPaymentAccounts(uid) {

    const snapshot = await paymentAccounts
        .where("uid", "==", uid)
        .get();

    const accounts = [];

    snapshot.forEach(doc => {

        accounts.push({
            id: doc.id,
            ...doc.data()
        });

    });

    return accounts;

}

module.exports = {
    getMerchant,
    merchantExists,
    createMerchant,
    updateMerchant,
    deleteMerchant,
    createPaymentAccount,
    getPaymentAccounts
};
