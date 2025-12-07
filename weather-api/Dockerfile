# Build stage
FROM node:18.20.5-alpine3.20 AS builder

# Adiciona usuário não-privilegiado
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copia os arquivos de dependências
COPY --chown=nestjs:nodejs package*.json ./

# Instala as dependências
RUN npm ci --only=production && \
    npm cache clean --force

# Copia o código fonte
COPY --chown=nestjs:nodejs . .

# Compila a aplicação NestJS
RUN npm run build

# Runtime stage
FROM node:18.20.5-alpine3.20

# Instala atualizações de segurança
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init

# Adiciona usuário não-privilegiado
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copia os arquivos de dependências
COPY --chown=nestjs:nodejs package*.json ./

# Instala apenas as dependências de produção
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Copia o código compilado do estágio anterior
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Cria o diretório de exports com permissões adequadas
RUN mkdir -p /app/exports && \
    chown -R nestjs:nodejs /app

# Muda para usuário não-privilegiado
USER nestjs

# Expõe a porta da aplicação
EXPOSE 3000

# Usa dumb-init para lidar com sinais adequadamente
ENTRYPOINT ["dumb-init", "--"]

# Comando para executar a aplicação
CMD ["node", "dist/main"]