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
    permissions?: { name: string }[]; // Add this if the `permissions` property is optional and contains an array of objects with a `name` property
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
            setCreateForm({ name: '' });
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
            setPermissions(permissions.map((p) => (p.id === editPermission.id ? response.data.permission : p)));
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
            setPermissions(permissions.filter((p) => p.id !== permission.id));
            toast.success('Permissão removida com sucesso!');
        } catch (error) {
            toast.error('Erro ao apagar permissão.');
        }
    };

    return (
        <>
            <AppLayout breadcrumbs={[{ title: 'Permissões', href: '/permissions' }]}>
                <div className="mx-auto max-w-7xl py-8 px-2 sm:px-4">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-800">Permissões</h1>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen} modal={false}>
                            <DialogTrigger asChild>
                                <button
                                    className="rounded bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
                                    onClick={() => setCreateOpen(true)}
                                >
                                    Adicionar Permissão
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nova Permissão</DialogTitle>
                                    <DialogDescription>Preencha o nome da permissão.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                                    <div>
                                        <Label htmlFor="create-name">Nome</Label>
                                        <Input id="create-name" name="name" value={createForm.name} onChange={handleCreateChange} required />
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
                    </div>{' '}
                    <GenericTable
                        data={permissions}
                        columns={[
                            {
                                key: 'name',
                                label: 'Permission Name',
                            },
                        ]}
                        actions={[
                            {
                                label: 'Editar',
                                onClick: (permission) => openEdit(permission),
                                className: 'bg-blue-500 hover:bg-blue-600',
                            },
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
                                <DialogTitle>Editar Permissão</DialogTitle>
                                <DialogDescription>Atualize o nome da permissão.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                <div>
                                    <Label htmlFor="edit-name">Nome</Label>
                                    <Input id="edit-name" name="name" value={form.name} onChange={handleChange} required autoFocus />
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

export default PermissionsIndex;
