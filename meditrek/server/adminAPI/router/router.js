var express = require("express");
const upload = require("../controller/multer");
const uploadImage = require("../controller/multerimage");
const connection = require("../connection/connection");
const { approveDoctor, rejectDoctor, adminLogin, UpdateAdminPassword, getAllusersData, UpdateAdminProfile, ActivateDeactivateUser, DoctorActivateDeactivateUser, getAllDeletedUser, getDoctorSpecialization, addDoctorSpecialization, editDoctorSpecialization, deleteDoctorSpecialization, getAllDoctor, getAllMedicine, addMedicine, editMedicine, deleteMedicine, getdisease, addDisease, editDisease, deleteDisease, getAllSymptoms, addSymptom, editSymptom, deleteSymptom, getReportCategory, addReportCategory, editReportCategory, deleteReportCategory, getContent, getContentUrl, getHelpAndSupport, sendReply, sendBroadcastMessageAllUser, updateContent, getAdminAllData, getAllCompliance, getTabularUser, getUserAnalyticalReports, ViewUserDetails, get_all_count, get_medicine_types, add_medicine_type, update_medicine_type, delete_medicine_type, addDoctor, addFromWebsiteDoctor, editDoctor, deleteDoctor, fetchUsers, fetchdoctorbyuser, getAdverseofUser, AdminForgetPassword, adminForgetNewPassword, getMedicationList, getReport, getDoctorDetail, getDoctorUserSharedReport, getTabuldoctor, getDoctorAnalyticalReports, bulkUploadMedicine, bulkUploadDisease, bulkUploadSymptoms, viewCompliance, getFaq, addFaq, editFaq, deleteFaq, getUserMedicine,getFaqDoctor ,sendMessageByDoctorToAdmin,getAllDeletedDoctor,deleteUser,getLanguages,saveLanguages,getUserLanguages,updateUserLanguage,createPost,getInsightsPosts,updateInsightsPost,deleteInsightsPost,getAllInsightsPosts,} = require("../controller/admin_controller");
const { subAdminLogin,verifyLoginOtp, getProfile, UpdateSubAdminPassword, UpdateSubAdminProfile, ForgotPassword, subAdminForgetNewPassword, subAdminDashboard, medicationDashboard, adverseDashboard, labReportDashboard, measurementDashboard, getAllPatients, getPatientsDetails, getAllMedications, getAllMeasurements, getAllMedicalReports, addNote, getNotes, getTabularMedication, getTabularAdverse, getTabularMeasurement, getTabularLabreport, getSharedTabular, deleteNote, updateNote, deleteImage, deleteDoctorAccount, getPatientMeasurements, getPatientMedicationList, getPatientReport, getAdverseofPatient,dashboardGraphs,sendNotificationAll,sendNotificationUsers,getNotificationHistory,getAllDiseases,getAllMedicines,getPatientAnalyticsCustomTable,getPatientDemographics,getPatientDemographicsDetails,getPatientDiseasesMedicineAnalytics,getPatientDiseasesMedicineList ,getDiseaseMedicineSummary} = require("../controller/subAdminController.js")
const { verifyToken } = require("../controller/VerifyToken");
const uploadInsights = require('../../webservice/middleware/insightsUpload');
const router = express.Router();

// console.log("Admin routes loaded");
router.get('/get_patient_measurements', upload.none(), getPatientMeasurements);
router.get('/get_patient_medications_list', upload.none(), getPatientMedicationList);
router.get('/get_patient_reports', upload.none(), getPatientReport);
router.get('/fetchadverseof_patient', upload.none(),  getAdverseofPatient);


router.post("/login", upload.none(), adminLogin)
router.get("/get_admin_data", getAdminAllData)
router.post("/edit_admin_profile", uploadImage.single("image"), UpdateAdminProfile);
router.post("/update_password", upload.none(), UpdateAdminPassword)
router.get("/get_all_users", getAllusersData)
router.get("/get_user_data/:user_id", ViewUserDetails);
router.post("/active_deactive_user", upload.none(), ActivateDeactivateUser)
router.post("/delete_user", upload.none(), deleteUser);

router.post("/doctor_active_deactive_user", upload.none(), DoctorActivateDeactivateUser)


router.get("/get_all_deleted_users", getAllDeletedUser)
router.get("/get_doctor_specialization", getDoctorSpecialization)
router.post("/add_doctor_specialization", upload.none(), addDoctorSpecialization)
router.post("/edit_doctor_specialization", upload.none(), editDoctorSpecialization)
router.post("/delete_doctor_specialization", upload.none(), deleteDoctorSpecialization)
router.get("/get_all_doctor", getAllDoctor);
router.get("/get_all_deleted_doctor", getAllDeletedDoctor);
router.get("/get_doctor_detail", getDoctorDetail)
// router.post("/add_doctor",upload.single('image'),addDoctor)
router.get("/get_all_medicine", getAllMedicine)
router.post("/add_medicine", upload.none(), addMedicine)
router.post("/edit_medicine", upload.none(), editMedicine)
router.post("/delete_medicine", upload.none(), deleteMedicine)
router.get("/get_disease", getdisease)
router.post("/add_disease", upload.none(), addDisease)
router.post("/edit_disease", upload.none(), editDisease)
router.post("/delete_disease", upload.none(), deleteDisease)
router.get("/get_all_symptoms", getAllSymptoms)
router.post("/add_symptom", upload.none(), addSymptom)
router.post("/edit_symptom", upload.none(), editSymptom)
router.post("/delete_symptom", upload.none(), deleteSymptom)
router.get("/get_report_category", getReportCategory )
router.post("/add_report_category", uploadImage.single('image'), addReportCategory)
router.post("/edit_report_category", uploadImage.single('image'), editReportCategory)
router.post("/delete_report_category", upload.none(), deleteReportCategory)
router.get('/get_content', getContent);
router.get("/get_all_content_url", getContentUrl)
router.post("/update_content", upload.none(), updateContent)
router.get("/get_help_and_support", getHelpAndSupport)
router.post("/send_reply", upload.none(), sendReply)
router.post("/send_message_admin", upload.none(), sendMessageByDoctorToAdmin)
router.post("/send_broadcast_all_user", upload.none(), sendBroadcastMessageAllUser);
router.get("/get_tabular_user", getTabularUser);
router.get("/users_analytical_report", getUserAnalyticalReports);
router.get("/get_all_data_count", get_all_count)
router.get("/get_medicine_type", get_medicine_types)
router.post("/add_medicine_type", upload.none(), add_medicine_type)
router.post("/update_medicine_type", upload.none(), update_medicine_type)
router.post("/delete_medicine_type", upload.none(), delete_medicine_type)

router.post("/add_doctor", upload.single('image'), addDoctor)

router.post("/add_doctor_from_website", uploadImage.single("image"), addFromWebsiteDoctor);

router.post("/edit_doctor", upload.single('image'), editDoctor)
router.post("/delete_doctor", upload.none(), deleteDoctor)
router.get("/Users", fetchUsers);
router.get("/fetchdoctorby_user/:user_id", fetchdoctorbyuser)
router.get("/fetchadverseof_user/:user_id", getAdverseofUser);
router.post("/forgot_password", upload.none(), AdminForgetPassword);
router.post("/reset_password", upload.none(), adminForgetNewPassword);
router.get("/get_medication", getMedicationList);
router.get("/view_compliance", viewCompliance);
router.get("/get_all_compliance", getAllCompliance);
router.get("/get_reports", getReport);
router.post("/approve_doctor", upload.none(), approveDoctor);
router.post("/reject_doctor", upload.none(), rejectDoctor);
router.get("/get_doctor_user_shared_report", getDoctorUserSharedReport);
router.get("/get_tabular_doctor", getTabuldoctor);
router.get("/doctors_analytical_report", getDoctorAnalyticalReports);


//---------------------------------sub admin-----------------
router.post("/sub_login", upload.none(), subAdminLogin);
router.post("/verify_login_otp", upload.none(), verifyLoginOtp);
router.get("/get_profile", verifyToken, getProfile);
router.post("/update_sub_password", verifyToken, upload.none(), UpdateSubAdminPassword);
router.post("/edit_sub_admin_profile", verifyToken, uploadImage.single("image"), UpdateSubAdminProfile);
router.post("/forgot_sub_password", upload.none(), ForgotPassword);
router.post("/reset_sub_password", upload.none(), subAdminForgetNewPassword);
router.get("/sub_dashboard", verifyToken, subAdminDashboard);
router.get("/dashboard_graphs", verifyToken, dashboardGraphs);
router.get("/medication_dashboard", verifyToken, medicationDashboard)
router.get("/adverse_dashboard", verifyToken, adverseDashboard)
router.get("/lab_report_dashboard", verifyToken, labReportDashboard)
router.get("/measurement_dashboard", verifyToken, measurementDashboard)
router.get("/get_all_patient", verifyToken, getAllPatients);
router.get("/get_patient_details", verifyToken, getPatientsDetails);
router.get("/get_all_medications", verifyToken, getAllMedications)
router.get("/get_measurements", verifyToken, getAllMeasurements)
router.get("/get_lab_report", verifyToken, getAllMedicalReports)
router.post("/add_note", upload.none(), addNote)
router.get("/get_notes", getNotes)
router.post("/delete_image",upload.none(), deleteImage);
router.post("/delete_account",upload.none(), deleteDoctorAccount);

router.post("/delete_note", upload.none(), deleteNote);
router.post("/update_note", upload.none(), updateNote);


router.get("/get_medication_tabular", getTabularMedication)
router.get("/get_adverse_tabular", getTabularAdverse)
router.get("/get_measurement_tabular", getTabularMeasurement)
router.get("/get_lab_report_tabular", getTabularLabreport)
router.get("/get_shared_tabular", getSharedTabular)
router.post("/bulk_upload_medicine", upload.single("file"), bulkUploadMedicine);
router.post("/bulk_upload_disease", upload.single("file"), bulkUploadDisease);
router.post("/bulk_upload_symptoms", upload.single("file"), bulkUploadSymptoms);
router.get("/get_faq", getFaq)
router.get("/get_faq_doctor", getFaqDoctor)
router.post("/add_faq", upload.none(), addFaq)
router.post("/edit_faq", upload.none(), editFaq)
router.post("/delete_faq", upload.none(), deleteFaq)
router.get("/get_user_medicine", getUserMedicine)

// language api 
router.get('/languages', getLanguages);
router.post('/admin-save-languages', saveLanguages);
router.get('/user-languages', getUserLanguages);
router.post('/update-user-language', updateUserLanguage);

// Notification route
router.post("/send_notification_all", verifyToken, sendNotificationAll);
router.post("/send_notification_users", verifyToken, sendNotificationUsers);
router.get("/notification_history", verifyToken, getNotificationHistory);

// NewInsights post route

// router.post( '/new-insights-create-post',  uploadInsights.single('image'),  createPost);
// router.get('/get-insights-posts', getInsightsPosts);
// // router.post('/update-insights-post', upload.single('image'), updateInsightsPost);
// router.post('/update-insights-post', uploadInsights.single('image'), updateInsightsPost);
// router.post('/delete-insights-post', deleteInsightsPost);
// router.get('/get-all-insights-posts', getAllInsightsPosts);
router.get('/get-all-insights-posts', getAllInsightsPosts);

router.post('/new-insights-create-post', uploadInsights.single('image'), createPost);

router.get('/get-insights-posts', getInsightsPosts);

router.post('/update-insights-post', uploadInsights.single('image'), updateInsightsPost);

router.post('/delete-insights-post', deleteInsightsPost);

// anaylitcs api 
router.get('/subadmin/diseases', getAllDiseases);
router.get('/subadmin/medicines', getAllMedicines);
router.post('/subadmin-patient-analytics-CustomTable', getPatientAnalyticsCustomTable);
// router.post('/analytics-diseases', getDiseaseAnalytics);
// pdf cli api
router.post("/subadmin-patient-demographics", getPatientDemographics);
router.post("/subadmin-patient-demographics-details", getPatientDemographicsDetails);
// diseases medicine api route
router.post("/subadmin-DiseasesMedicine", getPatientDiseasesMedicineAnalytics);
router.post("/subadmin-DiseasesMedicine-Details", getPatientDiseasesMedicineList);
router.post("/subadmin-DiseasesMedicine-Summary", getDiseaseMedicineSummary);

module.exports = router;

