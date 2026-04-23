// src/controllers/orderController.js
// Controlador de pedidos - CRUD y operaciones de negocio

const Order = require('../models/Order');
const Product = require('../models/Product');
const Commerce = require('../models/Commerce');
const Address = require('../models/Address');
const User = require('../models/User');
const Configuration = require('../models/Configuration');
const { validationResult } = require('express-validator');

// ============================================
// CLIENT: Crear pedido
// POST /api/orders
// ============================================
exports.createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { addressId, items } = req.body;
        const clientId = req.user._id;
        
        // Validar que haya items
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El pedido debe tener al menos un producto' });
        }
        
        // Verificar dirección
        const address = await Address.findOne({ _id: addressId, user: clientId });
        if (!address) {
            return res.status(400).json({ message: 'Dirección no válida' });
        }
        
        // Obtener productos y verificar que todos sean del mismo comercio
        const productIds = items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } })
            .populate('commerce');
        
        if (products.length !== items.length) {
            return res.status(400).json({ message: 'Algunos productos no existen' });
        }
        
        // Verificar que todos los productos sean del mismo comercio
        const commerceId = products[0].commerce._id;
        const allSameCommerce = products.every(p => p.commerce._id.toString() === commerceId.toString());
        
        if (!allSameCommerce) {
            return res.status(400).json({ 
                message: 'Todos los productos deben ser del mismo comercio' 
            });
        }
        
        // Verificar que el comercio esté activo
        const commerce = await Commerce.findById(commerceId);
        if (!commerce || !commerce.isActive) {
            return res.status(400).json({ message: 'El comercio no está disponible' });
        }
        
        // Obtener ITBIS de configuración
        const itbisConfig = await Configuration.findOne({ key: 'ITBIS' });
        const itbisPercentage = itbisConfig ? parseFloat(itbisConfig.value) : 18;
        
        // Construir items del pedido
        const orderItems = items.map(item => {
            const product = products.find(p => p._id.toString() === item.productId);
            return {
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.image
            };
        });
        
        // Crear pedido
        const order = new Order({
            client: clientId,
            commerce: commerceId,
            address: addressId,
            addressSnapshot: {
                label: address.label,
                street: address.street,
                sector: address.sector,
                city: address.city,
                reference: address.reference
            },
            items: orderItems,
            itbisPercentage: itbisPercentage,
            status: 'Pending'
        });
        
        await order.save();
        
        // Incrementar contador de pedidos del comercio
        commerce.totalOrders += 1;
        await commerce.save();
        
        res.status(201).json({
            message: 'Pedido creado exitosamente',
            order: {
                id: order._id,
                subtotal: order.subtotal,
                itbisPercentage: order.itbisPercentage,
                itbisAmount: order.itbisAmount,
                total: order.total,
                status: order.status,
                createdAt: order.createdAt
            }
        });
        
    } catch (error) {
        console.error('Error creando pedido:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// CLIENT: Obtener mis pedidos
// GET /api/orders/my-orders
// ============================================
exports.getMyOrders = async (req, res) => {
    try {
        const clientId = req.user._id;
        const { page = 1, pageSize = 10, status } = req.query;
        
        const query = { client: clientId };
        if (status) query.status = status;
        
        const orders = await Order.find(query)
            .populate('commerce', 'name logo')
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        const total = await Order.countDocuments(query);
        
        const formattedOrders = orders.map(order => ({
            id: order._id,
            commerce: {
                id: order.commerce._id,
                name: order.commerce.name,
                logo: order.commerce.logo
            },
            status: order.status,
            total: order.total,
            itemsCount: order.items.length,
            createdAt: order.createdAt
        }));
        
        res.status(200).json({
            data: formattedOrders,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// CLIENT: Obtener detalle de mi pedido
// GET /api/orders/my-orders/:id
// ============================================
exports.getMyOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.user._id;
        
        const order = await Order.findOne({ _id: id, client: clientId })
            .populate('commerce', 'name logo phone')
            .populate('delivery', 'firstName lastName phone');
        
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        
        res.status(200).json({
            id: order._id,
            commerce: {
                id: order.commerce._id,
                name: order.commerce.name,
                logo: order.commerce.logo,
                phone: order.commerce.phone
            },
            delivery: order.delivery ? {
                id: order.delivery._id,
                name: `${order.delivery.firstName} ${order.delivery.lastName}`,
                phone: order.delivery.phone
            } : null,
            address: order.addressSnapshot,
            items: order.items,
            subtotal: order.subtotal,
            itbisPercentage: order.itbisPercentage,
            itbisAmount: order.itbisAmount,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
            assignedAt: order.assignedAt,
            completedAt: order.completedAt
        });
        
    } catch (error) {
        console.error('Error obteniendo detalle de pedido:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// COMMERCE: Obtener pedidos del comercio
// GET /api/orders/commerce
// ============================================
exports.getCommerceOrders = async (req, res) => {
    try {
        const user = req.user;
        const commerce = await Commerce.findOne({ user: user._id });
        
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const { page = 1, pageSize = 10, status } = req.query;
        
        const query = { commerce: commerce._id };
        if (status) query.status = status;
        
        const orders = await Order.find(query)
            .populate('client', 'firstName lastName phone')
            .populate('delivery', 'firstName lastName phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        const total = await Order.countDocuments(query);
        
        const formattedOrders = orders.map(order => ({
            id: order._id,
            client: {
                name: `${order.client.firstName} ${order.client.lastName}`,
                phone: order.client.phone
            },
            delivery: order.delivery ? {
                name: `${order.delivery.firstName} ${order.delivery.lastName}`,
                phone: order.delivery.phone
            } : null,
            status: order.status,
            total: order.total,
            itemsCount: order.items.length,
            createdAt: order.createdAt
        }));
        
        res.status(200).json({
            data: formattedOrders,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo pedidos del comercio:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// COMMERCE: Obtener detalle de pedido del comercio
// GET /api/orders/commerce/:id
// ============================================
exports.getCommerceOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        // Verificar que el comercio existe
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        // Buscar el pedido que pertenece a este comercio
        const order = await Order.findOne({ _id: id, commerce: commerce._id })
            .populate('client', 'firstName lastName phone email')
            .populate('delivery', 'firstName lastName phone');
        
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        
        // Verificar si hay deliveries disponibles para asignar
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
                id: order.client._id,
                name: `${order.client.firstName} ${order.client.lastName}`,
                phone: order.client.phone,
                email: order.client.email
            },
            delivery: order.delivery ? {
                id: order.delivery._id,
                name: `${order.delivery.firstName} ${order.delivery.lastName}`,
                phone: order.delivery.phone
            } : null,
            address: order.addressSnapshot,
            items: order.items,
            subtotal: order.subtotal,
            itbisAmount: order.itbisAmount,
            itbisPercentage: order.itbisPercentage,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
            assignedAt: order.assignedAt,
            completedAt: order.completedAt,
            canAssignDelivery: order.status === 'Pending' && availableDeliveries > 0,
            availableDeliveries
        });
        
    } catch (error) {
        console.error('Error obteniendo detalle de pedido del comercio:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// COMMERCE: Asignar delivery automáticamente
// PATCH /api/orders/:id/assign-delivery
// ============================================
exports.assignDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        // Verificar que el comercio sea dueño del pedido
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const order = await Order.findOne({ _id: id, commerce: commerce._id });
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        
        // Verificar estado
        if (order.status !== 'Pending') {
            return res.status(400).json({ message: 'Solo se pueden asignar deliveries a pedidos pendientes' });
        }
        
        // Buscar delivery disponible
        const availableDelivery = await User.findOne({
            role: 'Delivery',
            isActive: true,
            isAvailable: true
        }).sort({ createdAt: 1 });
        
        if (!availableDelivery) {
            return res.status(409).json({ message: 'No hay deliveries disponibles en este momento' });
        }
        
        // Asignar delivery
        await order.assignDelivery(availableDelivery._id);
        
        res.status(200).json({
            message: 'Delivery asignado exitosamente',
            order: {
                id: order._id,
                status: order.status,
                delivery: {
                    id: availableDelivery._id,
                    name: `${availableDelivery.firstName} ${availableDelivery.lastName}`
                }
            }
        });
        
    } catch (error) {
        console.error('Error asignando delivery:', error);
        res.status(500).json({ message: error.message || 'Error del servidor' });
    }
};

// ============================================
// DELIVERY: Obtener pedidos asignados
// GET /api/orders/delivery
// ============================================
exports.getDeliveryOrders = async (req, res) => {
    try {
        const deliveryId = req.user._id;
        const { page = 1, pageSize = 10, status } = req.query;
        
        const query = { delivery: deliveryId };
        if (status) query.status = status;
        
        const orders = await Order.find(query)
            .populate('commerce', 'name logo phone')
            .populate('client', 'firstName lastName phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        const total = await Order.countDocuments(query);
        
        const formattedOrders = orders.map(order => ({
            id: order._id,
            commerce: {
                id: order.commerce._id,
                name: order.commerce.name,
                logo: order.commerce.logo,
                phone: order.commerce.phone
            },
            client: {
                name: `${order.client.firstName} ${order.client.lastName}`,
                phone: order.client.phone
            },
            status: order.status,
            total: order.total,
            itemsCount: order.items.length,
            createdAt: order.createdAt,
            // Mostrar dirección solo si está en proceso
            address: order.status === 'InProgress' ? order.addressSnapshot : null
        }));
        
        res.status(200).json({
            data: formattedOrders,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
        
    } catch ( error) {
        console.error('Error obteniendo pedidos del delivery:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// DELIVERY: Obtener detalle de pedido asignado
// GET /api/orders/delivery/:id
// ============================================
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
                id: order.commerce._id,
                name: order.commerce.name,
                logo: order.commerce.logo,
                phone: order.commerce.phone
            },
            client: {
                id: order.client._id,
                name: `${order.client.firstName} ${order.client.lastName}`,
                phone: order.client.phone
            },
            items: order.items,
            subtotal: order.subtotal,
            itbisAmount: order.itbisAmount,
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
        console.error('Error obteniendo detalle de pedido del delivery:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// DELIVERY: Completar pedido
// PATCH /api/orders/:id/complete
// ============================================
exports.completeOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const deliveryId = req.user._id;
        
        const order = await Order.findOne({ _id: id, delivery: deliveryId });
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        
        if (order.status !== 'InProgress') {
            return res.status(400).json({ message: 'Solo se pueden completar pedidos en proceso' });
        }
        
        await order.complete();
        
        res.status(200).json({
            message: 'Pedido completado exitosamente',
            order: {
                id: order._id,
                status: order.status,
                completedAt: order.completedAt
            }
        });
        
    } catch (error) {
        console.error('Error completando pedido:', error);
        res.status(500).json({ message: error.message || 'Error del servidor' });
    }
};