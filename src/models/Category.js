// src/models/Category.js
// Categorías de productos por comercio

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre de la categoría es requerido'],
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    commerce: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commerce',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índice compuesto para evitar categorías duplicadas por comercio
categorySchema.index({ name: 1, commerce: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;