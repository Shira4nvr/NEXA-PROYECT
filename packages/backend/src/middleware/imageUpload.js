const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDirectory = process.env.UPLOADS_DIR || path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadsDirectory, { recursive: true });

const extensionsByType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}${extensionsByType[file.mimetype] || ".bin"}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!extensionsByType[file.mimetype]) {
      const error = new Error("Solo se permiten imágenes JPEG, PNG o WebP");
      error.status = 415;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

module.exports = { imageUpload, uploadsDirectory };