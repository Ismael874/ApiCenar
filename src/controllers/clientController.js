// src/controllers/clientController.js
const CommerceType = require('../models/CommerceType');
const Commerce = require('../models/Commerce');
const Favorite = require('../models/Favorite');

exports.getCommerceTypes = async (req, res) => {
    try {
        const types = await CommerceType.find({ isActive: true }).sort('name');
        res.status(200).json({ data: types });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.getCommerces = async (req, res) => {
    try {
        const { commerceTypeId, search, page = 1, pageSize = 10 } = req.query;
        const query = { isActive: true };
        if (commerceTypeId) query.commerceType = commerceTypeId;
        if (search) query.name = { $regex: search, $options: 'i' };
        
        const commerces = await Commerce.find(query)
            .populate('commerceType', 'name')
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        const total = await Commerce.countDocuments(query);
        
        let favoriteIds = [];
        if (req.user) {
            const favorites = await Favorite.find({ user: req.user._id });
            favoriteIds = favorites.map(f => f.commerce.toString());
        }
        const formatted = commerces.map(c => ({ ...c.toObject(), isFavorite: favoriteIds.includes(c._id.toString()) }));
        res.status(200).json({ data: formatted, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};