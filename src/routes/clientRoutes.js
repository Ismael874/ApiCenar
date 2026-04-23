// src/routes/clientRoutes.js
// Rutas para funcionalidades del cliente

const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middlewares/auth');

// Re-exportar rutas de commerce-types y commerce para clientes
const commerceRoutes = require('./commerceRoutes');

// Usar las mismas rutas
router.use('/', commerceRoutes);

module.exports = router;