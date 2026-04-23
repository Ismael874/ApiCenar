// src/controllers/commerceController.js
// Controlador para funcionalidades de comercio

const Commerce = require('../models/Commerce');
const User = require('../models/User');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

// GET /api/commerce/:commerceId/catalog - Catálogo de productos agrupado por categorías
exports.getCommerceCatalog = async (req, res) => {
    try {
        const { commerceId } = req.params;
        
        const commerce = await Commerce.findById(commerceId)
            .populate('commerceType', 'name icon');
        
        if (!commerce || !commerce.isActive) {
            return res.status(404).json({ message: 'Comercio no encontrado o inactivo' });
        }
        
        // Obtener productos activos del comercio agrupados por categoría
        const products = await Product.find({ 
            commerce: commerceId, 
            isActive: true,
            isAvailable: true 
        }).populate('category', 'name');
        
        // Agrupar por categoría
        const catalog = {};
        products.forEach(product => {
            const categoryName = product.category.name;
            if (!catalog[categoryName]) {
                catalog[categoryName] = {
                    categoryId: product.category._id,
                    categoryName: categoryName,
                    products: []
                };
            }
            catalog[categoryName].products.push({
                id: product._id,
                name: product.name,
                description: product.description,
                price: product.price,
                image: product.image
            });
        });
        
        // Verificar si es favorito del cliente
        let isFavorite = false;
        if (req.user && req.user.role === 'Client') {
            const favorite = await Favorite.findOne({ 
                user: req.user._id, 
                commerce: commerceId 
            });
            isFavorite = !!favorite;
        }
        
        res.status(200).json({
            commerce: {
                id: commerce._id,
                name: commerce.name,
                description: commerce.description,
                logo: commerce.logo,
                phone: commerce.phone,
                openingTime: commerce.openingTime,
                closingTime: commerce.closingTime,
                commerceType: commerce.commerceType,
                rating: commerce.rating,
                isFavorite
            },
            catalog: Object.values(catalog)
        });
        
    } catch (error) {
        console.error('Error obteniendo catálogo:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/commerce - Listar comercios (con filtros)
exports.getCommerces = async (req, res) => {
    try {
        const { 
            page = 1, 
            pageSize = 10, 
            commerceTypeId, 
            search,
            sortBy = 'name',
            sortDirection = 'asc'
        } = req.query;
        
        const query = { isActive: true };
        
        if (commerceTypeId) {
            query.commerceType = commerceTypeId;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const sort = {};
        sort[sortBy] = sortDirection === 'desc' ? -1 : 1;
        
        const commerces = await Commerce.find(query)
            .populate('commerceType', 'name icon')
            .sort(sort)
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        const total = await Commerce.countDocuments(query);
        
        // Marcar favoritos si el usuario es cliente
        let favoriteIds = [];
        if (req.user && req.user.role === 'Client') {
            const favorites = await Favorite.find({ user: req.user._id });
            favoriteIds = favorites.map(f => f.commerce.toString());
        }
        
        const formattedCommerces = commerces.map(commerce => ({
            id: commerce._id,
            name: commerce.name,
            description: commerce.description,
            logo: commerce.logo,
            openingTime: commerce.openingTime,
            closingTime: commerce.closingTime,
            commerceType: commerce.commerceType,
            rating: commerce.rating,
            isFavorite: favoriteIds.includes(commerce._id.toString())
        }));
        
        res.status(200).json({
            data: formattedCommerces,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
        
    } catch (error) {
        console.error('Error listando comercios:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/commerce/:id/order-detail - Detalle de pedido para comercio
exports.getCommerceOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const order = await Order.findOne({ _id: id, commerce: commerce._id })
            .populate('client', 'firstName lastName phone email')
            .populate('delivery', 'firstName lastName phone');
        
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        
        // Verificar si hay deliveries disponibles
        let availableDeliveries = 0;
        if (order.status === 'Pending') {
            availableDeliveries = await User.countDocuments({
                role: 'Delivery',
                isActive: true,
                isAvailable: true
            });
        }
        
        res.status(200).json({
            id: order._id,
            client: {
                name: `${order.client.firstName} ${order.client.lastName}`,
                phone: order.client.phone,
                email: order.client.email
            },
            delivery: order.delivery ? {
                name: `${order.delivery.firstName} ${order.delivery.lastName}`,
                phone: order.delivery.phone
            } : null,
            address: order.addressSnapshot,
            items: order.items,
            subtotal: order.subtotal,
            itbisAmount: order.itbisAmount,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
            canAssignDelivery: order.status === 'Pending' && availableDeliveries > 0,
            availableDeliveries
        });
        
    } catch (error) {
        console.error('Error obteniendo detalle de pedido:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};