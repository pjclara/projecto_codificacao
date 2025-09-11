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

interface Props {
  permissions: Permission[];
}

const PermissionsIndex: React.FC<Props> = ({ permissions: initialPermissions }) => {
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [editPermission, setEditPermission] = useState<Permission | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '' });
  const [createLoading, setCreateLoading] = useState(false);

  const openEdit = (permission: Permission) => {
    setEditPermission(permission);
    setForm({ name: permission.name });
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditPermission(null);
    setEditOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const response = await axios.post('/permissions', createForm);
      setPermissions([response.data.permission, ...permissions]);
      toast.success(response.data.message);
      setCreateOpen(false);
    } catch (error) {
      toast.error('Erro ao criar permissão.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPermission) return;
    setLoading(true);
    try {
      const response = await axios.put(`/permissions/${editPermission.id}`, form);
      setPermissions(permissions.map(p => (p.id === editPermission.id ? response.data.permission : p)));
      toast.success(response.data.message);
      closeEdit();
    } catch (error) {
      toast.error('Erro ao atualizar permissão.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (!window.confirm(`Tem a certeza que deseja apagar a permissão ${permission.name}?`)) return;
    try {
      await axios.delete(`/permissions/${permission.id}`);
      setPermissions(permissions.filter(p => p.id !== permission.id));
      toast.success('Permissão removida com sucesso!');
    } catch (error) {
      toast.error('Erro ao apagar permissão.');
    }
  };

  return (
    <>
      <ToastContainer />
      <AppLayout breadcrumbs={[{ title: 'Permissões', href: '/permissions' }]}> 
        <div className="max-w-4xl mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Permissões</h1>
            <Dialog open={createOpen} onOpenChange={setCreateOpen} modal={false}>
              <DialogTrigger asChild>
                <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition" onClick={() => setCreateOpen(true)}>
                  Adicionar Permissão
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Permissão</DialogTitle>
                  <DialogDescription>Preencha o nome da permissão.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="create-name">Nome</Label>
                    <Input id="create-name" name="name" value={createForm.name} onChange={handleCreateChange} required />
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
                <th className="py-3 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(permission => (
                <tr key={permission.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="py-3 px-6 whitespace-nowrap">{permission.name}</td>
                  <td className="py-3 px-6 text-center">
                    <Dialog modal={false} open={editOpen && editPermission?.id === permission.id} onOpenChange={open => { if (!open) closeEdit(); }}>
                      <DialogTrigger asChild>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded mr-2 transition" onClick={() => openEdit(permission)}>
                          Editar
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Permissão</DialogTitle>
                          <DialogDescription>Altere o nome da permissão e clique em "Guardar" para atualizar.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" value={form.name} onChange={handleChange} required />
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
                    <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded transition" onClick={() => handleDelete(permission)}>
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

export default PermissionsIndex;
