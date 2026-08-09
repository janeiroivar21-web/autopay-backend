const { db } = require("../config/firebase"); // Adjust if your Firebase file is elsewhere


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
    documents.idFront =
        "uploads/kyc/" + uid + "/" + files.idFront[0].filename;
}

if (files.idBack) {
    documents.idBack =
        "uploads/kyc/" + uid + "/" + files.idBack[0].filename;
}

if (files.selfie) {
    documents.selfie =
        "uploads/kyc/" + uid + "/" + files.selfie[0].filename;
}

if (files.businessCertificate) {
    documents.businessCertificate =
        "uploads/kyc/" + uid + "/" + files.businessCertificate[0].filename;
}

        // Save full KYC record
await db.collection("kyc").doc(uid).set({
    uid,
    fullName: req.body.fullName,
    phone: req.body.phone,
    idNumber: req.body.idNumber,
    personalStatus: "Pending",
    businessStatus: "Not Started",
    verificationLevel: 0,
    monthlyLimit: 0,
    documents,
    submittedAt: new Date()
}, { merge: true });
// Update user status
await db.collection("users").doc(uid).update({
    kycStatus: "Pending"
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

exports.submitBusinessKYC = async (req, res) => {

    try {

        const uid = req.body.uid;

        if (!uid) {
            return res.status(400).json({
                success: false,
                message: "Merchant UID is required."
            });
        }

        const files = req.files || {};

        const businessDocuments = {};

        if (files.permit) {
            businessDocuments.businessPermit =
                "uploads/kyc/" + uid + "/" + files.permit[0].filename;
        }

        if (files.kraPin) {
            businessDocuments.kraPin =
                "uploads/kyc/" + uid + "/" + files.kraPin[0].filename;
        }

        if (files.supportDocs) {
            businessDocuments.supportDocs =
                files.supportDocs.map(file =>
                    "uploads/kyc/" + uid + "/" + file.filename
                );
        }

        const kycRef = db.collection("kyc").doc(uid);

const existing = await kycRef.get();

const oldDocs = existing.exists
    ? (existing.data().documents || {})
    : {};

await kycRef.set({

    businessName: req.body.businessName,

    businessType: req.body.businessType,

    businessEmail: req.body.businessEmail,

    registrationNumber: req.body.registrationNumber,

    businessStatus: "Pending",

    documents: {
        ...oldDocs,
        ...businessDocuments
    }

}, { merge: true });

        return res.json({

            success: true,

            message: "Business verification submitted successfully."

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
