// src/routes/accountRoutes.js
// Rutas para gestión de cuenta

const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticateToken } = require('../middlewares/auth');
const { uploadProfile } = require('../middlewares/upload');

// GET /api/account/me - Obtener perfil
router.get('/me',
    authenticateToken,
    accountController.getProfile
);

// PATCH /api/account/me - Actualizar perfil
// CORREGIDO: uploadProfile.single() es una función middleware, no un objeto
router.patch('/me',
    authenticateToken,
    uploadProfile.single('profileImage'),  // ← Esto es correcto
    accountController.updateProfile
);

module.exports = router;