const axios = require("axios");
const { formatPhone } = require("../utils/phone");
const { log, error } = require("../utils/logger");

const API_BASE = process.env.SWIFT_BASE_URL || "https://swiftwallet.co.ke/v3";

const headers = {
    Authorization: `Bearer ${process.env.SWIFT_API_KEY}`,
    "Content-Type": "application/json"
};

/*
=========================================
SEND STK PUSH
=========================================
*/

async function stkPush(phone, amount, reference = null, customerName = "AUTOPAY Customer") {

    try {

        const payload = {
    amount: Math.round(Number(amount)),
    phone_number: formatPhone(phone),
    external_reference: reference || `AUTO-${Date.now()}`,
    customer_name: customerName,
    callback_url: process.env.SWIFT_CALLBACK_URL,
    channel_id: process.env.SWIFT_CHANNEL_ID
};

        log("Sending SwiftWallet STK Push", payload);

        const response = await axios.post(
            `${API_BASE}/stk-initiate/`,
            payload,
            { headers }
        );

        log("SwiftWallet STK Response", response.data);

        return response.data;

    } catch (err) {

        console.error("SwiftWallet STK Error:", {
    status: err.response?.status,
    data: err.response?.data,
    message: err.message
});

throw err;
    }

}

/*
=========================================
CHECK TRANSACTION STATUS
=========================================
*/

async function checkStatus(checkoutRequestId) {

    try {

        const response = await axios.get(
            `${API_BASE}/transactions/`,
            {
                headers,
                params: {
                    checkout_request_id: checkoutRequestId
                }
            }
        );

        log("Transaction Status", response.data);

        return response.data;

    } catch (err) {

        error("Status Error", err.response?.data || err.message);

        throw err;

    }

}

/*
=========================================
SEND B2C PAYMENT
=========================================
*/

async function payout(phone, amount, reference) {

    try {

        const payload = {
            amount: Number(amount),
            phone_number: formatPhone(phone),
            external_reference: reference,
            command_id: "BusinessPayment",
            remarks: "AUTOPAY Withdrawal",
            callback_url: process.env.SWIFT_CALLBACK_URL
        };

        log("Sending B2C Payment", payload);

        const response = await axios.post(
            `${API_BASE}/pay-request/`,
            payload,
            { headers }
        );

        log("B2C Response", response.data);

        return response.data;

    } catch (err) {

        error("B2C Error", err.response?.data || err.message);

        throw err;

    }

}

/*
=========================================
GET WALLET BALANCE
=========================================
*/

async function getWalletBalance() {

    try {

        const response = await axios.get(
            `${API_BASE}/wallet/`,
            { headers }
        );

        return response.data;

    } catch (err) {

        error("Wallet Error", err.response?.data || err.message);

        throw err;

    }

}

/*
=========================================
SERVICE STATUS
=========================================
*/

async function serviceStatus() {

    try {

        const response = await axios.get(
            `${API_BASE}/service-status/`,
            { headers }
        );

        return response.data;

    } catch (err) {

        error("Service Status Error", err.response?.data || err.message);

        throw err;

    }

}

module.exports = {
    stkPush,
    checkStatus,
    payout,
    getWalletBalance,
    serviceStatus
};
