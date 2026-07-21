const { v4: uuid } = require("uuid");

function generateReference(prefix = "TXN") {

    return `${prefix}_${Date.now()}_${uuid().substring(0,8)}`;

}

module.exports = {
    generateReference
};
