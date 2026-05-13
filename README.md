Backend Technical Challenge - Sistema Bancario Políglota🎯 

Objetivo

Desarrollar una solución de microservicios robusta, segura y escalable para la gestión de usuarios y transferencias bancarias. Se implementan patrones de diseño avanzados como Circuit Breaker, Logs Estructurados y arquitectura de microservicios utilizando tres lenguajes distintos.

🏗️ Arquitectura del Sistema

El sistema se compone de los siguientes módulos:Auth Service (Node.js): Gestión de registro, login y sesiones cifradas con Redis.Orchestrator Service (Java Spring Boot): Orquestación de lógica de negocio (saldos, movimientos) y consumo de microservicios con resiliencia (Circuit Breaker).Core Service (Python FastAPI): Persistencia de datos en base de datos relacional y validaciones de usuario/movimientos.Frontend: Interfaz de usuario básica para interacción con el sistema.🛠️ Tecnologías y PatronesLenguajes: Java 17, Node.js 20, Python 3.11.Bases de Datos: PostgreSQL y Redis (Sesiones).Resiliencia: Circuit Breaker implementado con Resilience4j en el orquestador.Observabilidad: Logs estructurados en formato JSON para trazabilidad.Documentación: Swagger/OpenAPI disponible en cada microservicio.🚀 Instrucciones de DesplieguePara facilitar la evaluación, todo el entorno está dockerizado. No es necesario instalar dependencias locales, solo requiere Docker y Docker Compose instalados y en ejecución.1. Levantar el proyectoDesde la raíz del proyecto, ejecuta:Bashdocker-compose up --build
2. Acceso a los serviciosUna vez que los contenedores estén arriba, puedes acceder a:ServicioURLDocumentación (Swagger)Orchestrator (Java)http://localhost:8080http://localhost:8080/swagger-ui.htmlAuth (Node.js)http://localhost:3001http://localhost:3001/api-docsCore (Python)http://localhost:8001http://localhost:8001/docsFrontendhttp://localhost:80N/A3. Comprobar Logs Estructurados

Para visualizar los logs en formato JSON de un servicio específico:Bashdocker-compose logs -f core-service
📋 
Alcance Funcional Implementado[x] 
Registro y Login de usuarios.[x] 
Cifrado de contraseñas y manejo de sesiones.[x] 
Consulta de saldos y movimientos.[x] 
Transferencias por número de teléfono.[x] 

Implementación de Circuit Breaker para tolerancia a fallos.
Notas de Desarrollo
Seguridad: Las sesiones se gestionan de forma cifrada en Redis para garantizar la integridad.Escalabilidad: Al ser microservicios independientes, cada componente puede escalar de forma horizontal según la carga.