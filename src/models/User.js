// src/models/User.js
// Modelo principal de usuarios - Soporta todos los roles del sistema
// Admin, Client, Delivery, Commerce

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Campos base para todos los usuarios
    firstName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true
    },
    userName: {
        type: String,
        required: [true, 'El nombre de usuario es requerido'],
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'El correo es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    phone: {
        type: String,
        required: [true, 'El teléfono es requerido'],
        trim: true
    },
    profileImage: {
        type: String,
        default: '/uploads/profiles/default-profile.png'
    },
    role: {
        type: String,
        enum: ['Admin', 'Client', 'Delivery', 'Commerce'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: false // Usuarios se crean inactivos por defecto
    },
    isAvailable: {
        type: Boolean,
        default: true // Para deliveries, indica si están disponibles
    },
    // Campo para marcar al admin por defecto (no modificable)
    isDefaultAdmin: {
        type: Boolean,
        default: false
    },
    // Información adicional para Commerce (se guarda en modelo separado)
    commerceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commerce'
    }
}, {
    timestamps: true
});

// Middleware para hashear contraseña antes de guardar
userSchema.pre('save', async function(next) {
    // Solo hashear si la contraseña fue modificada
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener perfil público (sin información sensible)
userSchema.methods.toPublicProfile = function() {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

// Método para verificar si el usuario puede iniciar sesión
userSchema.methods.canLogin = function() {
    return this.isActive === true;
};

const User = mongoose.model('User', userSchema);

module.exports = User;