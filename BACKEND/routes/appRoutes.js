// BACKEND/routes/appRoutes.js
const express = require('express');
const { body } = require('express-validator');
const appCtrl = require('../controllers/appControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: App
 *   description: App endpoints (login, profile, updatedProfile)
 */

/**
 * @swagger
 * /app/login:
 *   post:
 *     summary: Login with email + password + role_id
 *     tags: [App]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_email:
 *                 type: string
 *               password:
 *                 type: number
 *               role_id:
 *                 type: number
 *     responses:
 *       200:
 *         description: Returns JWT token and user profile
 */
router.post(
    '/login',
    [
        body('user_email').isEmail().withMessage("Invalid email"),
        body('role_id').isInt().withMessage("role_id required"),
        body('password')
            .matches(/^[0-9]{6}$/)
            .withMessage("Password must be 6 digits")
    ],
    appCtrl.login
);

/**
 * @swagger
 * /app/profile/{user_id}:
 *   get:
 *     summary: Get user profile by user_id (Requires JWT)
 *     tags: [App]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: number
 *         required: true
 *         description: User ID to fetch profile
 *     responses:
 *       200:
 *         description: User profile returned
 */
router.get('/profile/:user_id', authMiddleware(), appCtrl.getProfileById);

/**
 * @swagger
 * /app/updatedProfile/{user_id}:
 *   put:
 *     summary: Update user profile (name, phone, status)
 *     tags: [App]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: number
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *               user_phone:
 *                 type: number
 *               status:
 *                 type: boolean
 *               password:
 *                 type:password
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/updatedProfile/:user_id', authMiddleware(), appCtrl.updateProfile);

/**
 * @swagger
 * /app/configIMEInumber:
 *   post:
 *     summary: Configure IMEI number for a device
 *     tags: [App]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serial_number:
 *                 type: string
 *                 description: Device serial number
 *               imei_number:
 *                 type: string
 *                 description: IMEI number to configure
 *               user_email:
 *                 type: string
 *                 format: email
 *                 description: User email for verification
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of the configuration
 *               latitude:
 *                 type: string
 *                 format: latitude
 *                 description: latitude of the configuration
 *               longitude:
 *                 type: string
 *                 format: longitude
 *                 description: longitude of the configuration
 *               motor_hp:
 *                 type: string
 *                 format: motor_hp
 *                 description: motor_hp of the configuration
 *             required:
 *               - serial_number
 *               - imei_number
 *               - user_email
 *               - timestamp
 *               - latitude
 *               - longitude
 *               - motor_hp
 *     responses:
 *       200:
 *         description: IMEI configured successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Device not found or not assigned to user
 *       500:
 *         description: Server error
 */
router.post(
    '/configIMEInumber',
    // authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('imei_number').notEmpty().withMessage("IMEI number is required"),
        body('user_email').isEmail().withMessage("Valid user email is required"),
        body('timestamp').notEmpty().withMessage("Timestamp is required"),
        body('latitude').notEmpty().withMessage("latitude is required"),
        body('longitude').notEmpty().withMessage("longitude is required"),
        body('motor_hp').notEmpty().withMessage("motor_hp is required")
    ],
    appCtrl.configIMEInumber
);

/**
 * @swagger
 * /app/startStopDevice:
 *   post:
 *     summary: Start or Stop a device
 *     description: Set device start_status true/false and store startAt / stopAt time.
 *     tags:
 *       - Device Control
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serial_number
 *               - imei_number
 *               - user_email
 *               - start_status
 *             properties:
 *               serial_number:
 *                 type: string
 *                 example: "SN0987654321"
 *               imei_number:
 *                 type: string
 *                 example: "IMEI0987654321"
 *               user_email:
 *                 type: string
 *                 example: "admin@gmail.com"
 *               start_status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Device status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Device not found
 */
router.post(
    '/startStopDevice',
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('imei_number').notEmpty().withMessage("IMEI number is required"),
        body('user_email').isEmail().withMessage("Valid user email is required"),
        body('start_status').isBoolean().withMessage("start_status must be boolean"),
    ],
    appCtrl.startStopDevice
);

/**
* @swagger
* /app/userAssignDevices:
*   post:
*     summary: Get all devices assigned to a given user
*     tags: [App]
*     description: Returns list of devices assigned to a user based on user_id with count.
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*                 description: Unique user identifier
*     responses:
*       200:
*         description: Successfully retrieved assigned devices
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 count:
*                   type: integer
*                 data:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       serial_number:
*                         type: string
*                       imei_number:
*                         type: string
*                       latitude:
*                         type: string
*                       longitude:
*                         type: string
*                       user_details:
*                         type: object
*                         properties:
*                           user_name:
*                             type: string
*                           user_email:
*                             type: string
*                           user_phone:
*                             type: string
*       400:
*         description: Missing user_id in request body
*       404:
*         description: No assigned devices found
*       500:
*         description: Server error
*/

router.post(
    '/userAssignDevices',
    [
        body('user_id').notEmpty().withMessage("User ID is required"),
    ],
    appCtrl.userAssignDevices
);

/**
* @swagger
* /app/userDeviceDetails:
*   post:
*     summary: Get device details by serial and IMEI number
*     tags: [App]
*     description: Returns detailed information about a specific device
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - serial_number
*               - imei_number
*             properties:
*               serial_number:
*                 type: string
*                 example: "SN0987654321"
*                 description: Device serial number
*               imei_number:
*                 type: string
*                 example: "IMEI0987654321"
*                 description: Device IMEI number
*     responses:
*       200:
*         description: Device details retrieved successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 data:
*                   type: object
*                   properties:
*                     _id:
*                       type: string
*                     serial_number:
*                       type: string
*                     imei_number:
*                       type: string
*                     latitude:
*                       type: string
*                     longitude:
*                       type: string
*                     motor_hp:
*                       type: string
*                     start_status:
*                       type: boolean
*                     startAt:
*                       type: string
*                       format: date-time
*                     stopAt:
*                       type: string
*                       format: date-time
*       404:
*         description: Device not found
*       500:
*         description: Server error
*/
router.post(
    '/userDeviceDetails',
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('imei_number').notEmpty().withMessage("IMEI number is required"),
    ],
    appCtrl.userDeviceDetails
);

/**
* @swagger
* /app/userDeviceHistory:
*   post:
*     summary: Get telemetry history for all user devices
*     tags: [App]
*     description: Returns grouped telemetry history data for all devices assigned to a user with count and timestamp
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*                 description: Unique user identifier
*     responses:
*       200:
*         description: Successfully retrieved device history
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 count:
*                   type: integer
*                   description: Total number of devices with history
*                 data:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       serial_number:
*                         type: string
*                       count:
*                         type: integer
*                         description: Number of history records for this device
*                       last_updated:
*                         type: string
*                         format: date-time
*                       records:
*                         type: array
*                         items:
*                           type: object
*                           properties:
*                             timestamp:
*                               type: string
*                               format: date-time
*                             telemetry:
*                               type: object
*                             startAt:
*                               type: string
*                               format: date-time
*                             stopAt:
*                               type: string
*                               format: date-time
*                             duration:
*                               type: number
*       400:
*         description: Validation error
*       404:
*         description: User not found
*       500:
*         description: Server error
*/
router.post(
    '/userDeviceHistory',
    [
        body('user_id').notEmpty().withMessage("User ID is required"),
    ],
    appCtrl.userDeviceHistory
);

/**
 * @swagger
 * /app/analytics:
 *   post:
 *     tags:
 *       - Telemetry Analytics
 *     summary: Get analytics for selected telemetry metric
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [motor_rpm, motor_frequency_hz, power_kw, current_rms, voltage_rms, energy_kwh, device_temp_c, signal_strength]
 *         required: true
 *         description: Select telemetry measurement field
 *         example: motor_rpm
 *       - in: query
 *         name: serial_number
 *         schema:
 *           type: string
 *         description: Filter for specific device serial number
 *         example: "SN098765432123456789"
 *       - in: query
 *         name: imei_number
 *         schema:
 *           type: string
 *         description: Filter for specific device imei
 *         example: "IMEI0987654321234564444"
 *     responses:
 *       200:
 *         description: Telemetry analytics chart data with daily, weekly, monthly, yearly arrays
 *       400:
 *         description: Invalid or missing parameters
 *       500:
 *         description: Server error
 */
router.post("/analytics", appCtrl.getTelemetryAnalytics);

module.exports = router;
