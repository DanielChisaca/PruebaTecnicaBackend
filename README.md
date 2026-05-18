# Backend Technical Challenge - Sistema Bancario Políglota 🎯

## 📌 Objetivo

Desarrollar una solución basada en microservicios, robusta, segura y escalable, para la gestión de usuarios y transferencias bancarias.
La arquitectura implementa patrones avanzados como:

* Circuit Breaker
* Logs estructurados
* Arquitectura distribuida con múltiples lenguajes

---

# 🏗️ Arquitectura del Sistema

El sistema está compuesto por los siguientes servicios:

## 🔐 Auth Service (Node.js)

Responsable de:

* Registro de usuarios
* Inicio de sesión
* Gestión de sesiones
* Cifrado y almacenamiento seguro en Redis

---

## ⚙️ Orchestrator Service (Java Spring Boot)

Responsable de:

* Orquestación de la lógica de negocio
* Consulta de saldos y movimientos
* Coordinación entre microservicios
* Implementación de resiliencia mediante Circuit Breaker

---

## 🧠 Core Service (Python FastAPI)

Responsable de:

* Persistencia de datos
* Validaciones de usuarios y movimientos
* Gestión de transferencias bancarias
* Integración con PostgreSQL

---

## 💻 Frontend

Interfaz de usuario básica para interactuar con el sistema.

---

# 🛠️ Tecnologías y Patrones

## Lenguajes

* Java 17
* Node.js 20
* Python 3.11

## Bases de Datos

* PostgreSQL
* Redis (manejo de sesiones)

## Resiliencia

* Circuit Breaker implementado con Resilience4j

## Observabilidad

* Logs estructurados en formato JSON

## Documentación

* Swagger / OpenAPI disponible en cada microservicio

---

# 🚀 Instrucciones de Despliegue

Todo el entorno se encuentra dockerizado para facilitar la ejecución y evaluación del proyecto.

## ✅ Requisitos

Tener instalado:

* Docker
* Docker Compose

---

## 1️⃣ Levantar el proyecto

Desde la raíz del proyecto ejecutar:

```bash
docker-compose up --build
```

---

## 2️⃣ Ejecutar las pruebas del Orchestrator Service (Java)

Las pruebas del orquestador son de integración de capa web: levantan el contexto Spring completo (con Circuit Breaker AOP activo) y mockean los clientes HTTP hacia Auth y Core, sin necesidad de infraestructura externa.

```bash
docker-compose build orchestrator-tests && docker-compose run --rm orchestrator-tests
```

Cubre los siguientes endpoints con mocks de `AuthServiceClient` y `CoreServiceClient`:

| Endpoint | Pruebas |
| -------- | ------- |
| `GET /accounts/balance/{userId}` | Sesión válida → 200 con saldo, sin header → 400 |
| `POST /transfers` | Transferencia exitosa → 201, Circuit Breaker abierto → 503 |
| `GET /movements/{userId}` | Con movimientos → 200 con lista, sin movimientos → lista vacía |
| `GET /notifications/{userId}` | Sesión válida → 200 con 3 alertas locales, sesión inválida → 401 |

---

## 3️⃣ Ejecutar las pruebas del Auth Service (Node.js)

Las pruebas del servicio Node.js son unitarias y corren completamente aisladas: mockean Redis, axios y bcrypt, por lo que no requieren ninguna infraestructura externa.

```bash
docker-compose build auth-tests && docker-compose run --rm auth-tests
```

Cubre los siguientes endpoints con mocks de dependencias externas:

| Endpoint | Pruebas |
| -------- | ------- |
| `GET /health` | Estado UP del servicio |
| `POST /register` | Registro exitoso (hash bcrypt), duplicado propagado desde core |
| `POST /login` | Éxito con token, contraseña incorrecta, bloqueo por 3 intentos, usuario bloqueado |
| `POST /logout` | Sin token, cierre exitoso con eliminación en Redis |
| `POST /validate` | Sin token, token expirado, token válido con datos de sesión |

---

## 3️⃣ Ejecutar las pruebas del Core Service (Python)

Las pruebas del servicio Python corren en un contenedor aislado con SQLite en memoria, sin necesidad de levantar el stack completo.

```bash
docker-compose build core-tests && docker-compose run --rm core-tests
```

Cubre los siguientes módulos con pruebas de integración y unitarias:

| Módulo | Pruebas |
| ------ | ------- |
| `/core1/users` | Registro, duplicados, login, campos obligatorios |
| `/core2/balance` | Saldo existente, usuario no encontrado, campo faltante |
| `/core2/movements` | Sin cuenta, sin transacciones, egresos, ingresos, orden |
| `/core3/transfers` | Transferencia exitosa, fondos insuficientes, auto-transferencia, teléfono no registrado, saldo exacto |
| Schemas Pydantic | Validaciones de campos, tipos y restricciones numéricas |

---

## 4️⃣ Ejecutar las pruebas del Frontend (React)

Las pruebas del frontend corren con Vitest + @testing-library/react en un entorno jsdom, completamente aisladas: mockean el contexto de autenticación y los servicios HTTP, sin necesidad de infraestructura externa.

```bash
docker-compose build frontend-tests && docker-compose run --rm frontend-tests
```

Cubre los siguientes módulos con pruebas unitarias:

| Módulo | Pruebas |
| ------ | ------- |
| `AuthContext` | Inicialización desde localStorage, login (token + usuario), login inválido, logout |
| `Login` | Renderizado, submit con credenciales, login exitoso → contexto, error backend, error red |
| `Register` | Renderizado de campos, registro exitoso con redirección, error de duplicado, datos enviados |
| `Dashboard` | Bienvenida, fetch de balance, fetch de notificaciones, logout, sin usuario |
| `Transfer` | Renderizado, estado de procesamiento, éxito → callback, fallo, argumentos correctos |
| `Movements` | Estado vacío, lista de movimientos, egreso, ingreso por teléfono, sin usuario |
| `App` | Login sin autenticar, Dashboard autenticado, navegación Login ↔ Register |

---

## 3️⃣ Acceso a los servicios

Solo el frontend expone puerto al host. Todos los microservicios se acceden a través del proxy inverso Nginx que corre en el contenedor `frontend-react` en el puerto **3000**.

| Servicio            | URL de acceso                                      | Swagger UI                                                                                   | OpenAPI JSON                                                                 |
| ------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Frontend (React)    | [http://localhost:3000](http://localhost:3000)     | N/A                                                                                          | N/A                                                                          |
| Auth (Node.js)      | http://localhost:3000/api/v1/auth/                 | [http://localhost:3000/api-docs](http://localhost:3000/api-docs)                             | N/A                                                                          |
| Orchestrator (Java) | http://localhost:3000/api/v1/orchestrator/         | [http://localhost:3000/swagger-ui/index.html](http://localhost:3000/swagger-ui/index.html)   | [http://localhost:3000/v3/api-docs](http://localhost:3000/v3/api-docs)       |
| Core (Python)       | http://localhost:3000/ (vía orchestrator)          | [http://localhost:3000/docs](http://localhost:3000/docs)                                     | [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)     |

### 🧪 Cómo probar los endpoints protegidos desde Swagger

Los endpoints del **Orchestrator** requieren un token JWT (Bearer Token).
Para obtenerlo:

1. Abre el Swagger de **Auth** ([http://localhost:3000/api-docs](http://localhost:3000/api-docs)).
2. Registra un usuario con `POST /api/v1/auth/register`.
3. Inicia sesión con `POST /api/v1/auth/login` y copia el `token` de la respuesta.
4. Abre el Swagger del **Orchestrator** ([http://localhost:3000/swagger-ui/index.html](http://localhost:3000/swagger-ui/index.html)), pulsa **Authorize** y pega `Bearer <token>`.
5. Ya puedes ejecutar `GET /accounts/balance/{userId}`, `POST /transfers`, etc.

### 📋 Endpoints por servicio

**Auth Service (Node.js) — base `/api/v1/auth`**

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `POST` | `/api/v1/auth/register` | Registro de usuario |
| `POST` | `/api/v1/auth/login`    | Inicio de sesión y emisión de token |
| `POST` | `/api/v1/auth/logout`   | Cierre de sesión |
| `POST` | `/api/v1/auth/validate` | Validación de token (uso interno del orchestrator) |
| `GET`  | `/health`               | Healthcheck del servicio |

**Core Service (Python / FastAPI)**

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `POST` | `/core1/users/register` | Persistencia física del usuario en BD |
| `POST` | `/core1/users/login`    | Login interno (verificación de hash) |
| `POST` | `/core2/balance`        | Consulta de saldo por `userId` |
| `POST` | `/core2/movements`      | Historial de movimientos por `userId` |
| `POST` | `/core3/transfers`      | Ejecuta una transferencia por número de teléfono |

**Orchestrator Service (Java / Spring Boot) — base `/api/v1/orchestrator`** (requiere `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `GET`  | `/api/v1/orchestrator/accounts/balance/{userId}` | Consulta de saldo orquestada (con Circuit Breaker) |
| `POST` | `/api/v1/orchestrator/transfers`                 | Transferencia orquestada (con Circuit Breaker) |
| `GET`  | `/api/v1/orchestrator/movements/{userId}`        | Historial de movimientos orquestado |
| `GET`  | `/api/v1/orchestrator/notifications/{userId}`    | Notificaciones locales generadas en Java |

---

## 3️⃣ Visualización de logs estructurados

Para visualizar los logs JSON de un servicio específico:

```bash
docker-compose logs -f core-service
```

---

# 📋 Alcance Funcional Implementado

* [x] Registro de usuarios
* [x] Inicio de sesión
* [x] Cifrado de contraseñas
* [x] Manejo de sesiones con Redis
* [x] Consulta de saldos
* [x] Consulta de movimientos
* [x] Transferencias por número de teléfono
* [x] Implementación de Circuit Breaker para tolerancia a fallos

---

# 🔒 Seguridad

* Las contraseñas son almacenadas de forma cifrada.
* Las sesiones son gestionadas de manera segura utilizando Redis.
* Separación de responsabilidades entre servicios para reducir acoplamiento.
* Se aplica terminación de TLS en la capa de transporte/infraestructura mediante un Proxy Inverso (Nginx), aislando los microservicios en una red privada de Docker, garantizando código limpio y desacoplado de la gestión de infraestructura de seguridad.

---

# 📈 Escalabilidad

Gracias a la arquitectura basada en microservicios:

* Cada componente puede escalar horizontalmente de manera independiente.
* Los servicios pueden desplegarse y mantenerse de forma aislada.
* El sistema permite evolucionar tecnologías sin afectar otros módulos.

---

# 📖 Documentación API

Cada microservicio cuenta con documentación Swagger/OpenAPI accesible desde el navegador una vez levantado el entorno.

---

# 🧪 Consideraciones Técnicas

* Arquitectura desacoplada y orientada a servicios.
* Comunicación entre microservicios mediante HTTP REST.
* Manejo centralizado de errores.
* Trazabilidad mediante logs estructurados.
* Preparado para ambientes containerizados y CI/CD.

---

# 🗄️ Queries Útiles para Base de Datos

Para conectarte a la base de datos PostgreSQL:

```bash
docker exec -it bank-db psql -U user_admin -d bank_db
```

## Usuarios

Ver todos los usuarios registrados con sus datos principales:

```sql
SELECT id, username, email, document_type, document_id, phone_number 
FROM users;
```

## Cuentas Bancarias

Ver todas las cuentas con sus saldos actuales:

```sql
SELECT id, user_id, balance 
FROM accounts;
```

## Movimientos

Ver el historial de transferencias realizadas:

```sql
SELECT id, origin_account_id, destination_phone, amount, timestamp 
FROM transactions;
```

## Eliminación de Datos

Limpiar la base de datos completamente:

```sql
DROP TABLE transactions;
DROP TABLE accounts;
DROP TABLE users;
```

---
