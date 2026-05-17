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

## 2️⃣ Acceso a los servicios

| Servicio            | URL                                            | Swagger                                                                        |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| Orchestrator (Java) | [http://localhost:8080](http://localhost:8080) | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) |
| Auth (Node.js)      | [http://localhost:3001](http://localhost:3001) | [http://localhost:3001/api-docs](http://localhost:3001/api-docs)               |
| Core (Python)       | [http://localhost:8001](http://localhost:8001) | [http://localhost:8001/docs](http://localhost:8001/docs)                       |
| Frontend            | [http://localhost:80](http://localhost:80)     | N/A                                                                            |

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
