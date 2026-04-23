// src/models/Token.js
// Tokens para activación de cuenta y recuperación de contraseña

const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['activation', 'reset'],
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Índice para búsqueda rápida de tokens
tokenSchema.index({ token: 1, type: 1 });

// Método para verificar si el token es válido
tokenSchema.methods.isValid = function() {
    return !this.used && this.expiresAt > new Date();
};

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;