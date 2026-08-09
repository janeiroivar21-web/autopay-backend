const fetch = require("node-fetch");

const walletService = require("../services/walletService");
const transactionService = require("../services/transactionService");
const whatsappService = require("../services/whatsappService");
const { success, error } = require("../utils/response");

/*
=========================================
OPTIMAPAY WEBHOOK
=========================================
*/

async function webhook(req, res) {

    try {

        const data = req.body;

console.log("========== OPTIMAPAY WEBHOOK ==========");
console.log(JSON.stringify(data, null, 2));

// Ignore unsuccessful webhooks
if (data.success !== true) {

    return success(
        res,
        "Ignoring unsuccessful webhook."
    );

}
        const checkoutRequestId =
    data.checkout_request_id || data.reference;

if (!checkoutRequestId) {
    return error(
        res,
        "Missing checkout_request_id.",
        400
    );
}

const transaction =
    await transactionService.getTransaction(
        checkoutRequestId
    );

        if (!transaction) {
            return error(res, "Transaction not found.", 404);
        }

        const transactionData = transaction.data();

        // Prevent duplicate processing
if (
    String(transactionData.status || "").toUpperCase() === "SUCCESS"
) {
    console.log(
        "Transaction already processed:",
        checkoutRequestId
    );

    return success(
        res,
        "Transaction already processed."
    );
}

        const uid = transactionData.uid;
        const balanceType = transactionData.balanceType;
        const serviceFee = transactionData.serviceFee || 0;

        /*
        =========================================
        PAYMENT FAILED
        =========================================
        */

        const paymentStatus =
    String(data.status || "").toUpperCase();

if (
    paymentStatus !== "SUCCESS" &&
    paymentStatus !== "COMPLETED"
) {

    await transaction.ref.update({
        status: "FAILED",
        updatedAt: new Date()
    });

    return success(
        res,
        "Payment failed."
    );

}

        /*
=========================================
UPDATE TRANSACTION
=========================================
*/

const updated =
    await transactionService.updateTransaction(
        checkoutRequestId,
        {
            status: "SUCCESS",
            amount: Number(data.amount),
            phone: data.phone,
            transactionId: data.transaction_id,
            mpesaReceipt: data.mpesa_receipt || null,
            updatedAt: new Date()
        }
    );

// Another request already processed this payment
if (!updated) {

    console.log(
        "Transaction already processed:",
        checkoutRequestId
    );

    return success(
        res,
        "Transaction already processed."
    );

}

        /*
=========================================
CREDIT BALANCES
=========================================
*/

if (balanceType === "wallet") {

    console.log("========== CREDITING WALLET ==========");
    console.log("UID:", uid);
    console.log("Amount:", Number(data.amount));

    await walletService.topupWallet(
        uid,
        Number(data.amount)
    );

    await walletService.deductServiceBalance(
        uid,
        serviceFee
    );

    const merchantAfterCredit =
        await walletService.getMerchant(uid);

    console.log(
        "Wallet Balance After Credit:",
        merchantAfterCredit.walletBalance
    );
    
await whatsappService.sendMerchantNotification(
    uid,
`ðŸ’° Wallet Top-up Successful

Amount: KES ${Number(data.amount).toLocaleString()}

Your wallet has been credited successfully.

New Wallet Balance:
KES ${Number(merchantAfterCredit.walletBalance).toLocaleString()}

Thank you for choosing AUTOPAY.`
);

} else if (balanceType === "service") {

    console.log("========== CREDITING SERVICE BALANCE ==========");
    console.log("UID:", uid);
    console.log("Amount:", Number(data.amount));

    console.log("========== SERVICE TOPUP DEBUG ==========");
    console.log("Transaction UID:", uid);
    console.log("Amount:", Number(data.amount));

await walletService.topupService(
    uid,
    Number(data.amount)
);

const merchantAfterCredit =
    await walletService.getMerchant(uid);
    
   await whatsappService.sendMerchantNotification(
    uid,
`âœ… Service Top-up Successful

Amount: KES ${Number(data.amount).toLocaleString()}

Your service balance has been credited successfully.

New Service Balance:
KES ${Number(merchantAfterCredit.serviceBalance).toLocaleString()}

Thank you for using AUTOPAY.`
);

console.log("Merchant Document:");
console.log(merchantAfterCredit);

console.log("Service Balance After Credit:");
console.log(merchantAfterCredit.serviceBalance);

console.log("========================================");

}

else if (balanceType === "whatsapp") {

    console.log("========== CREDITING WHATSAPP ==========");

    await whatsappService.topupWhatsappCoins(
        uid,
        Number(data.amount)
    );

    const admin = require("firebase-admin");

    await admin.firestore()
        .collection("users")
        .doc(uid)
        .collection("whatsappPurchases")
        .add({
            amount: Number(data.amount),
            credits: Number(data.amount),
            transactionId: data.transaction_id,
            phone: data.phone,
            status: "SUCCESS",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

    await whatsappService.sendMerchantNotification(
        uid,
`✅ WhatsApp Credits Purchased

Amount: KES ${Number(data.amount).toLocaleString()}

Your WhatsApp credits have been added successfully.

Thank you for using AUTOPAY.`
    );

    console.log("WhatsApp credits added successfully.");

}

        /*
        =========================================
        FORWARD TO MERCHANT WEBHOOK
        =========================================
        */

        try {

            const merchant =
                await walletService.getMerchant(uid);

            if (merchant?.webhookUrl) {

                await fetch(merchant.webhookUrl, {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

    success: true,

    status: "SUCCESS",

    amount: Number(data.amount),

    phone: data.phone,

    transaction_id: data.transaction_id,

    merchant_request_id:
        data.merchant_request_id || null,

    checkout_request_id:
        checkoutRequestId,

    merchant_id:
        merchant.merchantId,

    currency:
        merchant.currency || "KES"

})

                });

                console.log("Merchant webhook sent.");

            }

        } catch (err) {

            console.error(
                "Merchant webhook failed:",
                err.message
            );

        }

        return success(
            res,
            "Webhook processed successfully."
        );

    } catch (err) {

        console.error(err);

        return error(
            res,
            "Webhook processing failed."
        );

    }

}

module.exports = {
    webhook
};
