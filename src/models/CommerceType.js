// src/models/CommerceType.js
// Tipos de comercio (Restaurante, Pizzería, etc.)

const mongoose = require('mongoose');

const commerceTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    icon: {
        type: String,
        default: '/uploads/icons/default-icon.png'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const CommerceType = mongoose.model('CommerceType', commerceTypeSchema);

module.exports = CommerceType;