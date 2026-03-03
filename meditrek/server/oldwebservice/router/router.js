const express = require('express');
const { signUp, otpVerify, resendOtp, login, forgetPassword, forgetPasswordResendOtp, forgetPasswordOtpVerify, changePassword, deleteAccount, add_doctor, add_adverse_reaction, get_AdverseReaction, get_doctor_list, edit_doctor, delete_doctor, add_measurement, add_custom_measurement, add_report, delete_report, get_content, getContentById, getMeasurement, get_medicine_detail, help_and_support, edit_adverse_reaction, delete_adverse_reaction, get_custom_measurement, get_report, update_profile, view_Profile, get_all_report, get_report_by_category, add_medication, edit_medication, delete_medication, medicine_taken, get_medication_details } = require('../controller/userController');
const router = express.Router();
const upload = require('../controller/multer');



router.post('/sign_up', upload.none(), signUp);
router.post('/otp_verify',upload.none(),otpVerify)
router.post('/resend_otp',upload.none(),resendOtp)
router.post('/login',upload.none(),login)
router.post("/forgetpassword", upload.none(), forgetPassword);
router.post("/forgetpasswordresendotp", upload.none(), forgetPasswordResendOtp)
router.post("/forgetpasswordotpverify", upload.none(), forgetPasswordOtpVerify)
router.post('/changepassword',upload.none(),changePassword)
router.post("/deleteaccount",upload.none(),deleteAccount)
router.post("/help_and_support",upload.none(),help_and_support)
router.post("/update_profile",upload.single('file'),update_profile)
router.get("/view_profile",view_Profile)



//user
router.post("/add_medication",upload.none(),add_medication)
router.post("/edit_medication",upload.none(),edit_medication)
router.post("/delete_medication",upload.none(),delete_medication)
router.post("/medicine_taken",upload.none(),medicine_taken)
router.get("/get_medication_details",get_medication_details)


router.post("/add_doctor",upload.none(),add_doctor)
router.get("/get_doctor_details",get_doctor_list),
router.post("/edit_doctor",upload.none(),edit_doctor)
router.post("/delete_account",upload.none(),delete_doctor)

router.post("/add_measurement",upload.none(),add_measurement)
router.get("/get_measurement",getMeasurement)
router.post("/add_custom_measurement",upload.none(),add_custom_measurement)
router.get("/get_custom_measurement",get_custom_measurement);

router.post('/add_document', upload.single('file'), add_report);
router.post('/delete_report',upload.none(),delete_report)
router.get("/get_all_report",upload.none(),get_all_report)
router.get("/get_report_by_category",upload.none(),get_report_by_category)


router.post("/add_adverse_reaction",upload.none(),add_adverse_reaction)
router.get("/get_adverse__reaction",get_AdverseReaction),
router.post("/edit_adverse_reaction",upload.none(),edit_adverse_reaction)
router.post("/delete_adverse_reaction",upload.none(),delete_adverse_reaction)



router.get("/getcontent",get_content)
router.get("/getcontentbyid",getContentById)
router.get("/get_medicine_detail",get_medicine_detail)



module.exports=router
