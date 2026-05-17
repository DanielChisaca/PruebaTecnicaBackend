from fastapi import FastAPI
from app.database import engine, Base
from app.routers import accounts, movements
from app.logger import setup_logging, log_middleware
from app.routers import accounts, movements
from app.routers import users

# Inicializar configuración de structlog JSON
setup_logging()

# Crear tablas automáticamente al levantar el contenedor
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Core Service & Persistence (Python)",
    description="Microservicio encargado de validaciones profundas de negocio y persistencia en PostgreSQL",
    version="1.0.0",
    docs_url="/docs" # Requisito Swagger explícito
)

# Registrar middleware de observabilidad
app.middleware("http")(log_middleware)

# Incluir rutas de negocio bancario
app.include_router(accounts.router)
app.include_router(movements.router)

app.include_router(users.router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "UP", "service": "core-python"}