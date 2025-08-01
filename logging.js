// Copy this content into a new file named 'logging.js'.
// This is a simple logger module to handle console output.

const logger = {
    info: (message) => {
        console.log(`[INFO] ${message}`);
    },
    warn: (message) => {
        console.warn(`[WARN] ${message}`);
    },
    error: (message) => {
        console.error(`[ERROR] ${message}`);
    }
};

module.exports = {
    logger
};
