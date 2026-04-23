// src/routes/orderRoutes.js
// Rutas para gestión de pedidos

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// Validaciones para crear pedido
const createOrderValidation = [
    body('addressId').notEmpty().withMessage('La dirección es requerida'),
    body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
    body('items.*.productId').notEmpty().withMessage('ID de producto requerido'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0')
];

// ============================================
// RUTAS PARA CLIENTE
// ============================================

// POST /api/orders - Crear pedido
router.post('/',
    authenticateToken,
    authorize('Client'),
    createOrderValidation,
    orderController.createOrder
);

// GET /api/orders/my-orders - Listar mis pedidos
router.get('/my-orders',
    authenticateToken,
    authorize('Client'),
    orderController.getMyOrders
);

// GET /api/orders/my-orders/:id - Detalle de mi pedido
router.get('/my-orders/:id',
    authenticateToken,
    authorize('Client'),
    orderController.getMyOrderDetail
);

// ============================================
// RUTAS PARA COMERCIO
// ============================================

// GET /api/orders/commerce - Listar pedidos del comercio
router.get('/commerce',
    authenticateToken,
    authorize('Commerce'),
    orderController.getCommerceOrders
);

// GET /api/orders/commerce/:id - Detalle de pedido del comercio
router.get('/commerce/:id',
    authenticateToken,
    authorize('Commerce'),
    orderController.getCommerceOrderDetail
);

// PATCH /api/orders/:id/assign-delivery - Asignar delivery
router.patch('/:id/assign-delivery',
    authenticateToken,
    authorize('Commerce'),
    orderController.assignDelivery
);

// ============================================
// RUTAS PARA DELIVERY
// ============================================

// GET /api/orders/delivery - Listar pedidos asignados
router.get('/delivery',
    authenticateToken,
    authorize('Delivery'),
    orderController.getDeliveryOrders
);

// GET /api/orders/delivery/:id - Detalle de pedido asignado
router.get('/delivery/:id',
    authenticateToken,
    authorize('Delivery'),
    orderController.getDeliveryOrderDetail
);

// PATCH /api/orders/:id/complete - Completar pedido
router.patch('/:id/complete',
    authenticateToken,
    authorize('Delivery'),
    orderController.completeOrder
);

module.exports = router;