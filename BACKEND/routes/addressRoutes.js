const express = require('express');
const { body } = require('express-validator');
const addressCtrl = require('../controllers/addressControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

/**
* @swagger
* tags:
*   name: Address
*   description: Address management endpoints
*/

/**
* @swagger
* /address/createAddress:
*   post:
*     summary: Create a new address
*     tags: [Address]
*     security:
*       - BearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - full_name
*               - phone
*               - email
*               - street
*               - city
*               - state
*               - pincode
*             properties:
*               user_id:
*                 type: integer
*                 example: 15
*               full_name:
*                 type: string
*                 example: "John Doe"
*               phone:
*                 type: string
*                 example: "9555665565"
*               email:
*                 type: string
*                 example: "john@example.com"
*               street:
*                 type: string
*                 example: "123 Main Street"
*               city:
*                 type: string
*                 example: "New York"
*               state:
*                 type: string
*                 example: "NY"
*               pincode:
*                 type: string
*                 example: "516005"
*               country:
*                 type: string
*                 example: "India"
*                 default: "India"
*               is_default:
*                 type: boolean
*                 example: false
*     responses:
*       201:
*         description: Address created successfully
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
*         description: User not found
*       500:
*         description: Server error
*/
router.post(
    '/createAddress',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('full_name').notEmpty().withMessage("full_name is required"),
        body('phone').matches(/^[0-9]{10}$/).withMessage("phone must be 10 digits"),
        body('email').isEmail().withMessage("Invalid email format"),
        body('street').notEmpty().withMessage("street is required"),
        body('city').notEmpty().withMessage("city is required"),
        body('state').notEmpty().withMessage("state is required"),
        body('pincode').matches(/^[0-9]{6}$/).withMessage("pincode must be 6 digits"),
        body('country').optional().isString().withMessage("country must be a string"),
        body('is_default').optional().isBoolean().withMessage("is_default must be boolean")
    ],
    addressCtrl.createAddress
);

/**
* @swagger
* /address/getAddresses:
*   post:
*     summary: Get all addresses for a user
*     tags: [Address]
*     security:
*       - BearerAuth: []
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
*                 example: 15
*     responses:
*       200:
*         description: Addresses fetched successfully
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
*                     addresses:
*                       type: array
*                       items:
*                         type: object
*       400:
*         description: Validation error
*       404:
*         description: User not found
*       500:
*         description: Server error
*/
router.post(
    '/getAddresses',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer")
    ],
    addressCtrl.getAddresses
);

/**
* @swagger
* /address/getAddressById:
*   post:
*     summary: Get a specific address by ID
*     tags: [Address]
*     security:
*       - BearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - address_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 15
*               address_id:
*                 type: integer
*                 example: 1
*     responses:
*       200:
*         description: Address fetched successfully
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
*         description: User or address not found
*       500:
*         description: Server error
*/
router.post(
    '/getAddressById',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('address_id').isInt().withMessage("address_id must be an integer")
    ],
    addressCtrl.getAddressById
);

/**
* @swagger
* /address/updateAddress:
*   post:
*     summary: Update an existing address
*     tags: [Address]
*     security:
*       - BearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - address_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 15
*               address_id:
*                 type: integer
*                 example: 1
*               full_name:
*                 type: string
*                 example: "Jane Doe"
*               phone:
*                 type: string
*                 example: "9555665565"
*               email:
*                 type: string
*                 example: "jane@example.com"
*               street:
*                 type: string
*                 example: "456 Oak Avenue"
*               city:
*                 type: string
*                 example: "Los Angeles"
*               state:
*                 type: string
*                 example: "CA"
*               pincode:
*                 type: string
*                 example: "516005"
*               country:
*                 type: string
*                 example: "India"
*               is_default:
*                 type: boolean
*                 example: true
*     responses:
*       200:
*         description: Address updated successfully
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
*         description: User or address not found
*       500:
*         description: Server error
*/
router.post(
    '/updateAddress',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('address_id').isInt().withMessage("address_id must be an integer"),
        body('full_name').optional().notEmpty().withMessage("full_name cannot be empty"),
        body('phone').optional().matches(/^[0-9]{10}$/).withMessage("phone must be 10 digits"),
        body('email').optional().isEmail().withMessage("Invalid email format"),
        body('street').optional().notEmpty().withMessage("street cannot be empty"),
        body('city').optional().notEmpty().withMessage("city cannot be empty"),
        body('state').optional().notEmpty().withMessage("state cannot be empty"),
        body('pincode').optional().matches(/^[0-9]{6}$/).withMessage("pincode must be 6 digits"),
        body('country').optional().isString().withMessage("country must be a string"),
        body('is_default').optional().isBoolean().withMessage("is_default must be boolean")
    ],
    addressCtrl.updateAddress
);

/**
* @swagger
* /address/deleteAddress:
*   post:
*     summary: Delete an address (soft delete)
*     tags: [Address]
*     security:
*       - BearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - address_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 15
*               address_id:
*                 type: integer
*                 example: 1
*     responses:
*       200:
*         description: Address deleted successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 message:
*                   type: string
*       400:
*         description: Validation error
*       404:
*         description: User or address not found
*       500:
*         description: Server error
*/
router.post(
    '/deleteAddress',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('address_id').isInt().withMessage("address_id must be an integer")
    ],
    addressCtrl.deleteAddress
);

/**
* @swagger
* /address/setDefaultAddress:
*   post:
*     summary: Set an address as default for a user
*     tags: [Address]
*     security:
*       - BearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - user_id
*               - address_id
*             properties:
*               user_id:
*                 type: integer
*                 example: 15
*               address_id:
*                 type: integer
*                 example: 1
*     responses:
*       200:
*         description: Default address set successfully
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
*         description: User or address not found
*       500:
*         description: Server error
*/
router.post(
    '/setDefaultAddress',
    authMiddleware(),
    [
        body('user_id').isInt().withMessage("user_id must be an integer"),
        body('address_id').isInt().withMessage("address_id must be an integer")
    ],
    addressCtrl.setDefaultAddress
);

module.exports = router;
