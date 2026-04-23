// scripts/seed.js - ACTUALIZADO para MongoDB Atlas
// Script para poblar la base de datos con datos iniciales

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Importar modelos
const User = require('../src/models/User');
const CommerceType = require('../src/models/CommerceType');
const Configuration = require('../src/models/Configuration');
const Commerce = require('../src/models/Commerce');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Address = require('../src/models/Address');

// Datos iniciales
const commerceTypes = [
    { name: 'Restaurante', description: 'Comida preparada, platos fuertes', icon: '/uploads/icons/restaurant.png', isActive: true },
    { name: 'Pizzería', description: 'Pizzas artesanales', icon: '/uploads/icons/pizza.png', isActive: true },
    { name: 'Hamburguesería', description: 'Hamburguesas gourmet', icon: '/uploads/icons/burger.png', isActive: true },
    { name: 'Sushi Bar', description: 'Comida japonesa', icon: '/uploads/icons/sushi.png', isActive: true },
    { name: 'Cafetería', description: 'Café y postres', icon: '/uploads/icons/coffee.png', isActive: true },
    { name: 'Comida China', description: 'Arroces y fideos', icon: '/uploads/icons/chinese.png', isActive: true }
];

const configurations = [
    { key: 'ITBIS', value: '18', description: 'Porcentaje de ITBIS', type: 'number' },
    { key: 'DELIVERY_FEE', value: '50', description: 'Costo base de envío', type: 'number' }
];

async function seedDatabase() {
    try {
        // Conectar a MongoDB Atlas
        console.log('🔄 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB Atlas');
        console.log(`📁 Base de datos: ${mongoose.connection.name}`);
        
        // Limpiar colecciones (CUIDADO: Esto borra datos existentes)
        console.log('🧹 Limpiando datos existentes...');
        await CommerceType.deleteMany({});
        await Configuration.deleteMany({});
        await Address.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Commerce.deleteMany({});
        
        // NO eliminar usuarios completamente, solo los que no son default admin
        await User.deleteMany({ isDefaultAdmin: { $ne: true } });
        
        // Verificar si existe admin por defecto
        let admin = await User.findOne({ userName: process.env.DEFAULT_ADMIN_USERNAME });
        
        if (!admin) {
            console.log('👤 Creando administrador por defecto...');
            const adminPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);
            
            admin = new User({
                firstName: 'Admin',
                lastName: 'Sistema',
                userName: process.env.DEFAULT_ADMIN_USERNAME,
                email: process.env.DEFAULT_ADMIN_EMAIL,
                password: adminPassword,
                phone: '809-000-0000',
                role: 'Admin',
                isActive: true,
                isDefaultAdmin: true,
                profileImage: '/uploads/profiles/admin.png'
            });
            
            await admin.save();
            console.log('✅ Administrador por defecto creado');
        } else {
            console.log('⚠️ El administrador por defecto ya existe');
        }
        
        // Crear tipos de comercio
        console.log('🏪 Creando tipos de comercio...');
        const createdTypes = await CommerceType.insertMany(commerceTypes);
        console.log(`✅ ${createdTypes.length} tipos de comercio creados`);
        
        // Crear configuraciones
        console.log('⚙️ Creando configuraciones...');
        await Configuration.insertMany(configurations);
        console.log(`✅ Configuraciones creadas`);
        
        // Crear cliente de prueba
        console.log('👤 Creando cliente de prueba...');
        const clientPassword = await bcrypt.hash('Cliente@123', 10);
        const client = new User({
            firstName: 'Juan',
            lastName: 'Pérez',
            userName: 'cliente1',
            email: 'cliente@test.com',
            password: clientPassword,
            phone: '809-111-2222',
            role: 'Client',
            isActive: true,
            profileImage: '/uploads/profiles/default.png'
        });
        await client.save();
        
        // Crear dirección para el cliente
        const address = new Address({
            user: client._id,
            label: 'Mi Casa',
            street: 'Calle Principal #123',
            sector: 'Ensanche Naco',
            city: 'Santo Domingo',
            reference: 'Frente al parque',
            isDefault: true
        });
        await address.save();
        
        // Crear delivery de prueba
        console.log('🛵 Creando delivery de prueba...');
        const deliveryPassword = await bcrypt.hash('Delivery@123', 10);
        const delivery = new User({
            firstName: 'Carlos',
            lastName: 'Rodríguez',
            userName: 'delivery1',
            email: 'delivery@test.com',
            password: deliveryPassword,
            phone: '809-333-4444',
            role: 'Delivery',
            isActive: true,
            isAvailable: true,
            profileImage: '/uploads/profiles/default.png'
        });
        await delivery.save();
        
        // Crear comercio de prueba
        console.log('🏪 Creando comercio de prueba...');
        const commercePassword = await bcrypt.hash('Comercio@123', 10);
        const commerceUser = new User({
            firstName: 'Pizzería',
            lastName: 'Don Pepe',
            userName: 'pizzeria1',
            email: 'comercio@test.com',
            password: commercePassword,
            phone: '809-555-6666',
            role: 'Commerce',
            isActive: true,
            profileImage: '/uploads/logos/pizzeria-logo.png'
        });
        await commerceUser.save();
        
        const commerceType = createdTypes.find(t => t.name === 'Pizzería');
        
        const commerce = new Commerce({
            user: commerceUser._id,
            name: 'Pizzería Don Pepe',
            description: 'Las mejores pizzas artesanales de la ciudad',
            phone: '809-555-6666',
            openingTime: '10:00',
            closingTime: '22:00',
            commerceType: commerceType._id,
            logo: '/uploads/logos/pizzeria-logo.png',
            isActive: true,
            rating: 4.5,
            totalOrders: 0
        });
        await commerce.save();
        
        commerceUser.commerceId = commerce._id;
        await commerceUser.save();
        
        // Crear categorías para el comercio
        console.log('📁 Creando categorías...');
        const categories = await Category.insertMany([
            { name: 'Pizzas Clásicas', description: 'Pizzas tradicionales', commerce: commerce._id },
            { name: 'Pizzas Especiales', description: 'Pizzas gourmet', commerce: commerce._id },
            { name: 'Bebidas', description: 'Refrescos y bebidas', commerce: commerce._id },
            { name: 'Postres', description: 'Dulces y postres', commerce: commerce._id }
        ]);
        
        // Crear productos para el comercio
        console.log('🍕 Creando productos...');
        const pizzaCategory = categories.find(c => c.name === 'Pizzas Clásicas');
        const especialCategory = categories.find(c => c.name === 'Pizzas Especiales');
        const bebidasCategory = categories.find(c => c.name === 'Bebidas');
        
        await Product.insertMany([
            { name: 'Pizza Margherita', description: 'Salsa de tomate, mozzarella, albahaca', price: 450, category: pizzaCategory._id, commerce: commerce._id, image: '/uploads/products/margherita.jpg' },
            { name: 'Pizza Pepperoni', description: 'Salsa de tomate, mozzarella, pepperoni', price: 500, category: pizzaCategory._id, commerce: commerce._id, image: '/uploads/products/pepperoni.jpg' },
            { name: 'Pizza Hawaiana', description: 'Salsa de tomate, mozzarella, jamón, piña', price: 520, category: pizzaCategory._id, commerce: commerce._id, image: '/uploads/products/hawaiana.jpg' },
            { name: 'Pizza Cuatro Quesos', description: 'Mozzarella, gorgonzola, parmesano, provolone', price: 580, category: especialCategory._id, commerce: commerce._id, image: '/uploads/products/cuatro-quesos.jpg' },
            { name: 'Pizza BBQ Chicken', description: 'Pollo, salsa BBQ, cebolla caramelizada', price: 600, category: especialCategory._id, commerce: commerce._id, image: '/uploads/products/bbq-chicken.jpg' },
            { name: 'Coca Cola 355ml', description: 'Lata 355ml', price: 80, category: bebidasCategory._id, commerce: commerce._id, image: '/uploads/products/coca-cola.jpg' },
            { name: 'Agua 500ml', description: 'Botella 500ml', price: 50, category: bebidasCategory._id, commerce: commerce._id, image: '/uploads/products/agua.jpg' }
        ]);
        
        console.log('\n🎉 ¡Base de datos poblada exitosamente!');
        console.log('\n📋 CREDENCIALES DE ACCESO:');
        console.log('┌─────────────────┬──────────────────┬─────────────────┐');
        console.log('│ Rol             │ Usuario          │ Contraseña      │');
        console.log('├─────────────────┼──────────────────┼─────────────────┤');
        console.log('│ Administrador   │ admin            │ Admin@2026      │');
        console.log('│ Cliente         │ cliente1         │ Cliente@123     │');
        console.log('│ Delivery        │ delivery1        │ Delivery@123    │');
        console.log('│ Comercio        │ pizzeria1        │ Comercio@123    │');
        console.log('└─────────────────┴──────────────────┴─────────────────┘');
        
        console.log('\n🔗 Accede a: http://localhost:3000');
        console.log('📧 Nota: Los correos de activación se mostrarán en consola');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Conexión cerrada');
        process.exit(0);
    }
}

seedDatabase();