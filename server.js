const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AUTOPAY Backend is running"
    });
});

app.use("/api/stk-push", require("./routes/stk"));
app.use("/api/check-status", require("./routes/status"));
app.use("/api/withdraw", require("./routes/withdraw"));
app.use("/api/merchant", require("./routes/merchant"));
app.use("/api/webhook", require("./routes/webhook"));

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 AUTOPAY Backend running on port ${PORT}`);
});
