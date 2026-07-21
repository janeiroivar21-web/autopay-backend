function log(title, data = "") {

    console.log(
        `[${new Date().toISOString()}] ${title}`,
        data
    );

}

function error(title, data = "") {

    console.error(
        `[${new Date().toISOString()}] ${title}`,
        data
    );

}

module.exports = {
    log,
    error
};
