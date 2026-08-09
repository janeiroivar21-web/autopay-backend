const axios = require("axios");
const admin = require("firebase-admin");

const { users } = require("./firestoreService");

const db = admin.firestore();


/*
=========================================
SEND MERCHANT WHATSAPP NOTIFICATION
=========================================
*/

async function sendMerchantNotification(uid, message) {

    try {

        console.log("=========================================");
        console.log("WHATSAPP NOTIFICATION");
        console.log("UID:", uid);
        console.log("=========================================");


        /*
        =========================================
        LOAD MERCHANT
        =========================================
        */

        const merchantRef = users.doc(uid);

        const merchantDoc = await merchantRef.get();

        if (!merchantDoc.exists) {

            console.log("Merchant not found.");

            return false;

        }

        const merchant = merchantDoc.data();


        /*
        =========================================
        CHECK WHATSAPP ENABLED
        =========================================
        */

        if (merchant.whatsappEnabled !== true) {

            console.log(
                "WhatsApp notifications are disabled."
            );

            return false;

        }


        /*
        =========================================
        CHECK WHATSAPP NUMBER
        =========================================
        */

        if (!merchant.whatsappNumber) {

            console.log(
                "Merchant has no WhatsApp number."
            );

            return false;

        }


        /*
        =========================================
        CHECK WHATSAPP COINS
        =========================================
        */

        const whatsappCoins =
            Number(merchant.whatsappCoins || 0);


        console.log(
            "Available WhatsApp Coins:",
            whatsappCoins
        );


        if (whatsappCoins < 1) {

            console.log(
                "Insufficient WhatsApp Coins."
            );

            return false;

        }


        /*
        =========================================
        SEND WHATSAPP MESSAGE
        =========================================
        */

        console.log(
            "Sending WhatsApp notification..."
        );

        const response = await axios.post(

            "https://global.optimapaybridge.co.ke/api/v2/whatsapp/send",

            {
                instance_id:
                    process.env.WHATSAPP_INSTANCE_ID,

                to:
                    merchant.whatsappNumber,

                body:
                    message
            },

            {
                headers: {

                    "Content-Type":
                        "application/json",

                    "X-API-KEY":
                        process.env.OPTIMAPAY_API_KEY,

                    "X-API-SECRET":
                        process.env.OPTIMAPAY_API_SECRET

                }

            }

        );


        console.log(
            "WhatsApp API Response:",
            response.data
        );


        /*
        =========================================
        CHECK API SUCCESS
        =========================================
        */

        const apiSuccess =
            response.data?.success === true;

        const apiStatus =
            String(
                response.data?.data?.status || ""
            ).toUpperCase();


        const accepted =
            apiSuccess ||
            apiStatus === "QUEUED" ||
            apiStatus === "SENT";


        if (!accepted) {

            console.log(
                "WhatsApp API rejected the message."
            );

            return false;

        }


        /*
        =========================================
        MESSAGE ACCEPTED
        =========================================
        */

        console.log(
            "WhatsApp message accepted."
        );


        /*
        =========================================
        DEDUCT ONE WHATSAPP COIN
        =========================================

        IMPORTANT:
        Use a Firestore transaction so two
        notifications cannot spend the same coin.
        =========================================
        */

        let deductionSuccessful = false;


        await db.runTransaction(async (transaction) => {

            const latestSnap =
                await transaction.get(merchantRef);


            if (!latestSnap.exists) {

                throw new Error(
                    "Merchant not found during coin deduction."
                );

            }


            const latestData =
                latestSnap.data();


            const currentCoins =
                Number(
                    latestData.whatsappCoins || 0
                );


            console.log(
                "Coins before deduction:",
                currentCoins
            );


            /*
            =========================================
            DOUBLE CHECK BALANCE
            =========================================
            */

            if (currentCoins < 1) {

                throw new Error(
                    "Insufficient WhatsApp Coins."
                );

            }


            /*
            =========================================
            DEDUCT ONE COIN
            =========================================
            */

            transaction.update(
                merchantRef,
                {

                    whatsappCoins:
                        admin.firestore.FieldValue.increment(-1),

                    totalMessagesSent:
                        admin.firestore.FieldValue.increment(1)

                }
            );


            deductionSuccessful = true;

        });


        if (!deductionSuccessful) {

            console.log(
                "WhatsApp coin deduction failed."
            );

            return false;

        }


        /*
        =========================================
        RECORD MESSAGE SENT
        =========================================
        */

        await merchantRef
            .collection("messagesSent")
            .add({

                uid,

                to:
                    merchant.whatsappNumber,

                message,

                status:
                    apiStatus || "QUEUED",

                instanceId:
                    process.env.WHATSAPP_INSTANCE_ID,

                createdAt:
                    admin.firestore.FieldValue
                        .serverTimestamp()

            });


        console.log(
            "WhatsApp message recorded."
        );


        console.log(
            "1 WhatsApp coin deducted successfully."
        );


        console.log(
            "========================================="
        );


        return true;


    } catch (err) {

        console.error(
            "========================================="
        );

        console.error(
            "WHATSAPP ERROR:"
        );

        console.error(
            err.response?.data ||
            err.message ||
            err
        );

        console.error(
            "========================================="
        );

        return false;

    }

}


/*
=========================================
TOP UP WHATSAPP COINS
=========================================
*/

async function topupWhatsappCoins(uid, amount) {

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {

        throw new Error(
            "Invalid WhatsApp coin amount."
        );

    }


    await users.doc(uid).update({

        whatsappCoins:
            admin.firestore.FieldValue.increment(value)

    });


    console.log(
        `Added ${value} WhatsApp coins to ${uid}`
    );

}


/*
=========================================
EXPORT
=========================================
*/

module.exports = {

    sendMerchantNotification,

    topupWhatsappCoins

};
