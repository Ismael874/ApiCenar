// src/middlewares/auth.js
// Asegúrate de que este archivo exista y exporte authenticateToken

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para verificar token JWT en peticiones API
 */
exports.authenticateToken = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Acceso denegado. Token no proporcionado.' 
            });
        }
        
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuario
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ 
                message: 'Token inválido. Usuario no encontrado.' 
            });
        }
        
        // Verificar que el usuario esté activo
        if (!user.isActive) {
            return res.status(401).json({ 
                message: 'Cuenta inactiva. Contacta al administrador.' 
            });
        }
        
        // Adjuntar usuario a la request
        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        console.error('Error en autenticación:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

/**
 * Middleware para autorización por roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Acceso denegado. No tienes permisos para esta acción.' 
            });
        }
        
        next();
    };
};

/**
 * Middleware para adjuntar usuario a res.locals (vistas)
 */
exports.attachUser = async (req, res, next) => {
    res.locals.user = null;
    
    try {
        // Verificar si hay sesión activa
        if (req.session && req.session.user) {
            const user = await User.findById(req.session.user.id).select('-password');
            if (user && user.isActive) {
                res.locals.user = user;
                req.user = user;
            }
        }
        
        // También verificar token en header para API
        const authHeader = req.headers.authorization;
        if (authHeader && !req.user) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');
                if (user && user.isActive) {
                    res.locals.user = user;
                    req.user = user;
                }
            } catch (err) {
                // Token inválido, ignorar
            }
        }
        
        next();
    } catch (error) {
        console.error('Error en attachUser:', error);
        next();
    }
};