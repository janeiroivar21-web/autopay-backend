function formatPhone(phone) {

    phone = phone.toString().trim();

    if (phone.startsWith("+254")) {
        return phone.replace("+", "");
    }

    if (phone.startsWith("254")) {
        return phone;
    }

    if (phone.startsWith("07")) {
        return "254" + phone.substring(1);
    }

    if (phone.startsWith("01")) {
        return "254" + phone.substring(1);
    }

    return phone;
}

module.exports = {
    formatPhone
};
