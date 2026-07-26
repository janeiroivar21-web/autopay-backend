const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
    submitKYC
} = require("../controllers/kycController");

router.post(

    "/upload",

    upload.fields([

        { name: "idFront", maxCount: 1 },

        { name: "idBack", maxCount: 1 },

        { name: "selfie", maxCount: 1 },

        { name: "businessCertificate", maxCount: 1 }

    ]),

    submitKYC

);

module.exports = router;
