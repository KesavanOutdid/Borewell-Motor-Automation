// BACKEND/routes/adminRoutes.js
const express = require('express');
const { body } = require('express-validator');
const adminCtrl = require('../controllers/adminControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations (roles, users)
 */

/**
 * @swagger
 * /admin/roles:
 *   post:
 *     summary: Create role
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               role_id:
 *                 type: string
 *               role_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created
 */
router.post(
    '/roles',
    authMiddleware('ADMIN'),
    [body('role_id').notEmpty(), body('role_name').notEmpty()],
    adminCtrl.createRole
);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create user (admin)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               user_id: { type: string }
 *               user_name: { type: string }
 *               role_id: { type: string }
 *               user_email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: User created
 */
router.post(
    '/users',
    authMiddleware('ADMIN'),
    [
        body('user_id').notEmpty(),
        body('user_name').notEmpty(),
        body('role_id').notEmpty(),
        body('user_email').isEmail(),
        body('password').isLength({ min: 6 })
    ],
    adminCtrl.createUser
);

// List roles & users
router.get('/roles', authMiddleware('ADMIN'), adminCtrl.getRoles);
router.get('/users', authMiddleware('ADMIN'), adminCtrl.getUsers);

module.exports = router;
