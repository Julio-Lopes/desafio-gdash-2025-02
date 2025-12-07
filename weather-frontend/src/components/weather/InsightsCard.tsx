import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import AlertCard from './AlertCard';
import type { WeatherInsights } from '../../types/weather.types';
import { Brain, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';

interface InsightsCardProps {
  insights: WeatherInsights;
}

export default function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <div className="space-y-4">
      {/* Descrição de IA - Destaque Principal */}
      {insights.description && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Sparkles className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-900 mb-1">
                  Análise de IA
                </h3>
                <p className="text-base text-purple-800 leading-relaxed">
                  {insights.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Alertas */}
      {insights.alerts && insights.alerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {insights.alerts.map((alert, index) => (
            <AlertCard key={index} alert={alert} />
          ))}
        </div>
      )}

      {/* Card de Insights Detalhados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle>Insights Detalhados</CardTitle>
            </div>
            <Badge variant="secondary">{insights.period}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Médias */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Temp. Média</p>
              <p className="text-2xl font-bold text-red-600">{insights.averages.temperature}°C</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Umidade Média</p>
              <p className="text-2xl font-bold text-blue-600">{insights.averages.humidity}%</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Prob. Chuva</p>
              <p className="text-2xl font-bold text-indigo-600">{insights.averages.rainProbability}%</p>
            </div>
          </div>

          {/* Lista de Insights */}
          {insights.insights && insights.insights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Recomendações:</h4>
              {insights.insights.map((insight, index) => (
                <Alert key={index} className="bg-gray-50">
                  <AlertDescription className="text-sm">
                    • {insight}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            Baseado em {insights.dataPoints} pontos de dados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}