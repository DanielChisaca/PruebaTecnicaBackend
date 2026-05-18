// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

// Mocks antes de cualquier import para interceptar las dependencias externas
jest.mock('../src/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
}));

jest.mock('axios');
jest.mock('bcrypt');

const request = require('supertest');
const app = require('../src/app');
const redisClient = require('../src/config/redis');
const axios = require('axios');
const bcrypt = require('bcrypt');

const USER_DB = {
  id: 1,
  username: 'testuser',
  password_hash: '$2b$10$hasheado',
  phone_number: '3001112233',
  document_type: 'CC',
  document_id: '123456789',
  email: 'test@example.com',
};

beforeEach(() => {
  jest.clearAllMocks();
});


// --- /health ---

describe('GET /health', () => {
  test('responde UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'UP', service: 'auth-node' });
  });
});


// --- POST /api/v1/auth/register ---

describe('POST /api/v1/auth/register', () => {
  const BODY = {
    username: 'testuser',
    documentType: 'CC',
    documentId: '123456789',
    email: 'test@example.com',
    password: 'secret123',
    phone_number: '3001112233',
  };

  test('registro exitoso → 201', async () => {
    bcrypt.hash.mockResolvedValue('hashed_password');
    axios.post.mockResolvedValue({ data: USER_DB });

    const res = await request(app).post('/api/v1/auth/register').send(BODY);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    // Verifica que se envió el hash al core-service (nunca la contraseña en texto plano)
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/core1/users/register'),
      expect.objectContaining({ password_hash: 'hashed_password' }),
      expect.any(Object)
    );
  });

  test('core-service rechaza duplicado → propaga 400', async () => {
    bcrypt.hash.mockResolvedValue('hashed_password');
    axios.post.mockRejectedValue({
      response: { status: 400, data: { detail: 'ya se encuentra registrado' } },
    });

    const res = await request(app).post('/api/v1/auth/register').send(BODY);

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('ya se encuentra registrado');
  });
});


// --- POST /api/v1/auth/login ---

describe('POST /api/v1/auth/login', () => {
  const BODY = { username: 'testuser', password: 'secret123' };

  test('usuario bloqueado → 423', async () => {
    redisClient.get.mockResolvedValue('BLOQUEADO');

    const res = await request(app).post('/api/v1/auth/login').send(BODY);

    expect(res.status).toBe(423);
    expect(res.body.status).toBe('BLOQUEADO');
    // No debe consultar al core-service si el usuario está bloqueado
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('contraseña incorrecta, primer intento → 401 con intentos restantes', async () => {
    redisClient.get.mockResolvedValue(null);        // no bloqueado
    axios.post.mockResolvedValue({ data: USER_DB });
    bcrypt.compare.mockResolvedValue(false);        // contraseña incorrecta
    redisClient.incr.mockResolvedValue(1);          // primer intento fallido

    const res = await request(app).post('/api/v1/auth/login').send(BODY);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('2 intentos');
  });

  test('tercer intento fallido → bloqueo 423', async () => {
    redisClient.get.mockResolvedValue(null);
    axios.post.mockResolvedValue({ data: USER_DB });
    bcrypt.compare.mockResolvedValue(false);
    redisClient.incr.mockResolvedValue(3);          // tercer intento → bloqueo

    const res = await request(app).post('/api/v1/auth/login').send(BODY);

    expect(res.status).toBe(423);
    expect(res.body.status).toBe('BLOQUEADO');
    expect(redisClient.setEx).toHaveBeenCalledWith(
      `lock:${BODY.username}`, 300, 'BLOQUEADO'
    );
    expect(redisClient.del).toHaveBeenCalledWith(`attempts:${BODY.username}`);
  });

  test('login exitoso → 200 con token y datos de usuario', async () => {
    redisClient.get.mockResolvedValue(null);
    axios.post.mockResolvedValue({ data: USER_DB });
    bcrypt.compare.mockResolvedValue(true);
    redisClient.setEx.mockResolvedValue('OK');
    redisClient.del.mockResolvedValue(1);

    const res = await request(app).post('/api/v1/auth/login').send(BODY);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toMatch(/^bearer-token-/);
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.user.phone_number).toBe('3001112233');
    // El token se guardó en Redis con expiración de 1 hora
    expect(redisClient.setEx).toHaveBeenCalledWith(
      expect.stringMatching(/^bearer-token-/),
      3600,
      expect.any(String)
    );
  });

  test('usuario no existe en core-service → 401 (oculta enumeración de usuarios)', async () => {
    redisClient.get.mockResolvedValue(null);
    axios.post.mockRejectedValue({
      response: { status: 404, data: { detail: 'Usuario no encontrado' } },
    });

    const res = await request(app).post('/api/v1/auth/login').send(BODY);

    // El servicio convierte 404 en 401 intencionalmente:
    // no revelar si el username existe o no (previene enumeración de usuarios)
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales incorrectas');
  });
});


// --- POST /api/v1/auth/logout ---

describe('POST /api/v1/auth/logout', () => {
  test('sin header Authorization → 400', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Token no provisto');
  });

  test('logout exitoso → 200 y token eliminado de Redis', async () => {
    redisClient.del.mockResolvedValue(1);

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', 'bearer-token-abc123');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(redisClient.del).toHaveBeenCalledWith('bearer-token-abc123');
  });
});


// --- POST /api/v1/auth/validate ---

describe('POST /api/v1/auth/validate', () => {
  test('sin header Authorization → 401', async () => {
    const res = await request(app).post('/api/v1/auth/validate');
    expect(res.status).toBe(401);
  });

  test('token inexistente o expirado → 401', async () => {
    redisClient.get.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/validate')
      .set('Authorization', 'bearer-token-expirado');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('inválida');
  });

  test('token válido → 200 con datos del usuario', async () => {
    const sessionData = JSON.stringify({
      id: 1,
      username: 'testuser',
      phone_number: '3001112233',
    });
    redisClient.get.mockResolvedValue(sessionData);

    const res = await request(app)
      .post('/api/v1/auth/validate')
      .set('Authorization', 'bearer-token-abc123');

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.user.username).toBe('testuser');
  });
});
