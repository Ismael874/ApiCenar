// src/controllers/authController.js
// Controlador de autenticación - Maneja login, registro, confirmación, recuperación

const User = require('../models/User');
const Commerce = require('../models/Commerce');
const CommerceType = require('../models/CommerceType');
const Token = require('../models/Token');
const Configuration = require('../models/Configuration');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendActivationEmail, sendPasswordResetEmail } = require('../config/mailer');
const { validationResult } = require('express-validator');

// Generar token JWT
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ============================================
// 1. LOGIN
// POST /api/auth/login
// ============================================
exports.login = async (req, res) => {
    try {
        // Validar campos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { userNameOrEmail, password } = req.body;
        console.log(`🔐 Intento de login: ${userNameOrEmail}`);
        
        // Buscar usuario por email o username
        const user = await User.findOne({
            $or: [
                { email: userNameOrEmail.toLowerCase() },
                { userName: userNameOrEmail.toLowerCase() }
            ]
        });
        
        if (!user) {
            console.log(`❌ Usuario no encontrado: ${userNameOrEmail}`);
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }
        
        console.log(`✅ Usuario encontrado: ${user.email}, activo: ${user.isActive}`);
        
        // Verificar contraseña
        const isPasswordValid = await user.comparePassword(password);
        console.log(`🔑 Contraseña válida: ${isPasswordValid}`);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }
        
        // Verificar si la cuenta está activa
        if (!user.isActive) {
            return res.status(401).json({ 
                message: 'Cuenta inactiva. Por favor confirma tu correo electrónico.' 
            });
        }
        
        // Generar token
        const token = generateToken(user);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        // Guardar token en sesión (para vistas renderizadas)
        req.session.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        };
        
        // Respuesta para API
        res.status(200).json({
            token,
            expiresAt: expiresAt.toISOString(),
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profileImage: user.profileImage
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// 2. REGISTRO DE CLIENTE/DELIVERY
// POST /api/auth/register-client
// ============================================
exports.registerClient = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { 
            firstName, lastName, userName, email, 
            password, confirmPassword, phone, role 
        } = req.body;
        
        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                message: 'Las contraseñas no coinciden' 
            });
        }
        
        // Validar rol permitido
        if (!['Client', 'Delivery'].includes(role)) {
            return res.status(400).json({ 
                message: 'Rol no válido para este registro' 
            });
        }
        
        // Verificar si el email o username ya existen
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { userName: userName.toLowerCase() }
            ]
        });
        
        if (existingUser) {
            return res.status(409).json({ 
                message: 'El correo o nombre de usuario ya están registrados' 
            });
        }
        
        // Procesar imagen de perfil si se subió
        let profileImage = '/uploads/profiles/default-profile.png';
        if (req.file) {
            profileImage = `/uploads/profiles/${req.file.filename}`;
        }
        
        // Crear usuario
        const user = new User({
            firstName,
            lastName,
            userName: userName.toLowerCase(),
            email: email.toLowerCase(),
            password,
            phone,
            profileImage,
            role,
            isActive: false,
            isAvailable: role === 'Delivery' // Delivery disponible por defecto
        });
        
        await user.save();
        
        // Generar token de activación
        const activationToken = crypto.randomBytes(32).toString('hex');
        const token = new Token({
            user: user._id,
            token: activationToken,
            type: 'activation',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
        });
        await token.save();
        
        // Enviar correo de activación
        await sendActivationEmail(user.email, user.firstName, activationToken);
        
        res.status(201).json({ 
            message: 'Usuario registrado exitosamente. Por favor revisa tu correo para activar tu cuenta.',
            userId: user._id
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// 3. REGISTRO DE COMERCIO
// POST /api/auth/register-commerce
// ============================================
exports.registerCommerce = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { 
            userName, email, password, confirmPassword,
            name, description, phone, openingTime, closingTime, commerceTypeId
        } = req.body;
        
        // Validar contraseñas
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                message: 'Las contraseñas no coinciden' 
            });
        }
        
        // Verificar si el email o username ya existen
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { userName: userName.toLowerCase() }
            ]
        });
        
        if (existingUser) {
            return res.status(409).json({ 
                message: 'El correo o nombre de usuario ya están registrados' 
            });
        }
        
        // Verificar que el tipo de comercio exista
        const commerceType = await CommerceType.findById(commerceTypeId);
        if (!commerceType) {
            return res.status(400).json({ 
                message: 'El tipo de comercio seleccionado no existe' 
            });
        }
        
        // Procesar logo
        let logo = '/uploads/logos/default-logo.png';
        if (req.file) {
            logo = `/uploads/logos/${req.file.filename}`;
        }
        
        // Crear usuario Commerce (inactivo)
        const user = new User({
            firstName: name,
            lastName: '',
            userName: userName.toLowerCase(),
            email: email.toLowerCase(),
            password,
            phone,
            profileImage: logo,
            role: 'Commerce',
            isActive: false
        });
        
        await user.save();
        
        // Crear perfil de comercio
        const commerce = new Commerce({
            user: user._id,
            name,
            description: description || '',
            phone,
            openingTime,
            closingTime,
            commerceType: commerceTypeId,
            logo,
            isActive: false
        });
        
        await commerce.save();
        
        // Actualizar usuario con referencia al comercio
        user.commerceId = commerce._id;
        await user.save();
        
        // Generar token de activación
        const activationToken = crypto.randomBytes(32).toString('hex');
        const token = new Token({
            user: user._id,
            token: activationToken,
            type: 'activation',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        await token.save();
        
        // Enviar correo de activación
        await sendActivationEmail(user.email, commerce.name, activationToken);
        
        res.status(201).json({ 
            message: 'Comercio registrado exitosamente. Por favor revisa tu correo para activar tu cuenta.',
            userId: user._id,
            commerceId: commerce._id
        });
        
    } catch (error) {
        console.error('Error en registro de comercio:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// 4. CONFIRMAR CORREO
// POST /api/auth/confirm-email
// ============================================
exports.confirmEmail = async (req, res) => {
    try {
        const { token } = req.body;
        
        // Buscar token
        const activationToken = await Token.findOne({ 
            token, 
            type: 'activation',
            used: false,
            expiresAt: { $gt: new Date() }
        });
        
        if (!activationToken) {
            return res.status(400).json({ 
                message: 'Token inválido o expirado' 
            });
        }
        
        // Activar usuario
        const user = await User.findById(activationToken.user);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        user.isActive = true;
        await user.save();
        
        // Si es comercio, activar también el perfil del comercio
        if (user.role === 'Commerce' && user.commerceId) {
            await Commerce.findByIdAndUpdate(user.commerceId, { isActive: true });
        }
        
        // Marcar token como usado
        activationToken.used = true;
        await activationToken.save();
        
        res.status(200).json({ 
            message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.' 
        });
        
    } catch (error) {
        console.error('Error en confirmación:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// 5. OLVIDÉ CONTRASEÑA
// POST /api/auth/forgot-password
// ============================================
exports.forgotPassword = async (req, res) => {
    try {
        const { userNameOrEmail } = req.body;
        
        // Buscar usuario
        const user = await User.findOne({
            $or: [
                { email: userNameOrEmail.toLowerCase() },
                { userName: userNameOrEmail.toLowerCase() }
            ]
        });
        
        // Siempre responder con éxito aunque no exista (seguridad)
        if (!user) {
            return res.status(200).json({ 
                message: 'Si el usuario existe, recibirás un correo con instrucciones.' 
            });
        }
        
        // Generar token de recuperación
        const resetToken = crypto.randomBytes(32).toString('hex');
        const token = new Token({
            user: user._id,
            token: resetToken,
            type: 'reset',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
        });
        await token.save();
        
        // Enviar correo
        await sendPasswordResetEmail(user.email, user.firstName, resetToken);
        
        res.status(200).json({ 
            message: 'Si el usuario existe, recibirás un correo con instrucciones.' 
        });
        
    } catch (error) {
        console.error('Error en forgot password:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// 6. RESETEAR CONTRASEÑA
// POST /api/auth/reset-password
// ============================================
exports.resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;
        
        // Validar contraseñas
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                message: 'Las contraseñas no coinciden' 
            });
        }
        
        // Buscar token
        const resetToken = await Token.findOne({ 
            token, 
            type: 'reset',
            used: false,
            expiresAt: { $gt: new Date() }
        });
        
        if (!resetToken) {
            return res.status(400).json({ 
                message: 'Token inválido o expirado' 
            });
        }
        
        // Actualizar contraseña
        const user = await User.findById(resetToken.user);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        user.password = password;
        await user.save();
        
        // Marcar token como usado
        resetToken.used = true;
        await resetToken.save();
        
        res.status(200).json({ 
            message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' 
        });
        
    } catch (error) {
        console.error('Error en reset password:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ============================================
// 7. CERRAR SESIÓN
// POST /api/auth/logout
// ============================================
exports.logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    });
};