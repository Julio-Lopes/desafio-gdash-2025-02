import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import UserTable from '../components/users/UserTable';
import UserForm from '../components/users/UserForm';
import { userService, type User, type CreateUserDto, type UpdateUserDto } from '../services/user.service';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { UserPlus, RefreshCw } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: CreateUserDto | UpdateUserDto) => {
    setFormLoading(true);
    try {
      if (selectedUser) {
        await userService.update(selectedUser._id, data as UpdateUserDto);
        toast({
          title: 'Usuário atualizado',
          description: 'Usuário atualizado com sucesso',
        });
      } else {
        await userService.create(data as CreateUserDto);
        toast({
          title: 'Usuário criado',
          description: 'Usuário criado com sucesso',
        });
      }
      setFormOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar usuário',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await userService.delete(userId);
      toast({
        title: 'Usuário excluído',
        description: 'Usuário excluído com sucesso',
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Erro ao excluir usuário',
        description: 'Não foi possível excluir o usuário',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os usuários do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleCreate}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <UserTable
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Form Dialog */}
      <UserForm
        open={formOpen}
        user={selectedUser}
        onClose={() => {
          setFormOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />
    </Layout>
  );
}