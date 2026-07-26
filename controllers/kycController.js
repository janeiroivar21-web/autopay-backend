const { db } = require("../firebase"); // Adjust if your Firebase file is elsewhere

const { doc, updateDoc, serverTimestamp } = require("firebase/firestore");

exports.submitKYC = async (req, res) => {

    try {

        const uid = req.body.uid;

        if (!uid) {
            return res.status(400).json({
                success: false,
                message: "Merchant UID is required."
            });
        }

        const files = req.files;

        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No documents uploaded."
            });
        }

        const documents = {};

        if (files.idFront) {
            documents.idFront = files.idFront[0].path;
        }

        if (files.idBack) {
            documents.idBack = files.idBack[0].path;
        }

        if (files.selfie) {
            documents.selfie = files.selfie[0].path;
        }

        if (files.businessCertificate) {
            documents.businessCertificate =
                files.businessCertificate[0].path;
        }

        await updateDoc(doc(db, "users", uid), {

            kycStatus: "Submitted",

            kycSubmittedAt: serverTimestamp(),

            kycDocuments: documents

        });

        return res.json({

            success: true,

            message: "KYC submitted successfully."

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
