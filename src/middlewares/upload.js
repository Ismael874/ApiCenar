// src/middlewares/upload.js
// Configuración de Multer para subida de archivos
// Exporta uploadProfile, uploadLogo, uploadProduct, uploadIcon

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que los directorios existen
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Directorios base
const baseUploadDir = 'public/uploads';
const profilesDir = path.join(baseUploadDir, 'profiles');
const logosDir = path.join(baseUploadDir, 'logos');
const productsDir = path.join(baseUploadDir, 'products');
const iconsDir = path.join(baseUploadDir, 'icons');

// Crear directorios
ensureDir(profilesDir);
ensureDir(logosDir);
ensureDir(productsDir);
ensureDir(iconsDir);

// ============================================
// CONFIGURACIÓN PARA IMÁGENES DE PERFIL
// ============================================
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profilesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

// ============================================
// CONFIGURACIÓN PARA LOGOS DE COMERCIOS
// ============================================
const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, logosDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'logo-' + uniqueSuffix + ext);
    }
});

// ============================================
// CONFIGURACIÓN PARA IMÁGENES DE PRODUCTOS
// ============================================
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, productsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

// ============================================
// CONFIGURACIÓN PARA ICONOS DE TIPOS DE COMERCIO
// ============================================
const iconStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, iconsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'icon-' + uniqueSuffix + ext);
    }
});

// ============================================
// FILTRO DE ARCHIVOS (SOLO IMÁGENES)
// ============================================
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
};

// ============================================
// LÍMITES DE TAMAÑO
// ============================================
const limits = {
    fileSize: 5 * 1024 * 1024 // 5MB
};

// ============================================
// MIDDLEWARES DE SUBIDA (EXPORTADOS)
// ============================================

// Para perfil de usuario (cliente/delivery/admin)
const uploadProfile = multer({ 
    storage: profileStorage,
    limits: limits,
    fileFilter: fileFilter
});

// Para logo de comercio
const uploadLogo = multer({ 
    storage: logoStorage,
    limits: limits,
    fileFilter: fileFilter
});

// Para imagen de producto
const uploadProduct = multer({ 
    storage: productStorage,
    limits: limits,
    fileFilter: fileFilter
});

// Para icono de tipo de comercio
const uploadIcon = multer({ 
    storage: iconStorage,
    limits: limits,
    fileFilter: fileFilter
});

// ============================================
// MIDDLEWARE PARA MANEJAR ERRORES DE SUBIDA
// ============================================
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'El archivo es demasiado grande (máximo 5MB)' 
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                message: 'Campo de archivo no esperado' 
            });
        }
        return res.status(400).json({ message: err.message });
    }
    if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

// ============================================
// EXPORTACIONES
// ============================================
module.exports = {
    uploadProfile,
    uploadLogo,
    uploadProduct,
    uploadIcon,
    handleUploadError
};