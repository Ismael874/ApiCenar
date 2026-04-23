// src/config/database.js
// Configuración de conexión a MongoDB usando Mongoose
// AQUÍ PUEDES CAMBIAR LA CONFIGURACIÓN DE LA BASE DE DATOS

const mongoose = require('mongoose');

/**
 * Conecta a la base de datos MongoDB
 * La URI se toma de la variable de entorno MONGODB_URI
 * Para cambiar a otra base de datos, modifica el archivo .env
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Opciones recomendadas para Mongoose 8+
        });
        
        console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
        console.log(`📁 Base de datos: ${conn.connection.name}`);
        
        // Crear índices para optimizar búsquedas
        await createIndexes();
        
    } catch (error) {
        console.error(`❌ Error conectando a MongoDB: ${error.message}`);
        process.exit(1);
    }
};

/**
 * Crea índices para mejorar el rendimiento de las consultas
 */
async function createIndexes() {
    try {
        const User = require('../models/User');
        const Commerce = require('../models/Commerce');
        const Product = require('../models/Product');
        const Order = require('../models/Order');
        
        // Índices para búsquedas frecuentes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ userName: 1 }, { unique: true });
        await User.collection.createIndex({ role: 1 });
        
        await Commerce.collection.createIndex({ user: 1 });
        await Commerce.collection.createIndex({ commerceType: 1 });
        
        await Product.collection.createIndex({ commerce: 1 });
        await Product.collection.createIndex({ category: 1 });
        
        await Order.collection.createIndex({ client: 1 });
        await Order.collection.createIndex({ commerce: 1 });
        await Order.collection.createIndex({ delivery: 1 });
        await Order.collection.createIndex({ status: 1 });
        await Order.collection.createIndex({ createdAt: -1 });
        
        console.log('📊 Índices de base de datos verificados');
    } catch (error) {
        console.warn('⚠️ Advertencia al crear índices:', error.message);
    }
}

// Manejar eventos de conexión
mongoose.connection.on('error', (err) => {
    console.error('❌ Error de MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB desconectado');
});

// Manejar cierre graceful
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('👋 Conexión a MongoDB cerrada');
    process.exit(0);
});

module.exports = connectDB;