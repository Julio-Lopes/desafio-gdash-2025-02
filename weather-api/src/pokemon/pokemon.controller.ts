import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PokemonService } from './pokemon.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('pokemon')
@ApiBearerAuth('JWT-auth')
@Controller('pokemon')
@UseGuards(JwtAuthGuard)
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pokémons com paginação' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset para paginação', example: 0 })
  @ApiResponse({ status: 200, description: 'Lista de pokémons' })
  async getPokemonList(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    
    return this.pokemonService.getPokemonList(limitNum, offsetNum);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar pokémon por nome' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Nome do pokémon', example: 'pikachu' })
  @ApiResponse({ status: 200, description: 'Pokémon encontrado' })
  async searchPokemon(@Query('q') query: string) {
    return this.pokemonService.searchPokemon(query);
  }

  @Get(':idOrName')
  @ApiOperation({ summary: 'Buscar pokémon por ID ou nome' })
  @ApiResponse({ status: 200, description: 'Detalhes do pokémon' })
  @ApiResponse({ status: 404, description: 'Pokémon não encontrado' })
  async getPokemonDetail(@Param('idOrName') idOrName: string) {
    return this.pokemonService.getPokemonDetail(idOrName);
  }
}