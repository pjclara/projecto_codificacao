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
}

interface Props {
    users: User[];
}

const UsersIndex: React.FC<Props> = ({ users: initialUsers }) => {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
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
        setEditOpen(true);
    };
    const closeEdit = () => {
        setEditUser(null);
        setEditOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Submissão do formulário de edição usando fetch
    const openCreate = () => {
        setCreateForm({ name: '', email: '', password: '' });
        setCreateOpen(true);
    };
    const closeCreate = () => setCreateOpen(false);

    const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCreateForm({ ...createForm, [e.target.name]: e.target.value });
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const response = await axios.post('/users', createForm);
            const newUser = response.data.user;
            setUsers([newUser, ...users]);
            toast.success(response.data.message);
            closeCreate();
        } catch (error) {
            toast.error('Erro ao criar utilizador.');
        } finally {
            setCreateLoading(false);
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        setLoading(true);
        try {
            const response = await axios.put(`/users/${editUser.id}`, form);
            const updatedUser = response.data.user;
            setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
            toast.success(response.data.message);
            closeEdit();
        } catch (error) {
            console.error('Erro ao atualizar o utilizador:', error);
            toast.error('Ocorreu um erro ao atualizar o utilizador.');
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
