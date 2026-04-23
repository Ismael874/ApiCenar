// src/routes/favoriteRoutes.js
// Rutas para gestión de favoritos

const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y rol Client
router.use(authenticateToken);
router.use(authorize('Client'));

// GET /api/favorites - Listar favoritos
router.get('/', favoriteController.getMyFavorites);

// POST /api/favorites - Agregar favorito
router.post('/', favoriteController.addFavorite);

// DELETE /api/favorites/:commerceId - Remover favorito
router.delete('/:commerceId', favoriteController.removeFavorite);

// GET /api/favorites/check/:commerceId - Verificar si es favorito
router.get('/check/:commerceId', favoriteController.checkFavorite);

module.exports = router;