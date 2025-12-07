# Dockerfile para Coleta de Dados (Python)
FROM python:3.11-slim

# Define o diretório de trabalho
WORKDIR /app

# Copia o arquivo de dependências
COPY requirements.txt .

# Instala as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY weather_collector.py .

# Comando para executar a aplicação
CMD ["python", "-u", "weather_collector.py"]
