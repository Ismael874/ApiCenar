// src/models/Configuration.js
// Configuraciones del sistema (ITBIS, etc.)

const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    value: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'json'],
        default: 'string'
    }
}, {
    timestamps: true
});

// Método para obtener valor tipado
configurationSchema.methods.getTypedValue = function() {
    switch (this.type) {
        case 'number':
            return parseFloat(this.value);
        case 'boolean':
            return this.value === 'true';
        case 'json':
            return JSON.parse(this.value);
        default:
            return this.value;
    }
};

const Configuration = mongoose.model('Configuration', configurationSchema);

module.exports = Configuration;