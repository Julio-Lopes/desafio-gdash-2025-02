import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import WeatherCard from '../components/weather/WeatherCard';
import WeatherChart from '../components/weather/WeatherChart';
import WeatherTable from '../components/weather/WeatherTable';
import InsightsCard from '../components/weather/InsightsCard';
import { weatherService } from '../services/weather.service';
import type { WeatherLog, WeatherStatistics, WeatherInsights } from '../types/weather.types';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../components/ui/use-toast';
import { downloadFile } from '../utils/formatters';
import {
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Download,
  RefreshCw,
  CloudRain,
} from 'lucide-react';

export default function Dashboard() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [statistics, setStatistics] = useState<WeatherStatistics | null>(null);
  const [insights, setInsights] = useState<WeatherInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [logsData, statsData, insightsData] = await Promise.all([
        weatherService.getLogs(50, 0),
        weatherService.getStatistics(),
        weatherService.getInsights(),
      ]);

      setLogs(logsData);
      setStatistics(statsData);
      setInsights(insightsData);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error?.response?.data?.message || error?.message || 'Não foi possível carregar os dados meteorológicos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleExport = async (type: 'csv' | 'xlsx') => {
    setExporting(type);
    try {
      const blob = type === 'csv' 
        ? await weatherService.exportCSV()
        : await weatherService.exportXLSX();
      
      const filename = `weather_export_${Date.now()}.${type}`;
      downloadFile(blob, filename);
      
      toast({
        title: 'Exportação concluída',
        description: `Arquivo ${filename} baixado com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar os dados',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  const latestLog = logs[0];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Meteorológico</h1>
            <p className="text-muted-foreground mt-1">
              {latestLog
                ? `${latestLog.location.city}, ${latestLog.location.state}`
                : 'Carregando localização...'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={!!exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'csv' ? 'Exportando...' : 'CSV'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('xlsx')}
              disabled={!!exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'xlsx' ? 'Exportando...' : 'XLSX'}
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        {statistics && statistics.total > 0 && latestLog && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <WeatherCard
              title="Temperatura"
              value={`${latestLog.data.temperature}°C`}
              icon={Thermometer}
              subtitle={`Sensação: ${latestLog.data.feels_like}°C`}
              color="text-red-500"
            />
            <WeatherCard
              title="Umidade"
              value={`${latestLog.data.humidity}%`}
              icon={Droplets}
              subtitle={`Média: ${statistics.humidity.avg}%`}
              color="text-blue-500"
            />
            <WeatherCard
              title="Vento"
              value={`${latestLog.data.wind_speed} km/h`}
              icon={Wind}
              subtitle={`Média: ${statistics.windSpeed.avg} km/h`}
              color="text-cyan-500"
            />
            <WeatherCard
              title="Prob. Chuva"
              value={`${latestLog.data.precipitation_probability}%`}
              icon={CloudRain}
              subtitle={insights?.averages.rainProbability ? `Média 24h: ${insights.averages.rainProbability}%` : 'Últimas 24h'}
              color="text-indigo-500"
            />
            <WeatherCard
              title="Condição"
              value={latestLog.data.condition}
              icon={Cloud}
              subtitle={`${latestLog.location.city}`}
              color="text-gray-500"
            />
          </div>
        )}

        {/* Insights de IA */}
        {insights && (
          <InsightsCard insights={insights} />
        )}

        {/* Gráfico */}
        {logs.length > 0 && (
          <WeatherChart data={logs.slice(0, 24)} />
        )}

        {/* Tabela de Registros */}
        {logs.length > 0 && (
          <WeatherTable data={logs} limit={15} />
        )}

        {/* Mensagem quando não há dados */}
        {logs.length === 0 && (
          <div className="text-center py-12">
            <Cloud className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum dado disponível
            </h3>
            <p className="text-gray-600 mb-4">
              O sistema ainda não coletou dados meteorológicos.
            </p>
            <p className="text-sm text-gray-500">
              Aguarde alguns minutos para que os dados sejam coletados automaticamente.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}