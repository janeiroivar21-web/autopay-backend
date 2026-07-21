const { transactions } = require("./firestoreService");

/*
=========================================
SAVE TRANSACTION
=========================================
*/

async function saveTransaction(data) {

    await transactions.add({

        ...data,

        createdAt: new Date()

    });

}

module.exports = {
    saveTransaction
};
