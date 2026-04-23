// src/controllers/adminController.js
// Controlador para funcionalidades de administrador

const User = require('../models/User');
const Commerce = require('../models/Commerce');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// GET /api/admin/dashboard - Métricas del dashboard
exports.getDashboardMetrics = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const totalOrders = await Order.countDocuments();
        const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
        
        const activeCommerces = await Commerce.countDocuments({ isActive: true });
        const inactiveCommerces = await Commerce.countDocuments({ isActive: false });
        
        const activeClients = await User.countDocuments({ role: 'Client', isActive: true });
        const inactiveClients = await User.countDocuments({ role: 'Client', isActive: false });
        
        const activeDeliveries = await User.countDocuments({ role: 'Delivery', isActive: true });
        const inactiveDeliveries = await User.countDocuments({ role: 'Delivery', isActive: false });
        
        const totalProducts = await Product.countDocuments();
        
        res.status(200).json({
            orders: { total: totalOrders, today: todayOrders },
            commerce: { active: activeCommerces, inactive: inactiveCommerces },
            clients: { active: activeClients, inactive: inactiveClients },
            deliveries: { active: activeDeliveries, inactive: inactiveDeliveries },
            products: { total: totalProducts }
        });
    } catch (error) {
        console.error('Error obteniendo métricas:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/admin/users/clients - Listar clientes
exports.getClients = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, search, isActive } = req.query;
        const query = { role: 'Client' };
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        const clients = await User.find(query).select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        const clientsWithOrders = await Promise.all(clients.map(async (client) => {
            const orderCount = await Order.countDocuments({ client: client._id });
            return { ...client.toObject(), orderCount };
        }));
        
        const total = await User.countDocuments(query);
        res.status(200).json({
            data: clientsWithOrders,
            pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) }
        });
    } catch (error) {
        console.error('Error listando clientes:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/admin/users/deliveries - Listar deliveries
exports.getDeliveries = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, search, isActive } = req.query;
        const query = { role: 'Delivery' };
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        const deliveries = await User.find(query).select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        const deliveriesWithStats = await Promise.all(deliveries.map(async (delivery) => {
            const completedOrders = await Order.countDocuments({ delivery: delivery._id, status: 'Completed' });
            return { ...delivery.toObject(), completedOrders };
        }));
        
        const total = await User.countDocuments(query);
        res.status(200).json({
            data: deliveriesWithStats,
            pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) }
        });
    } catch (error) {
        console.error('Error listando deliveries:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/admin/users/commerces - Listar comercios
exports.getCommerces = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, search, isActive } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        const commerces = await Commerce.find(query)
            .populate('user', 'email')
            .populate('commerceType', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        const commercesWithStats = await Promise.all(commerces.map(async (commerce) => {
            const orderCount = await Order.countDocuments({ commerce: commerce._id });
            return { ...commerce.toObject(), orderCount };
        }));
        
        const total = await Commerce.countDocuments(query);
        res.status(200).json({
            data: commercesWithStats,
            pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) }
        });
    } catch (error) {
        console.error('Error listando comercios:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/admin/users/admins - Listar administradores
exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'Admin' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ data: admins });
    } catch (error) {
        console.error('Error listando admins:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// PATCH /api/admin/users/:id/status - Activar/inactivar usuario
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const adminUser = req.user;
        
        if (adminUser._id.toString() === id) {
            return res.status(400).json({ message: 'No puedes cambiar tu propio estado' });
        }
        
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        
        if (user.isDefaultAdmin) {
            return res.status(403).json({ message: 'El administrador por defecto no puede ser modificado' });
        }
        
        user.isActive = isActive;
        await user.save();
        
        if (user.role === 'Commerce' && user.commerceId) {
            await Commerce.findByIdAndUpdate(user.commerceId, { isActive });
        }
        
        res.status(200).json({ message: `Usuario ${isActive ? 'activado' : 'inactivado'} exitosamente` });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// POST /api/admin/users/admins - Crear administrador
exports.createAdmin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        
        const { firstName, lastName, userName, email, password, phone } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { userName: userName.toLowerCase() }] });
        if (existingUser) return res.status(409).json({ message: 'El correo o nombre de usuario ya están registrados' });
        
        const admin = new User({
            firstName, lastName,
            userName: userName.toLowerCase(),
            email: email.toLowerCase(),
            password: await bcrypt.hash(password, 10),
            phone, role: 'Admin', isActive: true, isDefaultAdmin: false
        });
        await admin.save();
        
        res.status(201).json({ message: 'Administrador creado exitosamente', admin: { id: admin._id, firstName, lastName, email } });
    } catch (error) {
        console.error('Error creando administrador:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};