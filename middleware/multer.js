// <= IMPORTS =>
import multer from "multer";

// <= CONFIGURING STORAGE =>
const storage = multer.memoryStorage();

// <= HANDLING SINGLE FILE UPLOAD =>
export const singleUpload = multer({ storage }).single("profile");

// <= HANDLING MULTIPLE FILE UPLOAD =>
export const multipleUpload = multer({ storage });
