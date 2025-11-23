import DiagnosticosPublicos from '@/components/diagnosticos/DiagnosticosPublicos';
import ProcedimentosPublicos from '@/components/procedimentos/ProcedimentosPublico';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LogoImage from '../../images/logo.png';
import FavoritosPanel from '@/components/favoritos/FavoritosPanel';


export default function WelcomeAlt() {
    const { auth } = usePage<SharedData>().props;
    const [search, setSearch] = useState('');

    const { t } = useTranslation();
    const [favoritos, setFavoritos] = useState<{ id: number; codigo: string; descricao?: string; origem?: string; tabela_origem?: string }[]>([]);

    // fetch user's favorites when logged in
    useEffect(() => {
        if (!auth.user) return;
        let active = true;
        axios
            .get('/api/favoritos')
            .then((res) => {
                const data = Array.isArray(res.data.data) ? res.data.data : res.data.data?.data ?? res.data.data ?? [];
                if (active) setFavoritos(data);
            })
            .catch(() => {
                // ignore errors silently for now
            });
        return () => {
            active = false;
        };
    }, [auth.user]);

    const handleRemoveFavorito = async (id: number) => {
        // optimistic UI
        const prev = favoritos;
        setFavoritos((s) => s.filter((f) => f.id !== id));
        try {
            await axios.delete(`/api/favoritos/${id}`);
        } catch (e) {
            // revert on error
            setFavoritos(prev);
        }
    };

    const getFavCodigo = (f: any) => f.codigo ?? f.codigo_detalhe?.codigo ?? f.codigo_detalhe?.codigo ?? '';
    const getFavDescricao = (f: any) => f.descricao ?? f.codigo_detalhe?.descricao_longa ?? f.codigo_detalhe?.descricao ?? f.codigo_detalhe?.descricao_curta ?? '';

    return (
        <>
            <Head title="Explorar Diagnósticos e Procedimentos" />

            <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-gray-50 text-black dark:from-black dark:to-gray-950 dark:text-white">
                {/* Header */}
                <header className="w-full border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-black/60">
                    <nav className="mx-auto flex max-w-6xl items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <img src={LogoImage} alt="Medicodex Logo" className="h-10 w-30" />
                        </Link>
                        <div className="flex gap-4">

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-lg border border-transparent px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    {t('Dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-600"
                                    >
                                        Entrar
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Conteúdo principal */}
                <main className="flex flex-1 flex-col items-center px-6 py-12">
                    <div className="mx-auto w-full max-w-4xl text-center">
                        <h1 className="mb-4 text-4xl leading-tight font-extrabold lg:text-5xl">Explore Diagnósticos e Procedimentos</h1>
                        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
                            Use a pesquisa para encontrar códigos rapidamente e visualize listas públicas já organizadas.
                        </p>
                    </div>

                    {/* Meus favoritos (quando logado) */}
                    <FavoritosPanel />
                </main>
            </div>
        </>
    );
}
