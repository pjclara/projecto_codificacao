import GenericTable from '@/components/table/GenericTable';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import { Save, XCircle } from 'lucide-react';
import React, { useState } from 'react';
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
        setForm({ name: role.name, permissions: role.permissions.map((p) => p.id) });
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
        setForm((f) => ({ ...f, permissions: f.permissions.includes(id) ? f.permissions.filter((pid) => pid !== id) : [...f.permissions, id] }));
    };

    const handleCreatePermissionChange = (id: number) => {
        setCreateForm((f) => ({
            ...f,
            permissions: f.permissions.includes(id) ? f.permissions.filter((pid) => pid !== id) : [...f.permissions, id],
        }));
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
            setCreateForm({ name: '', permissions: [] }); // limpar o formulário após criação bem-sucedida
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
            setRoles(roles.map((r) => (r.id === editRole.id ? response.data.role : r)));
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
            setRoles(roles.filter((r) => r.id !== role.id));
            toast.success('Role removida com sucesso!');
        } catch (error) {
            toast.error('Erro ao apagar role.');
        }
    };

    return (
        <>
            <AppLayout breadcrumbs={[{ title: 'Roles', href: '/roles' }]}>
                <div className="mx-auto py-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-800">Roles</h1>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen} modal={false}>
                            <DialogTrigger asChild>
                                <button
                                    className="rounded bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
                                    onClick={() => setCreateOpen(true)}
                                >
                                    Adicionar Role
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Novo Role</DialogTitle>
                                    <DialogDescription>Preencha os dados para criar um novo role.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                                    <div>
                                        <Label htmlFor="create-name">Nome</Label>
                                        <Input id="create-name" name="name" value={createForm.name} onChange={handleCreateChange} required />
                                    </div>
                                    <div>
                                        <Label>Permissões</Label>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {permissions.map((p) => (
                                                <label key={p.id} className="flex items-center gap-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={createForm.permissions.includes(p.id)}
                                                        onChange={() => handleCreatePermissionChange(p.id)}
                                                    />
                                                    {p.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" variant="default" size="default">
                                            <Save size={16} /> Guardar
                                        </Button>
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary" size="default">
                                                <XCircle size={16} /> Cancelar
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <GenericTable
                        data={roles}
                        columns={[
                            { key: 'name', label: 'Nome' },
                            { key: 'permissions', label: 'Permissões', render: (role) => role.permissions.map((p) => p.name).join(', ') },
                        ]}
                        actions={[
                            { label: 'Editar', onClick: openEdit, className: 'bg-blue-500 hover:bg-blue-600' },
                            { label: 'Apagar', onClick: handleDelete, className: 'bg-red-500 hover:bg-red-600' },
                        ]}
                    />
                    {/* Single reusable dialog */}
                    <Dialog
                        modal={false}
                        open={editOpen}
                        onOpenChange={(open) => {
                            if (!open) closeEdit();
                        }}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Role</DialogTitle>
                                <DialogDescription>Update role and click "Save".</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" value={form.name} onChange={handleChange} required />
                                </div>
                                <div>
                                    <Label>Permissions</Label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {permissions.map((p) => (
                                            <label key={p.id} className="flex items-center gap-1">
                                                <input
                                                    type="checkbox"
                                                    checked={form.permissions.includes(p.id)}
                                                    onChange={() => handlePermissionChange(p.id)}
                                                />
                                                {p.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" variant="default" size="default">
                                        <Save size={16} /> Guardar
                                    </Button>
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary" size="default">
                                            <XCircle size={16} /> Cancelar
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </AppLayout>
        </>
    );
};

export default RolesIndex;
