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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/updatedProfile/:user_id', authMiddleware(), appCtrl.updateProfile);

module.exports = router;
