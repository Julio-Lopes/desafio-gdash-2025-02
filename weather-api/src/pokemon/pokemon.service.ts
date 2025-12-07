import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PokemonListResponseDto, PokemonDetailDto } from './dto/pokemon-list.dto';

@Injectable()
export class PokemonService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  constructor(private readonly httpService: HttpService) {}

  async getPokemonList(limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const url = `${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`;
      
      const { data } = await firstValueFrom(
        this.httpService.get<PokemonListResponseDto>(url),
      );

      // Busca detalhes básicos de cada pokemon para ter a imagem
      const pokemonWithDetails = await Promise.all(
        data.results.map(async (pokemon) => {
          const id = this.extractIdFromUrl(pokemon.url);
          return {
            id,
            name: pokemon.name,
            url: pokemon.url,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
          };
        }),
      );

      return {
        count: data.count,
        next: data.next,
        previous: data.previous,
        results: pokemonWithDetails,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(data.count / limit),
        limit,
        offset,
      };
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar lista de Pokémons',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getPokemonDetail(idOrName: string): Promise<PokemonDetailDto> {
    try {
      const url = `${this.baseUrl}/pokemon/${idOrName.toLowerCase()}`;
      
      const { data } = await firstValueFrom(
        this.httpService.get<PokemonDetailDto>(url),
      );

      // Busca informações da espécie para descrição
      const speciesUrl = `${this.baseUrl}/pokemon-species/${data.id}`;
      const { data: speciesData } = await firstValueFrom(
        this.httpService.get(speciesUrl),
      );

      // Pega a descrição
      const description = speciesData.flavor_text_entries.find(
        (entry: any) => entry.language.name === 'en',
      )?.flavor_text.replace(/\f/g, ' ');

      return {
        ...data,
        description,
        species: speciesData,
      } as any;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Pokémon não encontrado', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Erro ao buscar detalhes do Pokémon',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async searchPokemon(query: string): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/pokemon?limit=1000`),
      );

      const filtered = data.results.filter((pokemon: any) =>
        pokemon.name.includes(query.toLowerCase()),
      );

      const pokemonWithDetails = await Promise.all(
        filtered.slice(0, 20).map(async (pokemon: any) => {
          const id = this.extractIdFromUrl(pokemon.url);
          return {
            id,
            name: pokemon.name,
            url: pokemon.url,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
          };
        }),
      );

      return {
        count: filtered.length,
        results: pokemonWithDetails,
      };
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar Pokémons',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private extractIdFromUrl(url: string): number {
    const parts = url.split('/');
    return parseInt(parts[parts.length - 2], 10);
  }
}