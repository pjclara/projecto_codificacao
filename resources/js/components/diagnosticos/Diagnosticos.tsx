import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogClose, DialogDescription } from '@radix-ui/react-dialog';
import axios from 'axios';
import { useEffect, useState } from 'react';
import DiagnosticoForm from './DiagnosticoForm';

interface Diagnostico {
    id: number;
    nome: string;
    is_public: boolean;
    category?: { id: number; name: string } | string | null;
    notes?: string | null;
    codigos: { id: number; codigo: string; descricao_longa: string }[];
    codigo?: { id: number; codigo: string; descricao_longa: string } | null;
}

function Diagnosticos() {
    const [search, setSearch] = useState('');
    const [data, setData] = useState<Diagnostico[]>([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpenId, setEditOpenId] = useState<number | null>(null);

    const fetchData = async (query = '') => {
        const res = await axios.get('/api/diagnosticos', { params: { search: query } });
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

    // Agrupar por especialidade -> categoria
    type Nested = Record<string, Record<string, Diagnostico[]>>;
    const nested: Nested = data.reduce((acc, proc) => {
        // determine category name
        const categoryObj = typeof proc.category === 'object' ? proc.category : null;
        const categoryName = (categoryObj?.name ?? (typeof proc.category === 'string' ? proc.category : null)) ?? 'Sem categoria';

        // determine specialty name (via category.specialty.name when available)
        const specialtyName = (categoryObj && (categoryObj as any).specialty && (categoryObj as any).specialty.name) ? (categoryObj as any).specialty.name : 'Sem especialidade';

        acc[specialtyName] ??= {};
        acc[specialtyName][categoryName] ??= [];
        acc[specialtyName][categoryName].push(proc);
        return acc;
    }, {} as Nested);

    const specialtyKeys = Object.keys(nested).sort((a, b) => {
        if (a === 'Sem especialidade') return 1;
        if (b === 'Sem especialidade') return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="p-4">
            <h1 className="mb-4 text-xl font-bold">Diagnósticos Clínicos</h1>

            {/* Criar novo */}
            <div className="mb-3 flex justify-end">
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="create">Novo</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Adicionar Diagnóstico</DialogTitle>
                        <DialogDescription>Preencha os campos abaixo para adicionar um novo diagnóstico.</DialogDescription>
                        <DiagnosticoForm onSaved={(novo) => { setData((prev) => [...prev, novo]); }} onClose={() => setCreateOpen(false)} />
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

            {/* Agrupado por especialidade -> categorias (grid de 2 colunas por categoria) */}
            {specialtyKeys.map((spec: string) => (
                <section key={spec} className="mb-6">
                    <h2 className="mb-2 text-base font-bold text-gray-700">{spec}</h2>

                    {/* categorias dentro da especialidade */}
                    {Object.keys(nested[spec]).sort((a, b) => {
                        if (a === 'Sem categoria') return 1;
                        if (b === 'Sem categoria') return -1;
                        return a.localeCompare(b);
                    }).map((cat: string) => {
                        return (
                            <div key={cat} className="mb-4">
                                <h3 className="mb-2 text-sm font-semibold text-gray-600">{cat}</h3>
                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                                    {nested[spec][cat].map((proc: Diagnostico) => {
                                        return (
                                            <li key={proc.id} className="flex flex-col gap-1 rounded border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                                                <div className="flex items-start justify-between">
                                                    <h2 className="font-semibold">{proc.nome}</h2>
                                                    <div className="flex items-center gap-2">
                                                        <Dialog open={editOpenId === proc.id} onOpenChange={(v) => setEditOpenId(v ? proc.id : null)}>
                                                            <DialogTrigger asChild>
                                                                <Button variant="edit" />
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogTitle>Editar Diagnóstico</DialogTitle>
                                                                <DialogDescription>Preencha os campos abaixo para editar um diagnóstico.</DialogDescription>
                                                                <DiagnosticoForm
                                                                    initial={{
                                                                        id: proc.id,
                                                                        nome: proc.nome,
                                                                        is_public: proc.is_public,
                                                                        codigo: proc.codigo ? { id: proc.codigo.id, codigo: proc.codigo.codigo } : null,
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
                                                                <Button variant="delete" className="px-3 py-1 text-sm" />
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogTitle>Apagar Diagnóstico</DialogTitle>
                                                                <DialogDescription>
                                                                    Tem a certeza que deseja apagar o diagnóstico "{proc.nome}"? Esta ação não pode ser desfeita.
                                                                </DialogDescription>

                                                                <DialogFooter className="mt-4 gap-2">
                                                                    <DialogClose asChild>
                                                                        <Button variant="secondary">Cancelar</Button>
                                                                    </DialogClose>
                                                                    <Button
                                                                        variant="delete"
                                                                        onClick={async () => {
                                                                            try {
                                                                                await axios.delete(`/api/diagnosticos/${proc.id}`);
                                                                                setData((prev) => prev.filter((p) => p.id !== proc.id));
                                                                            } catch (err) {
                                                                                alert('Erro ao apagar diagnóstico');
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

                                                {/* Códigos inline (chips) */}
                                                <div className="flex flex-wrap gap-1">
                                                    {(
                                                        proc.codigos && proc.codigos.length
                                                            ? proc.codigos
                                                            : proc.codigo
                                                                ? [proc.codigo]
                                                                : []
                                                    ).map((c: any) => (
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
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </section>
            ))}
        </div>
    );
}

export default Diagnosticos;


