const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        const uid = req.body.uid;

        if (!uid) {
            return cb(new Error("Merchant UID missing"));
        }

        const uploadDir = path.join(
            __dirname,
            "..",
            "uploads",
            "kyc",
            uid
        );

        fs.mkdirSync(uploadDir, { recursive: true });

        cb(null, uploadDir);

    },

    filename: (req, file, cb) => {

        const ext = path.extname(file.originalname).toLowerCase();

        let filename = file.fieldname + ext;

        cb(null, filename);

    }

});

const upload = multer({

    storage,

    limits: {

        fileSize: 5 * 1024 * 1024

    },

    fileFilter: (req, file, cb) => {

        const allowed = [

            "image/jpeg",
            "image/png",
            "application/pdf"

        ];

        if (allowed.includes(file.mimetype)) {

            cb(null, true);

        } else {

            cb(new Error("Only JPG, PNG and PDF are allowed."));

        }

    }

});

module.exports = upload;
