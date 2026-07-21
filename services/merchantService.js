const { users } = require("./firestoreService");

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
UPDATE MERCHANT
=========================================
*/

async function updateMerchant(uid, data) {

    await users.doc(uid).update(data);

}

/*
=========================================
CREATE MERCHANT
=========================================
*/

async function createMerchant(uid, data) {

    await users.doc(uid).set(data);

}

module.exports = {
    getMerchant,
    updateMerchant,
    createMerchant
};
