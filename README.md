# Sabor Andino — sistema web profesional integrado

Este paquete contiene una aplicación completa para restaurante:

- **Frontend:** Angular, sitio público y panel administrativo adaptable a computadoras, tabletas y celulares.
- **Backend:** Spring Boot con Java 21.
- **Base de datos:** MariaDB/MySQL, sin pedidos, reservas, clientes, sucursales, categorías, productos, mesas, promociones ni pagos simulados.

## Estructura

```text
saborandino-profesional/
├── saborAndino-frontend/
├── saborandino-api/
├── base-de-datos/
│   └── db_saborandino_profesional.sql
├── postman/
│   └── SaborAndino-Profesional.postman_collection.json
├── INICIAR-BACKEND.bat
├── INICIAR-FRONTEND.bat
├── INICIAR-TODO.bat
└── VERIFICAR-BACKEND.bat
```

## Datos iniciales intencionales

La instalación conserva únicamente:

1. El usuario administrador necesario para ingresar al panel.
2. Los métodos de pago del sistema: Yape, Tarjeta BCP y Efectivo.

Todas las tablas operativas comienzan vacías. Los datos se crean desde la página pública o desde los formularios administrativos.

### Acceso administrativo inicial

```text
Correo: admin@saborandino.pe
Contraseña: Admin123*
```

Después de ingresar, cambia la contraseña desde el perfil del administrador.

## 1. Crear la base de datos

En MySQL Workbench o phpMyAdmin ejecuta **un solo archivo**:

```text
base-de-datos/db_saborandino_profesional.sql
```

El script elimina la estructura anterior de `db_saborandino`, la crea nuevamente y deja en cero:

- sucursales;
- categorías y productos;
- stock por sucursal;
- mesas;
- clientes;
- reservas;
- pedidos y detalles;
- pagos;
- promociones;
- historiales operativos.

Al terminar, la consulta de verificación incluida en el mismo archivo debe mostrar un administrador, tres métodos de pago y cero registros en las tablas operativas.

## 2. Configurar y ejecutar el backend

Abre:

```text
saborandino-api/src/main/resources/application.properties
```

Configuración predeterminada para XAMPP/MariaDB sin contraseña:

```properties
spring.datasource.url=jdbc:mariadb://localhost:3306/db_saborandino
spring.datasource.username=root
spring.datasource.password=
server.port=8080
```

Cuando `root` tenga contraseña, escríbela en `spring.datasource.password`.

### Desde Spring Tool Suite

1. `File → Import → Maven → Existing Maven Projects`.
2. Selecciona la carpeta `saborandino-api`.
3. `Maven → Update Project`.
4. Ejecuta `SaborAndinoApiApplication` como `Spring Boot App`.

### Desde Windows

Ejecuta:

```text
INICIAR-BACKEND.bat
```

El backend debe terminar con:

```text
Tomcat started on port 8080
Started SaborAndinoApiApplication
```

Pruebas:

```text
Estado:  http://localhost:8080/api/frontend/health
Swagger: http://localhost:8080/docs
```

Si el puerto 8080 está ocupado:

```cmd
netstat -ano | findstr :8080
taskkill /PID NUMERO_PID /F
```

## 3. Ejecutar el frontend

En una terminal dentro de `saborAndino-frontend`:

```bash
npm install
npm start
```

O ejecuta:

```text
INICIAR-FRONTEND.bat
```

Abre:

```text
http://localhost:4200
```

No abras los archivos con Live Server. Angular debe ejecutarse con `npm start`.

## 4. Orden recomendado para configurar el negocio

Ingresa al panel en:

```text
http://localhost:4200/admin/login
```

Registra la información en este orden:

1. **Sucursales:** datos de contacto, ubicación, horario, servicios e imagen.
2. **Categorías:** agrupaciones del menú.
3. **Productos:** categoría, sucursal, precio, stock, descripción e imagen.
4. **Mesas:** número, capacidad, ubicación y sucursal.
5. **Promociones:** producto relacionado, precio, vigencia y contenido.
6. **Perfil administrativo:** datos personales y nueva contraseña.

Después de esa configuración:

- los clientes se registran al hacer pedidos o reservas;
- los pedidos se crean desde el carrito público;
- las reservas se crean desde el formulario público;
- los pagos se generan junto con pedidos y reservas;
- el administrador actualiza estados y revisa reportes.

## Funciones del sitio público

- Menú cargado desde la base de datos.
- Búsqueda y filtros reales.
- Carrito persistente solo para conservar la selección antes de confirmar.
- Pedidos para recojo o delivery.
- Registro y validación de clientes.
- Reservas según sucursal, fecha, hora, capacidad y disponibilidad de mesas.
- Seguimiento de pedidos por código y celular.
- Sucursales y contactos dinámicos.
- Promoción activa dinámica.
- Diseño adaptable para celular, tableta y escritorio.

## Funciones del panel administrativo

- Autenticación mediante la tabla `tuser` y contraseña cifrada con BCrypt.
- Dashboard con datos reales.
- Gestión de sucursales, categorías, productos, mesas, clientes y promociones.
- Gestión de pedidos, reservas y pagos.
- Actualización de estados e historiales.
- Reportes por fechas.
- Perfil del administrador y cambio de contraseña.
- Navegación adaptable para celular.

## Integridad de datos

La base utiliza claves primarias UUID, claves foráneas, índices, restricciones, historiales automáticos, vistas administrativas y transacciones. Los pedidos validan productos activos, stock real y sucursal; las reservas validan mesas disponibles y evitan cruces para la misma fecha y hora.

## Nota sobre registros locales

El frontend solo usa almacenamiento del navegador para:

- el carrito todavía no confirmado;
- la sesión administrativa.

Los pedidos, reservas, clientes, pagos y demás registros confirmados se guardan exclusivamente en `db_saborandino` mediante el backend.
