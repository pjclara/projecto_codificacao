import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

export default function Dashboard() {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('PCS ICD-10'),
            href: dashboard().url,
        },
    ];

    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);

    interface Codigo {
        id: string;
        codigo: string;
        descricao_longa: string;
        descricao_curta: string;
        descricao_linguagem_corrente: string;
    }
    const [codigos, setCodigos] = useState<Codigo[]>([]);
    const [pagination, setPagination] = useState<Omit<Pagination<Codigo>, 'data'> | null>(null);

    interface Favorito {
        id: string;
        codigo_id: string;
        tabela_origem: string;
        codigo_detalhe?: {
            codigo: string;
            descricao_longa: string;
            descricao_curta: string;
            descricao_linguagem_corrente: string;
        };
    }

    interface Pagination<T> {
        data: T[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }

    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [historico, setHistorico] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const url = query
                ? `/api/icd10pcs/search?q=${query}&page=${page}`
                : `/api/icd10pcs?page=${page}`;

            const res = await axios.get(url);
            setCodigos(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                per_page: res.data.per_page,
                total: res.data.total,
            });
        } catch (err) {
            toast.error('Erro ao carregar códigos');
        }
    };

    const fetchFavoritos = async () => {
        try {
            const res = await axios.get('/api/favoritos');
            setFavoritos(res.data);
        } catch (err) {
            toast.error('Erro ao carregar favoritos');
        }
    };

    const fetchHistorico = async () => {
        try {
            const res = await axios.get('/api/historico');
            setHistorico(res.data);
        } catch (err) {
            toast.error('Erro ao carregar histórico');
        }
    };

    const addFavorito = async (id: string) => {
        try {
            await axios.post('/api/favoritos', {
                codigo_id: id,
                tabela_origem: 'icd10pcs',
            });
            fetchFavoritos();
            toast.success('Adicionado aos favoritos!');
        } catch (err) {
            toast.error('Erro ao adicionar favorito');
        }
    };

    const removeFavorito = async (id: string) => {
        try {
            await axios.delete(`/api/favoritos/${id}`);
            fetchFavoritos();
            toast.success('Removido dos favoritos!');
        } catch (err) {
            toast.error('Erro ao remover favorito');
        }
    };

    const addHistorico = async (id: string) => {
        try {
            await axios.post('/api/historico', { icd_code_id: id });
            fetchHistorico();
        } catch (err) {
            toast.error('Erro ao salvar no histórico');
        }
    };

    // Apenas favoritos desta página
    const pageOrigin = 'icd10pcs';
    const favoritosDaPagina = favoritos.filter((f) => f.tabela_origem === pageOrigin);

    const isFavorito = (codigoId: string) => {
        return favoritosDaPagina.some((f) => f.codigo_id === codigoId);
    };

    // Buscar dados sempre que query ou página mudar
    useEffect(() => {
        fetchData();
    }, [query, page]);

    // Buscar favoritos e histórico apenas uma vez no mount
    useEffect(() => {
        fetchFavoritos();
        fetchHistorico();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="PCS ICD-10" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="p-6 font-sans">
                    <h1 className="mb-4 text-2xl font-bold">ICD-10-PCS</h1>
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        className="mb-4 w-full rounded border p-2"
                        value={query}
                        onChange={(e) => {
                            setPage(1); // resetar para página 1 ao pesquisar
                            setQuery(e.target.value);
                        }}
                    />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <h2 className="mb-2 text-lg font-semibold">Códigos</h2>
                            <ul className="space-y-2">
                                {codigos.map((c) => (
                                    <li
                                        key={c.id}
                                        className="flex justify-between rounded border p-2 cursor-pointer hover:bg-gray-50"
                                        onClick={() => addHistorico(c.id)}
                                    >
                                        <div>
                                            <strong>{c.codigo}</strong> - {c.descricao_linguagem_corrente ? c.descricao_linguagem_corrente : c.descricao_longa}  
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isFavorito(c.id) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // não disparar addHistorico junto
                                                        addFavorito(c.id);
                                                    }}
                                                    className="rounded bg-blue-200 px-2 py-1"
                                                >
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
                                                        <strong>{f.codigo_detalhe?.codigo}</strong> - {f.codigo_detalhe?.descricao_linguagem_corrente}
                                                    </div>
                                                    <button
                                                        onClick={() => removeFavorito(f.id)}
                                                        className="rounded bg-red-200 px-2 py-1"
                                                    >
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
