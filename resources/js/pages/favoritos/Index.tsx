import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit, Search, Star, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

interface Category {
    id: number;
    name: string;
    specialty?: { id: number; name: string };
}

interface Specialty {
    id: number;
    name: string;
}

interface Favorito {
    id: number;
    codigo_id: number;
    tabela_origem: 'icd10cms' | 'icd10pcs';
    category_id?: number | null;
    specialty_id?: number | null;
    section_id?: number | null;
    personal: boolean;
    codigo?: string;
    descricao?: string;
    category?: Category;
    specialty?: Specialty;
}

interface PaginatedResponse {
    data: Favorito[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export default function FavoritosIndex() {
    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFavorito, setEditingFavorito] = useState<Favorito | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOrigem, setFilterOrigem] = useState<'all' | 'icd10cms' | 'icd10pcs'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [stats, setStats] = useState({
        total: 0,
        diagnosticos: 0,
        procedimentos: 0,
        pessoais: 0,
    });

    // Debounce search term
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [formData, setFormData] = useState({
        category_id: null as number | null,
        specialty_id: null as number | null,
        personal: false,
    });

    useEffect(() => {
        fetchFavoritos();
        fetchCategories();
        fetchSpecialties();
    }, [currentPage, debouncedSearchTerm, filterOrigem]);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [debouncedSearchTerm, filterOrigem]);

    const fetchFavoritos = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                per_page: '15',
            });

            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (filterOrigem !== 'all') params.append('origem', filterOrigem);

            const res = await axios.get(`/api/favoritos?${params.toString()}`);
            const data = res.data.data;
            const stats = res.data.stats;

            setStats({ total: stats.total, diagnosticos: stats.diagnosticos, procedimentos: stats.procedimentos, pessoais: stats.pessoais });

            setFavoritos(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 15,
                total: data.total || 0,
                from: data.from || 0,
                to: data.to || 0,
            });
        } catch (err) {
            toast.error('Erro ao carregar favoritos');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            setCategories(data);
        } catch {
            // silent
        }
    };

    const fetchSpecialties = async () => {
        try {
            const res = await axios.get('/api/specialties');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            setSpecialties(data);
        } catch {
            // silent
        }
    };

    const handleEdit = (favorito: Favorito) => {
        setEditingFavorito(favorito);
        setFormData({
            category_id: favorito.category_id ?? null,
            specialty_id: favorito.specialty_id ?? null,
            personal: favorito.personal ?? false,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja remover este favorito?')) return;

        try {
            await axios.delete(`/api/favoritos/${id}`);
            toast.success('Favorito removido com sucesso!');
            fetchFavoritos();
        } catch {
            toast.error('Erro ao remover favorito');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFavorito) return;

        try {
            await axios.put(`/api/favoritos/${editingFavorito.id}`, formData);
            toast.success('Favorito atualizado com sucesso!');
            setShowModal(false);
            setEditingFavorito(null);
            fetchFavoritos();
        } catch {
            toast.error('Erro ao atualizar favorito');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingFavorito(null);
        setFormData({
            category_id: null,
            specialty_id: null,
            personal: false,
        });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            setCurrentPage(newPage);
        }
    };

    const filteredFavoritos = favoritos;

    return (
        <AppLayout>
            <div className="container mx-auto max-w-7xl p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
                        <Star className="text-yellow-500" size={32} />
                        Gerenciar Favoritos
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Organize e gerencie seus códigos favoritos</p>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/20">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/20">
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">Diagnósticos</div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.diagnosticos}</div>
                    </div>
                    <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-800/20">
                        <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Procedimentos</div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.procedimentos}</div>
                    </div>
                    <div className="rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 dark:border-yellow-800 dark:from-yellow-900/20 dark:to-yellow-800/20">
                        <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pessoais</div>
                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pessoais}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-4 md:flex-row">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por código ou descrição (ex: diabetes mellitus)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <p className="mt-1 ml-1 text-xs text-gray-500 dark:text-gray-400">
                                💡 Dica: Use várias palavras para refinar a busca (ex: "fraturas osso fêmur")
                            </p>
                        </div>

                        {/* Filter by Origin */}
                        <select
                            value={filterOrigem}
                            onChange={(e) => setFilterOrigem(e.target.value as any)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        >
                            <option value="all">Todos os Tipos</option>
                            <option value="icd10cms">Diagnósticos</option>
                            <option value="icd10pcs">Procedimentos</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Carregando...</div>
                    ) : filteredFavoritos.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Nenhum favorito encontrado</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                            Tipo
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                            Código
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                            Descrição
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                            Categoria
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                            Especialidade
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                            Pessoal
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredFavoritos.map((fav) => (
                                        <tr key={fav.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        fav.tabela_origem === 'icd10cms'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                                                    }`}
                                                >
                                                    {fav.tabela_origem === 'icd10cms' ? 'Diagnóstico' : 'Procedimento'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {fav.codigo}
                                            </td>
                                            <td className="max-w-md truncate px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{fav.descricao}</td>
                                            <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {fav.category?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {fav.specialty?.name ?? fav.category?.specialty?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {fav.personal ? <span className="text-yellow-500">★</span> : <span className="text-gray-300">☆</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                                                <button
                                                    onClick={() => handleEdit(fav)}
                                                    className="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(fav.id)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.total > 0 && (
                    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Mostrando {pagination.from} a {pagination.to} de {pagination.total} favoritos
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={pagination.current_page === 1}
                                    className="rounded border border-gray-300 bg-white px-3 py-1 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    ««
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="rounded border border-gray-300 bg-white px-3 py-1 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    «
                                </button>

                                {/* Page numbers */}
                                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.current_page >= pagination.last_page - 2) {
                                        pageNum = pagination.last_page - 4 + i;
                                    } else {
                                        pageNum = pagination.current_page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`rounded border px-3 py-1 transition ${
                                                pagination.current_page === pageNum
                                                    ? 'border-blue-600 bg-blue-600 text-white'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="rounded border border-gray-300 bg-white px-3 py-1 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    »
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.last_page)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="rounded border border-gray-300 bg-white px-3 py-1 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    »»
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal */}
                <AnimatePresence>
                    {showModal && editingFavorito && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                            onClick={handleCloseModal}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Editar Favorito</h3>
                                    <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Código</div>
                                    <div className="font-mono font-medium text-gray-900 dark:text-gray-100">{editingFavorito.codigo}</div>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{editingFavorito.descricao}</div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Category */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                                        <select
                                            value={formData.category_id ?? ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    category_id: e.target.value ? parseInt(e.target.value) : null,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                        >
                                            <option value="">-- Nenhuma --</option>
                                            {categories
                                                .filter((c) => c.specialty?.name)
                                                .map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name} ({cat.specialty?.name})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Specialty */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Especialidade</label>
                                        <select
                                            value={formData.specialty_id ?? ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    specialty_id: e.target.value ? parseInt(e.target.value) : null,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                        >
                                            <option value="">-- Nenhuma --</option>
                                            {specialties.map((spec) => (
                                                <option key={spec.id} value={spec.id}>
                                                    {spec.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Personal */}
                                    <div>
                                        <label className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.personal}
                                                onChange={(e) => setFormData({ ...formData, personal: e.target.checked })}
                                                className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Marcar como pessoal/favorito especial</span>
                                        </label>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                                        >
                                            Salvar
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>
    );
}
function setStats(stats: any) {
    throw new Error('Function not implemented.');
}
