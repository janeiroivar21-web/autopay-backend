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


        /*
        =========================================
        LOAD SETTINGS
        =========================================
        */

        const settingsRef =
            db.collection("settings").doc(uid);

        const settingsDoc =
            await settingsRef.get();

        if (!settingsDoc.exists) {

            console.log(
                "Merchant settings not found."
            );

            return false;

        }

        const settings =
            settingsDoc.data();


        /*
        =========================================
        CHECK WHATSAPP NOTIFICATIONS
        =========================================

        This is the AUTHORITATIVE setting.

        settings/{uid}

        whatsappNotifications
        =========================================
        */

        if (settings.whatsappNotifications !== true) {

            console.log(
                "WhatsApp notifications are disabled in settings."
            );

            return false;

        }


        /*
        =========================================
        GET WHATSAPP NUMBER
        =========================================
        */

        const whatsappNumber =
            settings.whatsappNumber ||
            merchantDoc.data().whatsappNumber ||
            "";


        if (!whatsappNumber) {

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

        const merchant =
            merchantDoc.data();

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
                    whatsappNumber,

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
        CHECK WHATSAPP API RESPONSE
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
        DEDUCT ONE COIN
        =========================================

        Use a Firestore transaction so the
        latest balance is checked again.
        =========================================
        */

        let transactionResult = null;


        await db.runTransaction(async (transaction) => {

            const latestMerchant =
                await transaction.get(merchantRef);


            if (!latestMerchant.exists) {

                throw new Error(
                    "Merchant no longer exists."
                );

            }


            const latestData =
                latestMerchant.data();


            const latestCoins =
                Number(
                    latestData.whatsappCoins || 0
                );


            console.log(
                "Latest WhatsApp Coins:",
                latestCoins
            );


            /*
            =========================================
            FINAL BALANCE CHECK
            =========================================
            */

            if (latestCoins < 1) {

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
                        admin.firestore.FieldValue
                            .increment(-1),

                    totalMessagesSent:
                        admin.firestore.FieldValue
                            .increment(1)

                }

            );


            transactionResult = {

                remainingCoins:
                    latestCoins - 1

            };

        });


        /*
        =========================================
        RECORD MESSAGE SENT
        =========================================
        */

        const messageRef =
            await merchantRef
                .collection("messagesSent")
                .add({

                    uid,

                    to:
                        whatsappNumber,

                    message,

                    status:
                        apiStatus || "QUEUED",

                    instanceId:
                        process.env.WHATSAPP_INSTANCE_ID,

                    coinsUsed: 1,

                    remainingCoins:
                        transactionResult.remainingCoins,

                    createdAt:
                        admin.firestore.FieldValue
                            .serverTimestamp()

                });


        console.log(
            "WhatsApp message recorded:",
            messageRef.id
        );


        console.log(
            "1 WhatsApp coin deducted."
        );

        console.log(
            "Remaining WhatsApp Coins:",
            transactionResult.remainingCoins
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

    const value =
        Number(amount);


    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        throw new Error(
            "Invalid WhatsApp coin amount."
        );

    }


    await users.doc(uid).update({

        whatsappCoins:
            admin.firestore.FieldValue
                .increment(value)

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
