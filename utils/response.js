function success(res, message, data = {}) {

    return res.json({
        success: true,
        message,
        ...data
    });

}

function error(res, message, code = 500) {

    return res.status(code).json({
        success: false,
        message
    });

}

module.exports = {
    success,
    error
};
