// src/routes/productRoutes.js
// Rutas para gestión de productos

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { authenticateToken, authorize } = require('../middlewares/auth');
const { uploadProduct } = require('../middlewares/upload');

// Validaciones
const productValidation = [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
    body('categoryId').notEmpty().withMessage('La categoría es requerida')
];

// Todas las rutas requieren autenticación y rol Commerce
router.use(authenticateToken);
router.use(authorize('Commerce'));

// GET /api/products - Listar productos
router.get('/', productController.getMyProducts);

// GET /api/products/:id - Obtener producto
router.get('/:id', productController.getProductById);

// POST /api/products - Crear producto
router.post('/', uploadProduct.single('image'), productValidation, productController.createProduct);

// PUT /api/products/:id - Actualizar producto
router.put('/:id', uploadProduct.single('image'), productController.updateProduct);

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', productController.deleteProduct);

module.exports = router;