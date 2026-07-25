const admin = require("firebase-admin");

const db = admin.firestore();

let cachedGateway = "swiftwallet";
let lastLoaded = 0;

const CACHE_TIME = 60000; // 60 seconds

async function getActiveGateway() {

    const now = Date.now();

    if (now - lastLoaded < CACHE_TIME) {
        return cachedGateway;
    }

    try {

        const doc = await db
            .collection("config")
            .doc("payment_gateway")
            .get();

        if (doc.exists) {

            cachedGateway =
                doc.data().activeGateway ||
                "swiftwallet";

        } else {

            cachedGateway = "swiftwallet";

        }

        lastLoaded = now;

        return cachedGateway;

    } catch (err) {

        console.error("Gateway Config Error:", err);

        return cachedGateway;

    }

}

async function refreshGateway() {

    lastLoaded = 0;

    return getActiveGateway();

}

module.exports = {

    getActiveGateway,

    refreshGateway

};
