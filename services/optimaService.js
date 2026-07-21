const axios = require("axios");
const { formatPhone } = require("../utils/phone");
const { log, error } = require("../utils/logger");

const API_BASE = "https://optimapaybridge.co.ke/api/v2";

const headers = {
    "X-API-KEY": process.env.OPTIMA_API_KEY,
    "X-API-SECRET": process.env.OPTIMA_API_SECRET,
    "Content-Type": "application/json"
};

/*
=========================================
SEND STK PUSH
=========================================
*/

async function stkPush(phone, amount) {

    try {

        const payload = {
            phone: formatPhone(phone),
            amount: Number(amount)
        };

        log("Sending STK Push", payload);

        const response = await axios.post(
            `${API_BASE}/topup.php`,
            payload,
            { headers }
        );

        log("STK Push Response", response.data);

        return response.data;

    } catch (err) {

        error("STK Push Error", err.response?.data || err.message);

        throw err;
    }

}

/*
=========================================
CHECK PAYMENT STATUS
=========================================
*/

async function checkStatus(checkout_request_id) {

    try {

        const response = await axios.post(
            `${API_BASE}/status.php`,
            { checkout_request_id },
            { headers }
        );

        log("Status Response", response.data);

        return response.data;

    } catch (err) {

        error("Status Error", err.response?.data || err.message);

        throw err;
    }

}

/*
=========================================
SEND PAYOUT
=========================================
*/

async function payout(phone, amount, reference) {

    try {

        const payload = {
            phone: formatPhone(phone),
            amount: Number(amount),
            reference
        };

        log("Sending Payout", payload);

        const response = await axios.post(
            `${API_BASE}/payout.php`,
            payload,
            { headers }
        );

        console.log(JSON.stringify(response.data, null, 2));

        return response.data;

    } catch (err) {

        error("Payout Error", err.response?.data || err.message);

        throw err;
    }

}

module.exports = {
    stkPush,
    checkStatus,
    payout
};
