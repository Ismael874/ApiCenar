// src/controllers/accountController.js
// Controlador para gestión de cuenta de usuario

const User = require('../models/User');
const Commerce = require('../models/Commerce');

// GET /api/account/me - Perfil del usuario autenticado
exports.getProfile = async (req, res) => {
    try {
        const user = req.user;
        
        const profile = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            userName: user.userName,
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
            role: user.role,
            isActive: user.isActive
        };
        
        // Si es Commerce, incluir datos del comercio
        if (user.role === 'Commerce' && user.commerceId) {
            const commerce = await Commerce.findById(user.commerceId)
                .populate('commerceType', 'name');
            
            if (commerce) {
                profile.commerce = {
                    id: commerce._id,
                    name: commerce.name,
                    description: commerce.description,
                    phone: commerce.phone,
                    openingTime: commerce.openingTime,
                    closingTime: commerce.closingTime,
                    logo: commerce.logo,
                    commerceType: commerce.commerceType,
                    isActive: commerce.isActive
                };
            }
        }
        
        // Si es Delivery, incluir disponibilidad
        if (user.role === 'Delivery') {
            profile.isAvailable = user.isAvailable;
        }
        
        res.status(200).json(profile);
        
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// PATCH /api/account/me - Actualizar perfil
exports.updateProfile = async (req, res) => {
    try {
        const user = req.user;
        const { firstName, lastName, phone, openingTime, closingTime } = req.body;
        
        // Actualizar campos básicos
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;
        
        // Actualizar imagen si se proporciona
        if (req.file) {
            user.profileImage = `/uploads/profiles/${req.file.filename}`;
        }
        
        await user.save();
        
        // Si es Commerce, también actualizar datos del comercio
        if (user.role === 'Commerce' && user.commerceId) {
            const commerce = await Commerce.findById(user.commerceId);
            if (commerce) {
                if (openingTime) commerce.openingTime = openingTime;
                if (closingTime) commerce.closingTime = closingTime;
                if (phone) commerce.phone = phone;
                if (req.file) commerce.logo = user.profileImage;
                await commerce.save();
            }
        }
        
        res.status(200).json({
            message: 'Perfil actualizado exitosamente',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profileImage: user.profileImage
            }
        });
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};