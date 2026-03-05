const express = require('express');
const { body } = require('express-validator');
const orderCtrl = require('../controllers/orderControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

/**
* @swagger
* tags:
*   name: Orders
*   description: Order and payment management endpoints
*/

/**
* @swagger
* /order/createOrder:
*   post:
*     summary: Create a new order from cart items
*     tags: [Orders]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - cart_items
*               - shipping_address
*               - order_summary
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*                 description: User ID
*               cart_items:
*                 type: array
*                 items:
*                   type: object
*                   properties:
*                     product_id:
*                       type: integer
*                     product_name:
*                       type: string
*                     product_price:
*                       type: number
*                     product_gst:
*                       type: number
*                     product_shipping_cost:
*                       type: number
*                     quantity:
*                       type: integer
*                     product_main_image:
*                       type: string
*               shipping_address:
*                 type: object
*                 required:
*                   - full_name
*                   - phone
*                   - email
*                   - street
*                   - city
*                   - state
*                   - pincode
*                 properties:
*                   full_name:
*                     type: string
*                   phone:
*                     type: string
*                   email:
*                     type: string
*                   street:
*                     type: string
*                   city:
*                     type: string
*                   state:
*                     type: string
*                   pincode:
*                     type: string
*                   country:
*                     type: string
*                     default: India
*               order_summary:
*                 type: object
*                 required:
*                   - total_price
*                   - total_gst
*                   - total_shipping_cost
*                   - grand_total
*                 properties:
*                   total_price:
*                     type: number
*                   total_gst:
*                     type: number
*                   total_shipping_cost:
*                     type: number
*                   grand_total:
*                     type: number
*               payment_method:
*                 type: string
*                 enum: [razorpay, cod]
*                 default: cod
*                 description: Payment method (razorpay or cash on delivery)
*     responses:
*       201:
*         description: Order created successfully
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
*                     order_id:
*                       type: string
*                     razorpay_order:
*                       type: object
*                       properties:
*                         id:
*                           type: string
*                         amount:
*                           type: integer
*                         currency:
*                           type: string
*                     key_id:
*                       type: string
*       400:
*         description: Validation error or missing required fields
*       404:
*         description: User not found
*       500:
*         description: Server error
*/
router.post(
    '/createOrder',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('cart_items').isArray({ min: 1 }).withMessage("cart_items must be a non-empty array"),
        body('shipping_address').isObject().withMessage("shipping_address must be an object"),
        body('order_summary').isObject().withMessage("order_summary must be an object"),
        body('payment_method').optional().isIn(['razorpay', 'cod']).withMessage("payment_method must be razorpay or cod")
    ],
    orderCtrl.createOrder
);

/**
* @swagger
* /order/verifyPayment:
*   post:
*     summary: Verify Razorpay payment and confirm order
*     tags: [Orders]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - razorpay_order_id
*               - razorpay_payment_id
*               - razorpay_signature
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*               razorpay_order_id:
*                 type: string
*                 description: Razorpay order ID returned from createOrder
*               razorpay_payment_id:
*                 type: string
*                 description: Razorpay payment ID from payment gateway
*               razorpay_signature:
*                 type: string
*                 description: Razorpay signature from payment gateway
*     responses:
*       200:
*         description: Payment verified successfully
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
*                     order_id:
*                       type: string
*                     order_status:
*                       type: string
*                     payment_status:
*                       type: string
*       400:
*         description: Payment verification failed or invalid details
*       404:
*         description: User or order not found
*       500:
*         description: Server error
*/
router.post(
    '/verifyPayment',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('razorpay_order_id').notEmpty().withMessage("razorpay_order_id is required"),
        body('razorpay_payment_id').notEmpty().withMessage("razorpay_payment_id is required"),
        body('razorpay_signature').notEmpty().withMessage("razorpay_signature is required")
    ],
    orderCtrl.verifyPayment
);

/**
* @swagger
* /order/cancelOrder:
*   post:
*     summary: Cancel an order
*     tags: [Orders]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - order_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*               order_id:
*                 type: string
*                 description: Order ID to cancel
*               cancellation_reason:
*                 type: string
*                 description: Reason for cancellation
*     responses:
*       200:
*         description: Order cancelled successfully
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
*                     order_id:
*                       type: string
*                     order_status:
*                       type: string
*                     cancellation_reason:
*                       type: string
*       400:
*         description: Order cannot be cancelled or validation error
*       404:
*         description: User or order not found
*       500:
*         description: Server error
*/
router.post(
    '/cancelOrder',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('order_id').notEmpty().withMessage("order_id is required"),
        body('cancellation_reason').optional().isString().withMessage("cancellation_reason must be a string")
    ],
    orderCtrl.cancelOrder
);

/**
* @swagger
* /order/getOrders:
*   post:
*     summary: Get all orders for a user
*     tags: [Orders]
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
*     responses:
*       200:
*         description: Orders fetched successfully
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
*                     count:
*                       type: integer
*                     orders:
*                       type: array
*                       items:
*                         type: object
*                         properties:
*                           order_id:
*                             type: string
*                           user_id:
*                             type: integer
*                           order_status:
*                             type: string
*                           payment_status:
*                             type: string
*                           order_summary:
*                             type: object
*                           createdAt:
*                             type: string
*                             format: date-time
*       400:
*         description: Validation error
*       404:
*         description: User not found
*       500:
*         description: Server error
*/
router.post(
    '/getOrders',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer")
    ],
    orderCtrl.getOrders
);

/**
* @swagger
* /order/getOrderById:
*   post:
*     summary: Get specific order details
*     tags: [Orders]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - order_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*               order_id:
*                 type: string
*                 description: Order ID to fetch
*     responses:
*       200:
*         description: Order fetched successfully
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
*                     order:
*                       type: object
*                       properties:
*                         order_id:
*                           type: string
*                         user_id:
*                           type: integer
*                         user_email:
*                           type: string
*                         cart_items:
*                           type: array
*                         shipping_address:
*                           type: object
*                         order_summary:
*                           type: object
*                         payment_method:
*                           type: string
*                         payment_status:
*                           type: string
*                         order_status:
*                           type: string
*                         createdAt:
*                           type: string
*                           format: date-time
*       400:
*         description: Validation error
*       404:
*         description: User or order not found
*       500:
*         description: Server error
*/
router.post(
    '/getOrderById',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('order_id').notEmpty().withMessage("order_id is required")
    ],
    orderCtrl.getOrderById
);

/**
* @swagger
* /order/confirmCODOrder:
*   post:
*     summary: Confirm COD (Cash on Delivery) order
*     description: Mark COD order as confirmed. Inventory quantities are reduced when order is created, this just updates the order status to confirmed.
*     tags: [Orders]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - order_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 11
*               order_id:
*                 type: string
*                 description: Order ID to confirm
*     responses:
*       200:
*         description: COD order confirmed successfully
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
*                     order_id:
*                       type: string
*                     order_status:
*                       type: string
*                     payment_status:
*                       type: string
*                     note:
*                       type: string
*       400:
*         description: Order cannot be confirmed or validation error
*       404:
*         description: User or order not found
*       500:
*         description: Server error
*/
router.post(
    '/confirmCODOrder',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('order_id').notEmpty().withMessage("order_id is required")
    ],
    orderCtrl.confirmCODOrder
);

/**
* @swagger
* /order/getAllOrders:
*   get:
*     summary: Get all orders with pagination (Admin endpoint)
*     tags: [Orders]
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
*         description: Orders per page
*     responses:
*       200:
*         description: Orders fetched successfully
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
*                     orders:
*                       type: array
*                     pagination:
*                       type: object
*       500:
*         description: Server error
*/
router.get(
    '/getAllOrders',
    authMiddleware(1),
    orderCtrl.getAllOrders
);


router.get(
    '/getAllAdminOrders',
    orderCtrl.getAllOrders
);

/**
* @swagger
* /order/updateOrderStatus:
*   post:
*     summary: Update order status (Admin endpoint)
*     tags: [Orders]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - order_id
*               - order_status
*               - updated_by
*             properties:
*               order_id:
*                 type: string
*                 example: "ORD-XXXXX-XXXXX"
*               order_status:
*                 type: string
*                 enum: [created, confirmed, processing, shipped, out_for_delivery, delivered, cancelled]
*               message:
*                 type: string
*                 description: Custom status message
*               updated_by:
*                 type: string
*                 example: "admin@gmail.com"
*     responses:
*       200:
*         description: Order status updated successfully
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
*       400:
*         description: Validation error
*       404:
*         description: Order not found
*       500:
*         description: Server error
*/
router.post(
    '/updateOrderStatus',
    authMiddleware(1),
    [
        body('order_id').notEmpty().withMessage("order_id is required"),
        body('order_status').isIn(['created', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']).withMessage("Invalid order status"),
        body('updated_by').notEmpty().withMessage("updated_by is required"),
        body('message').optional().isString().withMessage("message must be a string")
    ],
    orderCtrl.updateOrderStatus
);

module.exports = router;
