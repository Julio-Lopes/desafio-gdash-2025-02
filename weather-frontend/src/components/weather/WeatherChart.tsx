import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { WeatherLog } from '../../types/weather.types';
import { format } from 'date-fns';

interface WeatherChartProps {
  data: WeatherLog[];
}

export default function WeatherChart({ data }: WeatherChartProps) {
  const chartData = data
    .slice()
    .reverse()
    .map((log) => ({
      time: format(new Date(log.collected_at), 'HH:mm'),
      temperature: log.data.temperature,
      humidity: log.data.humidity,
      wind: log.data.wind_speed,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico nas últimas 24h</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#ef4444"
              name="Temperatura (°C)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="humidity"
              stroke="#3b82f6"
              name="Umidade (%)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}