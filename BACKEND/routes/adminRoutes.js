const express = require('express');
const { body } = require('express-validator');
const adminCtrl = require('../controllers/adminControllers');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /admin/roles:
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
    '/roles',
    [
        body('role_id').isInt().withMessage("role_id must be a number"),
        body('role_name').notEmpty().withMessage("role_name is required")
    ],
    adminCtrl.createRole
);

// ---------------------
// Create User
// ---------------------
/**
 * @swagger
 * /admin/create:
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
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post(
    '/create',
    [
        body('user_name').notEmpty().withMessage("user_name required"),
        body('role_id').isInt().withMessage("role_id must be a number"),
        body('user_email').isEmail().withMessage("Invalid email format"),
        body('user_phone').matches(/^[0-9]{10}$/).withMessage("Phone must be 10 digits"),
        body('password').matches(/^[0-9]{6}$/).withMessage("Password must be 6 digits")
    ],
    adminCtrl.createUser
);

// ---------------------
// List Roles & Users
// ---------------------
/**
 * @swagger
 * /admin/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */

router.get('/roles', authMiddleware('ADMIN'), adminCtrl.getRoles);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */

router.get('/users', authMiddleware('ADMIN'), adminCtrl.getUsers);

module.exports = router;
