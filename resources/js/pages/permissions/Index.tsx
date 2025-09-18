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
import { Plus, Save, XCircle } from 'lucide-react';

import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

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

    const { t } = useTranslation();
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const isDialogOpen = createOpen || editOpen;
    const closeDialog = () => {
        setCreateOpen(false);
        closeEdit();
    };
    const handleDialogSubmit = dialogMode === 'create' ? handleCreateSubmit : handleSubmit;
    const dialogForm = dialogMode === 'create' ? createForm : form;
    const handleDialogChange = dialogMode === 'create' ? handleCreateChange : handleChange;

    function openCreate() {
        setCreateForm({ name: '' });
        setCreateOpen(true);
    }

    return (
        <>
            <AppLayout breadcrumbs={[{ title: t('Permissions'), href: '/permissions' }]}> 
                <div className="mx-auto max-w-7xl py-8 px-2 sm:px-4">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-800">{t('Permissions')}</h1>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }} modal={false}>
                            <DialogTrigger asChild>
                                    <Button onClick={() => { openCreate(); setDialogMode('create'); }} variant="default" size="default">
                                        <Plus size={18} /> {t('Permission')}
                                    </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{dialogMode === 'create' ? t('New Permission') : t('Edit Permission')}</DialogTitle>
                                    <DialogDescription>
                                        {dialogMode === 'create' ? t('Fill in the permission name.') : t('Update the permission name.')}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleDialogSubmit} className="mt-4 space-y-4">
                                    <div>
                                        <Label htmlFor="name">{t('Name')}</Label>
                                        <Input id="name" name="name" value={dialogForm.name} onChange={handleDialogChange} required autoFocus />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" variant="default" size="default">
                                            <Save size={16} /> {t('Save')}
                                        </Button>
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary" size="default">
                                                <XCircle size={16} /> {t('Cancel')}
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <GenericTable
                        data={permissions}
                        columns={[
                            {
                                key: 'name',
                                label: t('Name'),
                            },
                        ]}
                        actions={[
                            {
                                label: t('Edit'),
                                onClick: (permission) => { openEdit(permission); setDialogMode('edit'); },
                                className: 'bg-blue-500 hover:bg-blue-600',
                            },
                            { label: t('Delete'), onClick: handleDelete, className: 'bg-red-500 hover:bg-red-600' },
                        ]}
                    />
                </div>
            </AppLayout>
        </>
    );
};

export default PermissionsIndex;
