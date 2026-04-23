// src/routes/addressRoutes.js
// Rutas para gestión de direcciones

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const addressController = require('../controllers/addressController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// Validaciones
const addressValidation = [
    body('label').notEmpty().withMessage('La etiqueta es requerida'),
    body('street').notEmpty().withMessage('La calle es requerida'),
    body('sector').notEmpty().withMessage('El sector es requerido'),
    body('city').notEmpty().withMessage('La ciudad es requerida')
];

// Todas las rutas requieren autenticación y rol Client
router.use(authenticateToken);
router.use(authorize('Client'));

// GET /api/addresses - Listar direcciones
router.get('/', addressController.getMyAddresses);

// GET /api/addresses/:id - Obtener dirección
router.get('/:id', addressController.getAddressById);

// POST /api/addresses - Crear dirección
router.post('/', addressValidation, addressController.createAddress);

// PUT /api/addresses/:id - Actualizar dirección
router.put('/:id', addressValidation, addressController.updateAddress);

// DELETE /api/addresses/:id - Eliminar dirección
router.delete('/:id', addressController.deleteAddress);

// PATCH /api/addresses/:id/default - Establecer como predeterminada
router.patch('/:id/default', addressController.setDefaultAddress);

module.exports = router;