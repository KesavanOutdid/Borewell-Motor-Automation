const express = require('express');
const { body } = require('express-validator');
const adminCtrl = require('../controllers/adminControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadPDF, uploadImage } = require('../config/multerConfig');

const router = express.Router();

/**
 * @swagger
 * /admin/getDeviceSmartHistory:
 *   get:
 *     summary: Get smart history for a specific device
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: serial_number
 *         schema:
 *           type: string
 *         required: true
 *         description: Device serial number
 *     responses:
 *       200:
 *         description: List of history records
 *       400:
 *         description: Serial number required
 *       500:
 *         description: Server error
 */
router.get("/getDeviceSmartHistory", adminCtrl.getDeviceSmartHistory);

/**
 * @swagger
 * /admin/createRole:
 *   post:
 *     summary: Create a new role
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_id:
 *                 type: integer
 *               role_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Role already exists
 */


// ---------------------
// Create Role
// ---------------------
router.post(
    '/createRole',
    [
        body('role_id').isInt().withMessage("role_id must be a number"),
        body('role_name').notEmpty().withMessage("role_name is required"),
        body('createdBy').notEmpty().withMessage("createdBy is required")
    ],
    adminCtrl.createRole
);

/**
 * @swagger
 * /admin/editRole:
 *   post:
 *     summary: Edit an existing role
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_id:
 *                 type: integer
 *               status:
 *                 type: boolean
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Validation error
 */
router.post(
    '/editRole',
    [
        body('role_id').isInt().withMessage("role_id required"),
        body('status').isBoolean().withMessage("status must be true/false"),
        body('updatedBy').notEmpty().withMessage("updatedBy required")
    ],
    adminCtrl.editRole
);

// ---------------------
// Create User
// ---------------------
/**
 * @swagger
 * /admin/createUser:
 *   post:
 *     summary: Create new user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *               role_id:
 *                 type: integer
 *               user_email:
 *                 type: string
 *               user_phone:
 *                 type: string
 *               password:
 *                 type: string
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post(
    '/createUser',
    [
        body('user_name').notEmpty().withMessage("user_name required"),
        body('role_id').isInt().withMessage("role_id must be a number"),
        body('user_email')
            .isEmail().withMessage("Invalid email format (e.g., user@example.com)")
            .custom(value => {
                if (/[-_]/.test(value)) {
                    throw new Error("Hyphens (-) and underscores (_) are not allowed in email");
                }
                if (/\.{2,}/.test(value)) {
                    throw new Error("Consecutive dots (..) are not allowed in email");
                }
                return true;
            }),
        body('user_phone').matches(/^[0-9]{10}$/).withMessage("Phone must be 10 digits"),
        body('password').matches(/^[0-9]{6}$/).withMessage("Password must be 6 digits"),
        body('createdBy').notEmpty().withMessage("createdBy required"),
    ],
    adminCtrl.createUser
);

// ---------------------
// List Roles & Users
// ---------------------
/**
 * @swagger
 * /admin/getRoles:
 *   get:
 *     summary: Get all roles with pagination
 *     tags: [Admin]
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
 *         description: Number of roles per page
 *     responses:
 *       200:
 *         description: Paginated list of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 roles:
 *                   type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalRoles:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 */

router.get('/getRoles',
    // authMiddleware('ADMIN'),
    adminCtrl.getRoles);

/**
 * @swagger
 * /admin/getUsers:
 *   get:
 *     summary: Get all users with pagination
 *     tags: [Admin]
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
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalUsers:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 */

router.get('/getUsers',
    // authMiddleware('ADMIN'),
    adminCtrl.getUsers);

/**
 * @swagger
 * /admin/createdDevice:
 *   post:
 *     summary: Create a new device
 *     tags: [Admin]
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
 *                 example: "ABC123456789ABCDE12"
 *               createdBy:
 *                 type: string
 *                 example: "admin@gmail.com"
 *     responses:
 *       201:
 *         description: Device created successfully
 *       400:
 *         description: Bad request (invalid serial number or duplicate)
 *       500:
 *         description: Server error
 */
router.post("/createdDevice", adminCtrl.createDevice);

/**
 * @swagger
 * /admin/getDevices:
 *   get:
 *     summary: Get all devices with pagination
 *     tags: [Admin]
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
 *         description: Number of devices per page
 *     responses:
 *       200:
 *         description: Paginated list of devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalDevices:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 */

router.get("/getDevices", adminCtrl.getDevices);

/**
 * @swagger
 * /admin/updatedDevice:
 *   post:
 *     summary: Update device details
 *     tags: [Admin]
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
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       400:
 *         description: Bad request
 */
router.post("/updatedDevice", adminCtrl.updateDevice);

/**
 * @swagger
 * /admin/deviceAssignTouser:
 *   post:
 *     summary: Assign device to user
 *     tags: [Admin]
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
 *               user_id:
 *                 type: integer
 *               assignedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device assigned successfully
 *       400:
 *         description: Bad request
 */
router.post("/deviceAssignTouser", adminCtrl.deviceAssignToUser);

/**
 * @swagger
 * /admin/manageUserUpdated:
 *   post:
 *     summary: Manage and update user information
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               status:
 *                 type: boolean
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request
 */
router.post(
    "/manageUserUpdated",
    [
        body('user_id').notEmpty().withMessage("user_id required"),
        body('user_name').optional().notEmpty().withMessage("user_name cannot be empty"),
        body('user_phone').optional().matches(/^[0-9]{10}$/).withMessage("Phone must be 10 digits"),
        body('password').optional().matches(/^[0-9]{6}$/).withMessage("Password must be 6 digits"),
        body('status').optional().isBoolean().withMessage("status must be true/false"),
        body('updatedBy').notEmpty().withMessage("updatedBy required"),
    ],
    adminCtrl.manageUserUpdated
);

/**
 * @swagger
 * /admin/uploadProfileImage/{user_id}:
 *   post:
 *     summary: Upload profile image for user (Admin)
 *     tags: [Admin]
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
 *               updatedBy:
 *                 type: string
 *                 description: Admin email who is updating
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *       400:
 *         description: No image file uploaded or invalid file type
 *       404:
 *         description: User not found
 */
router.post('/uploadProfileImage/:user_id', uploadImage.single('image'), adminCtrl.uploadProfileImage);

/**
 * @swagger
 * /admin/getAssignDevices:
 *   get:
 *     summary: Get all assigned devices with pagination
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: List of assigned devices
 */
router.get("/getAssignDevices", adminCtrl.getAssignDevices);

/**
 * @swagger
 * /admin/getAnalasitic:
 *   get:
 *     summary: Get analytics and statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get("/getAnalasitic", adminCtrl.getAnalasitic);

// ---------------------
// Product Management
// ---------------------
/**
 * @swagger
 * /admin/createProduct:
 *   post:
 *     summary: Create a new product
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_name:
 *                 type: string
 *               product_description:
 *                 type: string
 *               product_description_pdf:
 *                 type: string
 *               product_main_image:
 *                 type: string
 *               product_sub_images:
 *                 type: array
 *                 items:
 *                   type: string
 *               product_quality:
 *                 type: object
 *                 properties:
 *                   box_size:
 *                     type: string
 *                   extra_details:
 *                     type: string
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
    '/createProduct',
    [
        body('product_name')
            .notEmpty().withMessage("product_name is required")
            .matches(/^[a-zA-Z0-9\s]+$/).withMessage("Product name should contain only letters and numbers")
    ],
    adminCtrl.createProduct
);

/**
 * @swagger
 * /admin/getProducts:
 *   get:
 *     summary: Get all products with pagination
 *     tags: [Admin]
 *     parameters:
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
 *         description: Paginated list of products
 */
router.get('/getProducts', adminCtrl.getProducts);

/**
 * @swagger
 * /admin/getProductById:
 *   get:
 *     summary: Get product by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/getProductById', adminCtrl.getProductById);

/**
 * @swagger
 * /admin/updateProduct:
 *   post:
 *     summary: Update product
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.post(
    '/updateProduct',
    [
        body('product_name')
            .optional()
            .matches(/^[a-zA-Z0-9\s]+$/).withMessage("Product name should contain only letters and numbers")
    ],
    adminCtrl.updateProduct
);

router.post(
    '/userAssignDevices',
    [
        body('user_id').notEmpty().withMessage("User ID is required"),
    ],
    adminCtrl.userAssignDevices
);

router.post(
    '/userDeviceHistory',
    [
        body('user_id').notEmpty().withMessage("User ID is required"),
    ],
    adminCtrl.userDeviceHistory
);

router.get(
    '/getAllVouchers',
    authMiddleware(),
    adminCtrl.getAllVouchers
);


router.post(
    '/userDeviceDetails',
    authMiddleware(),
    [
        body('serial_number').notEmpty().withMessage("Serial number is required"),
        // body('imei_number').notEmpty().withMessage("IMEI number is required"),
    ],
    adminCtrl.userDeviceDetails
);

/**
 * @swagger
 * /admin/deleteProduct:
 *   post:
 *     summary: Delete product
 *     tags: [Admin]
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
 *         description: Product deleted successfully
 */
router.post('/deleteProduct', adminCtrl.deleteProduct);

// ---------------------
// File Upload Routes
// ---------------------
/**
 * @swagger
 * /admin/uploadPDF:
 *   post:
 *     summary: Upload PDF file
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: PDF uploaded successfully
 */
router.post('/uploadPDF', uploadPDF.single('file'), adminCtrl.uploadPDF);

/**
 * @swagger
 * /admin/uploadImage:
 *   post:
 *     summary: Upload image file
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post('/uploadImage', uploadImage.single('file'), adminCtrl.uploadImage);

/**
 * @swagger
 * /admin/uploadMultipleImages:
 *   post:
 *     summary: Upload multiple image files
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */
router.post('/uploadMultipleImages', uploadImage.array('files', 3), adminCtrl.uploadMultipleImages);

// ---------------------
// Manage Help (Admin)
// ---------------------

/**
 * @swagger
 * /admin/getAllHelp:
 *   get:
 *     summary: Get all help requests with pagination
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status_filter
 *         schema:
 *           type: string
 *           enum: [all, pending, solved, rejected, re-solved]
 *     responses:
 *       200:
 *         description: Help requests retrieved successfully
 */
router.get('/getAllHelp', authMiddleware(), adminCtrl.getAllHelp);

/**
 * @swagger
 * /admin/getHelpById:
 *   get:
 *     summary: Get help request by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Help request details
 */
router.get('/getHelpById', authMiddleware(), adminCtrl.getHelpById);

/**
 * @swagger
 * /admin/updateHelpStatus:
 *   post:
 *     summary: Update help request status
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, solved, rejected, re-solved]
 *               admin_remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Help status updated successfully
 */
router.post(
    '/updateHelpStatus',
    authMiddleware(),
    [
        body('id').notEmpty().withMessage("Help ID is required"),
        body('status').notEmpty().withMessage("Status is required")
    ],
    adminCtrl.updateHelpStatus
);

module.exports = router;
