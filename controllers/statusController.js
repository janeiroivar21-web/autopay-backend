const optimaService = require("../services/optimaService");
const transactionService = require("../services/transactionService");
const whatsappService = require("../services/whatsappService");
const { error } = require("../utils/response");

async function checkStatus(req, res) {

try {  

    let {  
checkout_request_id,  
uid,  
balanceType

} = req.body;

if (!checkout_request_id) {
return error(
res,
"checkout_request_id is required.",
400
);
}

// If uid is missing, identify merchant from API Key
if (!uid) {

const admin = require("firebase-admin");  
const db = admin.firestore();  

const authHeader = req.headers.authorization;  

if (!authHeader) {  
    return error(  
        res,  
        "Authorization header is required.",  
        401  
    );  
}  

const apiKey = authHeader.startsWith("Bearer ")  
    ? authHeader.replace("Bearer ", "").trim()  
    : authHeader.trim();  

const keySnap = await db  
    .collection("apiKeys")  
    .where("secretKey", "==", apiKey)  
    .limit(1)  
    .get();  

if (keySnap.empty) {  
    return error(  
        res,  
        "Invalid API key.",  
        401  
    );  
}  

const keyDoc = keySnap.docs[0];  
const keyData = keyDoc.data();  

if (keyData.status !== "Active") {  
    return error(  
        res,  
        "API key is inactive.",  
        401  
    );  
}  

if (keyData.uid) {  

    uid = keyData.uid;  

} else {  

    const userSnap = await db  
        .collection("users")  
        .where("merchantId", "==", keyData.merchantId)  
        .limit(1)  
        .get();  

    if (userSnap.empty) {  
        return error(  
            res,  
            "Merchant not found.",  
            404  
        );  
    }  

    uid = userSnap.docs[0].id;  

    await keyDoc.ref.update({  
        uid  
    });  

}  

}  

    const result = await optimaService.checkStatus(checkout_request_id);

if (!result.success) {
return error(
res,
result.message || "Transaction not found.",
404
);
}

const transactionData = {
status: result.status,
amount: result.amount,
phone_number: result.phone,
transaction_code: result.transaction_code
};

// Normalise payment status
const paymentStatus =
String(result.status || "").toUpperCase();

const transaction =  
        await transactionService.getTransaction(checkout_request_id);  

    /*

=========================================
PAYMENT SUCCESS

*/
if (
paymentStatus === "SUCCESS" ||
paymentStatus === "COMPLETED"
) {

const walletService = require("../services/walletService");  

if (transaction && transaction.data().status !== "SUCCESS") {  

    const tx = transaction.data();  

    const updated = await transactionService.updateTransaction(  
checkout_request_id,  
{  
    status: "SUCCESS",  
    amount: Number(transactionData.amount),  
    phone: transactionData.phone_number,  
    transactionId: transactionData.transaction_code,  
    updatedAt: new Date()  
}

);

// Another process (e.g. webhook) already handled it
if (!updated) {
return res.json({
success: true,
status: "SUCCESS",
message: "Transaction already processed."
});
}

if (tx.balanceType === "wallet") {

await walletService.topupWallet(  
    tx.uid,  
    Number(transactionData.amount)  
);  

await walletService.deductServiceBalance(  
    tx.uid,  
    tx.serviceFee || 0  
);  
  
await whatsappService.sendMerchantNotification(  
tx.uid,

`✅ Wallet Top-up Successful

Amount: KES ${Number(transactionData.amount).toLocaleString()}

Your wallet has been credited successfully.

Thank you for using AUTOPAY.`
);

} else if (tx.balanceType === "service") {

await walletService.topupService(  
tx.uid,  
Number(transactionData.amount)

);

await whatsappService.sendMerchantNotification(
tx.uid,
`✅ Service Balance Top-up

Amount: KES ${Number(transactionData.amount).toLocaleString()}

Your Service Balance has been credited successfully.`
);

} else if (tx.balanceType === "whatsapp") {

await whatsappService.topupWhatsappCoins(  
    tx.uid,  
    Number(transactionData.amount)  
);  

// Save purchase history  
const admin = require("firebase-admin");  

await admin.firestore()  
    .collection("users")  
    .doc(tx.uid)  
    .collection("whatsappPurchases")  
    .add({  
        amount: Number(transactionData.amount),  
        credits: Number(transactionData.amount),  
        transactionId: transactionData.transaction_code,  
        phone: transactionData.phone_number,  
        status: "SUCCESS",  
        createdAt: admin.firestore.FieldValue.serverTimestamp()  
    });  

await whatsappService.sendMerchantNotification(  
    tx.uid,

`✅ WhatsApp Credits Purchased

Amount: KES ${Number(transactionData.amount).toLocaleString()}

Your WhatsApp credits have been added successfully.`
);

}

}
}
/*

PAYMENT FAILED / CANCELLED

*/

if (
paymentStatus === "FAILED" ||
paymentStatus === "CANCELLED" ||
paymentStatus === "CANCELLED_BY_USER"
) {

await transactionService.updateTransaction(  
    checkout_request_id,  
    {  
        status: "FAILED",  
        updatedAt: new Date()  
    }  
);

}

return res.json({  
success: true,  
status: transactionData.status,  
checkout_request_id,  
amount: transactionData.amount,  
phone: transactionData.phone_number,  
transaction

});

} catch (err) {  

    console.error(err);  

    return error(res, "Unable to check payment status.");  

}

}

module.exports = {
checkStatus
};
