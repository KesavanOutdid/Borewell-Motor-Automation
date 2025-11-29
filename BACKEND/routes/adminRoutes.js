const express = require('express');
const { body } = require('express-validator');
const adminCtrl = require('../controllers/adminControllers');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

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
        body('user_email').isEmail().withMessage("Invalid email format"),
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

router.post("/updatedDevice", adminCtrl.updateDevice);

router.post("/deviceAssignTouser", adminCtrl.deviceAssignToUser);

router.post("/manageUserUpdated", adminCtrl.manageUserUpdated);

router.get("/getAssignDevices", adminCtrl.getAssignDevices);

router.get("/getAnalasitic", adminCtrl.getAnalasitic);

module.exports = router;
