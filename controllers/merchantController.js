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

module.exports = {
    getMerchant,
    updateMerchant
};
