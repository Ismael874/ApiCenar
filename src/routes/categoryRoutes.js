// src/routes/categoryRoutes.js
// Rutas para gestión de categorías

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// Validaciones
const categoryValidation = [
    body('name').notEmpty().withMessage('El nombre es requerido')
];

// Todas las rutas requieren autenticación y rol Commerce
router.use(authenticateToken);
router.use(authorize('Commerce'));

// GET /api/categories - Listar categorías
router.get('/', categoryController.getMyCategories);

// GET /api/categories/:id - Obtener categoría
router.get('/:id', categoryController.getCategoryById);

// POST /api/categories - Crear categoría
router.post('/', categoryValidation, categoryController.createCategory);

// PUT /api/categories/:id - Actualizar categoría
router.put('/:id', categoryValidation, categoryController.updateCategory);

// DELETE /api/categories/:id - Eliminar categoría
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;