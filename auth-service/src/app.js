require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRouter = require('./routers/authRouter');
const correlationMiddleware = require('./middlewares/correlation');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger/swaggerSpecs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  credentials: true
}));

app.use(express.json());
app.use(correlationMiddleware);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/api/v1/auth', authRouter);

app.get('/health', (req, res) => {
  res.json({ status: "UP", service: "auth-node" });
});

app.listen(PORT, () => {
  console.log(`🚀 Auth Service levantado de forma limpia en el puerto ${PORT}`);
  console.log(`📖 Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
});