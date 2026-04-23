// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { uploadProfile, uploadLogo } = require('../middlewares/upload');

const loginValidation = [
    body('userNameOrEmail').notEmpty().withMessage('Usuario o correo requerido'),
    body('password').notEmpty().withMessage('Contraseña requerida')
];

const passwordValidation = [
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
    body('confirmPassword').custom((val, { req }) => val === req.body.password).withMessage('No coinciden')
];

const registerValidation = [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('userName').isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').notEmpty(),
    ...passwordValidation
];

// Públicas
router.post('/login', loginValidation, authController.login);
router.post('/register-client', uploadProfile.single('profileImage'), [...registerValidation, body('role').isIn(['Client', 'Delivery'])], authController.registerClient);
router.post('/register-commerce', uploadLogo.single('logo'), [
    body('userName').isLength({ min: 3 }), body('email').isEmail().normalizeEmail(),
    body('name').notEmpty(), body('phone').notEmpty(), body('openingTime').notEmpty(),
    body('closingTime').notEmpty(), body('commerceTypeId').notEmpty(), ...passwordValidation
], authController.registerCommerce);
router.post('/confirm-email', body('token').notEmpty(), authController.confirmEmail);
router.post('/forgot-password', body('userNameOrEmail').notEmpty(), authController.forgotPassword);
router.post('/reset-password', [body('token').notEmpty(), ...passwordValidation], authController.resetPassword);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;