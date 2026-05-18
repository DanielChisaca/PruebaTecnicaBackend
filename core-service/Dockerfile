FROM python:3.11-slim

# Directorio de trabajo en la raíz
WORKDIR /

RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el contenido a la carpeta /app
COPY . ./app

EXPOSE 8001

# Ajustamos el PYTHONPATH para que incluya la raíz y la carpeta app
ENV PYTHONPATH="/:/app"

# Las tablas se crean automáticamente al arrancar desde main.py con Base.metadata.create_all()
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]