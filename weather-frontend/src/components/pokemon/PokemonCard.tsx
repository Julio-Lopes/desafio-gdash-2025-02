import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Pokemon } from '../../types/pokemon.types';
import { useNavigate } from 'react-router-dom';

interface PokemonCardProps {
  pokemon: Pokemon;
}

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => navigate(`/pokedex/${pokemon.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center">
          {/* Imagem */}
          <div className="relative w-full h-40 flex items-center justify-center bg-gray-50 rounded-lg mb-3">
            <img
              src={pokemon.image}
              alt={pokemon.name}
              className="w-32 h-32 object-contain"
              loading="lazy"
            />
          </div>

          {/* Info */}
          <div className="text-center w-full">
            <Badge variant="secondary" className="mb-2">
              #{String(pokemon.id).padStart(3, '0')}
            </Badge>
            <h3 className="font-semibold text-lg capitalize">
              {pokemon.name}
            </h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}