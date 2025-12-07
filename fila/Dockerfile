# Dockerfile para Fila Worker (Go)

# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependências
COPY go.mod go.sum ./

# Baixa as dependências
RUN go mod download

# Copia o código fonte
COPY main.go .

# Compila a aplicação
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worker .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copia o binário compilado do estágio anterior
COPY --from=builder /app/worker .

# Executa a aplicação
CMD ["./worker"]
