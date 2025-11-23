import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('CMS ICD-10'),
            href: dashboard().url,
        },
    ];

    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);

    interface Codigo {
        id: string;
        codigo: string;
        descricao_longa: string;
    }

    interface Pagination<T> {
        data: T[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }

    const [codigos, setCodigos] = useState<Codigo[]>([]);
    const [pagination, setPagination] = useState<Omit<Pagination<Codigo>, 'data'> | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const res = await axios.get('/api/icd10cms/search', {
                params: { q: query, page },
            });

            setCodigos(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total,
            });
        };

        fetchData();
        fetchFavoritos();
        fetchHistorico();
    }, [query, page]);

    // --- Favoritos e histórico (mantém igual) ---
    const fetchFavoritos = async () => {
        const res = await axios.get('/api/favoritos');
        setFavoritos(res.data);
    };

    const fetchHistorico = async () => {
        const res = await axios.get('/api/historico');
        setHistorico(res.data);
    };

    const addFavorito = async (id: string) => {
        await axios.post('/api/favoritos', {
            codigo_id: id,
            tabela_origem: 'icd10cms',
        });
        fetchFavoritos();
    };

    const removeFavorito = async (id: string) => {
        await axios.delete(`/api/favoritos/${id}`);
        fetchFavoritos();
    };

    const addHistorico = async (id: string) => {
        await axios.post('/api/historico', { icd_code_id: id });
        fetchHistorico();
    };

    interface Favorito {
        id: string;
        codigo_id: string;
        tabela_origem: string;
        codigo_detalhe?: {
            codigo: string;
            descricao_longa: string;
        };
    }

    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [historico, setHistorico] = useState([]);

    // Filtra só os favoritos dessa página
    const pageOrigin = 'icd10cms';
    const favoritosDaPagina = favoritos.filter((f) => f.tabela_origem === pageOrigin);

    const isFavorito = (codigoId: string) => {
        return favoritosDaPagina.some((f) => f.codigo_id === codigoId);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CMS ICD-10" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="p-6 font-sans">
                    <h1 className="mb-4 text-2xl font-bold">ICD-10-CM</h1>
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        className="mb-4 w-full rounded border p-2"
                        value={query}
                        onChange={(e) => {
                            setPage(1); // Resetar para página 1 quando fizer nova busca
                            setQuery(e.target.value);
                        }}
                    />

                    {/* Layout */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Lista de códigos */}
                        <div className="md:col-span-2">
                            <h2 className="mb-2 text-lg font-semibold">Códigos</h2>
                            <ul className="space-y-2">
                                {codigos.map((c) => (
                                    <li key={c.id} className="flex justify-between rounded border p-2">
                                        <div>
                                            <strong>{c.codigo}</strong> - {c.descricao_longa}
                                        </div>
                                        <div className="flex gap-2">
                                            {!isFavorito(c.id) && (
                                                <button onClick={() => addFavorito(c.id)} className="rounded bg-blue-200 px-2 py-1">
                                                    ⭐
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Paginação */}
                            {pagination && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <button
                                        className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50"
                                        disabled={pagination.current_page === 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    >
                                        Anterior
                                    </button>
                                    <span>
                                        Página {pagination.current_page} de {pagination.last_page}
                                    </span>
                                    <button
                                        className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50"
                                        disabled={pagination.current_page === pagination.last_page}
                                        onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                                    >
                                        Próxima
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Favoritos */}
                        <aside className="md:col-span-1">
                            <div className="sticky top-6">
                                <h2 className="mb-2 text-lg font-semibold">Favoritos</h2>
                                <div className="max-h-[60vh] overflow-y-auto pr-2">
                                    {favoritosDaPagina.length === 0 ? (
                                        <div className="rounded border p-4 text-sm text-gray-600">Nenhum favorito ainda</div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {favoritosDaPagina.map((f) => (
                                                <li key={f.id} className="flex justify-between rounded border p-2">
                                                    <div>
                                                        <strong>{f.codigo_detalhe?.codigo}</strong> - {f.codigo_detalhe?.descricao_longa}
                                                    </div>
                                                    <button onClick={() => removeFavorito(f.id)} className="rounded bg-red-200 px-2 py-1">
                                                        ❌
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
