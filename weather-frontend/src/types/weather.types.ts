export interface Location {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  cloud_cover: number;
  precipitation: number;
  precipitation_probability: number;
  pressure: number;
  weather_code: number;
  condition: string;
}

export interface WeatherLog {
  _id: string;
  location: Location;
  data: WeatherData;
  collected_at: string;
  source: string;
  ai_insights: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherStatistics {
  total: number;
  temperature: {
    avg: string;
    min: number;
    max: number;
  };
  humidity: {
    avg: string;
    min: number;
    max: number;
  };
  windSpeed: {
    avg: string;
    min: number;
    max: number;
  };
  lastUpdate: string;
}

export interface WeatherAlert {
  type: 'success' | 'info' | 'warning' | 'danger';
  title: string;
  message: string;
}

export interface WeatherInsights {
  period: string;
  description: string;
  averages: {
    temperature: string;
    humidity: string;
    rainProbability: string;
  };
  alerts: WeatherAlert[];
  insights: string[];
  dataPoints: number;
}