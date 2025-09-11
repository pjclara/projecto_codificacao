import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

interface Props {
  roles: Role[];
  permissions: Permission[];
}

const RolesIndex: React.FC<Props> = ({ roles: initialRoles, permissions }) => {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', permissions: [] as number[] });
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', permissions: [] as number[] });
  const [createLoading, setCreateLoading] = useState(false);

  const openEdit = (role: Role) => {
    setEditRole(role);
    setForm({ name: role.name, permissions: role.permissions.map(p => p.id) });
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditRole(null);
    setEditOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handlePermissionChange = (id: number) => {
    setForm(f => ({ ...f, permissions: f.permissions.includes(id) ? f.permissions.filter(pid => pid !== id) : [...f.permissions, id] }));
  };

  const handleCreatePermissionChange = (id: number) => {
    setCreateForm(f => ({ ...f, permissions: f.permissions.includes(id) ? f.permissions.filter(pid => pid !== id) : [...f.permissions, id] }));
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const response = await axios.post('/roles', createForm);
      setRoles([response.data.role, ...roles]);
      toast.success(response.data.message);
      setCreateOpen(false);
    } catch (error) {
      toast.error('Erro ao criar role.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRole) return;
    setLoading(true);
    try {
      const response = await axios.put(`/roles/${editRole.id}`, form);
      setRoles(roles.map(r => (r.id === editRole.id ? response.data.role : r)));
      toast.success(response.data.message);
      closeEdit();
    } catch (error) {
      toast.error('Erro ao atualizar role.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!window.confirm(`Tem a certeza que deseja apagar o role ${role.name}?`)) return;
    try {
      await axios.delete(`/roles/${role.id}`);
      setRoles(roles.filter(r => r.id !== role.id));
      toast.success('Role removida com sucesso!');
    } catch (error) {
      toast.error('Erro ao apagar role.');
    }
  };

  return (
    <>
      <ToastContainer />
      <AppLayout breadcrumbs={[{ title: 'Roles', href: '/roles' }]}> 
        <div className="max-w-4xl mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Roles</h1>
            <Dialog open={createOpen} onOpenChange={setCreateOpen} modal={false}>
              <DialogTrigger asChild>
                <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition" onClick={() => setCreateOpen(true)}>
                  Adicionar Role
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Role</DialogTitle>
                  <DialogDescription>Preencha os dados para criar um novo role.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="create-name">Nome</Label>
                    <Input id="create-name" name="name" value={createForm.name} onChange={handleCreateChange} required />
                  </div>
                  <div>
                    <Label>Permissões</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {permissions.map(p => (
                        <label key={p.id} className="flex items-center gap-1">
                          <input type="checkbox" checked={createForm.permissions.includes(p.id)} onChange={() => handleCreatePermissionChange(p.id)} />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <button type="submit" disabled={createLoading} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition">
                      {createLoading ? 'A criar...' : 'Criar'}
                    </button>
                    <DialogClose asChild>
                      <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition">Cancelar</button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Nome</th>
                <th className="py-3 px-6 text-left">Permissões</th>
                <th className="py-3 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="py-3 px-6 whitespace-nowrap">{role.name}</td>
                  <td className="py-3 px-6 whitespace-nowrap">
                    {role.permissions.map(p => p.name).join(', ')}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Dialog modal={false} open={editOpen && editRole?.id === role.id} onOpenChange={open => { if (!open) closeEdit(); }}>
                      <DialogTrigger asChild>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded mr-2 transition" onClick={() => openEdit(role)}>
                          Editar
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Role</DialogTitle>
                          <DialogDescription>Altere os dados do role e clique em "Guardar" para atualizar.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" value={form.name} onChange={handleChange} required />
                          </div>
                          <div>
                            <Label>Permissões</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {permissions.map(p => (
                                <label key={p.id} className="flex items-center gap-1">
                                  <input type="checkbox" checked={form.permissions.includes(p.id)} onChange={() => handlePermissionChange(p.id)} />
                                  {p.name}
                                </label>
                              ))}
                            </div>
                          </div>
                          <DialogFooter>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition">Guardar</button>
                            <DialogClose asChild>
                              <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition">Cancelar</button>
                            </DialogClose>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded transition" onClick={() => handleDelete(role)}>
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppLayout>
    </>
  );
};

export default RolesIndex;
