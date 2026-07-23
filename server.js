require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { stkPush: sendStk } = require("./services/swiftService");

const app = express();

const PORT = process.env.PORT || 5000;

/*
=========================================
MIDDLEWARE
=========================================
*/

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
=========================================
HEALTH CHECK
=========================================
*/

app.get("/", (req, res) => {
    res.json({
        success: true,
        name: "AUTOPAY Backend",
        version: "1.0.0",
        status: "Running"
    });
});

/*
=========================================
API HEALTH
=========================================
*/

app.get("/health", (req, res) => {
    res.json({
        success: true,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

/*
=========================================
TEST STK
=========================================
*/

app.get("/test-stk", async (req, res) => {
    try {

        const result = await sendStk(
            "254702448518",   // Replace with your test phone if needed
            10,
            "TEST-" + Date.now(),
            "AUTOPAY Test"
        );

        res.json(result);

    } catch (err) {

        res.status(500).json({
            message: err.message,
            response: err.response?.data || null
        });

    }
});

/*
=========================================
ROUTES
=========================================
*/

// STK Push
app.use("/api/stk-push", require("./routes/stk"));

// Payment Status
app.use("/api/check-status", require("./routes/status"));

// Withdrawals
app.use("/api/withdraw", require("./routes/withdraw"));

// Merchant Management
app.use("/api/merchant", require("./routes/merchant"));

// Webhooks
app.use("/api/webhook", require("./routes/webhook"));

/*
=========================================
404
=========================================
*/

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found"
    });
});

/*
=========================================
START SERVER
=========================================
*/

app.listen(PORT, () => {
    console.log(`
=========================================
 AUTOPAY BACKEND
=========================================
 Running on Port : ${PORT}
 Environment     : ${process.env.NODE_ENV}
=========================================
`);
});
