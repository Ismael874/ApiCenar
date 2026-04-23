// src/controllers/deliveryController.js
// Controlador para funcionalidades de delivery

const User = require('../models/User');
const Order = require('../models/Order');

// GET /api/delivery/orders/:id - Detalle de pedido para delivery
exports.getDeliveryOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const deliveryId = req.user._id;
        
        const order = await Order.findOne({ _id: id, delivery: deliveryId })
            .populate('commerce', 'name logo phone openingTime closingTime')
            .populate('client', 'firstName lastName phone');
        
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        
        // Construir respuesta
        const response = {
            id: order._id,
            commerce: {
                name: order.commerce.name,
                logo: order.commerce.logo,
                phone: order.commerce.phone
            },
            client: {
                name: `${order.client.firstName} ${order.client.lastName}`,
                phone: order.client.phone
            },
            items: order.items,
            subtotal: order.subtotal,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
            assignedAt: order.assignedAt
        };
        
        // Incluir dirección solo si está en proceso
        if (order.status === 'InProgress') {
            response.address = order.addressSnapshot;
        }
        
        // Incluir fecha de completado si está completado
        if (order.status === 'Completed') {
            response.completedAt = order.completedAt;
        }
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error obteniendo detalle de pedido:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/delivery/profile - Obtener perfil del delivery
exports.getDeliveryProfile = async (req, res) => {
    try {
        const user = req.user;
        
        // Estadísticas del delivery
        const completedOrders = await Order.countDocuments({ 
            delivery: user._id, 
            status: 'Completed' 
        });
        
        const inProgressOrders = await Order.countDocuments({ 
            delivery: user._id, 
            status: 'InProgress' 
        });
        
        res.status(200).json({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
            isAvailable: user.isAvailable,
            stats: {
                completedOrders,
                inProgressOrders,
                totalOrders: completedOrders + inProgressOrders
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};