const adminService = require("../services/adminService");

exports.reverseTransaction = async (req, res) => {

    try {

        const { transactionId, adminUid } = req.body;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID is required."
            });
        }

        const result = await adminService.reverseTransaction(
            transactionId,
            adminUid
        );

        res.json({
            success: true,
            message: "Transaction reversed successfully.",
            result
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// =========================================
// SEND NOTIFICATION
// =========================================

exports.sendNotification = async (req, res) => {

    try {

        const { uid, title, message } = req.body;

        if (!uid || !title || !message) {

            return res.status(400).json({
                success: false,
                message: "Title and message are required."
            });

        }

        const result = await adminService.sendNotification(
            uid,
            title,
            message
        );

        res.json({
            success: true,
            message: "Notification sent successfully.",
            result
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
