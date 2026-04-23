// public/js/auth.js
// Funciones comunes de autenticación y utilidades

// ============================================
// GESTIÓN DE TOKEN Y SESIÓN
// ============================================

/**
 * Obtiene el token JWT almacenado
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Obtiene el usuario actual almacenado
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Verifica si el usuario está autenticado
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} role - Rol a verificar
 */
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
}

/**
 * Realiza una petición autenticada a la API
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones de fetch
 */
async function apiFetch(url, options = {}) {
    const token = getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        // Si el token expiró o es inválido, redirigir a login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login';
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Error en apiFetch:', error);
        throw error;
    }
}

// ============================================
// VALIDACIÓN DE FORMULARIOS
// ============================================

/**
 * Inicializa la validación de Bootstrap en todos los formularios
 */
function initBootstrapValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
}

/**
 * Valida un campo de email
 * @param {string} email - Email a validar
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Valida que dos contraseñas coincidan
 * @param {string} password - Contraseña
 * @param {string} confirmPassword - Confirmación
 */
function passwordsMatch(password, confirmPassword) {
    return password === confirmPassword;
}

// ============================================
// UTILIDADES DE UI
// ============================================

/**
 * Muestra un mensaje toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const colors = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    };
    
    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white border-0 mb-2';
    toastEl.classList.add(colors[type] || colors.info);
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${getToastIcon(type)} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastEl);
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

/**
 * Muestra/oculta un spinner de carga
 * @param {boolean} show - Mostrar u ocultar
 * @param {string} message - Mensaje opcional
 */
function toggleLoading(show, message = 'Cargando...') {
    let overlay = document.getElementById('loadingOverlay');
    
    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="loading-spinner mb-3"></div>
                    <p class="text-muted">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    } else {
        if (overlay) {
            overlay.remove();
        }
    }
}

/**
 * Formatea un precio en DOP
 * @param {number} price - Precio a formatear
 */
function formatPrice(price) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP'
    }).format(price);
}

/**
 * Formatea una fecha
 * @param {string|Date} date - Fecha a formatear
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar validación de Bootstrap
    initBootstrapValidation();
    
    // Configurar botón de logout si existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Verificar autenticación en páginas protegidas
    const protectedPages = ['/client', '/commerce', '/delivery', '/admin'];
    const currentPath = window.location.pathname;
    
    if (protectedPages.some(page => currentPath.startsWith(page))) {
        if (!isAuthenticated()) {
            window.location.href = '/auth/login';
        }
    }
});