# Gu�a de Instalaci�n y Prueba - ApiCenar

## Requisitos Previos
- Node.js v18 o superior
- MongoDB Atlas (conexi�n incluida en .env)
- Navegador web moderno

## Instalaci�n
1. Clonar el repositorio
2. Ejecutar 
pm install
3. Copiar el archivo .env.example a .env y completar las variables (la URI de MongoDB se proporciona por separado)
4. (Opcional) Ejecutar 
pm run seed para poblar datos de prueba
5. Iniciar con 
pm run dev
6. Acceder a http://localhost:3000

## Credenciales de Acceso
| Rol       | Usuario     | Contrase�a   |
|-----------|-------------|--------------|
| Admin     | admin       | Admin@2026   |
| Cliente   | cliente1    | Cliente@123  |
| Delivery  | delivery1   | Delivery@123 |
| Comercio  | pizzeria1   | Comercio@123 |

## Estructura del Proyecto
- Backend: Node.js + Express (MVC)
- Base de datos: MongoDB (Mongoose)
- Frontend: Handlebars + Bootstrap 5
- Autenticaci�n: JWT

## Flujos de Prueba Recomendados
### Cliente
1. Iniciar sesi�n como cliente1
2. Explorar tipos de comercio
3. Seleccionar "Pizzer�a" y ver "Pizzer�a Don Pepe"
4. Agregar productos al carrito, ir a Checkout y confirmar pedido

### Comercio
1. Iniciar sesi�n como pizzeria1
2. Ver pedidos pendientes y asignar delivery
3. Gestionar categor�as y productos

### Delivery
1. Iniciar sesi�n como delivery1
2. Ver pedidos asignados y completarlos

### Administrador
1. Iniciar sesi�n como admin
2. Ver dashboard con m�tricas
3. Gestionar usuarios, configuraciones (ITBIS) y tipos de comercio

## Notas
- El env�o de correos est� configurado pero en desarrollo los enlaces se muestran en consola.
- Las im�genes de prueba tienen rutas de ejemplo; pueden subirse desde el panel de comercio.

**Desarrollado por:** Ismael874
**Curso:** Proyecto Final Web
**Fecha:** Abril 2026
