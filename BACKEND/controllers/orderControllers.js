const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const crypto = require('crypto');
const { cacheGet, cacheSet, cacheDelete, cacheDeletePattern, getCacheKey, CACHE_TTL } = require('../middlewares/cacheMiddleware');

const Razorpay = require('razorpay');

const generateOrderId = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `ORD-${timestamp}-${randomPart}`.toUpperCase();
};

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const reduceProductQuantity = async (cartItems) => {
    try {
        for (const item of cartItems) {
            await Product.findOneAndUpdate(
                { product_id: item.product_id },
                { $inc: { product_quantity: -item.quantity } },
                { new: true }
            );
        }
    } catch (err) {
        console.error("Error reducing product quantity:", err);
        throw err;
    }
};

exports.createOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, cart_items, shipping_address, order_summary, payment_method } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Validate cart items
        if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0)
            return res.status(400).json({ success: false, message: "Cart items are required" });

        // Validate shipping address
        if (!shipping_address)
            return res.status(400).json({ success: false, message: "Shipping address is required" });

        if (!order_summary)
            return res.status(400).json({ success: false, message: "Order summary is required" });

        // Create order ID
        const orderId = generateOrderId();

        // Create order object
        const orderData = {
            order_id: orderId,
            user_id,
            user_email: user.user_email,
            cart_items,
            shipping_address,
            order_summary,
            payment_method: payment_method || 'cod',
            payment_status: payment_method === 'razorpay' ? 'pending' : 'completed',
            order_status: 'created',
            createdBy: user.user_email,
            updatedAt: new Date()
        };

        // Create and save order
        const order = new Order(orderData);
        await order.save();

        // If COD order, reduce product quantities immediately
        if (payment_method === 'cod' || payment_method === undefined) {
            try {
                await reduceProductQuantity(cart_items);
                
                // Clear user's cart
                await Cart.deleteOne({ user_id });

                return res.status(201).json({
                    success: true,
                    message: "COD Order created successfully",
                    data: {
                        order_id: orderId,
                        order_status: 'created',
                        payment_method: 'cod',
                        note: 'Quantities reduced from inventory'
                    }
                });
            } catch (err) {
                console.error("Error processing COD order:", err);
                await Order.deleteOne({ order_id: orderId });
                return res.status(500).json({
                    success: false,
                    message: "Failed to process COD order",
                    error: err.message
                });
            }

            // Invalidate orders cache
            await cacheDeletePattern('getOrders:*');
            await cacheDeletePattern('getOrderById:*');
            console.log('Cache DELETED: orders related caches');
        }
        // If razorpay payment, create razorpay order
        else if (payment_method === 'razorpay') {
            try {
                const razorpayOrder = await razorpayInstance.orders.create({
                    amount: Math.round(order_summary.grand_total * 100),
                    currency: 'INR',
                    receipt: orderId,
                    payment_capture: 1
                });

                // Update order with razorpay order ID
                order.razorpay_order_id = razorpayOrder.id;
                await order.save();

                return res.status(201).json({
                    success: true,
                    message: "Order created successfully",
                    data: {
                        order_id: orderId,
                        razorpay_order: {
                            id: razorpayOrder.id,
                            amount: razorpayOrder.amount,
                            currency: razorpayOrder.currency
                        },
                        key_id: process.env.RAZORPAY_KEY_ID
                    }
                });
            } catch (razorpayErr) {
                console.error("Razorpay error:", razorpayErr);
                await Order.deleteOne({ order_id: orderId });
                return res.status(500).json({
                    success: false,
                    message: "Failed to create Razorpay order",
                    error: razorpayErr.message
                });
            }
        }

    } catch (err) {
        console.error("Create order error:", err);
        next(err);
    }
};

exports.verifyPayment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
            return res.status(400).json({ success: false, message: "Invalid payment details" });

        // Find order
        const order = await Order.findOne({ razorpay_order_id });
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            try {
                // Reduce product quantities
                await reduceProductQuantity(order.cart_items);

                // Update order with payment details
                order.razorpay_payment_id = razorpay_payment_id;
                order.razorpay_signature = razorpay_signature;
                order.payment_status = 'completed';
                order.order_status = 'confirmed';
                order.updatedAt = new Date();
                order.updatedBy = user.user_email;
                await order.save();

                // Clear user's cart
                await Cart.deleteOne({ user_id });

                // Invalidate orders cache
                await cacheDeletePattern('getOrders:*');
                await cacheDeletePattern('getOrderById:*');
                console.log('Cache DELETED: orders related caches');

                return res.status(200).json({
                    success: true,
                    message: "Payment verified successfully",
                    data: {
                        order_id: order.order_id,
                        order_status: order.order_status,
                        payment_status: order.payment_status,
                        note: 'Quantities reduced from inventory'
                    }
                });
            } catch (err) {
                console.error("Error processing payment verification:", err);
                return res.status(500).json({
                    success: false,
                    message: "Payment verified but failed to update inventory",
                    error: err.message
                });
            }
        } else {
            // Payment verification failed
            order.payment_status = 'failed';
            order.updatedAt = new Date();
            await order.save();

            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

    } catch (err) {
        console.error("Verify payment error:", err);
        next(err);
    }
};

exports.confirmCODOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, order_id } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find order
        const order = await Order.findOne({ order_id, user_id });
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });

        // Check if order is COD
        if (order.payment_method !== 'cod')
            return res.status(400).json({ 
                success: false, 
                message: "This endpoint is only for COD orders" 
            });

        // Check if already confirmed
        if (order.order_status === 'confirmed')
            return res.status(400).json({ 
                success: false, 
                message: "Order is already confirmed" 
            });

        // Update order status to confirmed
        order.order_status = 'confirmed';
        order.updatedAt = new Date();
        order.updatedBy = user.user_email;
        await order.save();

        // Invalidate orders cache
        await cacheDeletePattern('getOrders:*');
        await cacheDeletePattern('getOrderById:*');
        console.log('Cache DELETED: orders related caches');

        return res.status(200).json({
            success: true,
            message: "COD order confirmed successfully",
            data: {
                order_id: order.order_id,
                order_status: order.order_status,
                payment_status: order.payment_status,
                note: 'Quantities already reduced during order creation'
            }
        });

    } catch (err) {
        console.error("Confirm COD order error:", err);
        next(err);
    }
};

exports.cancelOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, order_id, cancellation_reason } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find order
        const order = await Order.findOne({ order_id, user_id });
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });

        // Check if order can be cancelled
        if (order.order_status === 'delivered' || order.order_status === 'cancelled')
            return res.status(400).json({ 
                success: false, 
                message: `Order cannot be cancelled (current status: ${order.order_status})` 
            });

        try {
            // If order was confirmed (quantities were reduced), restore them
            if (order.order_status === 'confirmed' || order.payment_status === 'completed') {
                const restoreItems = order.cart_items.map(item => ({
                    product_id: item.product_id,
                    quantity: -item.quantity
                }));
                
                for (const item of restoreItems) {
                    await Product.findOneAndUpdate(
                        { product_id: item.product_id },
                        { $inc: { product_quantity: -item.quantity } },
                        { new: true }
                    );
                }
            }

            // Update order
            order.order_status = 'cancelled';
            order.cancellation_reason = cancellation_reason || 'User cancelled';
            order.updatedAt = new Date();
            order.updatedBy = user.user_email;
            await order.save();

            // Invalidate orders cache
            await cacheDeletePattern('getOrders:*');
            await cacheDeletePattern('getOrderById:*');
            console.log('Cache DELETED: orders related caches');

            return res.status(200).json({
                success: true,
                message: "Order cancelled successfully and inventory restored",
                data: {
                    order_id: order.order_id,
                    order_status: order.order_status,
                    cancellation_reason: order.cancellation_reason
                }
            });
        } catch (err) {
            console.error("Error restoring inventory:", err);
            // Still cancel the order even if restoration fails
            order.order_status = 'cancelled';
            order.cancellation_reason = cancellation_reason || 'User cancelled';
            order.updatedAt = new Date();
            order.updatedBy = user.user_email;
            await order.save();

            // Invalidate orders cache
            await cacheDeletePattern('getOrders:*');
            await cacheDeletePattern('getOrderById:*');
            console.log('Cache DELETED: orders related caches');

            return res.status(500).json({
                success: false,
                message: "Order cancelled but failed to restore inventory",
                error: err.message
            });
        }

    } catch (err) {
        console.error("Cancel order error:", err);
        next(err);
    }
};

exports.getOrders = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id } = req.body;
        const cacheKey = getCacheKey('getOrders', { user_id });

        // Try to get from cache
        const cachedOrders = await cacheGet(cacheKey);
        if (cachedOrders) {
            console.log(`Cache HIT: ${cacheKey}`);
            return res.status(200).json(cachedOrders);
        }

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find all orders
        const orders = await Order.find({ user_id })
            .sort({ createdAt: -1 });

        const response = {
            success: true,
            message: "Orders fetched successfully",
            data: {
                count: orders.length,
                orders
            }
        };

        // Cache the result
        await cacheSet(cacheKey, response, CACHE_TTL.ORDERS);
        console.log(`Cache SET: ${cacheKey}`);

        return res.status(200).json(response);

    } catch (err) {
        console.error("Get orders error:", err);
        next(err);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, order_id } = req.body;
        const cacheKey = getCacheKey('getOrderById', { user_id, order_id });

        // Try to get from cache
        const cachedOrder = await cacheGet(cacheKey);
        if (cachedOrder) {
            console.log(`Cache HIT: ${cacheKey}`);
            return res.status(200).json(cachedOrder);
        }

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find order
        const order = await Order.findOne({ order_id, user_id });
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });

        const response = {
            success: true,
            message: "Order fetched successfully",
            data: {
                order
            }
        };

        // Cache the result
        await cacheSet(cacheKey, response, CACHE_TTL.ORDERS);
        console.log(`Cache SET: ${cacheKey}`);

        return res.status(200).json(response);

    } catch (err) {
        console.error("Get order error:", err);
        next(err);
    }
};

exports.getAllOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const filterStatus = req.query.status || '';
        const cacheKey = getCacheKey('getAllOrders', { page, limit, search, filterStatus });

        // Try to get from cache
        const cachedOrders = await cacheGet(cacheKey);
        if (cachedOrders) {
            console.log(`Cache HIT: ${cacheKey}`);
            return res.status(200).json(cachedOrders);
        }

        // Build search regex for multiple fields
        const searchRegex = { $regex: search, $options: 'i' };

        const aggregateStages = [
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "user_details"
                }
            },
            {
                $unwind: { path: "$user_details", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    order_id: 1,
                    user_id: 1,
                    user_email: 1,
                    payment_method: 1,
                    payment_status: 1,
                    order_status: 1,
                    order_summary: 1,
                    shipping_address: 1,
                    cart_items: 1,
                    order_timeline: 1,
                    razorpay_payment_id: 1,
                    createdAt: 1,
                    user_name: "$user_details.user_name",
                    user_phone: "$user_details.user_phone"
                }
            }
        ];

        // Add search filter if search term exists
        if (search) {
            aggregateStages.push({
                $match: {
                    $or: [
                        { order_id: searchRegex },
                        { user_email: searchRegex },
                        { "user_name": searchRegex }
                    ]
                }
            });
        }

        // Add status filter if provided
        if (filterStatus) {
            aggregateStages.push({ $match: { order_status: filterStatus } });
        }

        // Count total for pagination
        const countStages = [...aggregateStages];
        countStages.push({ $count: "total" });
        const countResult = await Order.aggregate(countStages);
        const totalFilteredOrders = countResult.length > 0 ? countResult[0].total : 0;

        // Get paginated orders
        aggregateStages.push(
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        );

        const orders = await Order.aggregate(aggregateStages);

        // Get total counts for status badges
        const totalOrders = await Order.countDocuments();
        const totalConfirmedOrders = await Order.countDocuments({ order_status: 'confirmed' });
        const totalProcessingOrders = await Order.countDocuments({ order_status: 'processing' });
        const totalShippedOrders = await Order.countDocuments({ order_status: 'shipped' });
        const totalDeliveredOrders = await Order.countDocuments({ order_status: 'delivered' });
        const totalCancelledOrders = await Order.countDocuments({ order_status: 'cancelled' });

        const totalPages = Math.ceil(totalFilteredOrders / limit);

        const response = {
            success: true,
            message: "Orders fetched successfully",
            data: {
                orders,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalOrders,
                    totalFilteredOrders,
                    limit,
                    totalConfirmedOrders,
                    totalProcessingOrders,
                    totalShippedOrders,
                    totalDeliveredOrders,
                    totalCancelledOrders,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        };

        // Cache the result
        await cacheSet(cacheKey, response, CACHE_TTL.ORDERS);
        console.log(`Cache SET: ${cacheKey}`);

        return res.status(200).json(response);

    } catch (err) {
        console.error("Get all orders error:", err);
        next(err);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { order_id, order_status, message, updated_by } = req.body;

        // Validate required fields
        if (!order_id || !order_status || !updated_by) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: order_id, order_status, updated_by"
            });
        }

        // Find order
        const order = await Order.findOne({ order_id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Status flow
        const statusFlow = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

        // Initialize timeline if it doesn't exist
        if (!order.order_timeline) {
            order.order_timeline = [];
        }

        // Get current status index
        const currentStatusIndex = statusFlow.indexOf(order.order_status);
        const newStatusIndex = statusFlow.indexOf(order_status);

        // Create timestamp for all updates
        const timestamp = new Date();

        // Check if current status is in timeline
        const currentStatusInTimeline = order.order_timeline.some(e => e.status === order.order_status);

        // If current status is not in timeline, add it first
        if (!currentStatusInTimeline && currentStatusIndex !== -1) {
            order.order_timeline.push({
                status: order.order_status,
                message: `Order status: ${order.order_status}`,
                timestamp: timestamp,
                updated_by: updated_by
            });
        }

        // If updating to a future status, add all intermediate statuses
        if (newStatusIndex > currentStatusIndex) {
            // Add entries for all statuses between current and new (excluding current, including new)
            for (let i = currentStatusIndex + 1; i <= newStatusIndex; i++) {
                const status = statusFlow[i];
                const isLastStatus = (i === newStatusIndex);
                
                order.order_timeline.push({
                    status: status,
                    message: isLastStatus ? (message || `Order status updated to ${order_status}`) : `Order updated to ${status}`,
                    timestamp: timestamp,
                    updated_by: updated_by
                });
            }
        } else {
            // If not a forward update, just add the new status entry
            order.order_timeline.push({
                status: order_status,
                message: message || `Order status updated to ${order_status}`,
                timestamp: timestamp,
                updated_by: updated_by
            });
        }

        // Update order status
        order.order_status = order_status;
        order.updatedAt = timestamp;
        order.updatedBy = updated_by;

        // Save the order
        const updatedOrder = await order.save();

        // Invalidate orders cache
        await cacheDeletePattern('getOrders:*');
        await cacheDeletePattern('getOrderById:*');
        await cacheDeletePattern('getAllOrders:*');
        console.log('Cache DELETED: orders related caches');

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: {
                order_id: updatedOrder.order_id,
                order_status: updatedOrder.order_status,
                order_timeline: updatedOrder.order_timeline,
                updatedAt: updatedOrder.updatedAt
            }
        });

    } catch (err) {
        console.error("Update order status error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to update order status",
            error: err.message
        });
    }
};

