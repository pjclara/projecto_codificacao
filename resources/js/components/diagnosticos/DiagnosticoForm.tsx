import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';

interface Category {
  id: number;
  name: string;
  specialty?: { id: number; name: string } | null;
}

interface Codigo {
  id: number;
  codigo: string;
  descricao_longa: string;
}

interface DiagnosticoFormProps {
  onSaved?: (data: any) => void;
  onClose?: () => void;
  initial?: {
    id?: number;
    nome?: string;
    is_public?: boolean;
    codigo?: { id: number; codigo?: string } | null;
    category_id?: number | null;
    notes?: string | null;
  };
}

function DiagnosticoForm({ onSaved, onClose, initial }: DiagnosticoFormProps) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [codigoId, setCodigoId] = useState<number | null>(initial?.codigo?.id ?? null);
  const [todosCodigos, setTodosCodigos] = useState<Codigo[]>([]);

  const [filter, setFilter] = useState('');
  const [is_public, setIs_public] = useState(initial?.is_public ?? false);

  const [categoryId, setCategoryId] = useState<number | null>(initial?.category_id ?? null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [specialties, setSpecialties] = useState<{ id: number; name: string }[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(null);
  const [additionalSpecialtyIds, setAdditionalSpecialtyIds] = useState<number[]>([]);
  const [notes, setNotes] = useState<string | null>(initial?.notes ?? null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Array<{ nome: string; codigo_id: number | null; category_id: number | null; specialty_ids: number[]; is_public: boolean; notes?: string | null }>>([]);

  // fetch categories list
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axios.get('/api/categories', { params: { kind: 'diagnosticos' } });
        setCategories(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      } catch {
        // silent
      }
    };
    fetchCats();
  }, []);

  // fetch specialties for category creation
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/specialties');
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data ?? [];
        setSpecialties(data);
      } catch {
        // ignore
      }
    })();
  }, []);

  // ensure initial category appears
  useEffect(() => {
    if (!initial?.category_id) return;
    setCategoryId(initial.category_id);
    (async () => {
      try {
        const res = await axios.get(`/api/categories/${initial.category_id}`);
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data;
        if (data && data.id) {
          setCategories((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, { id: data.id, name: data.name }]));
        }
      } catch {
        // ignore
      }
    })();
  }, [initial]);

  // debounce helper
  const useDebounce = <T,>(value: T, delay = 200) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const id = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
  };
  const debouncedFilter = useDebounce(filter, 300);

  // fetch ICD codes (ICD-10-CMS) for the diagnósticos
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const q = debouncedFilter.trim();
        const params: any = {};
        if (q) params.q = q;
        const res = await axios.get('/api/icd10cms/search', { params, signal: controller.signal });
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setTodosCodigos(data);
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        toast.error('Erro ao buscar códigos');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [debouncedFilter]);

  // preload codes on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/icd10cms');
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setTodosCodigos(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ensure initial codigo object present
  useEffect(() => {
    if (initial?.codigo) {
      setTodosCodigos((prev) => [initial.codigo as Codigo, ...prev.filter((p) => p.id !== (initial.codigo as Codigo).id)]);
      setCodigoId(initial.codigo.id);
    }
  }, [initial]);

  const toggleCodigo = (id: number) => {
    // single-select: if already selected, unset; otherwise set
    setCodigoId((prev) => (prev === id ? null : id));
  };

  // create category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }
    try {
      const res = await axios.post('/api/categories', { name: newCategoryName.trim(), kind: 'diagnosticos', specialty_id: selectedSpecialtyId });
      const newCategory = res.data?.data ?? res.data;
      setCategories((prev) => [...prev, newCategory]);
      setCategoryId(newCategory.id);
      // keep the specialty selection in the form consistent with the created category
      setSelectedSpecialtyId(newCategory?.specialty?.id ?? null);
      setNewCategoryName('');
      setShowCategoryModal(false);
      toast.success('Categoria criada com sucesso!');
    } catch {
      toast.error('Erro ao criar categoria');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (initial?.id) {
        const res = await axios.put(`/api/diagnosticos/${initial.id}`, { nome, is_public, codigo_id: codigoId, category_id: categoryId, specialty_ids: additionalSpecialtyIds, notes });
        toast.success('Diagnóstico atualizado!');
        const saved = res.data?.data ?? res.data;
        onSaved?.(saved);
        Promise.resolve().then(() => onClose?.());
      } else {
        // If there are pending diagnostics queued, create them all (and include current form if it has a name)
        const toCreate = [...pending];
        if (nome.trim()) toCreate.push({ nome: nome.trim(), is_public, codigo_id: codigoId, category_id: categoryId, specialty_ids: additionalSpecialtyIds, notes });

        if (toCreate.length === 0) {
          toast.error('Preencha o diagnóstico antes de salvar ou adicione à lista.');
          return;
        }

        const created: any[] = [];
        setLoading(true);
        for (const item of toCreate) {
          try {
            const res = await axios.post('/api/diagnosticos', { nome: item.nome, is_public: item.is_public, codigo_id: item.codigo_id, category_id: item.category_id, specialty_ids: item.specialty_ids, notes: item.notes });
            const saved = res.data?.data ?? res.data;
            created.push(saved);
          } catch (err) {
            // continue creating others but capture error
            toast.error(`Erro ao criar diagnóstico "${item.nome}"`);
          }
        }
        setLoading(false);
        if (created.length > 0) {
          toast.success(`Criado(s) ${created.length} diagnóstico(s)!`);
          onSaved?.(created.length === 1 ? created[0] : created);
          // clear form and pending list
          setNome('');
          setCodigoId(null);
          setCategoryId(null);
          setAdditionalSpecialtyIds([]);
          setNotes(null);
          setPending([]);
          Promise.resolve().then(() => onClose?.());
        }
      }
    } catch {
      toast.error('Erro ao salvar diagnóstico');
    }
  };

  const addToPending = () => {
    if (!nome.trim()) {
      toast.error('Nome do diagnóstico é obrigatório para adicionar à lista');
      return;
    }
    setPending((p) => [...p, { nome: nome.trim(), codigo_id: codigoId, category_id: categoryId, specialty_ids: additionalSpecialtyIds, is_public, notes }]);
    // clear current form for next entry but keep specialty selection
    setNome('');
    setCodigoId(null);
    setCategoryId(null);
    setAdditionalSpecialtyIds([]);
    setNotes(null);
    toast.success('Diagnóstico adicionado à fila');
  };

  const removePending = (index: number) => {
    setPending((p) => p.filter((_, i) => i !== index));
  };

  // filtered list for display
  const filteredCodigos = todosCodigos.filter((c) => {
    const q = debouncedFilter.trim().toLowerCase();
    if (!q) return true;
    const tokens = q.split(/\s+/).filter(Boolean);
    // guard against incomplete objects (some items may only have an id)
    const codigoText = (c?.codigo ?? '').toLowerCase();
    const descricaoText = (c?.descricao_longa ?? '').toLowerCase();
    return tokens.every((t) => codigoText.includes(t) || descricaoText.includes(t));
  });

  // dropdown state
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-6 rounded border p-4 shadow">
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do diagnóstico" className="mb-4 w-full rounded border p-2" required />

        <label className="mb-2 block font-medium">Especialidade (opcional)</label>
        <select value={selectedSpecialtyId ?? ''} onChange={(e) => {
          const val = e.target.value ? parseInt(e.target.value, 10) : null;
          setSelectedSpecialtyId(val);
          // if a category is selected but doesn't belong to the chosen specialty, clear it
          if (categoryId !== null) {
            const cur = categories.find((c) => c.id === categoryId);
            if (cur && (cur.specialty?.id ?? null) !== val) setCategoryId(null);
          }
        }} className="mb-2 w-full rounded border p-2">
          <option value="">-- Todas --</option>
          {specialties.map((s) => (<option key={s.id} value={String(s.id)}>{s.name}</option>))}
        </select>

        <label className="mb-2 block font-medium">Categoria (opcional)</label>
        {(() => {
          const filteredCategories = categories.filter((c) => selectedSpecialtyId ? (c.specialty?.id ?? null) === selectedSpecialtyId : true);
          return (
            <select value={categoryId !== null ? String(categoryId) : ''} onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value, 10) : null)} className="mb-4 w-full rounded border p-2">
              <option value="">-- Nenhuma --</option>
              {/* If the selected category is not yet present in the categories list (fetch pending), render a temporary option so the select shows a value */}
              {categoryId !== null && !categories.some((c) => c.id === categoryId) ? (
                <option value={String(categoryId)}>{`Categoria #${categoryId}`}</option>
              ) : null}
              {filteredCategories.map((c) => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
            </select>
          );
        })()}

        <div className="mb-4 flex items-center gap-2">
          <button type="button" className="rounded bg-blue-500 px-3 py-2 text-white" onClick={() => setShowCategoryModal(true)}>Criar categoria</button>
        </div>

        <label className="mb-2 block font-medium">Especialidades Adicionais (opcional)</label>
        <div className="mb-4 flex flex-wrap gap-2 border rounded p-2 min-h-10 bg-gray-50">
          {additionalSpecialtyIds.length === 0 ? (
            <span className="text-sm text-gray-500">Nenhuma especialidade selecionada</span>
          ) : (
            additionalSpecialtyIds.map(id => {
              const spec = specialties.find(s => s.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-2 rounded bg-blue-100 px-2 py-1 text-sm">
                  {spec?.name ?? `Especialidade #${id}`}
                  <button 
                    type="button" 
                    onClick={() => setAdditionalSpecialtyIds(prev => prev.filter(s => s !== id))}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </span>
              );
            })
          )}
        </div>

        <select 
          value="" 
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!additionalSpecialtyIds.includes(val)) {
              setAdditionalSpecialtyIds(prev => [...prev, val]);
            }
          }}
          className="mb-4 w-full rounded border p-2"
        >
          <option value="">+ Adicionar especialidade</option>
          {specialties
            .filter(s => !additionalSpecialtyIds.includes(s.id))
            .map((s) => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))
          }
        </select>

        <textarea value={notes ?? ''} onChange={(e) => setNotes(e.target.value || null)} placeholder="Notas (opcional)" className="mb-4 w-full rounded border p-2" rows={4} />

        <label className="mb-4 flex items-center gap-2">
          <input type="checkbox" checked={is_public} onChange={(e) => setIs_public(e.target.checked)} />
          Público
        </label>

        <div ref={containerRef} className="mb-4 relative">
          <label className="mb-2 block font-medium">Código (ICD)</label>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            {codigoId === null ? (
              <div className="text-sm text-gray-500">Nenhum código selecionado</div>
            ) : (
              (() => {
                const c = todosCodigos.find((t) => t.id === codigoId);
                return (
                  <span
                    key={codigoId}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.preventDefault();
                        setCodigoId(null);
                      }
                      if (e.key === 'Enter') {
                        // trap Enter to toggle as click
                        e.preventDefault();
                        setCodigoId(null);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring"
                  >
                    <strong>{c?.codigo ?? codigoId}</strong>
                    <button type="button" onClick={() => setCodigoId(null)} className="text-red-500">❌</button>
                  </span>
                );
              })()
            )}
          </div>

          <div className="flex gap-2">
            <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar códigos (ex: A00, descrição...)" className="w-full rounded border p-2" onFocus={() => setOpen(true)} />
            <button type="button" onClick={() => setOpen((v) => !v)} className="rounded bg-gray-200 px-3 py-2">{open ? 'Fechar' : 'Abrir'}</button>
          </div>

          {open && (
            <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded border bg-white shadow">
              {loading ? (<div className="p-2 text-sm text-gray-600">Carregando...</div>) : filteredCodigos.length === 0 ? (<div className="p-2 text-sm text-gray-600">Nenhum código encontrado</div>) : (
                <ul className="p-1">
                  {filteredCodigos.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded p-2 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={codigoId === c.id} onChange={() => toggleCodigo(c.id)} />
                        <div>
                          <div className="font-medium">{c.codigo}</div>
                          <div className="text-sm text-gray-600">{c.descricao_longa}</div>
                        </div>
                      </div>
                      <div>{codigoId === c.id ? <span className="text-sm text-green-600">Selecionado</span> : null}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={addToPending} className="rounded bg-indigo-500 px-4 py-2 text-white">Adicionar à fila</button>
          <button type="submit" className="rounded bg-green-500 px-4 py-2 text-white">Salvar</button>
          {loading && <span className="ml-2 text-sm text-gray-500">Carregando...</span>}
        </div>
      </form>

      {/* Lista de diagnósticos pendentes */}
      {pending.length > 0 && (
        <div className="mb-6 rounded border p-3">
          <h4 className="mb-2 font-semibold">Diagnósticos na fila ({pending.length})</h4>
          <ul className="space-y-2">
            {pending.map((d, idx) => (
              <li key={idx} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="font-medium">{d.nome}</div>
                  <div className="text-xs text-gray-600">Código: {d.codigo_id ?? '—'} • Categoria: {d.category_id ?? '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => removePending(idx)} className="text-sm text-red-500">Remover</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal para criar categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-medium">Criar Nova Categoria</h3>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Nome da Categoria</label>
              <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Digite o nome da categoria" className="w-full rounded border p-2" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } if (e.key === 'Escape') { setShowCategoryModal(false); } }} />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Especialidade (opcional)</label>
              <select value={selectedSpecialtyId ?? ''} onChange={(e) => setSelectedSpecialtyId(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full rounded border p-2">
                <option value="">-- Nenhuma --</option>
                {specialties.map((s) => (<option key={s.id} value={String(s.id)}>{s.name}</option>))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowCategoryModal(false); setNewCategoryName(''); }} className="rounded bg-gray-300 px-4 py-2 text-gray-700">Cancelar</button>
              <button type="button" onClick={handleCreateCategory} className="rounded bg-blue-500 px-4 py-2 text-white">Criar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DiagnosticoForm;
