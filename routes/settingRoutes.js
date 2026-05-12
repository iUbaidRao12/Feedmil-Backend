import {changePassword,getProfile,updateProfile}from "../controllers/settingController.js";
import express from "express";
import { isLogin} from "../middleware/isAuthenticated.js";
import {updateProfileValidator as UPV ,validationHandler as VH} from "../middleware/validation/profileValidation.js";
import {singleUpload} from "../middleware/multer.js";


const router = express.Router();
router.use(isLogin)
router.post("/changePassword",changePassword)
router.get("/getProfile",getProfile)
router.post("/updateProfile",UPV,VH,singleUpload,updateProfile)

export default router;
