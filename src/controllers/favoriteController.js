// src/controllers/favoriteController.js
// Controlador para gestión de favoritos

const Favorite = require('../models/Favorite');
const Commerce = require('../models/Commerce');

// GET /api/favorites - Listar favoritos del cliente
exports.getMyFavorites = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, pageSize = 10 } = req.query;
        
        const favorites = await Favorite.find({ user: userId })
            .populate({
                path: 'commerce',
                match: { isActive: true },
                populate: { path: 'commerceType', select: 'name icon' }
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        // Filtrar comercios nulos (inactivos o eliminados)
        const validFavorites = favorites.filter(f => f.commerce);
        
        const formattedFavorites = validFavorites.map(fav => ({
            id: fav._id,
            commerce: {
                id: fav.commerce._id,
                name: fav.commerce.name,
                logo: fav.commerce.logo,
                description: fav.commerce.description,
                openingTime: fav.commerce.openingTime,
                closingTime: fav.commerce.closingTime,
                commerceType: fav.commerce.commerceType,
                rating: fav.commerce.rating
            },
            createdAt: fav.createdAt
        }));
        
        const total = await Favorite.countDocuments({ user: userId });
        
        res.status(200).json({
            data: formattedFavorites,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo favoritos:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// POST /api/favorites - Agregar favorito
exports.addFavorite = async (req, res) => {
    try {
        const { commerceId } = req.body;
        const userId = req.user._id;
        
        // Verificar que el comercio exista y esté activo
        const commerce = await Commerce.findOne({ _id: commerceId, isActive: true });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado o inactivo' });
        }
        
        // Verificar si ya es favorito
        const existingFavorite = await Favorite.findOne({ user: userId, commerce: commerceId });
        if (existingFavorite) {
            return res.status(409).json({ message: 'Este comercio ya está en favoritos' });
        }
        
        const favorite = new Favorite({
            user: userId,
            commerce: commerceId
        });
        
        await favorite.save();
        
        res.status(201).json({
            message: 'Comercio agregado a favoritos',
            favorite: {
                id: favorite._id,
                commerce: commerceId
            }
        });
        
    } catch (error) {
        console.error('Error agregando favorito:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// DELETE /api/favorites/:commerceId - Remover favorito
exports.removeFavorite = async (req, res) => {
    try {
        const { commerceId } = req.params;
        const userId = req.user._id;
        
        const result = await Favorite.deleteOne({ user: userId, commerce: commerceId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Favorito no encontrado' });
        }
        
        res.status(200).json({ message: 'Comercio removido de favoritos' });
        
    } catch (error) {
        console.error('Error removiendo favorito:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/favorites/check/:commerceId - Verificar si es favorito
exports.checkFavorite = async (req, res) => {
    try {
        const { commerceId } = req.params;
        const userId = req.user._id;
        
        const favorite = await Favorite.findOne({ user: userId, commerce: commerceId });
        
        res.status(200).json({ isFavorite: !!favorite });
        
    } catch (error) {
        console.error('Error verificando favorito:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};