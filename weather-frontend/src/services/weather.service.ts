import api from './api';
import type { WeatherLog, WeatherStatistics, WeatherInsights } from '../types/weather.types';

export const weatherService = {
  getLogs: async (limit = 100, skip = 0): Promise<WeatherLog[]> => {
    const { data } = await api.get(`/weather/logs?limit=${limit}&skip=${skip}`);
    return data;
  },

  getStatistics: async (): Promise<WeatherStatistics> => {
    const { data } = await api.get('/weather/statistics');
    return data;
  },

  getInsights: async (): Promise<WeatherInsights> => {
    const { data } = await api.get('/weather/insights');
    return data;
  },

  exportCSV: async (): Promise<Blob> => {
    const { data } = await api.get('/weather/export/csv', {
      responseType: 'blob',
    });
    return data;
  },

  exportXLSX: async (): Promise<Blob> => {
    const { data } = await api.get('/weather/export/xlsx', {
      responseType: 'blob',
    });
    return data;
  },
};