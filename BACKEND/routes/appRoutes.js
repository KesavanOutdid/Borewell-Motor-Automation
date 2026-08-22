// BACKEND/routes/appRoutes.js
const express = require('express');
const { body } = require('express-validator');
const appCtrl = require('../controllers/appControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadImage } = require('../config/multerConfig');
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
 * /app/signup:
 *   post:
 *     summary: Signup new user and return JWT token
 *     tags: [App]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *               user_email:
 *                 type: string
 *               user_phone:
 *                 type: number
 *               password:
 *                 type: number
 *               role_id:
 *                 type: number
 *     responses:
 *       201:
 *         description: User created and token returned
 */
router.post(
    '/signup',
    [
        body('user_name').notEmpty().withMessage("user_name required"),
        body('user_email').isEmail().withMessage("Invalid email"),
        body('role_id').isInt().withMessage("role_id required"),
        body('user_phone').matches(/^[0-9]{10}$/).withMessage("Phone must be 10 digits"),
        body('password')
            .matches(/^[0-9]{6}$/)
            .withMessage("Password must be 6 digits")
    ],
    appCtrl.signup
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
router.get('/getAssignedDevices', authMiddleware(), appCtrl.getAssignedDevices);

/**
 * @swagger
 * /app/uploadProfileImage/{user_id}:
 *   post:
 *     summary: Upload profile image for user
 *     tags: [App]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: number
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (max 5MB, PNG/JPG/JPEG only)
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *       400:
 *         description: No image file uploaded or invalid file type
 *       404:
 *         description: User not found
 */
router.post('/uploadProfileImage/:user_id', authMiddleware(), uploadImage.single('image'), appCtrl.uploadProfileImage);

/**
 * @swagger
 * /app/deleteProfileImage/{user_id}:
 *   delete:
 *     summary: Delete profile image for user
 *     tags: [App]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: number
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile image deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/deleteProfileImage/:user_id', authMiddleware(), appCtrl.deleteProfileImage);

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
 *               - user_email
 *               - timestamp
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
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('user_email').isEmail().withMessage("Valid user email is required"),
        body('phone_number').notEmpty().withMessage("Phone number is required"),
        body('timestamp').notEmpty().withMessage("Timestamp is required")
    ],
    appCtrl.configIMEInumber
);

/**
 * @swagger
 * /app/updateDeviceNickname:
 *   post:
 *     summary: Update device nickname
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
 *               device_nickname:
 *                 type: string
 *                 description: New nickname for the device (optional)
 *               user_email:
 *                 type: string
 *                 format: email
 *                 description: User email for verification
 *             required:
 *               - serial_number
 *               - user_email
 *     responses:
 *       200:
 *         description: Device nickname updated successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Only device owner can update nickname
 *       404:
 *         description: Device or user not found
 *       500:
 *         description: Server error
 */
router.post(
    '/updateDeviceNickname',
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('user_email').isEmail().withMessage("Valid user email is required")
    ],
    appCtrl.updateDeviceNickname
);

/**
 * @swagger
 * /app/updateFcmToken:
 *   post:
 *     summary: Update user's FCM token for push notifications
 *     tags: [App]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_email
 *               - fcm_token
 *             properties:
 *               user_email:
 *                 type: string
 *               fcm_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 */
router.post(
    '/updateFcmToken',
    authMiddleware(),
    [
        body('user_email').isEmail().withMessage("Valid user email is required"),
        body('fcm_token').notEmpty().withMessage("FCM token is required")
    ],
    appCtrl.updateFcmToken
);

/**
 * @swagger
 * /app/removeFcmToken:
 *   post:
 *     summary: Remove user's FCM token on logout
 *     tags: [App]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_email
 *               - fcm_token
 *             properties:
 *               user_email:
 *                 type: string
 *               fcm_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token removed successfully
 */
router.post(
    '/removeFcmToken',
    authMiddleware(),
    [
        body('user_email').isEmail().withMessage("Valid user email is required"),
        body('fcm_token').notEmpty().withMessage("FCM token is required")
    ],
    appCtrl.removeFcmToken
);

/**
 * @swagger
 * /app/getProducts:
 *   get:
 *     summary: Get all active products with pagination
 *     tags: [App]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Paginated list of active products
 */
router.get('/getProducts', appCtrl.getProducts);

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
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        // body('imei_number').notEmpty().withMessage("IMEI number is required"),
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
    authMiddleware(),
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
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        // body('imei_number').notEmpty().withMessage("IMEI number is required"),
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
    authMiddleware(),
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
router.post("/analytics", authMiddleware(), appCtrl.getTelemetryAnalytics);

/**
* @swagger
* /app/addCart:
*   post:
*     summary: Add product to cart
*     tags: [Cart]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - product_id
*               - quantity
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*                 description: User ID
*               product_id:
*                 type: integer
*                 example: 1
*                 description: Product ID to add to cart
*               quantity:
*                 type: integer
*                 example: 2
*                 description: Quantity to add
*     responses:
*       201:
*         description: Product added to cart successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 message:
*                   type: string
*                 cart:
*                   type: object
*       400:
*         description: Validation error or insufficient product quantity
*       404:
*         description: User or product not found
*       500:
*         description: Server error
*/
router.post(
    '/addCart',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('product_id').isInt().withMessage("product_id must be an integer"),
        body('quantity').isInt({ min: 1 }).withMessage("quantity must be at least 1")
    ],
    appCtrl.addCart
);

/**
* @swagger
* /app/fetchCart:
*   post:
*     summary: Fetch user cart with product details including images
*     tags: [Cart]
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
*                 description: User ID
*     responses:
*       200:
*         description: Cart fetched successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 message:
*                   type: string
*                 cart:
*                   type: object
*                   properties:
*                     cart_id:
*                       type: integer
*                     user_id:
*                       type: integer
*                     items:
*                       type: array
*                       items:
*                         type: object
*                         properties:
*                           product_id:
*                             type: integer
*                           product_name:
*                             type: string
*                           product_price:
*                             type: number
*                           product_gst:
*                             type: number
*                           product_shipping_cost:
*                             type: number
*                           quantity:
*                             type: integer
*                           product_main_image:
*                             type: string
*                             description: Product image URL path
*                           added_at:
*                             type: string
*                             format: date-time
*                     total_price:
*                       type: number
*                     total_gst:
*                       type: number
*                     total_shipping_cost:
*                       type: number
*                     grand_total:
*                       type: number
*       400:
*         description: Validation error
*       404:
*         description: User not found
*       500:
*         description: Server error
*/
router.post(
    '/fetchCart',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer")
    ],
    appCtrl.fetchCart
);

/**
* @swagger
* /app/updatedCart:
*   post:
*     summary: Update cart item quantity
*     tags: [Cart]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - product_id
*               - quantity
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*                 description: User ID
*               product_id:
*                 type: integer
*                 example: 1
*                 description: Product ID
*               quantity:
*                 type: integer
*                 example: 5
*                 description: New quantity
*     responses:
*       200:
*         description: Cart updated successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 message:
*                   type: string
*                 cart:
*                   type: object
*       400:
*         description: Validation error or insufficient product quantity
*       404:
*         description: User, product, or cart not found
*       500:
*         description: Server error
*/
router.post(
    '/updatedCart',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('product_id').isInt().withMessage("product_id must be an integer"),
        body('quantity').isInt({ min: 1 }).withMessage("quantity must be at least 1")
    ],
    appCtrl.updatedCart
);

/**
* @swagger
* /app/productDelete:
*   post:
*     summary: Delete single product from cart
*     tags: [Cart]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - product_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*                 description: User ID
*               product_id:
*                 type: integer
*                 example: 1
*                 description: Product ID to remove
*     responses:
*       200:
*         description: Product removed from cart successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 message:
*                   type: string
*                 cart:
*                   type: object
*       400:
*         description: Validation error
*       404:
*         description: User, product, or cart not found
*       500:
*         description: Server error
*/
router.post(
    '/productDelete',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('product_id').isInt().withMessage("product_id must be an integer")
    ],
    appCtrl.productDelete
);

/**
* @swagger
* /app/allProductDelete:
*   post:
*     summary: Clear all products from cart
*     tags: [Cart]
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
*                 description: User ID
*     responses:
*       200:
*         description: Cart cleared successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 message:
*                   type: string
*                 cart:
*                   type: object
*                   properties:
*                     user_id:
*                       type: integer
*                     items:
*                       type: array
*                     total_price:
*                       type: number
*                     total_gst:
*                       type: number
*                     total_shipping_cost:
*                       type: number
*                     grand_total:
*                       type: number
*       400:
*         description: Validation error
*       404:
*         description: User or cart not found
*       500:
*         description: Server error
*/
router.post(
    '/allProductDelete',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer")
    ],
    appCtrl.allProductDelete
);

/**
 * @swagger
 * tags:
 *   name: Vouchers
 *   description: Voucher management endpoints
 */

/**
 * @swagger
 * /app/validateVoucher:
 *   post:
 *     summary: Validate voucher code with user ID
 *     tags: [Vouchers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - voucher_code
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 11
 *               voucher_code:
 *                 type: string
 *                 example: "SAVE20"
 *     responses:
 *       200:
 *         description: Voucher is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     voucher_code:
 *                       type: string
 *                     discount_percentage:
 *                       type: number
 *                     valid_until:
 *                       type: string
 *                       format: date-time
 *                     description:
 *                       type: string
 *       400:
 *         description: Voucher is invalid/expired/inactive
 *       404:
 *         description: User or voucher not found
 *       500:
 *         description: Server error
 */
router.post(
    '/validateVoucher',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('voucher_code').notEmpty().withMessage("voucher_code is required")
    ],
    appCtrl.validateVoucher
);

/**
 * @swagger
 * /app/createVoucher:
 *   post:
 *     summary: Create a new voucher (Admin only)
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucher_code
 *               - discount_percentage
 *               - start_date
 *               - end_date
 *               - createdBy
 *             properties:
 *               voucher_code:
 *                 type: string
 *                 example: "SAVE20"
 *               discount_percentage:
 *                 type: number
 *                 example: 20
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-09T00:00:00Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59Z"
 *               max_usage:
 *                 type: integer
 *                 example: 100
 *                 description: Maximum number of times this voucher can be used (optional)
 *               description:
 *                 type: string
 *                 example: "20% discount on all products"
 *               createdBy:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       201:
 *         description: Voucher created successfully
 *       400:
 *         description: Validation error or voucher code already exists
 *       500:
 *         description: Server error
 */
router.post(
    '/createVoucher',
    authMiddleware(),
    [
        body('voucher_code').notEmpty().withMessage("voucher_code is required"),
        body('discount_percentage').isInt({ min: 0, max: 100 }).withMessage("discount_percentage must be between 0-100"),
        body('start_date').notEmpty().withMessage("start_date is required"),
        body('end_date').notEmpty().withMessage("end_date is required"),
        body('createdBy').notEmpty().withMessage("createdBy is required")
    ],
    appCtrl.createVoucher
);

/**
 * @swagger
 * /app/getAllVouchers:
 *   get:
 *     summary: Get all vouchers with pagination
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Vouchers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       voucher_code:
 *                         type: string
 *                       discount_percentage:
 *                         type: number
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: boolean
 *                       used_count:
 *                         type: integer
 *                       max_usage:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalVouchers:
 *                       type: integer
 *                     totalActiveVouchers:
 *                       type: integer
 *                     totalInactiveVouchers:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get(
    '/getAllVouchers',
    authMiddleware(),
    appCtrl.getAllVouchers
);

/**
 * @swagger
 * /app/getVoucherById:
 *   get:
 *     summary: Get voucher details by ID
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Voucher ID
 *     responses:
 *       200:
 *         description: Voucher retrieved successfully
 *       400:
 *         description: Voucher ID is required
 *       404:
 *         description: Voucher not found
 *       500:
 *         description: Server error
 */
router.get(
    '/getVoucherById',
    authMiddleware(),
    appCtrl.getVoucherById
);

/**
 * @swagger
 * /app/updateVoucher:
 *   put:
 *     summary: Update voucher details
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - updatedBy
 *             properties:
 *               id:
 *                 type: string
 *               voucher_code:
 *                 type: string
 *               discount_percentage:
 *                 type: number
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               max_usage:
 *                 type: integer
 *               description:
 *                 type: string
 *               status:
 *                 type: boolean
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Voucher updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Voucher not found
 *       500:
 *         description: Server error
 */
router.put(
    '/updateVoucher',
    authMiddleware(),
    appCtrl.updateVoucher
);

/**
 * @swagger
 * /app/deleteVoucher:
 *   post:
 *     summary: Delete a voucher
 *     tags: [Vouchers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Voucher deleted successfully
 *       400:
 *         description: Voucher ID is required
 *       404:
 *         description: Voucher not found
 *       500:
 *         description: Server error
 */
router.post(
    '/deleteVoucher',
    authMiddleware(),
    appCtrl.deleteVoucher
);

/**
 * @swagger
 * tags:
 *   name: Device Sharing
 *   description: Device sharing endpoints for Master users
 */

/**
 * @swagger
 * /app/assignDeviceToOther:
 *   post:
 *     summary: Master shares a device with another user (max 3 shares)
 *     tags: [Device Sharing]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serial_number
 *               - master_user_id
 *               - shared_to_user_phone
 *             properties:
 *               serial_number:
 *                 type: string
 *               master_user_id:
 *                 type: number
 *               shared_to_user_phone:
 *                 type: number
 *     responses:
 *       200:
 *         description: Device shared successfully
 *       400:
 *         description: Validation error or max shares reached
 *       404:
 *         description: User or Device not found
 */
router.post(
    '/assignDeviceToOther',
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('master_user_id').notEmpty().withMessage("Master User ID is required"),
        body('shared_to_user_phone').notEmpty().withMessage("Shared user phone is required")
    ],
    appCtrl.assignDeviceToOther
);

/**
 * @swagger
 * /app/getSharedUsers:
 *   post:
 *     summary: Get list of users a device is shared with
 *     tags: [Device Sharing]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serial_number
 *               - master_user_id
 *             properties:
 *               serial_number:
 *                 type: string
 *               master_user_id:
 *                 type: number
 *     responses:
 *       200:
 *         description: Shared users list retrieved successfully
 */
router.post(
    '/getSharedUsers',
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('master_user_id').notEmpty().withMessage("Master User ID is required")
    ],
    appCtrl.getSharedUsers
);

/**
 * @swagger
 * /app/updateShareStatus:
 *   post:
 *     summary: Activate/Deactivate a share
 *     tags: [Device Sharing]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serial_number
 *               - master_user_id
 *               - shared_to_user_id
 *               - status
 *             properties:
 *               serial_number:
 *                 type: string
 *               master_user_id:
 *                 type: number
 *               shared_to_user_id:
 *                 type: number
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Share status updated successfully
 */
router.post(
    '/updateShareStatus',
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('master_user_id').notEmpty().withMessage("Master User ID is required"),
        body('shared_to_user_id').notEmpty().withMessage("Shared User ID is required"),
        body('status').isBoolean().withMessage("Status must be boolean")
    ],
    appCtrl.updateShareStatus
);

/**
 * @swagger
 * /app/deleteShare:
 *   post:
 *     summary: Delete a share
 *     tags: [Device Sharing]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serial_number
 *               - master_user_id
 *               - shared_to_user_id
 *             properties:
 *               serial_number:
 *                 type: string
 *               master_user_id:
 *                 type: number
 *               shared_to_user_id:
 *                 type: number
 *     responses:
 *       200:
 *         description: Share deleted successfully
 */
router.post(
    '/deleteShare',
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('master_user_id').notEmpty().withMessage("Master User ID is required"),
        body('shared_to_user_id').notEmpty().withMessage("Shared User ID is required")
    ],
    appCtrl.deleteShare
);

/**
 * @swagger
 * /app/respondToDeviceShare:
 *   post:
 *     summary: Accept or Reject a device share
 *     tags: [Device Sharing]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serial_number
 *               - user_id
 *               - action
 *             properties:
 *               serial_number:
 *                 type: string
 *               user_id:
 *                 type: number
 *               action:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Responded to share successfully
 */
router.post(
    '/respondToDeviceShare',
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        body('user_id').notEmpty().withMessage("User ID is required"),
        body('action').isIn(['accepted', 'rejected']).withMessage("Action must be 'accepted' or 'rejected'")
    ],
    appCtrl.respondToDeviceShare
);

router.get("/getDeviceSmartHistory", appCtrl.getDeviceSmartHistory);

// Device Scheduling
router.post('/createSchedule', authMiddleware(), appCtrl.createSchedule);
router.get('/getSchedules', authMiddleware(), appCtrl.getSchedules);
router.post('/cancelSchedule/:schedule_id', authMiddleware(), appCtrl.cancelSchedule);

/**
 * @swagger
 * /app/forgotPasswordRequest:
 *   post:
 *     summary: Request password reset OTP
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
 *     responses:
 *       200:
 *         description: OTP sent to email
 */
router.post(
    '/forgotPasswordRequest',
    [
        body('user_email').isEmail().withMessage("Invalid email")
    ],
    appCtrl.forgotPasswordRequest
);

/**
 * @swagger
 * /app/verifyOtp:
 *   post:
 *     summary: Verify password reset OTP
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
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post(
    '/verifyOtp',
    [
        body('user_email').isEmail().withMessage("Invalid email"),
        body('otp').notEmpty().withMessage("OTP is required")
    ],
    appCtrl.verifyOtp
);

/**
 * @swagger
 * /app/resetPassword:
 *   post:
 *     summary: Reset password using OTP
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
 *               otp:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post(
    '/resetPassword',
    [
        body('user_email').isEmail().withMessage("Invalid email"),
        body('otp').notEmpty().withMessage("OTP is required"),
        body('new_password').matches(/^[0-9]{6}$/).withMessage("Password must be 6 digits")
    ],
    appCtrl.resetPassword
);

// ---------------------
// Manage Help
// ---------------------

/**
 * @swagger
 * /app/createHelp:
 *   post:
 *     summary: Create a new help request
 *     tags: [Help]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               user_name:
 *                 type: string
 *               user_mobile:
 *                 type: string
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Help request created successfully
 */
router.post(
    '/createHelp',
    authMiddleware(),
    [
        body('user_id').notEmpty().withMessage("User ID is required"),
        body('subject').notEmpty().withMessage("Subject is required"),
        body('description').notEmpty().withMessage("Description is required")
    ],
    appCtrl.createHelp
);

/**
 * @swagger
 * /app/getAllHelpByUser:
 *   get:
 *     summary: Get all help requests for a user
 *     tags: [Help]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Help requests retrieved successfully
 */
router.get('/getAllHelpByUser', authMiddleware(), appCtrl.getAllHelpByUser);

/**
 * @swagger
 * /app/getHelpById:
 *   get:
 *     summary: Get help request by ID
 *     tags: [Help]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Help request retrieved successfully
 */
router.get('/getHelpById', authMiddleware(), appCtrl.getHelpById);

/**
 * @swagger
 * /app/updateHelp:
 *   put:
 *     summary: Update a help request
 *     tags: [Help]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Help request updated successfully
 */
router.put('/updateHelp', authMiddleware(), appCtrl.updateHelp);

/**
 * @swagger
 * /app/deleteHelp:
 *   post:
 *     summary: Delete a help request
 *     tags: [Help]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Help request deleted successfully
 */
router.post('/deleteHelp', authMiddleware(), appCtrl.deleteHelp);

module.exports = router;
