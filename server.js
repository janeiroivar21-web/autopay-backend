require("dotenv").config();

const express = require("express");
const cors = require("cors");

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
ROUTES
=========================================
*/

app.use("/api", require("./routes/stk"));
app.use("/api", require("./routes/status"));
app.use("/api", require("./routes/withdraw"));

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
