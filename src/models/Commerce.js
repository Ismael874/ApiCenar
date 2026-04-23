// src/models/Commerce.js
// Modelo para comercios (restaurantes, tiendas, etc.)

const mongoose = require('mongoose');

const commerceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'El nombre del comercio es requerido'],
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'El teléfono es requerido']
    },
    openingTime: {
        type: String,
        required: [true, 'La hora de apertura es requerida']
    },
    closingTime: {
        type: String,
        required: [true, 'La hora de cierre es requerida']
    },
    commerceType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommerceType',
        required: true
    },
    logo: {
        type: String,
        default: '/uploads/logos/default-logo.png'
    },
    isActive: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalOrders: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Índice para búsquedas por nombre
commerceSchema.index({ name: 'text', description: 'text' });

const Commerce = mongoose.model('Commerce', commerceSchema);

module.exports = Commerce;