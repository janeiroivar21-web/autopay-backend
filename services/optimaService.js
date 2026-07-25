const axios = require("axios");
const fs = require("fs");
const { formatPhone } = require("../utils/phone");
const { log, error } = require("../utils/logger");

const API_BASE = "https://optimapaybridge.co.ke/api/v2";

const HEADERS = {
    "X-API-Key": process.env.OPTIMA_API_KEY,
    "X-API-Secret": process.env.OPTIMA_API_SECRET,
    "Content-Type": "application/json"
};

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

        const payload = {

            payment_account_id: Number(process.env.OPTIMA_PAYMENT_ACCOUNT_ID),

            phone: formatPhone(phone),

            amount: Math.round(Number(amount)),

            reference: reference || `AUTO-${Date.now()}`,

            description: customerName

        };

        log("Sending OptimaPay STK Push", payload);

        const response = await axios.post(

            `${API_BASE}/stkpush.php`,

            payload,

            {
                headers: HEADERS
            }

        );

        log("OptimaPay Response", response.data);

        return response.data;

    } catch (err) {

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

        fs.appendFileSync("optimapay-error.log", errorLog);

        console.error(errorLog);

        throw err;

    }

}

module.exports = {
    stkPush
};
