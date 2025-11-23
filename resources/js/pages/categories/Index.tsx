import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, Plus, Search, X } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface Category {
    id: number;
    name: string;
    kind?: string;
    notes?: string;
    specialty_id?: number;
    specialty?: {
        id: number;
        name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface Specialty {
    id: number;
    name: string;
}

interface FormData {
    name: string;
    kind: string;
    notes: string;
    specialty_id: string;
}

export default function CategoriesIndex() {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<Category[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterKind, setFilterKind] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        kind: 'diagnosticos',
        notes: '',
        specialty_id: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Categorias', href: '/categories' },
    ];

    // Fetch categories and specialties on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [catsRes, specsRes] = await Promise.all([
                axios.get('/api/categories'),
                axios.get('/api/specialties'),
            ]);
            setCategories(catsRes.data.data || catsRes.data);
            setSpecialties(specsRes.data.data || specsRes.data);
        } catch (err) {
            setError('Erro ao carregar dados');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter((cat) => {
        const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
        const matchesKind = !filterKind || cat.kind === filterKind;
        return matchesSearch && matchesKind;
    });

    const resetForm = () => {
        setFormData({
            name: '',
            kind: 'diagnosticos',
            notes: '',
            specialty_id: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (category: Category) => {
        setFormData({
            name: category.name,
            kind: category.kind || 'diagnosticos',
            notes: category.notes || '',
            specialty_id: category.specialty_id?.toString() || '',
        });
        setEditingId(category.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const payload = {
            name: formData.name,
            kind: formData.kind,
            notes: formData.notes,
            specialty_id: formData.specialty_id ? parseInt(formData.specialty_id) : null,
        };

        try {
            if (editingId) {
                await axios.put(`/api/categories/${editingId}`, payload);
            } else {
                await axios.post('/api/categories', payload);
            }
            await fetchData();
            resetForm();
        } catch (err) {
            setError('Erro ao salvar categoria');
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja deletar esta categoria?')) return;
        try {
            await axios.delete(`/api/categories/${id}`);
            await fetchData();
        } catch (err) {
            setError('Erro ao deletar categoria');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Categorias" />
                <div className="flex items-center justify-center py-12">
                    <p className="text-gray-500">Carregando...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categorias" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Gerenciar Categorias</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                    >
                        <Plus size={20} />
                        Nova Categoria
                    </button>
                </div>

                {/* Error message */}
                {error && (
                    <div className="flex items-center justify-between rounded-lg bg-red-100 p-4 text-red-800">
                        <p>{error}</p>
                        <button onClick={() => setError(null)}>
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm md:flex-row">
                    <div className="flex items-center gap-2 flex-1">
                        <Search size={20} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar categorias..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border-b border-gray-300 bg-transparent py-2 focus:border-green-500 focus:outline-none"
                        />
                    </div>
                    <select
                        value={filterKind}
                        onChange={(e) => setFilterKind(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                    >
                        <option value="">Todos os tipos</option>
                        <option value="diagnosticos">Diagnósticos</option>
                        <option value="procedimentos">Procedimentos</option>
                    </select>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-bold">
                                    {editingId ? 'Editar Categoria' : 'Nova Categoria'}
                                </h2>
                                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                                        placeholder="Nome da categoria"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                                    <select
                                        value={formData.kind}
                                        onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                                    >
                                        <option value="diagnosticos">Diagnósticos</option>
                                        <option value="procedimentos">Procedimentos</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                                    <select
                                        value={formData.specialty_id}
                                        onChange={(e) =>
                                            setFormData({ ...formData, specialty_id: e.target.value })
                                        }
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                                    >
                                        <option value="">Sem especialidade</option>
                                        {specialties.map((spec) => (
                                            <option key={spec.id} value={spec.id}>
                                                {spec.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Notas</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                                        placeholder="Notas adicionais"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                                    >
                                        {editingId ? 'Atualizar' : 'Criar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Categories Table */}
                <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                    {filteredCategories.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            Nenhuma categoria encontrada.
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Especialidade
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Notas</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.map((category) => (
                                    <tr key={category.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                                {category.kind || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {category.specialty ? (
                                                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                                                    {category.specialty.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {category.notes ? category.notes.substring(0, 50) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
                                                    title="Deletar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Total de Categorias</p>
                        <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Diagnósticos</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {categories.filter((c) => c.kind === 'diagnosticos').length}
                        </p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Procedimentos</p>
                        <p className="text-2xl font-bold text-green-600">
                            {categories.filter((c) => c.kind === 'procedimentos').length}
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
