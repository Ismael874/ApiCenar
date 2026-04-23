// src/routes/configurationRoutes.js
// Rutas para gestión de configuraciones

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const configurationController = require('../controllers/configurationController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// Ruta pública para obtener ITBIS
router.get('/itbis/current', configurationController.getCurrentItbis);

// Rutas protegidas para admin
router.use(authenticateToken);
router.use(authorize('Admin'));

// GET /api/configurations - Listar configuraciones
router.get('/', configurationController.getConfigurations);

// GET /api/configurations/:key - Obtener configuración
router.get('/:key', configurationController.getConfigurationByKey);

// PUT /api/configurations/:key - Actualizar configuración
router.put('/:key', 
    body('value').notEmpty().withMessage('El valor es requerido'),
    configurationController.updateConfiguration
);

module.exports = router;