// src/models/Order.js
// Modelo de pedidos - Contiene toda la información de una orden

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    image: String
});

const orderSchema = new mongoose.Schema({
    // Cliente que realizó el pedido
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Comercio que recibe el pedido
    commerce: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commerce',
        required: true
    },
    // Delivery asignado (inicialmente null)
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Dirección de entrega
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    // Dirección en texto (snapshot por si se elimina la dirección)
    addressSnapshot: {
        label: String,
        street: String,
        sector: String,
        city: String,
        reference: String
    },
    // Items del pedido
    items: [orderItemSchema],
    // Totales
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    itbisPercentage: {
        type: Number,
        required: true,
        default: 18
    },
    itbisAmount: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    // Estado del pedido
    status: {
        type: String,
        enum: ['Pending', 'InProgress', 'Completed'],
        default: 'Pending'
    },
    // Fecha de asignación del delivery
    assignedAt: Date,
    // Fecha de completado
    completedAt: Date
}, {
    timestamps: true
});

// Middleware para calcular totales antes de guardar
orderSchema.pre('save', function(next) {
    // Calcular subtotal
    this.subtotal = this.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    // Calcular ITBIS y total
    this.itbisAmount = this.subtotal * (this.itbisPercentage / 100);
    this.total = this.subtotal + this.itbisAmount;
    
    next();
});

// Método para asignar delivery
orderSchema.methods.assignDelivery = async function(deliveryId) {
    const Delivery = mongoose.model('User');
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery || delivery.role !== 'Delivery' || !delivery.isAvailable) {
        throw new Error('Delivery no disponible');
    }
    
    this.delivery = deliveryId;
    this.status = 'InProgress';
    this.assignedAt = new Date();
    
    // Marcar delivery como ocupado
    delivery.isAvailable = false;
    await delivery.save();
    
    return this.save();
};

// Método para completar pedido
orderSchema.methods.complete = async function() {
    if (this.status !== 'InProgress') {
        throw new Error('Solo se pueden completar pedidos en proceso');
    }
    
    this.status = 'Completed';
    this.completedAt = new Date();
    
    // Liberar delivery si existe
    if (this.delivery) {
        const Delivery = mongoose.model('User');
        const delivery = await Delivery.findById(this.delivery);
        if (delivery) {
            delivery.isAvailable = true;
            await delivery.save();
        }
    }
    
    return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;