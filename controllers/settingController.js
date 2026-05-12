import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import {getDataURI} from "../utils/dataURI.js";
import cloudinary from "../utils/cloudinary.js";

export const changePassword = async (req, res) => {
  try {
    const userId  = req.id;
    const role  = req.role;
     const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID" });
    }

   
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please Provide Old and New Password",
        });
    }
    if(oldPassword === newPassword){
      return res
        .status(400).json({
          success: false,
          message: "New Password cannot be same as Old Password",
        });
    }
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }

    if (role !== user.role) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Forbidden : You don't have permission to change password",
        });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if(!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Old Password is Incorrect" });
    } 
  
    else {
      user.password = newPassword;
      await user.save();
      return res.status(200)
        .json({ success: true, message: "Password Changed Successfully" });
    }
  } 
  catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const getProfile = async (req, res) => {
 try{
    const userId  = req.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid User ID" });
    }

    const user = await userModel.findById(userId);
  
 if (user) {
    const userData={
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        profile: user.profile,
    }
    return res.status(200).json({ success: true, user: userData });
    } 
    else {
      return res.status(404).json({ success: false, message: "User not found" });
    }
 }catch(err){
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
 }};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.id;

    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User ID" });
    }

    const { fullname, username, email, phone, address } = req.body || {};

    const allowedFields = ["fullname", "username", "email", "phone", "address"];
    const unknownFields = Object.keys(req.body || {}).filter(
      (f) => !allowedFields.includes(f)
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        message: `Invalid field(s): ${unknownFields.join(", ")}`,
        success: false,
      });
    }

   
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

   
    const profile = req.file;
    let cloudResponse = null; 

    if (profile) {
      // old image delete 
      const imagePublicID = user.profilePublicID;
      if (imagePublicID) {
        try {
          await cloudinary.uploader.destroy(imagePublicID); // ← sahi variable
          console.log("Old image deleted successfully");
        } catch (deleteErr) {
          console.log(`Error deleting image: ${deleteErr}`);
        }
      }

      // upload new image 
      const fileURI = getDataURI(profile);
      cloudResponse = await cloudinary.uploader.upload(fileURI.content, {
        folder: "ERP/Profiles",
      });

      
      if (!cloudResponse) {
        return res.status(400).json({
          message: "Failed to Upload Profile Image!",
          success: false,
        });
      }
    }

 
    user.fullname = fullname || user.fullname;
    user.username = username || user.username;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    // Sirf tab update karo jab cloudResponse ho
    if (cloudResponse) {
      user.profile = cloudResponse.secure_url;
      user.profilePublicID = cloudResponse.public_id;
    }

    await user.save();
    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

