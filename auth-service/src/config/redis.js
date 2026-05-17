const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Error Crítico de Conexión en Redis:', err));

// Auto-conectar al inicializar el hilo de Node
(async () => {
  await redisClient.connect();
  console.log('⚡ Conectado con éxito a Redis de Sesiones');
})();

module.exports = redisClient;