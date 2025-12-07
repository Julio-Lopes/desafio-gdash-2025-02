package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	amqp "github.com/rabbitmq/amqp091-go"
)

// Estruturas de dados
type Location struct {
	City      string  `json:"city"`
	State     string  `json:"state"`
	Country   string  `json:"country"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type WeatherData struct {
	Temperature              float64 `json:"temperature"`
	FeelsLike                float64 `json:"feels_like"`
	Humidity                 int     `json:"humidity"`
	WindSpeed                float64 `json:"wind_speed"`
	WindDirection            int     `json:"wind_direction"`
	CloudCover               int     `json:"cloud_cover"`
	Precipitation            float64 `json:"precipitation"`
	PrecipitationProbability int     `json:"precipitation_probability"`
	Pressure                 float64 `json:"pressure"`
	WeatherCode              int     `json:"weather_code"`
	Condition                string  `json:"condition"`
}

type WeatherMessage struct {
	Location    Location    `json:"location"`
	Data        WeatherData `json:"data"`
	CollectedAt string      `json:"collected_at"`
	Source      string      `json:"source"`
}

type Config struct {
	RabbitMQURL string
	QueueName   string
	APIURL      string
	MaxRetries  int
	RetryDelay  time.Duration
}

func loadConfig() Config {
	godotenv.Load()

	return Config{
		RabbitMQURL: getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		QueueName:   getEnv("RABBITMQ_QUEUE", "weather_data"),
		APIURL:      getEnv("API_URL", "http://localhost:3000/api/weather/logs"),
		MaxRetries:  3,
		RetryDelay:  time.Second * 5,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	config := loadConfig()

	log.Println("🚀 Iniciando Worker Go")
	log.Printf("📍 RabbitMQ: %s", config.RabbitMQURL)
	log.Printf("📦 Queue: %s", config.QueueName)
	log.Printf("🔗 API: %s", config.APIURL)
	log.Println(strings.Repeat("-", 60))

	// Conecta ao RabbitMQ
	conn, err := amqp.Dial(config.RabbitMQURL)
	if err != nil {
		log.Fatalf("❌ Falha ao conectar ao RabbitMQ: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("❌ Falha ao abrir canal: %v", err)
	}
	defer ch.Close()

	// Declara a fila
	q, err := ch.QueueDeclare(
		config.QueueName, // name
		true,             // durable
		false,            // delete when unused
		false,            // exclusive
		false,            // no-wait
		nil,              // arguments
	)
	if err != nil {
		log.Fatalf("❌ Falha ao declarar fila: %v", err)
	}

	// Configura QoS
	err = ch.Qos(
		1,     // prefetch count
		0,     // prefetch size
		false, // global
	)
	if err != nil {
		log.Fatalf("❌ Falha ao configurar QoS: %v", err)
	}

	// Consome mensagens
	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatalf("❌ Falha ao registrar consumidor: %v", err)
	}

	log.Println("✅ Worker conectado e aguardando mensagens...")

	forever := make(chan bool)

	go func() {
		for d := range msgs {
			processMessage(d, config, ch)
		}
	}()

	<-forever
}

func processMessage(d amqp.Delivery, config Config, ch *amqp.Channel) {
	log.Printf("\n📨 Nova mensagem recebida")

	// Parse do JSON
	var weatherMsg WeatherMessage
	err := json.Unmarshal(d.Body, &weatherMsg)
	if err != nil {
		log.Printf("❌ Erro ao fazer parse do JSON: %v", err)
		log.Printf("Body: %s", string(d.Body))
		d.Nack(false, false) // Não recoloca na fila
		return
	}

	// Valida dados
	if !validateWeatherData(weatherMsg) {
		log.Printf("⚠️  Dados inválidos, rejeitando mensagem")
		d.Nack(false, false)
		return
	}

	log.Printf("📍 Localização: %s, %s", weatherMsg.Location.City, weatherMsg.Location.State)
	log.Printf("🌡️  Temperatura: %.1f°C", weatherMsg.Data.Temperature)
	log.Printf("💧 Umidade: %d%%", weatherMsg.Data.Humidity)
	log.Printf("☁️  Condição: %s", weatherMsg.Data.Condition)

	// Envia para a API com retry
	success := sendToAPI(weatherMsg, config)

	if success {
		log.Println("✅ Mensagem processada e enviada para API")
		d.Ack(false)
	} else {
		log.Println("❌ Falha ao enviar para API, rejeitando mensagem")
		d.Nack(false, false)
	}
}

func validateWeatherData(msg WeatherMessage) bool {
	// Validações básicas
	if msg.Location.City == "" {
		log.Println("⚠️  Cidade vazia")
		return false
	}

	if msg.Data.Temperature < -100 || msg.Data.Temperature > 100 {
		log.Printf("⚠️  Temperatura fora do range: %.1f", msg.Data.Temperature)
		return false
	}

	if msg.Data.Humidity < 0 || msg.Data.Humidity > 100 {
		log.Printf("⚠️  Umidade fora do range: %d", msg.Data.Humidity)
		return false
	}

	return true
}

func sendToAPI(msg WeatherMessage, config Config) bool {
	jsonData, err := json.Marshal(msg)
	if err != nil {
		log.Printf("❌ Erro ao serializar JSON: %v", err)
		return false
	}

	// Tenta enviar com retry
	for attempt := 1; attempt <= config.MaxRetries; attempt++ {
		log.Printf("🔄 Tentativa %d/%d de enviar para API...", attempt, config.MaxRetries)

		resp, err := http.Post(
			config.APIURL,
			"application/json",
			bytes.NewBuffer(jsonData),
		)

		if err != nil {
			log.Printf("⚠️  Erro na requisição: %v", err)
			if attempt < config.MaxRetries {
				log.Printf("⏳ Aguardando %v antes de tentar novamente...", config.RetryDelay)
				time.Sleep(config.RetryDelay)
				continue
			}
			return false
		}

		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			log.Printf("✅ API respondeu com sucesso: %d", resp.StatusCode)
			return true
		}

		log.Printf("⚠️  API respondeu com erro: %d - %s", resp.StatusCode, string(body))

		if attempt < config.MaxRetries {
			log.Printf("⏳ Aguardando %v antes de tentar novamente...", config.RetryDelay)
			time.Sleep(config.RetryDelay)
		}
	}

	return false
}
