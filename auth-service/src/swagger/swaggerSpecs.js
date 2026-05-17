const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth & Identity Service API (Node.js)',
      version: '1.0.0',
      description: 'Microservicio encargado del registro de usuarios, login con encriptación Bcrypt y caché de sesiones en Redis',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de desarrollo local'
      },
    ],
    // Declaramos los paths de forma estructurada en JS para evitar errores de YAML
    paths: {
      '/api/v1/auth/register': {
        post: {
          summary: 'Registra un usuario cifrando su contraseña',
          description: 'Cifra con Bcrypt y delega la persistencia al Core de Python.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    documentType: { type: 'string' },
                    documentId: { type: 'string' },
                    email: { type: 'string' },
                    password: { type: 'string' },
                    phone_number: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Usuario registrado exitosamente.' },
            400: { description: 'Error en la solicitud.' }
          }
        }
      },
      '/api/v1/auth/login': {
        post: {
          summary: 'Inicia sesión y genera un token en Redis',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login exitoso, devuelve token.' },
            401: { description: 'Credenciales incorrectas.' }
          }
        }
      },
      '/api/v1/auth/logout': {
        post: {
          summary: 'Cierra la sesión revocando el token de Redis',
          responses: {
            200: { description: 'Sesión cerrada correctamente.' }
          }
        }
      },
      '/api/v1/auth/validate': {
        post: {
          summary: 'Validación interna de token para el Orquestador Java',
          responses: {
            200: { description: 'Estado del token.' }
          }
        }
      }
    }
  },
  apis: [], // Dejamos esto vacío para que no intente parsear comentarios problemáticos
};

module.exports = swaggerJsdoc(options);