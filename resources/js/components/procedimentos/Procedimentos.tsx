import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogClose, DialogDescription } from '@radix-ui/react-dialog';
import axios from 'axios';
import { useEffect, useState } from 'react';
import ProcedimentoForm from './ProcedimentoForm';

interface Procedimento {
    id: number;
    nome: string;
    is_public: boolean;
    category?: { id: number; name: string } | string | null;
    notes?: string | null;
    codigos: { id: number; codigo: string; descricao_longa: string }[];
}

function Procedimentos() {
    const [search, setSearch] = useState('');
    const [data, setData] = useState<Procedimento[]>([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpenId, setEditOpenId] = useState<number | null>(null);

    const fetchData = async (query = '') => {
        const res = await axios.get('/api/procedimentos', { params: { search: query } });
        setData(res.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const id = setTimeout(() => {
            fetchData(search);
        }, 300);
        return () => clearTimeout(id);
    }, [search]);

    // Agrupar por categoria
    const grupos = data.reduce((acc: Record<string, Procedimento[]>, proc) => {
        const cat = (typeof proc.category === 'object' ? proc.category?.name : proc.category) ?? 'Sem categoria';
        (acc[cat] ??= []).push(proc);
        return acc;
    }, {});

    const categorias = Object.keys(grupos).sort((a, b) => {
        if (a === 'Sem categoria') return 1;
        if (b === 'Sem categoria') return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="p-4">
            <h1 className="mb-4 text-xl font-bold">Procedimentos Clínicos</h1>

            {/* Criar novo */}
            <div className="mb-3 flex justify-end">
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="create">
                            Novo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Adicionar Procedimento</DialogTitle>
                        <DialogDescription>Preencha os campos abaixo para adicionar um novo procedimento.</DialogDescription>
                        <ProcedimentoForm onSaved={(novo) => setData((prev) => [...prev, novo])} onClose={() => setCreateOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Pesquisa */}
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="mb-4 w-full rounded border px-2 py-1 text-sm"
            />

            {/* Dentro do return, onde lista os grupos */}
            {categorias.map((cat) => (
                <section key={cat} className="mb-6">
                    <h2 className="mb-2 text-sm font-semibold text-gray-600">{cat}</h2>

                    {/* Grid de 3 colunas */}
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {grupos[cat].map((proc) => (
                            <li
                                key={proc.id}
                                className="flex flex-col gap-1 rounded border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                            >
                                <div className="flex items-start justify-between">
                                    <h2 className="font-semibold">{proc.nome}</h2>
                                    <div className="flex items-center gap-2">
                                        <Dialog open={editOpenId === proc.id} onOpenChange={(v) => setEditOpenId(v ? proc.id : null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="edit">
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle>Editar Procedimento</DialogTitle>
                                                <DialogDescription>Preencha os campos abaixo para editar um procedimento.</DialogDescription>
                                                <ProcedimentoForm
                                                    initial={{
                                                        id: proc.id,
                                                        nome: proc.nome,
                                                        is_public: proc.is_public,
                                                        codigos: proc.codigos.map((c) => c.id),
                                                        category_id: typeof proc.category === 'object' ? proc.category?.id : null,
                                                        notes: proc.notes ?? null,
                                                    }}
                                                    onSaved={(updated) => setData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
                                                    onClose={() => setEditOpenId(null)}
                                                />
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="delete" className="px-3 py-1 text-sm">
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle>Apagar procedimento</DialogTitle>
                                                <DialogDescription>
                                                    Tem a certeza que deseja apagar o procedimento "{proc.nome}"? Esta ação não pode ser desfeita.
                                                </DialogDescription>

                                                <DialogFooter className="mt-4 gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">Cancelar</Button>
                                                    </DialogClose>
                                                    <Button
                                                        variant="delete"
                                                        onClick={async () => {
                                                            try {
                                                                await axios.delete(`/api/procedimentos/${proc.id}`);
                                                                setData((prev) => prev.filter((p) => p.id !== proc.id));
                                                            } catch (err) {
                                                                alert('Erro ao apagar procedimento');
                                                            }
                                                        }}
                                                    >
                                                        Confirmar
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>

                                {/* Notas */}
                                {proc.notes && <p className="text-xs text-gray-500">{proc.notes}</p>}

                                {/* Códigos inline */}
                                <div className="flex flex-wrap gap-1">
                                    {proc.codigos.map((c) => (
                                        <span
                                            key={c.id}
                                            className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                            title={c.descricao_longa}
                                        >
                                            {c.codigo}
                                        </span>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

export default Procedimentos;
