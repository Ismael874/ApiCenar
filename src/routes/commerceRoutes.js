// src/routes/commerceRoutes.js
// Rutas para funcionalidades de comercio

const express = require('express');
const router = express.Router();
const commerceController = require('../controllers/commerceController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// GET /api/commerce-types - Listar tipos de comercio (cliente)
router.get('/commerce-types',
    authenticateToken,
    authorize('Client', 'Admin'),
    async (req, res) => {
        try {
            const CommerceType = require('../models/CommerceType');
            const types = await CommerceType.find({ isActive: true }).sort('name');
            res.status(200).json({ data: types });
        } catch (error) {
            res.status(500).json({ message: 'Error del servidor' });
        }
    }
);

// GET /api/commerce - Listar comercios con filtros
router.get('/commerce',
    authenticateToken,
    authorize('Client', 'Admin'),
    commerceController.getCommerces
);

// GET /api/commerce/:commerceId/catalog - Catálogo de productos
router.get('/commerce/:commerceId/catalog',
    authenticateToken,
    authorize('Client'),
    commerceController.getCommerceCatalog
);

module.exports = router;