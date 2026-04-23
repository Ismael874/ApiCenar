// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Intentar obtener la URI de varias formas
        let mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI;
        
        // Si no hay URI, usar la hardcodeada como último recurso (SOLO PARA LA ENTREGA)
        if (!mongoURI) {
            console.warn('⚠️  MONGODB_URI no definida en variables de entorno. Usando valor hardcodeado.');
            mongoURI = 'mongodb://admin:beljyebide@ac-qv7g5ed-shard-00-00.ccbzhlv.mongodb.net:27017,ac-qv7g5ed-shard-00-01.ccbzhlv.mongodb.net:27017,ac-qv7g5ed-shard-00-02.ccbzhlv.mongodb.net:27017/apicenar?ssl=true&replicaSet=atlas-73jevq-shard-0&authSource=admin&retryWrites=true&w=majority&appName=cluster-personas';
        }
        
        console.log('🔄 Conectando a MongoDB...');
        
        const conn = await mongoose.connect(mongoURI);
        console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
        console.log(`📁 Base de datos: ${conn.connection.name}`);
        
    } catch (error) {
        console.error(`❌ Error conectando a MongoDB: ${error.message}`);
        // No salir del proceso en producción para que Railway pueda reintentar
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;