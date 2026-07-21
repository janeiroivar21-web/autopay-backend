const { getMerchant } = require("../services/merchantService");

module.exports = async (req, res, next) => {

    try {

        const merchant = await getMerchant(req.user.uid);

        if (!merchant) {

            return res.status(404).json({
                success: false,
                message: "Merchant account not found."
            });

        }

        req.merchant = merchant;

        next();

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: "Unable to load merchant."
        });

    }

};
