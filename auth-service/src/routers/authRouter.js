const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const redisClient = require('../config/redis');
const logger = require('../logger/jsonLogger');

const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL;

router.post('/register', async (req, res) => {
  const startTime = Date.now();
  const { username, documentType, documentId, email, password, phone_number } = req.body;
  const operation = "POST /auth/register";

  try {
    logger.info(`Iniciando flujo de registro para usuario: ${username}`, req, {
      operation,
      sessionId: username
    });
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const coreResponse = await axios.post(`${CORE_SERVICE_URL}/core1/users/register`, {
      document_type: documentType,
      document_id: documentId,
      email,
      username,
      phone_number,
      password_hash: hashedPassword
    }, {
      headers: { 'X-Correlation-ID': req.correlationId || req.headers?.['x-correlation-id'] }
    });

    logger.info(`Persistencia exitosa en PostgreSQL a través de Python para: ${username}`, req, {
      operation,
      sessionId: username,
      durationMs: Date.now() - startTime,
      httpStatus: 201
    });

    return res.status(201).json({ status: "success", data: coreResponse.data });

  } catch (err) {
    const httpStatus = err.response?.status || 400;
    logger.error('Error en el proceso de registro', req, {
      operation,
      sessionId: username || "N/A",
      durationMs: Date.now() - startTime,
      httpStatus,
      errorCode: "REGISTRATION_FAILED",
      message: err.response?.data?.detail || err.message
    });

    return res.status(httpStatus).json({ 
      error: "Error al procesar el registro", 
      details: err.response?.data?.detail || err.message 
    });
  }
});

router.post('/login', async (req, res) => {
  const startTime = Date.now();
  const { username, password } = req.body;
  const operation = "POST /auth/login";
  
  const lockKey = `lock:${username}`;
  const attemptsKey = `attempts:${username}`;

  try {
    logger.info(`Intento de login para usuario: ${username}`, req, {
      operation,
      sessionId: username
    });

    // Verificar si el usuario se encuentra bloqueado actualmente
    const isLocked = await redisClient.get(lockKey);
    if (isLocked) {
      logger.info(`Intento de login rechazado. Usuario BLOQUEADO temporalmente: ${username}`, req, {
        operation,
        sessionId: username,
        status: "BLOQUEADO",
        durationMs: Date.now() - startTime,
        httpStatus: 423
      });

      return res.status(423).json({ 
        status: "BLOQUEADO",
        error: "Tu usuario ha sido bloqueado temporalmente por exceso de intentos fallidos. Intenta más tarde." 
      });
    }

    const userResponse = await axios.post(`${CORE_SERVICE_URL}/core1/users/login`, {
      username: username
    }, {
      headers: { 'X-Correlation-ID': req.correlationId || req.headers?.['x-correlation-id'] }
    });
    const dbUser = userResponse.data;

    // Comparar contraseñas hashes con bcrypt
    const match = await bcrypt.compare(password, dbUser.password_hash);

    if (!match) {
      const currentAttempts = await redisClient.incr(attemptsKey);
      
      if (currentAttempts === 1) {
        await redisClient.expire(attemptsKey, 600); 
      }

      logger.info(`Credenciales inválidas para el usuario: ${username}. Intento fallido #${currentAttempts}`, req, {
        operation,
        sessionId: username,
        status: "INVALID_CREDENTIALS",
        httpStatus: 401
      });

      // Evaluar si superó el límite establecido (3 intentos)
      if (currentAttempts >= 3) {
        await redisClient.setEx(lockKey, 300, "BLOQUEADO");
        await redisClient.del(attemptsKey); 
        
        logger.info(`Límite alcanzado. Usuario ${username} pasa a estado BLOQUEADO por 5 minutos`, req, {
          operation,
          sessionId: username,
          status: "ACCOUNT_LOCKED",
          durationMs: Date.now() - startTime,
          httpStatus: 423
        });

        return res.status(423).json({ 
          status: "BLOQUEADO",
          error: "Has superado el límite de intentos permitidos. Tu usuario ha sido BLOQUEADO por 5 minutos." 
        });
      }

      return res.status(401).json({ 
        error: `Credenciales incorrectas. Te quedan ${3 - currentAttempts} intentos.` 
      });
    }

    // LOGIN EXITOSO: Limpiamos rastros de intentos fallidos previos si existían
    await redisClient.del(attemptsKey);

    // Crear el token de sesión y guardarlo en Redis incluyendo el phone_number
    const sessionToken = `bearer-token-${uuidv4()}`;

    await redisClient.setEx(sessionToken, 3600, JSON.stringify({ 
      id: dbUser.id, 
      username: username, 
      phone_number: dbUser.phone_number,
      loginTime: new Date() 
    }));

    logger.info(`Sesión de usuario almacenada en Redis de forma segura`, req, {
      operation,
      sessionId: username,
      durationMs: Date.now() - startTime,
      httpStatus: 200
    });

    return res.json({ 
      status: "success", 
      token: sessionToken,
      user: {
          id: dbUser.id, 
          username: username,
          phone_number: dbUser.phone_number
      }
    });

  } catch (err) {
    const durationMs = Date.now() - startTime;
    
    if (err.response?.status === 404) {
      logger.info(`Credenciales incorrectas: El usuario ${username} no existe en base de datos.`, req, {
        operation,
        sessionId: username || "N/A",
        status: "USER_NOT_FOUND",
        durationMs,
        httpStatus: 401
      });
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    
    logger.error('Fallo interno en proceso de login', req, {
      operation,
      sessionId: username || "N/A",
      durationMs,
      httpStatus: 500,
      errorCode: "LOGIN_INTERNAL_ERROR",
      message: err.message
    });

    return res.status(500).json({ error: "Error interno en el servidor" });
  }
});

router.post('/logout', async (req, res) => {
  const startTime = Date.now();
  const token = req.header('Authorization');
  const operation = "POST /auth/logout";

  if (!token) return res.status(400).json({ error: "Token no provisto" });

  try {
    await redisClient.del(token);
    logger.info(`Token revocado de Redis correctamente. Sesión cerrada.`, req, {
      operation,
      durationMs: Date.now() - startTime,
      httpStatus: 200
    });
    return res.json({ status: "success", message: "Sesión cerrada correctamente" });
  } catch (err) {
    logger.error('Error al revocar sesión en Redis', req, {
      operation,
      durationMs: Date.now() - startTime,
      httpStatus: 500,
      errorCode: "LOGOUT_CACHE_ERROR",
      message: err.message
    });
    return res.status(500).json({ error: "Error al procesar logout" });
  }
});

router.post('/validate', async (req, res) => {
  const startTime = Date.now();
  const token = req.header('Authorization');
  const operation = "POST /auth/validate";

  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const sessionData = await redisClient.get(token);
    if (!sessionData) {
      return res.status(401).json({ error: "Sesión inválida o expirada" });
    }
    const parsedUser = JSON.parse(sessionData);
    return res.json({ valid: true, user: parsedUser });
  } catch (err) {
    return res.status(500).json({ error: "Error de comunicación en caché" });
  }
});

module.exports = router;