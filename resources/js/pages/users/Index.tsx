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

import GenericTable from '@/components/table/GenericTable';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import { Loader2, Plus, Save, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';


interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: Role[]; // Added roles property
    permissions: Permission[]; // Added permissions property
}

interface Role {
    id: number;
    name: string;
}
interface Permission {
    id: number;
    name: string;
}
interface Props {
    users: User[];
    roles: Role[];
    permissions: Permission[];
}

const UsersIndex: React.FC<Props> = ({ users: initialUsers, roles, permissions }) => {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ name: '', email: '' });
    const [editRoles, setEditRoles] = useState<number[]>([]);
    const [editPermissions, setEditPermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', roles: [] as number[], permissions: [] as number[] });
    const [createLoading, setCreateLoading] = useState(false);
    // Função para apagar utilizador
    const { t } = useTranslation();

    const handleDelete = async (user: User) => {
        if (!window.confirm(`${t('Are you sure you want to delete user')} ${user.name}?`)) return;
        try {
            await axios.delete(`/users/${user.id}`);
            setUsers(users.filter((u) => u.id !== user.id));
            toast.success(t('User removed successfully!'));
        } catch (error) {
            toast.error(t('Error deleting user.'));
        }
    };
    const openEdit = (user: User) => {
        setEditUser(user);
        setForm({ name: user.name, email: user.email });
        setEditRoles(user.roles ? user.roles.map((r) => r.id) : []);
        // If you want to show permissions, you need to add permissions to User type and backend
        setEditPermissions((user as any).permissions ? (user as any).permissions.map((p: Permission) => p.id) : []);
        setEditOpen(true);
    };
    const closeEdit = () => {
        setEditUser(null);
        setEditOpen(false);
        setEditRoles([]);
        setEditPermissions([]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Submissão do formulário de edição usando fetch
    const openCreate = () => {
        setCreateForm({ name: '', email: '', password: '', roles: [], permissions: [] });
        setCreateOpen(true);
    };
    const closeCreate = () => setCreateOpen(false);

    const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCreateForm({ ...createForm, [e.target.name]: e.target.value });
    };
    const handleCreateRoleChange = (id: number) => {
        setCreateForm((f) => ({ ...f, roles: f.roles.includes(id) ? f.roles.filter((rid) => rid !== id) : [...f.roles, id] }));
    };
    const handleCreatePermissionChange = (id: number) => {
        setCreateForm((f) => ({
            ...f,
            permissions: f.permissions.includes(id) ? f.permissions.filter((pid) => pid !== id) : [...f.permissions, id],
        }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const response = await axios.post('/users', createForm);
            const newUser = response.data.user;
            // associar roles
            for (const roleId of createForm.roles) {
                await axios.post(`/users/${newUser.id}/assign-role`, { role_id: roleId });
            }
            // associar permissões
            for (const permId of createForm.permissions) {
                await axios.post(`/users/${newUser.id}/give-permission`, { permission_id: permId });
            }
            setUsers([newUser, ...users]);
            toast.success(response.data.message);
            setCreateForm({ name: '', email: '', password: '', roles: [], permissions: [] });
            closeCreate();
        } catch (error) {
            toast.error('Erro ao criar utilizador.');
        } finally {
            setCreateLoading(false);
        }
    };
    const handleEditRoleChange = (id: number) => {
        setEditRoles((prev) => (prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]));
    };
    const handleEditPermissionChange = (id: number) => {
        setEditPermissions((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        setLoading(true);

        try {
            // 1. Update user basic info
            const response = await axios.put(`/users/${editUser.id}`, form);
            let updatedUser = response.data.user;

            // 2. Calculate roles to sync
            const currentRoleIds = editUser.roles?.map((r) => r.id) ?? [];
            const rolesToAdd = editRoles.filter((id) => !currentRoleIds.includes(id));
            const rolesToRemove = currentRoleIds.filter((id) => !editRoles.includes(id));

            // 3. Calculate permissions to sync
            const currentPermissionIds = editUser.permissions?.map((p) => p.id) ?? [];
            const permsToAdd = editPermissions.filter((id) => !currentPermissionIds.includes(id));
            const permsToRemove = currentPermissionIds.filter((id) => !editPermissions.includes(id));

            // 4. Run role & permission updates in parallel
            const updateResults = await Promise.allSettled([
                ...rolesToAdd.map((roleId) => axios.post(`/users/${editUser.id}/assign-role`, { role_id: roleId })),
                ...rolesToRemove.map((roleId) => axios.post(`/users/${editUser.id}/remove-role`, { role_id: roleId })),
                ...permsToAdd.map((permId) => axios.post(`/users/${editUser.id}/give-permission`, { permission_id: permId })),
                ...permsToRemove.map((permId) => axios.post(`/users/${editUser.id}/revoke-permission`, { permission_id: permId })),
            ]);

            // 5. Check if any updates failed
            const failed = updateResults.filter((r) => r.status === 'rejected');
            if (failed.length > 0) {
                console.warn(`Some role/permission updates failed:`, failed);
                toast.warning(`${failed.length} update(s) failed, but the rest succeeded.`);
            }

            // 6. Optionally fetch fresh user (only if needed)
            if (!updatedUser.roles || !updatedUser.permissions) {
                const userResp = await axios.get(`/users/${editUser.id}`);
                updatedUser = userResp.data.user;
            }

            // 7. Update state
            setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

            // 8. Success feedback
            toast.success(response.data.message || 'User updated successfully.');
            setEditUser(null);
            closeEdit();
        } catch (error) {
            console.error('Error while updating user:', error);
            toast.error('An error occurred while updating the user.');
        } finally {
            setLoading(false);
        }
    };


    // Reusable Dialog for create/edit
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const isDialogOpen = createOpen || editOpen;
    const closeDialog = () => {
        setCreateOpen(false);
        closeEdit();
    };

    const handleDialogSubmit = dialogMode === 'create' ? handleCreateSubmit : handleSubmit;
    const dialogForm = dialogMode === 'create' ? createForm : form;
    const dialogRoles = dialogMode === 'create' ? createForm.roles : editRoles;
    const dialogPermissions = dialogMode === 'create' ? createForm.permissions : editPermissions;
    const handleRoleChange = dialogMode === 'create' ? handleCreateRoleChange : handleEditRoleChange;
    const handlePermissionChange = dialogMode === 'create' ? handleCreatePermissionChange : handleEditPermissionChange;
    const dialogLoading = dialogMode === 'create' ? createLoading : loading;

    return (
        <>
            <AppLayout breadcrumbs={[{ title: t('Users'), href: '/users' }]}> 
                <div className="mx-auto max-w-7xl px-2 py-8 sm:px-4">
                    <div className="overflow-x-auto rounded-lg shadow">
                        <div className="mb-6 flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-gray-800">{t('Users')}</h1>
                            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }} modal={false}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => { openCreate(); setDialogMode('create'); }} variant="default" size="default">
                                        <Plus size={18} /> {t('user')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{dialogMode === 'create' ? t('New User') : t('Edit User')}</DialogTitle>
                                        <DialogDescription>
                                            {dialogMode === 'create' ? t('Fill in the details to create a new user.') : t('Update user details.')}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleDialogSubmit} className="mt-4 space-y-4">
                                        <div>
                                            <Label htmlFor="name">{t('Name')}</Label>
                                            <Input id="name" name="name" value={dialogForm.name} onChange={dialogMode === 'create' ? handleCreateChange : handleChange} required />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">{t('Email')}</Label>
                                            <Input id="email" name="email" type="email" value={dialogForm.email} onChange={dialogMode === 'create' ? handleCreateChange : handleChange} required />
                                        </div>
                                        {dialogMode === 'create' && (
                                            <div>
                                                <Label htmlFor="create-password">Password</Label>
                                                <Input id="create-password" name="password" type="password" value={createForm.password} onChange={handleCreateChange} required />
                                            </div>
                                        )}
                                        <div>
                                            <Label>{t('Roles')}</Label>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {roles.map((r) => (
                                                    <label key={r.id} className="flex items-center gap-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={dialogRoles.includes(r.id)}
                                                            onChange={() => handleRoleChange(r.id)}
                                                        />
                                                        {r.name}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label>{t('Permissions')}</Label>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {permissions.map((p) => (
                                                    <label key={p.id} className="flex items-center gap-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={dialogPermissions.includes(p.id)}
                                                            onChange={() => handlePermissionChange(p.id)}
                                                        />
                                                        {p.name}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={dialogLoading} variant="default" size="default">
                                                {dialogLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}{' '}
                                                {dialogLoading ? (dialogMode === 'create' ? t('Creating...') : t('Updating...')) : (dialogMode === 'create' ? t('Create') : t('Update'))}
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
                            data={users}
                            columns={[
                                { key: 'name', label: t('Name') },
                                { key: 'email', label: t('Email') },
                                { key: 'created_at', label: t('Creation Date'), render: (user: User) => user.created_at.slice(0, 10) },
                                {
                                    key: 'roles',
                                    label: t('Roles'),
                                    render: (user: User) => (user.roles ? user.roles.map((r) => r.name).join(', ') : 'N/A'),
                                },
                                {
                                    key: 'permissions',
                                    label: t('Permissions'),
                                    render: (user: User) => (user.permissions ? user.permissions.map((p) => p.name).join(', ') : 'N/A'),
                                },
                            ]}
                            actions={[
                                { label: t('Edit'), onClick: (user) => { openEdit(user); setDialogMode('edit'); }, className: 'bg-blue-500 hover:bg-blue-600' },
                                { label: t('Delete'), onClick: handleDelete, className: 'bg-red-500 hover:bg-red-600' },
                            ]}
                        />
                    </div>
                </div>
            </AppLayout>
        </>
    );
};

export default UsersIndex;
