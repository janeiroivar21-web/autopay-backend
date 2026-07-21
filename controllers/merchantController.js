const merchantService = require("../services/merchantService");
const { success, error } = require("../utils/response");

/*
=========================================
GET MERCHANT PROFILE
=========================================
*/

async function getMerchant(req, res) {

    try {

        const { uid } = req.params;

        const merchant = await merchantService.getMerchant(uid);

        if (!merchant) {
            return error(res, "Merchant not found.", 404);
        }

        return success(res, "Merchant loaded successfully.", {
            merchant
        });

    } catch (err) {

        console.error(err);

        return error(res, "Unable to load merchant.");

    }

}

/*
=========================================
UPDATE MERCHANT PROFILE
=========================================
*/

async function updateMerchant(req, res) {

    try {

        const { uid } = req.params;

        await merchantService.updateMerchant(uid, req.body);

        return success(res, "Merchant updated successfully.");

    } catch (err) {

        console.error(err);

        return error(res, "Unable to update merchant.");

    }

}

/*
=========================================
CREATE PAYMENT ACCOUNT
=========================================
*/

async function createPaymentAccount(req, res) {

    try {

        const accountId = await merchantService.createPaymentAccount(req.body);

        return success(res, "Payment account created successfully.", {
            accountId
        });

    } catch (err) {

        console.error(err);

        return error(res, "Unable to create payment account.");

    }

}

/*
=========================================
GET PAYMENT ACCOUNTS
=========================================
*/

async function getPaymentAccounts(req, res) {

    try {

        const { uid } = req.params;

        const accounts = await merchantService.getPaymentAccounts(uid);

        return success(res, "Payment accounts loaded successfully.", {
            accounts
        });

    } catch (err) {

        console.error(err);

        return error(res, "Unable to load payment accounts.");

    }

}

module.exports = {
    getMerchant,
    updateMerchant,
    createPaymentAccount,
    getPaymentAccounts
};
