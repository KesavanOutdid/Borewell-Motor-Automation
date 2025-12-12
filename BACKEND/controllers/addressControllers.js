const { validationResult } = require('express-validator');
const Address = require('../models/Address');
const User = require('../models/User');
const { cacheGet, cacheSet, cacheDelete, cacheDeletePattern, getCacheKey, CACHE_TTL } = require('../middlewares/cacheMiddleware');

exports.createAddress = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, full_name, phone, email, street, city, state, pincode, country, is_default } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Auto-increment address_id
        const lastAddress = await Address.findOne().sort({ address_id: -1 }).lean();
        const newAddressId = lastAddress ? lastAddress.address_id + 1 : 1;

        // Create address
        const address = new Address({
            address_id: newAddressId,
            user_id,
            full_name,
            phone,
            email,
            street,
            city,
            state,
            pincode,
            country: country || 'India',
            is_default: is_default || false,
            createdBy: user.user_email
        });

        await address.save();

        // Invalidate addresses cache
        await cacheDeletePattern('getAddresses:*');
        console.log('Cache DELETED: addresses related caches');

        res.status(201).json({
            success: true,
            message: "Address created successfully",
            data: {
                address_id: address.address_id,
                user_id: address.user_id,
                full_name: address.full_name,
                phone: address.phone,
                email: address.email,
                street: address.street,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country,
                is_default: address.is_default
            }
        });

    } catch (err) {
        console.error("Create address error:", err);
        next(err);
    }
};

exports.getAddresses = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id } = req.body;
        const cacheKey = getCacheKey('getAddresses', { user_id });

        // Try to get from cache
        const cachedAddresses = await cacheGet(cacheKey);
        if (cachedAddresses) {
            console.log(`Cache HIT: ${cacheKey}`);
            return res.status(200).json(cachedAddresses);
        }

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Fetch all addresses for user
        const addresses = await Address.find({ user_id, status: true }).sort({ createdAt: -1 });

        const response = {
            success: true,
            message: "Addresses fetched successfully",
            data: {
                count: addresses.length,
                addresses
            }
        };

        // Cache the result
        await cacheSet(cacheKey, response, CACHE_TTL.ADDRESSES);
        console.log(`Cache SET: ${cacheKey}`);

        res.status(200).json(response);

    } catch (err) {
        console.error("Get addresses error:", err);
        next(err);
    }
};

exports.getAddressById = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, address_id } = req.body;
        const cacheKey = getCacheKey('getAddressById', { user_id, address_id });

        // Try to get from cache
        const cachedAddress = await cacheGet(cacheKey);
        if (cachedAddress) {
            console.log(`Cache HIT: ${cacheKey}`);
            return res.status(200).json(cachedAddress);
        }

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find address
        const address = await Address.findOne({ address_id, user_id });
        if (!address)
            return res.status(404).json({ success: false, message: "Address not found" });

        const response = {
            success: true,
            message: "Address fetched successfully",
            data: { address }
        };

        // Cache the result
        await cacheSet(cacheKey, response, CACHE_TTL.ADDRESSES);
        console.log(`Cache SET: ${cacheKey}`);

        res.status(200).json(response);

    } catch (err) {
        console.error("Get address by id error:", err);
        next(err);
    }
};

exports.updateAddress = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, address_id, full_name, phone, email, street, city, state, pincode, country, is_default } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find address
        const address = await Address.findOne({ address_id, user_id });
        if (!address)
            return res.status(404).json({ success: false, message: "Address not found" });

        // Update fields
        if (full_name) address.full_name = full_name;
        if (phone) address.phone = phone;
        if (email) address.email = email;
        if (street) address.street = street;
        if (city) address.city = city;
        if (state) address.state = state;
        if (pincode) address.pincode = pincode;
        if (country) address.country = country;
        if (typeof is_default === 'boolean') address.is_default = is_default;

        address.updatedAt = new Date();
        address.updatedBy = user.user_email;

        await address.save();

        // Invalidate addresses cache
        await cacheDeletePattern('getAddresses:*');
        await cacheDeletePattern('getAddressById:*');
        console.log('Cache DELETED: addresses related caches');

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            data: {
                address_id: address.address_id,
                user_id: address.user_id,
                full_name: address.full_name,
                phone: address.phone,
                email: address.email,
                street: address.street,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country,
                is_default: address.is_default
            }
        });

    } catch (err) {
        console.error("Update address error:", err);
        next(err);
    }
};

exports.deleteAddress = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, address_id } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find and soft delete address
        const address = await Address.findOne({ address_id, user_id });
        if (!address)
            return res.status(404).json({ success: false, message: "Address not found" });

        // Soft delete
        address.status = false;
        address.updatedAt = new Date();
        address.updatedBy = user.user_email;
        await address.save();

        // Invalidate addresses cache
        await cacheDeletePattern('getAddresses:*');
        await cacheDeletePattern('getAddressById:*');
        console.log('Cache DELETED: addresses related caches');

        res.status(200).json({
            success: true,
            message: "Address deleted successfully"
        });

    } catch (err) {
        console.error("Delete address error:", err);
        next(err);
    }
};

exports.setDefaultAddress = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, address_id } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find address
        const address = await Address.findOne({ address_id, user_id });
        if (!address)
            return res.status(404).json({ success: false, message: "Address not found" });

        // Remove default from all other addresses
        await Address.updateMany(
            { user_id, address_id: { $ne: address_id } },
            { is_default: false }
        );

        // Set this as default
        address.is_default = true;
        address.updatedAt = new Date();
        address.updatedBy = user.user_email;
        await address.save();

        // Invalidate addresses cache
        await cacheDeletePattern('getAddresses:*');
        await cacheDeletePattern('getAddressById:*');
        console.log('Cache DELETED: addresses related caches');

        res.status(200).json({
            success: true,
            message: "Default address set successfully",
            data: {
                address_id: address.address_id,
                is_default: address.is_default
            }
        });

    } catch (err) {
        console.error("Set default address error:", err);
        next(err);
    }
};
