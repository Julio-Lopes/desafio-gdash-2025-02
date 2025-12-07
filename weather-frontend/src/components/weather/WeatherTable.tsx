import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { WeatherLog } from '../../types/weather.types';
import { formatDate, formatTemperature, formatPercentage, formatWindSpeed } from '../../utils/formatters';
import { Badge } from '../ui/badge';

interface WeatherTableProps {
  data: WeatherLog[];
  limit?: number;
}

export default function WeatherTable({ data, limit = 10 }: WeatherTableProps) {
  const displayData = limit ? data.slice(0, limit) : data;

  const getConditionColor = (condition: string) => {
    if (condition.includes('limpo') || condition.includes('Clear')) return 'bg-yellow-500';
    if (condition.includes('nublado') || condition.includes('cloudy')) return 'bg-gray-500';
    if (condition.includes('chuva') || condition.includes('rain')) return 'bg-blue-500';
    if (condition.includes('tempestade') || condition.includes('storm')) return 'bg-purple-700';
    return 'bg-gray-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registros Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead className="text-right">Temperatura</TableHead>
                <TableHead className="text-right">Umidade</TableHead>
                <TableHead className="text-right">Vento</TableHead>
                <TableHead className="text-right">Chuva</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium">
                      {formatDate(log.collected_at)}
                    </TableCell>
                    <TableCell>
                      {log.location.city}, {log.location.state}
                    </TableCell>
                    <TableCell>
                      <Badge className={getConditionColor(log.data.condition)}>
                        {log.data.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTemperature(log.data.temperature)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(log.data.humidity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatWindSpeed(log.data.wind_speed)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(log.data.precipitation_probability)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}