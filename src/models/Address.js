// src/models/Address.js
// Direcciones de entrega de los clientes

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    label: {
        type: String,
        required: [true, 'La etiqueta es requerida'],
        trim: true
    },
    street: {
        type: String,
        required: [true, 'La calle es requerida'],
        trim: true
    },
    sector: {
        type: String,
        required: [true, 'El sector es requerido'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'La ciudad es requerida'],
        trim: true
    },
    reference: {
        type: String,
        default: '',
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;