const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage()
module.exports = storage;