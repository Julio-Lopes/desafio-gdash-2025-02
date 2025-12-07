import { useState, useEffect } from 'react';
import { pokemonService } from '../../services/pokemon.service';
import type { PokemonListResponse } from '../../types/pokemon.types';
import PokemonCard from './PokemonCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '../ui/use-toast';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function PokemonList() {
  const [data, setData] = useState<PokemonListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  const fetchPokemon = async (offset: number) => {
    setLoading(true);
    try {
      const response = await pokemonService.getList(20, offset);
      setData(response);
    } catch (error) {
      toast({
        title: 'Erro ao carregar Pokémons',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPokemon(0);
      return;
    }

    setSearching(true);
    try {
      const response = await pokemonService.search(searchQuery);
      setData({
        count: response.count,
        next: null,
        previous: null,
        results: response.results,
        currentPage: 1,
        totalPages: 1,
        limit: 20,
        offset: 0,
      });
    } catch (error) {
      toast({
        title: 'Erro ao buscar Pokémon',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchPokemon(0);
  }, []);

  const handlePrevious = () => {
    if (data && data.previous) {
      fetchPokemon(data.offset - data.limit);
    }
  };

  const handleNext = () => {
    if (data && data.next) {
      fetchPokemon(data.offset + data.limit);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar Pokémon por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={searching}>
          {searching ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {/* Pokemon Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : data && data.results.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.results.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {data.results.length} de {data.count} Pokémons
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={!data.previous || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <div className="text-sm">
                Página {data.currentPage} de {data.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!data.next || loading}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum Pokémon encontrado
        </div>
      )}
    </div>
  );
}