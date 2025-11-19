const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Motor
 *   description: Borewell motor control
 */

/**
 * @swagger
 * /motor/status:
 *   get:
 *     summary: Get current motor status
 *     tags: [Motor]
 *     responses:
 *       200:
 *         description: Motor status response
 */
router.get("/status", (req, res) => {
    res.json({ motor: "ON", waterLevel: "Normal" });
});

/**
 * @swagger
 * /motor/start:
 *   post:
 *     summary: Start the motor
 *     tags: [Motor]
 *     responses:
 *       200:
 *         description: Motor started
 */
router.post("/start", (req, res) => {
    res.json({ message: "Motor started!" });
});

/**
 * @swagger
 * /motor/stop:
 *   post:
 *     summary: Stop the motor
 *     tags: [Motor]
 *     responses:
 *       200:
 *         description: Motor stopped
 */
router.post("/stop", (req, res) => {
    res.json({ message: "Motor stopped!" });
});

module.exports = router;
