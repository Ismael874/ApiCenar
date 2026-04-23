// src/config/multer.js
// Configuración de Multer para subida de archivos

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que las carpetas existan
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'public/uploads/';
        
        // Determinar carpeta según el tipo de archivo
        if (file.fieldname === 'profileImage') {
            uploadPath += 'profiles/';
        } else if (file.fieldname === 'logo') {
            uploadPath += 'logos/';
        } else if (file.fieldname === 'image') {
            uploadPath += 'products/';
        } else if (file.fieldname === 'icon') {
            uploadPath += 'icons/';
        }
        
        ensureDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'));
    }
};

// Límites de tamaño
const limits = {
    fileSize: 5 * 1024 * 1024 // 5MB
};

const upload = multer({
    storage: storage,
    limits: limits,
    fileFilter: fileFilter
});

module.exports = upload;