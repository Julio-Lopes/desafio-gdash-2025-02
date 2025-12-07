import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WeatherLog } from './schemas/weather-log.schema';
import { CreateWeatherLogDto } from './dto/create-weather-log.dto';
import { GeminiService } from './gemini.service';
import * as ExcelJS from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(WeatherLog.name) private weatherLogModel: Model<WeatherLog>,
    private geminiService: GeminiService,
  ) {}

  async create(createWeatherLogDto: CreateWeatherLogDto): Promise<WeatherLog> {
    const weatherLog = await this.weatherLogModel.create({
      ...createWeatherLogDto,
      collected_at: new Date(createWeatherLogDto.collected_at),
      ai_insights: '', 
    });

    console.log(`📊 Novo log climático registrado: ${weatherLog.location.city} - ${weatherLog.data.temperature}°C`);

    return weatherLog;
  }

  async findAll(limit = 100, skip = 0): Promise<WeatherLog[]> {
    return this.weatherLogModel
      .find()
      .sort({ collected_at: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<WeatherLog[]> {
    return this.weatherLogModel
      .find({
        collected_at: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ collected_at: -1 })
      .exec();
  }

  async getStatistics() {
    const logs = await this.weatherLogModel.find().exec();

    if (logs.length === 0) {
      return {
        total: 0,
        message: 'Nenhum registro encontrado',
      };
    }

    const temperatures = logs.map(log => log.data.temperature);
    const humidities = logs.map(log => log.data.humidity);
    const windSpeeds = logs.map(log => log.data.wind_speed);

    return {
      total: logs.length,
      temperature: {
        avg: (temperatures.reduce((a, b) => a + b, 0) / temperatures.length).toFixed(1),
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
      },
      humidity: {
        avg: (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1),
        min: Math.min(...humidities),
        max: Math.max(...humidities),
      },
      windSpeed: {
        avg: (windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length).toFixed(1),
        min: Math.min(...windSpeeds),
        max: Math.max(...windSpeeds),
      },
      lastUpdate: logs[0].collected_at,
    };
  }

  async getInsights(): Promise<any> {
    const logs = await this.weatherLogModel.find().sort({ collected_at: -1 }).limit(24).exec();

    if (logs.length === 0) {
      return {
        message: 'Dados insuficientes para gerar insights',
        description: 'Aguarde a coleta de dados meteorológicos',
        alerts: [],
        insights: [],
      };
    }

    const avgTemp = logs.reduce((sum, log) => sum + log.data.temperature, 0) / logs.length;
    const avgHumidity = logs.reduce((sum, log) => sum + log.data.humidity, 0) / logs.length;
    const rainProbability = logs.reduce((sum, log) => sum + log.data.precipitation_probability, 0) / logs.length;
    const avgWind = logs.reduce((sum, log) => sum + log.data.wind_speed, 0) / logs.length;

    // Usa a API Gemini para gerar insights inteligentes
    const aiResponse = await this.geminiService.generateWeatherInsights({
      avgTemp,
      avgHumidity,
      rainProbability,
      avgWind,
      dataPoints: logs.length,
    });

    // Análise de tendências
    const recentLogs = logs.slice(0, 6);
    const olderLogs = logs.slice(6, 12);
    
    if (recentLogs.length > 0 && olderLogs.length > 0) {
      const recentAvg = recentLogs.reduce((sum, log) => sum + log.data.temperature, 0) / recentLogs.length;
      const olderAvg = olderLogs.reduce((sum, log) => sum + log.data.temperature, 0) / olderLogs.length;
      
      if (recentAvg > olderAvg + 3) {
        aiResponse.insights.push('Tendência de aquecimento significativa detectada');
      } else if (recentAvg < olderAvg - 3) {
        aiResponse.insights.push('Tendência de resfriamento significativa detectada');
      }
    }

    return {
      period: '24 horas',
      description: aiResponse.description,
      averages: {
        temperature: avgTemp.toFixed(1),
        humidity: avgHumidity.toFixed(1),
        rainProbability: rainProbability.toFixed(1),
      },
      alerts: aiResponse.alerts,
      insights: aiResponse.insights,
      dataPoints: logs.length,
    };
  }

  async exportCSV(): Promise<string> {
    const logs = await this.weatherLogModel.find().sort({ collected_at: -1 }).exec();

    const filePath = path.join(process.cwd(), 'exports', `weather_${Date.now()}.csv`);
    
    // Cria diretório se não existir
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'date', title: 'Data' },
        { id: 'city', title: 'Cidade' },
        { id: 'state', title: 'Estado' },
        { id: 'temperature', title: 'Temperatura (°C)' },
        { id: 'feels_like', title: 'Sensação Térmica (°C)' },
        { id: 'humidity', title: 'Umidade (%)' },
        { id: 'wind_speed', title: 'Vento (km/h)' },
        { id: 'cloud_cover', title: 'Nuvens (%)' },
        { id: 'precipitation_probability', title: 'Prob. Chuva (%)' },
        { id: 'condition', title: 'Condição' },
      ],
    });

    const records = logs.map(log => ({
      date: log.collected_at.toISOString(),
      city: log.location.city,
      state: log.location.state,
      temperature: log.data.temperature,
      feels_like: log.data.feels_like,
      humidity: log.data.humidity,
      wind_speed: log.data.wind_speed,
      cloud_cover: log.data.cloud_cover,
      precipitation_probability: log.data.precipitation_probability,
      condition: log.data.condition,
    }));

    await csvWriter.writeRecords(records);

    return filePath;
  }

  async exportXLSX(): Promise<string> {
    const logs = await this.weatherLogModel.find().sort({ collected_at: -1 }).exec();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dados Climáticos');

    // Define colunas
    worksheet.columns = [
      { header: 'Data', key: 'date', width: 20 },
      { header: 'Cidade', key: 'city', width: 20 },
      { header: 'Estado', key: 'state', width: 15 },
      { header: 'Temperatura (°C)', key: 'temperature', width: 15 },
      { header: 'Sensação Térmica (°C)', key: 'feels_like', width: 20 },
      { header: 'Umidade (%)', key: 'humidity', width: 12 },
      { header: 'Vento (km/h)', key: 'wind_speed', width: 15 },
      { header: 'Nuvens (%)', key: 'cloud_cover', width: 12 },
      { header: 'Prob. Chuva (%)', key: 'precipitation_probability', width: 15 },
      { header: 'Condição', key: 'condition', width: 20 },
    ];

    // Estilo do cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    // Adiciona dados
    logs.forEach(log => {
      worksheet.addRow({
        date: log.collected_at.toISOString(),
        city: log.location.city,
        state: log.location.state,
        temperature: log.data.temperature,
        feels_like: log.data.feels_like,
        humidity: log.data.humidity,
        wind_speed: log.data.wind_speed,
        cloud_cover: log.data.cloud_cover,
        precipitation_probability: log.data.precipitation_probability,
        condition: log.data.condition,
      });
    });

    const filePath = path.join(process.cwd(), 'exports', `weather_${Date.now()}.xlsx`);
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);

    return filePath;
  }
}