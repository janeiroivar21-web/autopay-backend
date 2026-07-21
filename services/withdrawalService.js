const { withdrawals } = require("./firestoreService");

/*
=========================================
SAVE WITHDRAWAL
=========================================
*/

async function saveWithdrawal(data) {

    await withdrawals.add({

        ...data,

        createdAt: new Date()

    });

}

module.exports = {
    saveWithdrawal
};
