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
import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const handleDelete = async (user: User) => {
        if (!window.confirm(`Tem a certeza que deseja apagar o utilizador ${user.name}?`)) return;
        try {
            await axios.delete(`/users/${user.id}`);
            setUsers(users.filter((u) => u.id !== user.id));
            toast.success('Utilizador removido com sucesso!');
        } catch (error) {
            toast.error('Erro ao apagar utilizador.');
        }
    };
    const openEdit = (user: User) => {
        setEditUser(user);
        setForm({ name: user.name, email: user.email });
        setEditRoles(user.roles ? user.roles.map(r => r.id) : []);
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
        setCreateForm(f => ({ ...f, roles: f.roles.includes(id) ? f.roles.filter(rid => rid !== id) : [...f.roles, id] }));
    };
    const handleCreatePermissionChange = (id: number) => {
        setCreateForm(f => ({ ...f, permissions: f.permissions.includes(id) ? f.permissions.filter(pid => pid !== id) : [...f.permissions, id] }));
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
            closeCreate();
        } catch (error) {
            toast.error('Erro ao criar utilizador.');
        } finally {
            setCreateLoading(false);
        }
    };
    const handleEditRoleChange = (id: number) => {
        setEditRoles((prev) => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]);
    };
    const handleEditPermissionChange = (id: number) => {
        setEditPermissions((prev) => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
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
        const currentRoleIds = editUser.roles?.map(r => r.id) ?? [];
        const rolesToAdd = editRoles.filter(id => !currentRoleIds.includes(id));
        const rolesToRemove = currentRoleIds.filter(id => !editRoles.includes(id));

        // 3. Calculate permissions to sync
        const currentPermissionIds = editUser.permissions?.map(p => p.id) ?? [];
        const permsToAdd = editPermissions.filter(id => !currentPermissionIds.includes(id));
        const permsToRemove = currentPermissionIds.filter(id => !editPermissions.includes(id));

        // 4. Run role & permission updates in parallel
        const updateResults = await Promise.allSettled([
            ...rolesToAdd.map(roleId =>
                axios.post(`/users/${editUser.id}/assign-role`, { role_id: roleId })
            ),
            ...rolesToRemove.map(roleId =>
                axios.post(`/users/${editUser.id}/remove-role`, { role_id: roleId })
            ),
            ...permsToAdd.map(permId =>
                axios.post(`/users/${editUser.id}/give-permission`, { permission_id: permId })
            ),
            ...permsToRemove.map(permId =>
                axios.post(`/users/${editUser.id}/revoke-permission`, { permission_id: permId })
            )
        ]);

        // 5. Check if any updates failed
        const failed = updateResults.filter(r => r.status === "rejected");
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
        setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));

        // 8. Success feedback
        toast.success(response.data.message || "User updated successfully.");
        closeEdit();
    } catch (error) {
        console.error("Error while updating user:", error);
        toast.error("An error occurred while updating the user.");
    } finally {
        setLoading(false);
    }
};


    return (
        <>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        <AppLayout breadcrumbs={[{ title: 'Utilizadores', href: '/users' }]}> 
            <div className="mx-auto max-w-5xl py-8">
                <h1 className="mb-6 text-3xl font-bold text-gray-800">Utilizadores</h1>
                <div className="overflow-x-auto rounded-lg shadow">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-800">Utilizadores</h1>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen} modal={false}>
                            <DialogTrigger asChild>
                                <button
                                    className="rounded bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
                                    onClick={openCreate}
                                >
                                    Adicionar Utilizador
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Novo Utilizador</DialogTitle>
                                    <DialogDescription>Preencha os dados para criar um novo utilizador.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                                    <div>
                                        <Label htmlFor="create-name">Nome</Label>
                                        <Input id="create-name" name="name" value={createForm.name} onChange={handleCreateChange} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="create-email">Email</Label>
                                        <Input
                                            id="create-email"
                                            name="email"
                                            type="email"
                                            value={createForm.email}
                                            onChange={handleCreateChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="create-password">Password</Label>
                                        <Input
                                            id="create-password"
                                            name="password"
                                            type="password"
                                            value={createForm.password}
                                            onChange={handleCreateChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Roles</Label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {roles.map(r => (
                                                <label key={r.id} className="flex items-center gap-1">
                                                    <input type="checkbox" checked={createForm.roles.includes(r.id)} onChange={() => handleCreateRoleChange(r.id)} />
                                                    {r.name}
                                                </label>
                                            ))}
                                        </div>
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
                                        <button
                                            type="submit"
                                            disabled={createLoading}
                                            className="rounded bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
                                        >
                                            {createLoading ? 'A criar...' : 'Criar'}
                                        </button>
                                        <DialogClose asChild>
                                            <button
                                                type="button"
                                                className="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition hover:bg-gray-300"
                                            >
                                                Cancelar
                                            </button>
                                        </DialogClose>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-100 text-sm leading-normal text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-200">
                                <th className="px-6 py-3 text-left">Nome</th>
                                <th className="px-6 py-3 text-left">Email</th>
                                <th className="px-6 py-3 text-left">Data de Criação</th>
                                <th className="px-6 py-3 text-left">Roles</th>
                                <th className="px-6 py-3 text-left">Permissões</th>
                                <th className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-gray-200 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    <td className="px-6 py-3 whitespace-nowrap">{user.name}</td>
                                    <td className="px-6 py-3 whitespace-nowrap">{user.email}</td>
                                    <td className="px-6 py-3 whitespace-nowrap">{user.created_at.slice(0, 10)}</td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        {/* Listar roles do utilizador */}
                                        {/* Supondo que cada utilizador tem uma propriedade roles que é um array de strings */}
                                        {user.roles ? user.roles.map(r => r.name).join(', ') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <Dialog
                                            modal={false}
                                            open={editOpen && editUser?.id === user.id}
                                            onOpenChange={(open) => {
                                                if (!open) closeEdit();
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <button
                                                    className="mr-2 rounded bg-blue-500 px-3 py-1 font-semibold text-white transition hover:bg-blue-600"
                                                    onClick={() => openEdit(user)}
                                                >
                                                    Editar
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Editar Utilizador</DialogTitle>
                                                    <DialogDescription>
                                                        Altere os dados do utilizador e clique em "Guardar" para atualizar.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                                    <div>
                                                        <Label htmlFor="name">Nome</Label>
                                                        <Input id="name" name="name" value={form.name} onChange={handleChange} required />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="email">Email</Label>
                                                        <Input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            value={form.email}
                                                            onChange={handleChange}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Roles</Label>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {roles.map(r => (
                                                                <label key={r.id} className="flex items-center gap-1">
                                                                    <input type="checkbox" checked={editRoles.includes(r.id)} onChange={() => handleEditRoleChange(r.id)} />
                                                                    {r.name}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label>Permissões</Label>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {permissions.map(p => (
                                                                <label key={p.id} className="flex items-center gap-1">
                                                                    <input type="checkbox" checked={editPermissions.includes(p.id)} onChange={() => handleEditPermissionChange(p.id)} />
                                                                    {p.name}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <button
                                                            type="submit"
                                                            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                                                        >
                                                            Guardar
                                                        </button>
                                                        <DialogClose asChild>
                                                            <button
                                                                type="button"
                                                                className="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition hover:bg-gray-300"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                        <button
                                            className="rounded bg-red-500 px-3 py-1 font-semibold text-white transition hover:bg-red-600"
                                            onClick={() => handleDelete(user)}
                                        >
                                            Apagar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
        </>
    );
};

export default UsersIndex;
