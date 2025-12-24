const { validationResult } = require('express-validator');
const User = require('../models/User');
const Device = require('../models/Device');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Voucher = require('../models/Voucher');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Telemetry = require("../models/Telemetry");

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
// const JWT_EXPIRES = '2h';

exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_email, password, role_id } = req.body;

        // Find the user by email
        const user = await User.findOne({ user_email, role_id });
        if (!user)
            return res.status(401).json({ success: false, message: "Invalid email" });

        // Check role
        if (Number(role_id) !== Number(user.role_id))
            return res.status(401).json({ success: false, message: "Invalid role_id" });

        // Check password
        if (Number(password) !== Number(user.password))
            return res.status(401).json({ success: false, message: "Invalid password" });

        // Check if user active
        if (!user.status)
            return res.status(403).json({ success: false, message: "User is deactivated" });

        // Prepare payload
        const payload = {
            user_id: user.user_id,
            user_email: user.user_email,
            user_name: user.user_name,
            role_id: user.role_id,
            user_phone: Number(user.user_phone),
        };

        // Generate JWT
        const token = jwt.sign(payload, JWT_SECRET);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: payload
        });

    } catch (err) {
        next(err);
    }
};

// Protected: Get Profile
exports.getProfileById = async (req, res, next) => {
    try {
        const userId = Number(req.params.user_id);

        // Only JWT verified users can access (authMiddleware already checked token)
        // Get user from DB
        const user = await User.findOne({ user_id: userId });

        if (!user)
            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        const response = {
            success: true,
            user
        };

        res.status(200).json(response);

    } catch (err) {
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = Number(req.params.user_id);

        const { user_name, user_phone, status, password } = req.body;

        const updateData = {};
        if (user_name) updateData.user_name = user_name;
        if (user_phone) updateData.user_phone = user_phone;
        if (password) updateData.password = password;
        if (typeof status === "boolean") updateData.status = status;

        updateData.updatedBy = req.user.user_email;

        const updatedUser = await User.findOneAndUpdate(
            { user_id: userId },
            updateData,
            { new: true, select: "-password" }
        );

        if (!updatedUser)
            return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (err) {
        next(err);
    }
};

exports.configIMEInumber = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { serial_number, imei_number, user_email, timestamp, latitude, longitude, motor_hp } = req.body;

        // Find user by email
        const user = await User.findOne({ user_email });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find assigned device
        const device = await Device.findOne({
            serial_number,
            assigned_user_id: user.user_id
        });

        if (!device)
            return res.status(404).json({
                success: false,
                message: "Device not found or not assigned to this user"
            });

        // Update device including location
        const updatedDevice = await Device.findOneAndUpdate(
            { serial_number, assigned_user_id: user.user_id },
            {
                imei_number,
                latitude,
                longitude,
                motor_hp,
                config_status: true,
                updatedAt: new Date(timestamp),
                updatedBy: user_email
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "IMEI & location configured successfully",
            device: {
                serial_number: updatedDevice.serial_number,
                imei_number: updatedDevice.imei_number,
                latitude: updatedDevice.latitude,
                longitude: updatedDevice.longitude,
                motor_hp: updatedDevice.motor_hp,
                config_status: updatedDevice.config_status,
                updatedAt: updatedDevice.updatedAt,
                updatedBy: updatedDevice.updatedBy
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.startStopDevice = async (req, res) => {
    try {
        const { serial_number, imei_number, user_email, start_status } = req.body;

        const device = await Device.findOne({ serial_number, imei_number });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        let updateData = {
            start_status,
            updatedBy: user_email,
            updatedAt: new Date()
        };

        if (start_status === true) {
            updateData.startAt = new Date();
        } else {
            updateData.stopAt = new Date();
        }

        await Device.updateOne(
            { serial_number, imei_number },
            { $set: updateData }
        );

        return res.status(200).json({
            success: true,
            message: start_status ? "Device started" : "Device stopped",
            data: updateData
        });

    } catch (error) {
        console.error("Start/Stop Device Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error, please try again later"
        });
    }
};

exports.userAssignDevices = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Find all devices assigned to this user
        const devices = await Device.aggregate([
            { $match: { assigned_user_id: parseInt(user_id), assign_status: true, status: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "assigned_user_id",
                    foreignField: "user_id",
                    as: "user_details"
                }
            },
            {
                $unwind: {
                    path: "$user_details",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    "user_details.password": 0,
                    "user_details.createdAt": 0,
                    "user_details.updatedAt": 0,
                    "user_details.__v": 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        const enrichedDevices = devices.map(device => ({
            ...device,
            user_details: device.user_details ? {
                user_name: device.user_details.user_name,
                user_email: device.user_details.user_email,
                user_phone: device.user_details.user_phone
            } : null
        }));

        const response = {
            success: true,
            count: enrichedDevices.length,
            data: enrichedDevices
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("userAssignDevices Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.userDeviceDetails = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { serial_number, imei_number } = req.body;

        const device = await Device.findOne({ serial_number, imei_number });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        const response = {
            success: true,
            data: device
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("userDeviceDetails Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.userDeviceHistory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { user_id } = req.body;

        // Validate user exists
        const user = await User.findOne({ user_id: parseInt(user_id) });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // DB collection
        const db = mongoose.connection.db;
        const historyCollection = db.collection("borewell_history");

        // Fetch all history sessions for this user
        const history = await historyCollection
            .find({ user_id: parseInt(user_id) })
            .sort({ startAt: -1 })    // latest first
            .toArray();

        if (!history.length) {
            const response = {
                success: true,
                user_id,
                count: 0,
                data: []
            };
            return res.status(200).json(response);
        }

        // Group by serial number
        const grouped = {};

        history.forEach(h => {
            if (!grouped[h.serial_number]) {
                grouped[h.serial_number] = [];
            }

            grouped[h.serial_number].push({
                serial_number: h.serial_number,
                imei_number: h.imei_number,
                date: h.date,
                startAt: h.startAt,
                stopAt: h.stopAt,
                duration_minutes: h.duration_minutes,
                energy_kwh: h.energy_kwh,
                maxCurrent: h.maxCurrent,
                minCurrent: h.minCurrent,
                maxVoltage: h.maxVoltage,
                minVoltage: h.minVoltage,
                createdAt: h.createdAt,
                updatedAt: h.updatedAt
            });
        });

        const response = Object.keys(grouped).map(serial_number => ({
            serial_number,
            count: grouped[serial_number].length,
            last_updated: grouped[serial_number][0]?.updatedAt,
            records: grouped[serial_number]
        }));

        const finalResponse = {
            success: true,
            user_id,
            count: response.length,
            data: response
        };

        return res.status(200).json(finalResponse);

    } catch (error) {
        console.error("userDeviceHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.getTelemetryAnalytics = async (req, res) => {
    try {
        const { serial_number, imei_number, type } = req.query;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Please provide type parameter"
            });
        }

        const allowedTypes = [
            "motor_rpm",
            "motor_frequency_hz",
            "power_kw",
            "current_rms",
            "voltage_rms",
            "energy_kwh",
            "device_temp_c",
            "signal_strength"
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type, allowed: ${allowedTypes.join(", ")}`
            });
        }

        // build query filter
        const filter = { timestamp: { $exists: true } };
        if (serial_number) filter.serial_number = serial_number;
        if (imei_number) filter.imei_number = imei_number;

        const now = new Date();

        // ------------------------------------------
        // 📍 Updated aggregation with time-based filtering
        // ------------------------------------------
        const analytics = await Telemetry.aggregate([
            { $match: filter },
            {
                $addFields: {
                    ts: { $toDate: "$timestamp" }
                }
            },
            {
                $facet: {
                    // Hourly: Last 60 hours with sequential labels (0, 1, 2, ..., 59)
                    hourly: [
                        {
                            $match: {
                                ts: { $gte: new Date(now.getTime() - 60 * 60 * 60 * 1000) }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$ts" },
                                    month: { $month: "$ts" },
                                    day: { $dayOfMonth: "$ts" },
                                    hour: { $hour: "$ts" }
                                },
                                value: { $avg: `$${type}` },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        { $limit: 60 },
                        {
                            $group: {
                                _id: null,
                                items: { $push: "$$ROOT" }
                            }
                        },
                        {
                            $unwind: {
                                path: "$items",
                                includeArrayIndex: "index"
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                label: { $toString: "$index" },
                                value: "$items.value",
                                timestamp: "$items.timestamp",
                                count: "$items.count"
                            }
                        }
                    ],

                    // Today: Last 24 hours with sequential labels (1-24)
                    today: [
                        {
                            $match: {
                                ts: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    hour: { $hour: "$ts" }
                                },
                                value: { $avg: `$${type}` },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        {
                            $group: {
                                _id: null,
                                items: { $push: "$$ROOT" }
                            }
                        },
                        {
                            $unwind: {
                                path: "$items",
                                includeArrayIndex: "index"
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                label: { $toString: { $add: ["$index", 1] } },
                                value: "$items.value",
                                timestamp: "$items.timestamp",
                                count: "$items.count"
                            }
                        }
                    ],

                    // Weekly: Last 7 days with sequential labels (1-7)
                    weekly: [
                        {
                            $match: {
                                ts: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$ts" },
                                    month: { $month: "$ts" },
                                    day: { $dayOfMonth: "$ts" }
                                },
                                value: { $avg: `$${type}` },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        {
                            $group: {
                                _id: null,
                                items: { $push: "$$ROOT" }
                            }
                        },
                        {
                            $unwind: {
                                path: "$items",
                                includeArrayIndex: "index"
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                label: { $toString: { $add: ["$index", 1] } },
                                value: "$items.value",
                                timestamp: "$items.timestamp",
                                count: "$items.count"
                            }
                        }
                    ],

                    // Monthly: Last 30 days with sequential labels (1-30)
                    monthly: [
                        {
                            $match: {
                                ts: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$ts" },
                                    month: { $month: "$ts" },
                                    day: { $dayOfMonth: "$ts" }
                                },
                                value: { $avg: `$${type}` },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        {
                            $group: {
                                _id: null,
                                items: { $push: "$$ROOT" }
                            }
                        },
                        {
                            $unwind: {
                                path: "$items",
                                includeArrayIndex: "index"
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                label: { $toString: { $add: ["$index", 1] } },
                                value: "$items.value",
                                timestamp: "$items.timestamp",
                                count: "$items.count"
                            }
                        }
                    ],

                    // Yearly: By year and month with sequential labels (1-12 per year)
                    yearly: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$ts" },
                                    month: { $month: "$ts" }
                                },
                                value: { $avg: `$${type}` },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        {
                            $group: {
                                _id: null,
                                items: { $push: "$$ROOT" }
                            }
                        },
                        {
                            $unwind: {
                                path: "$items",
                                includeArrayIndex: "index"
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                label: { $toString: { $add: ["$index", 1] } },
                                value: "$items.value",
                                timestamp: "$items.timestamp",
                                count: "$items.count"
                            }
                        }
                    ]
                }
            }
        ]);

        const result = analytics[0];

        // Helper function to calculate statistics and trends
        const calculateStats = (data, periodType) => {
            if (!data || data.length === 0) {
                return {
                    dataPoints: 0,
                    totalRecords: 0,
                    totalSum: 0,
                    average: 0,
                    min: 0,
                    max: 0,
                    trend: 'no_data',
                    variance: 0,
                    isConstant: false,
                    percentChange: 0,
                    standardDeviation: 0,
                    peakHour: null,
                    lowestHour: null,
                    performanceScore: 0,
                    anomalyCount: 0,
                    anomalies: [],
                    consistency: 'no_data',
                    reliability: 0
                };
            }

            const values = data.map(item => item.value);
            const total = values.reduce((sum, val) => sum + val, 0);
            const avg = total / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);

            // Find peak and lowest points
            const maxIndex = values.indexOf(max);
            const minIndex = values.indexOf(min);
            const peakHour = data[maxIndex] ? {
                label: data[maxIndex].label,
                value: max,
                timestamp: data[maxIndex].timestamp
            } : null;
            const lowestHour = data[minIndex] ? {
                label: data[minIndex].label,
                value: min,
                timestamp: data[minIndex].timestamp
            } : null;

            // Determine if values are constant (within 0.1% tolerance)
            const isConstant = (max - min) / avg < 0.001 || stdDev < 0.001;

            // Calculate trend
            let trend = 'stable';
            if (!isConstant && values.length > 1) {
                const firstHalf = values.slice(0, Math.floor(values.length / 2));
                const secondHalf = values.slice(Math.floor(values.length / 2));
                const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
                const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

                if (percentChange > 5) trend = 'increasing';
                else if (percentChange < -5) trend = 'decreasing';
                else trend = 'stable';
            } else if (isConstant) {
                trend = 'constant';
            }

            // Detect anomalies (values beyond 2 standard deviations)
            const anomalies = [];
            values.forEach((val, idx) => {
                if (Math.abs(val - avg) > 2 * stdDev) {
                    anomalies.push({
                        index: idx,
                        label: data[idx].label,
                        value: val,
                        deviation: ((val - avg) / stdDev).toFixed(2),
                        timestamp: data[idx].timestamp
                    });
                }
            });

            // Calculate performance score (0-100)
            // Based on consistency, uptime reliability
            const coefficientOfVariation = avg !== 0 ? (stdDev / avg) * 100 : 0;
            let performanceScore = 100;
            if (coefficientOfVariation > 50) performanceScore -= 40;
            else if (coefficientOfVariation > 30) performanceScore -= 25;
            else if (coefficientOfVariation > 15) performanceScore -= 10;

            if (anomalies.length > data.length * 0.2) performanceScore -= 30;
            else if (anomalies.length > data.length * 0.1) performanceScore -= 15;

            // Consistency rating
            let consistency = 'excellent';
            if (coefficientOfVariation > 40) consistency = 'poor';
            else if (coefficientOfVariation > 25) consistency = 'fair';
            else if (coefficientOfVariation > 15) consistency = 'good';

            // Reliability percentage
            const reliablePoints = values.filter(v => Math.abs(v - avg) <= stdDev).length;
            const reliability = ((reliablePoints / values.length) * 100).toFixed(1);

            return {
                dataPoints: data.length,
                totalRecords: data.reduce((sum, item) => sum + (item.count || 0), 0),
                totalSum: total,
                average: parseFloat(avg.toFixed(2)),
                min: parseFloat(min.toFixed(2)),
                max: parseFloat(max.toFixed(2)),
                trend,
                variance: parseFloat(variance.toFixed(2)),
                standardDeviation: parseFloat(stdDev.toFixed(2)),
                isConstant,
                percentChange: values.length > 1 ? parseFloat(((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(2)) : 0,
                peakHour,
                lowestHour,
                performanceScore: Math.max(0, Math.round(performanceScore)),
                anomalyCount: anomalies.length,
                anomalies: anomalies.slice(0, 5),
                consistency,
                reliability: parseFloat(reliability),
                coefficientOfVariation: parseFloat(coefficientOfVariation.toFixed(2))
            };
        };

        const summary = {
            hourly: calculateStats(result.hourly, 'hourly'),
            today: calculateStats(result.today, 'today'),
            weekly: calculateStats(result.weekly, 'weekly'),
            monthly: calculateStats(result.monthly, 'monthly'),
            yearly: calculateStats(result.yearly, 'yearly')
        };

        // Calculate overall metrics
        const allValues = [
            ...result.hourly,
            ...result.today,
            ...result.weekly,
            ...result.monthly,
            ...result.yearly
        ];

        const overallStats = allValues.length > 0 ? {
            totalDataPoints: allValues.length,
            averagePerformance: Math.round(
                (summary.hourly.performanceScore +
                    summary.today.performanceScore +
                    summary.weekly.performanceScore +
                    summary.monthly.performanceScore +
                    summary.yearly.performanceScore) / 5
            ),
            overallTrend: summary.today.trend,
            totalAnomalies: summary.hourly.anomalyCount +
                summary.today.anomalyCount +
                summary.weekly.anomalyCount +
                summary.monthly.anomalyCount +
                summary.yearly.anomalyCount,
            criticalAnomalies: [
                ...summary.hourly.anomalies,
                ...summary.today.anomalies,
                ...summary.weekly.anomalies,
                ...summary.monthly.anomalies,
                ...summary.yearly.anomalies
            ].slice(0, 10)
        } : null;

        // Calculate comparisons (current vs previous period)
        const calculateComparison = (currentData, label) => {
            if (!currentData || currentData.length < 2) {
                return { comparison: 'insufficient_data' };
            }

            const mid = Math.floor(currentData.length / 2);
            const previousPeriod = currentData.slice(0, mid);
            const currentPeriod = currentData.slice(mid);

            const prevAvg = previousPeriod.reduce((sum, item) => sum + item.value, 0) / previousPeriod.length;
            const currAvg = currentPeriod.reduce((sum, item) => sum + item.value, 0) / currentPeriod.length;

            const change = currAvg - prevAvg;
            const percentChange = prevAvg !== 0 ? ((change / prevAvg) * 100) : 0;

            return {
                label,
                previousAverage: parseFloat(prevAvg.toFixed(2)),
                currentAverage: parseFloat(currAvg.toFixed(2)),
                absoluteChange: parseFloat(change.toFixed(2)),
                percentChange: parseFloat(percentChange.toFixed(2)),
                trend: percentChange > 5 ? 'improving' : percentChange < -5 ? 'declining' : 'stable'
            };
        };

        const comparisons = {
            hourly: calculateComparison(result.hourly, 'Last 30h vs Previous 30h'),
            today: calculateComparison(result.today, 'Last 12h vs Previous 12h'),
            weekly: calculateComparison(result.weekly, 'Last 3-4 days vs Previous 3 days'),
            monthly: calculateComparison(result.monthly, 'Last 15 days vs Previous 15 days')
        };

        const response = {
            success: true,
            type,
            serial_number,
            imei_number,
            data: result,
            summary,
            comparisons,
            overallStats,
            metadata: {
                generatedAt: new Date().toISOString(),
                metricType: type,
                availablePeriods: ['hourly', 'today', 'weekly', 'monthly', 'yearly']
            }
        };

        res.json(response);

    } catch (err) {
        console.error("Telemetry analytics error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.addCart = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, product_id, quantity } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Verify product exists and is active
        const product = await Product.findOne({ product_id, status: true });
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });

        // Check available quantity
        if (product.product_quantity < quantity)
            return res.status(400).json({ success: false, message: "Insufficient product quantity" });

        // Find or create cart for user
        let cart = await Cart.findOne({ user_id });

        if (!cart) {
            // Create new cart
            const cartCount = await Cart.countDocuments();
            cart = new Cart({
                cart_id: cartCount + 1,
                user_id,
                items: [],
                createdBy: user.user_email
            });
        }

        // Check if product already in cart
        const existingItem = cart.items.find(item => item.product_id === product_id);

        if (existingItem) {
            // Update quantity
            existingItem.quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                product_id: product.product_id,
                product_name: product.product_name,
                product_price: product.product_price,
                product_gst: product.product_gst,
                product_shipping_cost: product.product_shipping_cost,
                quantity
            });
        }

        // Calculate totals
        cart.total_price = 0;
        cart.total_gst = 0;
        cart.total_shipping_cost = 0;

        cart.items.forEach(item => {
            const itemPrice = item.product_price * item.quantity;
            const itemGST = (itemPrice * item.product_gst) / 100;
            const itemShipping = item.product_shipping_cost * item.quantity;

            cart.total_price += itemPrice;
            cart.total_gst += itemGST;
            cart.total_shipping_cost += itemShipping;
        });

        cart.grand_total = cart.total_price + cart.total_gst + cart.total_shipping_cost;
        cart.updatedAt = new Date();
        cart.updatedBy = user.user_email;

        await cart.save();

        res.status(201).json({
            success: true,
            message: "Product added to cart successfully",
            cart
        });

    } catch (err) {
        next(err);
    }
};

exports.fetchCart = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find cart with product details lookup
        const cartData = await Cart.aggregate([
            { $match: { user_id } },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product_id",
                    foreignField: "product_id",
                    as: "productDetails"
                }
            },
            {
                $project: {
                    cart_id: 1,
                    user_id: 1,
                    items: {
                        $map: {
                            input: "$items",
                            as: "item",
                            in: {
                                product_id: "$$item.product_id",
                                product_name: "$$item.product_name",
                                product_price: "$$item.product_price",
                                product_gst: "$$item.product_gst",
                                product_shipping_cost: "$$item.product_shipping_cost",
                                quantity: "$$item.quantity",
                                added_at: "$$item.added_at",
                                product_main_image: {
                                    $arrayElemAt: [
                                        {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: "$productDetails",
                                                        as: "prod",
                                                        cond: { $eq: ["$$prod.product_id", "$$item.product_id"] }
                                                    }
                                                },
                                                as: "prod",
                                                in: "$$prod.product_main_image"
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    },
                    total_price: 1,
                    total_gst: 1,
                    total_shipping_cost: 1,
                    grand_total: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    status: 1
                }
            }
        ]);

        if (!cartData || cartData.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Cart is empty",
                cart: {
                    user_id,
                    items: [],
                    total_price: 0,
                    total_gst: 0,
                    total_shipping_cost: 0,
                    grand_total: 0
                }
            });
        }

        const cart = cartData[0];

        const response = {
            success: true,
            message: "Cart fetched successfully",
            cart
        };

        res.status(200).json(response);

    } catch (err) {
        next(err);
    }
};

exports.updatedCart = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, product_id, quantity } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Verify product exists
        const product = await Product.findOne({ product_id, status: true });
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });

        // Check available quantity
        if (product.product_quantity < quantity)
            return res.status(400).json({ success: false, message: "Insufficient product quantity" });

        // Find cart
        const cart = await Cart.findOne({ user_id });
        if (!cart)
            return res.status(404).json({ success: false, message: "Cart not found" });

        // Find item in cart
        const cartItem = cart.items.find(item => item.product_id === product_id);
        if (!cartItem)
            return res.status(404).json({ success: false, message: "Product not found in cart" });

        // Update quantity
        cartItem.quantity = quantity;

        // Recalculate totals
        cart.total_price = 0;
        cart.total_gst = 0;
        cart.total_shipping_cost = 0;

        cart.items.forEach(item => {
            const itemPrice = item.product_price * item.quantity;
            const itemGST = (itemPrice * item.product_gst) / 100;
            const itemShipping = item.product_shipping_cost * item.quantity;

            cart.total_price += itemPrice;
            cart.total_gst += itemGST;
            cart.total_shipping_cost += itemShipping;
        });

        cart.grand_total = cart.total_price + cart.total_gst + cart.total_shipping_cost;
        cart.updatedAt = new Date();
        cart.updatedBy = user.user_email;

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart
        });

    } catch (err) {
        next(err);
    }
};

exports.productDelete = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, product_id } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find cart
        const cart = await Cart.findOne({ user_id });
        if (!cart)
            return res.status(404).json({ success: false, message: "Cart not found" });

        // Remove product from cart
        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.product_id !== product_id);

        if (cart.items.length === initialLength)
            return res.status(404).json({ success: false, message: "Product not found in cart" });

        // Recalculate totals
        cart.total_price = 0;
        cart.total_gst = 0;
        cart.total_shipping_cost = 0;

        cart.items.forEach(item => {
            const itemPrice = item.product_price * item.quantity;
            const itemGST = (itemPrice * item.product_gst) / 100;
            const itemShipping = item.product_shipping_cost * item.quantity;

            cart.total_price += itemPrice;
            cart.total_gst += itemGST;
            cart.total_shipping_cost += itemShipping;
        });

        cart.grand_total = cart.total_price + cart.total_gst + cart.total_shipping_cost;
        cart.updatedAt = new Date();
        cart.updatedBy = user.user_email;

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Product removed from cart successfully",
            cart
        });

    } catch (err) {
        next(err);
    }
};

exports.allProductDelete = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find cart
        const cart = await Cart.findOne({ user_id });
        if (!cart)
            return res.status(404).json({ success: false, message: "Cart not found" });

        // Clear all items
        cart.items = [];
        cart.total_price = 0;
        cart.total_gst = 0;
        cart.total_shipping_cost = 0;
        cart.grand_total = 0;
        cart.updatedAt = new Date();
        cart.updatedBy = user.user_email;

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart
        });

    } catch (err) {
        next(err);
    }
};

exports.validateVoucher = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, voucher_code } = req.body;

        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        const voucher = await Voucher.findOne({ voucher_code: voucher_code.toUpperCase() });
        if (!voucher)
            return res.status(404).json({ success: false, message: "Voucher not found" });

        const now = new Date();

        if (!voucher.status)
            return res.status(400).json({ success: false, message: "Voucher is inactive" });

        if (now < new Date(voucher.start_date))
            return res.status(400).json({ success: false, message: "Voucher is not yet valid" });

        if (now > new Date(voucher.end_date))
            return res.status(400).json({ success: false, message: "Voucher has expired" });

        if (voucher.max_usage && voucher.used_count >= voucher.max_usage)
            return res.status(400).json({ success: false, message: "Voucher usage limit exceeded" });

        res.status(200).json({
            success: true,
            message: "Voucher is valid",
            data: {
                voucher_code: voucher.voucher_code,
                discount_percentage: voucher.discount_percentage,
                valid_until: voucher.end_date,
                description: voucher.description
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.createVoucher = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { voucher_code, discount_percentage, start_date, end_date, max_usage, description, createdBy } = req.body;

        const existingVoucher = await Voucher.findOne({ voucher_code: voucher_code.toUpperCase() });
        if (existingVoucher)
            return res.status(400).json({ success: false, message: "Voucher code already exists" });

        const newVoucher = new Voucher({
            voucher_code: voucher_code.toUpperCase(),
            discount_percentage,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            max_usage: max_usage || null,
            description: description || null,
            status: true,
            createdBy,
            createdAt: new Date()
        });

        await newVoucher.save();

        res.status(201).json({
            success: true,
            message: "Voucher created successfully",
            data: newVoucher
        });

    } catch (err) {
        next(err);
    }
};

exports.getAllVouchers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const vouchers = await Voucher.find()
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Voucher.countDocuments();
        const totalActive = await Voucher.countDocuments({ status: true });
        const totalInactive = await Voucher.countDocuments({ status: false });

        const response = {
            success: true,
            data: vouchers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalVouchers: total,
                totalActiveVouchers: totalActive,
                totalInactiveVouchers: totalInactive,
                limit: parseInt(limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };

        res.status(200).json(response);

    } catch (err) {
        next(err);
    }
};

exports.getVoucherById = async (req, res, next) => {
    try {
        const { id } = req.query;

        if (!id)
            return res.status(400).json({ success: false, message: "Voucher ID is required" });

        const voucher = await Voucher.findById(id);
        if (!voucher)
            return res.status(404).json({ success: false, message: "Voucher not found" });

        const response = {
            success: true,
            data: voucher
        };

        res.status(200).json(response);

    } catch (err) {
        next(err);
    }
};

exports.updateVoucher = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { id, voucher_code, discount_percentage, start_date, end_date, max_usage, description, status, updatedBy } = req.body;

        if (!id)
            return res.status(400).json({ success: false, message: "Voucher ID is required" });

        const voucher = await Voucher.findById(id);
        if (!voucher)
            return res.status(404).json({ success: false, message: "Voucher not found" });

        if (voucher_code && voucher_code.toUpperCase() !== voucher.voucher_code) {
            const existingVoucher = await Voucher.findOne({ voucher_code: voucher_code.toUpperCase() });
            if (existingVoucher)
                return res.status(400).json({ success: false, message: "Voucher code already exists" });
        }

        const updateData = {};
        if (voucher_code) updateData.voucher_code = voucher_code.toUpperCase();
        if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage;
        if (start_date) updateData.start_date = new Date(start_date);
        if (end_date) updateData.end_date = new Date(end_date);
        if (max_usage !== undefined) updateData.max_usage = max_usage || null;
        if (description !== undefined) updateData.description = description || null;
        if (typeof status === 'boolean') updateData.status = status;

        updateData.updatedBy = updatedBy;
        updateData.updatedAt = new Date();

        const updatedVoucher = await Voucher.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({
            success: true,
            message: "Voucher updated successfully",
            data: updatedVoucher
        });

    } catch (err) {
        next(err);
    }
};

exports.deleteVoucher = async (req, res, next) => {
    try {
        const { id } = req.body;

        if (!id)
            return res.status(400).json({ success: false, message: "Voucher ID is required" });

        const voucher = await Voucher.findByIdAndDelete(id);
        if (!voucher)
            return res.status(404).json({ success: false, message: "Voucher not found" });

        res.status(200).json({
            success: true,
            message: "Voucher deleted successfully"
        });

    } catch (err) {
        next(err);
    }
};


