const express = require('express');
const upload = require('../middleware/multer');
const connection = require('../connection');
const { getAllContent, getAllContentUrl, getMyMedications, getTodayMedicationNew, getMyMedicationsHistory, getMedicine, getDocumentType, getReports, getResentReports, getBPData, getFastingGlucose, getPPBGS, getWeightMeasurement, getTemperature, getCustomMeasurement, getBPDataStats, getFastingGlucoseDataStats, getPPBGSDataStats, getWeightMeasurementDataStats, getTemperatureDataStats, getSymtoms, getAdverseReaction, getAdverseReactionById, getDoctors, getMyDoctors, ShareInformation, getDisease, getDateMedication,getFaq , getDocumentsByReportCategory, getBPDataStatus, deleteDoctor, getFastingGlucoseDataStatus, getPPBGSDataStatus, getWeightMeasurementDataStatus, getTemperatureDataStatus, shareInfoToDoctor, getMedicines, getMedicineHistory, deleteMeasurement} = require('../controller/get_controller');

const { signUp, userOtpVerify,verifyUserLoginOtp, userResendOtp, deleteAccount, editProfile, forgotPassword, forgotPasswordResendOtp, forgotPasswordVerifyOtp, resetPassword, changePassword, signIn, getUserNotification,getReminderData, getReminderDataMonthly, refillReminder,
    getReminderDataWeekly , getHomePageStatus, updateTimezone,getUserLanguages, updateUserLanguage, getLanguages,
    getMeasurementUnits,
    updateMeasurementUnit,
    getMeasurementReminderData,
    runAllRemindersCron,
    updateMeasurementReminderStatus} = require('../controller/user_controller');

const { sendContactUs, pauseMedication, MedicationMarkASTaken, insertMedicine, AddMedication, editMedication, DeleteMedication, addMedicalReport, deleteMedicalReport, getLaboratoryReportCounts, addBPData, addFastingGlucose, addPPBGS, addWeightMeasurement, addTemperature, addCustomMeasure, editCustomMeasure, deleteCustomMeasure, addAdverseReaction, editAdverseReaction, deleteAdverseReaction, addDoctors, clearAllNotifications, clearSingleNotifications,getBeforeTimeSlots, AddMedicationn, editNewMedication, getTodayMedication , shareReportToDoctor, homepage, checkReportsAddedStatus, getNotificationStatus, DeleteMedicationFromHistory, cronJobFunction, removePlayerId, homepage1, AddMeasurementReminder, GetMeasurementReminderList, EditMeasurementReminder, pauseMeasurementReminder, DeleteMeasurementReminder} = require('../controller/app_controller');


const router = express.Router();
var cron = require('node-cron');
const sendFCMPush = require('../helpers/fcm');

router.get("/get_reminder_data_cron",getReminderData);
router.get("/get_reminder_data_weekly_cron",getReminderDataWeekly);
router.get("/get_reminder_data_monthly_cron",getReminderDataMonthly);
router.get("/refill_reminder",refillReminder);
router.get("/get_before_time_slots",getBeforeTimeSlots);
router.get("/get_measurement_data_cron", getMeasurementReminderData);
router.get("/get_medication_reminder_data_cron", runAllRemindersCron);

router.post('/remove_player_id', upload.none(), removePlayerId);
router.get("/get_medicine_history",getMedicineHistory);
router.get("/get_faq",getFaq);
router.get('/get_content', upload.none(), getAllContent);
router.get('/get_all_content_url', upload.none(), getAllContentUrl);
router.get('/get_notification', upload.none(), getUserNotification);
router.get('/get_my_medication', upload.none(), getMyMedications);
router.get('/get_today_medication', upload.none(), getTodayMedication);
router.get('/get_medication_history', upload.none(), getMyMedicationsHistory);
router.get('/get_medicine', upload.none(), getMedicine);
router.get('/get_document_type', upload.none(), getDocumentType);
router.get('/get_laboratory_graph', upload.none(), getLaboratoryReportCounts);
router.get('/get_user_reports', upload.none(), getReports);
router.get('/get_user_recent_reports', upload.none(), getResentReports);
router.get('/get_bp_data', upload.none(), getBPData);
router.get('/get_fasting_glucose', upload.none(), getFastingGlucose);
router.get('/get_ppbgs_data', upload.none(), getPPBGS);
router.get('/get_weight_data', upload.none(), getWeightMeasurement);
router.get('/get_temperature_data', upload.none(), getTemperature);
router.get('/get_custom_measure', upload.none(), getCustomMeasurement);
router.get('/get_bp_data_graph', upload.none(), getBPDataStats);
router.get('/get_fasting_glucose_graph', upload.none(), getFastingGlucoseDataStats);
router.get('/get_ppbgs_graph', upload.none(), getPPBGSDataStats);
router.get('/get_weight_graph', upload.none(), getWeightMeasurementDataStats);
router.get('/get_temperature_graph', upload.none(), getTemperatureDataStats);
router.get('/get_symptoms', upload.none(), getSymtoms);
router.get('/get_adverse_reaction', upload.none(), getAdverseReaction);
router.get('/get_adverse_reaction_byid', upload.none(), getAdverseReactionById);
router.get('/get_doctors', upload.none(), getDoctors);
router.get('/get_my_doctors', upload.none(), getMyDoctors);
router.get('/share_information', upload.none(), ShareInformation);
router.get('/get_diseases', upload.none(), getDisease);
router.post('/get_medication_bydate', upload.none(), getDateMedication);

router.post('/update_timezone', upload.none(), updateTimezone);
router.post('/sign_up', upload.single('image'), signUp);
router.post('/otp_verify', upload.none(), userOtpVerify);
router.post('/resend_otp', upload.none(), userResendOtp);
router.post('/delete_account', upload.none(), deleteAccount);
router.post('/edit_profile', upload.single('image'), editProfile);
router.post('/forgot_password', upload.none(), forgotPassword);
router.post('/forgot_password_resendotp', upload.none(), forgotPasswordResendOtp);
router.post('/forgot_password_otpverify', upload.none(), forgotPasswordVerifyOtp);
router.post('/reset_password', upload.none(), resetPassword);
router.post('/change_password', upload.none(), changePassword);

router.post('/sign_in', upload.none(), signIn);
router.post('/verify_user_login_otp', upload.none(), verifyUserLoginOtp);
router.post('/help_and_support', upload.none(), sendContactUs);
router.post('/paused_medication', upload.none(), pauseMedication);
router.post('/mark_as_taken', upload.none(), MedicationMarkASTaken);
router.post('/create_medicine', upload.none(), insertMedicine);
router.post('/add_medication', upload.none(), AddMedication);
router.post('/edit_medication', upload.none(), editMedication);
router.post('/delete_medication', upload.none(), DeleteMedication);
router.post('/add_report', upload.single('file'), addMedicalReport);
router.post('/delete_report', upload.none(), deleteMedicalReport);
router.post('/add_bp_data', upload.none(), addBPData);
router.post('/add_fasting_glucose', upload.none(), addFastingGlucose);
router.post('/add_ppbgs_data', upload.none(), addPPBGS);
router.post('/add_weight_data', upload.none(), addWeightMeasurement);
router.post('/add_temperature_data', upload.none(), addTemperature);
router.post('/add_custom_measure', upload.none(), addCustomMeasure);
router.post('/edit_custom_measure', upload.none(), editCustomMeasure);
router.post('/delete_custom_measure', upload.none(), deleteCustomMeasure);
router.post('/add_adverse_reaction', upload.none(), addAdverseReaction);
router.post('/edit_adverse_reaction', upload.none(), editAdverseReaction);
router.post('/delete_adverse_reaction', upload.none(), deleteAdverseReaction);
router.post('/add_my_doctor', upload.none(), addDoctors);
router.post('/clear_all_notification', upload.none(), clearAllNotifications);
router.post('/clear_single_notification', upload.none(), clearSingleNotifications);
router.get('/get_document_by_category', getDocumentsByReportCategory);
router.get('/get_bp_status', getBPDataStatus);
router.post('/delete_doctor', upload.none(), deleteDoctor);
router.get('/get_fasting_glucose_status', getFastingGlucoseDataStatus);
router.get('/get_ppbgs_status', getPPBGSDataStatus);
router.get('/get_weight_status', getWeightMeasurementDataStatus);
router.get('/get_temperature_status', getTemperatureDataStatus);

router.post('/add_new_medication', upload.none(), AddMedicationn);
router.post('/edit_new_medication', upload.none(), editNewMedication);
router.get('/get_today_medication_new', upload.none(), getTodayMedicationNew);
router.post('/share_info_to_doctor', upload.none(), shareInfoToDoctor);
router.post('/share_report_to_doctor', upload.none(), shareReportToDoctor);
router.get('/get_homepage', upload.none(), homepage);
router.get('/get_all_medicines', getMedicines);
router.get('/get_report_added_status', upload.none(), checkReportsAddedStatus);
router.get('/get_notification_status', getNotificationStatus);
router.post('/ge_home_page_status', upload.none(), getHomePageStatus);
router.post('/delete_history_medication', upload.none(), DeleteMedicationFromHistory);

router.get('/get_homepage1', upload.none(), homepage1);

router.post('/delete_measurment',deleteMeasurement);
router.get('/user-languages', getUserLanguages);
router.post('/update-user-language', updateUserLanguage);
router.get('/languages', getLanguages);
router.post('/test-push', async (req, res) => {
  const { token } = req.body;

  const result = await sendFCMPush({
    token,
    title: "Test Push",
    body: "Hello from backend!",
  });

  res.send(result ? "Sent" : "Failed");
});
router.post('/debug-notification', async (req, res) => {
  try {
    const { user_id, player_id } = req.body;
    
    // Check user exists and notification enabled
    const [user] = await new Promise((resolve) => {
      connection.query(
        "SELECT user_id, notification_status FROM user_master WHERE user_id = ?",
        [user_id],
        (err, result) => resolve([result, err])
      );
    });
    
    if (!user || user.length === 0) {
      return res.status(200).json({ 
        success: false, 
        msg: "User not found" 
      });
    }
    
  
    
    // Check player_id in user_notification table
    const [notification] = await new Promise((resolve) => {
      connection.query(
        "SELECT player_id FROM user_notification WHERE user_id = ?",
        [user_id],
        (err, result) => resolve([result, err])
      );
    });
    
    const actualPlayerId = notification && notification.length > 0 
      ? notification[0].player_id 
      : null;
    
    // Test FCM directly
    const testResult = await sendFCMPush({
      token: player_id || actualPlayerId,
      title: "Debug Test",
      body: "This is a test notification from backend",
      data: {
        user_id: "1",
        other_user_id: "user_id",
        action_id: "0",
        action: "Test"
      }
    });
    
    return res.status(200).json({
  success: testResult,
  msg: testResult ? "Notification sent" : "Notification failed",
  debug_info: {
    user_exists: user.length > 0,
    notification_status: user[0].notification_status,
    notifications_enabled: user[0].notification_status == '1',
    provided_player_id: player_id,
    db_player_id: actualPlayerId,
    match: actualPlayerId === player_id,
    length: (actualPlayerId || '').length
  }
});

    
  } catch (error) {
    return res.status(200).json({
      success: false,
      msg: "Error",
      error: error.message
    });
  }
});
//Cron Job function
// cron.schedule('0 0 * * *', () => {
//     cronJobFunction(); 
// }, {
//     scheduled: true,
//     timezone: "Asia/Kolkata" // or your desired timezone
// });


// cron.schedule('* * * * *', () => {
//     cronJobFunction();
// });

router.post('/getMeasurementUnits', getMeasurementUnits);
router.post('/updateMeasurementUnit', updateMeasurementUnit);
router.post('/add_measurementReminder', upload.none(), AddMeasurementReminder);
router.get('/get_measurement_reminder_list', GetMeasurementReminderList);
router.post('/edit_measurementReminder', EditMeasurementReminder);
router.post('/pauseMeasurementReminder', pauseMeasurementReminder);
router.post('/deleteMeasurementReminder', DeleteMeasurementReminder);
router.post('/updateMeasurementReminder', updateMeasurementReminderStatus);

module.exports = router;