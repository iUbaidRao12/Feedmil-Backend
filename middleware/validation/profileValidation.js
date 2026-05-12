import {body, validationResult } from "express-validator"

export const updateProfileValidator=[

body("fullname")
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage("Fullname must be at least 3 characters")
    .matches(/^[a-zA-Z\s]+$/).withMessage("Fullname must contain letters only"),
body("username")
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage("Username must be at least 3 characters")
    .matches(/^[a-zA-Z\s]+$/).withMessage("Username must contain letters only"),
body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Invalid email format"),
body("phone")
    .optional()
    .trim()
    .matches(/^[0-9\-]+$/).withMessage("Phone must contain numbers only")
    .isLength({ min: 10, max: 15 }).withMessage("Phone must be between 10 and 15 digits"),
body("address")
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage("Address must be at least 3 characters")
    .matches(/^[a-zA-Z0-9\s,.-]+$/).withMessage("Address must contain letters, numbers, and common punctuation"),
]

export const validationHandler=(req,res,next)=>{
    const errors=validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    next()
}
