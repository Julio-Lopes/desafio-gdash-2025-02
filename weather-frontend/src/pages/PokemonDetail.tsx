import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { pokemonService } from '../services/pokemon.service';
import type { PokemonDetail as PokemonDetailType } from '../types/pokemon.types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Heart, Zap, Shield, Swords, TrendingUp, Target } from 'lucide-react';
import { getPokemonTypeColor } from '../utils/formatters';

export default function PokemonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState<PokemonDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPokemon = async () => {
      if (!id) return;

      try {
        const data = await pokemonService.getDetail(id);
        setPokemon(data);
      } catch (error) {
        toast({
          title: 'Erro ao carregar Pokémon',
          description: 'Não foi possível carregar os detalhes do Pokémon',
          variant: 'destructive',
        });
        navigate('/pokedex');
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!pokemon) {
    return null;
  }

  const statIcons: Record<string, any> = {
    hp: Heart,
    attack: Swords,
    defense: Shield,
    'special-attack': Zap,
    'special-defense': Target,
    speed: TrendingUp,
  };

  const statNames: Record<string, string> = {
    hp: 'HP',
    attack: 'Ataque',
    defense: 'Defesa',
    'special-attack': 'Ataque Especial',
    'special-defense': 'Defesa Especial',
    speed: 'Velocidade',
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pokedex')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Imagem e Info Básica */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Badge variant="secondary" className="mb-4">
                  #{String(pokemon.id).padStart(3, '0')}
                </Badge>
                <h1 className="text-3xl font-bold capitalize mb-2">{pokemon.name}</h1>
                
                <div className="flex justify-center gap-2 mb-6">
                  {pokemon.types.map((type) => (
                    <Badge
                      key={type.type.name}
                      className={`${getPokemonTypeColor(type.type.name)} text-white`}
                    >
                      {type.type.name}
                    </Badge>
                  ))}
                </div>

                <div className="relative w-full h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-6">
                  <img
                    src={pokemon.sprites.other['official-artwork'].front_default}
                    alt={pokemon.name}
                    className="w-56 h-56 object-contain"
                  />
                </div>

                {pokemon.description && (
                  <p className="text-sm text-muted-foreground mb-6">
                    {pokemon.description}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Altura</p>
                    <p className="text-lg font-semibold">{pokemon.height / 10}m</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Peso</p>
                    <p className="text-lg font-semibold">{pokemon.weight / 10}kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">XP Base</p>
                    <p className="text-lg font-semibold">{pokemon.base_experience}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats e Habilidades */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pokemon.stats.map((stat) => {
                  const Icon = statIcons[stat.stat.name] || Heart;
                  const maxStat = 255;
                  const percentage = (stat.base_stat / maxStat) * 100;

                  return (
                    <div key={stat.stat.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {statNames[stat.stat.name] || stat.stat.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold">{stat.base_stat}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">
                      {pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Habilidades */}
            <Card>
              <CardHeader>
                <CardTitle>Habilidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pokemon.abilities.map((ability) => (
                    <div
                      key={ability.ability.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="capitalize font-medium">
                        {ability.ability.name.replace('-', ' ')}
                      </span>
                      {ability.is_hidden && (
                        <Badge variant="secondary" className="text-xs">
                          Oculta
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sprites */}
            <Card>
              <CardHeader>
                <CardTitle>Versões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Normal</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img
                        src={pokemon.sprites.front_default}
                        alt="Normal"
                        className="w-24 h-24 mx-auto"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Shiny</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img
                        src={pokemon.sprites.front_shiny}
                        alt="Shiny"
                        className="w-24 h-24 mx-auto"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}