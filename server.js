// server.js - Punto de entrada principal de la aplicación ApiCenar
// Arquitectura MVC con Node.js, Express y MongoDB

// AL PRINCIPIO DE server.js, ANTES DE TODO
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);  // DNS de Google y Cloudflare

const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { engine } = require('express-handlebars');
require('dotenv').config();

// Importar conexión a base de datos
const connectDB = require('./src/config/database');

// Importar middlewares personalizados
const { attachUser } = require('./src/middlewares/auth');

// Inicializar Express
const app = express();

// Conectar a MongoDB
connectDB();

// ============================================
// 1. CONFIGURACIÓN DE MIDDLEWARES
// ============================================

// CORS - Permite peticiones desde el frontend
app.use(cors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true
}));

// Parseo de JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuración de sesiones (para mantener compatibilidad con vistas renderizadas)
app.use(session({
    secret: process.env.JWT_SECRET || 'session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
    }
}));

// Middleware para adjuntar usuario a res.locals (disponible en todas las vistas)
app.use(attachUser);

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ============================================
// 2. CONFIGURACIÓN DE HANDLEBARS (Motor de plantillas)
// ============================================

app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'src/views/layouts'),
    partialsDir: path.join(__dirname, 'src/views/partials'),
    helpers: {
        // Helper para comparar igualdad
        eq: (a, b) => a === b,
        // Helper para formatear fecha
        formatDate: (date) => {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleDateString('es-DO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        // Helper para formatear precio
        formatPrice: (price) => {
            return new Intl.NumberFormat('es-DO', {
                style: 'currency',
                currency: 'DOP'
            }).format(price);
        },
        // Helper para obtener estado en español
        orderStatus: (status) => {
            const statusMap = {
                'Pending': 'Pendiente',
                'InProgress': 'En Proceso',
                'Completed': 'Completado'
            };
            return statusMap[status] || status;
        },
        // Helper para clase de estado
        statusClass: (status) => {
            const classMap = {
                'Pending': 'bg-warning',
                'InProgress': 'bg-info',
                'Completed': 'bg-success'
            };
            return classMap[status] || 'bg-secondary';
        },
        // Helper para secciones (scripts, styles) - NUEVO
        section: function(name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'src/views'));

// ============================================
// 3. IMPORTAR RUTAS DE LA API
// ============================================

const authRoutes = require('./src/routes/authRoutes');
const accountRoutes = require('./src/routes/accountRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const commerceRoutes = require('./src/routes/commerceRoutes');
const deliveryRoutes = require('./src/routes/deliveryRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const addressRoutes = require('./src/routes/addressRoutes');
const favoriteRoutes = require('./src/routes/favoriteRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const productRoutes = require('./src/routes/productRoutes');
const configurationRoutes = require('./src/routes/configurationRoutes');

// ============================================
// 4. REGISTRAR RUTAS DE LA API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api', clientRoutes);
app.use('/api/commerce', commerceRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/configurations', configurationRoutes);

// ============================================
// 5. RUTAS DE VISTAS (Frontend renderizado por el servidor)
// ============================================

// Página principal - Redirige según autenticación
app.get('/', (req, res) => {
    if (req.user) {
        // Redirigir al home según el rol
        switch (req.user.role) {
            case 'Admin':
                return res.redirect('/admin/dashboard');
            case 'Client':
                return res.redirect('/client/home');
            case 'Commerce':
                return res.redirect('/commerce/home');
            case 'Delivery':
                return res.redirect('/delivery/home');
            default:
                return res.redirect('/auth/login');
        }
    }
    res.redirect('/auth/login');
});

// Rutas de autenticación (vistas)
app.get('/auth/login', (req, res) => {
    if (req.user) return res.redirect('/');
    res.render('auth/login', { title: 'Iniciar Sesión - ApiCenar' });
});

app.get('/auth/register-client', (req, res) => {
    res.render('auth/register-client', { title: 'Registro de Cliente/Delivery - ApiCenar' });
});

app.get('/auth/register-commerce', (req, res) => {
    res.render('auth/register-commerce', { title: 'Registro de Comercio - ApiCenar' });
});

app.get('/auth/forgot-password', (req, res) => {
    res.render('auth/forgot-password', { title: 'Recuperar Contraseña - ApiCenar' });
});

app.get('/auth/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) return res.redirect('/auth/login');
    res.render('auth/reset-password', { title: 'Restablecer Contraseña - ApiCenar', token });
});

// Rutas del Cliente (vistas protegidas)
app.get('/client/home', requireAuth('Client'), (req, res) => {
    res.render('client/home', { title: 'Home - ApiCenar', user: req.user });
});

app.get('/client/commerces/:typeId', requireAuth('Client'), (req, res) => {
    res.render('client/commerces', { title: 'Comercios - ApiCenar', user: req.user, typeId: req.params.typeId });
});

app.get('/client/catalog/:commerceId', requireAuth('Client'), (req, res) => {
    res.render('client/catalog', { title: 'Catálogo - ApiCenar', user: req.user, commerceId: req.params.commerceId });
});

app.get('/client/checkout', requireAuth('Client'), (req, res) => {
    res.render('client/checkout', { title: 'Finalizar Pedido - ApiCenar', user: req.user });
});

app.get('/client/profile', requireAuth('Client'), (req, res) => {
    res.render('client/profile', { title: 'Mi Perfil - ApiCenar', user: req.user });
});

app.get('/client/orders', requireAuth('Client'), (req, res) => {
    res.render('client/orders', { title: 'Mis Pedidos - ApiCenar', user: req.user });
});

app.get('/client/orders/:id', requireAuth('Client'), (req, res) => {
    res.render('client/order-detail', { title: 'Detalle de Pedido - ApiCenar', user: req.user, orderId: req.params.id });
});

app.get('/client/addresses', requireAuth('Client'), (req, res) => {
    res.render('client/addresses', { title: 'Mis Direcciones - ApiCenar', user: req.user });
});

app.get('/client/favorites', requireAuth('Client'), (req, res) => {
    res.render('client/favorites', { title: 'Mis Favoritos - ApiCenar', user: req.user });
});

// Rutas del Comercio
app.get('/commerce/home', requireAuth('Commerce'), (req, res) => {
    res.render('commerce/home', { title: 'Home Comercio - ApiCenar', user: req.user });
});

app.get('/commerce/orders/:id', requireAuth('Commerce'), (req, res) => {
    res.render('commerce/order-detail', { title: 'Detalle de Pedido - ApiCenar', user: req.user, orderId: req.params.id });
});

app.get('/commerce/profile', requireAuth('Commerce'), (req, res) => {
    res.render('commerce/profile', { title: 'Perfil del Comercio - ApiCenar', user: req.user });
});

app.get('/commerce/categories', requireAuth('Commerce'), (req, res) => {
    res.render('commerce/categories', { title: 'Categorías - ApiCenar', user: req.user });
});

app.get('/commerce/products', requireAuth('Commerce'), (req, res) => {
    res.render('commerce/products', { title: 'Productos - ApiCenar', user: req.user });
});

// Rutas del Delivery
app.get('/delivery/home', requireAuth('Delivery'), (req, res) => {
    res.render('delivery/home', { title: 'Home Delivery - ApiCenar', user: req.user });
});

app.get('/delivery/orders/:id', requireAuth('Delivery'), (req, res) => {
    res.render('delivery/order-detail', { title: 'Detalle de Pedido - ApiCenar', user: req.user, orderId: req.params.id });
});

app.get('/delivery/profile', requireAuth('Delivery'), (req, res) => {
    res.render('delivery/profile', { title: 'Perfil Delivery - ApiCenar', user: req.user });
});

// Rutas del Administrador
app.get('/admin/dashboard', requireAuth('Admin'), (req, res) => {
    res.render('admin/dashboard', { title: 'Dashboard - ApiCenar', user: req.user });
});

app.get('/admin/clients', requireAuth('Admin'), (req, res) => {
    res.render('admin/clients', { title: 'Clientes - ApiCenar', user: req.user });
});

app.get('/admin/deliveries', requireAuth('Admin'), (req, res) => {
    res.render('admin/deliveries', { title: 'Deliveries - ApiCenar', user: req.user });
});

app.get('/admin/commerces', requireAuth('Admin'), (req, res) => {
    res.render('admin/commerces', { title: 'Comercios - ApiCenar', user: req.user });
});

app.get('/admin/admins', requireAuth('Admin'), (req, res) => {
    res.render('admin/admins', { title: 'Administradores - ApiCenar', user: req.user });
});

app.get('/admin/configurations', requireAuth('Admin'), (req, res) => {
    res.render('admin/configurations', { title: 'Configuraciones - ApiCenar', user: req.user });
});

app.get('/admin/commerce-types', requireAuth('Admin'), (req, res) => {
    res.render('admin/commerce-types', { title: 'Tipos de Comercio - ApiCenar', user: req.user });
});

// Middleware de protección de rutas para vistas
function requireAuth(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.redirect('/auth/login');
        }
        if (role && req.user.role !== role) {
            return res.status(403).render('error', {
                title: 'Acceso Denegado',
                message: 'No tienes permisos para acceder a esta página',
                user: req.user
            });
        }
        next();
    };
}

// ============================================
// 6. MANEJO DE ERRORES 404 Y 500
// ============================================

app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Página no encontrada',
        message: 'La página que buscas no existe',
        user: req.user || null
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error inesperado',
        user: req.user || null
    });
});

// ============================================
// 7. INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ApiCenar corriendo en http://localhost:${PORT}`);
    console.log(`📧 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Base de datos: MongoDB`);
});