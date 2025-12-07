import Layout from '../components/layout/Layout';
import PokemonList from '../components/pokemon/PokemonList';

export default function Pokedex() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pokédex</h1>
          <p className="text-muted-foreground mt-1">
            Explore todos os Pokémons disponíveis
          </p>
        </div>

        <PokemonList />
      </div>
    </Layout>
  );
}