// src/models/Favorite.js
// Comercios favoritos de los clientes

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    commerce: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commerce',
        required: true
    }
}, {
    timestamps: true
});

// Índice compuesto único para evitar duplicados
favoriteSchema.index({ user: 1, commerce: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;