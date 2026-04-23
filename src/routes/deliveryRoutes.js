// src/routes/deliveryRoutes.js
// Rutas para funcionalidades de delivery

const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// GET /api/delivery/profile - Perfil del delivery
router.get('/profile',
    authenticateToken,
    authorize('Delivery'),
    deliveryController.getDeliveryProfile
);

module.exports = router;