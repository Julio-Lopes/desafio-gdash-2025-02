# Weather System 🌤️

> Sistema completo para coleta, processamento e visualização de dados meteorológicos em tempo real, utilizando arquitetura de microserviços com Python, Go, NestJS e React.

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go&logoColor=white)](https://golang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação Rápida com Docker](#-instalação-rápida-com-docker)
- [Configuração de Variáveis de Ambiente](#-configuração-de-variáveis-de-ambiente)
- [Executando o Sistema](#-executando-o-sistema)
- [Acessando os Serviços](#-acessando-os-serviços)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Visão Geral

O **Weather System** é uma solução para monitoramento meteorológico que integra múltiplas tecnologias modernas. O sistema coleta dados de APIs públicas, processa informações através de filas de mensagens e disponibiliza uma interface intuitiva para visualização e análise.

### ✨ Principais Características

- ⚡ **Coleta Automática**: Dados meteorológicos coletados a cada hora via Open-Meteo API
- 🔄 **Processamento Assíncrono**: Sistema de filas com RabbitMQ para alta disponibilidade
- 🔐 **Autenticação Segura**: JWT com refresh tokens e controle de permissões
- 📊 **Dashboard Interativo**: Visualizações em tempo real com gráficos responsivos
- 🤖 **Análises com IA**: Integração com Google Gemini para insights meteorológicos
- 🎮 **Pokédex Integrada**: Consulta de Pokémons via PokéAPI
- 📥 **Exportação Flexível**: Dados em CSV e Excel para análises externas
- 🐳 **Deploy Simplificado**: Containerização completa com Docker Compose

---

## 🏗 Arquitetura

O sistema utiliza uma arquitetura de microserviços distribuída:

```
┌─────────────────────────────────────────────────────────────┐
│                     WEATHER SYSTEM                          │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────┐
│  Python Script        │ 📡 Coleta dados meteorológicos
│  weather_collector.py │                                    
└────────┬──────────────┘
         │ JSON
         ▼
┌──────────────────┐
│    RabbitMQ      │  📬 Fila de mensagens (AMQP)
│  Message Queue   │
└────────┬─────────┘
         │ JSON
         ▼
┌──────────────────┐
│   Go Worker      │  ⚙️ Processador de mensagens
│   fila/main.go   │
└────────┬─────────┘
         │ HTTP POST
         ▼
┌──────────────────┐      ┌──────────────────┐
│   NestJS API     │◄─────┤  React Frontend  │  💻 Interface Web
│   weather-api    │ REST │ weather-frontend │
└────────┬─────────┘      └──────────────────┘
         │ MongoDB
         ▼
┌──────────────────┐
│    MongoDB       │  🗄️ Banco de dados NoSQL
└──────────────────┘
```

### Fluxo de Dados

1. **Python Collector** busca dados da Open-Meteo API
2. **RabbitMQ** armazena mensagens em fila
3. **Go Worker** consome e processa mensagens
4. **NestJS API** recebe e persiste no MongoDB
5. **React Frontend** exibe dados em tempo real

---

## 🚀 Tecnologias

### Backend

- **Python 3.11** - Coleta de dados com `requests` e `pika`
- **Go 1.21+** - Worker de alta performance com `amqp` e `goroutines`
- **NestJS** - Framework Node.js com TypeScript, decorators e dependency injection
- **MongoDB** - Banco NoSQL para armazenamento de séries temporais

### Frontend

- **React 18** - Biblioteca UI com hooks e context API
- **TypeScript** - Tipagem estática para maior segurança
- **Vite** - Build tool moderna e rápida
- **Tailwind CSS** - Framework CSS utilitário
- **Recharts** - Biblioteca de gráficos responsivos

### Infraestrutura

- **Docker** - Containerização de serviços
- **Docker Compose** - Orquestração multi-container
- **RabbitMQ** - Message broker AMQP
- **Nginx** - Servidor web para frontend
- **JWT** - Autenticação stateless

### APIs Externas

- **Open-Meteo API** - Dados meteorológicos gratuitos
- **Google Gemini API** - Análises com IA
- **PokéAPI** - Dados de Pokémons

---

## 📦 Pré-requisitos

```bash
✅ Docker 20.10+
✅ Docker Compose 2.0+
```

**Opcional (apenas para desenvolvimento local sem Docker):**
- Python 3.11+
- Go 1.21+
- Node.js 18+
- MongoDB 7+
- RabbitMQ 3.12+

---

## 🐳 Instalação Rápida com Docker

### 1. Clone o Repositório

```bash
git clone *url-do-repositorio*
cd weather-system
```

### 2. Configure Variáveis de Ambiente

O arquivo `.env` na raiz já contém todas as configurações necessárias com valores padrão para desenvolvimento. Você pode editá-lo conforme necessário:

```bash
# Edite o arquivo .env se necessário
# notepad .env    # Windows
# nano .env       # Linux/Mac
```

**Principais variáveis que você pode querer alterar:**

```env
# Cidade para coleta de dados
WEATHER_CITY=São Paulo
WEATHER_STATE=São Paulo

# Intervalo de coleta em segundos (padrão: 1 hora)
COLLECTION_INTERVAL=3600

# Google Gemini API
# GEMINI_API_KEY=your-gemini-api-key-here

JWT_SECRET=change-this-super-secret-key-in-production-use-minimum-32-characters
DEFAULT_ADMIN_PASSWORD=admin123
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest
```

### 3. Inicie Todos os Serviços

```bash
# Cria e inicia todos os containers
docker-compose up -d

# Ou com logs em tempo real
docker-compose up
```

O Docker Compose irá:
1. ✅ Construir as imagens dos 4 serviços
2. ✅ Iniciar MongoDB e RabbitMQ
3. ✅ Aguardar serviços de infraestrutura ficarem saudáveis
4. ✅ Iniciar Weather API
5. ✅ Iniciar Coleta de Dados (Python)
6. ✅ Iniciar Worker de Fila (Go)
7. ✅ Iniciar Frontend (React)

```

**Tempo estimado de inicialização:** ~1-2 minutos

---

## 🌐 Acessando os Serviços

Após a inicialização completa, os serviços estarão disponíveis em:

| Serviço | URL | Credenciais Padrão |
|---------|-----|-------------------|
| 🌐 **Frontend** | http://localhost:5173 | Email: `admin@example.com`<br>Senha: `123456` |
| 🔌 **API REST** | http://localhost:3000/api | - |
| 📖 **Swagger API Docs** | http://localhost:3000/api/docs | - |

### Primeiro Acesso

1. Acesse http://localhost:5173
2. Faça login com as credenciais padrão

---

## 🔧 Configuração de Variáveis de Ambiente

Todas as variáveis de ambiente estão centralizadas no arquivo `.env` na raiz do projeto:

### 📋 Variáveis Principais

```env
# RabbitMQ
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_QUEUE_NAME=weather_queue

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/weather_system

# Weather API (NestJS)
PORT=3000
NODE_ENV=production
JWT_SECRET=<seu-secret-aqui>
JWT_EXPIRES_IN=7d

# Admin padrão
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_NAME=Administrator

# Coleta de Dados
WEATHER_CITY=São Paulo
WEATHER_STATE=São Paulo
COLLECTION_INTERVAL=3600

# Google Gemini API (opcional)
# GEMINI_API_KEY=your-api-key

# Frontend
VITE_API_URL=http://localhost:3000/api

# Portas expostas no host
RABBITMQ_AMQP_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672
MONGODB_PORT=27017
API_PORT=3000
FRONTEND_PORT=5173
```

### ⚠️ Segurança em Produção

**NUNCA use as credenciais padrão em produção!** Altere:

1. `JWT_SECRET` - Use no mínimo 32 caracteres aleatórios
2. `DEFAULT_ADMIN_PASSWORD` - Senha forte
3. `RABBITMQ_DEFAULT_USER` e `RABBITMQ_DEFAULT_PASS` - Credenciais customizadas
4. Adicione autenticação ao MongoDB

---

## 🚀 Executando o Sistema

### Comandos Docker Compose Essenciais

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (⚠️ apaga dados!)
docker-compose down -v

# Reconstruir imagens após alterações no código
docker-compose up -d --build

# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f weather-api
docker-compose logs -f coleta-de-dados
docker-compose logs -f fila
docker-compose logs -f weather-frontend

# Reiniciar um serviço específico
docker-compose restart weather-api

# Verificar status dos containers
docker-compose ps

# Entrar em um container
docker-compose exec weather-api sh
docker-compose exec mongodb mongosh

# Ver uso de recursos
docker stats
```

### Desenvolvimento Local (Opcional)

Se preferir executar os serviços localmente sem Docker:

#### 1. Inicie apenas a infraestrutura

```bash
# Inicia apenas MongoDB e RabbitMQ
docker-compose up -d mongodb rabbitmq
```

#### 2. Configure cada serviço

Crie arquivos `.env` específicos em cada diretório se necessário, ou use as variáveis do `.env` principal.

#### 3. Execute cada serviço manualmente

**Weather API (Terminal 1):**
```bash
cd weather-api
npm install
npm run start:dev
```

**Coleta de Dados (Terminal 2):**
```bash
cd coleta-de-dados
pip install -r requirements.txt
python weather_collector.py
```

**Fila Worker (Terminal 3):**
```bash
cd fila
go mod download
go run main.go
```

**Frontend (Terminal 4):**
```bash
cd weather-frontend
npm install
npm run dev
```

---

## 📊 Funcionalidades

### 🔐 Autenticação e Usuários

- Login/Registro com JWT
- Controle de permissões (admin/user)
- Gerenciamento de usuários (CRUD)
- Sessão persistente com refresh tokens

### 🌤️ Monitoramento Meteorológico

- Dashboard com dados em tempo real
- Gráficos de temperatura, umidade, vento
- Histórico de medições
- Filtros por período
- Estatísticas agregadas
- Insights com IA (Google Gemini)

### 📥 Exportação de Dados

- Export para CSV
- Export para Excel (XLSX)
- Filtros customizáveis
- Download direto pelo navegador

### 🎮 Pokédex

- Consulta de Pokémons via PokéAPI
- Listagem com paginação
- Detalhes completos (stats, tipos, habilidades)
- Busca por nome/número
- Sprites e artwork oficial

---

## 📁 Estrutura do Projeto

```
weather-system/
├── 📄 .env                          # Variáveis de ambiente centralizadas
├── 📄 docker-compose.yml            # Orquestração de todos os serviços
├── 📄 README.md                     # Este arquivo
│
├── 📂 coleta-de-dados/             # Serviço Python - Coleta de dados
│   ├── 🐳 Dockerfile               # Container Python
│   ├── 📄 requirements.txt         # Dependências Python
│   └── 🐍 weather_collector.py     # Script de coleta
│
├── 📂 fila/                        # Serviço Go - Worker de fila
│   ├── 🐳 Dockerfile               # Container Go (multi-stage)
│   ├── 📄 go.mod                   # Dependências Go
│   ├── 📄 go.sum                   # Lock file Go
│   └── 🔧 main.go                  # Worker principal
│
├── 📂 weather-api/                 # Serviço NestJS - API REST
│   ├── 🐳 Dockerfile               # Container Node (multi-stage)
│   ├── 📄 package.json             # Dependências Node
│   ├── 📄 tsconfig.json            # Config TypeScript
│   ├── 📄 nest-cli.json            # Config NestJS
│   ├── 📂 src/
│   │   ├── 📂 auth/                # Módulo de autenticação JWT
│   │   ├── 📂 users/               # Módulo de usuários
│   │   ├── 📂 weather/             # Módulo de dados meteorológicos
│   │   ├── 📂 pokemon/             # Módulo de integração PokéAPI
│   │   └── 📄 main.ts              # Entry point
│   └── 📂 exports/                 # Arquivos CSV/Excel gerados
│
└── 📂 weather-frontend/            # Serviço React - Interface web
    ├── 🐳 Dockerfile               # Container Node + Nginx (multi-stage)
    ├── 📄 nginx.conf               # Config nginx para SPA
    ├── 📄 package.json             # Dependências Node
    ├── 📄 vite.config.ts           # Config Vite
    ├── 📄 tailwind.config.js       # Config Tailwind CSS
    └── 📂 src/
        ├── 📂 components/          # Componentes React
        ├── 📂 pages/               # Páginas da aplicação
        ├── 📂 services/            # Serviços de API
        ├── 📂 store/               # Estado global (Zustand)
        └── 📂 types/               # TypeScript types
```

---

## 🔌 API Reference

### Base URL

```
http://localhost:3000/api
```

### 📖 Documentação Interativa

Acesse a documentação Swagger completa em:

```
http://localhost:3000/api/docs
```

### Principais Endpoints

#### 🔐 Autenticação

```http
POST /auth/register          # Registrar novo usuário
POST /auth/login             # Login e obter JWT
GET  /auth/profile           # Obter perfil do usuário logado
```

#### 👥 Usuários (Apenas Admin)

```http
GET    /users                # Listar todos os usuários
GET    /users/:id            # Obter usuário por ID
POST   /users                # Criar novo usuário
PATCH  /users/:id            # Atualizar usuário
DELETE /users/:id            # Remover usuário
```

#### 🌤️ Dados Meteorológicos

```http
GET  /weather/logs           # Listar logs meteorológicos
POST /weather/logs           # Criar novo log
GET  /weather/logs/:id       # Obter log por ID
GET  /weather/stats          # Estatísticas agregadas
GET  /weather/export/csv     # Exportar para CSV
GET  /weather/export/excel   # Exportar para Excel
GET  /weather/insights       # Insights com IA (Gemini)
```

#### 🎮 Pokémon

```http
GET  /pokemon                # Listar Pokémons (paginado)
GET  /pokemon/:id            # Obter detalhes do Pokémon
```

### Autenticação nas Requisições

Adicione o token JWT no header:

```http
Authorization: Bearer <seu-token-jwt>
```

---

## 👨‍💻 Autor

Desenvolvido com ❤️ para demonstrar uma arquitetura moderna de microserviços.

---

## 🙏 Agradecimentos

- [Open-Meteo](https://open-meteo.com/) - API meteorológica gratuita
- [PokéAPI](https://pokeapi.co/) - API de Pokémon gratuita
- [Google Gemini](https://ai.google.dev/) - IA generativa
- Comunidade open-source pelos excelentes frameworks e ferramentas

---

## ✨ Funcionalidades

### 🌤️ Dashboard Meteorológico

- 📊 Visualização em tempo real de temperatura, umidade, pressão
- 📈 Gráficos interativos com histórico de 24h/7dias/30dias
- 🗺️ Mapa com localização da estação meteorológica
- 🔄 Atualização automática a cada minuto
- 📥 Exportação de dados em CSV/Excel

**Dados Coletados:**
- Temperatura (°C) e sensação térmica
- Umidade relativa do ar (%)
- Velocidade e direção do vento (km/h)
- Pressão atmosférica (hPa)
- Cobertura de nuvens (%)
- Precipitação (mm) e probabilidade
- Código e descrição das condições meteorológicas

### 👥 Gerenciamento de Usuários

- ✅ CRUD completo (Create, Read, Update, Delete)
- 🔐 Autenticação JWT com refresh tokens
- 👑 Controle de permissões (Admin/User)
- 🔒 Senhas criptografadas com bcrypt
- 📝 Logs de auditoria

**Permissões:**
- **Admin**: Acesso total ao sistema
- **User**: Apenas visualização de dados

### 🎮 Pokédex Integrada

- 📱 Lista completa de Pokémons (1ª geração)
- 🔍 Busca por nome ou número
- 📊 Detalhes completos: tipos, stats, habilidades
- 🎨 Interface responsiva com tema Pokémon
- ⚡ Dados em tempo real via PokéAPI

### 🤖 Análises com IA

- 💡 Insights automáticos sobre condições meteorológicas
- 📈 Previsões e tendências
- ⚠️ Alertas de condições adversas
- 📝 Relatórios em linguagem natural

### 📊 Exportação de Dados

**Formatos Suportados:**
- 📄 CSV (valores separados por vírgula)
- 📊 Excel (.xlsx) com formatação
- 📋 JSON via API REST

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais como desafio técnico GDash.

**Uso Educacional**
- ✅ Uso para aprendizado

---

## 👨‍💻 Autor

Desenvolvido com ☕ e 💙 para o desafio técnico GDash.

**Links:**
- LinkedIn: [seu-perfil](https://www.linkedin.com/in/julio-cesar-ribeiro-lopes-0039ba244/)

---

<div align="center">

[⬆ Voltar ao topo](#weather-system-)

</div>