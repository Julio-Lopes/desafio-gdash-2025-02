import requests
import json
import pika
import time
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configurações
CITY_NAME = os.getenv('CITY_NAME', 'Boa Esperança')
STATE = os.getenv('STATE', 'Minas Gerais')
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', 5672))
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASSWORD = os.getenv('RABBITMQ_PASSWORD', 'guest')
RABBITMQ_QUEUE = os.getenv('RABBITMQ_QUEUE', 'weather_data')
COLLECTION_INTERVAL = int(os.getenv('COLLECTION_INTERVAL', 3600))  # 1 hora em segundos

class WeatherCollector:
    def __init__(self):
        self.geocoding_url = "https://geocoding-api.open-meteo.com/v1/search"
        self.weather_url = "https://api.open-meteo.com/v1/forecast"
        self.location_cache = None
        self.connection = None
        self.channel = None
        
    def connect_rabbitmq(self):
        """Conecta ao RabbitMQ"""
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
            parameters = pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                port=RABBITMQ_PORT,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declara a fila como durável
            self.channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)
            
            print(f"✅ Conectado ao RabbitMQ em {RABBITMQ_HOST}:{RABBITMQ_PORT}")
            return True
        except Exception as e:
            print(f"❌ Erro ao conectar ao RabbitMQ: {e}")
            return False
    
    def get_location(self):
        """Busca coordenadas da cidade (com cache)"""
        if self.location_cache:
            return self.location_cache
        
        try:
            params = {
                'name': CITY_NAME,
                'count': 5,
                'language': 'pt',
                'format': 'json'
            }
            
            response = requests.get(self.geocoding_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'results' not in data or len(data['results']) == 0:
                print(f"❌ Cidade não encontrada: {CITY_NAME}")
                return None
            
            # Filtra pela região/estado
            location = None
            for result in data['results']:
                admin1 = result.get('admin1', '')
                country_code = result.get('country_code', '')
                if STATE in admin1 and country_code.upper() == 'BR':
                    location = result
                    break
            
            if not location:
                location = data['results'][0]
            
            self.location_cache = {
                'name': location['name'],
                'state': location.get('admin1', STATE),
                'country': location.get('country', 'Brasil'),
                'latitude': location['latitude'],
                'longitude': location['longitude']
            }
            
            print(f"📍 Localização: {self.location_cache['name']}, {self.location_cache['state']}")
            return self.location_cache
            
        except Exception as e:
            print(f"❌ Erro ao buscar localização: {e}")
            return None
    
    def get_weather_data(self):
        """Coleta dados meteorológicos"""
        location = self.get_location()
        if not location:
            return None
        
        try:
            params = {
                'latitude': location['latitude'],
                'longitude': location['longitude'],
                'current': [
                    'temperature_2m',
                    'relative_humidity_2m',
                    'apparent_temperature',
                    'precipitation',
                    'weather_code',
                    'cloud_cover',
                    'wind_speed_10m',
                    'wind_direction_10m',
                    'pressure_msl'
                ],
                'hourly': 'precipitation_probability',
                'timezone': 'America/Sao_Paulo',
                'forecast_days': 1
            }
            
            response = requests.get(self.weather_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            current = data['current']
            
            # Calcula probabilidade de chuva
            precipitation_probability = 0
            if 'hourly' in data and 'precipitation_probability' in data['hourly']:
                hourly_probs = data['hourly']['precipitation_probability']
                valid_probs = [p for p in hourly_probs[:6] if p is not None]
                if valid_probs:
                    precipitation_probability = max(valid_probs)
            
            # Monta payload normalizado
            weather_payload = {
                'location': {
                    'city': location['name'],
                    'state': location['state'],
                    'country': location['country'],
                    'latitude': location['latitude'],
                    'longitude': location['longitude']
                },
                'data': {
                    'temperature': round(current['temperature_2m'], 1),
                    'feels_like': round(current['apparent_temperature'], 1),
                    'humidity': current['relative_humidity_2m'],
                    'wind_speed': round(current['wind_speed_10m'], 1),
                    'wind_direction': current['wind_direction_10m'],
                    'cloud_cover': current['cloud_cover'],
                    'precipitation': current.get('precipitation', 0),
                    'precipitation_probability': precipitation_probability,
                    'pressure': current.get('pressure_msl', 0),
                    'weather_code': current['weather_code'],
                    'condition': self.get_weather_description(current['weather_code'])
                },
                'collected_at': datetime.utcnow().isoformat() + 'Z',
                'source': 'open-meteo'
            }
            
            return weather_payload
            
        except Exception as e:
            print(f"❌ Erro ao coletar dados meteorológicos: {e}")
            return None
    
    def get_weather_description(self, code):
        """Descrição da condição climática"""
        codes = {
            0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado',
            3: 'Nublado', 45: 'Neblina', 48: 'Neblina com geada',
            51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa densa',
            61: 'Chuva leve', 63: 'Chuva moderada', 65: 'Chuva forte',
            71: 'Neve leve', 73: 'Neve moderada', 75: 'Neve forte',
            77: 'Granizo', 80: 'Pancadas de chuva leves',
            81: 'Pancadas de chuva moderadas', 82: 'Pancadas de chuva fortes',
            95: 'Tempestade'
        }
        return codes.get(code, 'Desconhecido')
    
    def publish_to_queue(self, data):
        """Publica dados na fila RabbitMQ"""
        try:
            message = json.dumps(data, ensure_ascii=False)
            
            self.channel.basic_publish(
                exchange='',
                routing_key=RABBITMQ_QUEUE,
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,  
                    content_type='application/json'
                )
            )
            
            print(f"✅ Dados publicados na fila: {data['location']['city']} - {data['data']['temperature']}°C")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao publicar na fila: {e}")
            return False
    
    def run(self):
        """Loop principal de coleta"""
        print(f"🌤️  Iniciando coletor de dados meteorológicos")
        print(f"📍 Cidade: {CITY_NAME}, {STATE}")
        print(f"⏰ Intervalo: {COLLECTION_INTERVAL} segundos ({COLLECTION_INTERVAL/3600} hora(s))")
        print(f"🔗 RabbitMQ: {RABBITMQ_HOST}:{RABBITMQ_PORT} - Fila: {RABBITMQ_QUEUE}")
        print("-" * 60)
        
        while True:
            try:
                # Reconecta ao RabbitMQ se necessário
                if not self.connection or self.connection.is_closed:
                    if not self.connect_rabbitmq():
                        print("⏳ Aguardando 30 segundos antes de tentar reconectar...")
                        time.sleep(30)
                        continue
                
                # Coleta dados
                print(f"\n🔄 Coletando dados... ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
                weather_data = self.get_weather_data()
                
                if weather_data:
                    # Publica na fila
                    if self.publish_to_queue(weather_data):
                        print(f"✅ Coleta concluída com sucesso")
                    else:
                        print(f"⚠️  Falha ao publicar dados")
                else:
                    print(f"⚠️  Falha ao coletar dados")
                
                # Aguarda próximo ciclo
                print(f"⏳ Próxima coleta em {COLLECTION_INTERVAL} segundos...")
                time.sleep(COLLECTION_INTERVAL)
                
            except KeyboardInterrupt:
                print("\n\n🛑 Encerrando coletor...")
                break
            except Exception as e:
                print(f"❌ Erro no loop principal: {e}")
                time.sleep(30)
        
        # Cleanup
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            print("👋 Conexão com RabbitMQ encerrada")

if __name__ == '__main__':
    collector = WeatherCollector()
    collector.run()