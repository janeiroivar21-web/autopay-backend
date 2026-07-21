const { admin } = require("../config/firebase");

module.exports = async (req, res, next) => {

    try {

        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Authorization token missing."
            });

        }

        const token = header.split("Bearer ")[1];

        const decoded = await admin.auth().verifyIdToken(token);

        req.user = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            success: false,
            message: "Invalid authentication token."
        });

    }

};
