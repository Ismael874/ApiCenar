// src/controllers/configurationController.js
// Controlador para gestión de configuraciones del sistema

const Configuration = require('../models/Configuration');
const { validationResult } = require('express-validator');

// GET /api/configurations - Listar todas las configuraciones
exports.getConfigurations = async (req, res) => {
    try {
        const configurations = await Configuration.find().sort({ key: 1 });
        
        // Formatear valores según tipo
        const formatted = configurations.map(config => ({
            key: config.key,
            value: config.getTypedValue(),
            description: config.description,
            type: config.type
        }));
        
        res.status(200).json({ data: formatted });
        
    } catch (error) {
        console.error('Error obteniendo configuraciones:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/configurations/:key - Obtener configuración por key
exports.getConfigurationByKey = async (req, res) => {
    try {
        const { key } = req.params;
        
        const config = await Configuration.findOne({ key: key.toUpperCase() });
        
        if (!config) {
            return res.status(404).json({ message: 'Configuración no encontrada' });
        }
        
        res.status(200).json({
            key: config.key,
            value: config.getTypedValue(),
            description: config.description,
            type: config.type
        });
        
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// PUT /api/configurations/:key - Actualizar configuración
exports.updateConfiguration = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { key } = req.params;
        const { value } = req.body;
        
        const config = await Configuration.findOne({ key: key.toUpperCase() });
        
        if (!config) {
            return res.status(404).json({ message: 'Configuración no encontrada' });
        }
        
        // Validar tipo
        if (config.type === 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                return res.status(400).json({ message: 'El valor debe ser un número' });
            }
            config.value = numValue.toString();
        } else {
            config.value = value;
        }
        
        await config.save();
        
        res.status(200).json({
            message: 'Configuración actualizada exitosamente',
            config: {
                key: config.key,
                value: config.getTypedValue(),
                type: config.type
            }
        });
        
    } catch (error) {
        console.error('Error actualizando configuración:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/configurations/itbis/current - Obtener ITBIS actual (público)
exports.getCurrentItbis = async (req, res) => {
    try {
        const config = await Configuration.findOne({ key: 'ITBIS' });
        
        const itbisValue = config ? config.getTypedValue() : 18;
        
        res.status(200).json({ itbis: itbisValue });
        
    } catch (error) {
        console.error('Error obteniendo ITBIS:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};