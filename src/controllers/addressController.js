// src/controllers/addressController.js
// Controlador para gestión de direcciones del cliente

const Address = require('../models/Address');
const { validationResult } = require('express-validator');

// GET /api/addresses - Listar direcciones del cliente
exports.getMyAddresses = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
        
        res.status(200).json({
            data: addresses,
            total: addresses.length
        });
        
    } catch (error) {
        console.error('Error obteniendo direcciones:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/addresses/:id - Obtener dirección por ID
exports.getAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        const address = await Address.findOne({ _id: id, user: userId });
        
        if (!address) {
            return res.status(404).json({ message: 'Dirección no encontrada' });
        }
        
        res.status(200).json(address);
        
    } catch (error) {
        console.error('Error obteniendo dirección:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// POST /api/addresses - Crear dirección
exports.createAddress = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { label, street, sector, city, reference, isDefault } = req.body;
        const userId = req.user._id;
        
        // Si es la primera dirección, establecer como predeterminada
        const addressCount = await Address.countDocuments({ user: userId });
        const setAsDefault = isDefault === true || isDefault === 'true' || addressCount === 0;
        
        // Si se establece como predeterminada, quitar predeterminado de otras
        if (setAsDefault) {
            await Address.updateMany({ user: userId }, { isDefault: false });
        }
        
        const address = new Address({
            user: userId,
            label,
            street,
            sector,
            city,
            reference: reference || '',
            isDefault: setAsDefault
        });
        
        await address.save();
        
        res.status(201).json({
            message: 'Dirección creada exitosamente',
            address
        });
        
    } catch (error) {
        console.error('Error creando dirección:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// PUT /api/addresses/:id - Actualizar dirección
exports.updateAddress = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { id } = req.params;
        const { label, street, sector, city, reference, isDefault } = req.body;
        const userId = req.user._id;
        
        const address = await Address.findOne({ _id: id, user: userId });
        
        if (!address) {
            return res.status(404).json({ message: 'Dirección no encontrada' });
        }
        
        // Actualizar campos
        address.label = label;
        address.street = street;
        address.sector = sector;
        address.city = city;
        address.reference = reference || '';
        
        // Manejar predeterminada
        if (isDefault === true || isDefault === 'true') {
            await Address.updateMany({ user: userId }, { isDefault: false });
            address.isDefault = true;
        }
        
        await address.save();
        
        res.status(200).json({
            message: 'Dirección actualizada exitosamente',
            address
        });
        
    } catch (error) {
        console.error('Error actualizando dirección:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// DELETE /api/addresses/:id - Eliminar dirección
exports.deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        const address = await Address.findOne({ _id: id, user: userId });
        
        if (!address) {
            return res.status(404).json({ message: 'Dirección no encontrada' });
        }
        
        const wasDefault = address.isDefault;
        
        await Address.deleteOne({ _id: id, user: userId });
        
        // Si era la predeterminada, establecer otra como predeterminada
        if (wasDefault) {
            const firstAddress = await Address.findOne({ user: userId }).sort({ createdAt: 1 });
            if (firstAddress) {
                firstAddress.isDefault = true;
                await firstAddress.save();
            }
        }
        
        res.status(200).json({ message: 'Dirección eliminada exitosamente' });
        
    } catch (error) {
        console.error('Error eliminando dirección:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// PATCH /api/addresses/:id/default - Establecer como predeterminada
exports.setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        const address = await Address.findOne({ _id: id, user: userId });
        
        if (!address) {
            return res.status(404).json({ message: 'Dirección no encontrada' });
        }
        
        await Address.updateMany({ user: userId }, { isDefault: false });
        
        address.isDefault = true;
        await address.save();
        
        res.status(200).json({ message: 'Dirección establecida como predeterminada' });
        
    } catch (error) {
        console.error('Error estableciendo predeterminada:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};