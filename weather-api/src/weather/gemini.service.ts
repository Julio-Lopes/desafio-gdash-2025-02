import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

interface GeminiResponse {
  description: string;
  alerts: Array<{
    type: 'success' | 'info' | 'warning' | 'danger';
    title: string;
    message: string;
  }>;
  insights: string[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; 

  private readonly apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  async generateWeatherInsights(weatherData: {
    avgTemp: number;
    avgHumidity: number;
    rainProbability: number;
    avgWind: number;
    dataPoints: number;
  }): Promise<GeminiResponse> {
    if (!this.apiKey || this.apiKey === 'your-gemini-api-key-here') {
      throw new Error(
        'Gemini API key not configured. Please add GEMINI_API_KEY to .env file',
      );
    }

    const prompt = this.buildPrompt(weatherData);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
              topP: 0.95,
              topK: 40,
              responseMimeType: 'application/json',
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': this.apiKey,
            },
            timeout: 15000, 
          },
        );

        // Verificar finishReason
        const candidate = response.data?.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (finishReason === 'MAX_TOKENS') {
          this.logger.warn(
            `Tentativa ${attempt}: Resposta truncada (MAX_TOKENS). Retentando...`,
          );
          
          lastError = new Error('Response truncated due to MAX_TOKENS');
          
          if (attempt < this.MAX_RETRIES) {
            await this.sleep(this.RETRY_DELAY * attempt);
            continue;
          }
          throw new Error('Gemini API retornou resposta truncada após múltiplas tentativas');
        }

        const aiText = candidate?.content?.parts?.[0]?.text;

        if (!aiText) {
          this.logger.warn(
            `Tentativa ${attempt}: Resposta vazia da Gemini API`,
            JSON.stringify(response.data),
          );
          
          lastError = new Error('Empty response from Gemini API');
          
          if (attempt < this.MAX_RETRIES) {
            await this.sleep(this.RETRY_DELAY * attempt);
            continue;
          }
          throw new Error('Gemini API retornou resposta vazia após múltiplas tentativas');
        }

        return this.parseGeminiResponse(aiText);
      } catch (error) {
        const err = error as AxiosError;
        lastError = err;

        if (err.response?.status === 503) {
          this.logger.warn(
            `Tentativa ${attempt}/${this.MAX_RETRIES}: Modelo sobrecarregado (503). Aguardando ${this.RETRY_DELAY * attempt}ms...`,
          );
          
          if (attempt < this.MAX_RETRIES) {
            await this.sleep(this.RETRY_DELAY * attempt);
            continue;
          }
        } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
          this.logger.warn(
            `Tentativa ${attempt}/${this.MAX_RETRIES}: Timeout. Retentando...`,
          );
          
          if (attempt < this.MAX_RETRIES) {
            await this.sleep(this.RETRY_DELAY);
            continue;
          }
        }

        if (err.response) {
          this.logger.error(
            `Erro na chamada à Gemini API: ${err.response.status} - ${JSON.stringify(err.response.data)}`,
          );
        } else {
          this.logger.error(
            `Erro na chamada à Gemini API: ${err.message}`,
            err.stack,
          );
        }

        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Falha ao gerar insights com a Gemini API após ${this.MAX_RETRIES} tentativas`);
        }
      }
    }

    throw lastError || new Error('Erro inesperado ao chamar Gemini API');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildPrompt(data: {
    avgTemp: number;
    avgHumidity: number;
    rainProbability: number;
    avgWind: number;
  }): string {
    return `Analise: Temp ${data.avgTemp.toFixed(1)}°C, Umidade ${data.avgHumidity.toFixed(1)}%, Chuva ${data.rainProbability.toFixed(1)}%, Vento ${data.avgWind.toFixed(1)}km/h. 

Retorne JSON:
{
  "description": "breve análise",
  "alerts": [{"type": "info", "title": "título", "message": "mensagem curta"}],
  "insights": ["dica 1", "dica 2"]
}

Tipos: success, info, warning, danger. Máximo 2 alertas e 3 insights. Seja direto.`;
  }

  private parseGeminiResponse(aiText: string): GeminiResponse {
    let cleanText = aiText.trim();
    cleanText = cleanText.replace(/```json\n?/g, '');
    cleanText = cleanText.replace(/```\n?/g, '');
    cleanText = cleanText.trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      this.logger.warn(
        'Falha ao fazer parse do JSON. Tentando extrair JSON parcial...',
        cleanText.substring(0, 200),
      );

      // Tentar extrair JSON parcial usando regex
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          this.logger.log('JSON parcial extraído com sucesso');
        } catch (e2) {
          this.logger.error('Falha ao extrair JSON parcial');
          throw new Error('Invalid JSON returned from Gemini API');
        }
      } else {
        throw new Error('Invalid JSON returned from Gemini API');
      }
    }

    // Validação e valores padrão
    return {
      description: parsed.description || 'Análise meteorológica disponível',
      alerts: Array.isArray(parsed.alerts)
        ? parsed.alerts.slice(0, 3).map((alert: any) => ({
            type: ['success', 'info', 'warning', 'danger'].includes(alert.type)
              ? alert.type
              : 'info',
            title: alert.title || 'Informação',
            message: alert.message || '',
          }))
        : [],
      insights: Array.isArray(parsed.insights)
        ? parsed.insights.slice(0, 5).filter((i: any) => typeof i === 'string')
        : [],
    };
  }
}
