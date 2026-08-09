const axios = require("axios");
const fs = require("fs");
const { formatPhone } = require("../utils/phone");
const { log } = require("../utils/logger");

const API_BASE = "https://optimapaybridge.co.ke/api/v2";

const HEADERS = {
    "X-API-Key": process.env.OPTIMA_API_KEY,
    "X-API-Secret": process.env.OPTIMA_API_SECRET,
    "Content-Type": "application/json"
};

console.log("===== OPTIMAPAY CONFIG =====");
console.log("API KEY:", process.env.OPTIMA_API_KEY);
console.log("ACCOUNT ID:", process.env.OPTIMA_PAYMENT_ACCOUNT_ID);
console.log("============================");

/*
=========================================
SEND STK PUSH
=========================================
*/

async function stkPush(
    phone,
    amount,
    reference = null,
    customerName = "AUTOPAY Customer"
) {
    try {

        const formattedPhone = formatPhone(phone);

console.log("Original Phone:", phone);
console.log("Formatted Phone:", formattedPhone);

const payload = {
    payment_account_id: Number(process.env.OPTIMA_PAYMENT_ACCOUNT_ID),
    phone: formattedPhone,
    amount: Math.round(Number(amount)),
    reference: reference || `AUTO-${Date.now()}`,
    description: customerName
};

        console.log("========== STK PAYLOAD ==========");
        console.log(JSON.stringify(payload, null, 2));
        console.log("=================================");

        log("Sending OptimaPay STK Push", payload);

        const response = await axios.post(
            `${API_BASE}/stkpush.php`,
            payload,
            {
                headers: HEADERS
            }
        );

        log("OptimaPay STK Response", response.data);

        return response.data;

    } catch (err) {

        saveError(err);

        throw err;

    }
}

/*
=========================================
CHECK PAYMENT STATUS
=========================================
*/

async function checkStatus(checkoutRequestId) {

    try {

        const payload = {
            checkout_request_id: checkoutRequestId
        };

        log("Checking OptimaPay Status", payload);

        const response = await axios.post(
            `${API_BASE}/status.php`,
            payload,
            {
                headers: HEADERS
            }
        );

        log("OptimaPay Status Response", response.data);

        return response.data;

    } catch (err) {

        saveError(err);

        throw err;

    }

}

/*
=========================================
ERROR LOGGER
=========================================
*/

function saveError(err) {

    const errorLog = `
==============================
${new Date().toISOString()}

Status:
${err.response?.status}

Message:
${err.message}

Response:
${JSON.stringify(err.response?.data, null, 2)}

`;

    fs.appendFileSync(
        "optimapay-error.log",
        errorLog
    );

    console.error(errorLog);

}

module.exports = {
    stkPush,
    checkStatus
};
