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
 *   description: App endpoints (login, profile)
 */

/**
 * @swagger
 * /app/login:
 *   post:
 *     summary: Login with email+password
 *     tags: [App]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               user_email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns JWT token and user profile
 */
router.post(
    '/login',
    [body('user_email').isEmail(), body('password').isLength({ min: 1 })],
    appCtrl.login
);

// Protected: get profile
router.get('/profile', authMiddleware(), appCtrl.getProfile);

module.exports = router;
