// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authenticateToken, authorize } = require('../middlewares/auth');

const createAdminValidation = [
    body('firstName').notEmpty().withMessage('El nombre es requerido'),
    body('lastName').notEmpty().withMessage('El apellido es requerido'),
    body('userName').notEmpty().withMessage('El usuario es requerido'),
    body('email').isEmail().withMessage('Correo inválido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
    body('phone').notEmpty().withMessage('El teléfono es requerido')
];

router.get('/dashboard', authenticateToken, authorize('Admin'), adminController.getDashboardMetrics);
router.get('/users/clients', authenticateToken, authorize('Admin'), adminController.getClients);
router.get('/users/deliveries', authenticateToken, authorize('Admin'), adminController.getDeliveries);
router.get('/users/commerces', authenticateToken, authorize('Admin'), adminController.getCommerces);
router.get('/users/admins', authenticateToken, authorize('Admin'), adminController.getAdmins);
router.patch('/users/:id/status', authenticateToken, authorize('Admin'), adminController.updateUserStatus);
router.post('/users/admins', authenticateToken, authorize('Admin'), createAdminValidation, adminController.createAdmin);

module.exports = router;