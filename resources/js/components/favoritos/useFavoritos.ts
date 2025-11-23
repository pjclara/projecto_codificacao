import { useEffect, useState } from 'react';
import axios from 'axios';

export type Favorito = {
    id: number;
    codigo?: string;
    descricao?: string;
    origem?: string;
    tabela_origem?: string;
    codigo_detalhe?: any;
    users?: Array<{ id: number; name: string; email: string }>;
};

export default function useFavoritos() {
    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        axios
            .get('/api/favoritos')
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data ?? [];
                if (active) {
                    setFavoritos(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const removeFavorito = async (id: number) => {
        const prev = favoritos;
        setFavoritos((s) => s.filter((f) => f.id !== id));
        try {
            await axios.delete(`/api/favoritos/${id}`);
        } catch (e) {
            setFavoritos(prev);
            throw e;
        }
    };

    const getFavCodigo = (f: Favorito) => f.codigo ?? f.codigo_detalhe?.codigo ?? '';
    const getFavDescricao = (f: Favorito) => f.descricao ?? f.codigo_detalhe?.descricao_linguagem_corrente ?? f.codigo_detalhe?.descricao ?? f.codigo_detalhe?.descricao_curta ?? '';

    const attachUser = async (favoritoId: number, userId: number) => {
        try {
            await axios.post(`/api/favoritos/${favoritoId}/attach-user`, { user_id: userId });
            // Refetch the favorito to update users list
            const res = await axios.get(`/api/favoritos/${favoritoId}`);
            const updatedFav = res.data;
            setFavoritos((prev) =>
                prev.map((f) => (f.id === favoritoId ? updatedFav : f))
            );
        } catch (e: any) {
            // Ignore if user is already associated (UNIQUE constraint)
            if (e.response?.status === 400 || e.message?.includes('UNIQUE')) {
                // User is already associated, refetch to sync state
                try {
                    const res = await axios.get(`/api/favoritos/${favoritoId}`);
                    const updatedFav = res.data;
                    setFavoritos((prev) =>
                        prev.map((f) => (f.id === favoritoId ? updatedFav : f))
                    );
                } catch (err) {
                    console.error('Error syncing favorito:', err);
                }
            } else {
                throw e;
            }
        }
    };

    const detachUser = async (favoritoId: number, userId: number) => {
        try {
            await axios.post(`/api/favoritos/${favoritoId}/detach-user`, { user_id: userId });
            // Refetch the favorito to update users list
            const res = await axios.get(`/api/favoritos/${favoritoId}`);
            const updatedFav = res.data;
            setFavoritos((prev) =>
                prev.map((f) => (f.id === favoritoId ? updatedFav : f))
            );
        } catch (e) {
            throw e;
        }
    };

    const getUsers = async (favoritoId: number) => {
        try {
            const res = await axios.get(`/api/favoritos/${favoritoId}/users`);
            return res.data;
        } catch (e) {
            throw e;
        }
    };

    return {
        favoritos,
        loading,
        setFavoritos,
        removeFavorito,
        getFavCodigo,
        getFavDescricao,
        attachUser,
        detachUser,
        getUsers,
    };
}
