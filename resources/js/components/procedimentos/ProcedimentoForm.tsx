import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

interface Category {
  id: number;
  name: string;
}

interface ProcedimentoFormProps {
  onSaved?: (data: any) => void;
  onClose?: () => void;
  initial?: {
    id?: number;
    nome?: string;
    is_public?: boolean;
    codigos?: number[];
    category_id?: number | null;
    notes?: string | null;
  };
}

function ProcedimentoForm({ onSaved, onClose, initial }: ProcedimentoFormProps) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [codigos, setCodigos] = useState<number[]>(initial?.codigos ?? []);
  const [todosCodigos, setTodosCodigos] = useState<
    { id: number; codigo: string; descricao_longa: string }[]
  >([]);

  const [filter, setFilter] = useState('');
  const [is_public, setIs_public] = useState(initial?.is_public ?? false);

  const [categoryId, setCategoryId] = useState<number | null>(
    initial?.category_id ?? null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [specialties, setSpecialties] = useState<{ id: number; name: string }[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(null);
  const [additionalSpecialtyIds, setAdditionalSpecialtyIds] = useState<number[]>([]);
  const [notes, setNotes] = useState<string | null>(initial?.notes ?? null);
  const [loading, setLoading] = useState(false);

  // fetch categories list
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axios.get('/api/categories', {
          params: { kind: 'procedimentos' },
        });
        setCategories(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      } catch {
        // silencioso
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

  // garante que a categoria inicial apareça no select
  useEffect(() => {
    if (!initial?.category_id) return;

    setCategoryId(initial.category_id);

    (async () => {
      try {
        const res = await axios.get(`/api/categories/${initial.category_id}`);
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? res.data;

        if (data && data.id) {
          setCategories((prev) => {
            if (prev.some((c) => c.id === data.id)) return prev;
            return [...prev, { id: data.id, name: data.name }];
          });
        }
      } catch {
        // ignora
      }
    })();
  }, [initial]);

  // debounce simples
  const useDebounce = <T,>(value: T, delay = 200) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const id = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
  };
  const debouncedFilter = useDebounce(filter, 300);

  useEffect(() => {
    const controller = new AbortController();

    const doFetch = async () => {
      try {
        setLoading(true);
        const q = debouncedFilter.trim();
        if (q.length >= 1) {
          const res = await axios.get(`/api/icd10pcs/search?q=${q}`, {
            signal: controller.signal,
          });
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.data ?? [];
          setTodosCodigos(data);
        }
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        toast.error('Erro ao buscar códigos');
      } finally {
        setLoading(false);
      }
    };

    doFetch();
    return () => controller.abort();
  }, [debouncedFilter]);

  // filtered list for display
  const filteredCodigos = todosCodigos.filter((c) => {
    const q = debouncedFilter.trim().toLowerCase();
    if (!q) return true;
    const tokens = q.split(/\s+/).filter(Boolean);
    return tokens.every((t) => c.codigo.toLowerCase().includes(t) || c.descricao_longa.toLowerCase().includes(t));
  });

  // Multi-select dropdown state
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const toggleCodigo = (id: number): void => {
    setCodigos((prev: number[]) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  // Handle category creation
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const res = await axios.post('/api/categories', {
        name: newCategoryName.trim(),
        kind: 'procedimentos',
        specialty_id: selectedSpecialtyId ?? null,
      });
      const newCategory = res.data?.data ?? res.data;
      
      setCategories((prev) => [...prev, newCategory]);
      setCategoryId(newCategory.id);
      setNewCategoryName('');
      setSelectedSpecialtyId(null);
      setShowCategoryModal(false);
      toast.success('Categoria criada com sucesso!');
    } catch {
      toast.error('Erro ao criar categoria');
    }
  };

  // Preload codes on mount so the dropdown has items
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/icd10pcs');
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (initial?.id) {
        const res = await axios.put<{ data: any }>(
          `/api/procedimentos/${initial.id}`,
          { nome, is_public, codigos, category_id: categoryId, specialty_ids: additionalSpecialtyIds, notes }
        );
        toast.success('Procedimento atualizado!');
        const saved = res.data?.data ?? res.data;
        onSaved?.(saved);
        Promise.resolve().then(() => onClose?.());
      } else {
        const res = await axios.post<{ data: any }>(`/api/procedimentos`, {
          nome,
          is_public,
          codigos,
          category_id: categoryId,
          specialty_ids: additionalSpecialtyIds,
          notes,
        });
        toast.success('Procedimento adicionado!');
        const saved = res.data?.data ?? res.data;
        onSaved?.(saved);
        Promise.resolve().then(() => onClose?.());
        setNome('');
        setCodigos([]);
        setCategoryId(null);
        setAdditionalSpecialtyIds([]);
        setNotes(null);
      }
    } catch {
      toast.error('Erro ao salvar procedimento');
    }
  };


  return (
    <>
      <form onSubmit={handleSubmit} className="mb-6 rounded border p-4 shadow">
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do procedimento"
        className="mb-4 w-full rounded border p-2"
        required
      />

      <label className="mb-2 block font-medium">Categoria (opcional)</label>
      <select
        value={categoryId !== null ? String(categoryId) : ''}
        onChange={(e) =>
          setCategoryId(e.target.value ? parseInt(e.target.value, 10) : null)
        }
        className="mb-4 w-full rounded border p-2"
      >
        <option value="">-- Nenhuma --</option>
        {categories.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          className="rounded bg-blue-500 px-3 py-2 text-white"
          onClick={() => setShowCategoryModal(true)}
        >
          Criar categoria
        </button>
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

      <textarea
        value={notes ?? ''}
        onChange={(e) => setNotes(e.target.value || null)}
        placeholder="Notas (opcional)"
        className="mb-4 w-full rounded border p-2"
        rows={4}
      />

      <label className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={is_public}
          onChange={(e) => setIs_public(e.target.checked)}
        />
        Público
      </label>

      {/* Código picker: chips, search, dropdown */}
      <div ref={containerRef} className="mb-4 relative">
        <label className="mb-2 block font-medium">Códigos (ICD)</label>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          {codigos.length === 0 ? (
            <div className="text-sm text-gray-500">Nenhum código selecionado</div>
          ) : (
            codigos.map((id) => {
              const c = todosCodigos.find((t) => t.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-sm">
                  <strong>{c?.codigo ?? id}</strong>
                  <button type="button" onClick={() => toggleCodigo(id)} className="text-red-500">❌</button>
                </span>
              );
            })
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar códigos (ex: A00, descrição...)"
            className="w-full rounded border p-2"
            onFocus={() => setOpen(true)}
          />
          <button type="button" onClick={() => setOpen((v) => !v)} className="rounded bg-gray-200 px-3 py-2">
            {open ? 'Fechar' : 'Abrir'}
          </button>
        </div>

        {open && (
          <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded border bg-white shadow">
            {loading ? (
              <div className="p-2 text-sm text-gray-600">Carregando...</div>
            ) : filteredCodigos.length === 0 ? (
              <div className="p-2 text-sm text-gray-600">Nenhum código encontrado</div>
            ) : (
              <ul className="p-1">
                {filteredCodigos.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded p-2 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={codigos.includes(c.id)} onChange={() => toggleCodigo(c.id)} />
                      <div>
                        <div className="font-medium">{c.codigo}</div>
                        <div className="text-sm text-gray-600">{c.descricao_longa}</div>
                      </div>
                    </div>
                    <div>{codigos.includes(c.id) ? <span className="text-sm text-green-600">Selecionado</span> : null}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded bg-green-500 px-4 py-2 text-white"
        >
          Salvar
        </button>
        {loading && <span className="ml-2 text-sm text-gray-500">Carregando...</span>}
      </div>
    </form>

    {/* Modal para criar categoria */}
    {showCategoryModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-medium">Criar Nova Categoria</h3>
          
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Nome da Categoria</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Digite o nome da categoria"
              className="w-full rounded border p-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateCategory();
                }
                if (e.key === 'Escape') {
                  setShowCategoryModal(false);
                }
              }}
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Especialidade (opcional)</label>
            <select
              value={selectedSpecialtyId ?? ''}
              onChange={(e) => setSelectedSpecialtyId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full rounded border p-2"
            >
              <option value="">-- Nenhuma --</option>
              {specialties.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCategoryModal(false);
                setNewCategoryName('');
              }}
              className="rounded bg-gray-300 px-4 py-2 text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateCategory}
              className="rounded bg-blue-500 px-4 py-2 text-white"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default ProcedimentoForm;
