// src/config/mailer.js
// Configuración de Nodemailer para envío de correos

const nodemailer = require('nodemailer');

// Crear transporter
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_PORT == 465,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
});

// Verificar conexión
transporter.verify((error, success) => {
    if (error) {
        console.log('⚠️ Error con el servidor de correo:', error.message);
        console.log('📧 Los correos se mostrarán en consola (modo desarrollo)');
    } else {
        console.log('✅ Servidor de correo listo');
    }
});

/**
 * Envía un correo de activación de cuenta
 */
async function sendActivationEmail(email, name, token) {
    const activationUrl = `${process.env.APP_URL}/auth/confirm-email?token=${token}`;
    
    const mailOptions = {
        from: `"ApiCenar" <${process.env.MAIL_FROM}>`,
        to: email,
        subject: 'Activa tu cuenta en ApiCenar',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">¡Bienvenido a ApiCenar, ${name}!</h2>
                <p>Gracias por registrarte. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${activationUrl}" 
                       style="background-color: #e74c3c; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Activar mi cuenta
                    </a>
                </p>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">
                    ${activationUrl}
                </p>
                <p>Este enlace expirará en 24 horas.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Si no creaste una cuenta en ApiCenar, puedes ignorar este correo.
                </p>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Correo de activación enviado a ${email}`);
    } catch (error) {
        console.error('Error enviando correo de activación:', error.message);
        // En desarrollo, mostrar el enlace en consola
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔗 Enlace de activación: ${activationUrl}`);
        }
    }
}

/**
 * Envía un correo de recuperación de contraseña
 */
async function sendPasswordResetEmail(email, name, token) {
    const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
    
    const mailOptions = {
        from: `"ApiCenar" <${process.env.MAIL_FROM}>`,
        to: email,
        subject: 'Recuperación de contraseña - ApiCenar',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">Recuperación de contraseña</h2>
                <p>Hola ${name},</p>
                <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #e74c3c; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Restablecer contraseña
                    </a>
                </p>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">
                    ${resetUrl}
                </p>
                <p>Este enlace expirará en 1 hora.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Si no solicitaste este cambio, puedes ignorar este correo.
                </p>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Correo de recuperación enviado a ${email}`);
    } catch (error) {
        console.error('Error enviando correo de recuperación:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔗 Enlace de recuperación: ${resetUrl}`);
        }
    }
}

module.exports = {
    transporter,
    sendActivationEmail,
    sendPasswordResetEmail
};