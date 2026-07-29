# saborandino-api

API Spring Boot del sistema Sabor Andino.

## Requisitos

- Java 21
- MariaDB/MySQL
- Base `db_saborandino` creada con `../base-de-datos/db_saborandino_profesional.sql`

## Ejecución

```bat
mvnw.cmd clean spring-boot:run
```

- API: `http://localhost:8080`
- Estado: `http://localhost:8080/api/frontend/health`
- Swagger: `http://localhost:8080/docs`

La configuración de conexión está en `src/main/resources/application.properties`.
