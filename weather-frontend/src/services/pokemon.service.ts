import api from './api';
import type { PokemonListResponse, PokemonDetail } from '../types/pokemon.types';

export const pokemonService = {
  getList: async (limit = 20, offset = 0): Promise<PokemonListResponse> => {
    const { data } = await api.get(`/pokemon?limit=${limit}&offset=${offset}`);
    return data;
  },

  getDetail: async (idOrName: string): Promise<PokemonDetail> => {
    const { data } = await api.get(`/pokemon/${idOrName}`);
    return data;
  },

  search: async (query: string): Promise<{ count: number; results: any[] }> => {
    const { data } = await api.get(`/pokemon/search?q=${query}`);
    return data;
  },
};